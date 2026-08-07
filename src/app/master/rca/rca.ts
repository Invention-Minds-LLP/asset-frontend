import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { RcaService } from '../../services/rca/rca';
import { Ticketing } from '../../services/tickerting/ticketing';

interface FiveWhyRow { whyNumber: number; question: string; answer: string; }
interface SixMRow { category: string; cause: string; isRoot: boolean; }

@Component({
  selector: 'app-rca',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, TagModule,
    ToastModule, DialogModule, InputTextModule, TextareaModule, SelectModule, CheckboxModule],
  templateUrl: './rca.html',
  styleUrl: './rca.css',
  providers: [MessageService]
})
export class RcaPage implements OnInit {
  rcas: any[] = [];
  loading = false;

  selectedRca: any = null;
  showDetailDialog = false;

  // ── Capture form ────────────────────────────────────────────────────────
  showFormDialog = false;
  saving = false;
  editingId: number | null = null;
  tickets: any[] = [];

  form: any = {
    ticketId: null as number | null,
    framework: 'FIVE_WHYS',
    status: 'DRAFT',
    summary: '',
    conclusion: '',
    correctiveAction: '',
    preventiveAction: '',
  };

  fiveWhys: FiveWhyRow[] = [];
  sixMItems: SixMRow[] = [];

  frameworkOptions = [
    { label: 'Five Whys', value: 'FIVE_WHYS' },
    { label: '6M (Fishbone)', value: 'SIX_M' },
    { label: 'Combined', value: 'COMBINED' },
  ];

  statusOptions = [
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Reviewed', value: 'REVIEWED' },
  ];

  sixMCategories = [
    { label: 'Man', value: 'MAN' },
    { label: 'Machine', value: 'MACHINE' },
    { label: 'Material', value: 'MATERIAL' },
    { label: 'Method', value: 'METHOD' },
    { label: 'Measurement', value: 'MEASUREMENT' },
    { label: 'Mother Nature', value: 'MOTHER_NATURE' },
  ];

  constructor(
    private rcaService: RcaService,
    private ticketService: Ticketing,
    private route: ActivatedRoute,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadAll();
    this.loadTickets();

    // Arriving from a ticket's "Add RCA" action: /rca?ticketId=12&new=1
    const qp = this.route.snapshot.queryParamMap;
    const ticketId = Number(qp.get('ticketId'));
    if (qp.get('new') === '1' && ticketId) {
      this.openCreate(ticketId);
    }
  }

