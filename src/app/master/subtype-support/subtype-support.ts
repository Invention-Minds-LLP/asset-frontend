import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TabViewModule } from 'primeng/tabview';
import { SelectModule } from 'primeng/select';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { Assets } from '../../services/assets/assets';

// Roles that may pick any department. HOD is scoped to their own department;
// SUPERVISOR / EXECUTIVE (end user) / USER have no access to this screen.
const ALL_DEPT_ROLES = ['ADMIN', 'CEO_COO', 'OPERATIONS', 'FINANCE', 'CFO'];
const RESTRICTED_ROLES = ['SUPERVISOR', 'EXECUTIVE', 'USER'];

@Component({
  selector: 'app-subtype-support',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    ToastModule,
    TabViewModule,
    SelectModule,
    TagModule,
    TooltipModule,
  ],
  templateUrl: './subtype-support.html',
  styleUrl: './subtype-support.css',
  providers: [MessageService],
})
export class SubtypeSupport implements OnInit {
  role = '';
  isHod = false;
  canSeeAll = false;   // ADMIN / CEO_COO / OPERATIONS / FINANCE / CFO
  restricted = false;  // SUPERVISOR / EXECUTIVE / USER — no access
  hodDeptId: number | null = null;
  hodDeptName = '';

  departments: any[] = [];
  selectedDeptId: number | null = null;

  subTypes: any[] = [];
  employees: any[] = [];         // dept-scoped engineers
  configs: any[] = [];           // existing SubTypeSupportConfig rows
  assignments: Record<number, number | null> = {}; // subTypeId -> employeeId (editable)
  savingId: number | null = null;

  summaryRows: any[] = [];
  summaryTotals = { sourceCount: 0, targetCount: 0 };

  loading = false;

  constructor(
    private assetsService: Assets,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.role = ((typeof window !== 'undefined' && localStorage.getItem('role')) || '').toUpperCase();
    this.isHod = this.role === 'HOD';
    this.restricted = RESTRICTED_ROLES.includes(this.role);
    this.canSeeAll = !this.isHod && !this.restricted; // everyone else (incl. ADMIN set)

    const deptRaw = typeof window !== 'undefined' ? localStorage.getItem('departmentId') : null;
    this.hodDeptId = deptRaw && deptRaw !== 'null' ? Number(deptRaw) : null;

    if (this.restricted) return; // no data load for restricted roles

    this.assetsService.getSubTypes().subscribe({
      next: (s) => { setTimeout(() => { this.subTypes = s || []; this.cdr.markForCheck(); }); },
    });

    // Load departments (used for the picker, and to resolve the HOD's own name)
    this.assetsService.getDepartments().subscribe({
      next: (d) => {
        setTimeout(() => {
          this.departments = d || [];
          if (this.isHod) {
            this.selectedDeptId = this.hodDeptId;
            this.hodDeptName = this.departments.find((x: any) => x.id === this.hodDeptId)?.name || '';
            this.reload();
          }
          this.cdr.markForCheck();
        });
      },
    });
  }

  get effectiveDeptId(): number | null {
    return this.isHod ? this.hodDeptId : this.selectedDeptId;
  }

  onDeptChange() {
    this.reload();
  }

  reload() {
    const dept = this.effectiveDeptId;
    if (!dept) return;
    this.loading = true;

    // Engineers in this department
    this.assetsService.getEmployees().subscribe({
      next: (emps) => {
        setTimeout(() => {
          this.employees = (emps || []).filter((e: any) => Number(e.departmentId) === Number(dept));
          this.cdr.markForCheck();
        });
      },
    });

    // Existing config (backend scopes HOD to own dept regardless of param)
    this.assetsService.getSubTypeSupport(this.canSeeAll ? dept : undefined).subscribe({
      next: (rows) => {
        setTimeout(() => {
          this.configs = rows || [];
          this.assignments = {};
          for (const c of this.configs) this.assignments[c.assetSubTypeId] = c.employeeId;
          this.loading = false;
          this.cdr.markForCheck();
        });
      },
      error: () => { setTimeout(() => { this.loading = false; this.cdr.markForCheck(); }); },
    });

    // Count summary
    this.loadSummary();
  }

  loadSummary() {
    const dept = this.effectiveDeptId;
    this.assetsService.getSubTypeSummary(this.canSeeAll ? (dept ?? undefined) : undefined).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.summaryRows = res?.rows || [];
          this.summaryTotals = res?.totals || { sourceCount: 0, targetCount: 0 };
          this.cdr.markForCheck();
        });
      },
    });
  }

  saveAssignment(subType: any) {
    const employeeId = this.assignments[subType.id];
    if (!employeeId) { this.toast('warn', 'Select an engineer first'); return; }
    const dept = this.effectiveDeptId;
    if (!dept) { this.toast('warn', 'Select a department first'); return; }

    this.savingId = subType.id;
    const payload: any = { assetSubTypeId: subType.id, employeeId };
    if (this.canSeeAll) payload.departmentId = dept;

    this.assetsService.upsertSubTypeSupport(payload).subscribe({
      next: () => {
        setTimeout(() => {
          this.toast('success', `Engineer assigned for ${subType.name}`);
          this.savingId = null;
          this.reload();
        });
      },
      error: (err) => {
        setTimeout(() => { this.savingId = null; this.cdr.markForCheck(); });
        this.toast('error', err?.error?.message || 'Failed to save assignment');
      },
    });
  }

  clearAssignment(subType: any) {
    const config = this.configs.find((c) => c.assetSubTypeId === subType.id);
    if (!config) { this.assignments[subType.id] = null; return; }
    if (!confirm(`Remove the repair engineer configured for "${subType.name}"?`)) return;
    this.assetsService.deleteSubTypeSupport(config.id).subscribe({
      next: () => { setTimeout(() => { this.toast('success', 'Assignment removed'); this.reload(); }); },
      error: (err) => this.toast('error', err?.error?.message || 'Failed to remove assignment'),
    });
  }

  configuredEngineer(subTypeId: number): string {
    const c = this.configs.find((x) => x.assetSubTypeId === subTypeId);
    return c?.employee?.name || '';
  }

  private toast(severity: string, detail: string) {
    this.messageService.add({ severity, summary: severity.toUpperCase(), detail, life: 2500 });
  }
}
