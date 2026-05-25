import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef } from '@angular/core';
import { ImportExcel, ImportResponse, SubAssetRowResult, LocationRowResult } from '../../services/imports/import-excel';
import { FormsModule } from '@angular/forms';
import { OverflowTooltipDirective } from '../../shared/directives/overflow-tooltip.directive';

@Component({
  selector: 'app-asset-imports',
  imports: [CommonModule, FormsModule, OverflowTooltipDirective],
  templateUrl: './asset-imports.html',
  styleUrl: './asset-imports.css'
})
export class AssetImports {
assetsFile: File | null = null;
  checklistFile: File | null = null;

  isUploadingAssets = false;
  isUploadingChecklists = false;

  assetsResponse: ImportResponse | null = null;
  checklistResponse: ImportResponse | null = null;

  assetsError = '';
  checklistError = '';

  // ── Sub-asset import ──
  subAssetsFile: File | null = null;
  isUploadingSubAssets = false;
  subAssetsResponse: ImportResponse | null = null;
  subAssetsError = '';
  downloadingSubAssetTemplate = false;

  // ── Location import ──
  locationsFile: File | null = null;
  isUploadingLocations = false;
  locationsResponse: ImportResponse | null = null;
  locationsError = '';
  downloadingLocationTemplate = false;

  constructor(private assetImportService: ImportExcel) {}

  onAssetsFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.assetsFile = input.files?.[0] || null;
    this.assetsResponse = null;
    this.assetsError = '';
  }

  onChecklistFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.checklistFile = input.files?.[0] || null;
    this.checklistResponse = null;
    this.checklistError = '';
  }

  uploadAssetsWorkbook(): void {
    if (!this.assetsFile) {
      this.assetsError = 'Please select an asset workbook file.';
      return;
    }

    this.isUploadingAssets = true;
    this.assetsError = '';
    this.assetsResponse = null;

    this.assetImportService.uploadAssetsWorkbook(this.assetsFile).subscribe({
      next: (res) => {
        this.assetsResponse = res;
      },
      error: (err) => {
        this.assetsError =
          err?.error?.message ||
          err?.error?.error ||
          'Asset workbook upload failed.';
      },
      complete: () => {
        this.isUploadingAssets = false;
      }
    });
  }

  uploadChecklistWorkbook(): void {
    if (!this.checklistFile) {
      this.checklistError = 'Please select a checklist workbook file.';
      return;
    }

    this.isUploadingChecklists = true;
    this.checklistError = '';
    this.checklistResponse = null;

    this.assetImportService.uploadChecklistWorkbook(this.checklistFile).subscribe({
      next: (res) => {
        this.checklistResponse = res;
      },
      error: (err) => {
        this.checklistError =
          err?.error?.message ||
          err?.error?.error ||
          'Checklist workbook upload failed.';
      },
      complete: () => {
        this.isUploadingChecklists = false;
      }
    });
  }

  downloadingTemplate = false;
  downloadingChecklistTemplate = false;

  downloadLegacyTemplate(): void {
    this.downloadingTemplate = true;
    this.assetImportService.downloadLegacyTemplate().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'legacy-asset-import-template.xlsx';
        a.click();
        URL.revokeObjectURL(url);
        this.downloadingTemplate = false;
      },
      error: () => {
        this.downloadingTemplate = false;
      }
    });
  }

  downloadChecklistTemplate(): void {
    this.downloadingChecklistTemplate = true;
    this.assetImportService.downloadChecklistTemplate().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'checklist-workbook-template.xlsx';
        a.click();
        URL.revokeObjectURL(url);
        this.downloadingChecklistTemplate = false;
      },
      error: () => {
        this.downloadingChecklistTemplate = false;
      }
    });
  }

  objectKeys(obj: any): string[] {
    return obj ? Object.keys(obj) : [];
  }

  // ── Sub-asset import handlers ──
  onSubAssetsFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.subAssetsFile = input.files?.[0] || null;
    this.subAssetsResponse = null;
    this.subAssetsError = '';
  }

  uploadSubAssetsWorkbook(): void {
    if (!this.subAssetsFile) {
      this.subAssetsError = 'Please select a sub-asset workbook file.';
      return;
    }
    this.isUploadingSubAssets = true;
    this.subAssetsError = '';
    this.subAssetsResponse = null;

    this.assetImportService.uploadSubAssetsWorkbook(this.subAssetsFile).subscribe({
      next: (res) => { this.subAssetsResponse = res; },
      error: (err) => {
        this.subAssetsError =
          err?.error?.message || err?.error?.error || 'Sub-asset workbook upload failed.';
      },
      complete: () => { this.isUploadingSubAssets = false; }
    });
  }

  downloadSubAssetTemplate(): void {
    this.downloadingSubAssetTemplate = true;
    this.assetImportService.downloadSubAssetTemplate().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sub-assets-import-template.xlsx';
        a.click();
        URL.revokeObjectURL(url);
        this.downloadingSubAssetTemplate = false;
      },
      error: () => { this.downloadingSubAssetTemplate = false; }
    });
  }

  subAssetRows(): SubAssetRowResult[] {
    return this.subAssetsResponse?.results ?? [];
  }

  // ── Location import handlers ──
  onLocationsFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.locationsFile = input.files?.[0] || null;
    this.locationsResponse = null;
    this.locationsError = '';
  }

  uploadLocationsWorkbook(): void {
    if (!this.locationsFile) {
      this.locationsError = 'Please select a locations workbook file.';
      return;
    }
    this.isUploadingLocations = true;
    this.locationsError = '';
    this.locationsResponse = null;

    this.assetImportService.uploadLocationsWorkbook(this.locationsFile).subscribe({
      next: (res) => { this.locationsResponse = res; },
      error: (err) => {
        this.locationsError =
          err?.error?.message || err?.error?.error || 'Location workbook upload failed.';
      },
      complete: () => { this.isUploadingLocations = false; }
    });
  }

  downloadLocationTemplate(): void {
    this.downloadingLocationTemplate = true;
    this.assetImportService.downloadLocationTemplate().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'asset-locations-import-template.xlsx';
        a.click();
        URL.revokeObjectURL(url);
        this.downloadingLocationTemplate = false;
      },
      error: () => { this.downloadingLocationTemplate = false; }
    });
  }

  locationRows(): LocationRowResult[] {
    return (this.locationsResponse?.results as unknown as LocationRowResult[]) ?? [];
  }
}
