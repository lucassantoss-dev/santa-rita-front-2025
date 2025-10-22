import { Component, OnInit, Inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ClientService } from '../../../../../../core/client.service';
import { PaymentService } from '../../../../../../core/payment.service';
import { PopupService } from '../../../../../../shared/popup/popup.service';
import { LocalStorageService } from '../../../../../../core/local-storage.service';
import { HistoryComponent } from '../history/history.component';
import { ClientObservationsComponent } from '../client-observations/client-observations.component';
import ClientInterface from '../../../../../../utils/client/clientInterface';

interface PaymentRecord {
  year: number;
  months: {
    [key: number]: {
      paid: boolean;
      status?: 'pending' | 'paid' | 'overdue';
      amount?: number;
      paymentDate?: Date;
      paymentId?: string;
      dueDate?: Date;
      isPreContract?: boolean; // Indica se o mês é anterior ao início do contrato
    }
  };
}

@Component({
  selector: 'app-client-payments',
  templateUrl: './client-payments.component.html',
  styleUrl: './client-payments.component.scss'
})
export class ClientPaymentsComponent implements OnInit {
  clientId: string = '';
  client: ClientInterface | null = null;
  paymentRecords: PaymentRecord[] = [];
  loading: boolean = true;
  contractStartDate: Date | null = null; // Data de início do contrato baseada no primeiro pagamento

  monthNames = [
    'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
    'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
  ];

