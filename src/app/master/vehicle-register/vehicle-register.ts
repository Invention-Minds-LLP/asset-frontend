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
import { VehicleRegisterService } from '../../services/vehicle-register/vehicle-register';
import { OverflowTooltipDirective } from '../../shared/directives/overflow-tooltip.directive';

@Component({
  selector: 'app-vehicle-register',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, TableModule, ToastModule, InputTextModule, FloatLabelModule,
    SelectModule, TextareaModule, DatePickerModule, TooltipModule, OverflowTooltipDirective,
  ],
  templateUrl: './vehicle-register.html',
  styleUrl: './vehicle-register.css',
  providers: [MessageService],
})
export class VehicleRegister implements OnInit {
  rows: any[] = [];
  loading = false;
  showForm = false;
  editingId: number | null = null;
  form = this.getEmptyForm();

  vehicleTypeOptions = [
    { label: 'Two Wheeler', value: 'TWO_WHEELER' },
    { label: 'Four Wheeler', value: 'FOUR_WHEELER' },
    { label: 'Company Vehicle', value: 'COMPANY_VEHICLE' },
    { label: 'Outside Vehicle', value: 'OUTSIDE_VEHICLE' },
  ];

  constructor(
    private svc: VehicleRegisterService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void { this.load(); }

  getEmptyForm() {
    return {
      entryDate: new Date() as Date | null,
      employeeName: '',
      contactNo: '',
      vehicleType: null as string | null,
      vehicleRegnNo: '',
      inTime: '',
      outTime: '',
      purpose: '',
      remarks: '',
    };
  }

  load() {
    this.loading = true;
    this.svc.getAll().subscribe({
      next: r => { setTimeout(() => { this.rows = r || []; this.loading = false; this.cdr.detectChanges(); }); },
      error: () => { setTimeout(() => { this.loading = false; this.cdr.detectChanges(); }); this.toast('error', 'Failed to load vehicle register'); },
    });
  }

  save() {
    if (!this.form.entryDate || !this.form.vehicleRegnNo?.trim()) {
      this.toast('warn', 'Date and Vehicle Regn No are required');
      return;
    }
    const payload = { ...this.form, vehicleRegnNo: this.form.vehicleRegnNo.trim() };
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
      entryDate: row.entryDate ? new Date(row.entryDate) : null,
      employeeName: row.employeeName || '',
      contactNo: row.contactNo || '',
      vehicleType: row.vehicleType || null,
      vehicleRegnNo: row.vehicleRegnNo || '',
      inTime: row.inTime || '',
      outTime: row.outTime || '',
      purpose: row.purpose || '',
      remarks: row.remarks || '',
    };
  }

  delete(row: any) {
    if (!confirm(`Delete this vehicle entry (${row.vehicleRegnNo})?`)) return;
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
