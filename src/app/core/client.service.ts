import { Injectable } from '@angular/core';
import { environment } from '../enviroments/enviroment';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import ClientApiInterface from '../utils/client/clientApiInterface';
import ClientInterface from '../utils/client/clientInterface';

@Injectable({
  providedIn: 'root'
})
export class ClientService {
  urlBackEnd = environment.urlBackEnd;
  constructor(private http: HttpClient) { }

  getAllClients(): Observable<ClientApiInterface> {
    const url: string = `${this.urlBackEnd}/client`;
    return this.http.get<ClientApiInterface>(url);
  }

  createClient(client: ClientInterface): Observable<ClientInterface> {
    const url: string = `${this.urlBackEnd}/client`;
    return this.http.post<ClientInterface>(url, client);
  }
}
