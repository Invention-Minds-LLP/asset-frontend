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
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment.prod';
import { WorkOrderService } from '../../services/work-order/work-order';
import { Assets } from '../../services/assets/assets';
import { StoreService } from '../../services/store/store';
import { Employees } from '../../services/employees/employees';
import { Ticketing } from '../../services/tickerting/ticketing';

@Component({
  selector: 'app-work-orders',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule, TagModule,
    ToastModule, SelectModule, DialogModule, InputNumberModule,
    TooltipModule, InputTextModule, DatePickerModule, TextareaModule,
  ],
  templateUrl: './work-orders.html',
  styleUrl: './work-orders.css',
  providers: [MessageService]
})
export class WorkOrders implements OnInit {
  userRole = localStorage.getItem('role') || '';

  isRole(...roles: string[]): boolean { return roles.includes(this.userRole); }

  // ── List State ────────────────────────────────────────────────────────────
  workOrders: any[] = [];
  totalRecords = 0;
  loading = false;
  page = 1;
  limit = 15;

  filters: any = {
    status: null,
    woType: null,
    assetId: null,
  };

  statusOptions = [
    { label: 'All Statuses', value: null },
    { label: 'Draft', value: 'DRAFT' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'In Progress', value: 'IN_PROGRESS' },
    { label: 'Completed', value: 'COMPLETED' },
    { label: 'Closed', value: 'CLOSED' },
    { label: 'Cancelled', value: 'CANCELLED' },
  ];

  woTypeOptions = [
    { label: 'All Types', value: null },
    { label: 'OpEx', value: 'OPEX' },
    { label: 'CapEx', value: 'CAPEX' },
  ];

  priorityOptions = [
    { label: 'Low', value: 'LOW' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'High', value: 'HIGH' },
    { label: 'Critical', value: 'CRITICAL' },
  ];

  assetOptions: { label: string; value: number }[] = [];
  storeOptions: { label: string; value: number }[] = [];
  categoryOptions: { label: string; value: number }[] = [];
  departmentOptions: { label: string; value: number }[] = [];
  employeeOptions: { label: string; value: number }[] = [];
  ticketOptions: { label: string; value: number }[] = [];

  // ── View State ────────────────────────────────────────────────────────────
  activeView: 'list' | 'create' = 'list';
  showDetailDialog = false;
  showMaterialDialog = false;
  showWCCDialog = false;
  detailWO: any = null;
  savingWO = false;
  approvingWO = false;
  startingWO = false;
  completingWO = false;
  closingWO = false;
  cancellingWO = false;
  issuingMaterial = false;
  issuingWCC = false;

  // ── Create Form ───────────────────────────────────────────────────────────
  woForm = this.emptyForm();

  // ── Material Issue Form ───────────────────────────────────────────────────
  materialForm = this.emptyMaterialForm();

  // ── WCC Form ──────────────────────────────────────────────────────────────
  wccForm = this.emptyWCCForm();

  constructor(
    private woService: WorkOrderService,
    private assetsService: Assets,
    private storeService: StoreService,
    private employeesService: Employees,
    private ticketingService: Ticketing,
    private http: HttpClient,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadWorkOrders();
    this.loadAssetOptions();
    this.loadStoreOptions();
    this.loadCategoryOptions();
    this.loadDepartmentOptions();
    this.loadEmployeeOptions();
    this.loadTicketOptions();
  }

  // ── Data Loading ──────────────────────────────────────────────────────────

