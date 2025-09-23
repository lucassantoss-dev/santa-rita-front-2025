import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

interface Activity {
  id: number;
  type: 'client' | 'payment' | 'certificate' | 'card';
  icon: string;
  title: string;
  description: string;
  timestamp: Date;
}

interface Alert {
  id: number;
  type: 'warning' | 'info' | 'success' | 'error';
  icon: string;
  title: string;
  message: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {

  // Métricas principais
  totalClients: number = 1247;
  newClientsThisMonth: number = 18;
  totalRevenue: number = 89450.00;
  revenueGrowth: number = 12.5;
  certificatesIssued: number = 156;
  certificatesPending: number = 8;
  memberCards: number = 892;
  cardsToRenew: number = 23;

  // Controle de período do gráfico
  selectedPeriod: string = '6m';

  // Atividades recentes
  recentActivities: Activity[] = [
    {
      id: 1,
      type: 'client',
      icon: 'person_add',
      title: 'Novo Cliente Cadastrado',
      description: 'Maria Santos Silva foi cadastrada no sistema',
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 horas atrás
    },
    {
      id: 2,
      type: 'payment',
      icon: 'payment',
      title: 'Pagamento Processado',
      description: 'Mensalidade de João Oliveira - R$ 350,00',
      timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000) // 4 horas atrás
    },
    {
      id: 3,
      type: 'certificate',
      icon: 'description',
      title: 'Certificado de Óbito Emitido',
      description: 'Certificado #2024-0156 para família Rodrigues',
      timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000) // 6 horas atrás
    },
    {
      id: 4,
      type: 'card',
      icon: 'credit_card',
      title: 'Carteirinha Renovada',
      description: 'Carteirinha de Ana Paula Souza renovada até 2025',
      timestamp: new Date(Date.now() - 8 * 60 * 60 * 1000) // 8 horas atrás
    },
    {
      id: 5,
      type: 'client',
      icon: 'edit',
      title: 'Cliente Atualizado',
      description: 'Dados de contato de Carlos Mendes atualizados',
      timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 horas atrás
    },
    {
      id: 6,
      type: 'payment',
      icon: 'attach_money',
      title: 'Pagamento Recebido',
      description: 'Taxa de manutenção - Família Silva - R$ 120,00',
      timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) // 1 dia atrás
    }
  ];

  // Alertas e notificações
  alerts: Alert[] = [
    {
      id: 1,
      type: 'warning',
      icon: 'schedule',
      title: 'Backup Atrasado',
      message: 'O backup automático está com 2 horas de atraso. Verifique a configuração do servidor.'
    },
    {
      id: 2,
      type: 'info',
      icon: 'info',
      title: 'Manutenção Programada',
      message: 'Manutenção do sistema agendada para domingo às 02:00. Duração estimada: 2 horas.'
    }
  ];

  constructor(private router: Router) { }

  ngOnInit(): void {
    // Simular carregamento de dados em uma aplicação real
    this.loadDashboardData();
  }

  private loadDashboardData(): void {
    // Em uma aplicação real, aqui seria feita a chamada para APIs
    console.log('Dashboard data loaded');
  }

  // Métodos para seleção de período do gráfico
  selectPeriod(period: string): void {
    this.selectedPeriod = period;
    // Aqui seria atualizado o gráfico com novos dados
    console.log(`Período selecionado: ${period}`);
  }

  // Métodos de navegação e ações rápidas
  navigateToClients(): void {
    this.router.navigate(['/dashboard/clients']);
  }

  generateCertificate(): void {
    // Lógica para gerar certificado
    console.log('Gerando novo certificado...');
    // Em uma aplicação real, abriria modal ou navegaria para formulário
  }

  processPayment(): void {
    this.router.navigate(['/payment']);
  }

  issueMemberCard(): void {
    // Lógica para emitir carteirinha
    console.log('Emitindo nova carteirinha...');
    // Em uma aplicação real, abriria modal de seleção de cliente
  }

  viewReports(): void {
    // Navegar para seção de relatórios
    console.log('Abrindo relatórios...');
    this.router.navigate(['/dashboard/reports']);
  }

  manageSettings(): void {
    // Navegar para configurações
    console.log('Abrindo configurações...');
    this.router.navigate(['/dashboard/settings']);
  }

  // Método para dismissar alertas
  dismissAlert(alertId: number): void {
    this.alerts = this.alerts.filter(alert => alert.id !== alertId);
    console.log(`Alerta ${alertId} dismissado`);
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

  // Método para atualizar métricas (simulação)
  refreshMetrics(): void {
    // Simular pequenas variações nas métricas
    this.totalClients += Math.floor(Math.random() * 3);
    this.totalRevenue += Math.random() * 1000;
    this.certificatesIssued += Math.floor(Math.random() * 2);

    console.log('Métricas atualizadas');
  }
}
