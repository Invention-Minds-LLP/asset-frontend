import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  private assetScanService = inject(Assets);
  private cdr = inject(ChangeDetectorRef);

  loading = true;
  error = '';
  assetId = '';
  scanData: any | null = null;
  showDetails = false;

  toggleDetails() { this.showDetails = !this.showDetails; }

  ngOnInit(): void {
    this.assetId = this.route.snapshot.paramMap.get('assetId') || '';

    if (!this.assetId) {
      this.loading = false;
      this.error = 'Asset ID not found in URL';
      return;
    }

    this.loadAssetDetails();
  }

  loadAssetDetails(): void {
    this.loading = true;
    this.error = '';

    this.assetScanService.getAssetScanDetails(this.assetId).subscribe({
      next: (response) => {
        // Same pattern used elsewhere in this codebase — the async resolution
        // doesn't always trigger change detection on its own (zone interop), so
        // we explicitly tick after assigning.
        setTimeout(() => {
          this.scanData = response.data;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        setTimeout(() => {
          console.error('Scan details error:', err);
          this.error = err?.error?.message || 'Failed to load asset details';
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
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
