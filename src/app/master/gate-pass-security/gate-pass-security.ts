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
import { OverflowTooltipDirective } from '../../shared/directives/overflow-tooltip.directive';

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
    OverflowTooltipDirective,
  ],
  templateUrl: './gate-pass-security.html',
  styleUrl: './gate-pass-security.css',
  providers: [MessageService]
})
export class GatePassSecurity implements OnInit {
  approvedRows: any[] = [];   // approved, awaiting desk verification
  clearedRows: any[] = [];    // verified + transport recorded, awaiting label & exit
  issuedRows: any[] = [];     // physically out, awaiting return (gate-in)
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

  // ── History — every pass that physically crossed the gate ─────────────────
  // Server-paginated: unlike the two queues, this only grows. It exists so the
  // officer who just gated a pass in can still print it for their file — before
  // this, gate-in made the pass disappear from the console entirely.
  historyRows: any[] = [];
  historyTotal = 0;
  historyPage = 1;
  historyLimit = 10;
  historySearch = '';
  historyLoading = false;
  historyLoaded = false;

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
          this.clearedRows  = (rows || []).filter(r => r.status === 'SECURITY_CLEARED');
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

  // Lazy — only hit the server when the operator actually opens the tab.
  // Signature matches PrimeNG's TableLazyLoadEvent, whose fields are nullable.
  loadHistory(event?: { first?: number | null; rows?: number | null }) {
    if (event) {
      this.historyLimit = event.rows ?? this.historyLimit;
      this.historyPage = Math.floor((event.first ?? 0) / this.historyLimit) + 1;
    }
    this.historyLoading = true;
    this.gatePassService.getSecurityHistory({
      page: this.historyPage,
      limit: this.historyLimit,
      search: this.historySearch.trim() || undefined,
    }).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.historyRows = res?.data || [];
          this.historyTotal = res?.total || 0;
          this.historyLoading = false;
          this.historyLoaded = true;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => { this.historyLoading = false; this.cdr.detectChanges(); });
        this.toast('error', 'Failed to load gate pass history');
      }
    });
  }

  searchHistory() { this.historyPage = 1; this.loadHistory(); }

  onTabChange(index: number) {
    // History is the fourth tab; load it once on first open.
    if (index === 3 && !this.historyLoaded) this.loadHistory();
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
    if (this.approvedRows.some(r => r.gatePassNo === q)) { this.toast('success', `Found ${q} — ready to verify and clear`); return; }
    if (this.clearedRows.some(r => r.gatePassNo === q))  { this.toast('success', `Found ${q} — cleared, awaiting label / exit`); return; }
    if (this.issuedRows.some(r => r.gatePassNo === q))   { this.toast('success', `Found ${q} — currently out, ready for gate-in`); return; }
    this.toast('warn', `Gate pass ${q} not in queue (may be DRAFT, PENDING, REJECTED, RETURNED, or CLOSED)`);
  }

  // ── Gate-out (security issues asset) ─────────────────────────────────────
  //
  // A dialog rather than a browser confirm(): releasing goods is the moment the
  // officer should be checking the items against what's in front of them, and a
  // native confirm can't show the list.
  // Vehicle and courier live here, not on the request form: the officer at the
  // gate is the only person who can see which vehicle actually turned up.
  clearDialog = {
    open: false, row: null as any, saving: false,
    vehicleNo: '', vehicleType: null as string | null, courierDetails: '',
  };

  // Gate-out is one click when the parcel is labelled. If it isn't, this dialog
  // warns first — a warning, not a block: a jammed label printer must not be
  // able to stop goods leaving, or security will simply work around the system.
  gateOutWarn = { open: false, row: null as any, saving: false };

  // Leaving all three transport fields blank is allowed here — the label desk
  // fills them in. Hand-carry is an explicit choice rather than blankness, so
  // that desk can tell "no vehicle" from "not asked yet".
  vehicleTypeOptions = [
    { label: 'Hospital Vehicle', value: 'HOSPITAL_VEHICLE' },
    { label: 'Outside Vehicle', value: 'OUTSIDE_VEHICLE' },
    { label: 'Hand Carried (no vehicle)', value: 'HAND_CARRIED' },
  ];

  openClear(row: any) {
    this.clearDialog = {
      open: true, row, saving: false,
      vehicleNo: row?.vehicleNo || '',
      vehicleType: row?.vehicleType || null,
      courierDetails: row?.courierDetails || '',
    };
  }

  confirmClear() {
    const row = this.clearDialog.row;
    if (!row) return;
    this.clearDialog.saving = true;
    this.gatePassService.securityClear(row.id, {
      vehicleNo: this.clearDialog.vehicleNo.trim() || undefined,
      vehicleType: this.clearDialog.vehicleType || undefined,
      courierDetails: this.clearDialog.courierDetails.trim() || undefined,
    }).subscribe({
      next: () => {
        setTimeout(() => {
          this.clearDialog = { open: false, row: null, saving: false, vehicleNo: '', vehicleType: null, courierDetails: '' };
          this.toast('success', `${row.gatePassNo} cleared — sent for label printing`);
          this.loadQueue();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        setTimeout(() => { this.clearDialog.saving = false; this.cdr.detectChanges(); });
        this.toast('error', err?.error?.message || 'Clearance failed');
      }
    });
  }

  gateOut(row: any) {
    if (!row.labelPrintedAt) { this.gateOutWarn = { open: true, row, saving: false }; return; }
    this.doGateOut(row);
  }

  confirmGateOutAnyway() {
    const row = this.gateOutWarn.row;
    if (!row) return;
    this.gateOutWarn.saving = true;
    this.doGateOut(row, () => { this.gateOutWarn = { open: false, row: null, saving: false }; });
  }

  private doGateOut(row: any, after?: () => void) {
    this.gatePassService.gateOut(row.id).subscribe({
      next: () => {
        setTimeout(() => {
          after?.();
          this.toast('success', `${row.gatePassNo} gated out`);
          this.loadQueue();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        setTimeout(() => { this.gateOutWarn.saving = false; this.cdr.detectChanges(); });
        this.toast('error', err?.error?.message || 'Gate-out failed');
      }
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
      next: () => {
        this.toast('success', `${row.gatePassNo} received back — now in History, printable for your records`);
        this.gateInDialog.open = false;
        this.loadQueue();
        // The pass has just left the queue for history; keep that view honest.
        if (this.historyLoaded) this.loadHistory();
      },
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

  getStatusSeverity(s: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const m: Record<string, any> = {
      APPROVED: 'info', ISSUED: 'info', RETURNED: 'success',
      CLOSED: 'secondary', CANCELLED: 'danger'
    };
    return m[s] ?? 'secondary';
  }

  toast(severity: 'success' | 'error' | 'warn', detail: string) {
    this.messageService.add({ severity, summary: severity.toUpperCase(), detail });
  }
}
