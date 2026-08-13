import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TabViewModule } from 'primeng/tabview';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { GatePassService } from '../../services/gate-pass/gate-pass';
import { OverflowTooltipDirective } from '../../shared/directives/overflow-tooltip.directive';

/**
 * Security EXECUTIVE screen — print the stick-on label and put it on the parcel.
 *
 * Deliberately narrower than the supervisor console: no gate-out, no gate-in, no
 * history. The queue is passes the supervisor has CLEARED: they check the items
 * and record the vehicle first, the parcel comes here to be labelled, and only
 * then is it gated out. Because clearance happened first, the vehicle is already
 * known and can go on the label.
 */
@Component({
  selector: 'app-gate-pass-print-queue',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, TableModule, TagModule, ToastModule, TabViewModule,
    InputTextModule, FloatLabelModule, TooltipModule,
    OverflowTooltipDirective,
  ],
  templateUrl: './gate-pass-print-queue.html',
  styleUrl: './gate-pass-print-queue.css',
  providers: [MessageService]
})
export class GatePassPrintQueue implements OnInit {
  toPrintRows: any[] = [];   // cleared, no label yet
  printedRows: any[] = [];   // cleared, label already printed
  loading = false;
  lookupNo = '';

  constructor(
    private gatePassService: GatePassService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.loadQueue(); }

  loadQueue() {
    this.loading = true;
    this.gatePassService.getLabelQueue().subscribe({
      next: (rows) => {
        setTimeout(() => {
          const list = rows || [];
          this.toPrintRows = list.filter(r => !r.labelPrintedAt);
          this.printedRows = list.filter(r => !!r.labelPrintedAt);
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        setTimeout(() => { this.loading = false; this.cdr.detectChanges(); });
        this.toast('error', err?.error?.message || 'Failed to load the print queue');
      }
    });
  }

  lookup() {
    const q = (this.lookupNo || '').trim();
    if (!q) return;
    if (this.toPrintRows.some(r => r.gatePassNo === q)) { this.toast('success', `${q} — ready to print`); return; }
    if (this.printedRows.some(r => r.gatePassNo === q)) { this.toast('warn', `${q} — label already printed`); return; }
    this.toast('warn', `${q} is not in the print queue (only parcels security has cleared appear here)`);
  }

  /** Item summary for the row — assets by name, non-asset items by description. */
  itemSummary(row: any): string {
    const items = row?.items || [];
    if (!items.length) return '—';
    const first = items[0].asset?.assetName || items[0].description || 'Item';
    return items.length > 1 ? `${first} +${items.length - 1}` : first;
  }

  printLabel(row: any) {
    this.gatePassService.downloadLabel(row.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        // Open in a tab rather than downloading — the executive's next action is
        // Ctrl+P on a label printer, not filing the PDF.
        const win = window.open(url, '_blank');
        if (!win) {
          const link = document.createElement('a');
          link.href = url; link.download = `${row.gatePassNo}-label.pdf`;
          link.click();
        }
        setTimeout(() => URL.revokeObjectURL(url), 30000);
        this.toast('success', `Label generated for ${row.gatePassNo}`);
        // Generating stamps labelPrintedAt server-side, so the row moves tabs.
        this.loadQueue();
      },
      error: (err) => this.toast('error', err?.error?.message || 'Failed to generate the label')
    });
  }

  toast(severity: 'success' | 'error' | 'warn', detail: string) {
    this.messageService.add({ severity, summary: severity.toUpperCase(), detail });
  }
}
