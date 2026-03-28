import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

import { Ticketing } from '../../services/tickerting/ticketing'; // ✅ adjust path

type TransferStatus = 'REQUESTED' | 'APPROVED' | 'REJECTED' | 'COMPLETED';

@Component({
  selector: 'app-pending-transfers',
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    DialogModule,
    InputTextModule,
    TextareaModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './pending-transfers.html',
  styleUrl: './pending-transfers.css'
})
export class PendingTransfers {
  loading = false;

  // backend returns TicketTransferHistory[] with includes:
  // { ticket, fromDepartment, toDepartment, requestedBy }
  rows: any[] = [];

  // dialogs
  showRejectDialog = false;
  showDetailsDialog = false;

  selectedRow: any = null;
  rejectReason = '';

  // quick filters
  globalFilter = '';
  pendingTransfers: any[] = [];

pendingPage = 1;
pendingRowsPerPage = 10;
pendingSearchTerm = '';

showRejectTransferDialog = false;
selectedTransfer: any = null;

  constructor(
    private ticketService: Ticketing,
    private toastService: MessageService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit() {
    this.load();
  }

  toast(severity: 'success' | 'info' | 'warn' | 'error', detail: string) {
    this.toastService.add({
      severity,
      summary: 'Info',
      detail,
    });
  }

  load() {
    this.loading = true;

    this.ticketService.getPendingTransfers().subscribe({
      next: (res: any[]) => {
        setTimeout(() => {
          this.rows = Array.isArray(res) ? res : [];
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (e) => {
        setTimeout(() => {
          this.loading = false;
          this.cdr.detectChanges();
        });
        this.toast('error', e?.error?.message || 'Failed to load pending transfers');
      },
    });
  }

  refresh() {
    this.load();
  }

  // ---------- UI helpers ----------
  getStatusBadgeClass(status: TransferStatus) {
    switch (status) {
      case 'REQUESTED':
        return 'badge badge-requested';
      case 'APPROVED':
        return 'badge badge-approved';
      case 'REJECTED':
        return 'badge badge-rejected';
      case 'COMPLETED':
        return 'badge badge-completed';
      default:
        return 'badge';
    }
  }

  openDetails(row: any) {
    this.selectedRow = row;
    this.showDetailsDialog = true;
  }

  // ---------- Actions ----------
  approve(row: any) {
    if (!row?.id) return;

    this.loading = true;

    // this.ticketService.approveTransfer(Number(row.id)).subscribe({
    //   next: () => {
    //     this.toast('success', 'Transfer approved');
    //     // remove row locally for instant UI
    //     this.rows = this.rows.filter(r => r.id !== row.id);
    //   },
    //   error: (e) => {
    //     this.toast('error', e?.error?.message || 'Failed to approve');
    //   },
    //   complete: () => {
    //     this.loading = false;
    //     this.cdr.detectChanges();
    //   },
    // });
  }

  openReject(row: any) {
    this.selectedRow = row;
    this.rejectReason = '';
    this.showRejectDialog = true;
  }

  confirmReject() {
    const row = this.selectedRow;
    if (!row?.id) return;

    const reason = (this.rejectReason || '').trim();

    this.loading = true;

    // this.ticketService.rejectTransfer(Number(row.id), reason).subscribe({
    //   next: () => {
    //     this.toast('warn', 'Transfer rejected');
    //     this.showRejectDialog = false;
    //     // remove row locally for instant UI
    //     this.rows = this.rows.filter(r => r.id !== row.id);
    //   },
    //   error: (e) => {
    //     this.toast('error', e?.error?.message || 'Failed to reject');
    //   },
    //   complete: () => {
    //     this.loading = false;
    //     this.cdr.detectChanges();
    //   },
    // });
  }

  // convenience fields for table
  ticketCode(row: any): string {
    return row?.ticket?.ticketId ?? '-';
  }
  assetText(row: any): string {
    const a = row?.ticket?.asset;
    if (!a) return '-';
    const id = a.assetId ?? '';
    const name = a.assetName ?? '';
    return `${id}${id && name ? ' - ' : ''}${name}`.trim() || '-';
  }
  fromDept(row: any): string {
    return row?.fromDepartment?.name ?? '-';
  }
  toDept(row: any): string {
    return row?.toDepartment?.name ?? '-';
  }
  requestedBy(row: any): string {
    return row?.requestedBy?.name ?? '-';
  }
  createdAtText(row: any): string {
    // backend createdAt is ISO string
    const v = row?.createdAt;
    if (!v) return '-';
    try {
      const d = new Date(v);
      return d.toLocaleString();
    } catch {
      return String(v);
    }
  }
  
}
