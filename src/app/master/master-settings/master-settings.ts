import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TabViewModule } from 'primeng/tabview';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { MultiSelectModule } from 'primeng/multiselect';
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { Assets } from '../../services/assets/assets';
import { Branches } from '../../services/branches/branches';
import { OverflowTooltipDirective } from '../../shared/directives/overflow-tooltip.directive';

@Component({
  selector: 'app-master-settings',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    ToastModule,
    TabViewModule,
    InputTextModule,
    FloatLabelModule,
    SelectModule,
    MultiSelectModule,
    TextareaModule,
    TagModule,
    TooltipModule,
    CheckboxModule,
    OverflowTooltipDirective
  ],
  templateUrl: './master-settings.html',
  styleUrl: './master-settings.css',
  providers: [MessageService]
})
export class MasterSettings implements OnInit {
  // ── Departments ──────────────────────────────────────────────────────────
  departments: any[] = [];
  deptForm = { name: '' };
  editingDeptId: number | null = null;
  showDeptForm = false;
  savingDept = false;

  // ── Branches ─────────────────────────────────────────────────────────────
  branches: any[] = [];
  branchForm = { name: '' };
  editingBranchId: number | null = null;
  showBranchForm = false;
  savingBranch = false;

  // ── Asset Categories ─────────────────────────────────────────────────────
  categories: any[] = [];
  categoryForm: {
    name: string;
    code?: string | null;
    serialRequired?: boolean;
    locationProfile?: string | null;
    defaultDepreciationMethod?: string | null;
    defaultDepreciationRate?: number | null;
    defaultLifeYears?: number | null;
  } = { name: '', serialRequired: true, locationProfile: 'ROOM' };

  locationProfileOptions = [
    { label: 'Room (default — Block/Floor/Room)', value: 'ROOM' },
    { label: 'Network gear (rack / U-position / port)', value: 'NETWORK' },
    { label: 'Camera / sensor (mount + coverage + GPS)', value: 'CAMERA' },
    { label: 'Outdoor (GPS)', value: 'OUTDOOR' },
    { label: 'Generic (mount + label)', value: 'GENERIC' },
  ];

  depMethodOptions = [
    { label: 'Straight Line (SL)', value: 'SL' },
    { label: 'Declining Balance / WDV (DB)', value: 'DB' },
  ];
  editingCategoryId: number | null = null;
  showCategoryForm = false;
  savingAsset = false;

  // ── Asset Sub-Types (flat/global) ─────────────────────────────────────────
  subTypes: any[] = [];
  subTypeForm: { name: string; code?: string | null; description?: string | null } = { name: '' };
  editingSubTypeId: number | null = null;
  showSubTypeForm = false;
  savingSubType = false;

  // ── Vendors ──────────────────────────────────────────────────────────────
  vendors: any[] = [];
  vendorForm: any = {
    name: '', contact: '', email: '', contactPerson: '', alternatePhone: '',
    vendorType: null, address: '', city: '', state: '', pincode: '',
    gstNumber: '', panNumber: '', bankName: '', bankAccount: '', bankIfsc: '', notes: '',
    departmentIds: [] as number[],
  };
  editingVendorId: number | null = null;
  showVendorForm = false;
  vendorTypeOptions = [
    { label: 'OEM', value: 'OEM' },
    { label: 'Distributor', value: 'DISTRIBUTOR' },
    { label: 'Service Provider', value: 'SERVICE_PROVIDER' },
    { label: 'Reseller', value: 'RESELLER' },
    { label: 'Other', value: 'OTHER' },
  ];

  loading = false;
  savingVendor = false;

  constructor(
    private assetsService: Assets,
    private branchesService: Branches,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadAll();
  }

  loadAll() {
    this.loadDepartments();
    this.loadBranches();
    this.loadCategories();
    this.loadSubTypes();
    this.loadVendors();
  }