  loadWorkOrders() {
    this.loading = true;
    const params: any = {
      page: this.page,
      limit: this.limit,
      ...this.filters,
    };

    this.woService.getAll(params).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.workOrders = res.data ?? res ?? [];
          this.totalRecords = res.pagination?.total ?? res.total ?? this.workOrders.length;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.loading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load work orders' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadAssetOptions() {
    this.assetsService.getAllAssets().subscribe({
      next: (data: any) => {
        setTimeout(() => {
          const list = Array.isArray(data) ? data : (data?.data ?? []);
          this.assetOptions = list.map((a: any) => ({
            label: `${a.assetId} — ${a.assetName}`,
            value: a.id
          }));
          this.cdr.detectChanges();
        });
      },
      error: () => {}
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

  loadCategoryOptions() {
    this.assetsService.getCategories().subscribe({
      next: (res: any[]) => {
        setTimeout(() => {
          this.categoryOptions = res.map(c => ({ label: c.name, value: c.id }));
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  loadDepartmentOptions() {
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

  loadTicketOptions() {
    this.ticketingService.getAllTickets().subscribe({
      next: (res: any) => {
        setTimeout(() => {
          const list = Array.isArray(res) ? res : (res?.data ?? []);
          const openStatuses = ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'ON_HOLD', 'WORK_COMPLETED'];
          this.ticketOptions = list
            .filter((t: any) => openStatuses.includes(t.status))
            .map((t: any) => ({
              label: `${t.ticketId} — ${t.issueType || t.detailedDesc?.substring(0, 40) || 'Ticket'}`,
              value: t.id,
            }));
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  loadEmployeeOptions() {
    this.employeesService.getEmployees().subscribe({
      next: (res: any) => {
        setTimeout(() => {
          const list = Array.isArray(res) ? res : (res?.data ?? []);
          this.employeeOptions = list.map((e: any) => ({
            label: `${e.name} (${e.employeeID})`,
            value: e.id,
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
    this.loadWorkOrders();
  }

  applyFilters() {
    this.page = 1;
    this.loadWorkOrders();
  }

  resetFilters() {
    this.filters = { status: null, woType: null, assetId: null };
    this.page = 1;
    this.loadWorkOrders();
  }

  // ── Create WO ─────────────────────────────────────────────────────────────

  emptyForm() {
    return {
      woType: 'OPEX' as string,
      assetId: null as number | null,
      ticketId: null as number | null,
      description: '',
      priority: 'MEDIUM' as string,
      departmentId: null as number | null,
      assignedToId: null as number | null,
      contractorName: '',
      estimatedCost: null as number | null,
      budgetCode: '',
      capitalizeAsAsset: false,
      categoryId: null as number | null,
      scheduledStartDate: null as Date | null,
      scheduledEndDate: null as Date | null,
    };
  }

  sparePartOptions: any[] = [];
  consumableOptions: any[] = [];
  materialItemTypeOptions = [
    { label: 'Spare Part', value: 'SPARE_PART' },
    { label: 'Consumable', value: 'CONSUMABLE' },
  ];

  emptyMaterialForm() {
    return {
      storeId: null as number | null,
      issueType: 'SPARE_PART' as string,
      sparePartId: null as number | null,
      consumableId: null as number | null,
      description: '',
      quantity: 1,
      unitCost: null as number | null,
    };
  }

  qualityCheckOptions = [
    { label: 'Pass', value: 'PASS' },
    { label: 'Fail', value: 'FAIL' },
    { label: 'Conditional', value: 'CONDITIONAL' },
  ];

  emptyWCCForm() {
    return {
      workSummary: '',
      materialsUsedSummary: '',
      totalLaborCost: null as number | null,
      totalMaterialCost: null as number | null,
      qualityCheckStatus: 'PASS' as string,
      qualityRemarks: '',
    };
  }

  openCreate() {
    this.woForm = this.emptyForm();
    this.activeView = 'create';
  }

  saveWO() {
    if (!this.woForm.description) {
      this.messageService.add({ severity: 'warn', summary: 'Missing', detail: 'Description is required' });
      return;
    }

    this.savingWO = true;
    const payload: any = {
      woType: this.woForm.woType,
      assetId: this.woForm.assetId,
      ticketId: this.woForm.ticketId,
      description: this.woForm.description,
      priority: this.woForm.priority,
      departmentId: this.woForm.departmentId,
      assignedToId: this.woForm.assignedToId,
      contractorName: this.woForm.contractorName || null,
      estimatedCost: this.woForm.estimatedCost,
      budgetCode: this.woForm.budgetCode || null,
      capitalizeAsAsset: this.woForm.capitalizeAsAsset,
      assetCategoryId: this.woForm.categoryId,
      scheduledStart: this.woForm.scheduledStartDate ? new Date(this.woForm.scheduledStartDate).toISOString() : null,
      scheduledEnd: this.woForm.scheduledEndDate ? new Date(this.woForm.scheduledEndDate).toISOString() : null,
    };

    this.woService.create(payload).subscribe({
      next: () => {
        setTimeout(() => {
          this.savingWO = false;
          this.activeView = 'list';
          this.loadWorkOrders();
          this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Work order created successfully' });
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.savingWO = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create work order' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ── Detail / Actions ──────────────────────────────────────────────────────

  viewDetail(wo: any) {
    this.woService.getById(wo.id).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.detailWO = res.data ?? res;
          this.showDetailDialog = true;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load work order details' });
      }
    });
  }

  approveWO() {
    if (!this.detailWO) return;
    this.approvingWO = true;
    this.woService.approve(this.detailWO.id, {}).subscribe({
      next: () => {
        setTimeout(() => {
          this.approvingWO = false;
          this.messageService.add({ severity: 'success', summary: 'Approved', detail: 'Work order approved' });
          this.showDetailDialog = false;
          this.loadWorkOrders();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.approvingWO = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to approve work order' });
      }
    });
  }

  startWO() {
    if (!this.detailWO) return;
    this.startingWO = true;
    this.woService.start(this.detailWO.id).subscribe({
      next: () => {
        setTimeout(() => {
          this.startingWO = false;
          this.messageService.add({ severity: 'success', summary: 'Started', detail: 'Work order started' });
          this.showDetailDialog = false;
          this.loadWorkOrders();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.startingWO = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to start work order' });
      }
    });
  }

  completeWO() {
    if (!this.detailWO) return;
    this.completingWO = true;
    this.woService.complete(this.detailWO.id).subscribe({
      next: () => {
        setTimeout(() => {
          this.completingWO = false;
          this.messageService.add({ severity: 'success', summary: 'Completed', detail: 'Work order marked as completed' });
          this.showDetailDialog = false;
          this.loadWorkOrders();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.completingWO = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to complete work order' });
      }
    });
  }

  closeWO() {
    if (!this.detailWO) return;
    this.closingWO = true;
    this.woService.close(this.detailWO.id).subscribe({
      next: () => {
        setTimeout(() => {
          this.closingWO = false;
          this.messageService.add({ severity: 'success', summary: 'Closed', detail: 'Work order closed' });
          this.showDetailDialog = false;
          this.loadWorkOrders();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.closingWO = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to close work order' });
      }
    });
  }

  cancelWO() {
    if (!this.detailWO) return;
    this.cancellingWO = true;
    this.woService.cancel(this.detailWO.id).subscribe({
      next: () => {
        setTimeout(() => {
          this.cancellingWO = false;
          this.messageService.add({ severity: 'success', summary: 'Cancelled', detail: 'Work order cancelled' });
          this.showDetailDialog = false;
          this.loadWorkOrders();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.cancellingWO = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to cancel work order' });
      }
    });
  }

  // ── Material Issue ────────────────────────────────────────────────────────

  private apiUrl = environment.apiUrl;

  openMaterialIssue() {
    this.materialForm = this.emptyMaterialForm();
    this.showMaterialDialog = true;
    if (this.sparePartOptions.length === 0) {
      this.http.get<any>(`${this.apiUrl}/inventory/spare-parts`).subscribe({
        next: (data: any) => {
          const list = Array.isArray(data) ? data : (data?.data ?? []);
          this.sparePartOptions = list.map((s: any) => ({ label: `${s.name}${s.partNumber ? ' (' + s.partNumber + ')' : ''}`, value: s.id }));
          setTimeout(() => this.cdr.detectChanges());
        },
        error: () => {}
      });
    }
    if (this.consumableOptions.length === 0) {
      this.http.get<any>(`${this.apiUrl}/inventory/consumables`).subscribe({
        next: (data: any) => {
          const list = Array.isArray(data) ? data : (data?.data ?? []);
          this.consumableOptions = list.map((c: any) => ({ label: c.name, value: c.id }));
          setTimeout(() => this.cdr.detectChanges());
        },
        error: () => {}
      });
    }
  }

  issueMaterial() {
    const mf = this.materialForm;
    if (!this.detailWO || !mf.storeId || !mf.issueType || (mf.issueType === 'SPARE_PART' && !mf.sparePartId) || (mf.issueType === 'CONSUMABLE' && !mf.consumableId)) {
      this.messageService.add({ severity: 'warn', summary: 'Missing', detail: 'Store, item type, item, and quantity are required' });
      return;
    }

    this.issuingMaterial = true;
    this.woService.issueMaterial(this.detailWO.id, this.materialForm).subscribe({
      next: () => {
        setTimeout(() => {
          this.issuingMaterial = false;
          this.messageService.add({ severity: 'success', summary: 'Issued', detail: 'Material issued successfully' });
          this.showMaterialDialog = false;
          this.viewDetail(this.detailWO);
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.issuingMaterial = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to issue material' });
      }
    });
  }

  // ── WCC (Work Completion Certificate) ─────────────────────────────────────

  openWCCDialog() {
    this.wccForm = this.emptyWCCForm();
    this.showWCCDialog = true;
  }

  issueWCC() {
    if (!this.detailWO || !this.wccForm.workSummary) {
      this.messageService.add({ severity: 'warn', summary: 'Missing', detail: 'Work Summary is required' });
      return;
    }

    const payload = { ...this.wccForm };

    this.issuingWCC = true;
    this.woService.issueWCC(this.detailWO.id, payload).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.issuingWCC = false;
          const msg = res?.capitalizedAsset
            ? `WCC issued. Asset "${res.capitalizedAsset.assetId}" capitalized successfully.`
            : 'Work Completion Certificate issued successfully';
          this.messageService.add({ severity: 'success', summary: 'WCC Issued', detail: msg });
          this.showWCCDialog = false;
          this.showDetailDialog = false;
          this.loadWorkOrders();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.issuingWCC = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to issue WCC' });
      }
    });
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getStatusSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' | undefined {
    const map: Record<string, any> = {
      DRAFT: 'secondary',
      APPROVED: 'info',
      IN_PROGRESS: 'warn',
      COMPLETED: 'success',
      CLOSED: 'contrast',
      CANCELLED: 'danger',
    };
    return map[status] || 'secondary';
  }

  getStatusLabel(status: string): string {
    const map: Record<string, string> = {
      DRAFT: 'Draft',
      APPROVED: 'Approved',
      IN_PROGRESS: 'In Progress',
      COMPLETED: 'Completed',
      CLOSED: 'Closed',
      CANCELLED: 'Cancelled',
    };
    return map[status] || status;
  }

  getTypeSeverity(type: string): 'info' | 'warn' | undefined {
    return type === 'CAPEX' ? 'warn' : 'info';
  }

  getPrioritySeverity(priority: string): 'success' | 'info' | 'warn' | 'danger' | undefined {
    const map: Record<string, any> = {
      LOW: 'success',
      MEDIUM: 'info',
      HIGH: 'warn',
      CRITICAL: 'danger',
    };
    return map[priority] || 'info';
  }

  formatCurrency(val: number | null | undefined): string {
    if (val == null) return '--';
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);
  }

  canApprove(): boolean {
    return this.detailWO?.status === 'DRAFT' && this.isRole('HOD', 'ADMIN');
  }

  canStart(): boolean {
    return this.detailWO?.status === 'APPROVED' && this.isRole('HOD', 'SUPERVISOR', 'ADMIN');
  }

  canIssueMaterial(): boolean {
    return this.detailWO?.status === 'IN_PROGRESS' && this.isRole('HOD', 'SUPERVISOR', 'ADMIN');
  }

  canComplete(): boolean {
    return this.detailWO?.status === 'IN_PROGRESS' && this.isRole('HOD', 'SUPERVISOR', 'ADMIN');
  }

  canIssueWCC(): boolean {
    return this.detailWO?.status === 'WORK_COMPLETED' && !this.detailWO?.wcc && this.isRole('HOD', 'ADMIN');
  }

  canClose(): boolean {
    return ['WORK_COMPLETED', 'WCC_ISSUED'].includes(this.detailWO?.status) && this.isRole('HOD', 'ADMIN');
  }

  canCancel(): boolean {
    return this.detailWO?.status && !['WORK_COMPLETED', 'WCC_ISSUED', 'CLOSED', 'CANCELLED'].includes(this.detailWO.status) && this.isRole('HOD', 'ADMIN');
  }
}
