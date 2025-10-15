import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { PaymentData, PaymentPlan, PaymentPlanCreate } from '../../../../../../utils/payment/paymentInterface';
import { PaymentService } from '../../../../../../core/payment.service';
import { ClientService } from '../../../../../../core/client.service';
import { ActivityService } from '../../../../../../core/activity.service';
import { PopupService } from '../../../../../../shared/popup/popup.service';
import ClientInterface from '../../../../../../utils/client/clientInterface';
import { PaymentPlanApiInterface } from '../../../../../../utils/payment/paymentApiInterface';
import { Location } from '@angular/common';

@Component({
  selector: 'app-payment-form',
  templateUrl: './payment-form.component.html',
  styleUrls: ['./payment-form.component.scss']
})
export class PaymentFormComponent implements OnInit {
  @Input() payment: PaymentData | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  paymentForm!: FormGroup;
  isLoading = false;
  clients: ClientInterface[] = [];
  paymentPlans: PaymentPlanCreate[] = [];
  pendingPayments: PaymentData[] = [];
  loadingPendingPayments = false;

  paymentTypes = [
    { value: 'avulso', label: 'Pagamento Avulso' },
    { value: 'plano', label: 'Plano de Pagamento' }
  ];

  paymentMethods = [
    { value: 'pix', label: 'PIX' },
    { value: 'boleto', label: 'Boleto' }
  ];

  constructor(
    private fb: FormBuilder,
    private paymentService: PaymentService,
    private clientService: ClientService,
    private activityService: ActivityService,
    private popupService: PopupService,
    private location: Location
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadClients();
    this.loadPaymentPlans();

    if (this.payment) {
      this.populateForm();
    }
  }

  initForm(): void {
    // Obter a data atual no formato YYYY-MM-DD
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];

    this.paymentForm = this.fb.group({
      clientId: ['', Validators.required],
      paymentType: ['avulso', Validators.required],
      paymentMethod: ['pix', Validators.required],
      planType: [''],
      description: ['', Validators.required],
      valor: [0, [Validators.required, Validators.min(0.01)]],
      vencimento: [todayString, Validators.required],
      installments: [1],
      currentInstallment: [1]
    });