  currentYear = new Date().getFullYear();
  currentMonth = new Date().getMonth() + 1;
  yearsToShow = 9; // Mostra 9 anos (2021 até 2029: atual + 4 anteriores + 4 posteriores)

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private clientService: ClientService,
    private paymentService: PaymentService,
    private popupService: PopupService,
    private localStorageService: LocalStorageService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.clientId = this.route.snapshot.paramMap.get('id') || '';
    if (this.clientId) {
      this.loadClientData();
      this.loadPaymentRecords();
    } else {
      this.popupService.showErrorMessage('ID do cliente não encontrado');
      this.goBack();
    }
  }

  loadClientData(): void {
    this.clientService.getClientById(this.clientId).subscribe({
      next: (response) => {
        this.client = response.data;
      },
      error: (error) => {
        console.error('Erro ao carregar dados do cliente:', error);
        this.popupService.showErrorMessage('Erro ao carregar dados do cliente');
      }
    });
  }

  loadPaymentRecords(): void {
    this.loading = true;

    this.initializePaymentRecords();

    this.paymentService.getPaymentsByClientId(this.clientId).subscribe({
      next: (response) => {
        if (response.data && Array.isArray(response.data)) {
          this.processPaymentData(response.data);
        }
        this.loading = false;
      },
      error: (error) => {
        this.popupService.showErrorMessage('Erro ao carregar histórico de pagamentos');
        this.loading = false;
      }
    });
  }

  createHistory(): void {
    if (!this.client) {
      this.popupService.showErrorMessage('Dados do cliente não carregados');
      return;
    }

    const dialogRef = this.dialog.open(HistoryComponent, {
      width: '650px',
      maxWidth: '90vw',
      disableClose: true,
      data: {
        clientId: this.clientId,
        clientName: `${this.client.nome} ${this.client.sobrenome}`,
        preSelectedClient: {
          _id: this.clientId,
          nome: this.client.nome,
          sobrenome: this.client.sobrenome,
          quadra: this.client.quadra,
          numero: this.client.numero,
          tipo: this.client.tipo
        },
        skipConfirmation: true // Flag para pular o modal de confirmação
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Se retornou true, significa que criou histórico com sucesso
        this.popupService.showSuccessMessage('Histórico criado com sucesso!');
        // Recarregar os dados de pagamento para refletir o novo histórico
        this.loadPaymentRecords();
      }
    });
  }

  openObservationsModal(): void {
    if (!this.client) {
      this.popupService.showErrorMessage('Dados do cliente não carregados');
      return;
    }

    const dialogRef = this.dialog.open(ClientObservationsComponent, {
      width: '800px',
      maxWidth: '90vw',
      maxHeight: '90vh',
      disableClose: false,
      data: {
        client: this.client
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      // Não precisa recarregar nada, as observações são independentes
      console.log('Modal de observações fechado');
    });
  }

  private initializePaymentRecords(): void {
    this.paymentRecords = [];

    // Calcular o range de anos: do 2021 até 2029 (4 anos atrás até 4 anos à frente do atual)
    const startYear = 2021;
    const endYear = this.currentYear + 4; // 2025 + 4 = 2029

    for (let year = startYear; year <= endYear; year++) {
      const months: any = {};

      for (let month = 1; month <= 12; month++) {
        months[month] = { paid: false };
      }

      this.paymentRecords.push({ year, months });
    }
  }

  private processPaymentData(payments: any[]): void {
    // Primeiro, encontrar a data de início do contrato (primeiro pagamento registrado)
    this.findContractStartDate(payments);

    // Processar cada pagamento
    payments.forEach(payment => {
      const year = payment.year;
      const month = payment.month;

      // Encontrar o registro do ano
      const yearRecord = this.paymentRecords.find(record => record.year === year);
      if (yearRecord && yearRecord.months[month]) {
        const isPaid = payment.status === 'paid';
        const dueDate = payment.dueDate ? new Date(payment.dueDate) : null;
        const paymentDate = payment.paymentDate ? new Date(payment.paymentDate) : null;

        yearRecord.months[month] = {
          paid: isPaid,
          status: payment.status,
          amount: payment.amount,
          paymentDate: paymentDate || undefined,
          paymentId: payment._id,
          dueDate: dueDate || undefined,
          isPreContract: false // Será calculado depois
        };
      }
    });

    // Marcar meses pré-contrato após processar todos os pagamentos
    this.markPreContractMonths();
  }

  private findContractStartDate(payments: any[]): void {
    if (payments.length === 0) {
      this.contractStartDate = null;
      return;
    }

    // Ordenar pagamentos por ano e mês para encontrar o primeiro
    const sortedPayments = payments.sort((a, b) => {
      if (a.year !== b.year) {
        return a.year - b.year;
      }
      return a.month - b.month;
    });

    const firstPayment = sortedPayments[0];
    this.contractStartDate = new Date(firstPayment.year, firstPayment.month - 1, 1);
    console.log('Data de início do contrato:', this.contractStartDate);
  }

  private markPreContractMonths(): void {
    if (!this.contractStartDate) {
      // Se não há data de contrato, marcar todos os meses como pré-contrato
      this.paymentRecords.forEach(yearRecord => {
        Object.keys(yearRecord.months).forEach(monthKey => {
          const month = parseInt(monthKey);
          yearRecord.months[month].isPreContract = true;
        });
      });
      return;
    }

    const contractYear = this.contractStartDate.getFullYear();
    const contractMonth = this.contractStartDate.getMonth() + 1;

    this.paymentRecords.forEach(yearRecord => {
      Object.keys(yearRecord.months).forEach(monthKey => {
        const month = parseInt(monthKey);
        const isBeforeContract = (yearRecord.year < contractYear) ||
                                (yearRecord.year === contractYear && month < contractMonth);

        if (isBeforeContract) {
          yearRecord.months[month].isPreContract = true;
        }
      });
    });
  }

  getMonthStatus(year: number, month: number): string {
    const yearRecord = this.paymentRecords.find(record => record.year === year);
    const monthData = yearRecord?.months[month];

    // Se é pré-contrato, mostrar como disabled
    if (monthData?.isPreContract) {
      return 'pre-contract';
    }

    // Se foi pago, sempre mostrar como pago
    if (monthData?.paid) {
      return 'paid';
    }

    // Se tem status pending e está vencido, mostrar como overdue
    if (monthData?.status === 'pending' && monthData.dueDate) {
      const today = new Date();
      const dueDate = new Date(monthData.dueDate);
      if (dueDate < today) {
        return 'overdue';
      }
    }

    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1; // Janeiro = 1

    // Se é um ano futuro, permitir como clicável
    if (year > currentYear) {
      return 'future';
    }

    // Se é um ano passado
    if (year < currentYear) {
      return monthData?.status === 'pending' ? 'overdue' : 'overdue';
    }

    // Se é o ano atual, comparar meses
    if (year === currentYear) {
      if (month > currentMonth) {
        return 'future';
      } else if (month === currentMonth) {
        return monthData?.status === 'pending' ? 'current' : 'current';
      } else {
        return monthData?.status === 'pending' ? 'overdue' : 'overdue';
      }
    }

    return 'overdue';
  }

  getMonthTooltip(year: number, month: number): string {
    const yearRecord = this.paymentRecords.find(record => record.year === year);
    const monthData = yearRecord?.months[month];

    // Se é pré-contrato
    if (monthData?.isPreContract) {
      return 'Cliente ainda não havia iniciado o contrato neste período';
    }

    // Se foi pago
    if (monthData?.paid && monthData.paymentDate) {
      return `Pago em ${monthData.paymentDate.toLocaleDateString('pt-BR')} - R$ ${monthData.amount?.toFixed(2)}`;
    }

    // Se está pendente
    if (monthData?.status === 'pending') {
      const dueDate = monthData.dueDate ? monthData.dueDate.toLocaleDateString('pt-BR') : '';
      const today = new Date();
      const isOverdue = monthData.dueDate && new Date(monthData.dueDate) < today;

      if (isOverdue) {
        return `Vencido em ${dueDate} - R$ ${monthData.amount?.toFixed(2)}`;
      } else {
        return `Vence em ${dueDate} - R$ ${monthData.amount?.toFixed(2)}`;
      }
    }

    const status = this.getMonthStatus(year, month);
    switch (status) {
      case 'overdue':
        return 'Pagamento em atraso';
      case 'current':
        return 'Mês atual';
      case 'future':
        return 'Período futuro';
      default:
        return '';
    }
  }

  onCellClick(year: number, month: number): void {
    const yearRecord = this.paymentRecords.find(record => record.year === year);
    const monthData = yearRecord?.months[month];
    const monthName = this.monthNames[month - 1];

    // Se é pré-contrato, não permitir clique
    if (monthData?.isPreContract) {
      this.popupService.showInfoMessage('Este período é anterior ao início do contrato do cliente.');
      return;
    }

    if (monthData?.paid) {
      // Se já foi pago, mostrar opção para desmarcar
      const payment = monthData;
      this.popupService.confirmDialog(
        'Pagamento Encontrado',
        `${monthName}/${year} foi pago em ${payment.paymentDate?.toLocaleDateString('pt-BR')} - R$ ${payment.amount?.toFixed(2)}\n\nDeseja desmarcar este pagamento?`,
        () => {
          this.unmarkPayment(year, month);
        }
      );
    } else {
      // Se não foi pago, mostrar modal para preencher detalhes do pagamento
      const status = this.getMonthStatus(year, month);

      // Verificar se existe um pagamento pendente para marcar como pago
      if (monthData?.paymentId && monthData?.status === 'pending') {
        this.showPaymentDetailsModal(year, month, monthData.paymentId);
      } else {
        // Para meses futuros ou sem pagamento pendente, permitir registro antecipado
        this.popupService.showInfoMessage('Não há pagamento pendente para este período. Use o botão "Registrar Histórico" para criar pagamentos antecipados.');
      }
    }
  }

  private showPaymentDetailsModal(year: number, month: number, paymentId: string): void {
    const monthName = this.monthNames[month - 1];
    const yearRecord = this.paymentRecords.find(record => record.year === year);
    const monthData = yearRecord?.months[month];

    const dialogRef = this.dialog.open(PaymentDetailsDialogComponent, {
      width: '400px',
      data: {
        period: `${monthName}/${year}`,
        amount: monthData?.amount || 0,
        paymentId: paymentId
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.markPaymentAsPaid(paymentId, result.paymentMethod, result.notes);
      }
    });
  }

  private markPaymentAsPaid(paymentId: string, paymentMethod: string, notes: string): void {
    // Get current user ID from localStorage
    const userData = this.localStorageService.getItem('user');
    const userId = userData?.id || userData?._id || '68c9d3d1383e862f846bfdf5'; // fallback ID

    const paymentData = {
      paymentMethod: paymentMethod,
      notes: notes,
      paidBy: userId
    };

    this.paymentService.markPaymentAsPaid(paymentId, paymentData).subscribe({
      next: (response: any) => {
        this.popupService.showSuccessMessage('Pagamento marcado como pago!');
        this.loadPaymentRecords(); // Recarregar os dados
      },
      error: (error: any) => {
        console.error('Erro ao marcar pagamento:', error);
        this.popupService.showErrorMessage('Erro ao marcar pagamento como pago');
      }
    });
  }

  private unmarkPayment(year: number, month: number): void {
    const yearRecord = this.paymentRecords.find(record => record.year === year);
    const paymentId = yearRecord?.months[month]?.paymentId;

    if (paymentId) {
      this.paymentService.deletePayment(paymentId).subscribe({
        next: () => {
          this.popupService.showSuccessMessage('Pagamento desmarcado!');
          this.loadPaymentRecords(); // Recarregar os dados
        },
        error: (error: any) => {
          console.error('Erro ao desmarcar pagamento:', error);
          this.popupService.showErrorMessage('Erro ao desmarcar pagamento');
        }
      });
    } else {
      this.popupService.showErrorMessage('ID do pagamento não encontrado');
    }
  }

  private showCreatePaymentOption(year: number, month: number): void {
    this.popupService.confirmDialog(
      'Criar Novo Pagamento',
      `Deseja ir para a tela de criação de pagamento para ${this.monthNames[month - 1]}/${year}?`,
      () => {
        this.router.navigate(['/dashboard/payments/create'], {
          queryParams: {
            clientId: this.clientId,
            year: year,
            month: month
          }
        });
      }
    );
  }

  getTotalPaidMonths(): number {
    return this.paymentRecords.reduce((total, yearRecord) => {
      return total + Object.values(yearRecord.months).filter(month =>
        month.paid && !month.isPreContract
      ).length;
    }, 0);
  }

  getTotalOverdueMonths(): number {
    return this.paymentRecords.reduce((total, yearRecord) => {
      return total + Object.entries(yearRecord.months).filter(([monthNum, month]) => {
        // Não contar meses pré-contrato
        if (month.isPreContract) return false;

        // Contar apenas meses com status pending que estão vencidos
        if (month.status === 'pending' && month.dueDate) {
          const today = new Date();
          return new Date(month.dueDate) < today;
        }

        // Para meses sem dados de pagamento, verificar se é passado
        const cellDate = new Date(yearRecord.year, parseInt(monthNum) - 1, 1);
        const currentDate = new Date();
        return !month.paid && cellDate < currentDate;
      }).length;
    }, 0);
  }

  getContractStartInfo(): string {
    if (!this.contractStartDate) {
      return 'Nenhum pagamento registrado';
    }
    return `Contrato iniciado em ${this.contractStartDate.toLocaleDateString('pt-BR')}`;
  }

  goBack(): void {
    this.router.navigate(['/dashboard/clients']);
  }
}

