import { Component, OnInit, OnDestroy, HostListener } from '@angular/core';
import { Subscription } from 'rxjs';
import { PopupService, PopupConfig } from './popup.service';
import { trigger, state, style, transition, animate } from '@angular/animations';

export type PopupType = 'success' | 'warning' | 'error' | 'info' | 'confirm';
export type PopupSize = 'small' | 'medium' | 'large';

@Component({
  selector: 'app-popup',
  templateUrl: './popup.component.html',
  styleUrl: './popup.component.scss',
  animations: [
    trigger('fadeInOut', [
      state('in', style({ opacity: 1 })),
      transition('void => *', [
        style({ opacity: 0 }),
        animate(300)
      ]),
      transition('* => void', [
        animate(300, style({ opacity: 0 }))
      ])
    ]),
    trigger('slideInOut', [
      state('in', style({ transform: 'translateY(0) scale(1)', opacity: 1 })),
      transition('void => *', [
        style({ transform: 'translateY(-30px) scale(0.95)', opacity: 0 }),
        animate('300ms ease-out')
      ]),
      transition('* => void', [
        animate('300ms ease-in', style({ transform: 'translateY(-30px) scale(0.95)', opacity: 0 }))
      ])
    ]),
    trigger('slideInOutTopRight', [
      state('in', style({ transform: 'translateX(0)', opacity: 1 })),
      transition('void => *', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('400ms cubic-bezier(0.25, 0.8, 0.25, 1)')
      ]),
      transition('* => void', [
        animate('300ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class PopupComponent implements OnInit, OnDestroy {
  isVisible: boolean = false;
  type: PopupType = 'info';
  size: PopupSize = 'medium';
  title: string = '';
  message: string = '';
  showCloseButton: boolean = true;
  showConfirmButton: boolean = false;
  showCancelButton: boolean = false;
  confirmText: string = 'Confirmar';
  cancelText: string = 'Cancelar';
  closeOnBackdropClick: boolean = true;
  icon: string = '';
  customClass: string = '';
  position: 'center' | 'top-right' | 'top-center' = 'center';

  private subscription: Subscription = new Subscription();
  private autoCloseTimer: any;

  constructor(private popupService: PopupService) { }

  ngOnInit(): void {
    this.subscription.add(
      this.popupService.popupState$.subscribe(state => {
        this.isVisible = state.isVisible;
        this.type = state.type || 'info';
        this.size = state.size || 'medium';
        this.title = state.title || '';
        this.message = state.message || '';
        this.showCloseButton = state.showCloseButton ?? true;
        this.showConfirmButton = state.showConfirmButton ?? false;
        this.showCancelButton = state.showCancelButton ?? false;
        this.confirmText = state.confirmText || 'Confirmar';
        this.cancelText = state.cancelText || 'Cancelar';
        this.closeOnBackdropClick = state.closeOnBackdropClick ?? true;
        this.icon = state.icon || '';
        this.customClass = state.customClass || '';
        this.position = state.position || 'center';

        // Auto-close para popups de sucesso e erro (não para confirmações)
        if (state.isVisible && (this.type === 'success' || this.type === 'error' || this.type === 'info') && !this.showConfirmButton) {
          this.setupAutoClose();
        } else {
          this.clearAutoClose();
        }
      })
    );
  }

  ngOnDestroy(): void {
    this.clearAutoClose();
    this.subscription.unsubscribe();
  }

  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.isVisible && this.closeOnBackdropClick) {
      this.close();
    }
  }

  private setupAutoClose(): void {
    this.clearAutoClose();
    const delay = this.type === 'success' ? 3000 : 4000; // 3s para sucesso, 4s para erro/info
    this.autoCloseTimer = setTimeout(() => {
      if (this.isVisible) {
        this.close();
      }
    }, delay);
  }

  private clearAutoClose(): void {
    if (this.autoCloseTimer) {
      clearTimeout(this.autoCloseTimer);
      this.autoCloseTimer = null;
    }
  }

  get popupIcon(): string {
    if (this.icon) return this.icon;

    switch (this.type) {
      case 'success': return 'check_circle';
      case 'warning': return 'warning';
      case 'error': return 'error';
      case 'info': return 'info';
      case 'confirm': return 'help_outline';
      default: return 'info';
    }
  }

  get popupClasses(): string {
    const classes = [
      'popup-container',
      `popup-${this.type}`,
      `popup-${this.size}`,
      `popup-position-${this.position}`,
      this.customClass
    ];
    return classes.filter(cls => cls).join(' ');
  }

  get overlayClasses(): string {
    const classes = [
      'popup-overlay',
      `overlay-position-${this.position}`,
      this.customClass
    ];
    return classes.filter(cls => cls).join(' ');
  }

  close(): void {
    this.clearAutoClose();
    this.popupService.close();
  }

  confirm(): void {
    this.clearAutoClose();
    this.popupService.executeConfirm();
  }

  cancel(): void {
    this.clearAutoClose();
    this.popupService.cancel();
  }

  onMouseEnter(): void {
    // Pausa o auto-close quando o mouse está sobre o popup
    if (this.autoCloseTimer) {
      this.clearAutoClose();
    }
  }

  onMouseLeave(): void {
    // Retoma o auto-close quando o mouse sai do popup
    if (this.isVisible && (this.type === 'success' || this.type === 'error' || this.type === 'info') && !this.showConfirmButton) {
      this.setupAutoClose();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (this.closeOnBackdropClick && event.target === event.currentTarget) {
      this.close();
    }
  }

  stopPropagation(event: MouseEvent): void {
    event.stopPropagation();
  }
}
