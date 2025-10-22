import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { ObservationService } from '../../../../../../core/observation.service';
import { LocalStorageService } from '../../../../../../core/local-storage.service';
import { PopupService } from '../../../../../../shared/popup/popup.service';
import { ObservationInterface, ObservationCreateInterface, ObservationUpdateInterface, ObservationCategory } from '../../../../../../utils/client/observationInterface';
import ClientInterface from '../../../../../../utils/client/clientInterface';

@Component({
  selector: 'app-client-observations',
  templateUrl: './client-observations.component.html',
  styleUrl: './client-observations.component.scss'
})
export class ClientObservationsComponent implements OnInit {
  observationForm!: FormGroup;
  observations: ObservationInterface[] = [];
  loading: boolean = false;
  editingObservationId: string | null = null;
  currentUser: any;

  // Categorias disponíveis
  categories = [
    { value: 'contact', label: 'Contato', icon: 'phone' },
    { value: 'payment', label: 'Pagamento', icon: 'payment' },
    { value: 'personal', label: 'Pessoal', icon: 'person' },
    { value: 'administrative', label: 'Administrativo', icon: 'business' },
    { value: 'maintenance', label: 'Manutenção', icon: 'build' },
    { value: 'other', label: 'Outros', icon: 'more_horiz' }
  ];

  constructor(
    public dialogRef: MatDialogRef<ClientObservationsComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { client: ClientInterface },
    private fb: FormBuilder,
    private observationService: ObservationService,
    private localStorageService: LocalStorageService,
    private popupService: PopupService
  ) {
    this.initializeForm();
  }

  ngOnInit(): void {
    this.currentUser = this.localStorageService.getItem('user');
    this.loadObservations();
  }

  initializeForm(): void {
    this.observationForm = this.fb.group({
      description: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(500)]],
      category: ['contact', Validators.required]
    });
  }

  loadObservations(): void {
    this.loading = true;
    this.observationService.getObservationsByClientId(this.data.client._id!).subscribe({
      next: (response) => {
        console.log('Observações carregadas:', response);
        this.observations = response.data.notes || [];
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao carregar observações:', error);
        this.observations = [];
        this.loading = false;
      }
    });
  }

  onSubmit(): void {
    if (this.observationForm.valid) {
      const formValue = this.observationForm.value;
      const description = formValue.description.trim();
      const category = formValue.category;

      if (this.editingObservationId) {
        this.updateObservation(description, category);
      } else {
        this.createObservation(description, category);
      }
    }
  }

  createObservation(description: string, category: ObservationCategory): void {
    this.loading = true;

    const newObservation: ObservationCreateInterface = {
      description: description,
      category: category,
      createdBy: this.currentUser?.email || 'usuario@cemiterio.com'
    };

    this.observationService.createObservation(this.data.client._id!, newObservation).subscribe({
      next: (observation) => {
        this.observations.unshift(observation);
        this.resetForm();
        this.popupService.showSuccessMessage('Observação adicionada com sucesso!');
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao criar observação:', error);
        this.popupService.showErrorMessage('Erro ao adicionar observação. Tente novamente.');
        this.loading = false;
      }
    });
  }

  updateObservation(description: string, category: ObservationCategory): void {
    if (!this.editingObservationId) return;

    this.loading = true;

    const updateData: ObservationUpdateInterface = {
      description: description,
      category: category,
      createdBy: this.currentUser?.email || 'usuario@cemiterio.com'
    };

    this.observationService.updateObservation(this.data.client._id!, this.editingObservationId, updateData).subscribe({
      next: (updatedObservation) => {
        const index = this.observations.findIndex(obs => obs._id === this.editingObservationId);
        if (index !== -1) {
          this.observations[index] = updatedObservation;
        }
        this.resetForm();
        this.popupService.showSuccessMessage('Observação atualizada com sucesso!');
        this.loading = false;
      },
      error: (error) => {
        console.error('Erro ao atualizar observação:', error);
        this.popupService.showErrorMessage('Erro ao atualizar observação. Tente novamente.');
        this.loading = false;
      }
    });
  }

  editObservation(observation: ObservationInterface): void {
    this.editingObservationId = observation._id!;
    this.observationForm.patchValue({
      description: observation.description,
      category: observation.category
    });
  }

  deleteObservation(observation: ObservationInterface): void {
    this.popupService.confirmDialog(
      'Confirmar Exclusão',
      `Tem certeza que deseja excluir esta observação?\n\n"${observation.description.substring(0, 50)}${observation.description.length > 50 ? '...' : ''}"`,
      () => {
        this.loading = true;
        this.observationService.deleteObservation(this.data.client._id!, observation._id!).subscribe({
          next: () => {
            this.observations = this.observations.filter(obs => obs._id !== observation._id);
            this.popupService.showSuccessMessage('Observação excluída com sucesso!');
            this.loading = false;
          },
          error: (error) => {
            console.error('Erro ao excluir observação:', error);
            this.popupService.showErrorMessage('Erro ao excluir observação. Tente novamente.');
            this.loading = false;
          }
        });
      }
    );
  }

  cancelEdit(): void {
    this.resetForm();
  }

  resetForm(): void {
    this.editingObservationId = null;
    this.observationForm.reset();
    this.observationForm.patchValue({
      category: 'contact' // Valor padrão
    });
  }

  formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(dateObj);
  }

  formatRelativeTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));

    if (diffDays > 0) {
      return diffDays === 1 ? 'há 1 dia' : `há ${diffDays} dias`;
    } else if (diffHours > 0) {
      return diffHours === 1 ? 'há 1 hora' : `há ${diffHours} horas`;
    } else if (diffMinutes > 0) {
      return diffMinutes === 1 ? 'há 1 minuto' : `há ${diffMinutes} minutos`;
    } else {
      return 'agora mesmo';
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  trackByObservationId(index: number, observation: ObservationInterface): string {
    return observation._id || index.toString();
  }

  getCategoryLabel(category: ObservationCategory): string {
    const categoryObj = this.categories.find(cat => cat.value === category);
    return categoryObj ? categoryObj.label : category;
  }

  getCategoryIcon(category: ObservationCategory): string {
    const categoryObj = this.categories.find(cat => cat.value === category);
    return categoryObj ? categoryObj.icon : 'note';
  }
}
