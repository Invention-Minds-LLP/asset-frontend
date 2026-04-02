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
import { GoodsReceiptService } from '../../services/goods-receipt/goods-receipt';
import { PurchaseOrderService } from '../../services/purchase-order/purchase-order';
import { StoreService } from '../../services/store/store';

@Component({
  selector: 'app-goods-receipts',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule, TagModule,
    ToastModule, SelectModule, DialogModule, InputNumberModule,
    TooltipModule, InputTextModule, DatePickerModule, TextareaModule,
  ],
  templateUrl: './goods-receipts.html',
  styleUrl: './goods-receipts.css',
  providers: [MessageService]
})
export class GoodsReceipts implements OnInit {
  userRole = localStorage.getItem('role') || '';

  isRole(...roles: string[]): boolean { return roles.includes(this.userRole); }

  // ── List State ────────────────────────────────────────────────────────────
  gras: any[] = [];
  totalRecords = 0;
  loading = false;
  page = 1;
  limit = 15;

  filters: any = {
    status: null,
    purchaseOrderId: null,
  };

  statusOptions = [
    { label: 'All Statuses', value: null },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Inspected', value: 'INSPECTED' },
    { label: 'Accepted', value: 'ACCEPTED' },
    { label: 'Rejected', value: 'REJECTED' },
  ];

  poOptions: { label: string; value: number }[] = [];
  storeOptions: { label: string; value: number }[] = [];

  // ── View State ────────────────────────────────────────────────────────────
  activeView: 'list' | 'create' = 'list';
  showDetailDialog = false;
  detailGRA: any = null;
  savingGRA = false;
  inspectingGRA = false;
  acceptingGRA = false;
  rejectingGRA = false;

  // ── Create Form ───────────────────────────────────────────────────────────
  graForm = this.emptyForm();

  itemTypeOptions = [
    { label: 'Asset', value: 'ASSET' },
    { label: 'Spare Part', value: 'SPARE_PART' },
    { label: 'Consumable', value: 'CONSUMABLE' },
    { label: 'Service', value: 'SERVICE' },
  ];

  constructor(
    private graService: GoodsReceiptService,
    private poService: PurchaseOrderService,
    private storeService: StoreService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadGRAs();
    this.loadPOOptions();
    this.loadStoreOptions();
  }

  // ── Data Loading ──────────────────────────────────────────────────────────

  loadGRAs() {
    this.loading = true;
    const params: any = {
      page: this.page,
      limit: this.limit,
      ...this.filters,
    };

    this.graService.getAll(params).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.gras = res.data ?? res ?? [];
          this.totalRecords = res.pagination?.total ?? res.total ?? this.gras.length;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.loading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load goods receipts' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadPOOptions() {
    // Load POs that can still receive goods (SENT_TO_VENDOR or PARTIALLY_RECEIVED)
    // We load both statuses and merge, since the API filters by single status
    const statuses = ['SENT_TO_VENDOR', 'PARTIALLY_RECEIVED'];
    const allPOs: any[] = [];
    let completed = 0;

    statuses.forEach(status => {
      this.poService.getAll({ status, limit: 500 }).subscribe({
        next: (res: any) => {
          const list = Array.isArray(res) ? res : (res?.data ?? []);
          allPOs.push(...list);
          completed++;
          if (completed === statuses.length) {
            setTimeout(() => {
              // Deduplicate by id
              const seen = new Set<number>();
              this.poOptions = allPOs
                .filter((po: any) => {
                  if (seen.has(po.id)) return false;
                  seen.add(po.id);
                  return true;
                })
                .map((po: any) => ({
                  label: `${po.poNumber || po.id} — ${po.vendor?.name || po.vendorName || 'Vendor'}${po.status === 'PARTIALLY_RECEIVED' ? ' (Partial)' : ''}`,
                  value: po.id,
                }));
              this.cdr.detectChanges();
            });
          }
        },
        error: () => { completed++; }
      });
    });
  }

