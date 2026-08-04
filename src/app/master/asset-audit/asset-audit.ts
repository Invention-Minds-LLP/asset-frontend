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
import { SelectModule } from 'primeng/select';
import { ProgressBarModule } from 'primeng/progressbar';
import { CheckboxModule } from 'primeng/checkbox';
import { MultiSelectModule } from 'primeng/multiselect';
import { MessageService } from 'primeng/api';
import { AssetAuditService } from '../../services/asset-audit/asset-audit';
import { Branches } from '../../services/branches/branches';
import { BranchFeatures } from '../../services/branch-features/branch-features';
import { ExternalAuditorService } from '../../services/external-auditor/external-auditor';
import { DatePicker } from 'primeng/datepicker';
import { OverflowTooltipDirective } from '../../shared/directives/overflow-tooltip.directive';

@Component({
  selector: 'app-asset-audit',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule,
    TagModule, ToastModule, DialogModule, InputTextModule,
    TextareaModule, SelectModule, ProgressBarModule, CheckboxModule, MultiSelectModule, DatePicker,
    OverflowTooltipDirective
  ],
  templateUrl: './asset-audit.html',
  styleUrl: './asset-audit.css',
  providers: [MessageService]
})
export class AssetAudit implements OnInit {
  userRole = localStorage.getItem('role') || '';

  isRole(...roles: string[]): boolean { return roles.includes(this.userRole); }

  // List view
  audits: any[] = [];
  loading = false;
  totalRecords = 0;

  // Detail view
  showDetail = false;
  selectedAudit: any = null;
  auditItems: any[] = [];
  summary: any = {};
  detailLoading = false;

  // Create dialog
  showCreateDialog = false;
  createForm: any = { auditName: '', auditDate: null, description: '', branchId: null, departmentId: null, floor: null, block: null, room: null, categoryIds: [], auditorType: null, internalAuditorIds: [], existingExternalAuditorIds: [], externalAuditors: [] };
  createLoading = false;

  // Location options
  locationFloors: string[] = [];
  locationBlocks: string[] = [];
  locationRooms: string[] = [];
  locationsLoading = false;

  // Branch scoping — gated by the ENABLE_BRANCH_FEATURES tenant switch, same as
  // the assets table. When off (single-branch tenant) the branch selector is hidden.
  branchFeatures = true;
  branchOptions: { label: string; value: number }[] = [];

  // Existing external auditors (master list, ACTIVE only) for the picker.
  externalAuditorOptions: { id: number; email: string; name: string; organization?: string | null }[] = [];

  // Scope wizard (floor ↔ category)
  scopeCategories: { id: number; name: string; count: number }[] = [];
  scopePreview: { total: number; pinned: number; unpinned: number; byCategory: any[] } | null = null;
  // Location readiness for the scope being chosen — guidance quality is decided
  // entirely by AssetLocation, so it is worth knowing before the audit exists.
  readiness: any = null;
  scopeLoading = false;

  // Auditor assignment
  employees: any[] = [];
  auditorTypeOptions = [
    { label: 'Internal (employees)', value: 'INTERNAL' },
    { label: 'External (audit firm)', value: 'EXTERNAL' },
    { label: 'Both', value: 'BOTH' },
  ];
  auditAuditors: any[] = []; // auditors of the audit currently open in detail view

  startingAudit = false;
  completingAudit = false;

  // ── Checklist (default view) ──
  // Grouped by floor / department / flat, filterable by audit status, asset
  // lifecycle status and QR sticker state. Replaces the map as the way an audit
  // is actually worked; the map is now a secondary view.
  viewMode: 'checklist' | 'table' | 'map' = 'checklist';
  clGroupBy = 'FLOOR';
  clAssetStatus = '';
  clItemStatus = '';
  clSticker = '';
  clSearch = '';
  clGroups: any[] = [];
  clFacets: any = { assetStatus: [], itemStatus: [], sticker: [] };
  clTotals: any = null;
  clLoading = false;
  clOpen = new Set<string>();
  completion: any = null;

  readonly groupModes = [
    { value: 'FLOOR', label: 'Floor', icon: 'pi pi-building' },
    { value: 'DEPARTMENT', label: 'Department', icon: 'pi pi-sitemap' },
    { value: 'ASSET', label: 'Asset', icon: 'pi pi-box' },
  ];

