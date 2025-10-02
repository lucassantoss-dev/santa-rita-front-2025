import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';

interface SystemConfig {
  siteName: string;
  maxClients: number;
  backupEnabled: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  autoBackupFrequency: string;
  maintenanceMode: boolean;
  defaultPaymentDays: number;
}

@Component({
  selector: 'app-configurations',
  templateUrl: './configurations.component.html',
  styleUrl: './configurations.component.scss'
})
export class ConfigurationsComponent implements OnInit {
  configForm!: FormGroup;
  isLoading = false;
  configs: SystemConfig = {
    siteName: 'Cemitério Santa Rita',
    maxClients: 1000,
    backupEnabled: true,
    emailNotifications: true,
    smsNotifications: false,
    autoBackupFrequency: 'daily',
    maintenanceMode: false,
    defaultPaymentDays: 30
  };

  backupFrequencies = [
    { value: 'daily', label: 'Diário' },
    { value: 'weekly', label: 'Semanal' },
    { value: 'monthly', label: 'Mensal' }
  ];

  constructor(
    private fb: FormBuilder,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.initForm();
  }

  initForm(): void {
    this.configForm = this.fb.group({
      siteName: [this.configs.siteName, [Validators.required, Validators.minLength(3)]],
      maxClients: [this.configs.maxClients, [Validators.required, Validators.min(1)]],
      backupEnabled: [this.configs.backupEnabled],
      emailNotifications: [this.configs.emailNotifications],
      smsNotifications: [this.configs.smsNotifications],
      autoBackupFrequency: [this.configs.autoBackupFrequency, Validators.required],
      maintenanceMode: [this.configs.maintenanceMode],
      defaultPaymentDays: [this.configs.defaultPaymentDays, [Validators.required, Validators.min(1), Validators.max(365)]]
    });
  }

  onSave(): void {
    if (this.configForm.valid) {
      this.isLoading = true;

      // Simulação de salvamento
      setTimeout(() => {
        this.configs = { ...this.configForm.value };
        this.isLoading = false;
        this.snackBar.open('Configurações salvas com sucesso!', 'Fechar', {
          duration: 3000,
          horizontalPosition: 'right',
          verticalPosition: 'top'
        });
      }, 1500);
    }
  }

  onBackup(): void {
    this.isLoading = true;
    // Simulação de backup
    setTimeout(() => {
      this.isLoading = false;
      this.snackBar.open('Backup criado com sucesso!', 'Fechar', {
        duration: 3000,
        horizontalPosition: 'right',
        verticalPosition: 'top'
      });
    }, 2000);
  }

  onRestore(): void {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.backup';
    input.onchange = (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.isLoading = true;
        // Simulação de restore
        setTimeout(() => {
          this.isLoading = false;
          this.snackBar.open('Sistema restaurado com sucesso!', 'Fechar', {
            duration: 3000,
            horizontalPosition: 'right',
            verticalPosition: 'top'
          });
        }, 3000);
      }
    };
    input.click();
  }

  onReset(): void {
    this.configForm.reset();
    this.initForm();
    this.snackBar.open('Formulário resetado!', 'Fechar', {
      duration: 2000,
      horizontalPosition: 'right',
      verticalPosition: 'top'
    });
  }
}
