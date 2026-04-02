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
import { TagModule } from 'primeng/tag';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { ModuleAccessService } from '../../services/module-access/module-access';
import { Assets } from '../../services/assets/assets';

@Component({
  selector: 'app-module-access',
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
    TagModule,
    CheckboxModule
  ],
  templateUrl: './module-access.html',
  styleUrl: './module-access.css',
  providers: [MessageService]
})
export class ModuleAccess implements OnInit {
  modules: any[] = [];
  employees: any[] = [];

  // ── Filter controls ───────────────────────────────────────────────────────
  filterType: 'role' | 'employee' = 'role';
  selectedRole: string | null = null;
  selectedEmployeeId: number | null = null;
  selectedEmployeeLabel: string = '';

  roleOptions = [
    { label: 'CEO / COO', value: 'CEO_COO' },
    { label: 'HOD', value: 'HOD' },
    { label: 'Supervisor', value: 'SUPERVISOR' },
    { label: 'Executive', value: 'EXECUTIVE' },
    { label: 'Finance', value: 'FINANCE' },
    { label: 'Operations', value: 'OPERATIONS' },
  ];

  filterTypeOptions = [
    { label: 'By Role', value: 'role' },
    { label: 'By Employee', value: 'employee' }
  ];

  // ── Permission matrix ─────────────────────────────────────────────────────
  // permMatrix[moduleId] = true/false  (module-level)
  // permMatrix['item_' + itemId] = true/false  (item-level)
  permMatrix: { [key: string]: boolean } = {};
  saving = false;
  loading = false;
  matrixLoaded = false;

  constructor(
    private moduleAccessService: ModuleAccessService,
    private assetsService: Assets,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.moduleAccessService.getModules().subscribe({
      next: mods => { setTimeout(() => { this.modules = mods; this.cdr.detectChanges(); }); },
      error: () => this.toast('error', 'Failed to load modules')
    });

    this.assetsService.getEmployees().subscribe({
      next: emps => {
        setTimeout(() => {
          this.employees = emps.map(e => ({
            label: `${e.name} (${e.employeeID})`,
            value: e.id
          }));
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadPermissions() {
    if (this.filterType === 'role' && !this.selectedRole) {
      this.toast('warn', 'Please select a role'); return;
    }
    if (this.filterType === 'employee' && !this.selectedEmployeeId) {
      this.toast('warn', 'Please select an employee'); return;
    }

    this.loading = true;
    this.permMatrix = {};

    if (this.filterType === 'employee' && this.selectedEmployeeId) {
      const emp = this.employees.find(e => e.value === this.selectedEmployeeId);
      this.selectedEmployeeLabel = emp?.label || '';
    }

    const filters = this.filterType === 'role'
      ? { role: this.selectedRole! }
      : { employeeId: this.selectedEmployeeId! };

    this.moduleAccessService.getPermissions(filters).subscribe({
      next: perms => {
        setTimeout(() => {
          perms.forEach(p => {
            if (p.moduleId && !p.moduleItemId) {
              this.permMatrix[`mod_${p.moduleId}`] = p.canAccess;
            }
            if (p.moduleItemId) {
              this.permMatrix[`item_${p.moduleItemId}`] = p.canAccess;
            }
          });
          this.matrixLoaded = true;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => { this.loading = false; this.cdr.detectChanges(); });
        this.toast('error', 'Failed to load permissions');
      }
    });
  }

  toggleAll(checked: boolean) {
    this.modules.forEach(mod => {
      this.permMatrix[`mod_${mod.id}`] = checked;
      mod.subItems?.forEach((item: any) => {
        this.permMatrix[`item_${item.id}`] = checked;
      });
    });
  }

  onModuleToggle(mod: any, checked: boolean) {
    this.permMatrix[`mod_${mod.id}`] = checked;
    // cascade to sub-items
    mod.subItems?.forEach((item: any) => {
      this.permMatrix[`item_${item.id}`] = checked;
    });
  }

  savePermissions() {
    if (!this.matrixLoaded) return;

    const permissions: any[] = [];

    this.modules.forEach(mod => {
      const modKey = `mod_${mod.id}`;
      if (modKey in this.permMatrix) {
        const perm: any = { moduleId: mod.id, canAccess: this.permMatrix[modKey] };
        if (this.filterType === 'role') perm.role = this.selectedRole;
        else perm.employeeId = this.selectedEmployeeId;
        permissions.push(perm);
      }

      mod.subItems?.forEach((item: any) => {
        const itemKey = `item_${item.id}`;
        if (itemKey in this.permMatrix) {
          const perm: any = { moduleItemId: item.id, canAccess: this.permMatrix[itemKey] };
          if (this.filterType === 'role') perm.role = this.selectedRole;
          else perm.employeeId = this.selectedEmployeeId;
          permissions.push(perm);
        }
      });
    });

    if (!permissions.length) { this.toast('warn', 'No permissions to save'); return; }

    this.saving = true;
    this.moduleAccessService.bulkSetPermissions(permissions).subscribe({
      next: res => {
        setTimeout(() => {
          this.toast('success', `${res.saved} permissions saved`);
          this.saving = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => { this.saving = false; this.cdr.detectChanges(); });
        this.toast('error', 'Failed to save permissions');
      }
    });
  }

  seedModules() {
    this.moduleAccessService.seedModules().subscribe({
      next: res => {
        setTimeout(() => {
          this.toast('success', `Seeded: ${res.created?.join(', ') || 'Already up to date'}`);
          this.moduleAccessService.getModules().subscribe(mods => {
            setTimeout(() => { this.modules = mods; this.cdr.detectChanges(); });
          });
          this.cdr.detectChanges();
        });
      },
      error: () => this.toast('error', 'Seed failed')
    });
  }

  private toast(severity: string, detail: string) {
    this.messageService.add({ severity, summary: severity.charAt(0).toUpperCase() + severity.slice(1), detail, life: 3500 });
  }
}
