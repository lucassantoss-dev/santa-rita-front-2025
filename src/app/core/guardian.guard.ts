import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { LocalStorageService } from './local-storage.service';

export const guardianGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const localStorageService = inject(LocalStorageService);

  // Verifica se existe um token de autenticação
  const token = localStorageService.getItem('token');
  const user = localStorageService.getItem('user');

  if (token && user) {
    return true;
  } else {
    // Se não estiver autenticado, redireciona para login
    router.navigate(['/login']);
    return false;
  }
};
