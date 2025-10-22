import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { HomeComponent } from './components/home/home.component';
import { DashboardComponent } from './dashboard.component';
import { LayoutComponent } from './components/layout/layout.component';
import { MaterialModule } from '../../material-module';
import { SidenavComponent } from './components/layout/sidenav/sidenav.component';
import { ClientsComponent } from './components/clients/clients.component';
import { PaymentsComponent } from './components/payments/payments.component';
import { PaymentFormComponent } from './components/payments/components/payment-form/payment-form.component';
import { QuickPaymentComponent } from './components/payments/components/quick-payment/quick-payment.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ClientFormComponent } from './components/clients/components/client-form/client-form.component';
import { LoadingComponent } from '../../shared/loading/loading.component';
import { NgxMaskDirective, NgxMaskPipe, provideNgxMask } from 'ngx-mask';
import { ProfileComponent } from './components/profile/profile.component';
import { ConfigurationsComponent } from './components/configurations/configurations.component';
import { ClientPlanAssociationComponent } from './components/clients/components/client-plan-association/client-plan-association.component';
import { PlansComponent } from './components/plans/plans.component';
import { ClientPaymentsComponent } from './components/clients/components/client-payments/client-payments.component';
import { HistoryComponent } from './components/clients/components/history/history.component';
import { PaymentDetailsDialogComponent } from './components/clients/components/client-payments/client-payments.component';
import { ClientObservationsComponent } from './components/clients/components/client-observations/client-observations.component';

@NgModule({
  declarations: [
    HomeComponent,
    DashboardComponent,
    LayoutComponent,
    SidenavComponent,
    ClientsComponent,
    PaymentsComponent,
    PaymentFormComponent,
    QuickPaymentComponent,
    ClientFormComponent,
    LoadingComponent,
    ConfigurationsComponent,
    ProfileComponent,
    ClientPlanAssociationComponent,
    PlansComponent,
    ClientPaymentsComponent,
    HistoryComponent,
    PaymentDetailsDialogComponent,
    ClientObservationsComponent
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
