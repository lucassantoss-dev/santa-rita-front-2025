import { Component, computed, OnInit, signal } from '@angular/core';
import { BreakpointObserver } from '@angular/cdk/layout';
import { Router } from '@angular/router';
import { LocalStorageService } from '../../../../core/local-storage.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss'
})
export class LayoutComponent implements OnInit {
  collapsed = signal(false);
  config: any;
  isMobileView = signal(false);
  openDropdownSignal = signal(false);
  sidenavWidth = computed(() => this.collapsed() ? '65px' : '285px');

  user: any = null;

  sidenavMode = computed(() => {
    return this.isMobileView() ? 'over' : 'side';
  });

  sidenavOpened = computed(() => {
    if (this.isMobileView()) {
      return !this.collapsed();
    }
    return true;
  });

  constructor(
    private router: Router,
    private localStorageService: LocalStorageService,
    private breakpointObserver: BreakpointObserver,
  ) { }

  ngOnInit(): void {
    this.user = this.localStorageService.getItem('user');
    this.breakpointObserver.observe(['(max-width: 1280px)']).subscribe(result => {
      this.isMobileView.set(result.matches);
      if (result.matches) {
        this.collapsed.set(true); // colapsado por padrão no mobile
      }
    });
  }

  handleExpandAndOpenDropdown() {
    this.collapsed.set(false);
    this.openDropdownSignal.set(true);
  }

  abrirConfiguracoes() {
    const url = '/dashboard/settings'
    this.router.navigateByUrl(url);
  }

  editarPerfil() {
    const url = '/dashboard/user-profile'
    this.router.navigateByUrl(url);
  }

  sair() {
    localStorage.removeItem('auth_token');
    this.router.navigate(['/']);
  }

  onOpenedChange(isOpened: boolean) {
    if (!isOpened && this.isMobileView()) {
      this.collapsed.set(true);
    }
  }

  getContentMargin(): string {
    if (this.isMobileView()) {
      return '0';
    }
    return this.collapsed() ? '65px' : '285px';
  }

  handleItemClick(drawer: any) {
    if (this.isMobileView()) {
      this.collapsed.set(true);
      drawer.close();
    }
  }
}
