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
import { TextareaModule } from 'primeng/textarea';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { Assets } from '../../services/assets/assets';
import { Branches } from '../../services/branches/branches';

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
    TextareaModule,
    TagModule,
    TooltipModule,
    CheckboxModule
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

  // ── Branches ─────────────────────────────────────────────────────────────
  branches: any[] = [];
  branchForm = { name: '' };
  editingBranchId: number | null = null;
  showBranchForm = false;

  // ── Asset Categories ─────────────────────────────────────────────────────
  categories: any[] = [];
  categoryForm: {
    name: string;
    code?: string | null;
    serialRequired?: boolean;
    defaultDepreciationMethod?: string | null;
    defaultDepreciationRate?: number | null;
    defaultLifeYears?: number | null;
  } = { name: '', serialRequired: true };

  depMethodOptions = [
    { label: 'Straight Line (SL)', value: 'SL' },
    { label: 'Declining Balance / WDV (DB)', value: 'DB' },
  ];
  editingCategoryId: number | null = null;
  showCategoryForm = false;

  // ── Vendors ──────────────────────────────────────────────────────────────
  vendors: any[] = [];
  vendorForm: any = {
    name: '', contact: '', email: '', contactPerson: '', alternatePhone: '',
    vendorType: null, address: '', city: '', state: '', pincode: '',
    gstNumber: '', panNumber: '', bankName: '', bankAccount: '', bankIfsc: '', notes: ''
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
          this.cdr.detectChanges();
        });
      },
      error: err => this.toast('error', err?.error?.message || 'Failed to save department')
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
          this.cdr.detectChanges();
        });
      },
      error: err => this.toast('error', err?.error?.message || 'Failed to save branch')
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
        defaultDepreciationMethod: null,
        defaultDepreciationRate: null,
        defaultLifeYears: null,
      };
    }
    this.showCategoryForm = true;
  }

  saveCategory() {
    if (!this.categoryForm.name.trim()) { this.toast('warn', 'Category name is required'); return; }
    const payload: any = {
      name: this.categoryForm.name.trim(),
      code: this.categoryForm.code?.trim() || null,
      serialRequired: this.categoryForm.serialRequired ?? true,
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
          this.cdr.detectChanges();
        });
      },
      error: err => this.toast('error', err?.error?.message || 'Failed to save category')
    });
  }

  deleteCategory(cat: any) {
    if (!confirm(`Delete category "${cat.name}"?`)) return;
    this.assetsService.deleteCategory(cat.id).subscribe({
      next: () => { setTimeout(() => { this.toast('success', 'Category deleted'); this.loadCategories(); this.cdr.detectChanges(); }); },
      error: err => this.toast('error', err?.error?.message || 'Failed to delete category')
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
      };
    } else {
      this.editingVendorId = null;
      this.vendorForm = {
        name: '', contact: '', email: '', contactPerson: '', alternatePhone: '',
        vendorType: null, address: '', city: '', state: '', pincode: '',
        gstNumber: '', panNumber: '', bankName: '', bankAccount: '', bankIfsc: '', notes: ''
      };
    }
    this.showVendorForm = true;
  }

  saveVendor() {
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
          this.cdr.detectChanges();
        });
      },
      error: err => this.toast('error', err?.error?.message || 'Failed to save vendor')
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
