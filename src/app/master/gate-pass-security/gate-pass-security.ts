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
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { GatePassService } from '../../services/gate-pass/gate-pass';

interface ItemReturn {
  itemId: number;
  asset: { assetName: string; assetId: string } | null;
  condition: 'GOOD' | 'DAMAGED' | 'PARTIAL';
  remarks: string;
}

@Component({
  selector: 'app-gate-pass-security',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, TableModule, TagModule, ToastModule, TabViewModule,
    InputTextModule, FloatLabelModule, SelectModule, TextareaModule, TooltipModule, DialogModule,
  ],
  templateUrl: './gate-pass-security.html',
  styleUrl: './gate-pass-security.css',
  providers: [MessageService]
})
export class GatePassSecurity implements OnInit {
  approvedRows: any[] = [];   // ready to issue (gate-out)
  issuedRows: any[] = [];     // out, awaiting return (gate-in)
  overdueCount = 0;           // RETURNABLE + ISSUED + past expectedReturnDate
  loading = false;

  // Lookup field — security types/scans GP-... here
  lookupNo = '';

  // Gate-in dialog (per-item return condition capture)
  gateInDialog = {
    open: false,
    row: null as any,
    returnedBy: '',
    items: [] as ItemReturn[],
  };

  conditionOptions = [
    { label: 'Good', value: 'GOOD' },
    { label: 'Damaged', value: 'DAMAGED' },
    { label: 'Partial', value: 'PARTIAL' },
  ];

  constructor(
    private gatePassService: GatePassService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.loadQueue(); }

  loadQueue() {
    this.loading = true;
    this.gatePassService.getSecurityQueue().subscribe({
      next: (rows) => {
        setTimeout(() => {
          this.approvedRows = (rows || []).filter(r => r.status === 'APPROVED');
          this.issuedRows   = (rows || []).filter(r => r.status === 'ISSUED');
          const today = new Date().toISOString().slice(0, 10);
          this.overdueCount = this.issuedRows.filter(r =>
            r.type === 'RETURNABLE' && r.expectedReturnDate && r.expectedReturnDate.slice(0, 10) < today
          ).length;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => { this.loading = false; this.toast('error', 'Failed to load security queue'); }
    });
  }

  isOverdue(row: any): boolean {
    if (!row?.expectedReturnDate || row.type !== 'RETURNABLE') return false;
    return row.expectedReturnDate.slice(0, 10) < new Date().toISOString().slice(0, 10);
  }

  daysOverdue(row: any): number {
    if (!this.isOverdue(row)) return 0;
    return Math.ceil((Date.now() - new Date(row.expectedReturnDate).getTime()) / (1000 * 60 * 60 * 24));
  }

  // ── Lookup ──────────────────────────────────────────────────────────────
  lookup() {
    const q = (this.lookupNo || '').trim();
    if (!q) return;
    // Server-side filter by gatePassNo isn't a separate endpoint; we filter client-side from the queue.
    // Fall back to /:id flow only if the user typed a numeric id.
    const matchInApproved = this.approvedRows.find(r => r.gatePassNo === q);
    const matchInIssued   = this.issuedRows.find(r => r.gatePassNo === q);
    if (matchInApproved) { this.toast('success', `Found ${q} — ready to gate-out`); return; }
    if (matchInIssued)   { this.toast('success', `Found ${q} — currently out, ready for gate-in`); return; }
    this.toast('warn', `Gate pass ${q} not in queue (may be DRAFT, PENDING, REJECTED, RETURNED, or CLOSED)`);
  }

  // ── Gate-out (security issues asset) ─────────────────────────────────────
  gateOut(row: any) {
    if (!confirm(`Confirm gate-out of ${row.gatePassNo}? Asset(s) will be marked as physically released.`)) return;
    this.gatePassService.gateOut(row.id).subscribe({
      next: () => { this.toast('success', `${row.gatePassNo} issued`); this.loadQueue(); },
      error: (err) => this.toast('error', err?.error?.message || 'Gate-out failed')
    });
  }

  // ── Gate-in (security receives asset back) ───────────────────────────────
  openGateIn(row: any) {
    this.gateInDialog = {
      open: true,
      row,
      returnedBy: '',
      items: (row.items || []).map((it: any) => ({
        itemId: it.id,
        asset: it.asset ? { assetName: it.asset.assetName, assetId: it.asset.assetId } : null,
        condition: 'GOOD' as const,
        remarks: '',
      })),
    };
  }

  confirmGateIn() {
    const { row, returnedBy, items } = this.gateInDialog;
    if (!row) return;
    const itemReturns = items.map(it => ({ itemId: it.itemId, condition: it.condition, remarks: it.remarks }));
    this.gatePassService.gateIn(row.id, { itemReturns, returnedBy: returnedBy || undefined }).subscribe({
      next: () => { this.toast('success', `${row.gatePassNo} received back`); this.gateInDialog.open = false; this.loadQueue(); },
      error: (err) => this.toast('error', err?.error?.message || 'Gate-in failed')
    });
  }

  // ── PDF ──────────────────────────────────────────────────────────────────
  downloadPdf(row: any) {
    this.gatePassService.downloadPdf(row.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = `${row.gatePassNo}.pdf`;
        link.click(); URL.revokeObjectURL(url);
      },
      error: () => this.toast('error', 'Failed to download PDF')
    });
  }

  toast(severity: 'success' | 'error' | 'warn', detail: string) {
    this.messageService.add({ severity, summary: severity.toUpperCase(), detail });
  }
}
