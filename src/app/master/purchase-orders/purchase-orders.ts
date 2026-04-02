import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { SelectModule } from 'primeng/select';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { TooltipModule } from 'primeng/tooltip';
import { InputTextModule } from 'primeng/inputtext';
import { DatePickerModule } from 'primeng/datepicker';
import { TextareaModule } from 'primeng/textarea';
import { MessageService } from 'primeng/api';
import { PurchaseOrderService } from '../../services/purchase-order/purchase-order';
import { Assets } from '../../services/assets/assets';
import { AssetIndentService } from '../../services/asset-indent/asset-indent.service';

@Component({
  selector: 'app-purchase-orders',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule, TagModule,
    ToastModule, SelectModule, DialogModule, InputNumberModule,
    TooltipModule, InputTextModule, DatePickerModule, TextareaModule,
  ],
  templateUrl: './purchase-orders.html',
  styleUrl: './purchase-orders.css',
  providers: [MessageService]
})
export class PurchaseOrders implements OnInit {
  userRole = localStorage.getItem('role') || '';

  isRole(...roles: string[]): boolean { return roles.includes(this.userRole); }

  // ── List State ────────────────────────────────────────────────────────────
  pos: any[] = [];
  totalRecords = 0;
  loading = false;
  page = 1;
  limit = 15;

  filters: any = {
    status: null,
    vendorId: null,
    departmentId: null,
  };

