import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { LoginInterface } from '../features/login/interfaces/login-interface';
import { Observable } from 'rxjs';
import { environment } from '../enviroments/enviroment';

@Injectable({
	providedIn: 'root'
})
export class LoginService {
	urlBackEnd = environment.urlBackEnd;
	constructor(private http: HttpClient) { }

	getUser(): Observable<LoginInterface> {
		const url: string = `${this.urlBackEnd}/login`;
		return this.http.get<LoginInterface>(url);
	}

	login(params: LoginInterface): Observable<LoginInterface> {
		const url: string = `${this.urlBackEnd}/login`;
		return this.http.post<LoginInterface>(url, params);
	}
}
