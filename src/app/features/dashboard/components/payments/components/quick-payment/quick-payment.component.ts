import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PaymentService } from '../../../../../../core/payment.service';
import { ClientService } from '../../../../../../core/client.service';
import { ActivityService } from '../../../../../../core/activity.service';
import { PopupService } from '../../../../../../shared/popup/popup.service';
import ClientInterface from '../../../../../../utils/client/clientInterface';
import { PaymentData } from '../../../../../../utils/payment/paymentInterface';

export interface QuickPaymentData {
  clientId?: string;
}

@Component({
  selector: 'app-quick-payment',
  templateUrl: './quick-payment.component.html',
  styleUrls: ['./quick-payment.component.scss']
})
export class QuickPaymentComponent implements OnInit {
  quickPaymentForm!: FormGroup;
  isLoading = false;
  clients: ClientInterface[] = [];
  pendingPayments: PaymentData[] = [];
  loadingPendingPayments = false;

  tipoRecebimentoOptions = [
    { value: 'online', label: 'Online' },
    { value: 'manual', label: 'Manual' }
  ];

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private clientService: ClientService,
    private activityService: ActivityService,
    private popupService: PopupService,
    public dialogRef: MatDialogRef<QuickPaymentComponent>,
    @Inject(MAT_DIALOG_DATA) public data: QuickPaymentData
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadClients();
  }

  initForm(): void {
    this.quickPaymentForm = this.fb.group({
      clientId: [this.data?.clientId || '', Validators.required],
      valor: [0, [Validators.required, Validators.min(0.01)]],
      diaVencimento: [1, [Validators.required, Validators.min(1), Validators.max(31)]],
      descricao: ['', Validators.required],
      tipoRecebimento: ['online', Validators.required]
    });

    // Observar mudanças na seleção do cliente
    this.quickPaymentForm.get('clientId')?.valueChanges.subscribe(clientId => {
      if (clientId) {
        this.onClientChange(clientId);
      }
    });
  }

  loadClients(): void {
    this.clientService.getAllClients(1, 1000).subscribe({ // Carregar muitos clientes para dropdown
      next: (response) => {
        this.clients = response.data.clients;
      },
      error: (error) => {
        console.error('Erro ao carregar clientes:', error);
        this.popupService.showErrorMessage('Erro ao carregar lista de clientes');
      }
    });
  }

  getClientDisplay(client: ClientInterface): string {
    return `${client.nome} - Quadra ${client.quadra}, Nº ${client.numero}`;
  }

  onClientChange(clientId: string): void {
    const selectedClient = this.clients.find(c => c._id === clientId);

    if (selectedClient) {
      // Buscar pagamentos pendentes para o cliente selecionado
      this.searchPendingPayments(selectedClient.cpf);

      // Auto-preencher descrição padrão
      this.quickPaymentForm.patchValue({
        descricao: `Mensalidade - ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
      });
    }
  }

  // Buscar pagamentos pendentes por CPF do cliente
  private searchPendingPayments(cpf: string): void {
    if (!cpf) return;

    // Remove formatação do CPF
    const cleanCpf = cpf.replace(/\D/g, '');

    this.loadingPendingPayments = true;
    this.pendingPayments = [];

    this.paymentService.getBoletosByCpf(cleanCpf).subscribe({
      next: (response) => {
        this.pendingPayments = response.data;
        this.loadingPendingPayments = false;

        // Se houver pagamentos pendentes, preencher com os dados do primeiro
        if (this.pendingPayments.length > 0) {
          const pendingPayment = this.pendingPayments[0];

          this.quickPaymentForm.patchValue({
            valor: pendingPayment.valor,
            descricao: `Pagamento pendente - ${pendingPayment.responsavel}`
          });

          this.popupService.showSuccessMessage(
            `Encontrado ${this.pendingPayments.length} pagamento(s) pendente(s) para este cliente.`
          );
        }
      },
      error: (error) => {
        this.loadingPendingPayments = false;
        console.error('Erro ao buscar pagamentos pendentes:', error);
        // Não mostrar erro se não encontrar pagamentos, isso é normal
      }
    });
  }

  onSubmit(): void {
    if (this.quickPaymentForm.valid && !this.isLoading) {
      this.isLoading = true;

      const formData = this.quickPaymentForm.value;
      const selectedClient = this.clients.find(c => c._id === formData.clientId);

      if (!selectedClient) {
        this.popupService.showErrorMessage('Cliente não encontrado');
        this.isLoading = false;
        return;
      }
      const paymentData = {
        valor: formData.valor,
        diaVencimento: formData.diaVencimento,
        descricao: formData.descricao,
        tipoRecebimento: formData.tipoRecebimento
      }

      this.paymentService.createRecurringPayment(selectedClient._id as string, paymentData).subscribe({
        next: (response) => {
          const paymentInfo = `${selectedClient.nome} - R$ ${formData.valor}`;

          this.activityService.addPaymentActivity('create', paymentInfo, response._id);

          this.popupService.showSuccessMessage('Pagamento criado com sucesso!');
          this.dialogRef.close(true);
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erro ao criar pagamento:', error);
          this.popupService.showErrorMessage('Erro ao criar pagamento');
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  private markFormGroupTouched(): void {
    Object.keys(this.quickPaymentForm.controls).forEach(key => {
      const control = this.quickPaymentForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.quickPaymentForm.get(fieldName);
    if (field?.touched && field?.errors) {
      if (field.errors['required']) {
        return 'Este campo é obrigatório';
      }
      if (field.errors['min']) {
        return 'Valor deve ser maior que zero';
      }
      if (field.errors['max']) {
        return 'Dia deve ser entre 1 e 31';
      }
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.quickPaymentForm.get(fieldName);
    return !!(field?.touched && field?.errors);
  }
}
