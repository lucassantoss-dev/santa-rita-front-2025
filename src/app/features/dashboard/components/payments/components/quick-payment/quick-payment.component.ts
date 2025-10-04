import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { PaymentService } from '../../../../../../core/payment.service';
import { ClientService } from '../../../../../../core/client.service';
import { ActivityService } from '../../../../../../core/activity.service';
import { PopupService } from '../../../../../../shared/popup/popup.service';
import ClientInterface from '../../../../../../utils/client/clientInterface';

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
      descricao: ['', Validators.required]
    });
  }

  loadClients(): void {
    this.clientService.getAllClients().subscribe({
      next: (response) => {
        this.clients = response.data;
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
      }

      console.log('Dados do pagamento recorrente:', paymentData);

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