  // ── Departments ──────────────────────────────────────────────────────────
  loadDepartments() {
    this.assetsService.getDepartments().subscribe({
      next: d => { setTimeout(() => { this.departments = d; this.cdr.detectChanges(); }); },
      error: () => this.toast('error', 'Failed to load departments')
    });
  }

  openDeptForm(dept?: any) {
    if (dept) {
      this.editingDeptId = dept.id;
      this.deptForm = { name: dept.name };
    } else {
      this.editingDeptId = null;
      this.deptForm = { name: '' };
    }
    this.showDeptForm = true;
  }

  saveDept() {
    this.savingDept = true;
    if (!this.deptForm.name.trim()) { this.toast('warn', 'Department name is required'); return; }
    const call = this.editingDeptId
      ? this.assetsService.updateDepartment(this.editingDeptId, this.deptForm.name.trim())
      : this.assetsService.createDepartment({ name: this.deptForm.name.trim() });

    call.subscribe({
      next: () => {
        setTimeout(() => {
          this.toast('success', this.editingDeptId ? 'Department updated' : 'Department created');
          this.showDeptForm = false;
          this.loadDepartments();
          this.savingDept = false;
          this.cdr.detectChanges();
        });
      },
      error: err => { setTimeout(() => { this.savingDept = false; this.cdr.detectChanges(); });
        this.toast('error', err?.error?.message || 'Failed to save department')}
    });
  }

  deleteDept(dept: any) {
    if (!confirm(`Delete department "${dept.name}"?`)) return;
    this.assetsService.deleteDepartment(dept.id).subscribe({
      next: () => { setTimeout(() => { this.toast('success', 'Department deleted'); this.loadDepartments(); this.cdr.detectChanges(); }); },
      error: err => this.toast('error', err?.error?.message || 'Failed to delete department')
    });
  }

  // ── Branches ─────────────────────────────────────────────────────────────
  loadBranches() {
    this.branchesService.getBranches().subscribe({
      next: b => { setTimeout(() => { this.branches = b; this.cdr.detectChanges(); }); },
      error: () => this.toast('error', 'Failed to load branches')
    });
  }

  openBranchForm(branch?: any) {
    if (branch) {
      this.editingBranchId = branch.id;
      this.branchForm = { name: branch.name };
    } else {
      this.editingBranchId = null;
      this.branchForm = { name: '' };
    }
    this.showBranchForm = true;
  }

  saveBranch() {
    this.savingBranch = true;
    if (!this.branchForm.name.trim()) { this.toast('warn', 'Branch name is required'); return; }
    const call = this.editingBranchId
      ? this.branchesService.updateBranch(this.editingBranchId, this.branchForm.name.trim())
      : this.branchesService.createBranch(this.branchForm.name.trim());

    call.subscribe({
      next: () => {
        setTimeout(() => {
          this.toast('success', this.editingBranchId ? 'Branch updated' : 'Branch created');
          this.showBranchForm = false;
          this.loadBranches();
          this.savingBranch = false;
          this.cdr.detectChanges();
        });
      },
      error: err => {setTimeout(() => { this.savingBranch = false; this.cdr.detectChanges(); });
        this.toast('error', err?.error?.message || 'Failed to save branch')}
    });
  }

  deleteBranch(branch: any) {
    if (!confirm(`Delete branch "${branch.name}"?`)) return;
    this.branchesService.deleteBranch(branch.id).subscribe({
      next: () => { setTimeout(() => { this.toast('success', 'Branch deleted'); this.loadBranches(); this.cdr.detectChanges(); }); },
      error: err => this.toast('error', err?.error?.message || 'Failed to delete branch')
    });
  }

  // ── Asset Categories ─────────────────────────────────────────────────────
  loadCategories() {
    this.assetsService.getCategories().subscribe({
      next: c => { setTimeout(() => { this.categories = c; this.cdr.detectChanges(); }); },
      error: () => this.toast('error', 'Failed to load categories')
    });
  }

