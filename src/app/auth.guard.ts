import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from './services/auth/auth';
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);

  if (typeof window !== 'undefined' && localStorage) {
    const token = localStorage.getItem('authToken') 

    if (!token) {
      console.warn('No auth token found, redirecting to login page');
      router.navigate(['/login']);
      return false;
    }
  }
  return true;
};
