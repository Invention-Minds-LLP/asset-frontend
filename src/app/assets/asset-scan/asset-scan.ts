import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Assets } from '../../services/assets/assets';

@Component({
  selector: 'app-asset-scan',
  imports: [CommonModule],
  templateUrl: './asset-scan.html',
  styleUrl: './asset-scan.css'
})
export class AssetScan {
  private route = inject(ActivatedRoute);
  private assetScanService = inject(Assets);

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
        this.scanData = response.data;
        this.loading = false;

        console.log(this.scanData, this.loading)
      },
      error: (err) => {
        console.error('Scan details error:', err);
        this.error = err?.error?.message || 'Failed to load asset details';
        this.loading = false;
      }
    });
  }

  get master() {
    return this.scanData?.masterDetails;
  }

  get procurement() {
    return this.scanData?.procurementDetails;
  }
}
