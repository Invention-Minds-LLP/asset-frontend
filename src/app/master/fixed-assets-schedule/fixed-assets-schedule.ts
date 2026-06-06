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

  /**
   * Combined export: single sheet, each category expands into its asset rows
   * followed by a subtotal, with a grand total at the bottom (Layout A).
   * The summary "Export Excel" button stays available for the rolled-up view.
   */
  exportCombinedExcel() {
    this.reportsService.exportReport('fixed-assets-schedule', 'combined', { fiscalYear: this.selectedYear }).subscribe({
      next: (blob: Blob) => {
        const file = new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fixed-assets-schedule-with-breakdown-${this.selectedYear}-${String(this.selectedYear + 1).slice(2)}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        this.messageService.add({ severity: 'success', summary: 'Exported', detail: 'Schedule with asset breakdown downloaded' });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Combined export failed' });
      }
    });
  }

  fmt(val: number): string {
    if (val == null || val === 0) return '—';
    return '₹' + Number(val).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  /** Download the per-category asset breakdown as an Excel file. */
  exportCategoryDetailExcel() {
    if (!this.detailRows.length) {
      this.messageService.add({ severity: 'warn', summary: 'Nothing to export', detail: 'No assets in this category' });
      return;
    }
    this.reportsService.exportReport(
      'fixed-assets-schedule/category-detail',
      'excel',
      { category: this.detailCategory, fiscalYear: this.selectedYear },
    ).subscribe({
      next: (blob: Blob) => {
        const file = new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(file);
        const a = document.createElement('a');
        a.href = url;
        const safeCat = this.detailCategory.replace(/[^A-Za-z0-9]+/g, '-').toLowerCase();
        a.download = `asset-breakdown-${safeCat}-${this.selectedYear}-${String(this.selectedYear + 1).slice(2)}.xlsx`;
        a.click();
        URL.revokeObjectURL(url);
        this.messageService.add({ severity: 'success', summary: 'Exported', detail: 'Asset breakdown downloaded' });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Excel export failed' });
      },
    });
  }

  /** Print the per-category asset breakdown as a clean standalone document. */
  printCategoryDetail() {
    if (!this.detailRows.length) {
      this.messageService.add({ severity: 'warn', summary: 'Nothing to print', detail: 'No assets in this category' });
      return;
    }

    const esc = (s: any) => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c] as string));
    const t = this.detailTotals;

    const bodyRows = this.detailRows.map((r, i) => `
      <tr>
        <td class="c">${i + 1}</td>
        <td>
          <div class="aname">${esc(r.assetName)}</div>
          <div class="ameta">${esc(r.assetId)} · ${esc(r.serialNumber || '—')}</div>
        </td>
        <td class="n">${this.fmt(r.openingGross)}</td>
        <td class="n">${r.additions1H ? this.fmt(r.additions1H) : '—'}</td>
        <td class="n">${r.additions2H ? this.fmt(r.additions2H) : '—'}</td>
        <td class="n">${r.deletions ? this.fmt(r.deletions) : '—'}</td>
        <td class="n b">${this.fmt(r.closingGross)}</td>
        <td class="n">${r.rate > 0 ? r.rate + '%' : '—'}</td>
        <td class="n">${r.depOnOpening ? this.fmt(r.depOnOpening) : '—'}</td>
        <td class="n">${r.depOnAdditions ? this.fmt(r.depOnAdditions) : '—'}</td>
        <td class="n b">${this.fmt(r.closingDep)}</td>
        <td class="n b">${this.fmt(r.netCurrent)}</td>
        <td class="n">${this.fmt(r.netPrevious)}</td>
      </tr>`).join('');

    const totalRow = t ? `
      <tr class="total">
        <td class="c" colspan="2">SUBTOTAL (${this.detailRows.length} assets)</td>
        <td class="n">${this.fmt(t.openingGross)}</td>
        <td class="n">${this.fmt(t.additions1H)}</td>
        <td class="n">${this.fmt(t.additions2H)}</td>
        <td class="n">${this.fmt(t.deletions)}</td>
        <td class="n">${this.fmt(t.closingGross)}</td>
        <td class="n">—</td>
        <td class="n">${this.fmt(t.depOnOpening)}</td>
        <td class="n">${this.fmt(t.depOnAdditions)}</td>
        <td class="n">${this.fmt(t.closingDep)}</td>
        <td class="n">${this.fmt(t.netCurrent)}</td>
        <td class="n">${this.fmt(t.netPrevious)}</td>
      </tr>` : '';

    const printedOn = new Date().toLocaleString('en-IN');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
      <title>${esc(this.detailCategory)} — Asset Breakdown ${esc(this.fyLabel)}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: Arial, Helvetica, sans-serif; margin: 24px; color: #1e293b; }
        .doc-head { border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 14px; }
        .doc-head h1 { margin: 0; font-size: 17px; }
        .doc-head .meta { margin-top: 3px; font-size: 12px; color: #475569; }
        table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
        th, td { border: 1px solid #cbd5e1; padding: 5px 6px; }
        thead th { background: #f1f5f9; font-size: 9.5px; text-transform: uppercase; letter-spacing: .3px; }
        .n { text-align: right; white-space: nowrap; }
        .c { text-align: center; }
        .b { font-weight: 700; }
        .aname { font-weight: 600; }
        .ameta { font-size: 9px; color: #64748b; }
        tr.total td { background: #e2e8f0; font-weight: 700; }
        .grp-gross { background: #d1fae5 !important; }
        .grp-dep   { background: #fed7aa !important; }
        .grp-net   { background: #bfdbfe !important; }
        .foot { margin-top: 14px; font-size: 10px; color: #64748b; display: flex; justify-content: space-between; }
        @media print { body { margin: 8mm; } }
      </style></head><body>
      <div class="doc-head">
        <h1>${esc(this.detailCategory)} — Asset Breakdown</h1>
        <div class="meta">Fixed Assets Schedule · ${esc(this.fyLabel)} · ${this.detailRows.length} assets</div>
      </div>
      <table>
        <thead>
          <tr>
            <th rowspan="2" class="c">#</th>
            <th rowspan="2">Asset</th>
            <th colspan="5" class="grp-gross">Gross Block</th>
            <th colspan="4" class="grp-dep">Depreciation</th>
            <th colspan="2" class="grp-net">Net Block</th>
          </tr>
          <tr>
            <th class="grp-gross">Opening</th>
            <th class="grp-gross">Add 1H</th>
            <th class="grp-gross">Add 2H</th>
            <th class="grp-gross">Deletions</th>
            <th class="grp-gross">Closing</th>
            <th class="grp-dep">Rate %</th>
            <th class="grp-dep">On Opening</th>
            <th class="grp-dep">On Additions</th>
            <th class="grp-dep">Closing Acc.</th>
            <th class="grp-net">Current Yr</th>
            <th class="grp-net">Prev. Yr</th>
          </tr>
        </thead>
        <tbody>${bodyRows}${totalRow}</tbody>
      </table>
      <div class="foot">
        <span>Generated by Smart Assets</span>
        <span>Printed: ${esc(printedOn)}</span>
      </div>
      <script>window.onload = function(){ window.print(); }</script>
      </body></html>`;

    const w = window.open('', '_blank', 'width=1100,height=800');
    if (!w) {
      this.messageService.add({ severity: 'error', summary: 'Print blocked', detail: 'Allow pop-ups for this site to print' });
      return;
    }
    w.document.open();
    w.document.write(html);
    w.document.close();
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
