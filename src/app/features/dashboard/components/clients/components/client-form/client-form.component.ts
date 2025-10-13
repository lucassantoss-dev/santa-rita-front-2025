import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Location } from '@angular/common';
import { ClientService } from '../../../../../../core/client.service';
import { PopupService } from '../../../../../../shared/popup/popup.service';
import { ActivityService } from '../../../../../../core/activity.service';
import { DashboardService } from '../../../../../../core/dashboard.service';
import { ActivatedRoute } from '@angular/router';
import ClientApiInterface from '../../../../../../utils/client/clientApiInterface';
import ClientObjectInterface from '../../../../../../utils/client/clientObjectInterface';

@Component({
  selector: 'app-client-form',
  templateUrl: './client-form.component.html',
  styleUrl: './client-form.component.scss'
})
export class ClientFormComponent implements OnInit {
  clientForm!: FormGroup;
  id!: string | null;
  edit: boolean = false;
  quadras = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'];
  tipos = [
    'Canteiro',
    'Túmulo 1 Gaveta',
    'Túmulo 2 Gaveta',
    'Túmulo 3 Gaveta',
    'Túmulo 4 Gaveta'
  ];
  estados = [
    { sigla: 'AC', nome: 'Acre' },
    { sigla: 'AL', nome: 'Alagoas' },
    { sigla: 'AP', nome: 'Amapá' },
    { sigla: 'AM', nome: 'Amazonas' },
    { sigla: 'BA', nome: 'Bahia' },
    { sigla: 'CE', nome: 'Ceará' },
    { sigla: 'DF', nome: 'Distrito Federal' },
    { sigla: 'ES', nome: 'Espírito Santo' },
    { sigla: 'GO', nome: 'Goiás' },
    { sigla: 'MA', nome: 'Maranhão' },
    { sigla: 'MT', nome: 'Mato Grosso' },
    { sigla: 'MS', nome: 'Mato Grosso do Sul' },
    { sigla: 'MG', nome: 'Minas Gerais' },
    { sigla: 'PA', nome: 'Pará' },
    { sigla: 'PB', nome: 'Paraíba' },
    { sigla: 'PR', nome: 'Paraná' },
    { sigla: 'PE', nome: 'Pernambuco' },
    { sigla: 'PI', nome: 'Piauí' },
    { sigla: 'RJ', nome: 'Rio de Janeiro' },
    { sigla: 'RN', nome: 'Rio Grande do Norte' },
    { sigla: 'RS', nome: 'Rio Grande do Sul' },
    { sigla: 'RO', nome: 'Rondônia' },
    { sigla: 'RR', nome: 'Roraima' },
    { sigla: 'SC', nome: 'Santa Catarina' },
    { sigla: 'SP', nome: 'São Paulo' },
    { sigla: 'SE', nome: 'Sergipe' },
    { sigla: 'TO', nome: 'Tocantins' }
  ];
  loadingCep = false;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private location: Location,
    private clientService: ClientService,
    private popupService: PopupService,
    private activityService: ActivityService,
    private dashboardService: DashboardService,
    private router: ActivatedRoute,
  ) {
    this.id = this.router.snapshot.paramMap.get('id');
  }

  ngOnInit(): void {
    this.initializeForm();
    if (this.id) {
      this.edit = true;
      this.getClientById(this.id);
    }
  }

  getClientById(id: string) {
    this.clientService.getClientById(id).subscribe({
      next: (data: ClientObjectInterface) => {
        this.clientForm.patchValue({
          quadra: data.data.quadra,
          numero: data.data.numero,
          complemento: data.data.complemento,
          tipo: data.data.tipo,
          nome: data.data.nome,
          cpf: data.data.cpf,
          rua: data.data.endereco,
          numeroRua: data.data.numeroRua,
          bairro: data.data.bairro,
          cidade: data.data.cidade,
          estado: data.data.estado,
          contato: data.data.contato,
          numeroEndereco: data.data.numeroEndereco,
          sobrenome: data.data.sobrenome,
          email: data.data.email,
          cep: data.data.cep,
        })
      }, error: (err: Error) => {
        this.popupService.showErrorMessage('Erro ao carregar dados do cliente. ' + err.message);
      }
    })
  }

  buscarCep() {
    const cepValue = this.clientForm.get('cep')?.value;
    const cep = cepValue?.replace(/\D/g, '');
    if (cep && cep.length === 8) {
      this.loadingCep = true;
      this.http.get<any>(`/viacep/ws/${cep}/json/`).subscribe({
        next: (data) => {
          if (!data.erro) {
            this.clientForm.patchValue({
              rua: data.logradouro,
              bairro: data.bairro,
              cidade: data.localidade,
              estado: data.uf
            });
          }
          this.loadingCep = false;
        },
        error: (err) => {
          this.loadingCep = false;
        }
      });
    } else {
      this.popupService.showErrorMessage('CEP inválido ou incompleto');
    }
  }

  onSubmit() {
    if (this.clientForm.valid) {
      const formValue = this.clientForm.value;
      const payload = {
        quadra: formValue.quadra,
        numero: formValue.numero,
        complemento: formValue.complemento,
        tipo: formValue.tipo,
        nome: formValue.nome,
        cpf: formValue.cpf,
        endereco: formValue.rua,
        numeroRua: formValue.numeroRua,
        bairro: formValue.bairro,
        cidade: formValue.cidade,
        estado: formValue.estado,
        contato: formValue.contato,
        numeroEndereco: formValue.numeroEndereco,
        sobrenome: formValue.sobrenome,
        email: formValue.email,
        cep: formValue.cep,
        situacao: "Ativo"
      }
      this.clientService.createClient(payload).subscribe({
        next: (response) => {
          // Adicionar atividade ao dashboard usando o novo ActivityService
          this.activityService.addClientActivity('create', payload.nome, response._id);

          // Atualizar estatísticas incrementando o total de clientes
          this.dashboardService.updateStats({
            totalClients: undefined, // Será recalculado automaticamente
            newClientsThisMonth: undefined // Será recalculado automaticamente
          });

          this.popupService.showSuccessMessage('Cliente cadastrado com sucesso!');
          this.location.back();
        },
        error: (error: Error) => {
          this.popupService.showErrorMessage('Erro ao cadastrar cliente. Tente novamente. ' + error.message);
        }
      });
    } else {
      this.clientForm.markAllAsTouched();
    }
  }

  onCancel(): void {
    this.location.back();
  }

  private initializeForm() {
    this.clientForm = this.fb.group({
      quadra: ['', Validators.required],
      complemento: ['', Validators.required],
      numero: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      tipo: ['', Validators.required],
      nome: ['', Validators.required],
      sobrenome: ['', Validators.required],
      cpf: ['', Validators.required],
      cep: ['', Validators.required],
      rua: ['', Validators.required],
      numeroEndereco: ['', [Validators.required, Validators.pattern('^[0-9]+$')]],
      cidade: ['', Validators.required],
      bairro: ['', Validators.required],
      estado: ['', Validators.required],
      contato: ['', Validators.required],
      email: ['', [Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]]
    });
  }
}
