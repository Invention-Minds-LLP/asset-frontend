import { Component, ChangeDetectorRef } from '@angular/core';
import { Assets } from '../../services/assets/assets';
import { MessageService } from 'primeng/api';
import { CommonModule } from '@angular/common';
import { TableModule } from 'primeng/table';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { InputSwitchModule, InputSwitchStyle } from 'primeng/inputswitch';
import { FloatLabelModule } from 'primeng/floatlabel';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'app-sla-matrix',
  imports: [CommonModule, TableModule, SelectModule, InputTextModule, InputSwitchModule, FloatLabelModule, ReactiveFormsModule, FormsModule, ButtonModule],
  templateUrl: './sla-matrix.html',
  styleUrl: './sla-matrix.css'
})
export class SlaMatrix {
rows: any[] = [];
  assetCategories: any[] = [];

  form: any = this.getEmptyForm();
  editingId: number | null = null;

  slaCategoryOptions = [
    { label: 'LOW', value: 'LOW' },
    { label: 'MEDIUM', value: 'MEDIUM' },
    { label: 'HIGH', value: 'HIGH' }
  ];

  levelOptions = [
    { label: 'L1', value: 'L1' },
    { label: 'L2', value: 'L2' },
    { label: 'L3', value: 'L3' }
  ];

  timeUnitOptions = [
    { label: 'Minutes', value: 'MINUTES' },
    { label: 'Hours', value: 'HOURS' },
    { label: 'Days', value: 'DAYS' },
    { label: 'Months', value: 'MONTHS' },
    { label: 'Years', value: 'YEARS' }
  ];

  constructor(
    private assetSlaMatrixAPI: Assets,
    private assetCategoryAPI: Assets,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAssetCategories();
    this.loadRows();
  }

  getEmptyForm() {
    return {
      assetCategoryId: null,
      slaCategory: null,
      level: 'L1',
      responseTimeValue: null,
      responseTimeUnit: 'HOURS',
      resolutionTimeValue: null,
      resolutionTimeUnit: 'HOURS',
      isActive: true
    };
  }

  loadAssetCategories() {
    this.assetCategoryAPI.getCategories().subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.assetCategories = (res || []).map((x: any) => ({ label: x.name, value: x.id }));
          this.cdr.detectChanges();
        });
      },
      error: () => this.toast('error', 'Failed to load asset categories')
    });
  }

  loadRows() {
    this.assetSlaMatrixAPI.getAll().subscribe({
      next: (res) => { setTimeout(() => { this.rows = res; this.cdr.detectChanges(); }); },
      error: () => this.toast('error', 'Failed to load SLA matrix')
    });
  }

  save() {
    const payload = {
      assetCategoryId: this.form.assetCategoryId,
      slaCategory: this.form.slaCategory,
      level: this.form.level,
      responseTimeValue: Number(this.form.responseTimeValue),
      responseTimeUnit: this.form.responseTimeUnit,
      resolutionTimeValue: Number(this.form.resolutionTimeValue),
      resolutionTimeUnit: this.form.resolutionTimeUnit,
      isActive: this.form.isActive
    };

    if (
      !payload.assetCategoryId ||
      !payload.slaCategory ||
      !payload.level ||
      payload.responseTimeValue == null ||
      !payload.responseTimeUnit ||
      payload.resolutionTimeValue == null ||
      !payload.resolutionTimeUnit
    ) {
      this.toast('warn', 'Please fill all required fields');
      return;
    }

    if (this.editingId) {
      this.assetSlaMatrixAPI.update(this.editingId, payload).subscribe({
        next: () => { setTimeout(() => { this.toast('success', 'SLA matrix updated'); this.resetForm(); this.loadRows(); this.cdr.detectChanges(); }); },
        error: (err) => this.toast('error', err?.error?.message || 'Failed to update SLA matrix')
      });
    } else {
      this.assetSlaMatrixAPI.create(payload).subscribe({
        next: () => { setTimeout(() => { this.toast('success', 'SLA matrix created'); this.resetForm(); this.loadRows(); this.cdr.detectChanges(); }); },
        error: (err) => this.toast('error', err?.error?.message || 'Failed to create SLA matrix')
      });
    }
  }

  editRow(row: any) {
    this.editingId = row.id;
    this.form = {
      assetCategoryId: row.assetCategoryId,
      slaCategory: row.slaCategory,
      level: row.level,
      responseTimeValue: row.responseTimeValue,
      responseTimeUnit: row.responseTimeUnit,
      resolutionTimeValue: row.resolutionTimeValue,
      resolutionTimeUnit: row.resolutionTimeUnit,
      isActive: row.isActive
    };
  }

  deleteRow(row: any) {
    if (!confirm(`Delete SLA matrix for ${row.assetCategory?.name || 'selected category'}?`)) {
      return;
    }

    this.assetSlaMatrixAPI.delete(row.id).subscribe({
      next: () => { setTimeout(() => { this.toast('success', 'SLA matrix deleted'); this.loadRows(); this.cdr.detectChanges(); }); },
      error: () => this.toast('error', 'Failed to delete SLA matrix')
    });
  }

  resetForm() {
    this.editingId = null;
    this.form = this.getEmptyForm();
  }

  toast(severity: 'success' | 'error' | 'warn', detail: string) {
    this.messageService.add({
      severity,
      summary: severity.toUpperCase(),
      detail
    });
  }
}
