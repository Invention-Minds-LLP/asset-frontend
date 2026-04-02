import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormsModule } from '@angular/forms';
import { FormControl } from '@angular/forms';
import { ViewChild } from '@angular/core';
import { Table } from 'primeng/table';

import { Router } from '@angular/router';
import { ConfirmPopupModule } from 'primeng/confirmpopup';
import { ConfirmationService } from 'primeng/api';

import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabel } from 'primeng/floatlabel';
import { TableModule } from 'primeng/table';
import { Select } from 'primeng/select';

import { Assets } from '../../services/assets/assets';
import { Branches } from '../../services/branches/branches';
import { ModuleAccessService } from '../../services/module-access/module-access';

import { EmployeeRole, Employees } from '../../services/employees/employees';
import { Auth } from '../../services/auth/auth';
import { TabViewModule } from 'primeng/tabview';
type SettingsSection = 'profile' | 'reset' | 'user' | 'employee' | 'table' | 'master';
type ThemeMode = 'light' | 'dark';


@Component({
  selector: 'app-settings',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ConfirmPopupModule,
    ToastModule,
    ButtonModule,
    InputTextModule,
    FloatLabel,
    TableModule,
    Select,
    TabViewModule,
    FormsModule,
  ],
 providers: [MessageService, ConfirmationService],
  templateUrl: './settings.html',
  styleUrls: ['./settings.css'],
})


export class Settings {
  activeSection: SettingsSection = 'employee';

  // Maps sub-item name (from seed) → SettingsSection key
  private readonly sectionMap: Record<string, SettingsSection> = {
    'profile':           'profile',
    'reset-password':    'reset',
    'user-creation':     'user',
    'employee-creation': 'employee',
    'table':             'table',
    'master-data':       'master',
  };

  // Sections visible to the current user — starts full, filtered after API call
  visibleSections = new Set<SettingsSection>(['profile', 'reset', 'user', 'employee', 'table', 'master']);

  canSee(section: SettingsSection): boolean {
    return this.visibleSections.has(section);
  }


  // ===== Employee Form =====
  roleOptions = [
    { name: 'CEO / COO', value: 'CEO_COO' as EmployeeRole },
    { name: 'HOD', value: 'HOD' as EmployeeRole },
    { name: 'Supervisor', value: 'SUPERVISOR' as EmployeeRole },
    { name: 'Executive', value: 'EXECUTIVE' as EmployeeRole },
    { name: 'Finance', value: 'FINANCE' as EmployeeRole },
    { name: 'Operations', value: 'OPERATIONS' as EmployeeRole },
    { name: 'Admin', value: 'ADMIN' as EmployeeRole },
  ];

  employeeForm!: FormGroup
  departments: any[] = [];
  departmentOptions: { label: string; value: number }[] = [];
  loadingDepartments = false;

  // ===== Employee Table =====
  employees: any[] = [];
  loadingEmployees = false;

  tableTab: 'employee' | 'user' = 'employee';
  // ===== Profile info =====
  profileUser: any = null; // decoded from localStorage token or saved login response

  // ===== User Creation =====
  userForm!: FormGroup;

  // ===== Reset Password =====
  resetForm!: FormGroup;

  // ===== Users Table =====
  users: any[] = [];
  loadingUsers = false;

  searchCtrl = new FormControl<string>('', { nonNullable: true });

  @ViewChild('dt') dt?: Table;
  @ViewChild('dtUser') dtUser?: Table;
  showUserPassword = false;
  showNewPassword = false;
  showConfirmPassword = false;
  passwordStrength: 'weak' | 'medium' | 'strong' | null = null;



  // ===== Master Data (Departments / Branches / Categories / Vendors) =====
  masterDepts: any[] = [];
  masterBranches: any[] = [];
  masterCategories: any[] = [];
  masterVendors: any[] = [];

  deptForm = { name: '' };
  editingDeptId: number | null = null;
  showDeptForm = false;

  branchForm = { name: '' };
  editingBranchId: number | null = null;
  showBranchForm = false;

  categoryForm = { name: '' };
  editingCategoryId: number | null = null;
  showCategoryForm = false;

  vendorForm = { name: '', contact: '', email: '' };
  editingVendorId: number | null = null;
  showVendorForm = false;

