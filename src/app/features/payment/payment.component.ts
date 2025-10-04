import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PaymentService } from '../../core/payment.service';
import { ClientService } from '../../core/client.service';
import { PaymentData } from '../../utils/payment/paymentInterface';
import ClientInterface from '../../utils/client/clientInterface';
import * as QRCode from 'qrcode';
import { PaymentApiInterface } from '../../utils/payment/paymentApiInterface';
import ClientApiInterface from '../../utils/client/clientApiInterface';

@Component({
  selector: 'app-payment',
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss'
})
export class PaymentComponent implements OnInit {
  @ViewChild('stepper') stepper!: MatStepper;

  cpfFormGroup!: FormGroup;
  paymentMethodFormGroup!: FormGroup;

  selectedPaymentMethod: string = '';
  qrCodeSvg: string = '';
  pixCode: string = '';
  boletoCode: string = '';
  pendingPayments: PaymentData[] = [];
  loadingPayments: boolean = false;
  hasSearchedPayments: boolean = false;
  clientData: ClientInterface | null = null;
  loadingClient: boolean = false;
  processingPayment: boolean = false;
  paymentResponse: any = null;

  constructor(
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar,
    private paymentService: PaymentService,
    private clientService: ClientService
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.generatePixCode();
    this.generateBoletoCode();
  }

  private initializeForms(): void {
    this.cpfFormGroup = this.formBuilder.group({
      cpf: ['', [Validators.required, this.cpfValidator]]
    });

    this.paymentMethodFormGroup = this.formBuilder.group({
      paymentMethod: ['', Validators.required]
    });

    // Observar mudanças no CPF para buscar pagamentos pendentes
    this.cpfFormGroup.get('cpf')?.valueChanges.subscribe(cpf => {
      this.onCpfChange(cpf);
    });
  }

  // Validador de CPF
  private cpfValidator(control: any) {
    const cpf = control.value?.replace(/\D/g, '');
    if (!cpf || cpf.length !== 11) {
      return { invalidCpf: true };
    }

    // Validação básica de CPF (não aceita números repetidos)
    if (/^(\d)\1{10}$/.test(cpf)) {
      return { invalidCpf: true };
    }

    // Algoritmo de validação do CPF
    let sum = 0;
    for (let i = 0; i < 9; i++) {
      sum += parseInt(cpf.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(9))) return { invalidCpf: true };

    sum = 0;
    for (let i = 0; i < 10; i++) {
      sum += parseInt(cpf.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cpf.charAt(10))) return { invalidCpf: true };

    return null;
  }

  // Método chamado quando o CPF muda
  private onCpfChange(cpf: string): void {
    // Reset do estado
    this.pendingPayments = [];
    this.hasSearchedPayments = false;

    if (!cpf) return;

    // Remove formatação do CPF
    const cleanCpf = cpf.replace(/\D/g, '');
    
    // Só busca se CPF tem 11 dígitos e é válido
    if (cleanCpf.length === 11 && !this.cpfValidator({ value: cpf })) {
      this.searchPendingPayments(cleanCpf);
    }
  }

  // Buscar pagamentos pendentes
  private searchPendingPayments(cpf: string): void {
    this.loadingPayments = true;
    
    this.paymentService.getBoletosByCpf(cpf).subscribe({
      next: (payments: PaymentApiInterface) => {
        this.pendingPayments = payments.data;
        this.hasSearchedPayments = true;
        this.loadingPayments = false;
        
        if (payments.data.length > 0) {
          this.showSnackBar(`Encontrados ${payments.data.length} pagamento(s) pendente(s)`);
        } else {
          this.showSnackBar('Nenhum pagamento pendente encontrado');
        }
      },
      error: (error) => {
        this.loadingPayments = false;
        this.hasSearchedPayments = true;
        console.error('Erro ao buscar pagamentos:', error);
        this.showSnackBar('Erro ao buscar pagamentos pendentes');
      }
    });
  }

  nextStep(): void {
    if (this.stepper.selectedIndex === 0 && this.cpfFormGroup.valid) {
      // Buscar dados do cliente ao entrar na etapa de pagamento
      this.getClientData();
      this.stepper.next();
    } else if (this.stepper.selectedIndex === 1 && this.paymentMethodFormGroup.valid) {
      this.processPayment();
    }
  }

  previousStep(): void {
    this.stepper.previous();
  }

  selectPaymentMethod(method: string): void {
    this.selectedPaymentMethod = method;
    this.paymentMethodFormGroup.patchValue({ paymentMethod: method });
    
    // Buscar dados do cliente se ainda não temos
    if (!this.clientData) {
      this.getClientData();
    }
  }

  private processPayment(): void {
    if (!this.clientData) {
      this.showSnackBar('Erro: Dados do cliente não encontrados');
      return;
    }

    this.processingPayment = true;
    
    const paymentData = this.buildPaymentData();
    
    if (this.selectedPaymentMethod === 'pix') {
      this.createPixPayment(paymentData);
    } else if (this.selectedPaymentMethod === 'boleto') {
      this.createBoletoPayment(paymentData);
    }
  }

  private generatePixCode(): void {
    // Simula um código PIX real
    this.pixCode = '00020126580014BR.GOV.BCB.PIX013612345678901234567890000000062540504120.005303986540512.005802BR5925CEMITERIO SANTA RITA LTDA6014BELO HORIZONTE6207050062630412';
  }

  private generateBoletoCode(): void {
    // Simula um código de barras de boleto
    this.boletoCode = '34191.79001 01043.510047 91020.150008 1 84300000012000';
  }

