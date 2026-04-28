import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { ReportsService } from '../../services/reports/reports';

@Component({
  selector: 'app-fixed-assets-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, ToastModule, SelectModule, DialogModule],
  templateUrl: './fixed-assets-schedule.html',
  styleUrl: './fixed-assets-schedule.css',
  providers: [MessageService]
})
export class FixedAssetsSchedule implements OnInit {
  rows: any[] = [];
  grandTotal: any = null;
  loading = false;
  fyLabel = '';

  selectedYear: number = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1;
  yearOptions: { label: string; value: number }[] = [];

  // Drill-down dialog state
  showDetailDialog = false;
  detailLoading = false;
  detailCategory = '';
  detailRows: any[] = [];
  detailTotals: any = null;
  detailCategoryRow: any = null;   // the category row from main table for cross-check

  constructor(
    private reportsService: ReportsService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  openCategoryDetail(row: any) {
    this.detailCategory = row.category;
    this.detailCategoryRow = row;
    this.detailLoading = true;
    this.showDetailDialog = true;
    this.detailRows = [];
    this.detailTotals = null;
    this.reportsService.getCategoryAssetDetail({
      fiscalYear: this.selectedYear,
      category: row.category,
    }).subscribe({
      next: (res: any) => {
        this.detailRows = res.rows || [];
        this.detailTotals = res.totals || null;
        this.detailLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.detailLoading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load asset detail' });
        this.cdr.detectChanges();
      },
    });
  }

  ngOnInit() {
    const curFY = new Date().getMonth() >= 3 ? new Date().getFullYear() : new Date().getFullYear() - 1;
    for (let y = curFY; y >= curFY - 5; y--) {
      this.yearOptions.push({ label: `FY ${y}-${String(y + 1).slice(2)}`, value: y });
    }
    this.load();
  }

  load() {
    this.loading = true;
    this.reportsService.getFixedAssetsSchedule({ fiscalYear: this.selectedYear }).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.rows = res.rows || [];
          this.grandTotal = res.grandTotal || null;
          this.fyLabel = res.fyLabel || '';
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.loading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load Fixed Assets Schedule' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  exportExcel() {
    this.reportsService.exportReport('fixed-assets-schedule', 'excel', { fiscalYear: this.selectedYear }).subscribe({
      next: (blob: Blob) => {
        const file = new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fixed-assets-schedule-${this.selectedYear}-${String(this.selectedYear + 1).slice(2)}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        this.messageService.add({ severity: 'success', summary: 'Exported', detail: 'Fixed Assets Schedule downloaded' });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Export failed' });
      }
    });
  }

  fmt(val: number): string {
    if (val == null || val === 0) return '—';
    return '₹' + Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /** Absolute difference between asset subtotal and category total (for reconciliation). */
  absDiff(a: number, b: number): number {
    return Math.abs((a ?? 0) - (b ?? 0));
  }

  /** Signed difference for display. */
  diff(a: number, b: number): number {
    return (a ?? 0) - (b ?? 0);
  }
}