  constructor(
    private fb: FormBuilder,
    private employeeApi: Employees,
    private toast: MessageService,
    private assetService: Assets,
    private branchesService: Branches,
    private usersApi: Auth,
    private confirmationService: ConfirmationService,
    private router: Router,
    private moduleAccessService: ModuleAccessService
  ) {
    // preload (table uses it)
    this.employeeForm = this.fb.group({
      name: ['', Validators.required],
      employeeID: ['', Validators.required],
      departmentId: [null as number | null, Validators.required],
      role: ['EXECUTIVE' as EmployeeRole, Validators.required],
    });
    this.userForm = this.fb.group({
      employeeID: ['', Validators.required],
      username: ['', Validators.required],
      password: ['', [Validators.required, Validators.minLength(6)]],
      role: ['USER', Validators.required],
    });

    this.resetForm = this.fb.group(
      {
        employeeID: ['', Validators.required],
        newPassword: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required, Validators.minLength(6)]],
      },
      { validators: this.passwordMatchValidator.bind(this) }
    );
  }

  ngOnInit() {
    this.loadEmployees();
    this.loadDepartments();
    this.loadUsers();
    this.loadProfileFromStorage();
    this.resetForm.get('newPassword')?.valueChanges.subscribe(v => {
      this.checkPasswordStrength(v);
    });
    this.applyAccessFilter();
  }

  private applyAccessFilter() {
    this.moduleAccessService.getMyAccess().subscribe({
      next: (result) => {
        if (result.isAdmin) return;

        const settingsMod = result.modules?.find((m: any) => m.name === 'settings');

        if (!settingsMod) {
          setTimeout(() => {
            this.visibleSections = new Set(['profile'] as SettingsSection[]);
            this.activeSection = 'profile';
          });
          return;
        }

        const subItems: any[] = settingsMod.subItems || [];
        if (subItems.length === 0) return;

        const allowed = new Set<SettingsSection>();
        for (const item of subItems) {
          const section = this.sectionMap[item.name];
          if (section) allowed.add(section);
        }

        setTimeout(() => {
          this.visibleSections = allowed;
          if (!this.visibleSections.has(this.activeSection)) {
            this.activeSection = [...this.visibleSections][0] ?? 'profile';
          }
        });
      },
      error: () => { /* API failed — show all (fail open) */ }
    });
  }

  // ---------------- MENU ----------------
  setSection(section: SettingsSection) {
    this.activeSection = section;
    if (section === 'table') this.loadEmployees();
    if (section === 'master') this.loadMasterData();
  }

  // ── Master Data ──────────────────────────────────────────────────────────
  loadMasterData() {
    this.assetService.getDepartments().subscribe({ next: d => this.masterDepts = d });
    this.branchesService.getBranches().subscribe({ next: b => this.masterBranches = b });
    this.assetService.getCategories().subscribe({ next: c => this.masterCategories = c });
    this.assetService.getVendors().subscribe({ next: v => this.masterVendors = v });
  }

  // Departments
  openDeptForm(dept?: any) {
    this.editingDeptId = dept?.id ?? null;
    this.deptForm = { name: dept?.name ?? '' };
    this.showDeptForm = true;
  }
  saveDept() {
    if (!this.deptForm.name.trim()) { this.toastMsg('warn', 'Validation', 'Name is required'); return; }
    const call = this.editingDeptId
      ? this.assetService.updateDepartment(this.editingDeptId, this.deptForm.name.trim())
      : this.assetService.createDepartment({ name: this.deptForm.name.trim() });
    call.subscribe({
      next: () => { this.toastMsg('success', 'Saved', 'Department saved'); this.showDeptForm = false; this.assetService.getDepartments().subscribe(d => this.masterDepts = d); },
      error: err => this.toastMsg('error', 'Error', err?.error?.message || 'Failed')
    });
  }
  deleteDept(dept: any) {
    if (!confirm(`Delete "${dept.name}"?`)) return;
    this.assetService.deleteDepartment(dept.id).subscribe({
      next: () => { this.toastMsg('success', 'Deleted', 'Department deleted'); this.assetService.getDepartments().subscribe(d => this.masterDepts = d); },
      error: err => this.toastMsg('error', 'Error', err?.error?.message || 'Failed')
    });
  }

  // Branches
  openBranchForm(branch?: any) {
    this.editingBranchId = branch?.id ?? null;
    this.branchForm = { name: branch?.name ?? '' };
    this.showBranchForm = true;
  }
  saveBranch() {
    if (!this.branchForm.name.trim()) { this.toastMsg('warn', 'Validation', 'Name is required'); return; }
    const call = this.editingBranchId
      ? this.branchesService.updateBranch(this.editingBranchId, this.branchForm.name.trim())
      : this.branchesService.createBranch(this.branchForm.name.trim());
    call.subscribe({
      next: () => { this.toastMsg('success', 'Saved', 'Branch saved'); this.showBranchForm = false; this.branchesService.getBranches().subscribe(b => this.masterBranches = b); },
      error: err => this.toastMsg('error', 'Error', err?.error?.message || 'Failed')
    });
  }
  deleteBranch(branch: any) {
    if (!confirm(`Delete "${branch.name}"?`)) return;
    this.branchesService.deleteBranch(branch.id).subscribe({
      next: () => { this.toastMsg('success', 'Deleted', 'Branch deleted'); this.branchesService.getBranches().subscribe(b => this.masterBranches = b); },
      error: err => this.toastMsg('error', 'Error', err?.error?.message || 'Failed')
    });
  }

  // Categories
  openCategoryForm(cat?: any) {
    this.editingCategoryId = cat?.id ?? null;
    this.categoryForm = { name: cat?.name ?? '' };
    this.showCategoryForm = true;
  }
  saveCategory() {
    if (!this.categoryForm.name.trim()) { this.toastMsg('warn', 'Validation', 'Name is required'); return; }
    const call = this.editingCategoryId
      ? this.assetService.updateCategory(this.editingCategoryId, this.categoryForm.name.trim())
      : this.assetService.createCategory({ name: this.categoryForm.name.trim() });
    call.subscribe({
      next: () => { this.toastMsg('success', 'Saved', 'Category saved'); this.showCategoryForm = false; this.assetService.getCategories().subscribe(c => this.masterCategories = c); },
      error: err => this.toastMsg('error', 'Error', err?.error?.message || 'Failed')
    });
  }
  deleteCategory(cat: any) {
    if (!confirm(`Delete "${cat.name}"?`)) return;
    this.assetService.deleteCategory(cat.id).subscribe({
      next: () => { this.toastMsg('success', 'Deleted', 'Category deleted'); this.assetService.getCategories().subscribe(c => this.masterCategories = c); },
      error: err => this.toastMsg('error', 'Error', err?.error?.message || 'Failed')
    });
  }

  // Vendors
  openVendorForm(vendor?: any) {
    this.editingVendorId = vendor?.id ?? null;
    this.vendorForm = { name: vendor?.name ?? '', contact: vendor?.contact ?? '', email: vendor?.email ?? '' };
    this.showVendorForm = true;
  }
  saveVendor() {
    if (!this.vendorForm.name.trim()) { this.toastMsg('warn', 'Validation', 'Name is required'); return; }
    const call = this.editingVendorId
      ? this.assetService.updateVendor(this.editingVendorId, this.vendorForm)
      : this.assetService.createVendor(this.vendorForm);
    call.subscribe({
      next: () => { this.toastMsg('success', 'Saved', 'Vendor saved'); this.showVendorForm = false; this.assetService.getVendors().subscribe(v => this.masterVendors = v); },
      error: err => this.toastMsg('error', 'Error', err?.error?.message || 'Failed')
    });
  }
  deleteVendor(vendor: any) {
    if (!confirm(`Delete "${vendor.name}"?`)) return;
    this.assetService.deleteVendor(vendor.id).subscribe({
      next: () => { this.toastMsg('success', 'Deleted', 'Vendor deleted'); this.assetService.getVendors().subscribe(v => this.masterVendors = v); },
      error: err => this.toastMsg('error', 'Error', err?.error?.message || 'Failed')
    });
  }
  setTableTab(tab: 'employee' | 'user') {
    this.tableTab = tab;
    // re-apply search on tab switch
    const value = (this.searchCtrl.value ?? '').trim();
    setTimeout(() => {
      if (tab === 'employee') this.dt?.filterGlobal(value, 'contains');
      else this.dtUser?.filterGlobal(value, 'contains');
    });
  }
  loadDepartments() {
    this.loadingDepartments = true;
    this.assetService.getDepartments().subscribe({
      next: (rows) => {
        this.departments = rows;
        this.departmentOptions = rows.map(d => ({ label: d.name, value: d.id }));
      },
      error: () => this.toastMsg('error', 'Failed', 'Failed to load departments'),
      complete: () => (this.loadingDepartments = false),
    });
  }
  // ---------------- EMPLOYEE CRUD ----------------
  loadEmployees() {
    this.loadingEmployees = true;
    this.employeeApi.getEmployees().subscribe({
      next: (rows) => (this.employees = rows),
      error: () => this.toastMsg('error', 'Failed', 'Failed to load employees'),
      complete: () => (this.loadingEmployees = false),
    });
  }

  submitEmployee() {
    if (this.employeeForm.invalid) {
      this.toastMsg('warn', 'Validation', 'Please fill all required fields');
      return;
    }

    const v = this.employeeForm.getRawValue();
    this.employeeApi.createEmployee({
      name: String(v.name).trim(),
      employeeID: String(v.employeeID).trim(),
      departmentId: v.departmentId != null ? Number(v.departmentId) : null,
      role: v.role as EmployeeRole,
    }).subscribe({
      next: () => {
        this.toastMsg('success', 'Success', 'Employee created');
        this.employeeForm.reset({ role: 'EXECUTIVE', departmentId: null });
        this.loadEmployees();
      },
      error: (err) => this.toastMsg('error', 'Failed', err?.error?.message ?? 'Employee creation failed'),
    });
  }

  clearEmployeeForm() {
    this.employeeForm.reset({ role: 'EXECUTIVE', departmentId: null });
  }

  deleteEmployee(id: number) {
    this.employeeApi.deleteEmployee(id).subscribe({
      next: () => {
        this.toastMsg('success', 'Deleted', 'Employee deleted');
        this.loadEmployees();
      },
      error: () => this.toastMsg('error', 'Failed', 'Delete failed'),
    });
  }

  // ---------------- TOAST ----------------
  toastMsg(severity: 'success' | 'info' | 'warn' | 'error', summary: string, detail: string) {
    this.toast.add({ severity, summary, detail });
  }

  onFilterClick() {
    // optional: open a filter dialog later
    this.toastMsg('info', 'Filter', 'Filter UI not implemented yet');
  }
  loadProfileFromStorage() {
    try {
      const raw = localStorage.getItem('user'); // if you saved user object during login
      this.profileUser = raw ? JSON.parse(raw) : null;
    } catch {
      this.profileUser = null;
    }
  }
  loadUsers() {
    this.loadingUsers = true;
    this.usersApi.getUsers().subscribe({
      next: (rows) => (this.users = rows),
      error: () => this.toastMsg('error', 'Failed', 'Failed to load users'),
      complete: () => (this.loadingUsers = false),
    });
  }

