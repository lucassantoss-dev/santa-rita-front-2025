import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Location } from '@angular/common';
import { ClientService } from '../../../../../../core/client.service';
import { PopupService } from '../../../../../../shared/popup/popup.service';
import { ActivityService } from '../../../../../../core/activity.service';
import { DashboardService } from '../../../../../../core/dashboard.service';

@Component({
  selector: 'app-client-form',
  templateUrl: './client-form.component.html',
  styleUrl: './client-form.component.scss'
})
export class ClientFormComponent implements OnInit {
  clientForm!: FormGroup;
  quadras = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];
  tipos = [
    'Canteiro',
    'Túmulo 1 Gaveta',
    'Túmulo 2 Gaveta',
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
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
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
      console.log('CEP inválido ou incompleto:', cep);
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
      email: ['', [Validators.required, Validators.email, Validators.pattern(/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/)]]
    });
  }
}
