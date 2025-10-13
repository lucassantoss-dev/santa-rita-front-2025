// Exemplo de uso do componente Plan
// Adicione este código ao payment-form.component.ts ou onde você quiser usar o componente plan

import { PlanComponent } from '../plan/plan.component';
import { PaymentPlanCreate } from '../../../../../../utils/payment/paymentInterface';
import { PaymentService } from '../../../../../../core/payment.service';
import { PopupService } from '../../../../../../shared/popup/popup.service';
import { Location } from '@angular/common';

export class ExampleUsage {
  showPlanForm = false;

  constructor(
    private paymentService: PaymentService,
    private popupService: PopupService,
  ) {}

  // Método para abrir o formulário de criação de plano
  openPlanForm(): void {
    this.showPlanForm = true;
  }

  // Método chamado quando um plano é criado
  onPlanCreated(planData: PaymentPlanCreate): void {
    // Aqui você pode fazer a chamada para o seu service
    this.paymentService.createPaymentPlan(planData).subscribe({
      next: (response: any) => {
        this.showPlanForm = false;
        // Recarregar a lista de planos se necessário
        this.reloadPlans();
      },
      error: (error: any) => {
        console.error('Erro ao criar plano:', error);
      }
    });
  }

  // Método chamado quando o usuário cancela a criação
  onPlanFormCancelled(): void {
    this.showPlanForm = false;
  }

  // Método auxiliar para recarregar planos (implemente conforme necessário)
  private reloadPlans(): void {
    // Implementar conforme sua lógica de negócio
    this.popupService.showSuccessMessage('Lista de planos recarregada com sucesso!');
  }
}

/*
  Para usar no template HTML, adicione:

  <!-- Botão para criar novo plano -->
  <button mat-raised-button color="primary" (click)="openPlanForm()">
    <mat-icon>add</mat-icon>
    Criar Novo Plano
  </button>

  <!-- Componente plan (modal ou seção) -->
  <div *ngIf="showPlanForm" class="plan-modal-overlay">
    <app-plan
      [editMode]="false"
      (planCreated)="onPlanCreated($event)"
      (cancelled)="onPlanFormCancelled()">
    </app-plan>
  </div>

  Exemplo de payload que será gerado:
  {
    "name": "Plano Mensal",
    "amount": 2500,
    "currency": "brl",
    "interval": "month",
    "description": "Assinatura mensal do cemitério",
    "metadata": {
      "tipo": "mensalidade"
    }
  }
*/
