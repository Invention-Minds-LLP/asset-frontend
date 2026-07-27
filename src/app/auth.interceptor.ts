import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { Auth } from './services/auth/auth';

export const AuthInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const auth = inject(Auth);
  const router = inject(Router);

  if (typeof window === 'undefined') return next(req);

  // External auditors keep their localStorage token (separate portal, out of
  // scope for the refresh-cookie flow). Staff use the in-memory access token.
  const isExternal = localStorage.getItem('userType') === 'EXTERNAL';
  const isAuthEndpoint = req.url.includes('/users/refresh')
    || req.url.includes('/users/login')
    || req.url.includes('/users/logout');

  const token = isExternal ? (localStorage.getItem('authToken') || '') : auth.getToken();

  // withCredentials so the httpOnly refresh + CSRF cookies flow to the API.
  const authReq = req.clone({
    withCredentials: true,
    ...(token && !isAuthEndpoint ? { setHeaders: { Authorization: `Bearer ${token}` } } : {}),
  });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Demo trial ended / blocked. 403 rather than 401 on purpose: this is not a
      // failed session that a refresh could rescue, so send them to a screen that
      // explains why instead of bouncing them round the login page. Requests to
      // the trial console itself are excluded — it must surface its own errors.
      const trialCode: string | undefined = error.error?.code;
      if (
        error.status === 403 &&
        typeof trialCode === 'string' &&
        trialCode.startsWith('TRIAL_') &&
        !req.url.includes('/trial')
      ) {
        sessionStorage.setItem(
          'trialBlockedMessage',
          error.error?.message || 'Your demo period has ended.'
        );
        auth.clearSession();
        if (!router.url.startsWith('/trial-blocked')) {
          router.navigate(['/trial-blocked']);
        }
        return throwError(() => error);
      }

      if (error.status !== 401 || isAuthEndpoint) {
        return throwError(() => error);
      }

      if (isExternal) {
        // External auditor session ended → back to their own login.
        localStorage.removeItem('authToken');
        localStorage.removeItem('userType');
        localStorage.removeItem('externalAuditor');
        router.navigate(['/auditor/login']);
        return throwError(() => error);
      }

      // Staff: attempt a single silent refresh, then retry the original request.
      return auth.refresh().pipe(
        switchMap(() => {
          const fresh = auth.getToken();
          const retried = req.clone({
            withCredentials: true,
            ...(fresh ? { setHeaders: { Authorization: `Bearer ${fresh}` } } : {}),
          });
          return next(retried);
        }),
        catchError(() => {
          // Refresh failed → session is over. The QR scan landing is public, so
          // a background 401 there must NOT hijack the page to /login.
          auth.clearSession();
          if (!router.url.startsWith('/assets/scan/')) {
            router.navigate(['/login']);
          }
          return throwError(() => error);
        })
      );
    })
  );
};
