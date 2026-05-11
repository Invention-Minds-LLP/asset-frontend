import { CommonModule } from '@angular/common';
import { Component, ChangeDetectorRef } from '@angular/core';
import { ImportExcel, ImportResponse } from '../../services/imports/import-excel';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-asset-imports',
  imports: [CommonModule, FormsModule],
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
}
