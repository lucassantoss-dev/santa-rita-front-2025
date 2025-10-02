import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Activity {
  id: number;
  type: 'client' | 'payment' | 'certificate' | 'card' | 'system' | 'login' | 'logout';
  icon: string;
  title: string;
  description: string;
  timestamp: Date;
  userId?: string;
  entityId?: string;
  entityName?: string;
  action?: 'create' | 'update' | 'delete' | 'view' | 'download' | 'upload' | 'renew';
}

@Injectable({
  providedIn: 'root'
})
export class ActivityService {
  private readonly STORAGE_KEY = 'recent_activities';
  private recentActivities$ = new BehaviorSubject<Activity[]>([]);

  constructor() {
    this.loadFromStorage();
  }

  // Obter atividades como observable
  getRecentActivities(): Observable<Activity[]> {
    return this.recentActivities$.asObservable();
  }

  // Obter atividades atuais
  getCurrentActivities(): Activity[] {
    return this.recentActivities$.value;
  }

  // Adicionar nova atividade
  addActivity(activity: Omit<Activity, 'id' | 'timestamp'>): void {
    const newActivity: Activity = {
      ...activity,
      id: Date.now() + Math.random(), // ID único
      timestamp: new Date()
    };

    const currentActivities = this.recentActivities$.value;
    const updatedActivities = [newActivity, ...currentActivities]
      .slice(0, 50); // Manter apenas as 50 mais recentes

    this.recentActivities$.next(updatedActivities);
    this.saveToStorage(updatedActivities);
  }

  // Atividades específicas por tipo
  addClientActivity(action: 'create' | 'update' | 'delete', clientName: string, clientId?: string): void {
    const actionMap = {
      'create': { title: 'Novo Cliente Cadastrado', icon: 'person_add' },
      'update': { title: 'Cliente Atualizado', icon: 'edit' },
      'delete': { title: 'Cliente Removido', icon: 'person_remove' }
    };

    this.addActivity({
      type: 'client',
      icon: actionMap[action].icon,
      title: actionMap[action].title,
      description: `${clientName} foi ${action === 'create' ? 'cadastrado' : action === 'update' ? 'atualizado' : 'removido'} no sistema`,
      entityId: clientId,
      entityName: clientName,
      action
    });
  }

  addPaymentActivity(action: 'create' | 'update' | 'delete', paymentInfo: string, paymentId?: string): void {
    const actionMap = {
      'create': { title: 'Novo Pagamento Registrado', icon: 'payment' },
      'update': { title: 'Pagamento Atualizado', icon: 'edit' },
      'delete': { title: 'Pagamento Removido', icon: 'money_off' }
    };

    this.addActivity({
      type: 'payment',
      icon: actionMap[action].icon,
      title: actionMap[action].title,
      description: `Pagamento ${paymentInfo} foi ${action === 'create' ? 'registrado' : action === 'update' ? 'atualizado' : 'removido'}`,
      entityId: paymentId,
      entityName: paymentInfo,
      action
    });
  }

  addCertificateActivity(action: 'create' | 'download', certificateInfo: string, certificateId?: string): void {
    const actionMap = {
      'create': { title: 'Certificado Gerado', icon: 'description' },
      'download': { title: 'Certificado Baixado', icon: 'download' }
    };

    this.addActivity({
      type: 'certificate',
      icon: actionMap[action].icon,
      title: actionMap[action].title,
      description: `Certificado para ${certificateInfo} foi ${action === 'create' ? 'gerado' : 'baixado'}`,
      entityId: certificateId,
      entityName: certificateInfo,
      action
    });
  }

  addCardActivity(action: 'create' | 'renew', cardInfo: string, cardId?: string): void {
    const actionMap = {
      'create': { title: 'Carteirinha Criada', icon: 'credit_card' },
      'renew': { title: 'Carteirinha Renovada', icon: 'refresh' }
    };

    this.addActivity({
      type: 'card',
      icon: actionMap[action].icon,
      title: actionMap[action].title,
      description: `Carteirinha para ${cardInfo} foi ${action === 'create' ? 'criada' : 'renovada'}`,
      entityId: cardId,
      entityName: cardInfo,
      action
    });
  }

  addSystemActivity(title: string, description: string, icon: string = 'settings'): void {
    this.addActivity({
      type: 'system',
      icon,
      title,
      description,
      action: 'update'
    });
  }

  addLoginActivity(userName: string): void {
    this.addActivity({
      type: 'login',
      icon: 'login',
      title: 'Login Realizado',
      description: `${userName} fez login no sistema`,
      action: 'view'
    });
  }

  addLogoutActivity(userName: string): void {
    this.addActivity({
      type: 'logout',
      icon: 'logout',
      title: 'Logout Realizado',
      description: `${userName} saiu do sistema`,
      action: 'view'
    });
  }

  // Limpar todas as atividades
  clearActivities(): void {
    this.recentActivities$.next([]);
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Remover atividade específica
  removeActivity(activityId: number): void {
    const currentActivities = this.recentActivities$.value;
    const updatedActivities = currentActivities.filter(activity => activity.id !== activityId);
    this.recentActivities$.next(updatedActivities);
    this.saveToStorage(updatedActivities);
  }

  // Filtrar atividades por tipo
  getActivitiesByType(type: Activity['type']): Activity[] {
    return this.recentActivities$.value.filter(activity => activity.type === type);
  }

  // Obter atividades dos últimos X dias
  getActivitiesFromLastDays(days: number): Activity[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    return this.recentActivities$.value.filter(activity =>
      activity.timestamp >= cutoffDate
    );
  }

  // Persistência no localStorage
  private saveToStorage(activities: Activity[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(activities));
    } catch (error) {
      console.error('Erro ao salvar atividades no localStorage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const activities = JSON.parse(stored).map((activity: any) => ({
          ...activity,
          timestamp: new Date(activity.timestamp)
        }));
        this.recentActivities$.next(activities);
      }
    } catch (error) {
      console.error('Erro ao carregar atividades do localStorage:', error);
      this.recentActivities$.next([]);
    }
  }
}
