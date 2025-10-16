import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { LoginService } from '../../../../core/login.service';
import { Router } from '@angular/router';
import { LocalStorageService } from '../../../../core/local-storage.service';
import { PopupService } from '../../../../shared/popup/popup.service';

@Component({
	selector: 'app-login-form',
	templateUrl: './login-form.component.html',
	styleUrls: ['./login-form.component.scss']
})
export class LoginFormComponent implements OnInit {
	form: FormGroup = this.formBuilder.group({
		email: new FormControl('', [Validators.required, Validators.email]),
		password: new FormControl('', [Validators.required, Validators.minLength(6)]),
	});
  config: any;
  showPassword = false;

	constructor(
		private formBuilder: FormBuilder,
		private loginService: LoginService,
		private localStorage: LocalStorageService,
		private router: Router,
    private popupService: PopupService
	) { }

	ngOnInit(): void {
    // Garantir que os campos estejam sempre vazios
    this.form.reset();
    this.form.patchValue({
      email: '',
      password: ''
    });

    // Limpar qualquer cache de formulário
    setTimeout(() => {
      this.clearFormCache();
    }, 100);
	}

  private clearFormCache(): void {
    // Forçar limpeza dos campos para prevenir autocomplete
    const emailInput = document.getElementById('email') as HTMLInputElement;
    const passwordInput = document.getElementById('password') as HTMLInputElement;

    if (emailInput) {
      emailInput.value = '';
      emailInput.setAttribute('autocomplete', 'new-email');
    }

    if (passwordInput) {
      passwordInput.value = '';
      passwordInput.setAttribute('autocomplete', 'new-password');
    }
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

	handleLogin(): void {
		if (this.form.valid) {
			const formvalue = Object.assign({}, this.form.getRawValue());
			this.loginService.login(formvalue).subscribe({
				next: (data: any) => {
					const url = `/dashboard`;
					this.router.navigate([url]).then((res: boolean) => res).catch((error) => console.error(error));
					this.popupService.showSuccessMessage('Login realizado com sucesso!');
					this.localStorage.setItem('token', data.data.token.token);
					this.localStorage.setItem('user', data.data.token.user)
				}, error: (error: Error) => {
					this.popupService.showErrorMessage('Erro ao realizar login. Verifique suas credenciais e tente novamente.');
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
