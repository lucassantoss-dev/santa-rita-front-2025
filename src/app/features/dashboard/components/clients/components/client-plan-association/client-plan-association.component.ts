import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ClientService } from '../../../../../../core/client.service';
import { PaymentService } from '../../../../../../core/payment.service';
import { PopupService } from '../../../../../../shared/popup/popup.service';
import ClientInterface from '../../../../../../utils/client/clientInterface';
import { PaymentPlan, PaymentPlanCreate } from '../../../../../../utils/payment/paymentInterface';
import { PaymentPlanApiInterface } from '../../../../../../utils/payment/paymentApiInterface';

export interface ClientPlanAssociationData {
  clientId?: string;
  planId?: string;
}

export interface ClientPlanAssociationResult {
  clientId: string;
  planId: string;
  clientName: string;
  planName: string;
}

@Component({
  selector: 'app-client-plan-association',
  templateUrl: './client-plan-association.component.html',
  styleUrls: ['./client-plan-association.component.scss']
})
export class ClientPlanAssociationComponent implements OnInit {
  associationForm!: FormGroup;
  isLoading = false;
  clients: ClientInterface[] = [];
  paymentPlans: PaymentPlan[] = [];
  selectedClient: ClientInterface | null = null;
  selectedPlan: PaymentPlan | null = null;

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private paymentService: PaymentService,
    private popupService: PopupService,
    public dialogRef: MatDialogRef<ClientPlanAssociationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ClientPlanAssociationData
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadClients();
    this.loadPaymentPlans();

    if (this.data) {
      this.populateForm();
    }
  }

  initForm(): void {
    this.associationForm = this.fb.group({
      clientId: ['', Validators.required],
      planId: ['', Validators.required]
    });

    // Observar mudanças nos selects
    this.associationForm.get('clientId')?.valueChanges.subscribe(clientId => {
      this.selectedClient = this.clients.find(client => client._id === clientId) || null;
    });

    this.associationForm.get('planId')?.valueChanges.subscribe(planId => {
      this.selectedPlan = this.paymentPlans.find(plan => plan._id === planId) || null;
    });
  }

  populateForm(): void {
    if (this.data.clientId) {
      this.associationForm.patchValue({ clientId: this.data.clientId });
    }
    if (this.data.planId) {
      this.associationForm.patchValue({ planId: this.data.planId });
    }
  }

  loadClients(): void {
    this.clientService.getAllClients().subscribe({
      next: (response) => {
        this.clients = response.data || [];
      },
      error: (error) => {
        console.error('Erro ao carregar clientes:', error);
        this.popupService.showErrorMessage('Erro ao carregar lista de clientes.');
      }
    });
  }

  loadPaymentPlans(): void {
    this.paymentService.getPaymentPlans().subscribe({
      next: (response: PaymentPlanApiInterface) => {
        // Mapear PaymentPlanCreate[] para PaymentPlan[] adicionando as propriedades necessárias
        this.paymentPlans = response.data.map(planCreate => ({
          _id: planCreate._id || planCreate.id,
          name: planCreate.name,
          description: planCreate.description,
          amount: planCreate.amount,
          installments: this.getInstallmentsFromInterval(planCreate.interval),
          frequency: this.getFrequencyFromInterval(planCreate.interval),
          active: true // Assumimos que todos os planos retornados estão ativos
        }));
        console.log('Planos carregados:', this.paymentPlans);
      },
      error: (error) => {
        console.error('Erro ao carregar planos:', error);
        this.popupService.showErrorMessage('Erro ao carregar planos de pagamento.');
      }
    });
  }

  // Converter interval para installments
  private getInstallmentsFromInterval(interval: string): number {
    switch (interval) {
      case 'month': return 12;
      case 'quarter': return 4;
      case 'year': return 1;
      default: return 12;
    }
  }

  // Converter interval para frequency
  private getFrequencyFromInterval(interval: string): 'mensal' | 'bimestral' | 'trimestral' | 'anual' {
    switch (interval) {
      case 'month': return 'mensal';
      case 'quarter': return 'trimestral';
      case 'year': return 'anual';
      default: return 'mensal';
    }
  }

  onSubmit(): void {
    if (this.associationForm.valid && this.selectedClient && this.selectedPlan) {
      const result: ClientPlanAssociationResult = {
        clientId: this.associationForm.value.clientId,
        planId: this.associationForm.value.planId,
        clientName: this.selectedClient.nome,
        planName: this.selectedPlan.name
      };

      this.dialogRef.close(result);
    } else {
      this.markFormGroupTouched();
      this.popupService.showErrorMessage('Por favor, selecione um cliente e um plano.');
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.associationForm.controls).forEach(key => {
      const control = this.associationForm.get(key);
      control?.markAsTouched();
    });
  }

  getClientDisplay(client: ClientInterface): string {
    return `${client.nome} - Quadra ${client.quadra}, Nº ${client.numero}`;
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  get clientId() { return this.associationForm.get('clientId'); }
  get planId() { return this.associationForm.get('planId'); }
}
