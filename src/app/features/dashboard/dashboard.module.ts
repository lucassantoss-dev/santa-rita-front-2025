import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { HomeComponent } from './components/home/home.component';
import { DashboardComponent } from './dashboard.component';
import { LayoutComponent } from './components/layout/layout.component';
import { MaterialModule } from '../../material-module';
import { SidenavComponent } from './components/layout/sidenav/sidenav.component';
import { ClientsComponent } from './components/clients/clients.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ClientFormComponent } from './components/clients/components/client-form/client-form.component';
import { LoadingComponent } from '../../shared/loading/loading.component';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';

@NgModule({
  declarations: [
    HomeComponent,
    DashboardComponent,
    LayoutComponent,
    SidenavComponent,
    ClientsComponent,
    ClientFormComponent,
    LoadingComponent
  ],
  imports: [
    CommonModule,
    DashboardRoutingModule,
    MaterialModule,
    FormsModule,
    ReactiveFormsModule,
    NgxMaskDirective,
    NgxMaskPipe
  ],
  providers: [
    provideNgxMask()
  ]
})
export class DashboardModule { }
