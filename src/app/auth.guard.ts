import { CanActivateFn } from '@angular/router';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { Auth } from './services/auth/auth';
export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(Auth);
  const router = inject(Router);

  if (typeof window === 'undefined') {
    return false;
  }

  // if (!authService.isLoggedIn()) {
  //   console.log('User not authenticated, redirecting to login page');
  //   return router.createUrlTree(['/login']);  // ✅ declarative redirect
  // }

  const isLoggedIn = authService.isLoggedIn();
  console.log('[authGuard] isLoggedIn:', isLoggedIn);

  if (!isLoggedIn) {
    console.log('User not authenticated, redirecting to login page');
    return router.createUrlTree(['/login']);
  }

  return true;
};
