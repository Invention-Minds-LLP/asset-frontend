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
import { RentalAssetRegisterService } from '../../services/rental-asset-register/rental-asset-register';
import { OverflowTooltipDirective } from '../../shared/directives/overflow-tooltip.directive';

@Component({
  selector: 'app-rental-asset-register',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    ButtonModule, TableModule, ToastModule, InputTextModule, FloatLabelModule,
    SelectModule, TextareaModule, DatePickerModule, TooltipModule, OverflowTooltipDirective,
  ],
  templateUrl: './rental-asset-register.html',
  styleUrl: './rental-asset-register.css',
  providers: [MessageService],
})
export class RentalAssetRegister implements OnInit {
  rows: any[] = [];
  loading = false;
  showForm = false;
  editingId: number | null = null;
  form = this.getEmptyForm();

  directionOptions = [
    { label: 'Inward', value: 'INWARD' },
    { label: 'Outward', value: 'OUTWARD' },
  ];

  returnableTypeOptions = [
    { label: 'Returnable', value: 'RETURNABLE' },
    { label: 'Replacement', value: 'REPLACEMENT' },
  ];

  constructor(
    private svc: RentalAssetRegisterService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void { this.load(); }

  getEmptyForm() {
    return {
      direction: null as string | null,
      entryDate: new Date() as Date | null,
      returnableType: null as string | null,
      vendorName: '',
      description: '',
      brand: '',
      serialOrTagNo: '',
      gatePassOrDcNo: '',
      quantity: 1 as number | null,
      returnDate: null as Date | null,
      handledBy: '',
      remarks: '',
    };
  }

  load() {
    this.loading = true;
    this.svc.getAll().subscribe({
      next: r => { setTimeout(() => { this.rows = r || []; this.loading = false; this.cdr.detectChanges(); }); },
      error: () => { setTimeout(() => { this.loading = false; this.cdr.detectChanges(); }); this.toast('error', 'Failed to load rental asset register'); },
    });
  }

  save() {
    if (!this.form.direction || !this.form.entryDate) {
      this.toast('warn', 'Direction and Date are required');
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
      direction: row.direction || null,
      entryDate: row.entryDate ? new Date(row.entryDate) : null,
      returnableType: row.returnableType || null,
      vendorName: row.vendorName || '',
      description: row.description || '',
      brand: row.brand || '',
      serialOrTagNo: row.serialOrTagNo || '',
      gatePassOrDcNo: row.gatePassOrDcNo || '',
      quantity: row.quantity ?? 1,
      returnDate: row.returnDate ? new Date(row.returnDate) : null,
      handledBy: row.handledBy || '',
      remarks: row.remarks || '',
    };
  }

  delete(row: any) {
    if (!confirm(`Delete this rental asset entry (${row.description || row.serialOrTagNo || row.id})?`)) return;
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