  loadStoreOptions() {
    this.storeService.getAll().subscribe({
      next: (res: any) => {
        setTimeout(() => {
          const list = Array.isArray(res) ? res : (res?.data ?? []);
          this.storeOptions = list.map((s: any) => ({
            label: s.name || s.storeName,
            value: s.id
          }));
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  onPageChange(event: any) {
    this.page = Math.floor(event.first / event.rows) + 1;
    this.limit = event.rows;
    this.loadGRAs();
  }

  applyFilters() {
    this.page = 1;
    this.loadGRAs();
  }

  resetFilters() {
    this.filters = { status: null, purchaseOrderId: null };
    this.page = 1;
    this.loadGRAs();
  }

  // ── Create GRA ────────────────────────────────────────────────────────────

  emptyForm() {
    return {
      purchaseOrderId: null as number | null,
      receiptDate: null as Date | null,
      deliveryChallanNo: '',
      invoiceNo: '',
      notes: '',
      lines: [this.emptyLine()],
    };
  }

  emptyLine() {
    return {
      itemType: 'ASSET' as string,
      description: '',
      receivedQty: 1,
      storeId: null as number | null,
      unitPrice: null as number | null,
      serialNumber: '',
    };
  }

  openCreate() {
    this.graForm = this.emptyForm();
    this.activeView = 'create';
  }

  selectPO(poId: number) {
    if (!poId) return;
    this.poService.getById(poId).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          const po = res.data ?? res;
          if (po.lines?.length) {
            this.graForm.lines = po.lines.map((line: any) => ({
              itemType: line.itemType || 'ASSET',
              description: line.description || '',
              receivedQty: line.quantity || 1,
              storeId: null,
              unitPrice: line.unitPrice || null,
              serialNumber: '',
            }));
          }
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load PO details' });
      }
    });
  }

  addLine() {
    this.graForm.lines.push(this.emptyLine());
  }

  removeLine(index: number) {
    if (this.graForm.lines.length > 1) {
      this.graForm.lines.splice(index, 1);
    }
  }

  getLineTotal(line: any): number {
    return (line.receivedQty || 0) * (line.unitPrice || 0);
  }

  get grandTotal(): number {
    return this.graForm.lines.reduce((sum, l) => sum + this.getLineTotal(l), 0);
  }

  saveGRA() {
    if (!this.graForm.purchaseOrderId) {
      this.messageService.add({ severity: 'warn', summary: 'Missing', detail: 'Please select a Purchase Order' });
      return;
    }
    const hasValidLine = this.graForm.lines.some(l => l.description && l.receivedQty);
    if (!hasValidLine) {
      this.messageService.add({ severity: 'warn', summary: 'Missing', detail: 'At least one line with description and received quantity is required' });
      return;
    }

    this.savingGRA = true;
    const payload = {
      ...this.graForm,
      receiptDate: this.graForm.receiptDate ? new Date(this.graForm.receiptDate).toISOString() : null,
      lines: this.graForm.lines.filter(l => l.description && l.receivedQty),
    };

    this.graService.create(payload).subscribe({
      next: () => {
        setTimeout(() => {
          this.savingGRA = false;
          this.activeView = 'list';
          this.loadGRAs();
          this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Goods receipt created successfully' });
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.savingGRA = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create goods receipt' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ── Detail / Actions ──────────────────────────────────────────────────────

  viewDetail(gra: any) {
    this.graService.getById(gra.id).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.detailGRA = res.data ?? res;
          this.showDetailDialog = true;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load GRA details' });
      }
    });
  }

  inspectGRA() {
    if (!this.detailGRA) return;
    const user = { employeeDbId: localStorage.getItem('employeeDbId') };
    const lineResults = (this.detailGRA.lines || []).map((line: any) => ({
      lineId: line.id,
      inspectionStatus: line.inspectionStatus || 'PASS',
      inspectionRemarks: line.inspectionRemarks || '',
      acceptedQty: line.inspectionStatus === 'FAIL' ? 0 : (line.acceptedQty ?? line.receivedQty ?? 0),
      rejectedQty: line.inspectionStatus === 'FAIL' ? (line.receivedQty ?? 0) : (line.rejectedQty ?? 0),
    }));

    this.inspectingGRA = true;
    this.graService.inspect(this.detailGRA.id, {
      inspectedById: user.employeeDbId,
      inspectionRemarks: '',
      lines: lineResults,
    }).subscribe({
      next: () => {
        setTimeout(() => {
          this.inspectingGRA = false;
          this.messageService.add({ severity: 'success', summary: 'Inspected', detail: 'GRA inspection recorded' });
          this.showDetailDialog = false;
          this.loadGRAs();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.inspectingGRA = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to inspect GRA' });
      }
    });
  }

  acceptGRA() {
    if (!this.detailGRA) return;
    this.acceptingGRA = true;
    this.graService.accept(this.detailGRA.id).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.acceptingGRA = false;
          const msg = res?.createdAssets?.length
            ? `GRA accepted. ${res.createdAssets.length} asset(s) created automatically.`
            : 'GRA accepted successfully';
          this.messageService.add({ severity: 'success', summary: 'Accepted', detail: msg });
          this.showDetailDialog = false;
          this.loadGRAs();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.acceptingGRA = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to accept GRA' });
      }
    });
  }

  rejectGRA() {
    if (!this.detailGRA) return;
    this.rejectingGRA = true;
    this.graService.reject(this.detailGRA.id).subscribe({
      next: () => {
        setTimeout(() => {
          this.rejectingGRA = false;
          this.messageService.add({ severity: 'success', summary: 'Rejected', detail: 'GRA has been rejected' });
          this.showDetailDialog = false;
          this.loadGRAs();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.rejectingGRA = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to reject GRA' });
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const map: Record<string, any> = {
      DRAFT: 'secondary',
      INSPECTION_PENDING: 'warn',
      INSPECTION_PASSED: 'info',
      INSPECTION_FAILED: 'danger',
      ACCEPTED: 'success',
      PARTIALLY_ACCEPTED: 'warn',
      REJECTED: 'danger',
    };
    return map[status] || 'secondary';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'Draft',
      INSPECTION_PENDING: 'Inspection Pending',
      INSPECTION_PASSED: 'Inspection Passed',
      INSPECTION_FAILED: 'Inspection Failed',
      ACCEPTED: 'Accepted',
      PARTIALLY_ACCEPTED: 'Partially Accepted',
      REJECTED: 'Rejected',
    };
    return map[status] || status;
  }

  getInspectionSeverity(result: string): 'success' | 'danger' | 'warn' | 'secondary' | undefined {
    const map: Record<string, any> = {
      PASS: 'success',
      FAIL: 'danger',
      PARTIAL: 'warn',
    };
    return map[result] || 'secondary';
  }

  formatCurrency(val: number | null | undefined): string {
    if (val == null) return '--';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);
  }

  canInspect(): boolean {
    return this.detailGRA?.status === 'DRAFT' && this.isRole('HOD', 'SUPERVISOR', 'ADMIN');
  }

  canAccept(): boolean {
    return ['INSPECTION_PASSED', 'INSPECTION_FAILED'].includes(this.detailGRA?.status) && this.isRole('HOD', 'ADMIN');
  }

  canReject(): boolean {
    return this.detailGRA?.status && !['ACCEPTED', 'REJECTED'].includes(this.detailGRA.status) && this.isRole('HOD', 'ADMIN');
  }
}
