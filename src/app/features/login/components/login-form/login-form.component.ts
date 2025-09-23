import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { LoginService } from '../../../../core/login.service';
import { Router } from '@angular/router';
import { LocalStorageService } from '../../../../core/local-storage.service';

@Component({
	selector: 'app-login-form',
	templateUrl: './login-form.component.html',
	styleUrls: ['./login-form.component.scss']
})
export class LoginFormComponent implements OnInit {
	form: FormGroup = this.formBuilder.group({
		email: new FormControl('lucassantossdev1@gmail.com', [Validators.required]),
		password: new FormControl('9204Spfc!', [Validators.required]),
	});
  config: any;
  showPassword = false;

	constructor(
		private formBuilder: FormBuilder,
		private loginService: LoginService,
		private localStorage: LocalStorageService,
		private router: Router
	) { }

	ngOnInit(): void {
	}

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

	handleLogin(): void {
		if (this.form.valid) {
			const formvalue = Object.assign({}, this.form.getRawValue());
      console.log('formvalue', formvalue);
			this.loginService.login(formvalue).subscribe({
				next: (data: any) => {
					console.log('realizou login!', data);
					this.localStorage.setItem('token', data.data.token.token);
					this.localStorage.setItem('user', data.data.token.user)
					const url = `/dashboard`;
					this.router.navigate([url]).then((res: boolean) => res).catch((error) => console.error(error));
				}, error: (error: Error) => {
					console.error('Ocorreu um erro ao realizar login', error);
					// Remover navegação automática em caso de erro para debugar
					// const url = `/dashboard`;
					// this.router.navigate([url]).then((res: boolean) => res).catch((error) => console.error(error));
				}
			})
		}
	}

  redirectToPayment(): void {
    const url = `/payments`;
    this.router.navigate([url]).then((res: boolean) => res).catch((error) => console.error(error));
  }
}