  private async generateQRCode(): Promise<void> {
    try {
      this.qrCodeSvg = await QRCode.toString(this.pixCode, {
        type: 'svg',
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      this.showSnackBar('Erro ao gerar QR Code');
    }
  }

  copyPixCode(): void {
    navigator.clipboard.writeText(this.pixCode).then(() => {
      this.showSnackBar('Código PIX copiado!');
    }).catch(() => {
      this.showSnackBar('Erro ao copiar código');
    });
  }

  downloadBoleto(): void {
    // Simula o download do boleto
    const link = document.createElement('a');
    link.href = 'data:text/plain;charset=utf-8,Boleto%20Cemiterio%20Santa%20Rita';
    link.download = 'boleto-cemiterio-santa-rita.pdf';
    link.click();
    this.showSnackBar('Download iniciado!');
  }

  getExpirationTime(): string {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30); // PIX expira em 30 minutos
    return now.toLocaleString('pt-BR');
  }

  getBoletoExpirationDate(): string {
    const now = new Date();
    now.setDate(now.getDate() + 3); // Boleto vence em 3 dias
    return now.toLocaleDateString('pt-BR');
  }

  finishPayment(): void {
    if (this.selectedPaymentMethod === 'pix') {
      this.showSnackBar('Aguardando confirmação do pagamento PIX...');
      // Aqui você implementaria a lógica para verificar o status do pagamento
    } else if (this.selectedPaymentMethod === 'card') {
      this.showSnackBar('Processando pagamento no cartão...');
      // Aqui você implementaria a integração com gateway de pagamento
    } else if (this.selectedPaymentMethod === 'boleto') {
      this.showSnackBar('Boleto gerado com sucesso!');
    }
  }

  // Buscar dados do cliente por ID
  private getClientData(): void {
    if (this.loadingClient || this.clientData) return;

    // Buscar socio_id dos pagamentos pendentes ou usar CPF como fallback
    let clientId = '';
    
    if (this.pendingPayments.length > 0 && this.pendingPayments[0].socio_id) {
      clientId = this.pendingPayments[0].socio_id;
      console.log('Buscando cliente por socio_id:', clientId);
    } else {
      const cpf = this.cpfFormGroup.get('cpf')?.value;
      if (!cpf) return;
      clientId = cpf.replace(/\D/g, ''); // Remove formatação do CPF como fallback
      console.log('Buscando cliente por CPF (fallback):', clientId);
    }
    
    this.loadingClient = true;
    
    this.clientService.getClientById(clientId).subscribe({
      next: (client: ClientApiInterface) => {
        this.clientData = Array.isArray(client.data) ? client.data[0] : client.data;
        this.loadingClient = false;
        console.log('Dados do cliente carregados:', client);
      },
      error: (error) => {
        this.loadingClient = false;
        this.showSnackBar('Cliente não encontrado. Você pode continuar com o pagamento.');
      }
    });
  }

  // Construir dados do pagamento baseado no cliente
  private buildPaymentData(): any {
    if (!this.clientData) return null;

    const [firstName, ...lastNameParts] = this.clientData.nome.split(' ');
    const lastName = lastNameParts.join(' ') || 'Silva';

    const basePayment = {
      amount: 120.00,
      description: "Mensalidade do plano",
      payer: {
        email: this.clientData.email || 'cliente@email.com',
        first_name: firstName || 'Cliente',
        last_name: lastName,
        identification: {
          type: "CPF",
          number: this.clientData.cpf
        }
      }
    };

    // Para boleto, adicionar endereço
    if (this.selectedPaymentMethod === 'boleto') {
      return {
        ...basePayment,
        payer: {
          ...basePayment.payer,
          address: {
            zip_code: this.clientData.cep?.replace(/\D/g, '') || "00000000",
            street_name: this.clientData.endereco || "Rua Exemplo",
            street_number: this.clientData.numeroRua || "123",
            neighborhood: "Centro",
            city: "São Paulo",
            federal_unit: "SP"
          }
        }
      };
    }

    return basePayment;
  }

  // Criar pagamento PIX
  private createPixPayment(paymentData: any): void {
    this.paymentService.createPixPayment(paymentData).subscribe({
      next: (response) => {
        this.paymentResponse = response;
        this.processingPayment = false;
        
        // Se a resposta contém o QR code, usar ele
        if (response.qr_code) {
          this.pixCode = response.qr_code;
          this.generateQRCode();
        }
        
        this.stepper.next();
        this.showSnackBar('Pagamento PIX criado com sucesso!');
      },
      error: (error) => {
        this.processingPayment = false;
        console.error('Erro ao criar pagamento PIX:', error);
        this.showSnackBar('Erro ao criar pagamento PIX. Tente novamente.');
      }
    });
  }

  // Criar pagamento Boleto
  private createBoletoPayment(paymentData: any): void {
    this.paymentService.createBoletoPayment(paymentData).subscribe({
      next: (response) => {
        this.paymentResponse = response;
        this.processingPayment = false;
        
        // Se a resposta contém o código do boleto, usar ele
        if (response.external_reference || response.id) {
          this.boletoCode = response.external_reference || response.id.toString();
        }
        
        this.stepper.next();
        this.showSnackBar('Boleto criado com sucesso!');
      },
      error: (error) => {
        this.processingPayment = false;
        console.error('Erro ao criar boleto:', error);
        this.showSnackBar('Erro ao criar boleto. Tente novamente.');
      }
    });
  }

  private showSnackBar(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}