    // Observar mudanças no tipo de pagamento
    this.paymentForm.get('paymentType')?.valueChanges.subscribe(value => {
      if (value === 'plano') {
        this.paymentForm.get('planType')?.setValidators([Validators.required]);
        this.paymentForm.get('installments')?.setValidators([Validators.required, Validators.min(1)]);
      } else {
        this.paymentForm.get('planType')?.clearValidators();
        this.paymentForm.get('installments')?.clearValidators();
        this.paymentForm.patchValue({
          planType: '',
          installments: 1,
          currentInstallment: 1
        });
      }
      this.paymentForm.get('planType')?.updateValueAndValidity();
      this.paymentForm.get('installments')?.updateValueAndValidity();
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

  loadPaymentPlans(): void {
    this.paymentService.getPaymentPlans().subscribe({
      next: (plans: PaymentPlanApiInterface) => {
        this.paymentPlans = plans.data;
      },
      error: (error) => {
        console.error('Erro ao carregar planos:', error);
      }
    });
  }

  populateForm(): void {
    if (this.payment) {
      const selectedClient = this.clients.find(c => c._id === this.payment!.socio_id);

      // this.paymentForm.patchValue({
      //   clientId: this.payment.socio_id,
      //   paymentType: this.payment.paymentType,
      //   planType: this.payment.planType || '',
      //   description: this.payment.description,
      //   amount: this.payment.amount,
      //   dueDate: new Date(this.payment.dueDate).toISOString().split('T')[0],
      //   installments: this.payment.installments || 1,
      //   currentInstallment: this.payment.currentInstallment || 1
      // });
    }
  }

  onClientChange(): void {
    const clientId = this.paymentForm.get('clientId')?.value;
    const selectedClient = this.clients.find(c => c._id === clientId);

    if (selectedClient && !this.payment) {
      // Buscar pagamentos pendentes para o cliente selecionado
      this.searchPendingPayments(selectedClient.cpf);

      // Auto-preencher descrição padrão para novos pagamentos
      this.paymentForm.patchValue({
        description: `Mensalidade - ${new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`
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

          this.paymentForm.patchValue({
            valor: pendingPayment.valor,
            description: `Pagamento pendente - ${pendingPayment.responsavel}`,
            vencimento: this.formatISOToDateInput(pendingPayment.vencimento)
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

  onPlanChange(): void {
    const planType = this.paymentForm.get('planType')?.value;
    const selectedPlan = this.paymentPlans.find(p => p.name === planType);

    if (selectedPlan) {
      this.paymentForm.patchValue({
        amount: selectedPlan.amount,
        description: selectedPlan.description
      });
    }
  }

  getClientDisplay(client: ClientInterface): string {
    return `${client.nome} - Quadra ${client.quadra}, Nº ${client.numero}`;
  }

  onSubmit(): void {
    if (this.paymentForm.valid && !this.isLoading) {
      this.isLoading = true;

      const formData = this.paymentForm.value;
      const selectedClient = this.clients.find(c => c._id === formData.clientId);

      if (!selectedClient) {
        this.popupService.showErrorMessage('Cliente não encontrado');
        this.isLoading = false;
        return;
      }

      // Se for um pagamento existente, usar a API original
      if (this.payment) {
        const paymentData: Partial<PaymentData> = {
          valor: formData.valor,
          responsavel: selectedClient.nome || '',
          quadra: selectedClient.quadra || '',
          numero: selectedClient.numero || '',
          bairro: selectedClient.bairro || '',
          endereco: selectedClient.endereco || '',
          cidade: selectedClient.cidade || '',
          titular: selectedClient.nome || '',
          estado: selectedClient.estado || '',
          contato: selectedClient.contato || '',
          vencimento: this.formatDateToISO(formData.vencimento),
          socio_id: formData.clientId,
          status: 'pending'
        };

        this.paymentService.updatePayment(this.payment._id, paymentData).subscribe({
          next: (response) => {
            this.activityService.addPaymentActivity('update', `${selectedClient.nome} - R$ ${formData.valor}`, response._id);
            this.popupService.showSuccessMessage('Pagamento atualizado com sucesso!');
            this.saved.emit();
            this.isLoading = false;
            this.location.back();
          },
          error: (error) => {
            console.error('Erro ao atualizar pagamento:', error);
            this.popupService.showErrorMessage('Erro ao atualizar pagamento');
            this.isLoading = false;
          }
        });
        return;
      }

      // Para novos pagamentos, usar as APIs do MercadoPago
      const mercadoPagoData: any = {
        amount: formData.valor,
        description: formData.description,
        payer: {
          email: selectedClient.email || 'cliente@email.com',
          first_name: selectedClient.nome.split(' ')[0] || 'Nome',
          last_name: selectedClient.sobrenome || selectedClient.nome.split(' ').slice(1).join(' ') || 'Sobrenome',
          identification: {
            type: 'CPF',
            number: selectedClient.cpf || '000.000.000-00'
          }
        }
      };

      // Adicionar dados do endereço para boleto
      if (formData.paymentMethod === 'boleto') {
        mercadoPagoData.payer.address = {
          zip_code: selectedClient.cep || '00000000',
          street_name: selectedClient.endereco || 'Endereço não informado',
          street_number: selectedClient.numeroEndereco || selectedClient.numeroRua || '0',
          neighborhood: selectedClient.bairro || 'Bairro não informado',
          city: selectedClient.cidade || 'Cidade não informada',
          federal_unit: selectedClient.estado || 'SP'
        };
      }

      const paymentOperation = formData.paymentMethod === 'pix'
        ? this.paymentService.createPixPayment(mercadoPagoData)
        : this.paymentService.createBoletoPayment(mercadoPagoData);

      paymentOperation.subscribe({
        next: (response) => {
          const paymentInfo = `${selectedClient.nome} - R$ ${formData.valor} (${formData.paymentMethod.toUpperCase()})`;
          this.activityService.addPaymentActivity('create', paymentInfo, response.id || response._id);

          this.popupService.showSuccessMessage(
            `Pagamento ${formData.paymentMethod.toUpperCase()} criado com sucesso!`
          );
          this.saved.emit();
          this.isLoading = false;
          this.location.back();
        },
        error: (error) => {
          console.error('Erro ao criar pagamento:', error);
          this.popupService.showErrorMessage(`Erro ao criar pagamento ${formData.paymentMethod.toUpperCase()}`);
          this.isLoading = false;
        }
      });
    } else {
      this.markFormGroupTouched();
    }
  }

  onCancel(): void {
    this.location.back();
  }

  private markFormGroupTouched(): void {
    Object.keys(this.paymentForm.controls).forEach(key => {
      const control = this.paymentForm.get(key);
      control?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.paymentForm.get(fieldName);
    if (field?.touched && field?.errors) {
      if (field.errors['required']) {
        return 'Este campo é obrigatório';
      }
      if (field.errors['min']) {
        return 'Valor deve ser maior que zero';
      }
    }
    return '';
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.paymentForm.get(fieldName);
    return !!(field?.touched && field?.errors);
  }

  private formatDateToISO(dateString: string): string {
    if (!dateString) return '';

    // Cria uma data no formato YYYY-MM-DD e converte para ISO com horário 00:00:00.000Z
    const date = new Date(dateString + 'T00:00:00.000Z');
    return date.toISOString();
  }

  private formatISOToDateInput(isoString: string): string {
    if (!isoString) return '';

    // Converte de ISO para o formato YYYY-MM-DD esperado pelo input type="date"
    return new Date(isoString).toISOString().split('T')[0];
  }
}
