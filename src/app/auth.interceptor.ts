import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';

export const AuthInterceptor: HttpInterceptorFn = (
  req: HttpRequest<any>,
  next: HttpHandlerFn
): Observable<HttpEvent<any>> => {
  const router = inject(Router);

  if (typeof window !== 'undefined' && localStorage) {
    const token = localStorage.getItem('authToken') || sessionStorage.getItem('authToken');

    let authReq = req;
    if (token) {
      authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`,
        },
      });
    }

    return next(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        // Only 401 (not authenticated / token invalid) ends the session.
        // 403 means "logged in but not allowed" (e.g. a management-only
        // endpoint hit by an HOD) — the calling component handles it; the
        // user must NOT be logged out.
        if (error.status === 401) {
          console.warn(`${error.status} error encountered.`);
          // Remember the session type before wiping it, so external auditors
          // land back on their own portal rather than the staff login.
          const wasExternal = localStorage.getItem('userType') === 'EXTERNAL';
          localStorage.removeItem('authToken');
          sessionStorage.removeItem('authToken');
          localStorage.removeItem('userType');
          localStorage.removeItem('externalAuditor');
          // The QR scan landing is public (name + code shown without login).
          // A background 401 there — e.g. a stale token rejected by the API —
          // must NOT hijack the page to /login. The scan page redirects to
          // login itself only when the user explicitly asks for full details.
          if (wasExternal) {
            router.navigate(['/auditor/login']);
          } else if (!router.url.startsWith('/assets/scan/')) {
            router.navigate(['/login']);
          }
        }
        return throwError(() => error);
      })
    );
  }

  // ✅ Always return the unmodified request if token logic doesn't run
  return next(req);
};

