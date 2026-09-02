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
import { TooltipModule } from 'primeng/tooltip';
import { DialogModule } from 'primeng/dialog';
import { MessageService } from 'primeng/api';
import { GatePassService } from '../../services/gate-pass/gate-pass';
import { OverflowTooltipDirective } from '../../shared/directives/overflow-tooltip.directive';

/**
 * Security EXECUTIVE screen — print the stick-on label and put it on the parcel.
 *
 * Deliberately narrower than the supervisor console: no gate-out, no gate-in, no
 * history. The queue is passes the supervisor has CLEARED: they check the items,
 * the parcel comes here to be labelled, and only then is it gated out.
 *
 * The vehicle is the exception to that narrowness. Clearance is often done by a
 * supervisor or a department HOD who cannot know which vehicle or courier will
 * actually turn up, so transport is optional there and is captured here instead
 * — this desk is the last pair of hands before the parcel leaves, and the label
 * carries the vehicle. The server will not produce a label until it is recorded.
 */
@Component({
  selector: 'app-gate-pass-print-queue',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, TableModule, TagModule, ToastModule, TabViewModule,
    InputTextModule, FloatLabelModule, SelectModule, TooltipModule, DialogModule,
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

  // Transport capture. Whoever cleared the pass — a security supervisor, or a
  // department HOD standing in at the desk — often can't know which vehicle or
  // courier will turn up, so it lands here instead. The label carries it, and
  // the server won't print one without it.
  transportDialog = {
    open: false, row: null as any, saving: false,
    vehicleNo: '', vehicleType: null as string | null, courierDetails: '',
  };

  // Mirrors the security console's list, hand-carry included.
  vehicleTypeOptions = [
    { label: 'Hospital Vehicle', value: 'HOSPITAL_VEHICLE' },
    { label: 'Outside Vehicle', value: 'OUTSIDE_VEHICLE' },
    { label: 'Hand Carried (no vehicle)', value: 'HAND_CARRIED' },
  ];

  /**
   * Nothing on the record says how the parcel leaves. Blank is not the same as
   * hand-carried: hand-carry is chosen explicitly, so this stays true only while
   * the question is genuinely unanswered.
   */
  needsTransport(row: any): boolean {
    return !(
      (row?.vehicleNo || '').trim() ||
      (row?.courierDetails || '').trim() ||
      (row?.vehicleType || '').trim().toUpperCase() === 'HAND_CARRIED'
    );
  }

  /** How the parcel leaves, for the table cell. */
  transportSummary(row: any): string {
    if ((row?.vehicleType || '').toUpperCase() === 'HAND_CARRIED') return 'Hand carried';
    return (row?.vehicleNo || '').trim() || (row?.courierDetails || '').trim() || '—';
  }

  openTransport(row: any) {
    this.transportDialog = {
      open: true, row, saving: false,
      vehicleNo: row?.vehicleNo || '',
      vehicleType: row?.vehicleType || null,
      courierDetails: row?.courierDetails || '',
    };
  }

  saveTransport() {
    const d = this.transportDialog;
    if (!d.row) return;

    const vehicleNo = d.vehicleNo.trim();
    const courierDetails = d.courierDetails.trim();
    const handCarried = d.vehicleType === 'HAND_CARRIED';
    if (!vehicleNo && !courierDetails && !handCarried) {
      this.toast('warn', 'Enter a vehicle number or courier, or pick Hand Carried.');
      return;
    }

    d.saving = true;
    this.gatePassService.setTransport(d.row.id, {
      vehicleNo: vehicleNo || undefined,
      vehicleType: d.vehicleType || undefined,
      courierDetails: courierDetails || undefined,
    }).subscribe({
      next: () => {
        const no = d.row.gatePassNo;
        setTimeout(() => {
          this.transportDialog = { open: false, row: null, saving: false, vehicleNo: '', vehicleType: null, courierDetails: '' };
          this.toast('success', `Transport recorded for ${no} — the label can be printed now`);
          this.loadQueue();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        setTimeout(() => { this.transportDialog.saving = false; this.cdr.detectChanges(); });
        this.toast('error', err?.error?.message || 'Failed to save the transport details');
      }
    });
  }

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
    // The server refuses a label with no transport on it. Ask for it here rather
    // than bouncing the executive off a 400 they can't act on.
    if (this.needsTransport(row)) {
      this.toast('warn', `${row.gatePassNo} — record the vehicle or courier first`);
      this.openTransport(row);
      return;
    }

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
