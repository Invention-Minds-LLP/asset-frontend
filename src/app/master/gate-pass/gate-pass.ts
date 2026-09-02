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
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { GatePassService } from '../../services/gate-pass/gate-pass';
import { Assets } from '../../services/assets/assets';
import { environment } from '../../../environment/environment.prod';
import { OverflowTooltipDirective } from '../../shared/directives/overflow-tooltip.directive';

interface ItemRow {
  assetId: number | null;
  description: string;
  make: string;
  model: string;
  quantity: number;
  remarks: string;
}

@Component({
  selector: 'app-gate-pass',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, TableModule, TagModule, ToastModule, TabViewModule,
    InputTextModule, FloatLabelModule, SelectModule, TextareaModule, TooltipModule, DialogModule,
    OverflowTooltipDirective, DatePickerModule, CheckboxModule
  ],
  templateUrl: './gate-pass.html',
  styleUrl: './gate-pass.css',
  providers: [MessageService]
})
export class GatePass implements OnInit {
  rows: any[] = [];
  overdueRows: any[] = [];
  pendingApprovalRows: any[] = [];
  loading = false;
  editingId: number | null = null;
  showForm = false;

  form = this.getEmptyForm();

  // Approve / Reject dialogs
  approveDialog = { open: false, row: null as any, remarks: '' };
  rejectDialog  = { open: false, row: null as any, reason: '' };

  typeOptions = [
    { label: 'Returnable', value: 'RETURNABLE' },
    { label: 'Non-Returnable', value: 'NON_RETURNABLE' }
  ];
  assetOptions: { label: string; value: number }[] = [];

  // Who is looking. Row actions are the raiser's (plus admin) — an approver's
  // tool for stopping someone else's pass is Reject, which records a reason.
  private myEmployeeId = Number(localStorage.getItem('employeeDbId')) || null;
  private myRole = localStorage.getItem('role') || '';
  // Employee.role decides the approval route. Falls back to User.role for
  // sessions that signed in before it was returned.
  private myEmployeeRole = localStorage.getItem('employeeRole') || localStorage.getItem('role') || '';

  /**
   * Only approvers get the approval queue. Security staff are explicitly barred
   * from approving (the API returns 403), so showing them an approval tab was
   * offering a job they cannot do.
   */
  canApprove(): boolean {
    const r = [this.myRole, this.myEmployeeRole];
    if (r.includes('SECURITY')) return false;
    return r.some(x => ['ADMIN', 'HOD', 'OPERATIONS', 'CEO_COO'].includes(x));
  }

  /** An HOD or above endorses their own request, so stage one is skipped. */
  private skipsHodStage(): boolean {
    return this.myEmployeeRole === 'HOD' || this.myEmployeeRole === 'CEO_COO';
  }

  /**
   * The submit button said "Submit for HOD approval" for everyone — untrue for
   * an HOD, whose pass goes straight to Operations.
   */
  submitTooltip(): string {
    return this.skipsHodStage()
      ? 'Submit for Operations approval — your own department approval is not required'
      : 'Submit for HOD approval';
  }

  /** True when the signed-in user raised this pass. */
  isMine(row: any): boolean {
    return this.myEmployeeId != null && row?.requestedById === this.myEmployeeId;
  }

  /** Admins act on anyone's pass; everyone else only on their own. */
  canManage(row: any): boolean {
    return this.myRole === 'ADMIN' || this.isMine(row);
  }
  employeeOptions: { label: string; value: number }[] = [];
  departmentOptions: { label: string; value: number }[] = [];
  // Kept so picking a carrier can auto-fill their ID, phone and department.
  private employeeById = new Map<number, any>();
  private assetById = new Map<number, any>();
  /** assetId → the pass already holding it, so it can be kept out of the picker. */
  private assetHeldBy = new Map<number, string>();

  constructor(
    private gatePassService: GatePassService,
    private assetsService: Assets,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAll();
    this.loadOverdue();
    this.loadPendingApproval();
    this.loadAssets();
    this.loadEmployees();
    this.loadDepartments();
  }