submitUser() {
  if (this.userForm.invalid) {
    this.userForm.markAllAsTouched();
    this.toastMsg('warn', 'Validation', 'Please fill all required fields');
    return;
  }

  const v = this.userForm.getRawValue();
  this.usersApi.createUser({
    employeeID: String(v.employeeID).trim(),
    username: String(v.username).trim(),
    password: String(v.password),
    role: String(v.role),
  }).subscribe({
    next: () => {
      this.toastMsg('success', 'Success', 'User created');
      this.userForm.reset({ role: 'USER' });
      this.loadUsers();
    },
    error: (err) => this.toastMsg('error', 'Failed', err?.error?.message ?? 'User creation failed'),
  });
}

  deleteUser(id: number) {
    this.usersApi.deleteUser(id).subscribe({
      next: () => {
        this.toastMsg('success', 'Deleted', 'User deleted');
        this.loadUsers();
      },
      error: () => this.toastMsg('error', 'Failed', 'Delete failed'),
    });
  }
  submitResetPassword() {
    if (this.resetForm.invalid) {
      if (this.resetForm.errors?.['passwordMismatch']) {
        this.toastMsg('warn', 'Validation', 'Password and Confirm Password must match');
      } else {
        this.toastMsg('warn', 'Validation', 'Please fill all required fields');
      }
      return;
    }

    const v = this.resetForm.getRawValue();
    this.usersApi.resetPassword(String(v.employeeID).trim(), String(v.newPassword)).subscribe({
      next: () => {
        this.toastMsg('success', 'Success', 'Password updated');
        this.resetForm.reset();
      },
      error: (err) =>
        this.toastMsg('error', 'Failed', err?.error?.message ?? 'Password reset failed'),
    });
  }


  private passwordMatchValidator(group: FormGroup) {
    const p1 = group.get('newPassword')?.value;
    const p2 = group.get('confirmPassword')?.value;
    return p1 && p2 && p1 !== p2 ? { passwordMismatch: true } : null;
  }
  checkPasswordStrength(value: string) {
    if (!value) {
      this.passwordStrength = null;
      return;
    }

    const hasUpper = /[A-Z]/.test(value);
    const hasLower = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);
    const hasSpecial = /[^A-Za-z0-9]/.test(value);

    const score = [hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;

    if (value.length < 6 || score <= 1) this.passwordStrength = 'weak';
    else if (score === 2 || score === 3) this.passwordStrength = 'medium';
    else this.passwordStrength = 'strong';
  }
  confirmLogout(event: Event) {
  this.confirmationService.confirm({
    target: event.target as EventTarget,
    message: 'Are you sure you want to logout?',
    icon: 'pi pi-exclamation-triangle',
    acceptLabel: 'Logout',
    rejectLabel: 'Cancel',
    accept: () => {
      this.usersApi.logout();
      this.toastMsg('success', 'Logged out', 'You have been logged out successfully');
      this.router.navigate(['/login']);
    }
  });
}
}