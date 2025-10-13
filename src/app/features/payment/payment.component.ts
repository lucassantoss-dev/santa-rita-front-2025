import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { MatSnackBar } from '@angular/material/snack-bar';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { PaymentService } from '../../core/payment.service';
import { ClientService } from '../../core/client.service';
import { PaymentData } from '../../utils/payment/paymentInterface';
import ClientInterface from '../../utils/client/clientInterface';
import * as QRCode from 'qrcode';
import { PaymentApiInterface } from '../../utils/payment/paymentApiInterface';
import ClientApiInterface from '../../utils/client/clientApiInterface';
import ClientObjectInterface from '../../utils/client/clientObjectInterface';

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
  qrCodeSvg: SafeHtml = '';
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
    private clientService: ClientService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.initializeForms();
    this.generatePixCode(); // Habilitar para gerar código PIX de teste
    this.generateQRCode(); // Gerar QR Code de teste
    // this.generateBoletoCode();
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

    const paymentData = this.pendingPayments;
    if (paymentData.length === 0) {
      if (this.selectedPaymentMethod === 'pix') {
        this.createPixPayment(paymentData);
      } else if (this.selectedPaymentMethod === 'boleto') {
        this.createBoletoPayment(paymentData);
      }
    } else {
      if (this.selectedPaymentMethod === 'pix') {
        this.pixCode = paymentData[0].paymentDetails?.payload.qr_code || '';
        this.generateQRCode();
        this.stepper.next();
      } else if (this.selectedPaymentMethod === 'boleto') {
        console.log('paymentData', paymentData);
        const boleto = paymentData.find(p => p.paymentDetails?.type === 'boleto');
        console.log('boleto', boleto);
        this.boletoCode = boleto?.paymentDetails?.payload.barcode || '';
        this.stepper.next();
      }
    }
  }

  private generatePixCode(): void {
    // Simula um código PIX real
    this.pixCode = '00020126580014BR.GOV.BCB.PIX013612345678901234567890000000062540504120.005303986540512.005802BR5925CEMITERIO SANTA RITA LTDA6014BELO HORIZONTE6207050062630412';
  }

  private async generateQRCode(): Promise<void> {
    try {
      if (!this.pixCode) {
        console.error('Código PIX está vazio ou undefined');
        this.generatePixCode(); // Gerar código mock se estiver vazio
      }

      const svgString = await QRCode.toString(this.pixCode, {
        type: 'svg',
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      this.qrCodeSvg = this.sanitizer.bypassSecurityTrustHtml(svgString);
    } catch (error) {
      console.error('Erro ao gerar QR Code:', error);
      this.showSnackBar('Erro ao gerar QR Code');

      // Tentar gerar com código mock em caso de erro
      this.generatePixCode();
      try {
        const fallbackSvg = await QRCode.toString(this.pixCode, {
          type: 'svg',
          width: 200,
          margin: 2
        });
        this.qrCodeSvg = this.sanitizer.bypassSecurityTrustHtml(fallbackSvg);
      } catch (fallbackError) {
        console.error('Erro no fallback do QR Code:', fallbackError);
        this.qrCodeSvg = '';
      }
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
    // Buscar o boleto nos pagamentos pendentes
    const boleto = this.pendingPayments.find(p => p.paymentDetails?.type === 'boleto');

    if (boleto?.paymentDetails?.payload.external_resource_url) {
      // Usar a URL real do boleto do MercadoPago
      const link = document.createElement('a');
      link.href = boleto.paymentDetails.payload.external_resource_url;
      link.target = '_blank'; // Abrir em nova aba
      link.click();
      this.showSnackBar('Abrindo boleto...');
    } else if (this.paymentResponse?.transaction_details?.external_resource_url) {
      // Se não encontrou nos pendingPayments, tentar na resposta da criação
      const link = document.createElement('a');
      link.href = this.paymentResponse.transaction_details.external_resource_url;
      link.target = '_blank';
      link.click();
      this.showSnackBar('Abrindo boleto...');
    } else {
      // Fallback para simulação
      const link = document.createElement('a');
      link.href = 'data:text/plain;charset=utf-8,Boleto%20Cemiterio%20Santa%20Rita';
      link.download = 'boleto-cemiterio-santa-rita.pdf';
      link.click();
      this.showSnackBar('Download iniciado (simulação)!');
    }
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
    } else {
      const cpf = this.cpfFormGroup.get('cpf')?.value;
      if (!cpf) return;
      clientId = cpf.replace(/\D/g, ''); // Remove formatação do CPF como fallback
    }

    this.loadingClient = true;

    this.clientService.getClientById(clientId).subscribe({
      next: (client: ClientObjectInterface) => {
        this.clientData = Array.isArray(client.data) ? client.data[0] : client.data;
        this.loadingClient = false;
      },
      error: (error) => {
        this.loadingClient = false;
        this.showSnackBar('Cliente não encontrado. Você pode continuar com o pagamento.');
      }
    });
  }

  // Criar pagamento PIX
  private createPixPayment(paymentData: any): void {
    this.paymentService.createPixPayment(paymentData).subscribe({
      next: (response) => {
        this.paymentResponse = response;
        this.processingPayment = false;

        // Se a resposta contém o QR code, usar ele
        if (response.data.point_of_interaction.transaction_data.qr_code) {
          this.pixCode = response.data.point_of_interaction.transaction_data.qr_code;
          this.generateQRCode();
        } else {
          console.warn('QR Code não encontrado na resposta da API, gerando código mock');
          this.generatePixCode();
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
