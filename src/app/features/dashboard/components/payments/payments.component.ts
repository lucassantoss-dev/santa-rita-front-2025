import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatTableDataSource } from '@angular/material/table';
import { PageEvent } from '@angular/material/paginator';
import { Subject, takeUntil } from 'rxjs';
import { PaymentData, PaymentStats } from '../../../../utils/payment/paymentInterface';
import { PaymentService } from '../../../../core/payment.service';
import { DashboardService } from '../../../../core/dashboard.service';
import { PopupService } from '../../../../shared/popup/popup.service';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { QuickPaymentComponent } from './components/quick-payment/quick-payment.component';

@Component({
  selector: 'app-payments',
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.scss'],
  animations: [
    trigger('expandCollapse', [
      state('collapsed', style({ height: '0', overflow: 'hidden', opacity: 0 })),
      state('expanded', style({ height: '*', overflow: 'visible', opacity: 1 })),
      transition('collapsed <=> expanded', animate('300ms ease-in-out'))
    ])
  ]
})
export class PaymentsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  displayedColumns: string[] = [
    'clientName',
    'location',
    'amount',
    'dueDate',
    'actions'
  ];

  dataSource = new MatTableDataSource<PaymentData>([]);

  // Estatísticas
  stats: PaymentStats = {
    totalPayments: 0,
    pendingPayments: 0,
    paidPayments: 0,
    overduePayments: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0
  };

  // Estados da UI
  loading = true;
  searchValue = '';
  selectedFilter = 'todos';
  showCreateForm = false;
  selectedPayment: PaymentData | null = null;
  filtersExpanded = true;

  // Opções de filtro
  filterOptions = [
    { value: 'todos', label: 'Todos os Pagamentos' },
    { value: 'pendente', label: 'Pendentes' },
    { value: 'pago', label: 'Pagos' },
    { value: 'vencido', label: 'Vencidos' },
    { value: 'plano', label: 'Planos de Pagamento' },
    { value: 'avulso', label: 'Pagamentos Avulsos' }
  ];

  // Paginação
  pageSize = 10;
  pageIndex = 0;
  pageSizeOptions: number[] = [5, 10, 25, 50];

  constructor(
    private paymentService: PaymentService,
    private dashboardService: DashboardService,
    private popupService: PopupService,
    private router: Router,
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
    this.loadPayments();
    this.loadStats();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadPayments(): void {
    this.loading = true;

    // Usando dados mockados para desenvolvimento
    // this.paymentService.getMockPayments()
    //   .pipe(takeUntil(this.destroy$))
    //   .subscribe({
    //     next: (response) => {
    //       this.dataSource.data = response.data;
    //       this.loading = false;
    //       this.applyFilter();
    //     },
    //     error: (error) => {
    //       console.error('Erro ao carregar pagamentos:', error);
    //       this.popupService.showErrorMessage('Erro ao carregar lista de pagamentos');
    //       this.loading = false;
    //     }
    //   });
    this.paymentService.getAllPayments().subscribe({
      next: (response) => {
        this.dataSource.data = response.data;
        this.loading = false;
        this.calculateStatsFromData(response.data); // Calcular estatísticas dos dados reais
        this.applyFilter();
      },
      error: (error) => {
        console.error('Erro ao carregar pagamentos:', error);
        this.popupService.showErrorMessage('Erro ao carregar lista de pagamentos');
        this.loading = false;
      }
    });
  }

  loadStats(): void {
    // As estatísticas agora são calculadas em calculateStatsFromData() com base nos dados reais
    // Este método pode ser usado para validação ou fallback se necessário
  }

  calculateStatsFromData(payments: PaymentData[]): void {
    const now = new Date();

    // Resetar estatísticas
    this.stats = {
      totalPayments: 0,
      pendingPayments: 0,
      paidPayments: 0,
      overduePayments: 0,
      totalAmount: 0,
      paidAmount: 0,
      pendingAmount: 0
    };

    // Calcular estatísticas baseadas nos dados reais
    payments.forEach(payment => {
      const valor = payment.valor || 0;

      // Contadores gerais
      this.stats.totalPayments++;
      this.stats.totalAmount += valor;

      // Calcular por status
      switch (payment.status) {
        case 'paid':
          this.stats.paidPayments++;
          this.stats.paidAmount += valor;
          break;

        case 'overdue':
          this.stats.overduePayments++;
          // Pagamentos vencidos não são contabilizados no valor pendente
          break;

        case 'pending':
          // Verificar se está realmente vencido baseado na data de criação + 30 dias
          const createdDate = new Date(payment.createdAt);
          const dueDate = new Date(createdDate.getTime() + (30 * 24 * 60 * 60 * 1000)); // +30 dias

          if (dueDate < now) {
            this.stats.overduePayments++;
          } else {
            this.stats.pendingPayments++;
            this.stats.pendingAmount += valor;
          }
          break;

        case 'cancelled':
          // Pagamentos cancelados não são contabilizados
          break;

        default:
          // Status não reconhecido - tratar como pendente
          this.stats.pendingPayments++;
          this.stats.pendingAmount += valor;
          break;
      }
    });
  }

  applyFilter(): void {
    let filteredData = [...this.dataSource.data];

    // Filtro por texto de busca
    if (this.searchValue.trim()) {
      const searchTerm = this.searchValue.toLowerCase();
      filteredData = filteredData.filter(payment =>
        payment.responsavel.toLowerCase().includes(searchTerm) ||
        payment.endereco.toLowerCase().includes(searchTerm) ||
        payment.quadra.toLowerCase().includes(searchTerm) ||
        payment.numero.toString().includes(searchTerm)
      );
    }

    // Filtro por status/tipo
    if (this.selectedFilter !== 'todos') {
      if (['pendente', 'pago', 'vencido'].includes(this.selectedFilter)) {
        filteredData = filteredData.filter(payment => payment.status === this.selectedFilter);
      } else if (['plano', 'avulso'].includes(this.selectedFilter)) {
        filteredData = filteredData.filter(payment => payment.paymentType === this.selectedFilter);
      }
    }

    // Atualizar tabela
    this.dataSource.data = filteredData;
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  onFilterChange(): void {
    this.applyFilter();
  }

  openCreateForm(): void {
    const url = '/dashboard/payments/create';
    this.router.navigateByUrl(url);
    // this.selectedPayment = null;
    // this.showCreateForm = true;
  }

  createPlan(): void {
    const url = '/dashboard/plan/create';
    this.router.navigateByUrl(url);
  }

  createRecurrence(): void {
  }

  openQuickPayment(clientId?: string): void {
    const dialogRef = this.dialog.open(QuickPaymentComponent, {
      width: '600px',
      maxWidth: '90vw',
      disableClose: true,
      data: { clientId }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Recarregar dados se o pagamento foi criado
        this.loadPayments();
        this.loadStats();
      }
    });
  }

  openEditForm(payment: PaymentData): void {
    this.selectedPayment = payment;
    this.showCreateForm = true;
  }

  closeForm(): void {
    this.showCreateForm = false;
    this.selectedPayment = null;
  }

  onPaymentSaved(): void {
    this.closeForm();
    this.loadPayments(); // Isso já recalcula as estatísticas via calculateStatsFromData

    // Atualizar atividades do dashboard
    this.dashboardService.addActivity({
      type: 'payment',
      icon: 'payment',
      title: this.selectedPayment ? 'Pagamento Atualizado' : 'Novo Pagamento',
      description: this.selectedPayment ? 'Pagamento atualizado com sucesso' : 'Novo pagamento criado no sistema'
    });
  }

  markAsPaid(payment: PaymentData): void {
    if (payment.status === 'paid') return;

    this.paymentService.markAsPaid(payment._id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          this.popupService.showSuccessMessage(`Pagamento de ${payment.responsavel} marcado como pago`);
          this.loadPayments(); // Isso já recalcula as estatísticas via calculateStatsFromData
          this.dashboardService.addActivity({
            type: 'payment',
            icon: 'check_circle',
            title: 'Pagamento Confirmado',
            description: `Pagamento de ${payment.responsavel} foi marcado como pago`,
            entityId: payment._id
          });
        },
        error: (error) => {
          console.error('Erro ao marcar pagamento como pago:', error);
          this.popupService.showErrorMessage('Erro ao atualizar status do pagamento');
        }
      });
  }

  deletePayment(payment: PaymentData): void {
    if (confirm(`Tem certeza que deseja excluir o pagamento de ${payment.responsavel}?`)) {
      this.paymentService.deletePayment(payment._id)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.popupService.showSuccessMessage(`Pagamento de ${payment.responsavel} excluído com sucesso`);
            this.loadPayments(); // Isso já recalcula as estatísticas via calculateStatsFromData
            this.dashboardService.addActivity({
              type: 'payment',
              icon: 'delete',
              title: 'Pagamento Removido',
              description: `Pagamento de ${payment.responsavel} foi excluído do sistema`,
              entityId: payment._id
            });
          },
          error: (error) => {
            console.error('Erro ao deletar pagamento:', error);
            this.popupService.showErrorMessage('Erro ao excluir pagamento');
          }
        });
    }
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'paid': return '#4caf50';
      case 'pendente': return '#ff9800';
      case 'vencido': return '#f44336';
      default: return '#757575';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'paid': return 'Pago';
      case 'pending': return 'Pendente';
      case 'vencido': return 'Vencido';
      case 'Pending': return 'Pendente';
      default: return status;
    }
  }

  getTypeLabel(type: string): string {
    return type === 'plano' ? 'Plano' : 'Avulso';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('pt-BR');
  }

  isOverdue(payment: PaymentData): boolean {
    if (payment.status === 'paid') return false;
    return new Date(payment.createdAt) < new Date();
  }

  toggleFilters(): void {
    this.filtersExpanded = !this.filtersExpanded;
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'paid': return 'active';
      case 'pending': return 'pending';
      case 'overdue': return 'inactive';
      default: return 'pending';
    }
  }

  getTypeClass(type: string): string {
    return type === 'plano' ? 'type-plan' : 'type-single';
  }

  // Métodos adicionais para compatibilidade com clients
  onSearch(): void {
    // Implementar busca se necessário
    this.loadPayments();
  }

  clearFilters(): void {
    this.searchValue = '';
    this.selectedFilter = 'todos';
    this.onFilterChange();
  }

  // Propriedade para compatibilidade com o template
  get editingPayment(): boolean {
    return this.selectedPayment !== null;
  }

  // Métodos do modal
  closeCreateForm(): void {
    this.showCreateForm = false;
    this.selectedPayment = null;
  }

  savePayment(): void {
    // Implementar salvamento do pagamento
    this.popupService.showSuccessMessage('Pagamento salvo com sucesso!');
    this.closeCreateForm();
  }

  // Paginação
  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    // A paginação será gerenciada pelo MatTableDataSource automaticamente
    // através do MatPaginator conectado via ViewChild se necessário
  }
}
