import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { DownloadGateService } from '../../shared/download-gate/download-gate.service';
import { ImportExcel, ImportResponse, SubAssetRowResult, LocationRowResult, DepartmentRowResult } from '../../services/imports/import-excel';
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
  downloadingCurrentLocations = false;

  // ── Department & assignment import ──
  departmentsFile: File | null = null;
  isUploadingDepartments = false;
  departmentsResponse: ImportResponse | null = null;
  departmentsError = '';
  downloadingDepartmentTemplate = false;

  private downloadGate = inject(DownloadGateService);

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

  async downloadLegacyTemplate(): Promise<void> {
    if (!(await this.downloadGate.verify('Legacy asset import template (Excel)'))) return;
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

  async downloadChecklistTemplate(): Promise<void> {
    if (!(await this.downloadGate.verify('Checklist workbook template (Excel)'))) return;
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

  async downloadSubAssetTemplate(): Promise<void> {
    if (!(await this.downloadGate.verify('Sub-asset import template (Excel)'))) return;
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

  async downloadLocationTemplate(): Promise<void> {
    if (!(await this.downloadGate.verify('Asset location import template (Excel)'))) return;
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

  // Every asset pre-filled with its current location — the practical way to do a
  // bulk fill, since the blank template means typing thousands of rows by hand.
  async downloadCurrentLocations(): Promise<void> {
    if (!(await this.downloadGate.verify('Current asset locations (Excel)'))) return;
    this.downloadingCurrentLocations = true;
    this.assetImportService.downloadCurrentLocations().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'asset-locations-current.xlsx';
        a.click();
        URL.revokeObjectURL(url);
        this.downloadingCurrentLocations = false;
      },
      error: () => { this.downloadingCurrentLocations = false; }
    });
  }

  locationRows(): LocationRowResult[] {
    return (this.locationsResponse?.results as unknown as LocationRowResult[]) ?? [];
  }

  // ── Department & assignment import handlers ──
  onDepartmentsFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.departmentsFile = input.files?.[0] || null;
    this.departmentsResponse = null;
    this.departmentsError = '';
  }

  uploadDepartmentsWorkbook(): void {
    if (!this.departmentsFile) {
      this.departmentsError = 'Please select a department workbook file.';
      return;
    }
    this.isUploadingDepartments = true;
    this.departmentsError = '';
    this.departmentsResponse = null;

    this.assetImportService.uploadDepartmentsWorkbook(this.departmentsFile).subscribe({
      next: (res) => { this.departmentsResponse = res; },
      error: (err) => {
        this.departmentsError =
          err?.error?.message || err?.error?.error || 'Department workbook upload failed.';
      },
      complete: () => { this.isUploadingDepartments = false; }
    });
  }

  async downloadDepartmentTemplate(): Promise<void> {
    if (!(await this.downloadGate.verify('Asset department import template (Excel)'))) return;
    this.downloadingDepartmentTemplate = true;
    this.assetImportService.downloadDepartmentTemplate().subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'asset-departments-import-template.xlsx';
        a.click();
        URL.revokeObjectURL(url);
        this.downloadingDepartmentTemplate = false;
      },
      error: () => { this.downloadingDepartmentTemplate = false; }
    });
  }

  departmentRows(): DepartmentRowResult[] {
    return (this.departmentsResponse?.results as unknown as DepartmentRowResult[]) ?? [];
  }
}