  loadAll() {
    this.loading = true;
    this.rcaService.getAll().subscribe({
      next: (res: any) => {
        this.rcas = res.data || res || [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load RCA records' });
        this.cdr.markForCheck();
      }
    });
  }

  loadTickets() {
    this.ticketService.getAllTickets().subscribe({
      next: (res: any[]) => {
        this.tickets = (res || []).map(t => ({
          ...t,
          label: `${t.ticketId} — ${t.asset?.assetName || 'Asset'} (${t.issueType || '—'})`,
        }));
        this.cdr.markForCheck();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load tickets' })
    });
  }

  // ── Form open / close ───────────────────────────────────────────────────
  openCreate(ticketId?: number) {
    this.editingId = null;
    this.form = {
      ticketId: ticketId ?? null,
      framework: 'FIVE_WHYS',
      status: 'DRAFT',
      summary: '',
      conclusion: '',
      correctiveAction: '',
      preventiveAction: '',
    };
    // Seed the classic five rungs; rows can be added or removed freely.
    this.fiveWhys = [1, 2, 3, 4, 5].map(n => ({ whyNumber: n, question: '', answer: '' }));
    this.sixMItems = [];
    this.showFormDialog = true;
    this.cdr.markForCheck();
  }

  openEdit(rca: any) {
    this.rcaService.getById(rca.id).subscribe({
      next: (full: any) => {
        this.editingId = full.id;
        this.form = {
          ticketId: full.ticketId,
          framework: full.framework,
          status: full.status || 'DRAFT',
          summary: full.summary || '',
          conclusion: full.conclusion || '',
          correctiveAction: full.correctiveAction || '',
          preventiveAction: full.preventiveAction || '',
        };
        this.fiveWhys = (full.fiveWhys || []).map((w: any) => ({
          whyNumber: w.whyNumber, question: w.question || '', answer: w.answer || ''
        }));
        this.sixMItems = (full.sixMItems || []).map((s: any) => ({
          category: s.category, cause: s.cause || '', isRoot: !!s.isRoot
        }));
        this.showFormDialog = true;
        this.cdr.markForCheck();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load RCA' })
    });
  }

  // ── Row helpers ─────────────────────────────────────────────────────────
  get needsFiveWhys() { return this.form.framework === 'FIVE_WHYS' || this.form.framework === 'COMBINED'; }
  get needsSixM() { return this.form.framework === 'SIX_M' || this.form.framework === 'COMBINED'; }

  addWhy() {
    this.fiveWhys.push({ whyNumber: this.fiveWhys.length + 1, question: '', answer: '' });
  }

  removeWhy(index: number) {
    this.fiveWhys.splice(index, 1);
    // Keep the chain numbered 1..n so the sequence stays readable.
    this.fiveWhys.forEach((w, i) => (w.whyNumber = i + 1));
  }

  addSixM() {
    this.sixMItems.push({ category: 'MACHINE', cause: '', isRoot: false });
  }

  removeSixM(index: number) {
    this.sixMItems.splice(index, 1);
  }

  // ── Save ────────────────────────────────────────────────────────────────
  save() {
    const filledWhys = this.fiveWhys.filter(w => w.question.trim() && w.answer.trim());
    const filledSixM = this.sixMItems.filter(s => s.cause.trim());

    if (!this.form.ticketId) {
      this.messageService.add({ severity: 'warn', summary: 'Ticket required', detail: 'Select the ticket this analysis belongs to' });
      return;
    }
    // Mirror the server's framework rules so the user is told before the round trip.
    if (this.needsFiveWhys && filledWhys.length === 0) {
      this.messageService.add({ severity: 'warn', summary: 'Five Whys required', detail: 'Fill at least one why (question and answer)' });
      return;
    }
    if (this.needsSixM && filledSixM.length === 0) {
      this.messageService.add({ severity: 'warn', summary: '6M required', detail: 'Add at least one cause' });
      return;
    }
    // Only a finished analysis reaches the Knowledge Base, so insist on a
    // conclusion before it can leave draft.
    if (this.form.status !== 'DRAFT' && !String(this.form.conclusion).trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Conclusion required', detail: 'A completed analysis needs a conclusion — it is what the Knowledge Base publishes' });
      return;
    }

    const payload: any = {
      ticketId: Number(this.form.ticketId),
      framework: this.form.framework,
      status: this.form.status,
      summary: this.form.summary?.trim() || null,
      conclusion: this.form.conclusion?.trim() || null,
      correctiveAction: this.form.correctiveAction?.trim() || null,
      preventiveAction: this.form.preventiveAction?.trim() || null,
      performedAt: new Date().toISOString(),
      fiveWhys: this.needsFiveWhys ? filledWhys : [],
      sixMItems: this.needsSixM ? filledSixM : [],
    };

    this.saving = true;
    const req$ = this.editingId
      ? this.rcaService.update(this.editingId, payload)
      : this.rcaService.create(payload);

    req$.subscribe({
      next: () => {
        this.saving = false;
        this.showFormDialog = false;
        this.messageService.add({
          severity: 'success',
          summary: this.editingId ? 'Updated' : 'Created',
          detail: this.form.status === 'DRAFT'
            ? 'Saved as draft — publish it as Completed to reach the Knowledge Base'
            : 'Analysis saved and published to the Knowledge Base'
        });
        this.loadAll();
      },
      error: (e: any) => {
        this.saving = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: e?.error?.message || 'Failed to save RCA' });
        this.cdr.markForCheck();
      }
    });
  }

  remove(rca: any) {
    this.rcaService.delete(rca.id).subscribe({
      next: () => { this.messageService.add({ severity: 'success', summary: 'Deleted', detail: 'RCA removed' }); this.loadAll(); },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to delete RCA' })
    });
  }

  viewRca(rca: any) {
    this.rcaService.getById(rca.id).subscribe({
      next: (res: any) => {
        this.selectedRca = res;
        this.showDetailDialog = true;
        this.cdr.markForCheck();
      },
      error: () => this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load RCA detail' })
    });
  }

  ticketLabel(ticketId: number): string {
    const t = this.tickets.find(x => x.id === ticketId);
    return t ? t.ticketId : `#${ticketId}`;
  }

  getStatusSeverity(status: string): 'warn' | 'success' | 'danger' | 'secondary' {
    if (status === 'REVIEWED') return 'success';
    if (status === 'COMPLETED') return 'warn';
    if (status === 'DRAFT') return 'secondary';
    return 'secondary';
  }

  getFrameworkSeverity(fw: string): 'info' | 'warn' | 'success' {
    if (fw === 'FIVE_WHYS') return 'info';
    if (fw === 'SIX_M') return 'warn';
    return 'success';
  }

  formatDate(d: any): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
