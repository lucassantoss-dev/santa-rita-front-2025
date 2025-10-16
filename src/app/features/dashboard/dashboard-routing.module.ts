import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { DashboardComponent } from './dashboard.component';
import { ClientsComponent } from './components/clients/clients.component';
import { ClientFormComponent } from './components/clients/components/client-form/client-form.component';
import { PaymentsComponent } from './components/payments/payments.component';
import { PaymentFormComponent } from './components/payments/components/payment-form/payment-form.component';
import { PlanComponent } from './components/payments/components/plan/plan.component';
import { ConfigurationsComponent } from './components/configurations/configurations.component';
import { ProfileComponent } from './components/profile/profile.component';
import { PlansComponent } from './components/plans/plans.component';
import { ClientPaymentsComponent } from './components/clients/components/client-payments/client-payments.component';

const routes: Routes = [
  {
    path: '',
    component: DashboardComponent,
    children: [
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
      {
        path: 'home',
        component: HomeComponent,
      },
      {
        path: 'clients',
        component: ClientsComponent,
      },
      {
        path: 'client-create',
        component: ClientFormComponent
      },
      {
        path: 'client-edit/:id',
        component: ClientFormComponent
      },
      {
        path: 'client-payments/:id',
        component: ClientPaymentsComponent
      },
      {
        path: 'payments',
        component: PaymentsComponent
      },
      {
        path: 'payments/create',
        component: PaymentFormComponent
      },
      {
        path: 'plan/create',
        component: PlanComponent
      },
      {
        path: 'configurations',
        component: ConfigurationsComponent
      },
      {
        path: 'profile',
        component: ProfileComponent
      },
      {
        path: 'plans',
        component: PlansComponent
      },
      {
        path: '**',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardRoutingModule {}
