import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, combineLatest, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { ClientService } from './client.service';
import { ActivityService, Activity } from './activity.service';
import { environment } from '../enviroments/enviroment';
import ClientInterface from '../utils/client/clientInterface';
import ClientApiInterface from '../utils/client/clientApiInterface';

export interface DashboardStats {
  totalClients: number;
  newClientsThisMonth: number;
  activeClients: number;
  certificatesIssued: number;
  certificatesPending: number;
  memberCards: number;
  cardsToRenew: number;
}

export interface SystemAlert {
  id: number;
  type: 'warning' | 'info' | 'success' | 'error';
  icon: string;
  title: string;
  message: string;
  timestamp: Date;
  dismissed?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class DashboardService {
  private apiUrl = environment.urlBackEnd;

  // BehaviorSubjects para dados reativos
  private dashboardStats$ = new BehaviorSubject<DashboardStats>({
    totalClients: 0,
    newClientsThisMonth: 0,
    activeClients: 0,
    certificatesIssued: 0,
    certificatesPending: 0,
    memberCards: 0,
    cardsToRenew: 0
  });

  private systemAlerts$ = new BehaviorSubject<SystemAlert[]>([]);
  private loading$ = new BehaviorSubject<boolean>(false);

  constructor(
    private http: HttpClient,
    private clientService: ClientService,
    private activityService: ActivityService
  ) {}

  // Getters para os observables
  getDashboardStats(): Observable<DashboardStats> {
    return this.dashboardStats$.asObservable();
  }

  getRecentActivities(): Observable<Activity[]> {
    return this.activityService.getRecentActivities();
  }

  getSystemAlerts(): Observable<SystemAlert[]> {
    return this.systemAlerts$.asObservable();
  }

  getLoadingState(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  // Carregar dados do dashboard
  loadDashboardData(): Observable<any> {
    this.loading$.next(true);

    // Combinar múltiplas chamadas de API
    return combineLatest([
      this.loadClientStats(),
      this.loadSystemAlerts()
    ]).pipe(
      tap(() => this.loading$.next(false)),
      catchError(error => {
        console.error('Erro ao carregar dados do dashboard:', error);
        this.loading$.next(false);
        return of(null);
      })
    );
  }

  // Carregar estatísticas de clientes
  private loadClientStats(): Observable<DashboardStats> {
    return this.clientService.getAllClients().pipe(
      map((response: ClientApiInterface) => {
        const clients = response.data || [];
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // Calcular estatísticas baseadas nos dados reais
        const totalClients = clients.length;
        const activeClients = clients.filter((client: ClientInterface) =>
          client.situacao === 'Ativo'
        ).length;

        // Clientes criados neste mês (baseado na data de criação se disponível)
        const newClientsThisMonth = clients.filter((client: ClientInterface) => {
          if (client.createdAt) {
            const createdDate = new Date(client.createdAt);
            return createdDate.getMonth() === currentMonth &&
                   createdDate.getFullYear() === currentYear;
          }
          return false;
        }).length;

        // Por enquanto, valores calculados ou estimados para outros dados
        const certificatesIssued = Math.floor(totalClients * 0.3); // Estimar 30% dos clientes
        const certificatesPending = Math.floor(certificatesIssued * 0.1); // 10% pendentes
        const memberCards = Math.floor(activeClients * 0.8); // 80% dos ativos têm carteirinha
        const cardsToRenew = Math.floor(memberCards * 0.05); // 5% para renovar

        const stats: DashboardStats = {
          totalClients,
          newClientsThisMonth,
          activeClients,
          certificatesIssued,
          certificatesPending,
          memberCards,
          cardsToRenew
        };

        this.dashboardStats$.next(stats);
        return stats;
      }),
      catchError(error => {
        console.error('Erro ao carregar estatísticas de clientes:', error);
        return of(this.dashboardStats$.value);
      })
    );
  }

  // Carregar alertas do sistema
  private loadSystemAlerts(): Observable<SystemAlert[]> {
    // Por enquanto, alertas simulados - em produção viriam de uma API
    const alerts: SystemAlert[] = [
      {
        id: 1,
        type: 'info',
        icon: 'info',
        title: 'Sistema Atualizado',
        message: 'O sistema foi atualizado com novas funcionalidades.',
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 dia atrás
        dismissed: false
      }
    ];

    this.systemAlerts$.next(alerts);
    return of(alerts);
  }

  // Adicionar nova atividade (delegado para ActivityService)
  addActivity(activity: Omit<Activity, 'id' | 'timestamp'>): void {
    this.activityService.addActivity(activity);
  }

  // Dismissar alerta
  dismissAlert(alertId: number): void {
    const currentAlerts = this.systemAlerts$.value;
    const updatedAlerts = currentAlerts.filter(alert => alert.id !== alertId);
    this.systemAlerts$.next(updatedAlerts);
  }

  // Atualizar estatísticas específicas
  updateStats(partialStats: Partial<DashboardStats>): void {
    const currentStats = this.dashboardStats$.value;
    const updatedStats = { ...currentStats, ...partialStats };
    this.dashboardStats$.next(updatedStats);

    // Recarregar dados atualizados do backend
    setTimeout(() => {
      this.loadClientStats().subscribe();
    }, 500);
  }

  // Método para forçar atualização dos dados
  refreshData(): Observable<any> {
    return this.loadDashboardData();
  }
}
