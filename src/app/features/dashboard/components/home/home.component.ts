import { Component, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import {
  DashboardService,
  DashboardStats,
  SystemAlert
} from '../../../../core/dashboard.service';
import { ActivityService, Activity } from '../../../../core/activity.service';
import { PopupService } from '../../../../shared/popup/popup.service';
import { PaymentService } from '../../../../core/payment.service';
import { Chart, ChartConfiguration, ChartType, registerables } from 'chart.js';

Chart.register(...registerables);

interface MonthlyRevenue {
  month: string;
  totalRevenue: number;
  paidRevenue: number;
  overdueRevenue: number;
  pendingRevenue: number;
  paymentsCount: number;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('revenueChart', { static: false }) revenueChart!: ElementRef<HTMLCanvasElement>;

  // Chart data
  chart: Chart | null = null;
  selectedPeriod: '6m' | '1y' = '6m';
  monthlyRevenueData: MonthlyRevenue[] = [];
  isChartLoading = true;

  // Dados dinâmicos do dashboard
  dashboardStats: DashboardStats = {
    totalClients: 0,
    newClientsThisMonth: 0,
    activeClients: 0,
    certificatesIssued: 0,
    certificatesPending: 0,
    memberCards: 0,
    cardsToRenew: 0
  };

  // Controle de loading
  isLoading: boolean = false;

  // Atividades recentes e alertas
  recentActivities: Activity[] = [];
  alerts: SystemAlert[] = [];

  // Subscriptions para gerenciar observables
  private subscriptions: Subscription = new Subscription();

  // Propriedades computadas para compatibilidade com template
  get totalClients() { return this.dashboardStats.totalClients; }
  get newClientsThisMonth() { return this.dashboardStats.newClientsThisMonth; }
  get certificatesIssued() { return this.dashboardStats.certificatesIssued; }
  get certificatesPending() { return this.dashboardStats.certificatesPending; }
  get memberCards() { return this.dashboardStats.memberCards; }
  get cardsToRenew() { return this.dashboardStats.cardsToRenew; }

  constructor(
    private router: Router,
    private dashboardService: DashboardService,
    private activityService: ActivityService,
    private popupService: PopupService,
    private paymentService: PaymentService
  ) { }

  ngOnInit(): void {
    this.loadDashboardData();
    this.setupSubscriptions();
    this.loadRevenueData();
  }

  ngAfterViewInit(): void {
    // Chart será inicializado após carregar os dados
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  private setupSubscriptions(): void {
    // Subscription para dados do dashboard
    this.subscriptions.add(
      this.dashboardService.getDashboardStats().subscribe(stats => {
        this.dashboardStats = stats;
      })
    );

    // Subscription para atividades recentes
    this.subscriptions.add(
      this.activityService.getRecentActivities().subscribe(activities => {
        this.recentActivities = activities.slice(0, 6); // Mostrar apenas as 6 mais recentes
      })
    );

    // Subscription para alertas do sistema
    this.subscriptions.add(
      this.dashboardService.getSystemAlerts().subscribe(alerts => {
        this.alerts = alerts;
      })
    );

    // Subscription para estado de loading
    this.subscriptions.add(
      this.dashboardService.getLoadingState().subscribe(loading => {
        this.isLoading = loading;
      })
    );
  }

  private loadDashboardData(): void {
    this.dashboardService.loadDashboardData().subscribe({
      next: () => {
        this.popupService.showSuccessMessage('Dados do dashboard atualizados com sucesso!');
      },
      error: (error) => {
        console.error('Erro ao carregar dados do dashboard:', error);
        this.popupService.showErrorMessage('Erro ao carregar dados do dashboard');
      }
    });
  }

  // Métodos para seleção de período do gráfico
  selectPeriod(period: '6m' | '1y'): void {
    this.selectedPeriod = period;
    this.loadRevenueData();
  }

  loadRevenueData(): void {
    this.isChartLoading = true;

    // Carregar dados de pagamentos
    this.paymentService.getAllPayments().subscribe({
      next: (response) => {
        this.processRevenueData(response.data || []);
        setTimeout(() => {
          this.createRevenueChart();
        }, 100);
        this.isChartLoading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar dados de receita:', error);
        // Usar dados mockados em caso de erro
        this.processRevenueDataMock();
        setTimeout(() => {
          this.createRevenueChart();
        }, 100);
        this.isChartLoading = false;
      }
    });
  }

  private processRevenueDataMock(): void {
    // Dados mockados para demonstração
    const mockData = [
      { month: 'Ago/24', totalRevenue: 5400, paidRevenue: 3200, overdueRevenue: 800, pendingRevenue: 1400, paymentsCount: 12 },
      { month: 'Set/24', totalRevenue: 6200, paidRevenue: 4100, overdueRevenue: 900, pendingRevenue: 1200, paymentsCount: 15 },
      { month: 'Out/24', totalRevenue: 5800, paidRevenue: 3900, overdueRevenue: 700, pendingRevenue: 1200, paymentsCount: 14 },
      { month: 'Nov/24', totalRevenue: 7200, paidRevenue: 5100, overdueRevenue: 1100, pendingRevenue: 1000, paymentsCount: 18 },
      { month: 'Dez/24', totalRevenue: 6800, paidRevenue: 4800, overdueRevenue: 600, pendingRevenue: 1400, paymentsCount: 16 },
      { month: 'Jan/25', totalRevenue: 7800, paidRevenue: 5600, overdueRevenue: 1200, pendingRevenue: 1000, paymentsCount: 20 }
    ];

    this.monthlyRevenueData = this.selectedPeriod === '6m' ? mockData : mockData.slice(-12);
  }

  private processRevenueData(payments: any[]): void {
    const months = this.getLastMonths(this.selectedPeriod === '6m' ? 6 : 12);

    this.monthlyRevenueData = months.map(month => {
      const monthPayments = payments.filter(payment => {
        const paymentMonth = new Date(payment.createdAt).toISOString().substring(0, 7);
        return paymentMonth === month.value;
      });

      const totalRevenue = monthPayments.reduce((sum, payment) => sum + (payment.valor || 0), 0);
      const paidPayments = monthPayments.filter(p => p.paymentDate);
      const paidRevenue = paidPayments.reduce((sum, payment) => sum + (payment.valor || 0), 0);

      const overduePayments = monthPayments.filter(p => !p.paymentDate && this.isOverdue(p));
      const overdueRevenue = overduePayments.reduce((sum, payment) => sum + (payment.valor || 0), 0);

      const pendingRevenue = totalRevenue - paidRevenue - overdueRevenue;

      return {
        month: month.label,
        totalRevenue,
        paidRevenue,
        overdueRevenue,
        pendingRevenue,
        paymentsCount: monthPayments.length
      };
    });
  }

  private getLastMonths(count: number): { label: string; value: string }[] {
    const months = [];
    const now = new Date();

    for (let i = count - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthNames = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
      ];

      months.push({
        label: `${monthNames[date.getMonth()]}/${date.getFullYear().toString().slice(-2)}`,
        value: date.toISOString().substring(0, 7)
      });
    }

    return months;
  }

  private isOverdue(payment: any): boolean {
    if (payment.paymentDate) return false;
    const dueDate = new Date(payment.dueDate || payment.createdAt);
    return dueDate < new Date();
  }

  private createRevenueChart(): void {
    if (this.chart) {
      this.chart.destroy();
    }

    if (!this.revenueChart) return;

    const ctx = this.revenueChart.nativeElement.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'bar' as ChartType,
      data: {
        labels: this.monthlyRevenueData.map(data => data.month),
        datasets: [
          {
            label: 'Receita Paga',
            data: this.monthlyRevenueData.map(data => data.paidRevenue),
            backgroundColor: 'rgba(40, 167, 69, 0.8)',
            borderColor: 'rgba(40, 167, 69, 1)',
            borderWidth: 1
          },
          {
            label: 'Receita Pendente',
            data: this.monthlyRevenueData.map(data => data.pendingRevenue),
            backgroundColor: 'rgba(255, 193, 7, 0.8)',
            borderColor: 'rgba(255, 193, 7, 1)',
            borderWidth: 1
          },
          {
            label: 'Receita Vencida',
            data: this.monthlyRevenueData.map(data => data.overdueRevenue),
            backgroundColor: 'rgba(220, 53, 69, 0.8)',
            borderColor: 'rgba(220, 53, 69, 1)',
            borderWidth: 1
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          title: {
            display: true,
            text: `Receita dos Últimos ${this.selectedPeriod === '6m' ? '6 Meses' : '12 Meses'}`,
            font: {
              size: 16,
              weight: 'bold'
            },
            color: '#2c3e50'
          },
          legend: {
            display: true,
            position: 'top',
            labels: {
              usePointStyle: true,
              padding: 20,
              color: '#2c3e50'
            }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed.y;
                return `${context.dataset.label}: R$ ${this.formatCurrencyValue(value)}`;
              },
              footer: (tooltipItems) => {
                const monthIndex = tooltipItems[0].dataIndex;
                const monthData = this.monthlyRevenueData[monthIndex];
                return [
                  `Total: R$ ${this.formatCurrencyValue(monthData.totalRevenue)}`,
                  `Pagamentos: ${monthData.paymentsCount}`
                ];
              }
            }
          }
        },
        scales: {
          x: {
            stacked: true,
            grid: {
              display: false
            },
            ticks: {
              color: '#6c757d'
            }
          },
          y: {
            stacked: true,
            beginAtZero: true,
            grid: {
              color: 'rgba(0, 0, 0, 0.1)'
            },
            ticks: {
              color: '#6c757d',
              callback: (value) => {
                return 'R$ ' + this.formatCurrencyValue(Number(value));
              }
            }
          }
        },
        interaction: {
          intersect: false,
          mode: 'index'
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  getTotalRevenue(): number {
    return this.monthlyRevenueData.reduce((sum, month) => sum + month.totalRevenue, 0);
  }

  getTotalPaidRevenue(): number {
    return this.monthlyRevenueData.reduce((sum, month) => sum + month.paidRevenue, 0);
  }

  getTotalPendingRevenue(): number {
    return this.monthlyRevenueData.reduce((sum, month) => sum + month.pendingRevenue, 0);
  }

  getTotalOverdueRevenue(): number {
    return this.monthlyRevenueData.reduce((sum, month) => sum + month.overdueRevenue, 0);
  }

  private formatCurrencyValue(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  // Métodos de navegação e ações rápidas
  navigateToClients(): void {
    this.router.navigate(['/dashboard/clients']);
  }

  generateCertificate(): void {
    this.router.navigate(['/dashboard/clients']);
  }

  processPayment(): void {
    this.router.navigate(['/dashboard/payments']);
  }

  issueMemberCard(): void {
    this.router.navigate(['/dashboard/clients']);
  }

  viewReports(): void {
    this.router.navigate(['/dashboard/reports']);
  }

  manageSettings(): void {
    this.router.navigate(['/dashboard/configurations']);
  }

  // Método para dismissar alertas
  dismissAlert(alertId: number): void {
    this.dashboardService.dismissAlert(alertId);
  }

  // Métodos auxiliares para formatação
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }

  getActivityIcon(type: string): string {
    const icons = {
      'client': 'person',
      'payment': 'payment',
      'certificate': 'description',
      'card': 'credit_card'
    };
    return icons[type as keyof typeof icons] || 'info';
  }

  // Simulação de dados para gráfico (em uma aplicação real viria da API)
  getChartData(): any[] {
    if (this.selectedPeriod === '6m') {
      return [
        { month: 'Jan', revenue: 78500 },
        { month: 'Fev', revenue: 82300 },
        { month: 'Mar', revenue: 76800 },
        { month: 'Abr', revenue: 91200 },
        { month: 'Mai', revenue: 85600 },
        { month: 'Jun', revenue: 89450 }
      ];
    } else {
      return [
        { month: '2023', revenue: 986500 },
        { month: '2024', revenue: 1125400 }
      ];
    }
  }

  // Método para atualizar métricas (forçar refresh dos dados)
  refreshMetrics(): void {
    this.loadDashboardData();
    this.popupService.showSuccessMessage('Métricas atualizadas com sucesso!');
  }
}
