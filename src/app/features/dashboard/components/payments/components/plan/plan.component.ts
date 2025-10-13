import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, Location } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { PaymentPlanCreate } from '../../../../../../utils/payment/paymentInterface';
import { PaymentService } from '../../../../../../core/payment.service';
import { PopupService } from '../../../../../../shared/popup/popup.service';

@Component({
  selector: 'app-plan',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './plan.component.html',
  styleUrl: './plan.component.scss'
})
export class PlanComponent implements OnInit {
  @Input() editMode: boolean = false;
  @Input() planData: PaymentPlanCreate | null = null;
  @Output() planCreated = new EventEmitter<PaymentPlanCreate>();
  @Output() cancelled = new EventEmitter<void>();

  planForm!: FormGroup;
  isLoading = false;

  intervalOptions = [
    { value: 'month', label: 'Mensalmente' },
    { value: 'quarter', label: 'Trimestralmente' },
    { value: 'year', label: 'Anualmente' }
  ];

  planTypes = [
    { value: 'mensalidade', label: 'Mensalidade' },
    { value: 'manutencao', label: 'Manutenção' },
    { value: 'taxa', label: 'Taxa Especial' },
    { value: 'servico', label: 'Serviço' }
  ];

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private popupService: PopupService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.initForm();
    if (this.planData && this.editMode) {
      this.populateForm();
    }
  }

  initForm(): void {
    this.planForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      id: ['', [Validators.required, Validators.minLength(3)]],
      amount: [0, [Validators.required, Validators.min(0.01)]], // Valor em reais
      currency: ['brl', Validators.required],
      interval: ['month', Validators.required],
      description: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  populateForm(): void {
    if (this.planData) {
      this.planForm.patchValue({
        name: this.planData.name,
        amount: this.planData.amount,
        currency: this.planData.currency,
        interval: this.planData.interval,
        description: this.planData.description,
        id: this.planData.id
      });
    }
  }

  onSubmit(): void {
    if (this.planForm.valid) {
      this.isLoading = true;

      const formValue = this.planForm.value;
      const planPayload: PaymentPlanCreate = {
        name: formValue.name,
        amount: formValue.amount,
        currency: formValue.currency,
        interval: formValue.interval,
        description: formValue.description,
        id: formValue.id
      };

      this.paymentService.createPaymentPlan(planPayload).subscribe({
        next: () => {
          this.isLoading = false;
          this.popupService.showSuccessMessage('Plano criado com sucesso!');
          this.location.back();
          this.resetForm();
        },
        error: (error: any) => {
          this.isLoading = false;
          console.error('Erro ao criar plano:', error);
          this.popupService.showErrorMessage('Erro ao criar plano. Tente novamente.');
        }
      });
    } else {
      this.markFormGroupTouched();
      this.popupService.showErrorMessage('Por favor, preencha todos os campos obrigatórios.');
    }
  }

  onCancel(): void {
    this.cancelled.emit();
    this.resetForm();
  }

  resetForm(): void {
    this.planForm.reset({
      currency: 'brl',
      interval: 'month',
      planType: 'mensalidade'
    });
  }

  private markFormGroupTouched(): void {
    Object.keys(this.planForm.controls).forEach(key => {
      const control = this.planForm.get(key);
      control?.markAsTouched();
    });
  }

  // Getters para facilitar validação no template
  get name() { return this.planForm.get('name'); }
  get id() { return this.planForm.get('id'); }
  get amount() { return this.planForm.get('amount'); }
  get description() { return this.planForm.get('description'); }
  get planType() { return this.planForm.get('planType'); }
  get interval() { return this.planForm.get('interval'); }

  // Método para formatar valor monetário
  formatCurrency(value: number): string {
    if (!value || value === 0) return 'R$ 0,00';

    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
}
