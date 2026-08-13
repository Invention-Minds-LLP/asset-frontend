import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { MessageService } from 'primeng/api';
import { GatePassService } from '../../services/gate-pass/gate-pass';

/**
 * What the printed QR opens.
 *
 * The QR used to encode a JSON blob, so a phone camera showed
 * {"gatePassNo":"GP-…","id":42} — meaningless to a guard at the gate. It now
 * encodes a link to this screen, which answers the only question a scanner
 * actually has: is this pass genuine, and is it cleared to leave right now?
 *
 * Behind the auth guard, so a parcel scanned in transit gives a stranger a login
 * screen rather than its contents and destination.
 *
 * The paste box exists because labels printed before this change still carry the
 * old JSON QR — those numbers can be typed in by hand instead.
 */
@Component({
  selector: 'app-gate-pass-scan',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, TableModule, TagModule, ToastModule, InputTextModule, FloatLabelModule,
  ],
  templateUrl: './gate-pass-scan.html',
  styleUrl: './gate-pass-scan.css',
  providers: [MessageService]
})
export class GatePassScan implements OnInit {
  lookupNo = '';
  pass: any = null;
  loading = false;
  notFound = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private gatePassService: GatePassService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Re-run on param change so scanning a second label from this screen works.
    this.route.paramMap.subscribe(params => {
      const no = params.get('gatePassNo');
      if (no) { this.lookupNo = no; this.lookup(); }
    });
  }

  lookup() {
    const q = (this.lookupNo || '').trim();
    if (!q) { this.toast('warn', 'Enter a gate pass number'); return; }

    this.loading = true;
    this.notFound = '';
    this.gatePassService.getByNo(q).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.pass = res;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        setTimeout(() => {
          this.pass = null;
          this.loading = false;
          this.notFound = err?.error?.message || `No gate pass found with number ${q}`;
          this.cdr.detectChanges();
        });
      }
    });
  }

  /** Scan another without leaving the screen. */
  clear() {
    this.pass = null;
    this.notFound = '';
    this.lookupNo = '';
    this.router.navigate(['/gate-pass/scan']);
  }

  // ── The verdict banner — plain language, not status codes ─────────────────
  // This is the whole point of the screen: someone holding a phone at the gate
  // needs "yes, let it go" or "no, stop", not the word ISSUED.

  verdictTitle(): string {
    switch (this.pass?.status) {
      case 'APPROVED':         return 'Approved — cleared to leave';
      case 'ISSUED':           return 'Already issued — this pass has been used';
      case 'RETURNED':         return 'Returned — items are back';
      case 'CLOSED':           return 'Closed — this pass is finished';
      case 'REJECTED':         return 'Rejected — do not release';
      case 'CANCELLED':        return 'Cancelled — do not release';
      case 'PENDING_APPROVAL': return 'Not yet approved — do not release';
      case 'DRAFT':            return 'Draft — not submitted, do not release';
      default:                 return 'Unknown status — check with the security supervisor';
    }
  }

  verdictDetail(): string {
    switch (this.pass?.status) {
      case 'APPROVED':
        return 'Check the items against the list below, then record the gate-out.';
      case 'ISSUED':
        return this.pass?.type === 'RETURNABLE'
          ? 'These items are already outside. Expect them back — record a gate-in on return.'
          : 'These items have already left and are not expected back.';
      case 'RETURNED':
        return 'Received back at the gate. Nothing further is due to leave on this pass.';
      case 'CLOSED':
        return 'Completed and archived. Nothing may leave on this pass.';
      case 'REJECTED':
        return this.pass?.rejectionReason
          ? `Reason: ${this.pass.rejectionReason}`
          : 'The department head refused this request.';
      case 'CANCELLED':
        return 'This pass was called off. Nothing may leave on it.';
      case 'PENDING_APPROVAL':
        return 'Still waiting for the department head. Send the carrier back — nothing leaves yet.';
      case 'DRAFT':
        return 'Never submitted for approval. Send the carrier back to the requester.';
      default:
        return '';
    }
  }

  /** Drives the banner colour — green go, red stop, grey finished. */
  verdictTone(): 'ok' | 'stop' | 'done' {
    switch (this.pass?.status) {
      case 'APPROVED':  return 'ok';
      case 'RETURNED':
      case 'CLOSED':
      case 'ISSUED':    return 'done';
      default:          return 'stop';
    }
  }

  isOverdue(): boolean {
    if (!this.pass?.expectedReturnDate || this.pass.type !== 'RETURNABLE') return false;
    if (this.pass.status !== 'ISSUED') return false;
    return String(this.pass.expectedReturnDate).slice(0, 10) < new Date().toISOString().slice(0, 10);
  }

  itemLabel(it: any): string {
    const makeModel = [it.make, it.model].filter(Boolean).join(' ');
    return it.asset?.assetName || it.description || makeModel || '—';
  }

  downloadPdf() {
    if (!this.pass) return;
    this.gatePassService.downloadPdf(this.pass.id).subscribe({
      next: (blob) => {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url; link.download = `${this.pass.gatePassNo}.pdf`;
        link.click(); URL.revokeObjectURL(url);
      },
      error: () => this.toast('error', 'Failed to download PDF')
    });
  }

  toast(severity: 'success' | 'error' | 'warn', detail: string) {
    this.messageService.add({ severity, summary: severity.toUpperCase(), detail });
  }
}