  // ── Form ───────────────────────────────────────────────────────────────────
  getEmptyForm() {
    return {
      type: 'RETURNABLE',
      issuedTo: '',
      purpose: '',
      expectedReturnDate: null as Date | null,
      // Carrier: an employee by default, or free text when someone outside the
      // organisation (courier, vendor rep) is taking the items.
      carriedByEmployeeId: null as number | null,
      externalCarrier: false,
      carriedBy: '',
      employeeCode: '',
      employeeContact: '',
      processDepartmentId: null as number | null,
      processDept: '',
      toAddress: '',
      reason: '',
      ticketId: null as number | null,
      items: [{ assetId: null, description: '', make: '', model: '', quantity: 1, remarks: '' } as ItemRow],
    };
  }

  addItem() { this.form.items.push({ assetId: null, description: '', make: '', model: '', quantity: 1, remarks: '' }); }
  removeItem(i: number) {
    if (this.form.items.length === 1) { this.toast('warn', 'At least one item is required'); return; }
    this.form.items.splice(i, 1);
  }

  // ── Loaders ────────────────────────────────────────────────────────────────
  loadAll() {
    this.loading = true;
    this.gatePassService.getAll().subscribe({
      next: r => { setTimeout(() => { this.rows = r || []; this.loading = false; this.cdr.detectChanges(); }); },
      error: () => { setTimeout(() => { this.loading = false; this.cdr.detectChanges(); }); this.toast('error', 'Failed to load gate passes'); }
    });
  }
  loadOverdue() {
    this.gatePassService.getOverdue().subscribe({
      next: r => { setTimeout(() => { this.overdueRows = r || []; this.cdr.detectChanges(); }); },
      error: () => {}
    });
  }
  loadPendingApproval() {
    if (!this.canApprove()) return;
    this.gatePassService.getPendingApproval().subscribe({
      next: r => { setTimeout(() => { this.pendingApprovalRows = r || []; this.cdr.detectChanges(); }); },
      error: () => {}
    });
  }
  /**
   * Uses the dropdown endpoint, not the role-scoped asset list.
   *
   * getAllAssets() scopes by who may MANAGE an asset, which is the wrong
   * question here — a requester frequently ships equipment their own department
   * doesn't own (a technician sends an ICU monitor; security sends a camera).
   * With 7 of 9 departments holding no assets at all, that scoping left the
   * picker empty for most people.
   *
   * Letting anyone select any asset is safe because the movement still needs the
   * owning department's HOD to approve it, and a pass may only cover one
   * department. This endpoint also excludes disposed/scrapped/retired assets,
   * which should never leave on a gate pass anyway.
   */
  loadAssets() {
    // Two independent fetches; whichever lands last rebuilds the list, so the
    // options are correct regardless of ordering.
    this.fetchAssets();
    this.gatePassService.getAssetsOnPass().subscribe({
      next: (rows) => {
        this.assetHeldBy = new Map((rows || []).map(r => [r.assetId, r.gatePassNo]));
        this.buildAssetOptions();
      },
      error: () => this.buildAssetOptions(),
    });
  }

  private rawAssets: any[] = [];

  private buildAssetOptions() {
    // An asset already on a live pass is left out entirely: offering it only to
    // reject the save is a worse experience than never showing it.
    //
    // Anything already chosen on this form stays, though — when editing a draft
    // its own items are "held" by that same draft, and dropping them would blank
    // the selection the user is looking at.
    const mine = new Set(
      (this.form?.items ?? []).map(i => i.assetId).filter((x): x is number => x != null)
    );
    const usable = (this.rawAssets || []).filter(a => !this.assetHeldBy.has(a.id) || mine.has(a.id));
    this.assetOptions = usable.map(a => ({
      label: `${a.assetId} - ${a.assetName}${a.department?.name ? ` · ${a.department.name}` : ''}`,
      value: a.id,
    }));
    this.cdr.detectChanges();
  }

  private fetchAssets() {
    this.assetsService.getAllAssetsForDropdown().subscribe({
      next: (res: any[]) => {
        setTimeout(() => {
          // Keep the department against each asset so the one-department rule
          // can be checked here, before the server rejects the submission.
          this.rawAssets = res || [];
          this.assetById = new Map(this.rawAssets.map(a => [a.id, a]));
          this.buildAssetOptions();
        });
      },
      error: () => {}
    });
  }

