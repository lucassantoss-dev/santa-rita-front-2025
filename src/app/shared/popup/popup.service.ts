import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { PopupType, PopupSize } from './popup.component';

export interface PopupConfig {
  type?: PopupType;
  size?: PopupSize;
  title?: string;
  message?: string;
  showCloseButton?: boolean;
  showConfirmButton?: boolean;
  showCancelButton?: boolean;
  confirmText?: string;
  cancelText?: string;
  closeOnBackdropClick?: boolean;
  icon?: string;
  customClass?: string;
  position?: 'center' | 'top-right' | 'top-center';
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
}

@Injectable({
  providedIn: 'root'
})
export class PopupService {
  private popupState = new BehaviorSubject<PopupConfig & { isVisible: boolean }>({
    isVisible: false,
    type: 'info',
    size: 'medium',
    title: '',
    message: '',
    showCloseButton: true,
    showConfirmButton: false,
    showCancelButton: false,
    confirmText: 'Confirmar',
    cancelText: 'Cancelar',
    closeOnBackdropClick: true,
    icon: '',
    customClass: '',
    position: 'center'
  });

  public popupState$ = this.popupState.asObservable();

  constructor() { }

  // Métodos de conveniência para diferentes tipos de popup
  success(title: string, message: string, config?: Partial<PopupConfig>): void {
    this.show({
      type: 'success',
      title,
      message,
      ...config
    });
  }

  error(title: string, message: string, config?: Partial<PopupConfig>): void {
    this.show({
      type: 'error',
      title,
      message,
      ...config
    });
  }

  warning(title: string, message: string, config?: Partial<PopupConfig>): void {
    this.show({
      type: 'warning',
      title,
      message,
      ...config
    });
  }

  info(title: string, message: string, config?: Partial<PopupConfig>): void {
    this.show({
      type: 'info',
      title,
      message,
      ...config
    });
  }

  confirmDialog(title: string, message: string, onConfirm: () => void, onCancel?: () => void): void {
    this.show({
      type: 'confirm',
      title,
      message,
      showConfirmButton: true,
      showCancelButton: true,
      onConfirm,
      onCancel
    });
  }

  // Método principal para mostrar popup
  show(config: PopupConfig): void {
    // Se for um popup de confirmação e já tem um visível, resetar primeiro
    if (config.type === 'confirm' && this.popupState.getValue().isVisible) {
      this.resetState();
      // Aguardar um tick para garantir que o estado foi limpo
      setTimeout(() => {
        this.displayPopup(config);
      }, 50);
    } else {
      this.displayPopup(config);
    }
  }

  private displayPopup(config: PopupConfig): void {
    const currentState = this.popupState.getValue();
    this.popupState.next({
      ...currentState,
      ...config,
      isVisible: true
    });
  }

  // Fechar popup
  close(): void {
    const currentState = this.popupState.getValue();
    if (currentState.onClose) {
      currentState.onClose();
    }
    // Reset completo do estado para evitar problemas entre chamadas
    this.popupState.next({
      isVisible: false,
      type: 'info',
      size: 'medium',
      title: '',
      message: '',
      showCloseButton: true,
      showConfirmButton: false,
      showCancelButton: false,
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      closeOnBackdropClick: true,
      icon: '',
      customClass: '',
      position: 'center',
      onConfirm: undefined,
      onCancel: undefined,
      onClose: undefined
    });
  }

  // Executar ação de confirmação
  executeConfirm(): void {
    const currentState = this.popupState.getValue();
    if (currentState.onConfirm) {
      currentState.onConfirm();
    }
    this.close();
  }

  // Cancelar popup
  cancel(): void {
    const currentState = this.popupState.getValue();
    if (currentState.onCancel) {
      currentState.onCancel();
    }
    this.close();
  }

  // Métodos utilitários para casos comuns
  showSuccessMessage(message: string): void {
    this.show({
      type: 'success',
      title: '',
      message: message,
      position: 'top-right',
      size: 'small',
      showCloseButton: false
    });
  }

  showErrorMessage(message: string): void {
    this.show({
      type: 'error',
      title: '',
      message: message,
      position: 'top-right',
      size: 'small',
      showCloseButton: false
    });
  }

  showInfoMessage(message: string): void {
    this.show({
      type: 'info',
      title: '',
      message: message,
      position: 'top-right',
      size: 'small',
      showCloseButton: false
    });
  }

  showWarningMessage(message: string): void {
    this.show({
      type: 'warning',
      title: '',
      message: message,
      position: 'top-right',
      size: 'small',
      showCloseButton: false
    });
  }

  // Confirmação de exclusão
  confirmDelete(itemName: string, onConfirm: () => void): void {
    // Garantir que o estado anterior está limpo
    this.resetState();

    // Aguardar um tick antes de mostrar o novo popup
    setTimeout(() => {
      this.confirmDialog(
        'Confirmar Exclusão',
        `Tem certeza que deseja excluir "${itemName}"? Esta ação não pode ser desfeita.`,
        onConfirm
      );
    }, 50);
  }

  // Método para resetar completamente o estado
  private resetState(): void {
    this.popupState.next({
      isVisible: false,
      type: 'info',
      size: 'medium',
      title: '',
      message: '',
      showCloseButton: true,
      showConfirmButton: false,
      showCancelButton: false,
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      closeOnBackdropClick: true,
      icon: '',
      customClass: '',
      position: 'center',
      onConfirm: undefined,
      onCancel: undefined,
      onClose: undefined
    });
  }

  // Confirmação genérica customizada
  confirmWithCustomText(title: string, message: string, onConfirm: () => void, confirmText: string = 'Confirmar'): void {
    this.show({
      type: 'confirm',
      title,
      message,
      showConfirmButton: true,
      showCancelButton: true,
      confirmText,
      onConfirm
    });
  }
}