  statusOptions = [
    { label: 'All Statuses', value: null },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'HOD Approved', value: 'HOD_APPROVED' },
    { label: 'Management Approved', value: 'MGMT_APPROVED' },
    { label: 'Sent to Vendor', value: 'SENT_TO_VENDOR' },
    { label: 'Partially Received', value: 'PARTIALLY_RECEIVED' },
    { label: 'Fully Received', value: 'FULLY_RECEIVED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  vendorOptions: { label: string; value: number }[] = [];
  departmentOptions: { label: string; value: number }[] = [];
  indentOptions: { label: string; value: number }[] = [];

  // Approved indents (for the tab)
  get pendingIndentCount(): number { return this.approvedIndents.filter(i => !i.hasPO).length; }
  approvedIndents: any[] = [];
  loadingIndents = false;
  creatingPOFromIndent = false;
  showVendorDialog = false;
  selectedIndentForPO: any = null;
  vendorForIndentPO: number | null = null;

  // ── View State ────────────────────────────────────────────────────────────
  activeView: 'list' | 'create' | 'indents' = 'list';
  showDetailDialog = false;
  detailPO: any = null;
  savingPO = false;
  approvingPO = false;
  sendingToVendor = false;
  cancellingPO = false;

  // ── Create Form ───────────────────────────────────────────────────────────
  poForm = this.emptyForm();

  itemTypeOptions = [
    { label: 'Asset', value: 'ASSET' },
    { label: 'Spare Part', value: 'SPARE_PART' },
    { label: 'Consumable', value: 'CONSUMABLE' },
    { label: 'Service', value: 'SERVICE' },
  ];

  constructor(
    private poService: PurchaseOrderService,
    private assetsService: Assets,
    private indentService: AssetIndentService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadPOs();
    this.loadVendors();
    this.loadDepartments();
    // Load indents after a small delay so POs are available for cross-reference
    setTimeout(() => { this.loadIndents(); this.reloadIndentsAfterPOs(); }, 500);
  }

  // ── Data Loading ──────────────────────────────────────────────────────────

  loadPOs() {
    this.loading = true;
    const params: any = {
      page: this.page,
      limit: this.limit,
      ...this.filters,
    };

    this.poService.getAll(params).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.pos = res.data ?? res ?? [];
          this.totalRecords = res.pagination?.total ?? res.total ?? this.pos.length;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.loading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load purchase orders' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadVendors() {
    this.assetsService.getVendors().subscribe({
      next: (res: any[]) => {
        setTimeout(() => {
          this.vendorOptions = res.map(v => ({ label: v.name, value: v.id }));
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
          this.departmentOptions = res.map(d => ({ label: d.name, value: d.id }));
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  loadIndents() {
    this.loadingIndents = true;
    this.indentService.getAll({ status: 'MANAGEMENT_APPROVED' }).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          const list = Array.isArray(res) ? res : (res?.data ?? []);

          // Get all indent IDs that already have a non-cancelled PO
          const indentIdsWithPO = new Set(
            this.pos
              .filter((po: any) => po.indentId && po.status !== 'CANCELLED')
              .map((po: any) => po.indentId)
          );

          // Full list for the tab (show all, mark which have PO)
          this.approvedIndents = list.map((i: any) => ({
            ...i,
            hasPO: indentIdsWithPO.has(i.id),
          }));

          // Dropdown only shows indents WITHOUT a PO
          this.indentOptions = list
            .filter((i: any) => !indentIdsWithPO.has(i.id))
            .map((i: any) => ({
              label: `${i.indentNumber || '#' + i.id} — ${i.assetName || i.purpose || 'Indent'}`,
              value: i.id,
            }));

          this.loadingIndents = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.loadingIndents = false;
        setTimeout(() => this.cdr.detectChanges());
      }
    });
  }

  // Also reload indents after POs are loaded (to cross-reference)
  reloadIndentsAfterPOs() {
    // Get ALL POs (not just current page) to check indent linkage
    this.poService.getAll({ limit: 1000 }).subscribe({
      next: (res: any) => {
        const allPOs = res.data ?? res ?? [];
        const indentIdsWithPO = new Set(
          allPOs
            .filter((po: any) => po.indentId && po.status !== 'CANCELLED')
            .map((po: any) => po.indentId)
        );

        this.approvedIndents = this.approvedIndents.map((i: any) => ({
          ...i,
          hasPO: indentIdsWithPO.has(i.id),
        }));

        this.indentOptions = this.approvedIndents
          .filter((i: any) => !i.hasPO)
          .map((i: any) => ({
            label: `${i.indentNumber || '#' + i.id} — ${i.assetName || i.purpose || 'Indent'}`,
            value: i.id,
          }));

        setTimeout(() => this.cdr.detectChanges());
      },
      error: () => {}
    });
  }

  // Create PO from indent
  openCreatePOFromIndent(indent: any) {
    this.selectedIndentForPO = indent;
    this.vendorForIndentPO = null;
    this.showVendorDialog = true;
  }

  submitCreatePOFromIndent() {
    if (!this.selectedIndentForPO || !this.vendorForIndentPO) {
      this.messageService.add({ severity: 'warn', summary: 'Missing', detail: 'Please select a vendor' });
      return;
    }
    this.creatingPOFromIndent = true;
    this.poService.createFromIndent(this.selectedIndentForPO.id, { vendorId: this.vendorForIndentPO }).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.creatingPOFromIndent = false;
          this.showVendorDialog = false;
          const poNumber = res?.poNumber || res?.data?.poNumber || 'PO';
          this.messageService.add({ severity: 'success', summary: 'PO Created', detail: `${poNumber} created from indent` });
          this.activeView = 'list';
          this.loadPOs();
          this.loadIndents();
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        this.creatingPOFromIndent = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to create PO from indent' });
        setTimeout(() => this.cdr.detectChanges());
      }
    });
  }

  onPageChange(event: any) {
    this.page = Math.floor(event.first / event.rows) + 1;
    this.limit = event.rows;
    this.loadPOs();
  }

  applyFilters() {
    this.page = 1;
    this.loadPOs();
  }

  resetFilters() {
    this.filters = { status: null, vendorId: null, departmentId: null };
    this.page = 1;
    this.loadPOs();
  }

  // ── Create PO ─────────────────────────────────────────────────────────────

  emptyForm() {
    return {
      vendorId: null as number | null,
      departmentId: null as number | null,
      indentId: null as number | null,
      deliveryDate: null as Date | null,
      paymentTerms: '',
      shippingAddress: '',
      notes: '',
      lines: [this.emptyLine()],
    };
  }

  emptyLine() {
    return {
      itemType: 'ASSET' as string,
      description: '',
      quantity: 1,
      unitPrice: null as number | null,
      taxPercent: 0,
      hsnCode: '',
      assetCategoryId: null as number | null,
      specifications: '',
    };
  }

  openCreate() {
    this.poForm = this.emptyForm();
    this.activeView = 'create';
  }

  onIndentSelect(indentId: number | null) {
    if (!indentId) return;

    // Find the indent from our loaded list
    const indent = this.approvedIndents.find((i: any) => i.id === indentId);
    if (!indent) {
      // Fallback: fetch from API
      this.indentService.getById(indentId).subscribe({
        next: (res: any) => {
          setTimeout(() => {
            this.populateFromIndent(res?.data ?? res);
            this.cdr.detectChanges();
          });
        },
        error: () => {}
      });
      return;
    }
    this.populateFromIndent(indent);
  }

  private populateFromIndent(indent: any) {
    // Auto-fill department
    if (indent.departmentId) {
      this.poForm.departmentId = indent.departmentId;
    }

    // Auto-fill delivery date from required by date
    if (indent.requiredByDate) {
      this.poForm.deliveryDate = new Date(indent.requiredByDate);
    }

    // Auto-fill notes from justification
    if (indent.justification) {
      this.poForm.notes = indent.justification;
    }

    // Auto-fill line item from indent details
    const qty = indent.quantity || 1;
    const unitPrice = indent.estimatedBudget ? Number(indent.estimatedBudget) / qty : 0;

    this.poForm.lines = [{
      itemType: 'ASSET',
      description: indent.assetName || indent.purpose || '',
      quantity: qty,
      unitPrice: unitPrice > 0 ? unitPrice : null,
      taxPercent: 0,
      hsnCode: '',
      assetCategoryId: indent.assetCategoryId || null,
      specifications: indent.specifications || '',
    }];

    this.messageService.add({
      severity: 'info',
      summary: 'Indent Loaded',
      detail: `Form auto-filled from indent: ${indent.assetName || indent.indentNumber || '#' + indent.id}`
    });
    this.cdr.detectChanges();
  }

  addLine() {
    this.poForm.lines.push(this.emptyLine());
  }

  removeLine(index: number) {
    if (this.poForm.lines.length > 1) {
      this.poForm.lines.splice(index, 1);
    }
  }

  getLineTotal(line: any): number {
    const base = (line.quantity || 0) * (line.unitPrice || 0);
    const tax = base * ((line.taxPercent || 0) / 100);
    return base + tax;
  }

  get subtotal(): number {
    return this.poForm.lines.reduce((sum, l) => sum + (l.quantity || 0) * (l.unitPrice || 0), 0);
  }

  get taxTotal(): number {
    return this.poForm.lines.reduce((sum, l) => {
      const base = (l.quantity || 0) * (l.unitPrice || 0);
      return sum + base * ((l.taxPercent || 0) / 100);
    }, 0);
  }

  get grandTotal(): number {
    return this.subtotal + this.taxTotal;
  }

  savePO() {
    if (!this.poForm.vendorId || !this.poForm.departmentId) {
      this.messageService.add({ severity: 'warn', summary: 'Missing', detail: 'Vendor and Department are required' });
      return;
    }
    const hasValidLine = this.poForm.lines.some(l => l.description && l.unitPrice);
    if (!hasValidLine) {
      this.messageService.add({ severity: 'warn', summary: 'Missing', detail: 'At least one line with description and unit price is required' });
      return;
    }

    this.savingPO = true;
    const payload = {
      ...this.poForm,
      deliveryDate: this.poForm.deliveryDate ? new Date(this.poForm.deliveryDate).toISOString() : null,
      lines: this.poForm.lines.filter(l => l.description && l.unitPrice),
    };

    this.poService.create(payload).subscribe({
      next: () => {
        setTimeout(() => {
          this.savingPO = false;
          this.activeView = 'list';
          this.loadPOs();
          this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Purchase order created successfully' });
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.savingPO = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create purchase order' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ── Detail / Actions ──────────────────────────────────────────────────────

  viewDetail(po: any) {
    this.poService.getById(po.id).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.detailPO = res.data ?? res;
          this.showDetailDialog = true;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load PO details' });
      }
    });
  }

  approvePO(level: 'HOD' | 'MANAGEMENT') {
    if (!this.detailPO) return;
    this.approvingPO = true;
    this.poService.approve(this.detailPO.id, { level }).subscribe({
      next: () => {
        setTimeout(() => {
          this.approvingPO = false;
          this.messageService.add({ severity: 'success', summary: 'Approved', detail: `PO approved at ${level} level` });
          this.showDetailDialog = false;
          this.loadPOs();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.approvingPO = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to approve PO' });
      }
    });
  }

  sendToVendor() {
    if (!this.detailPO) return;
    this.sendingToVendor = true;
    this.poService.sendToVendor(this.detailPO.id).subscribe({
      next: () => {
        setTimeout(() => {
          this.sendingToVendor = false;
          this.messageService.add({ severity: 'success', summary: 'Sent', detail: 'PO sent to vendor' });
          this.showDetailDialog = false;
          this.loadPOs();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.sendingToVendor = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to send PO to vendor' });
      }
    });
  }

  cancelPO() {
    if (!this.detailPO) return;
    this.cancellingPO = true;
    this.poService.cancel(this.detailPO.id).subscribe({
      next: () => {
        setTimeout(() => {
          this.cancellingPO = false;
          this.messageService.add({ severity: 'success', summary: 'Cancelled', detail: 'Purchase order cancelled' });
          this.showDetailDialog = false;
          this.loadPOs();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.cancellingPO = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to cancel PO' });
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const map: Record<string, any> = {
      DRAFT: 'secondary',
      HOD_APPROVED: 'info',
      MGMT_APPROVED: 'info',
      SENT_TO_VENDOR: 'warn',
      PARTIALLY_RECEIVED: 'warn',
      FULLY_RECEIVED: 'success',
      CANCELLED: 'danger',
    };
    return map[status] || 'secondary';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'Draft',
      HOD_APPROVED: 'HOD Approved',
      MGMT_APPROVED: 'Mgmt Approved',
      SENT_TO_VENDOR: 'Sent to Vendor',
      PARTIALLY_RECEIVED: 'Partially Received',
      FULLY_RECEIVED: 'Fully Received',
      CANCELLED: 'Cancelled',
    };
    return map[status] || status;
  }

  getGraStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const map: Record<string, any> = {
      DRAFT: 'secondary', INSPECTION_PENDING: 'warn', INSPECTION_PASSED: 'info',
      INSPECTION_FAILED: 'danger', ACCEPTED: 'success', PARTIALLY_ACCEPTED: 'warn', REJECTED: 'danger',
    };
    return map[status] || 'secondary';
  }

  getGraStatusLabel(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'Draft', INSPECTION_PENDING: 'Inspection Pending', INSPECTION_PASSED: 'Inspection Passed',
      INSPECTION_FAILED: 'Inspection Failed', ACCEPTED: 'Accepted', PARTIALLY_ACCEPTED: 'Partially Accepted', REJECTED: 'Rejected',
    };
    return map[status] || status;
  }

  formatCurrency(val: number | null | undefined): string {
    if (val == null) return '--';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);
  }

  canApproveHOD(): boolean {
    return this.detailPO?.status === 'DRAFT' && this.isRole('HOD', 'ADMIN');
  }

  canApproveManagement(): boolean {
    return this.detailPO?.status === 'HOD_APPROVED' && this.isRole('ADMIN');
  }

  canSendToVendor(): boolean {
    return this.detailPO?.status === 'MGMT_APPROVED' && this.isRole('HOD', 'ADMIN');
  }

  canCancel(): boolean {
    return this.detailPO?.status && !['FULLY_RECEIVED', 'PARTIALLY_RECEIVED', 'CANCELLED', 'CLOSED'].includes(this.detailPO.status) && this.isRole('HOD', 'ADMIN');
  }
}
