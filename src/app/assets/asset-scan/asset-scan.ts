import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Assets } from '../../services/assets/assets';
import { OverflowTooltipDirective } from '../../shared/directives/overflow-tooltip.directive';

@Component({
  selector: 'app-asset-scan',
  imports: [CommonModule, OverflowTooltipDirective],
  templateUrl: './asset-scan.html',
  styleUrl: './asset-scan.css'
})
export class AssetScan implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private assetScanService = inject(Assets);
  private cdr = inject(ChangeDetectorRef);

  loading = true;          // summary (name + code) load
  error = '';
  assetId = '';

  // Public summary — all an unauthenticated visitor sees.
  summary: { id: number; assetId: string; assetName: string } | null = null;

  // Full details — loaded only after "Know More", and only when logged in.
  scanData: any | null = null;
  detailsLoading = false;
  detailsError = '';
  showDetails = false;

  ngOnInit(): void {
    this.assetId = this.route.snapshot.paramMap.get('assetId') || '';

    if (!this.assetId) {
      this.loading = false;
      this.error = 'Asset ID not found in URL';
      return;
    }

    this.loadSummary();
  }

  loadSummary(): void {
    this.loading = true;
    this.error = '';

    this.assetScanService.getAssetScanSummary(this.assetId).subscribe({
      next: (response) => {
        // Async resolution doesn't always tick change detection here (zone
        // interop) — mirror the explicit-tick pattern used elsewhere.
        setTimeout(() => {
          this.summary = response.data;
          this.loading = false;

          // If we came back from login (returnUrl carried ?details=1) and a
          // token is present, open the details straight away.
          if (this.route.snapshot.queryParamMap.get('details') === '1' && this.hasToken()) {
            this.loadDetails();
          }
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        setTimeout(() => {
          console.error('Scan summary error:', err);
          this.error = err?.error?.message || 'Failed to load asset';
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  // "Know More": logged-in users see the full details inline; everyone else is
  // sent to login and returned to this page (with details auto-opened).
  knowMore(): void {
    if (this.showDetails) {
      this.showDetails = false;
      return;
    }

    if (!this.hasToken()) {
      this.router.navigate(['/login'], {
        queryParams: { returnUrl: `/assets/scan/${encodeURIComponent(this.assetId)}?details=1` }
      });
      return;
    }

    if (this.scanData) {
      this.showDetails = true;
      return;
    }

    this.loadDetails();
  }

  private loadDetails(): void {
    this.detailsLoading = true;
    this.detailsError = '';

    this.assetScanService.getAssetScanDetails(this.assetId).subscribe({
      next: (response) => {
        setTimeout(() => {
          this.scanData = response.data;
          this.showDetails = true;
          this.detailsLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        setTimeout(() => {
          console.error('Scan details error:', err);
          // Not authorised (no token, or a stale one the API rejected) — send
          // them to login and bring them back with details auto-opened. The
          // interceptor deliberately doesn't redirect on the public scan page.
          if (err?.status === 401 || err?.status === 403) {
            this.router.navigate(['/login'], {
              queryParams: { returnUrl: `/assets/scan/${encodeURIComponent(this.assetId)}?details=1` }
            });
            return;
          }
          this.detailsError = err?.error?.message || 'Failed to load asset details';
          this.detailsLoading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  private hasToken(): boolean {
    return typeof window !== 'undefined' &&
      !!(localStorage.getItem('authToken') || sessionStorage.getItem('authToken'));
  }

  get master() {
    return this.scanData?.masterDetails;
  }

  get procurement() {
    return this.scanData?.procurementDetails;
  }

  /** Active location (with precise-placement fields) for this asset, if any. */
  get location() {
    const list = this.scanData?.currentLocations;
    return Array.isArray(list) && list.length ? list[0] : null;
  }

  /** Google Maps link when the active location has GPS coordinates. */
  get mapLink(): string | null {
    const l = this.location;
    return l?.latitude && l?.longitude
      ? `https://www.google.com/maps?q=${l.latitude},${l.longitude}`
      : null;
  }
}
