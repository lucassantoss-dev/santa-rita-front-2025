import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  department: string;
  avatar: string;
  lastLogin: Date;
  createdAt: Date;
}

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrl: './profile.component.scss'
})
export class ProfileComponent implements OnInit {
  profileForm!: FormGroup;
  passwordForm!: FormGroup;
  isLoading = false;
  isEditMode = false;
  hideCurrentPassword = true;
  hideNewPassword = true;
  hideConfirmPassword = true;

  user: UserProfile = {
    id: '001',
    name: 'Administrador do Sistema',
    email: 'admin@cemiterio.com.br',
    phone: '(11) 98765-4321',
    role: 'Administrador',
    department: 'Gestão Geral',
    avatar: 'https://www.gravatar.com/avatar/default?d=identicon&s=150',
    lastLogin: new Date(),
    createdAt: new Date(2024, 0, 1)
  };

  departments = [
    { value: 'gestao-geral', label: 'Gestão Geral' },
    { value: 'financeiro', label: 'Financeiro' },
    { value: 'administrativo', label: 'Administrativo' },
    { value: 'operacional', label: 'Operacional' }
  ];

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForms();
  }

  initForms(): void {
    this.profileForm = this.fb.group({
      name: [{ value: this.user.name, disabled: !this.isEditMode }, [Validators.required, Validators.minLength(3)]],
      email: [{ value: this.user.email, disabled: !this.isEditMode }, [Validators.required, Validators.email]],
      phone: [{ value: this.user.phone, disabled: !this.isEditMode }, [Validators.required]],
      department: [{ value: this.user.department, disabled: !this.isEditMode }, Validators.required]
    });

    this.passwordForm = this.fb.group({
      currentPassword: ['', Validators.required],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(form: FormGroup) {
    const newPassword = form.get('newPassword');
    const confirmPassword = form.get('confirmPassword');

    if (newPassword && confirmPassword && newPassword.value !== confirmPassword.value) {
      confirmPassword.setErrors({ mismatch: true });
    } else {
      if (confirmPassword?.hasError('mismatch')) {
        confirmPassword.setErrors(null);
      }
    }
    return null;
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;

    if (this.isEditMode) {
      this.profileForm.enable();
    } else {
      this.profileForm.disable();
      // Reseta para os valores originais se cancelar
      this.profileForm.patchValue({
        name: this.user.name,
        email: this.user.email,
        phone: this.user.phone,
        department: this.user.department
      });
    }
  }

  onSaveProfile(): void {
    if (this.profileForm.valid) {
      this.isLoading = true;

      // Simulação de salvamento
      setTimeout(() => {
        this.user = { ...this.user, ...this.profileForm.value };
        this.isLoading = false;
        this.isEditMode = false;
        this.profileForm.disable();

        this.snackBar.open('Perfil atualizado com sucesso!', 'Fechar', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      }, 1500);
    }
  }

  onChangePassword(): void {
    if (this.passwordForm.valid) {
      this.isLoading = true;

      // Simulação de mudança de senha
      setTimeout(() => {
        this.isLoading = false;
        this.passwordForm.reset();

        this.snackBar.open('Senha alterada com sucesso!', 'Fechar', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      }, 2000);
    }
  }

  onUploadAvatar(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Simulação de upload
      this.isLoading = true;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        setTimeout(() => {
          this.user.avatar = e.target.result;
          this.isLoading = false;
          this.snackBar.open('Avatar atualizado com sucesso!', 'Fechar', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
        }, 1000);
      };
      reader.readAsDataURL(file);
    }
  }

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }
}