// Dialog Component for Payment Details
@Component({
  selector: 'app-payment-details-dialog',
  template: `
    <h2 mat-dialog-title>Marcar Pagamento como Pago</h2>
    <mat-dialog-content>
      <form [formGroup]="paymentForm" class="payment-form">
        <div class="payment-info">
          <p><strong>Período:</strong> {{data.period}}</p>
          <p><strong>Valor:</strong> R$ {{data.amount.toFixed(2)}}</p>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Método de Pagamento</mat-label>
          <mat-select formControlName="paymentMethod">
            <mat-option value="dinheiro">Dinheiro</mat-option>
            <mat-option value="pix">PIX</mat-option>
            <mat-option value="cartao">Cartão</mat-option>
            <mat-option value="transferencia">Transferência</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Anotações</mat-label>
          <textarea matInput
                    formControlName="notes"
                    placeholder="Ex: Pagou com atraso, cliente preferencial..."
                    rows="3"></textarea>
        </mat-form-field>
      </form>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancelar</button>
      <button mat-raised-button
              color="primary"
              (click)="onConfirm()"
              [disabled]="paymentForm.invalid">
        Confirmar Pagamento
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .payment-form {
      min-width: 300px;
      padding: 10px 0;
    }
    .payment-info {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
    }
    .payment-info p {
      margin: 5px 0;
      color: #333;
    }
    .full-width {
      width: 100%;
      margin-bottom: 15px;
    }
    mat-dialog-actions {
      padding: 16px 0;
    }
  `]
})
export class PaymentDetailsDialogComponent {
  paymentForm: FormGroup;

  constructor(
    public dialogRef: MatDialogRef<PaymentDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder
  ) {
    this.paymentForm = this.fb.group({
      paymentMethod: ['dinheiro', Validators.required],
      notes: ['']
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onConfirm(): void {
    if (this.paymentForm.valid) {
      this.dialogRef.close(this.paymentForm.value);
    }
  }
}
