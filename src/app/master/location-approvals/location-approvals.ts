import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { LocationApprovalService } from '../../services/location-approval/location-approval';

@Component({
  selector: 'app-location-approvals',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule, TagModule,
    ToastModule, DialogModule, InputTextModule, TextareaModule,
  ],
  templateUrl: './location-approvals.html',
  styleUrl: './location-approvals.css',
  providers: [MessageService],
})
export class LocationApprovals implements OnInit {
  tab: 'pending' | 'mine' = 'pending';

  pending: any[] = [];
  myRequests: any[] = [];
  loadingPending = false;
  loadingMine = false;

  // Reject dialog
  showReject = false;
  actingRow: any = null;
  rejectReason = '';
  acting = false;

  constructor(
    private svc: LocationApprovalService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadPending();
    this.loadMine();
  }

  setTab(t: 'pending' | 'mine') {
    this.tab = t;
    if (t === 'pending') this.loadPending();
    else this.loadMine();
  }

  loadPending() {
    this.loadingPending = true;
    this.svc.getPending().subscribe({
      next: (res) => {
        this.pending = res?.data || [];
        this.loadingPending = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingPending = false;
        this.cdr.detectChanges();
      },
    });
  }

  loadMine() {
    this.loadingMine = true;
    this.svc.getMyRequests().subscribe({
      next: (res) => {
        this.myRequests = res?.data || [];
        this.loadingMine = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loadingMine = false;
        this.cdr.detectChanges();
      },
    });
  }

  locationLabel(row: any): string {
    return [row.block, row.floor, row.room].filter((v) => v != null && v !== '').join(' / ') || '—';
  }

  approve(row: any) {
    this.acting = true;
    this.svc.approve(row.id).subscribe({
      next: () => {
        this.acting = false;
        this.messageService.add({ severity: 'success', summary: 'Approved', detail: 'Location change approved.' });
        this.loadPending();
      },
      error: (err) => {
        this.acting = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to approve' });
        this.cdr.detectChanges();
      },
    });
  }

  openReject(row: any) {
    this.actingRow = row;
    this.rejectReason = '';
    this.showReject = true;
  }

  confirmReject() {
    if (!this.actingRow) return;
    this.acting = true;
    this.svc.reject(this.actingRow.id, this.rejectReason.trim() || undefined).subscribe({
      next: () => {
        this.acting = false;
        this.showReject = false;
        this.actingRow = null;
        this.messageService.add({ severity: 'success', summary: 'Rejected', detail: 'Location change rejected.' });
        this.loadPending();
      },
      error: (err) => {
        this.acting = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to reject' });
        this.cdr.detectChanges();
      },
    });
  }

  statusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' {
    switch ((status || '').toUpperCase()) {
      case 'APPROVED': return 'success';
      case 'REQUESTED': return 'warn';
      case 'REJECTED': return 'danger';
      default: return 'secondary';
    }
  }

  levelLabel(level: string): string {
    return level === 'MANAGEMENT' ? 'Management' : 'HOD';
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
  }
}
