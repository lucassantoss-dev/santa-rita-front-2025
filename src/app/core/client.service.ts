import { Injectable } from '@angular/core';
import { environment } from '../enviroments/enviroment';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import ClientApiInterface from '../utils/client/clientApiInterface';
import ClientInterface from '../utils/client/clientInterface';
import ClientObjectInterface from '../utils/client/clientObjectInterface';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  urlBackEnd = environment.urlBackEnd;
  constructor(private http: HttpClient) { }

  getAllClients(page: number = 1, limit: number = 10): Observable<ClientApiInterface> {
    const url: string = `${this.urlBackEnd}/client?page=${page}&limit=${limit}`;
    return this.http.get<ClientApiInterface>(url);
  }

  createClient(client: Omit<ClientInterface, '_id' | 'customerId' | 'createdAt' | 'updatedAt'>): Observable<ClientInterface> {
    const url: string = `${this.urlBackEnd}/client`;
    return this.http.post<ClientInterface>(url, client);
  }

  getClientById(id: string): Observable<ClientObjectInterface> {
    const url: string = `${this.urlBackEnd}/client/${id}`;
    return this.http.get<ClientObjectInterface>(url);
  }

  getClientByCpf(cpf: string): Observable<ClientInterface> {
    const url: string = `${this.urlBackEnd}/client/cpf/${cpf}`;
    return this.http.get<ClientInterface>(url);
  }

  removeClient(clientId: string): Observable<ClientInterface> {
    const url: string = `${this.urlBackEnd}/client/${clientId}`;
    return this.http.delete<ClientInterface>(url);
  }

  updateClient(id: string, client: Omit<ClientInterface, '_id' | 'customerId' | 'createdAt' | 'updatedAt'>): Observable<ClientInterface> {
    const url: string = `${this.urlBackEnd}/client/${id}`;
    return this.http.put<ClientInterface>(url, client);
  }

  createPaymentHistory(clientId: string, historyData: {
    startDate: string;
    endDate: string;
    paymentMethod: string;
    defaultStatus?: string;
    amount: number;
  }): Observable<any> {
    const url: string = `${this.urlBackEnd}/v1/monthly-payment-status/client/${clientId}/create-historical`;
    return this.http.post<any>(url, historyData);
  }

  searchClients(searchParams: {
    nome?: string;
    quadra?: string;
    numero?: string;
  }): Observable<ClientApiInterface> {
    const url: string = `${this.urlBackEnd}/v1/client/search`;
    let params = new HttpParams();

    if (searchParams.nome?.trim()) {
      params = params.set('nome', searchParams.nome.trim());
    }
    if (searchParams.quadra?.trim()) {
      params = params.set('quadra', searchParams.quadra.trim());
    }
    if (searchParams.numero?.trim()) {
      params = params.set('numero', searchParams.numero.trim());
    }

    return this.http.get<ClientApiInterface>(url, { params });
  }
}