  openCategoryForm(cat?: any) {
    if (cat) {
      this.editingCategoryId = cat.id;
      this.categoryForm = {
        name: cat.name,
        code: cat.code ?? null,
        serialRequired: cat.serialRequired ?? true,
        locationProfile: cat.locationProfile ?? 'ROOM',
        defaultDepreciationMethod: cat.defaultDepreciationMethod ?? null,
        defaultDepreciationRate: cat.defaultDepreciationRate != null ? Number(cat.defaultDepreciationRate) : null,
        defaultLifeYears: cat.defaultLifeYears ?? null,
      };
    } else {
      this.editingCategoryId = null;
      this.categoryForm = {
        name: '',
        code: null,
        serialRequired: true,
        locationProfile: 'ROOM',
        defaultDepreciationMethod: null,
        defaultDepreciationRate: null,
        defaultLifeYears: null,
      };
    }
    this.showCategoryForm = true;
  }

  saveCategory() {
    this.savingAsset = true;
    if (!this.categoryForm.name.trim()) { this.toast('warn', 'Category name is required'); return; }
    const payload: any = {
      name: this.categoryForm.name.trim(),
      code: this.categoryForm.code?.trim() || null,
      serialRequired: this.categoryForm.serialRequired ?? true,
      locationProfile: this.categoryForm.locationProfile || 'ROOM',
      defaultDepreciationMethod: this.categoryForm.defaultDepreciationMethod || null,
      defaultDepreciationRate: this.categoryForm.defaultDepreciationRate ?? null,
      defaultLifeYears: this.categoryForm.defaultLifeYears ?? null,
    };
    const call = this.editingCategoryId
      ? this.assetsService.updateCategory(this.editingCategoryId, payload)
      : this.assetsService.createCategory(payload);

    call.subscribe({
      next: () => {
        setTimeout(() => {
          this.toast('success', this.editingCategoryId ? 'Category updated' : 'Category created');
          this.showCategoryForm = false;
          this.loadCategories();
          this.savingAsset = false;
          this.cdr.detectChanges();
        });
      },
      error: err => {setTimeout(() => { this.savingAsset = false; this.cdr.detectChanges(); });
        this.toast('error', err?.error?.message || 'Failed to save category')}
    });
  }

  deleteCategory(cat: any) {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    this.assetsService.deleteCategory(cat.id).subscribe({
      next: () => { setTimeout(() => { this.toast('success', 'Category deleted'); this.loadCategories(); this.cdr.detectChanges(); }); },
      error: err => this.toast('error', err?.error?.message || 'Failed to delete category')
    });
  }

  // ── Asset Sub-Types ────────────────────────────────────────────────────────
  loadSubTypes() {
    this.assetsService.getSubTypes().subscribe({
      next: s => { setTimeout(() => { this.subTypes = s; this.cdr.detectChanges(); }); },
      error: () => this.toast('error', 'Failed to load sub-types')
    });
  }

  openSubTypeForm(st?: any) {
    if (st) {
      this.editingSubTypeId = st.id;
      this.subTypeForm = { name: st.name, code: st.code ?? null, description: st.description ?? null };
    } else {
      this.editingSubTypeId = null;
      this.subTypeForm = { name: '', code: null, description: null };
    }
    this.showSubTypeForm = true;
  }

  saveSubType() {
    if (!this.subTypeForm.name.trim()) { this.toast('warn', 'Sub-type name is required'); return; }
    this.savingSubType = true;
    const payload: any = {
      name: this.subTypeForm.name.trim(),
      code: this.subTypeForm.code?.trim() || null,
      description: this.subTypeForm.description?.trim() || null,
    };
    const call = this.editingSubTypeId
      ? this.assetsService.updateSubType(this.editingSubTypeId, payload)
      : this.assetsService.createSubType(payload);

    call.subscribe({
      next: () => {
        setTimeout(() => {
          this.toast('success', this.editingSubTypeId ? 'Sub-type updated' : 'Sub-type created');
          this.showSubTypeForm = false;
          this.loadSubTypes();
          this.savingSubType = false;
          this.cdr.detectChanges();
        });
      },
      error: err => { setTimeout(() => { this.savingSubType = false; this.cdr.detectChanges(); });
        this.toast('error', err?.error?.message || 'Failed to save sub-type'); }
    });
  }

