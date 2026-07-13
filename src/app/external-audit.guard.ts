import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { ExternalAuthService } from './services/external-auth/external-auth';

// Gate for the /auditor/* portal. Requires an EXTERNAL session; anyone else
// (no session, or a staff session) is sent to the auditor login.
export const externalAuditGuard: CanActivateFn = () => {
  const auth = inject(ExternalAuthService);
  const router = inject(Router);

  if (typeof window !== 'undefined' && auth.isExternalAuditor()) {
    return true;
  }
  router.navigate(['/auditor/login']);
  return false;
};
