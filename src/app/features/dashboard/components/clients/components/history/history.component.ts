import { Component, OnInit, Inject, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ClientService } from '../../../../../../core/client.service';
import { PopupService } from '../../../../../../shared/popup/popup.service';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, filter, takeUntil } from 'rxjs/operators';

interface HistoryData {
  clientId?: string;
  clientName?: string;
  preSelectedClient?: any;
  skipConfirmation?: boolean;
}

@Component({
  selector: 'app-history',
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss'
})
export class HistoryComponent implements OnInit, OnDestroy {
  historyForm!: FormGroup;
  loading = false;
  searchResults: any[] = [];
  loadingSearch = false;
  selectedClient: any = null;
  showSuccessDialog = false;
  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  paymentMethods = [
    { value: 'dinheiro', label: 'Dinheiro', icon: 'payments' },
    { value: 'pix', label: 'PIX', icon: 'qr_code' },
    { value: 'boleto', label: 'Boleto', icon: 'receipt' }
  ];

  paymentStatuses = [
    { value: 'pending', label: 'Pendente', icon: 'schedule' },
    { value: 'paid', label: 'Pago', icon: 'check_circle' }
  ];

  constructor(
    private fb: FormBuilder,
    private clientService: ClientService,
    private popupService: PopupService,
    public dialogRef: MatDialogRef<HistoryComponent>,
    @Inject(MAT_DIALOG_DATA) public data: HistoryData
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.setupSearch();

    // Se temos um cliente pré-selecionado, usar ele
    if (this.data.preSelectedClient) {
      this.selectedClient = this.data.preSelectedClient;
      this.historyForm.patchValue({
        clientId: this.selectedClient._id
      });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private setupSearch(): void {
    this.searchSubject.pipe(
      debounceTime(400),
      distinctUntilChanged(),
      filter(term => term.length >= 2),
      switchMap(term => {
        this.loadingSearch = true;
        this.searchResults = [];
        return this.clientService.searchClients({ nome: term });
      }),
      takeUntil(this.destroy$)
    ).subscribe({
      next: (response) => {
        this.searchResults = response.data?.clients || [];
        this.loadingSearch = false;
      },
      error: (error: any) => {
        console.error('Erro na busca:', error);
        this.loadingSearch = false;
        this.searchResults = [];
      }
    });
  }

  private initializeForm(): void {
    this.historyForm = this.fb.group({
      clientId: ['', Validators.required],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      paymentMethod: ['dinheiro', Validators.required],
      defaultStatus: ['pending', Validators.required],
      amount: [0, [Validators.required, Validators.min(0.01)]]
    });
  }

  onSubmit(): void {
    if (this.historyForm.valid && this.selectedClient) {
      this.loading = true;

      const historyData = {
        startDate: this.historyForm.value.startDate,
        endDate: this.historyForm.value.endDate,
        paymentMethod: this.historyForm.value.paymentMethod,
        defaultStatus: this.historyForm.value.defaultStatus,
        amount: this.historyForm.value.amount
      };

      this.clientService.createPaymentHistory(this.selectedClient._id, historyData).subscribe({
        next: (response: any) => {
          this.loading = false;
          this.popupService.showSuccessMessage('Histórico criado com sucesso!');

          // Se deve pular confirmação, fechar o modal imediatamente
          if (this.data.skipConfirmation) {
            this.dialogRef.close(true);
          } else {
            // Mostrar dialog de confirmação personalizado
            this.showSuccessDialog = true;
          }
        },
        error: (error: any) => {
          this.loading = false;
          console.error('Erro ao criar histórico:', error);
          this.popupService.showErrorMessage('Erro ao criar histórico de pagamento');
        }
      });
    }
  }

  onClientSearch(searchTerm: string): void {
    if (searchTerm.length >= 2) {
      this.searchSubject.next(searchTerm);
    } else {
      this.searchResults = [];
      this.loadingSearch = false;
    }
  }

  onClientSelect(client: any): void {
    this.selectedClient = client;
    this.historyForm.patchValue({
      clientId: client._id
    });
    this.searchResults = [];
  }

  clearClientSelection(): void {
    // Não permitir limpar se é um cliente pré-selecionado
    if (this.data.preSelectedClient) {
      return;
    }

    this.selectedClient = null;
    this.historyForm.patchValue({
      clientId: ''
    });
  }

  private resetForm(): void {
    this.historyForm.reset();
    this.historyForm.patchValue({
      paymentMethod: 'dinheiro',
      defaultStatus: 'pending',
      amount: 0
    });

    // Se há cliente pré-selecionado, restaurar ele
    if (this.data.preSelectedClient) {
      this.selectedClient = this.data.preSelectedClient;
      this.historyForm.patchValue({
        clientId: this.selectedClient._id
      });
    } else {
      this.selectedClient = null;
    }

    this.searchResults = [];
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  getSelectedClientName(): string {
    return this.selectedClient ? `${this.selectedClient.nome} ${this.selectedClient.sobrenome}` : '';
  }

  formatDateRange(): string {
    const startDate = this.historyForm.value.startDate;
    const endDate = this.historyForm.value.endDate;

    if (startDate && endDate) {
      const start = new Date(startDate).toLocaleDateString('pt-BR');
      const end = new Date(endDate).toLocaleDateString('pt-BR');
      return `${start} até ${end}`;
    }
    return '';
  }

  getPaymentMethodLabel(): string {
    const method = this.historyForm.value.paymentMethod;
    const paymentMethod = this.paymentMethods.find(pm => pm.value === method);
    return paymentMethod ? paymentMethod.label : '';
  }

  getStatusLabel(): string {
    const status = this.historyForm.value.defaultStatus;
    const paymentStatus = this.paymentStatuses.find(ps => ps.value === status);
    return paymentStatus ? paymentStatus.label : '';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  }

  continueCreating() {
    this.showSuccessDialog = false;
    this.resetForm();
  }

  closeModal() {
    this.showSuccessDialog = false;
    this.dialogRef.close(true);
  }
}