  /**
   * Distinct department names across the asset-linked rows. More than one means
   * the pass would need two HODs to approve it, which the workflow doesn't allow.
   */
  private mixedDepartments(items: ItemRow[]): string[] {
    const names = new Map<number, string>();
    for (const it of items) {
      if (!it.assetId) continue;
      const a = this.assetById.get(it.assetId);
      const deptId = a?.departmentId ?? a?.department?.id;
      if (deptId == null) continue;
      names.set(Number(deptId), a?.department?.name ?? this.departmentName(Number(deptId)));
    }
    return [...names.values()];
  }

  private departmentName(id: number): string {
    return this.departmentOptions.find(d => d.value === id)?.label ?? `Department ${id}`;
  }

  loadEmployees() {
    this.assetsService.getEmployees().subscribe({
      next: (res: any[]) => {
        setTimeout(() => {
          this.employeeById = new Map((res || []).map(e => [e.id, e]));
          this.employeeOptions = (res || []).map(e => ({
            label: `${e.name} (${e.employeeID})`,
            value: e.id,
          }));
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  loadDepartments() {
    this.assetsService.getDepartments().subscribe({
      next: (res: any[]) => {
        setTimeout(() => {
          this.departmentOptions = (res || []).map(d => ({ label: d.name, value: d.id }));
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  /**
   * Picking a carrier fills in their ID, phone and department, so the three
   * dependent fields can't be typed wrong (or filled with "Goods").
   */
  onCarrierChange() {
    const emp = this.form.carriedByEmployeeId ? this.employeeById.get(this.form.carriedByEmployeeId) : null;
    if (!emp) { this.form.employeeCode = ''; this.form.employeeContact = ''; return; }
    this.form.carriedBy = emp.name || '';
    this.form.employeeCode = emp.employeeID || '';
    this.form.employeeContact = emp.phone || '';
    // Default the accountable department to theirs; still changeable, because a
    // technician often carries another department's asset.
    if (!this.form.processDepartmentId && emp.departmentId) {
      this.form.processDepartmentId = emp.departmentId;
    }
  }

  /** Switching to an external carrier drops the employee link and its auto-fill. */
  onExternalCarrierChange() {
    if (this.form.externalCarrier) {
      this.form.carriedByEmployeeId = null;
      this.form.employeeCode = '';
    }
    this.form.carriedBy = '';
    this.form.employeeContact = '';
  }

  // ── Save (always lands as DRAFT) ───────────────────────────────────────────
  save() {
    // An item is valid if it links an asset OR describes a (non-asset) spare / surgical item.
    const cleanItems = (this.form.items || []).filter(i => i.assetId || i.description?.trim());
    if (!this.form.issuedTo || !this.form.purpose || !this.form.type) {
      this.toast('warn', 'Type, Issued To and Purpose are required'); return;
    }
    if (cleanItems.length === 0) {
      this.toast('warn', 'Add at least one item (select an asset or enter an item description)'); return;
    }
    // Caught here as well as on the server, so the problem surfaces while the
    // form is still open rather than at submit time.
    const depts = this.mixedDepartments(cleanItems);
    if (depts.length > 1) {
      this.toast('warn', `This pass mixes assets from ${depts.join(' and ')}. Raise a separate gate pass for each department.`);
      return;
    }

    const payload: any = {
      type: this.form.type,
      issuedTo: this.form.issuedTo,
      purpose: this.form.purpose,
      expectedReturnDate: this.form.expectedReturnDate || undefined,
      // The server re-derives carriedBy / employeeCode / processDept from these
      // links; the strings below only stand alone for an external carrier.
      carriedByEmployeeId: this.form.externalCarrier ? null : this.form.carriedByEmployeeId,
      processDepartmentId: this.form.processDepartmentId,
      carriedBy: this.form.carriedBy,
      employeeCode: this.form.employeeCode,
      employeeContact: this.form.employeeContact,
      processDept: this.form.processDept,
      toAddress: this.form.toAddress,
      reason: this.form.reason,
      ticketId: this.form.ticketId,
      items: cleanItems.map(i => ({
        assetId: i.assetId ? Number(i.assetId) : null,
        description: i.description?.trim() || null,
        make: i.make?.trim() || null,
        model: i.model?.trim() || null,
        quantity: Number(i.quantity || 1),
        remarks: i.remarks,
      })),
    };

    const obs = this.editingId
      ? this.gatePassService.update(this.editingId, payload)
      : this.gatePassService.create(payload);

    obs.subscribe({
      next: () => { setTimeout(() => { this.toast('success', this.editingId ? 'Saved (DRAFT)' : 'Created (DRAFT) — submit when ready'); this.reset(); this.refreshAll(); this.cdr.detectChanges(); }); },
      error: (err) => this.toast('error', err?.error?.message || 'Failed to save')
    });
  }

  edit(row: any) {
    if (row.status !== 'DRAFT') { this.toast('warn', `Only DRAFT passes can be edited (this is ${row.status})`); return; }
    this.editingId = row.id;
    this.showForm = true;
    this.form = {
      type: row.type || 'RETURNABLE',
      issuedTo: row.issuedTo || '',
      purpose: row.purpose || '',
      expectedReturnDate: row.expectedReturnDate ? new Date(row.expectedReturnDate) : null,
      carriedByEmployeeId: row.carriedByEmployeeId ?? null,
      // No employee link but a name recorded → it was an external carrier.
      externalCarrier: !row.carriedByEmployeeId && !!row.carriedBy,
      carriedBy: row.carriedBy || '',
      employeeCode: row.employeeCode || '',
      employeeContact: row.employeeContact || '',
      processDepartmentId: row.processDepartmentId ?? null,
      processDept: row.processDept || '',
      toAddress: row.toAddress || '',
      reason: row.reason || '',
      ticketId: row.ticketId ?? null,
      items: (row.items || []).length
        ? row.items.map((it: any) => ({
            assetId: it.assetId ?? null,
            description: it.description || '',
            make: it.make || '',
            model: it.model || '',
            quantity: it.quantity || 1,
            remarks: it.remarks || '',
          }))
        : [{ assetId: null, description: '', make: '', model: '', quantity: 1, remarks: '' }],
    };
    // The draft's own assets are held by this pass — re-run so they stay listed.
    this.buildAssetOptions();
  }

  // ── Lifecycle actions ──────────────────────────────────────────────────────
  submit(row: any) {
    this.gatePassService.submit(row.id).subscribe({
      // Report where it ACTUALLY went, read back from the response, rather than
      // assuming — the server decides the route.
      next: (res: any) => {
        const msg = res?.status === 'PENDING_OPS_APPROVAL'
          ? 'Submitted for Operations approval'
          : 'Submitted for HOD approval';
        this.toast('success', msg);
        this.refreshAll();
      },
      error: (err) => this.toast('error', err?.error?.message || 'Failed to submit')
    });
  }

  openApprove(row: any) { this.approveDialog = { open: true, row, remarks: '' }; }
  openReject(row: any)  { this.rejectDialog  = { open: true, row, reason: '' }; }

  confirmApprove() {
    const { row, remarks } = this.approveDialog;
    if (!row) return;
    this.gatePassService.approve(row.id, remarks).subscribe({
      next: () => { this.toast('success', 'Gate pass approved'); this.approveDialog.open = false; this.refreshAll(); },
      error: (err) => this.toast('error', err?.error?.message || 'Failed to approve')
    });
  }
  confirmReject() {
    const { row, reason } = this.rejectDialog;
    if (!row) return;
    if (!reason.trim()) { this.toast('warn', 'Rejection reason is required'); return; }
    this.gatePassService.reject(row.id, reason.trim()).subscribe({
      next: () => { this.toast('success', 'Gate pass rejected'); this.rejectDialog.open = false; this.refreshAll(); },
      error: (err) => this.toast('error', err?.error?.message || 'Failed to reject')
    });
  }

  // Cancel / delete both go through a dialog rather than a browser confirm(),
  // so the consequence is spelled out and the styling matches the rest of the app.
  confirmDialog = {
    open: false, row: null as any, saving: false,
    mode: 'cancel' as 'cancel' | 'delete',
  };

  cancel(row: any) {
    this.confirmDialog = { open: true, row, saving: false, mode: 'cancel' };
  }

  delete(row: any) {
    if (row.status !== 'DRAFT') { this.toast('warn', 'Only DRAFT passes can be deleted'); return; }
    this.confirmDialog = { open: true, row, saving: false, mode: 'delete' };
  }

  confirmDialogTitle(): string {
    return this.confirmDialog.mode === 'delete' ? 'Delete Gate Pass' : 'Cancel Gate Pass';
  }

  confirmDialogBody(): string {
    return this.confirmDialog.mode === 'delete'
      ? 'This draft will be removed permanently, along with its items. This cannot be undone.'
      : 'The pass will be cancelled and can no longer be approved or issued. Raise a new pass if the movement still needs to happen.';
  }

  runConfirmed() {
    const { row, mode } = this.confirmDialog;
    if (!row) return;
    this.confirmDialog.saving = true;

    const done = (msg: string) => {
      setTimeout(() => {
        this.confirmDialog = { open: false, row: null, saving: false, mode };
        this.toast('success', msg);
        this.refreshAll();
        this.cdr.detectChanges();
      });
    };
    const failed = (err: any, fallback: string) => {
      setTimeout(() => { this.confirmDialog.saving = false; this.cdr.detectChanges(); });
      this.toast('error', err?.error?.message || fallback);
    };

    if (mode === 'delete') {
      this.gatePassService.delete(row.id).subscribe({
        next: () => done('Deleted'),
        error: (err) => failed(err, 'Failed to delete'),
      });
    } else {
      this.gatePassService.updateStatus(row.id, 'CANCELLED').subscribe({
        next: () => done('Cancelled'),
        error: (err) => failed(err, 'Failed to cancel'),
      });
    }
  }

  close(row: any) {
    this.gatePassService.updateStatus(row.id, 'CLOSED').subscribe({
      next: () => { this.toast('success', 'Closed'); this.refreshAll(); },
      error: (err) => this.toast('error', err?.error?.message || 'Failed to close')
    });
  }

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

  // ── Helpers ────────────────────────────────────────────────────────────────
  refreshAll() { this.loadAll(); this.loadOverdue(); this.loadPendingApproval(); }
  reset() { this.editingId = null; this.showForm = false; this.form = this.getEmptyForm(); }

  /**
   * Approval runs in two stages, so the raw status is ambiguous to a reader —
   * "PENDING_APPROVAL" doesn't say *whose*. These labels do.
   *
   * Kept to two words. These render inside a pill, and a longer phrase wrapped
   * onto three lines and ballooned the tag into a blob that set the height of
   * the whole row. The full wording lives in statusHint() as a tooltip instead.
   */
  statusLabel(s: string): string {
    const m: Record<string, string> = {
      DRAFT: 'DRAFT',
      PENDING_APPROVAL: 'AWAITING HOD',
      PENDING_OPS_APPROVAL: 'AWAITING OPS',
      APPROVED: 'APPROVED',
      SECURITY_CLEARED: 'AWAITING EXIT',
      REJECTED: 'REJECTED',
      ISSUED: 'ISSUED',
      RETURNED: 'RETURNED',
      CLOSED: 'CLOSED',
      CANCELLED: 'CANCELLED',
    };
    return m[s] ?? s;
  }

  /** The sentence the pill is too small to carry. */
  statusHint(s: string): string {
    const m: Record<string, string> = {
      DRAFT: 'Not submitted yet',
      PENDING_APPROVAL: 'Waiting for the department HOD to approve',
      PENDING_OPS_APPROVAL: 'Approved by the HOD, waiting for Operations',
      APPROVED: 'Approved — security has not checked it at the desk yet',
      SECURITY_CLEARED: 'Cleared by security and still on site, awaiting exit',
      REJECTED: 'Rejected — see the rejection reason on the pass',
      ISSUED: 'Gated out — the items have left the premises',
      RETURNED: 'Items brought back and received at the gate',
      CLOSED: 'Closed, nothing further expected',
      CANCELLED: 'Cancelled before it left',
    };
    return m[s] ?? '';
  }

  getStatusSeverity(s: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const m: Record<string, any> = {
      DRAFT: 'secondary', PENDING_APPROVAL: 'warn', PENDING_OPS_APPROVAL: 'warn',
      APPROVED: 'info', SECURITY_CLEARED: 'info', REJECTED: 'danger',
      ISSUED: 'info', RETURNED: 'success', CLOSED: 'secondary', CANCELLED: 'danger'
    };
    return m[s] ?? 'secondary';
  }

  toast(severity: 'success' | 'error' | 'warn', detail: string) {
    this.messageService.add({ severity, summary: severity.toUpperCase(), detail });
  }
}