  // Floor map view
  showMap = false;
  mapPlan: any = null;
  mapPlaced: any[] = [];
  mapUnplaced: any[] = [];
  mapLoading = false;
  nextItem: any = null;
  route: any[] = [];
  lastVerifiedItemId: number | null = null;

  // Room-level progress (from /zone-progress)
  mapZones: any[] = [];
  walkingOrder: any[] = [];
  notFound: any[] = [];
  zoneTotals: any = null;
  showRooms = true;
  activeZoneId: number | null = null;

  // Map zoom / pan
  mapZoom = 1;
  mapPanX = 0;
  mapPanY = 0;
  private mapDrag: { x: number; y: number; panX: number; panY: number } | null = null;
  private mapDragged = false;

  // Verify dialog
  showVerifyDialog = false;
  selectedItemId: number | null = null;
  verifyForm: any = {
    status: 'VERIFIED',
    locationMatch: true,
    conditionMatch: true,
    actualLocation: '',
    actualCondition: '',
    remarks: '',
    stickerStatus: ''
  };
  verifyLoading = false;

  // QR sticker observed during the audit. Blank = not checked; the server only
  // writes Asset.qrStickered when something was actually reported.
  stickerOptions = [
    { label: 'Not checked', value: '' },
    { label: 'Sticker present', value: 'PRESENT' },
    { label: 'No sticker', value: 'MISSING' },
    { label: 'Damaged / unreadable', value: 'DAMAGED' },
    { label: 'Not applicable', value: 'NOT_APPLICABLE' },
  ];

  verifyStatusOptions = [
    { label: 'Verified', value: 'VERIFIED' },
    { label: 'Missing', value: 'MISSING' },
    { label: 'Mismatch', value: 'MISMATCH' },
  ];

  constructor(
    private auditService: AssetAuditService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
    private branchesService: Branches,
    private branchFeaturesSvc: BranchFeatures,
    private externalAuditorService: ExternalAuditorService
  ) {}

  ngOnInit() {
    this.loadAudits();
    this.loadLocationOptions();
    this.loadEmployees();
    this.loadBranchFeatures();
    this.loadExternalAuditors();
  }

  // Resolve the tenant branch switch, then load branches only if enabled.
  loadBranchFeatures() {
    this.branchFeaturesSvc.isEnabled().then((enabled) => {
      setTimeout(() => {
        this.branchFeatures = enabled;
        this.cdr.detectChanges();
      });
      if (enabled) this.loadBranches();
    });
  }

