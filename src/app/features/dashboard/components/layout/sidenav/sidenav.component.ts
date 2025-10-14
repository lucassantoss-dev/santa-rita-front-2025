import { Component, computed, EventEmitter, Input, OnInit, Output, Signal, signal } from '@angular/core';
import { Router } from '@angular/router';
import { ActivityService } from '../../../../../core/activity.service';
export type MenuItem = {
  icon: string;
  label: string;
  route?: string;
  isDropdown?: boolean;
  children?: MenuItem[];
  isDivider?: boolean;
  isLogout?: boolean;
}
@Component({
  selector: 'app-sidenav',
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss'
})
export class SidenavComponent implements OnInit {
  sidenavCollapsed = signal(false);
  dropdownOpen = signal(false);
  config: any;
  logoUrl!: string;
  private _openDropdown = false;
  @Output() itemClicked = new EventEmitter<void>();
  @Output() requestExpandAndOpenDropdown = new EventEmitter<void>();
  @Input() set collapsed(val: boolean) {
    this.sidenavCollapsed.set(val);
  }
  @Input() set openDropdownSignal(value: boolean) {
    if (value && !this.dropdownOpen()) {
      this.dropdownOpen.set(true);
    }
  }
  menuItems = signal<MenuItem[]>([]);
  constructor(
    private router: Router,
    private activityService: ActivityService
  ) { }

  ngOnInit(): void {
    const logoDefault = 'assets/logo-n.png';
    this.logoUrl = this.config?.config?.branding?.logoUrl || logoDefault;

    this.buildMenu();
  };

  buildMenu() {
    const items: MenuItem[] = [];

    items.push({
      icon: 'home',
      label: 'Início',
      route: 'dashboard/home'
    });

      items.push({
        icon: 'person',
        label: 'Clientes',
        route: 'dashboard/clients'
      });

      items.push({
        icon: 'description',
        label: 'Pagamentos',
        route: 'dashboard/payments'
      });

      items.push({
        icon: 'subscriptions',
        label: 'Planos',
        route: 'dashboard/plans'
      });

      items.push({
        icon: 'account_circle',
        label: 'Meu Perfil',
        route: 'dashboard/profile'
      });

      // Divider antes do logout
      items.push({
        icon: '',
        label: '',
        isDivider: true
      });

      items.push({
        icon: 'logout',
        label: 'Sair',
        isLogout: true
      });

      // const children: MenuItem[] = [];

      // children.push({ icon: 'monitor', label: 'Equipamentos', route: 'dashboard/equipments' });
      // children.push({ icon: 'place', label: 'Zona', route: 'dashboard/zone' });
      // children.push({ icon: 'person', label: 'Perfil', route: 'dashboard/route' });
      // children.push({ icon: 'vpn_key', label: 'Grupo de Face', route: 'dashboard/face-group' });

      // if (children.length > 0) {
      //   items.push({
      //     icon: 'security',
      //     label: 'Controle de Acesso',
      //     isDropdown: true,
      //     children
      //   });
      // }

      // items.push({
      //   icon: 'admin_panel_settings',
      //   label: 'Permissões',
      //   route: 'dashboard/permissions'
      // });

      // items.push({
      //   icon: this.getUserIconByScreenType(),
      //   label: 'Usuários',
      //   route: 'dashboard/users'
      // });

      // items.push({
      //   icon: 'business',
      //   label: 'Organizações',
      //   route: 'dashboard/organizations'
      // });

    this.menuItems.set(items);
  }

  profilePicSize = computed(() => this.sidenavCollapsed() ? '32' : '100');

  ngAfterViewInit() {
    setTimeout(() => {
      console.log("Router Active:", document.querySelectorAll('.selected-menu-item'));
    }, 500);
  }

  toggleDropdown() {
    this.dropdownOpen.set(!this.dropdownOpen());
  }

  handleDropdownClick() {
    if (this.sidenavCollapsed()) {
      this.requestExpandAndOpenDropdown.emit();
    } else {
      this.toggleDropdown();
    }
  }

  isActive(route: string): boolean {
    return this.router.url.includes(route);
  }

  navigateAndClose(route: string | undefined, item?: MenuItem) {
    if (item?.isLogout) {
      this.sair();
      return;
    }

    if (route) {
      this.router.navigate([route]);
      if (window.innerWidth < 1280) {
        this.itemClicked.emit();
      }
    }
  }

  sair() {
    // Registrar atividade de logout
    const userName = 'Usuário'; // Em produção, pegar do serviço de autenticação
    this.activityService.addLogoutActivity(userName);

    localStorage.removeItem('auth_token');
    this.router.navigate(['/']);
  }

  /**
   * Retorna o ícone de usuários conforme o tipo da tela.
   * Altere a lógica conforme necessário para identificar o tipo da tela.
   */
  getUserIconByScreenType(): string {
    // Exemplo: baseando-se em uma propriedade fictícia 'screenType'.
    // Substitua por sua lógica real.
    if (this.config?.screenType === 'admin') {
      return 'admin_panel_settings';
    } else if (this.config?.screenType === 'user') {
      return 'person';
    } else if (this.config?.screenType === 'agente') {
      return 'badge';
    }
    // Ícone padrão
    return 'group';
  }
}
