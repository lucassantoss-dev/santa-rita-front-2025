import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { guardianGuard } from './core/guardian.guard';

const routes: Routes = [
    {
      path: 'login',
      loadChildren: () => import('./features/login/login.module').then(m => m.LoginModule)
    },
    {
      path: 'dashboard',
      loadChildren: () => import('./features/dashboard/dashboard.module').then(m => m.DashboardModule),
      canActivate: [guardianGuard]
    },
    {
      path: 'payments',
      loadChildren: () => import('./features/payment/payment.module').then(m => m.PaymentModule)
      // Removido o guard para permitir acesso direto ao pagamento rápido
    },
    {
      path: '',
      redirectTo: 'login',
      pathMatch: 'full'
    },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