  deleteSubType(st: any) {
    if (!confirm(`Delete sub-type "${st.name}"?`)) return;
    this.assetsService.deleteSubType(st.id).subscribe({
      next: () => { setTimeout(() => { this.toast('success', 'Sub-type deleted'); this.loadSubTypes(); this.cdr.detectChanges(); }); },
      error: err => this.toast('error', err?.error?.message || 'Failed to delete sub-type')
    });
  }

  // ── Vendors ──────────────────────────────────────────────────────────────
  loadVendors() {
    this.assetsService.getVendors().subscribe({
      next: v => { setTimeout(() => { this.vendors = v; this.cdr.detectChanges(); }); },
      error: () => this.toast('error', 'Failed to load vendors')
    });
  }

  openVendorForm(vendor?: any) {
    if (vendor) {
      this.editingVendorId = vendor.id;
      this.vendorForm = {
        name: vendor.name || '',
        contact: vendor.contact || '',
        email: vendor.email || '',
        contactPerson: vendor.contactPerson || '',
        alternatePhone: vendor.alternatePhone || '',
        vendorType: vendor.vendorType || null,
        address: vendor.address || '',
        city: vendor.city || '',
        state: vendor.state || '',
        pincode: vendor.pincode || '',
        gstNumber: vendor.gstNumber || '',
        panNumber: vendor.panNumber || '',
        bankName: vendor.bankName || '',
        bankAccount: vendor.bankAccount || '',
        bankIfsc: vendor.bankIfsc || '',
        notes: vendor.notes || '',
        departmentIds: (vendor.departments || []).map((d: any) => d.id),
      };
    } else {
      this.editingVendorId = null;
      this.vendorForm = {
        name: '', contact: '', email: '', contactPerson: '', alternatePhone: '',
        vendorType: null, address: '', city: '', state: '', pincode: '',
        gstNumber: '', panNumber: '', bankName: '', bankAccount: '', bankIfsc: '', notes: '',
        departmentIds: [],
      };
    }
    this.showVendorForm = true;
  }

  saveVendor() {
    this.savingVendor = true;
    if (!this.vendorForm.name.trim()) { this.toast('warn', 'Vendor name is required'); return; }
    const call = this.editingVendorId
      ? this.assetsService.updateVendor(this.editingVendorId, this.vendorForm)
      : this.assetsService.createVendor(this.vendorForm);

    call.subscribe({
      next: () => {
        setTimeout(() => {
          this.toast('success', this.editingVendorId ? 'Vendor updated' : 'Vendor created');
          this.showVendorForm = false;
          this.loadVendors();
          this.savingVendor = false;
          this.cdr.detectChanges();
        });
      },
      error: err => {setTimeout(() => { this.savingVendor = false; this.cdr.detectChanges(); });
        this.toast('error', err?.error?.message || 'Failed to save vendor')}
    });
  }

  deleteVendor(vendor: any) {
    if (!confirm(`Delete vendor "${vendor.name}"?`)) return;
    this.assetsService.deleteVendor(vendor.id).subscribe({
      next: () => { setTimeout(() => { this.toast('success', 'Vendor deleted'); this.loadVendors(); this.cdr.detectChanges(); }); },
      error: err => this.toast('error', err?.error?.message || 'Failed to delete vendor')
    });
  }

  private toast(severity: string, detail: string) {
    this.messageService.add({ severity, summary: severity.charAt(0).toUpperCase() + severity.slice(1), detail, life: 3000 });
  }
}
