import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment.prod';

/**
 * Tenant switch for the Procurement module (Purchase Orders, Goods Receipt, TAT).
 * Driven by TenantConfig key ENABLE_PROCUREMENT — set "false" for clients that
 * don't use procurement (e.g. JMRH) to hide the module everywhere.
 * Missing key or request failure defaults to ENABLED (current behavior).
 */
@Injectable({ providedIn: 'root' })
export class ProcurementFeature {
  private cached: Promise<boolean> | null = null;

  constructor(private http: HttpClient) {}

  isEnabled(): Promise<boolean> {
    if (!this.cached) {
      this.cached = new Promise<boolean>((resolve) => {
        this.http.get<any>(`${environment.apiUrl}/tenant-config/ENABLE_PROCUREMENT`).subscribe({
          next: (cfg) => resolve(cfg?.value !== 'false'),
          error: (err) => {
            // A real 404 (key absent) is authoritative → default ON and cache it.
            // Any other failure (401 before auth is ready, network) must NOT be
            // cached, or a transient error sticks as "enabled" for the whole
            // session — drop the memo so the next call re-fetches.
            if (err?.status !== 404) this.cached = null;
            resolve(true);
          },
        });
      });
    }
    return this.cached;
  }

  /** Drop the memoized value so the next isEnabled() re-fetches from the server. */
  refresh(): void {
    this.cached = null;
  }
}
