import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { ProcurementFeature } from './services/procurement-feature/procurement-feature';

// Blocks direct URL access to procurement screens for tenants that have the
// module disabled (TenantConfig ENABLE_PROCUREMENT=false, e.g. JMRH). Pair with
// authGuard on the route: [authGuard, procurementGuard].
export const procurementGuard: CanActivateFn = async () => {
  const feature = inject(ProcurementFeature);
  const router = inject(Router);

  const enabled = await feature.isEnabled();
  if (enabled) return true;

  router.navigate(['/master-dashboard']);
  return false;
};
