import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../enviroments/enviroment';
import { PaymentData, PaymentPlan, PaymentStats, PaymentPlanCreate } from '../utils/payment/paymentInterface';
import { PaymentApiInterface, PaymentPlanApiInterface } from '../utils/payment/paymentApiInterface';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  urlBackEnd = environment.urlBackEnd;

  constructor(private http: HttpClient) { }

  // Buscar todos os pagamentos
  getAllPayments(): Observable<PaymentApiInterface> {
    const url: string = `${this.urlBackEnd}/payment?type=unpaid`;
    return this.http.get<PaymentApiInterface>(url);
  }

  // Criar pagamento PIX via MercadoPago
  createPixPayment(paymentData: any): Observable<any> {
    const url: string = `${this.urlBackEnd}/v1/payment/mercadopago/pix`;
    return this.http.post<any>(url, paymentData);
  }

  // Criar pagamento Boleto via MercadoPago
  createBoletoPayment(paymentData: any): Observable<any> {
    const url: string = `${this.urlBackEnd}/v1/payment/mercadopago/boleto`;
    return this.http.post<any>(url, paymentData);
  }

  // Atualizar pagamento
  updatePayment(id: string, payment: Partial<PaymentData>): Observable<PaymentData> {
    const url: string = `${this.urlBackEnd}/payment/${id}`;
    return this.http.put<PaymentData>(url, payment);
  }

  // Deletar pagamento
  deletePayment(id: string): Observable<void> {
    const url: string = `${this.urlBackEnd}/payment/${id}`;
    return this.http.delete<void>(url);
  }

  // Marcar pagamento como pago
  markAsPaid(id: string, paymentDate?: Date): Observable<PaymentData> {
    const url: string = `${this.urlBackEnd}/payment/${id}/pay`;
    return this.http.patch<PaymentData>(url, {
      paymentDate: paymentDate || new Date()
    });
  }

  // Buscar boletos pendentes por CPF
  getBoletosByCpf(cpf: string): Observable<PaymentApiInterface> {
    const url: string = `${this.urlBackEnd}/payment/boletos/${cpf}`;
    return this.http.get<PaymentApiInterface>(url);
  }

  // Buscar planos de pagamento
  getPaymentPlans(): Observable<PaymentPlanApiInterface> {
    const url: string = `${this.urlBackEnd}/plan`;
    return this.http.get<PaymentPlanApiInterface>(url);
  }

  // Criar plano de pagamento
  createPaymentPlan(plan: Partial<PaymentPlan>): Observable<PaymentPlan> {
    const url: string = `${this.urlBackEnd}/plan`;
    return this.http.post<PaymentPlan>(url, plan);
  }

  // Atualizar plano de pagamento
  updatePaymentPlan(id: string, plan: Partial<PaymentPlan>): Observable<PaymentPlan> {
    const url: string = `${this.urlBackEnd}/plan/${id}`;
    return this.http.put<PaymentPlan>(url, plan);
  }

  // Deletar plano de pagamento
  deletePaymentPlan(id: string): Observable<void> {
    const url: string = `${this.urlBackEnd}/plan/${id}`;
    return this.http.delete<void>(url);
  }

  // Ativar/Desativar plano
  togglePlanStatus(id: string, active: boolean): Observable<PaymentPlan> {
    const url: string = `${this.urlBackEnd}/plan/${id}/toggle`;
    return this.http.patch<PaymentPlan>(url, { active });
  }

  setClientPlan(clientId: string, planId: string): Observable<any> {
    const url: string = `${this.urlBackEnd}/client/${clientId}/plan`;
    const payload = {
      planId: planId
    }
    return this.http.put<any>(url, payload);
  }

  // Criar plano de pagamento com payload específico
  createPaymentPlanWithPayload(planData: PaymentPlanCreate): Observable<any> {
    const url: string = `${this.urlBackEnd}/payment-plan/create`;
    return this.http.post<any>(url, planData);
  }

  // Buscar estatísticas de pagamentos
  getPaymentStats(): Observable<PaymentStats> {
    const url: string = `${this.urlBackEnd}/payment/stats`;
    return this.http.get<PaymentStats>(url);
  }

  // Método para pagamentos recorrentes
  createRecurringPayment(clientId: string, recurringData: any): Observable<any> {
    const url: string = `${this.urlBackEnd}/payment/recurrence/${clientId}`;
    return this.http.post<any>(url, recurringData);
  }

  // Método temporário com dados mockados para desenvolvimento
  getMockPayments(): Observable<PaymentApiInterface> {
    const mockData: PaymentData[] = [

    ];

    return of({
      data: mockData,
      page: 1,
      pageSize: 10,
      total: mockData.length
    });
  }

  // Método temporário para estatísticas mockadas
  getMockPaymentStats(): Observable<PaymentStats> {
    return of({
      totalPayments: 4,
      pendingPayments: 2,
      paidPayments: 1,
      overduePayments: 1,
      totalAmount: 1050.00,
      paidAmount: 120.00,
      pendingAmount: 930.00
    });
  }
}
