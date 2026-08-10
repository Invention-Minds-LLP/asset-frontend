import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { TextareaModule } from 'primeng/textarea';
import { DatePickerModule } from 'primeng/datepicker';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { ElectricityLogService } from '../../services/electricity-log/electricity-log';
import { OverflowTooltipDirective } from '../../shared/directives/overflow-tooltip.directive';

@Component({
  selector: 'app-electricity-log',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, TableModule, ToastModule, InputTextModule, FloatLabelModule,
    SelectModule, TextareaModule, DatePickerModule, TooltipModule, OverflowTooltipDirective,
  ],
  templateUrl: './electricity-log.html',
  styleUrl: './electricity-log.css',
  providers: [MessageService],
})
export class ElectricityLog implements OnInit {
  rows: any[] = [];
  loading = false;
  showForm = false;
  editingId: number | null = null;
  form = this.getEmptyForm();

  constructor(
    private svc: ElectricityLogService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void { this.load(); }

  getEmptyForm() {
    return {
      month: '',
      floor: '',
      meterName: '',
      startDate: null as Date | null,
      startTime: '',
      openingReading: null as number | null,
      endDate: null as Date | null,
      endTime: '',
      closingReading: null as number | null,
      totalUnits: null as number | null,
      remarks: '',
    };
  }

  load() {
    this.loading = true;
    this.svc.getAll().subscribe({
      next: r => { setTimeout(() => { this.rows = r || []; this.loading = false; this.cdr.detectChanges(); }); },
      error: () => { setTimeout(() => { this.loading = false; this.cdr.detectChanges(); }); this.toast('error', 'Failed to load electricity meter log'); },
    });
  }

  save() {
    if (!this.form.month?.trim()) {
      this.toast('warn', 'Month is required');
      return;
    }
    const payload = { ...this.form, month: this.form.month.trim() };
    const obs = this.editingId ? this.svc.update(this.editingId, payload) : this.svc.create(payload);
    obs.subscribe({
      next: () => { setTimeout(() => { this.toast('success', this.editingId ? 'Updated' : 'Added'); this.reset(); this.load(); this.cdr.detectChanges(); }); },
      error: (err) => this.toast('error', err?.error?.message || 'Failed to save'),
    });
  }

  edit(row: any) {
    this.editingId = row.id;
    this.showForm = true;
    this.form = {
      month: row.month || '',
      floor: row.floor || '',
      meterName: row.meterName || '',
      startDate: row.startDate ? new Date(row.startDate) : null,
      startTime: row.startTime || '',
      openingReading: row.openingReading ?? null,
      endDate: row.endDate ? new Date(row.endDate) : null,
      endTime: row.endTime || '',
      closingReading: row.closingReading ?? null,
      totalUnits: row.totalUnits ?? null,
      remarks: row.remarks || '',
    };
  }

  delete(row: any) {
    if (!confirm(`Delete this electricity meter entry (${row.month})?`)) return;
    this.svc.delete(row.id).subscribe({
      next: () => { this.toast('success', 'Deleted'); this.load(); },
      error: (err) => this.toast('error', err?.error?.message || 'Failed to delete'),
    });
  }

  reset() { this.editingId = null; this.showForm = false; this.form = this.getEmptyForm(); }

  toast(severity: 'success' | 'error' | 'warn', detail: string) {
    this.messageService.add({ severity, summary: severity.toUpperCase(), detail });
  }
}
