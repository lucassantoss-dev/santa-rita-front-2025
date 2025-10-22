import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ObservationInterface, ObservationApiInterface, ObservationCreateInterface, ObservationUpdateInterface } from '../utils/client/observationInterface';
import { environment } from '../enviroments/enviroment';

@Injectable({
  providedIn: 'root'
})
export class ObservationService {
  private apiUrl = environment.urlBackEnd;

  constructor(private http: HttpClient) { }

  // Buscar todas as observações de um cliente
  getObservationsByClientId(clientId: string): Observable<ObservationApiInterface> {
    return this.http.get<ObservationApiInterface>(`${this.apiUrl}/client/${clientId}/notes`);
  }

  // Criar nova observação
  createObservation(clientId: string, observation: ObservationCreateInterface): Observable<ObservationInterface> {
    return this.http.post<ObservationInterface>(`${this.apiUrl}/client/${clientId}/notes`, observation);
  }

  // Atualizar observação existente
  updateObservation(clientId: string, observationId: string, observation: ObservationUpdateInterface): Observable<ObservationInterface> {
    return this.http.put<ObservationInterface>(`${this.apiUrl}/client/${clientId}/notes/by-id/${observationId}`, observation);
  }

  // Deletar observação
  deleteObservation(clientId: string, observationId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/client/${clientId}/notes/by-id/${observationId}`);
  }

  // Buscar observação por ID
  getObservationById(clientId: string, observationId: string): Observable<ObservationInterface> {
    return this.http.get<ObservationInterface>(`${this.apiUrl}/client/${clientId}/notes/by-id/${observationId}`);
  }
}
