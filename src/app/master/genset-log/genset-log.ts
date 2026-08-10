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
import { GensetLogService } from '../../services/genset-log/genset-log';

@Component({
  selector: 'app-genset-log',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, TableModule, ToastModule, InputTextModule, FloatLabelModule,
    SelectModule, TextareaModule, DatePickerModule, TooltipModule,
  ],
  templateUrl: './genset-log.html',
  styleUrl: './genset-log.css',
  providers: [MessageService],
})
export class GensetLog implements OnInit {
  rows: any[] = [];
  loading = false;
  showForm = false;
  editingId: number | null = null;
  form = this.getEmptyForm();

  constructor(
    private svc: GensetLogService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void { this.load(); }

  getEmptyForm() {
    return {
      logDate: new Date() as Date | null,
      genSetOnTime: '',
      genSetOffTime: '',
      openingMeterReading: null as number | null,
      closingMeterReading: null as number | null,
      totalHoursRun: null as number | null,
      dieselOpeningStock: null as number | null,
      dieselPurchasedBillNo: '',
      litersPurchased: null as number | null,
      dieselClosingStock: null as number | null,
      consumptionLiters: null as number | null,
      authorisedBy: '',
      remarks: '',
    };
  }

  load() {
    this.loading = true;
    this.svc.getAll().subscribe({
      next: r => { setTimeout(() => { this.rows = r || []; this.loading = false; this.cdr.detectChanges(); }); },
      error: () => { setTimeout(() => { this.loading = false; this.cdr.detectChanges(); }); this.toast('error', 'Failed to load genset logs'); },
    });
  }

  save() {
    if (!this.form.logDate) {
      this.toast('warn', 'Date is required');
      return;
    }
    const payload = { ...this.form };
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
      logDate: row.logDate ? new Date(row.logDate) : null,
      genSetOnTime: row.genSetOnTime || '',
      genSetOffTime: row.genSetOffTime || '',
      openingMeterReading: row.openingMeterReading ?? null,
      closingMeterReading: row.closingMeterReading ?? null,
      totalHoursRun: row.totalHoursRun ?? null,
      dieselOpeningStock: row.dieselOpeningStock ?? null,
      dieselPurchasedBillNo: row.dieselPurchasedBillNo || '',
      litersPurchased: row.litersPurchased ?? null,
      dieselClosingStock: row.dieselClosingStock ?? null,
      consumptionLiters: row.consumptionLiters ?? null,
      authorisedBy: row.authorisedBy || '',
      remarks: row.remarks || '',
    };
  }

  delete(row: any) {
    if (!confirm(`Delete this genset log (${row.logDate ? new Date(row.logDate).toLocaleDateString() : ''})?`)) return;
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
