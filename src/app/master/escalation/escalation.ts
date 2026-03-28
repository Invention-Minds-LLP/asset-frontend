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
import { MessageService } from 'primeng/api';
import { EscalationService } from '../../services/escalation/escalation';
import { Assets } from '../../services/assets/assets';

@Component({
  selector: 'app-escalation',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    ToastModule,
    TabViewModule,
    InputTextModule,
    FloatLabelModule,
    SelectModule
  ],
  templateUrl: './escalation.html',
  styleUrl: './escalation.css',
  providers: [MessageService]
})
export class Escalation implements OnInit {
  rules: any[] = [];
  loading = false;
  editingId: number | null = null;
  showForm = false;

  form = this.getEmptyForm();

  priorityOptions = [
    { label: 'Low', value: 'LOW' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'High', value: 'HIGH' },
    { label: 'Critical', value: 'CRITICAL' }
  ];

  unitOptions = [
    { label: 'Minutes', value: 'MINUTES' },
    { label: 'Hours', value: 'HOURS' }
  ];

  departmentOptions: { label: string; value: number }[] = [];
  categoryOptions: { label: string; value: number }[] = [];
  employeeOptions: { label: string; value: number }[] = [];

  constructor(
    private escalationService: EscalationService,
    private assetsService: Assets,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadRules();
    this.loadDepartments();
    this.loadCategories();
    this.loadEmployees();
  }

  getEmptyForm() {
    return {
      departmentId: null as number | null,
      assetCategoryId: null as number | null,
      priority: 'MEDIUM',
      level: 1,
      escalateAfterValue: 4,
      escalateAfterUnit: 'HOURS',
      notifyRole: '',
      notifyEmployeeId: null as number | null
    };
  }

  loadRules() {
    this.loading = true;
    this.escalationService.getAllRules().subscribe({
      next: (res) => { setTimeout(() => { this.rules = res || []; this.loading = false; this.cdr.detectChanges(); }); },
      error: () => { setTimeout(() => { this.loading = false; this.cdr.detectChanges(); }); }
    });
  }

  loadDepartments() {
    this.assetsService.getDepartments().subscribe({
      next: (res: any[]) => { setTimeout(() => { this.departmentOptions = res.map(d => ({ label: d.name, value: d.id })); this.cdr.detectChanges(); }); },
      error: () => {}
    });
  }

  loadCategories() {
    this.assetsService.getCategories().subscribe({
      next: (res: any[]) => { setTimeout(() => { this.categoryOptions = res.map(c => ({ label: c.name, value: c.id })); this.cdr.detectChanges(); }); },
      error: () => {}
    });
  }

  loadEmployees() {
    this.assetsService.getEmployees().subscribe({
      next: (res: any[]) => { setTimeout(() => { this.employeeOptions = res.map(e => ({ label: `${e.name} (${e.employeeID})`, value: e.id })); this.cdr.detectChanges(); }); },
      error: () => {}
    });
  }

  save() {
    if (!this.form.priority || !this.form.escalateAfterValue || !this.form.escalateAfterUnit) {
      this.toast('warn', 'Priority, escalation value and unit are required');
      return;
    }

    const payload = { ...this.form };

    if (this.editingId) {
      this.escalationService.updateRule(this.editingId, payload).subscribe({
        next: () => { setTimeout(() => { this.toast('success', 'Rule updated'); this.reset(); this.loadRules(); this.cdr.detectChanges(); }); },
        error: (err) => this.toast('error', err?.error?.message || 'Failed')
      });
    } else {
      this.escalationService.createRule(payload).subscribe({
        next: () => { setTimeout(() => { this.toast('success', 'Rule created'); this.reset(); this.loadRules(); this.cdr.detectChanges(); }); },
        error: (err) => this.toast('error', err?.error?.message || 'Failed')
      });
    }
  }

  edit(row: any) {
    this.editingId = row.id;
    this.showForm = true;
    this.form = {
      departmentId: row.departmentId ?? null,
      assetCategoryId: row.assetCategoryId ?? null,
      priority: row.priority,
      level: row.level,
      escalateAfterValue: row.escalateAfterValue,
      escalateAfterUnit: row.escalateAfterUnit,
      notifyRole: row.notifyRole || '',
      notifyEmployeeId: row.notifyEmployeeId ?? null
    };
  }

  delete(row: any) {
    if (!confirm('Delete this escalation rule?')) return;
    this.escalationService.deleteRule(row.id).subscribe({
      next: () => { setTimeout(() => { this.toast('success', 'Deleted'); this.loadRules(); this.cdr.detectChanges(); }); },
      error: () => this.toast('error', 'Failed to delete')
    });
  }

  runAutoEscalation() {
    this.escalationService.checkAndEscalate().subscribe({
      next: (res) => { setTimeout(() => { this.toast('success', `Auto-escalated ${res.escalated} ticket(s)`); this.cdr.detectChanges(); }); },
      error: () => this.toast('error', 'Failed to run auto-escalation')
    });
  }

  reset() {
    this.editingId = null;
    this.showForm = false;
    this.form = this.getEmptyForm();
  }

  getPrioritySeverity(priority: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const map: Record<string, any> = { LOW: 'secondary', MEDIUM: 'info', HIGH: 'warn', CRITICAL: 'danger' };
    return map[priority] ?? 'secondary';
  }

  toast(severity: 'success' | 'error' | 'warn', detail: string) {
    this.messageService.add({ severity, summary: severity.toUpperCase(), detail });
  }
}
