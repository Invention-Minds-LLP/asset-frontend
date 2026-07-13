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
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // An external auditor session must never reach the staff app — send them
    // back to their own portal (they have no staff role/user and their JWT is
    // rejected by staff endpoints anyway).
    if (localStorage.getItem('userType') === 'EXTERNAL') {
      router.navigate(['/auditor/audits']);
      return false;
    }
  }
  return true;
};
