import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatStepper } from '@angular/material/stepper';
import { MatSnackBar } from '@angular/material/snack-bar';
import * as QRCode from 'qrcode';

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

  constructor(
    private formBuilder: FormBuilder,
    private snackBar: MatSnackBar
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

  nextStep(): void {
    if (this.stepper.selectedIndex === 0 && this.cpfFormGroup.valid) {
      this.stepper.next();
    } else if (this.stepper.selectedIndex === 1 && this.paymentMethodFormGroup.valid) {
      this.generatePaymentContent();
      this.stepper.next();
    }
  }

  previousStep(): void {
    this.stepper.previous();
  }

  selectPaymentMethod(method: string): void {
    this.selectedPaymentMethod = method;
    this.paymentMethodFormGroup.patchValue({ paymentMethod: method });
  }

  private async generatePaymentContent(): Promise<void> {
    if (this.selectedPaymentMethod === 'pix') {
      await this.generateQRCode();
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

  private showSnackBar(message: string): void {
    this.snackBar.open(message, 'Fechar', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom'
    });
  }
}