  loadBranches() {
    this.branchesService.getBranches().subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.branchOptions = (res || [])
            .filter((b: any) => b.isActive !== false)
            .map((b: any) => ({ label: b.name, value: b.id }));
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  // Existing external auditors (ACTIVE) for the picker in the create dialog.
  loadExternalAuditors() {
    this.externalAuditorService.list({ status: 'ACTIVE' }).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          const list = Array.isArray(res) ? res : (res?.data ?? []);
          this.externalAuditorOptions = list.map((a: any) => ({
            id: a.id, email: a.email, name: a.name, organization: a.organization,
          }));
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  loadEmployees() {
    this.auditService.getEmployees().subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.employees = (res?.data ?? res) || [];
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  loadLocationOptions() {
    this.locationsLoading = true;
    this.auditService.getLocationOptions().subscribe({
      next: (res: any) => {
        const d = res.data || res;
        this.locationFloors = d.floors || [];
        this.locationBlocks = d.blocks || [];
        this.locationRooms  = d.rooms  || [];
        this.locationsLoading = false;
        this.cdr.detectChanges();
      },
      error: () => { this.locationsLoading = false; }
    });
  }

  loadAudits() {
    this.loading = true;
    this.auditService.getAll({}).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.audits = res.data || res;
          this.totalRecords = res.pagination?.total || this.audits.length;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.loading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load audits' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  // Create
  openCreateDialog() {
    this.createForm = { auditName: '', auditDate: null, description: '', branchId: null, departmentId: null, floor: null, block: null, room: null, categoryIds: [], auditorType: null, internalAuditorIds: [], existingExternalAuditorIds: [], externalAuditors: [] };
    this.scopeCategories = [];
    this.scopePreview = null;
    // Block/room lists cascade from the floor (and branch); start empty.
    this.locationBlocks = [];
    this.locationRooms = [];
    this.loadScopeFloors();
    this.loadScopeCategories();
    if (!this.employees.length) this.loadEmployees();
    if (!this.externalAuditorOptions.length) this.loadExternalAuditors();
    this.showCreateDialog = true;
  }

  // ── Auditor assignment ──
  get needsInternal(): boolean { return this.createForm.auditorType === 'INTERNAL' || this.createForm.auditorType === 'BOTH'; }
  get needsExternal(): boolean { return this.createForm.auditorType === 'EXTERNAL' || this.createForm.auditorType === 'BOTH'; }

  onAuditorTypeChange() {
    if (!this.needsInternal) this.createForm.internalAuditorIds = [];
    if (!this.needsExternal) {
      this.createForm.externalAuditors = [];
      this.createForm.existingExternalAuditorIds = [];
    }
  }

  addExternalAuditor() {
    this.createForm.externalAuditors.push({ name: '', email: '', organization: '', phone: '' });
  }

  removeExternalAuditor(i: number) {
    this.createForm.externalAuditors.splice(i, 1);
  }

  // Shared by every scope selector, the preview AND the readiness panel, so all
  // three agree with the assets the audit will actually enrol. departmentId was
  // missing here while loadReadiness() sent it, which is why readiness could
  // report on one set of assets and the preview on another.
  private scopeParams(extra: any = {}): any {
    const p: any = { ...extra };
    if (this.createForm.branchId) p.branchId = this.createForm.branchId;
    if (this.createForm.departmentId) p.departmentId = this.createForm.departmentId;
    return p;
  }

  // Floors available for the chosen categories (category-first flow).
  loadScopeFloors() {
    const params = this.scopeParams();
    if (this.createForm.categoryIds?.length) params.categoryIds = this.createForm.categoryIds.join(',');
    this.scopeLoading = true;
    this.auditService.getScopeFloors(params).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.locationFloors = res.data || [];
          // Drop a selected floor that is no longer valid for the chosen categories.
          if (this.createForm.floor && !this.locationFloors.includes(this.createForm.floor)) {
            this.createForm.floor = null;
          }
          this.scopeLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => { this.scopeLoading = false; }
    });
  }

  // Blocks available within the chosen branch + floor.
  loadScopeBlocks() {
    const params = this.scopeParams();
    if (this.createForm.floor) params.floor = this.createForm.floor;
    this.auditService.getScopeBlocks(params).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.locationBlocks = res.data || [];
          if (this.createForm.block && !this.locationBlocks.includes(this.createForm.block)) {
            this.createForm.block = null;
          }
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  // Rooms available within the chosen branch + floor + block.
  loadScopeRooms() {
    const params = this.scopeParams();
    if (this.createForm.floor) params.floor = this.createForm.floor;
    if (this.createForm.block) params.block = this.createForm.block;
    this.auditService.getScopeRooms(params).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.locationRooms = res.data || [];
          if (this.createForm.room && !this.locationRooms.includes(this.createForm.room)) {
            this.createForm.room = null;
          }
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  // Categories present on the chosen floor/block/room (floor-first flow), with counts.
  loadScopeCategories() {
    const params = this.scopeParams();
    if (this.createForm.floor) params.floor = this.createForm.floor;
    if (this.createForm.block) params.block = this.createForm.block;
    if (this.createForm.room) params.room = this.createForm.room;
    this.auditService.getScopeCategories(params).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.scopeCategories = res.data || [];
          // Prune any selected categories no longer available in this scope.
          const valid = new Set(this.scopeCategories.map(c => c.id));
          this.createForm.categoryIds = (this.createForm.categoryIds || []).filter((id: number) => valid.has(id));
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  loadReadiness() {
    const f = this.createForm;
    this.auditService.getLocationReadiness({
      branchId: f.branchId, departmentId: f.departmentId,
      floor: f.floor, block: f.block, room: f.room,
    }).subscribe({
      next: (res: any) => {
        setTimeout(() => { this.readiness = res?.data ?? res; this.cdr.detectChanges(); });
      },
      error: () => { this.readiness = null; },
    });
  }

  readinessSeverity(): string {
    switch (this.readiness?.verdict) {
      case 'GOOD': return 'ok';
      case 'PARTIAL': return 'warn';
      default: return 'bad';
    }
  }

  loadScopePreview() {
    const params = this.scopeParams();
    if (this.createForm.floor) params.floor = this.createForm.floor;
    if (this.createForm.block) params.block = this.createForm.block;
    if (this.createForm.room) params.room = this.createForm.room;
    if (this.createForm.categoryIds?.length) params.categoryIds = this.createForm.categoryIds.join(',');
    this.loadReadiness();
    this.auditService.getScopePreview(params).subscribe({
      next: (res: any) => {
        setTimeout(() => { this.scopePreview = res.data || null; this.cdr.detectChanges(); });
      },
      error: () => { this.scopePreview = null; }
    });
  }

  // Branch changed → reset floor/block/room, reload the floors for that branch.
  onScopeBranchChange() {
    this.createForm.floor = null;
    this.createForm.block = null;
    this.createForm.room = null;
    this.locationBlocks = [];
    this.locationRooms = [];
    this.loadScopeFloors();
    this.loadScopeCategories();
    this.loadScopePreview();
  }

  // Floor changed → reset block/room, reload blocks + categories + preview.
  onScopeFloorChange() {
    this.createForm.block = null;
    this.createForm.room = null;
    this.locationRooms = [];
    this.loadScopeBlocks();
    this.loadScopeCategories();
    this.loadScopePreview();
  }

  // Block changed → reset room, reload rooms + categories + preview.
  onScopeBlockChange() {
    this.createForm.room = null;
    this.loadScopeRooms();
    this.loadScopeCategories();
    this.loadScopePreview();
  }

  // Room changed → refresh categories + preview.
  onScopeRoomChange() {
    this.loadScopeCategories();
    this.loadScopePreview();
  }

  // Categories changed → refresh which floors contain them + preview.
  onScopeCategoriesChange() {
    this.loadScopeFloors();
    this.loadScopePreview();
  }

  submitCreate() {
    if (!this.createForm.auditName) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Audit name is required' });
      return;
    }
    if (!this.createForm.auditDate) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Audit date is required' });
      return;
    }

    // Assemble the auditors payload from the chosen type.
    const auditors: any[] = [];
    if (this.needsInternal) {
      if (!this.createForm.internalAuditorIds?.length) {
        this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Select at least one internal auditor' });
        return;
      }
      for (const empId of this.createForm.internalAuditorIds) auditors.push({ type: 'INTERNAL', employeeId: empId });
    }
    if (this.needsExternal) {
      // Existing auditors picked from the master list → sent by id.
      const existingIds: number[] = this.createForm.existingExternalAuditorIds || [];
      for (const id of existingIds) auditors.push({ type: 'EXTERNAL', externalAuditorId: id });

      // New auditors typed inline → sent by name/email (backend auto-provisions).
      const valid = (this.createForm.externalAuditors || []).filter((a: any) => a.name?.trim() && a.email?.trim());
      for (const a of valid) auditors.push({ type: 'EXTERNAL', name: a.name.trim(), email: a.email.trim(), organization: a.organization?.trim() || null, phone: a.phone?.trim() || null });

      if (!existingIds.length && !valid.length) {
        this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Select an existing external auditor or add a new one with a name and email' });
        return;
      }
    }

    const payload = { ...this.createForm, auditorType: this.createForm.auditorType || null, auditors };
    this.createLoading = true;
    this.auditService.create(payload).subscribe({
      next: () => {
        setTimeout(() => {
          this.createLoading = false;
          this.showCreateDialog = false;
          this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Audit created successfully' });
          this.loadAudits();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        setTimeout(() => {
          this.createLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to create audit' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  // View detail
  viewAudit(audit: any) {
    this.selectedAudit = audit;
    this.showDetail = true;
    this.viewMode = 'checklist';
    this.showMap = false;
    this.clOpen.clear();
    this.loadAuditDetail(audit.id);
    this.loadChecklist();
    this.loadCompletionCheck();
  }

  loadAuditDetail(id: number) {
    this.detailLoading = true;
    this.auditService.getSummary(id).subscribe({
      next: (res) => {
        setTimeout(() => {
          const data = res?.data ?? res;
          this.summary = {
            totalItems: data.totalAssets ?? 0,
            verifiedCount: data.verifiedCount ?? 0,
            missingCount: data.missingCount ?? 0,
            mismatchCount: data.mismatchCount ?? 0,
            pendingCount: data.pendingCount ?? 0,
          };
          this.selectedAudit = { ...this.selectedAudit, auditName: data.auditName, status: data.status };
          this.detailLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.detailLoading = false;
          this.cdr.detectChanges();
        });
      }
    });

    this.auditService.getById(id).subscribe({
      next: (res) => {
        setTimeout(() => {
          const d = res.data || res;
          this.auditItems = d?.items || [];
          this.auditAuditors = d?.auditors || [];
          this.selectedAudit = { ...this.selectedAudit, auditorType: d?.auditorType ?? this.selectedAudit?.auditorType };
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  backToList() {
    this.showDetail = false;
    this.showMap = false;
    this.selectedAudit = null;
    this.auditItems = [];
    this.auditAuditors = [];
    this.summary = {};
    this.resetMap();
    this.loadAudits();
  }

  auditorLabel(a: any): string {
    if (a?.type === 'INTERNAL') {
      const e = a.employee;
      return e ? `${e.name}${e.designation ? ' · ' + e.designation : ''}` : `Employee #${a.employeeId}`;
    }
    return `${a.name}${a.organization ? ' (' + a.organization + ')' : ''}`;
  }

  // ── Checklist ──
  setView(mode: 'checklist' | 'table' | 'map') {
    this.viewMode = mode;
    this.showMap = mode === 'map';
    if (mode === 'map' && this.selectedAudit && !this.mapPlan) this.loadFloorMap(this.selectedAudit.id);
    if (mode === 'checklist') this.loadChecklist();
  }

  loadChecklist() {
    if (!this.selectedAudit) return;
    this.clLoading = true;
    this.auditService.getChecklist(this.selectedAudit.id, {
      groupBy: this.clGroupBy,
      assetStatus: this.clAssetStatus,
      itemStatus: this.clItemStatus,
      sticker: this.clSticker,
      q: this.clSearch,
    }).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          const d = res?.data ?? res;
          this.clGroupBy = d.groupBy || this.clGroupBy;
          this.clGroups = d.groups || [];
          this.clFacets = d.facets || { assetStatus: [], itemStatus: [], sticker: [] };
          this.clTotals = d.totals || null;
          // Open the first group with work left, so there is something to act on.
          if (!this.clOpen.size) {
            const first = this.clGroups.find((g) => !g.complete) ?? this.clGroups[0];
            if (first) this.clOpen.add(first.key);
          }
          this.clLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => { this.clLoading = false; this.cdr.detectChanges(); });
      },
    });
  }

  loadCompletionCheck() {
    if (!this.selectedAudit) return;
    this.auditService.getCompletionCheck(this.selectedAudit.id).subscribe({
      next: (res: any) => {
        setTimeout(() => { this.completion = res?.data ?? res; this.cdr.detectChanges(); });
      },
      error: () => {},
    });
  }

  setGroupBy(mode: string) {
    this.clGroupBy = mode;
    this.clOpen.clear();
    this.loadChecklist();
  }

  toggleFilter(kind: 'assetStatus' | 'itemStatus' | 'sticker', value: string) {
    if (kind === 'assetStatus') this.clAssetStatus = this.clAssetStatus === value ? '' : value;
    if (kind === 'itemStatus') this.clItemStatus = this.clItemStatus === value ? '' : value;
    if (kind === 'sticker') this.clSticker = this.clSticker === value ? '' : value;
    this.loadChecklist();
  }

  clearChecklistFilters() {
    this.clAssetStatus = '';
    this.clItemStatus = '';
    this.clSticker = '';
    this.clSearch = '';
    this.loadChecklist();
  }

  get hasChecklistFilters(): boolean {
    return !!(this.clAssetStatus || this.clItemStatus || this.clSticker || this.clSearch.trim());
  }

  toggleChecklistGroup(g: any) {
    if (this.clOpen.has(g.key)) this.clOpen.delete(g.key);
    else this.clOpen.add(g.key);
  }

  isChecklistGroupOpen(g: any): boolean { return this.clOpen.has(g.key); }

  /** Sticker state to show: what this audit saw beats what the record claims. */
  stickerLabel(r: any): string {
    if (r?.stickerStatus) return r.stickerStatus;
    return r?.qrStickered ? 'PRESENT' : 'NOT CHECKED';
  }

  stickerSeverity(r: any): string {
    const s = this.stickerLabel(r);
    if (s === 'PRESENT') return 'success';
    if (s === 'MISSING') return 'danger';
    if (s === 'DAMAGED') return 'warn';
    return 'secondary';
  }

  get canCompleteAudit(): boolean { return !!this.completion?.canComplete; }
  get completionBlockers(): number { return Number(this.completion?.blockingCount ?? 0); }

  /** Explains why the Complete button is disabled, before it is pressed. */
  get completionReason(): string {
    if (this.canCompleteAudit) return 'All active assets are accounted for.';
    if (!this.completionBlockers) return '';
    const ex = (this.completion?.examples || [])
      .slice(0, 3)
      .map((e: any) => e.assetName || e.assetCode)
      .filter(Boolean)
      .join(', ');
    return `${this.completionBlockers} active asset(s) still unchecked${ex ? ` — e.g. ${ex}` : ''}.`;
  }

  // ── Floor map ──
  resetMap() {
    this.mapPlan = null;
    this.mapPlaced = [];
    this.mapUnplaced = [];
    this.nextItem = null;
    this.route = [];
    this.lastVerifiedItemId = null;
    this.mapZones = [];
    this.walkingOrder = [];
    this.notFound = [];
    this.zoneTotals = null;
    this.activeZoneId = null;
    this.resetMapView();
  }

  toggleMap() {
    this.showMap = !this.showMap;
    if (this.showMap && this.selectedAudit) {
      this.loadFloorMap(this.selectedAudit.id);
    }
  }

  loadFloorMap(id: number) {
    this.mapLoading = true;
    this.auditService.getFloorMap(id).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          const d = res?.data ?? res;
          this.mapPlan = d.plan || null;
          this.mapPlaced = d.placed || [];
          this.mapUnplaced = d.unplaced || [];
          this.mapLoading = false;
          this.loadNextItem(id);
          this.loadZoneProgress(id);
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.mapLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load floor map' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadNextItem(id: number) {
    this.auditService.getNextItem(id, this.lastVerifiedItemId).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          const d = res?.data ?? res;
          this.nextItem = d.next || null;
          this.route = d.route || [];
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  // ── Room-level progress ──
  loadZoneProgress(id: number) {
    this.auditService.getZoneProgress(id).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          const d = res?.data ?? res;
          this.mapZones = d.zones || [];
          this.walkingOrder = d.walkingOrder || [];
          this.notFound = d.notFound || [];
          this.zoneTotals = d.totals || null;
          this.cdr.detectChanges();
        });
      },
      error: () => {}
    });
  }

  /** SVG points attribute for a room outline. */
  zonePoints(z: any): string {
    return (z?.polygon || []).map((p: number[]) => `${p[0]},${p[1]}`).join(' ');
  }

  /**
   * Outline thickness divided by the zoom. non-scaling-stroke only defeats the
   * SVG viewBox scaling; the stage's CSS transform still multiplies it.
   */
  zoneStroke(z: any): string {
    const base = this.activeZoneId === z?.id ? 2.5 : 1.25;
    return `${base / this.mapZoom}px`;
  }

  /**
   * Room fill by audit state. Reserved status colours; every room also carries a
   * visible "verified/total" badge, so progress never depends on colour alone.
   */
  zoneFill(z: any): string {
    switch (z?.state) {
      case 'done': return '#0ca30c';
      case 'issue': return '#d03b3b';
      case 'partial': return '#fab219';
      case 'untouched': return '#6b7280';
      default: return 'transparent';
    }
  }

  zoneStateLabel(z: any): string {
    switch (z?.state) {
      case 'done': return 'Complete';
      case 'issue': return z.missing ? `${z.missing} missing` : `${z.mismatch} mismatch`;
      case 'partial': return `${z.total - z.pending}/${z.total} done`;
      case 'untouched': return 'Not started';
      default: return 'No assets';
    }
  }

  zoneStateIcon(z: any): string {
    switch (z?.state) {
      case 'done': return 'pi-check-circle';
      case 'issue': return 'pi-times-circle';
      case 'partial': return 'pi-clock';
      case 'untouched': return 'pi-circle';
      default: return 'pi-minus';
    }
  }

  /** Click a room to isolate + zoom to it; click again to go back to the floor. */
  focusZone(z: any) {
    if (this.activeZoneId === z.id) { this.activeZoneId = null; this.resetMapView(); return; }
    this.activeZoneId = z.id;
    this.zoomToZone(z);
  }

  zoneById(id: number): any | null {
    return this.mapZones.find(z => z.id === id) || null;
  }

  focusZoneById(id: number) {
    const z = this.zoneById(id);
    if (z) this.focusZone(z);
  }

  /** Items shown on the map — narrowed to the focused room, if any. */
  get visibleMapItems(): any[] {
    if (!this.activeZoneId) return this.mapPlaced;
    const z = this.zoneById(this.activeZoneId);
    if (!z) return this.mapPlaced;
    const ids = new Set((z.items || []).map((i: any) => i.itemId));
    return this.mapPlaced.filter(p => ids.has(p.itemId));
  }

  get activeZone(): any | null {
    return this.activeZoneId ? this.zoneById(this.activeZoneId) : null;
  }

  // ── Zoom / pan (pins are percentages, so they scale for free) ──
  get mapTransform(): string {
    return `translate(${this.mapPanX}px, ${this.mapPanY}px) scale(${this.mapZoom})`;
  }

  get mapMarkerTransform(): string {
    return `translate(-50%, -100%) scale(${1 / this.mapZoom})`;
  }

  get mapZoomPct(): number { return Math.round(this.mapZoom * 100); }

  resetMapView() {
    this.mapZoom = 1;
    this.mapPanX = 0;
    this.mapPanY = 0;
  }

  zoomMap(factor: number) {
    this.mapZoom = Math.min(8, Math.max(0.6, this.mapZoom * factor));
  }

  /** Fit the view to a room's bounds. */
  zoomToZone(z: any) {
    const b = z?.bounds;
    if (!b || !b.width || !b.height) return;
    const el = document.querySelector('.map-canvas') as HTMLElement | null;
    if (!el) return;
    const pad = 1.3;
    this.mapZoom = Math.min(8, Math.max(0.6, Math.min(100 / (b.width * pad), 100 / (b.height * pad))));
    const cx = b.minX + b.width / 2;
    const cy = b.minY + b.height / 2;
    this.mapPanX = el.clientWidth / 2 - (el.clientWidth * cx / 100) * this.mapZoom;
    this.mapPanY = el.clientHeight / 2 - (el.clientHeight * cy / 100) * this.mapZoom;
  }

  onMapWheel(ev: WheelEvent) {
    ev.preventDefault();
    const el = ev.currentTarget as HTMLElement;
    const rect = el.getBoundingClientRect();
    const cx = ev.clientX - rect.left;
    const cy = ev.clientY - rect.top;
    const z2 = Math.min(8, Math.max(0.6, this.mapZoom * (ev.deltaY < 0 ? 1.15 : 1 / 1.15)));
    if (z2 === this.mapZoom) return;
    const ix = (cx - this.mapPanX) / this.mapZoom;
    const iy = (cy - this.mapPanY) / this.mapZoom;
    this.mapPanX = cx - ix * z2;
    this.mapPanY = cy - iy * z2;
    this.mapZoom = z2;
  }

  onMapPanStart(ev: MouseEvent) {
    if (ev.button !== 0) return;
    this.mapDragged = false;
    this.mapDrag = { x: ev.clientX, y: ev.clientY, panX: this.mapPanX, panY: this.mapPanY };
  }

  onMapPanMove(ev: MouseEvent) {
    if (!this.mapDrag) return;
    const dx = ev.clientX - this.mapDrag.x;
    const dy = ev.clientY - this.mapDrag.y;
    if (!this.mapDragged && Math.abs(dx) + Math.abs(dy) > 4) this.mapDragged = true;
    if (!this.mapDragged) return;
    this.mapPanX = this.mapDrag.panX + dx;
    this.mapPanY = this.mapDrag.panY + dy;
  }

  onMapPanEnd() { this.mapDrag = null; }

  /** Suppresses the click that ends a pan gesture. */
  get mapWasDragged(): boolean { return this.mapDragged; }

  onPinClick(it: any) {
    if (this.mapDragged) { this.mapDragged = false; return; }
    this.verifyMapItem(it);
  }

  onZoneClick(z: any, ev: Event) {
    ev.stopPropagation();
    if (this.mapDragged) { this.mapDragged = false; return; }
    this.focusZone(z);
  }

  planImageUrl(): string { return this.auditService.imageUrl(this.mapPlan); }

  pinClass(status: string): string {
    switch (status) {
      case 'VERIFIED': return 'pin-verified';
      case 'MISSING': return 'pin-missing';
      case 'MISMATCH': return 'pin-mismatch';
      default: return 'pin-pending';
    }
  }

  // 1-based position of an item in the suggested route (0 if not routed).
  routeIndex(itemId: number): number {
    const i = this.route.findIndex(r => r.itemId === itemId);
    return i < 0 ? 0 : i + 1;
  }

  isNext(itemId: number): boolean {
    return this.nextItem?.itemId === itemId;
  }

  // Coordinates of the last-verified pin, for drawing the route line to "next".
  get currentPin(): any | null {
    if (this.lastVerifiedItemId == null) return null;
    return this.mapPlaced.find(p => p.itemId === this.lastVerifiedItemId) || null;
  }

  // Verify a pin straight from the map.
  verifyMapItem(item: any) {
    if (this.selectedAudit?.status !== 'IN_PROGRESS') {
      this.messageService.add({ severity: 'info', summary: 'Not started', detail: 'Start the audit before verifying items' });
      return;
    }
    this.selectedItemId = item.itemId;
    this.verifyForm = {
      status: 'VERIFIED', locationMatch: true, conditionMatch: true,
      actualLocation: '', actualCondition: '', remarks: '', stickerStatus: ''
    };
    this.showVerifyDialog = true;
  }

  // Start audit
  startAudit(audit: any) {
    this.startingAudit = true;
    this.auditService.start(audit.id).subscribe({
      next: () => {
        setTimeout(() => {
          this.startingAudit = false;
          this.messageService.add({ severity: 'success', summary: 'Started', detail: 'Audit is now in progress' });
          this.loadAudits();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.startingAudit = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to start audit' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  // Complete audit
  completeAudit(audit: any) {
    this.completingAudit = true;
    this.auditService.complete(audit.id).subscribe({
      next: () => {
        setTimeout(() => {
          this.completingAudit = false;
          this.messageService.add({ severity: 'success', summary: 'Completed', detail: 'Audit completed' });
          if (this.showDetail) {
            this.loadAuditDetail(audit.id);
          }
          this.loadAudits();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.completingAudit = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to complete audit' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  // Verify item
  openVerifyDialog(item: any) {
    this.selectedItemId = item.id;
    this.verifyForm = {
      status: 'VERIFIED',
      locationMatch: true,
      conditionMatch: true,
      actualLocation: '',
      actualCondition: '',
      remarks: ''
    };
    this.showVerifyDialog = true;
  }

  submitVerify() {
    if (!this.selectedItemId) return;
    const verifiedItemId = this.selectedItemId;
    this.verifyLoading = true;
    this.auditService.verifyItem(this.selectedItemId, this.verifyForm).subscribe({
      next: () => {
        setTimeout(() => {
          this.verifyLoading = false;
          this.showVerifyDialog = false;
          this.messageService.add({ severity: 'success', summary: 'Verified', detail: 'Item verified' });
          if (this.selectedAudit) {
            this.loadAuditDetail(this.selectedAudit.id);
            this.loadCompletionCheck();
            if (this.viewMode === 'checklist') this.loadChecklist();
            if (this.showMap) {
              // Anchor the next-asset suggestion to the pin just inspected.
              this.lastVerifiedItemId = verifiedItemId;
              this.loadFloorMap(this.selectedAudit.id);
            }
          }
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.verifyLoading = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to verify item' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  getAuditStatusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    switch (status) {
      case 'PLANNED': return 'info';
      case 'IN_PROGRESS': return 'warn';
      case 'COMPLETED': return 'success';
      default: return 'secondary';
    }
  }

  getItemStatusSeverity(status: string): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" {
    switch (status) {
      case 'VERIFIED': return 'success';
      case 'MISSING': return 'danger';
      case 'MISMATCH': return 'contrast';
      case 'PENDING': return 'warn';
      default: return 'secondary';
    }
  }

  getScopeLabel(): string {
    return [this.createForm.floor, this.createForm.block, this.createForm.room]
      .filter(v => v != null && v !== '')
      .join(' / ');
  }

  getProgressPercent(): number {
    if (!this.summary.totalItems) return 0;
    return Math.round(((this.summary.verifiedCount || 0) / this.summary.totalItems) * 100);
  }
}
