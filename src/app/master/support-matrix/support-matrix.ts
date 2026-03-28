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
import { MessageService } from 'primeng/api';
import { SupportMatrixService } from '../../services/support-matrix/support-matrix';
import { Assets } from '../../services/assets/assets';

@Component({
  selector: 'app-support-matrix',
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
    TextareaModule
  ],
  templateUrl: './support-matrix.html',
  styleUrl: './support-matrix.css',
  providers: [MessageService]
})
export class SupportMatrix implements OnInit {
  rows: any[] = [];
  loading = false;
  editingId: number | null = null;
  showForm = false;

  form = this.getEmptyForm();

  categoryOptions: { label: string; value: number }[] = [];
  employeeOptions: { label: string; value: number }[] = [];

  unitOptions = [
    { label: 'Minutes', value: 'MINUTES' },
    { label: 'Hours', value: 'HOURS' },
    { label: 'Days', value: 'DAYS' }
  ];

  constructor(
    private supportMatrixService: SupportMatrixService,
    private assetsService: Assets,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAll();
    this.loadCategories();
    this.loadEmployees();
  }

  getEmptyForm() {
    return {
      assetCategoryId: null as number | null,
      assetId: null as number | null,
      levelNo: 1,
      roleName: '',
      personName: '',
      employeeId: null as number | null,
      contactNumber: '',
      email: '',
      escalationTime: null as number | null,
      escalationUnit: 'HOURS',
      notes: ''
    };
  }

  loadAll() {
    this.loading = true;
    this.supportMatrixService.getAll().subscribe({
      next: (res) => { setTimeout(() => { this.rows = res || []; this.loading = false; this.cdr.detectChanges(); }); },
      error: () => { setTimeout(() => { this.loading = false; this.cdr.detectChanges(); }); }
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
    if (!this.form.levelNo || (!this.form.assetCategoryId && !this.form.assetId)) {
      this.toast('warn', 'Level and at least Asset Category or Asset are required');
      return;
    }

    const payload = { ...this.form };

    if (this.editingId) {
      this.supportMatrixService.update(this.editingId, payload).subscribe({
        next: () => { setTimeout(() => { this.toast('success', 'Entry updated'); this.reset(); this.loadAll(); this.cdr.detectChanges(); }); },
        error: (err) => this.toast('error', err?.error?.message || 'Failed')
      });
    } else {
      this.supportMatrixService.create(payload).subscribe({
        next: () => { setTimeout(() => { this.toast('success', 'Entry created'); this.reset(); this.loadAll(); this.cdr.detectChanges(); }); },
        error: (err) => this.toast('error', err?.error?.message || 'Failed')
      });
    }
  }

  edit(row: any) {
    this.editingId = row.id;
    this.showForm = true;
    this.form = {
      assetCategoryId: row.assetCategoryId ?? null,
      assetId: row.assetId ?? null,
      levelNo: row.levelNo,
      roleName: row.roleName || '',
      personName: row.personName || '',
      employeeId: row.employeeId ?? null,
      contactNumber: row.contactNumber || '',
      email: row.email || '',
      escalationTime: row.escalationTime ?? null,
      escalationUnit: row.escalationUnit || 'HOURS',
      notes: row.notes || ''
    };
  }

  delete(row: any) {
    if (!confirm('Delete this support matrix entry?')) return;
    this.supportMatrixService.delete(row.id).subscribe({
      next: () => { setTimeout(() => { this.toast('success', 'Deleted'); this.loadAll(); this.cdr.detectChanges(); }); },
      error: () => this.toast('error', 'Failed to delete')
    });
  }

  reset() {
    this.editingId = null;
    this.showForm = false;
    this.form = this.getEmptyForm();
  }

  toast(severity: 'success' | 'error' | 'warn', detail: string) {
    this.messageService.add({ severity, summary: severity.toUpperCase(), detail });
  }
}
