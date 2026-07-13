import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment.prod';

/**
 * Tenant switch for all branch-wise UI (filters, tiles, breakdowns, columns).
 * Driven by TenantConfig key ENABLE_BRANCH_FEATURES — set "false" for
 * single-branch clients (e.g. JMRH) to hide branch controls everywhere.
 * Missing key or request failure defaults to ENABLED (current behavior).
 */
@Injectable({ providedIn: 'root' })
export class BranchFeatures {
  private cached: Promise<boolean> | null = null;

  constructor(private http: HttpClient) {}

  isEnabled(): Promise<boolean> {
    if (!this.cached) {
      this.cached = new Promise<boolean>((resolve) => {
        this.http.get<any>(`${environment.apiUrl}/tenant-config/ENABLE_BRANCH_FEATURES`).subscribe({
          next: (cfg) => resolve(cfg?.value !== 'false'),
          error: () => resolve(true), // key absent (404) or error → default on
        });
      });
    }
    return this.cached;
  }

  /**
   * Drop the memoized value so the next isEnabled() re-fetches from the server.
   * Call this right after ENABLE_BRANCH_FEATURES is changed so branch-gated
   * screens reflect the new setting on their next load without a full reload.
   */
  refresh(): void {
    this.cached = null;
  }
}
