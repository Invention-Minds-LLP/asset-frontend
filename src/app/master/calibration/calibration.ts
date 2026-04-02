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
import { TextareaModule } from 'primeng/textarea';
import { DialogModule } from 'primeng/dialog';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { CalibrationService } from '../../services/calibration/calibration';
import { Assets } from '../../services/assets/assets';
import { DatePicker } from "primeng/datepicker";

@Component({
  selector: 'app-calibration',
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
    SelectModule,
    TextareaModule,
    DialogModule,
    CheckboxModule,
    DatePicker,
    TooltipModule
],
  templateUrl: './calibration.html',
  styleUrl: './calibration.css',
  providers: [MessageService]
})
export class Calibration implements OnInit {
  schedules: any[] = [];
  dueCalibrations: any[] = [];
  templates: any[] = [];
  historyRows: any[] = [];
  assetOptions: { label: string; value: number }[] = [];
  categoryOptions: { label: string; value: number }[] = [];
  vendorOptions: { label: string; value: number }[] = [];

  loading = false;
  showScheduleForm = false;
  showTemplateForm = false;
  showHistoryForm = false;
  editingScheduleId: number | null = null;
  editingTemplateId: number | null = null;

  scheduleForm = this.getEmptyScheduleForm();
  templateForm = this.getEmptyTemplateForm();
  historyForm = this.getEmptyHistoryForm();

  unitOptions = [
    { label: 'Days', value: 'DAYS' },
    { label: 'Months', value: 'MONTHS' },
    { label: 'Years', value: 'YEARS' }
  ];

  resultOptions = [
    { label: 'Pass', value: 'PASS' },
    { label: 'Fail', value: 'FAIL' },
    { label: 'N/A', value: 'NA' }
  ];

  today: any = new Date();

  // ── Template Items ─────────────────────────────────────────────────────────
  showItemsDialog = false;
  selectedTemplate: any = null;
  templateItems: any[] = [];
  newItem = this.getEmptyItem();
  savingItem = false;

  // ── History tab ────────────────────────────────────────────────────────────
  historyAssetId: number | null = null;
  historyRecords: any[] = [];
  historyLoading = false;

  constructor(
    private calibrationService: CalibrationService,
    private assetsService: Assets,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSchedules();
    this.loadDue();
    this.loadTemplates();
    this.loadAssets();
    this.loadCategories();
    this.loadVendors();
  }

  getEmptyScheduleForm() {
    return { assetId: null as number | null, frequencyValue: 1, frequencyUnit: 'MONTHS', nextDueAt: '', vendorId: null as number | null, reminderDays: 7, notes: '', standardProcedure: '' };
  }

  getEmptyTemplateForm() {
    return { name: '', description: '', assetCategoryId: null as number | null, assetId: null as number | null, isActive: true };
  }

  getEmptyHistoryForm() {
    return { assetId: null as number | null, scheduleId: null as number | null, calibratedAt: '', result: 'PASS', calibratedByType: 'INTERNAL', calibratedByName: '', vendorId: null as number | null, certificateNo: '', remarks: '' };
  }

  getEmptyItem() {
    return { title: '', description: '', expectedValue: '', unit: '', isRequired: true, sortOrder: 0 };
  }

  loadSchedules() {
    this.loading = true;
    this.calibrationService.getAllSchedules().subscribe({
      next: (res) => { setTimeout(() => { this.schedules = res || []; this.loading = false; this.cdr.detectChanges(); }); },
      error: () => { setTimeout(() => { this.loading = false; this.cdr.detectChanges(); }); }
    });
  }

  loadDue() {
    this.calibrationService.getDueCalibrations(30).subscribe({
      next: (res) => { setTimeout(() => { this.dueCalibrations = res || []; this.cdr.detectChanges(); }); },
      error: () => {}
    });
  }

  loadTemplates() {
    this.calibrationService.getAllTemplates().subscribe({
      next: (res) => { setTimeout(() => { this.templates = res || []; this.cdr.detectChanges(); }); },
      error: () => {}
    });
  }

  loadAssets() {
    this.assetsService.getAllAssets().subscribe({
      next: (res: any[]) => { setTimeout(() => { this.assetOptions = res.map(a => ({ label: `${a.assetId} - ${a.assetName}`, value: a.id })); this.cdr.detectChanges(); }); },
      error: () => {}
    });
  }

  loadCategories() {
    this.assetsService.getCategories().subscribe({
      next: (res: any[]) => { setTimeout(() => { this.categoryOptions = res.map(c => ({ label: c.name, value: c.id })); this.cdr.detectChanges(); }); },
      error: () => {}
    });
  }

  loadVendors() {
    this.assetsService.getVendors().subscribe({
      next: (res: any[]) => { setTimeout(() => { this.vendorOptions = res.map(v => ({ label: v.name, value: v.id })); this.cdr.detectChanges(); }); },
      error: () => {}
    });
  }

  saveSchedule() {
    if (!this.scheduleForm.assetId || !this.scheduleForm.nextDueAt) {
      this.toast('warn', 'Asset and Next Due Date are required');
      return;
    }

    const payload = { ...this.scheduleForm, assetId: Number(this.scheduleForm.assetId) };

    if (this.editingScheduleId) {
      this.calibrationService.updateSchedule(this.editingScheduleId, payload).subscribe({
        next: () => { setTimeout(() => { this.toast('success', 'Schedule updated'); this.resetScheduleForm(); this.loadSchedules(); this.cdr.detectChanges(); }); },
        error: (err) => this.toast('error', err?.error?.message || 'Failed')
      });
    } else {
      this.calibrationService.createSchedule(payload).subscribe({
        next: () => { setTimeout(() => { this.toast('success', 'Schedule created'); this.resetScheduleForm(); this.loadSchedules(); this.loadDue(); this.cdr.detectChanges(); }); },
        error: (err) => this.toast('error', err?.error?.message || 'Failed')
      });
    }
  }

  editSchedule(row: any) {
    this.editingScheduleId = row.id;
    this.showScheduleForm = true;
    this.scheduleForm = {
      assetId: row.assetId, frequencyValue: row.frequencyValue, frequencyUnit: row.frequencyUnit,
      nextDueAt: row.nextDueAt ? row.nextDueAt.slice(0, 10) : '', vendorId: row.vendorId ?? null,
      reminderDays: row.reminderDays ?? 7, notes: row.notes || '', standardProcedure: row.standardProcedure || ''
    };
  }

  deleteSchedule(row: any) {
    if (!confirm('Delete this calibration schedule?')) return;
    this.calibrationService.deleteSchedule(row.id).subscribe({
      next: () => { setTimeout(() => { this.toast('success', 'Deleted'); this.loadSchedules(); this.cdr.detectChanges(); }); },
      error: () => this.toast('error', 'Failed to delete')
    });
  }

  resetScheduleForm() {
    this.editingScheduleId = null;
    this.showScheduleForm = false;
    this.scheduleForm = this.getEmptyScheduleForm();
  }

  saveTemplate() {
    if (!this.templateForm.name) { this.toast('warn', 'Name is required'); return; }
    const payload = { ...this.templateForm };
    if (this.editingTemplateId) {
      this.calibrationService.updateTemplate(this.editingTemplateId, payload).subscribe({
        next: () => { setTimeout(() => { this.toast('success', 'Template updated'); this.resetTemplateForm(); this.loadTemplates(); this.cdr.detectChanges(); }); },
        error: () => this.toast('error', 'Failed')
      });
    } else {
      this.calibrationService.createTemplate(payload).subscribe({
        next: () => { setTimeout(() => { this.toast('success', 'Template created'); this.resetTemplateForm(); this.loadTemplates(); this.cdr.detectChanges(); }); },
        error: () => this.toast('error', 'Failed')
      });
    }
  }

  editTemplate(row: any) {
    this.editingTemplateId = row.id;
    this.showTemplateForm = true;
    this.templateForm = { name: row.name, description: row.description || '', assetCategoryId: row.assetCategoryId ?? null, assetId: row.assetId ?? null, isActive: row.isActive };
  }

  deleteTemplate(row: any) {
    if (!confirm('Delete this template?')) return;
    this.calibrationService.deleteTemplate(row.id).subscribe({
      next: () => { setTimeout(() => { this.toast('success', 'Deleted'); this.loadTemplates(); this.cdr.detectChanges(); }); },
      error: () => this.toast('error', 'Failed')
    });
  }

  resetTemplateForm() {
    this.editingTemplateId = null;
    this.showTemplateForm = false;
    this.templateForm = this.getEmptyTemplateForm();
  }

  // ── Template Items ─────────────────────────────────────────────────────────
  openItemsDialog(template: any) {
    this.selectedTemplate = template;
    this.templateItems = template.items ? [...template.items] : [];
    this.newItem = this.getEmptyItem();
    this.showItemsDialog = true;
  }

  addItem() {
    if (!this.newItem.title.trim()) {
      this.toast('warn', 'Item title is required');
      return;
    }
    this.savingItem = true;
    this.calibrationService.addTemplateItems(this.selectedTemplate.id, [this.newItem]).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.savingItem = false;
          this.toast('success', 'Item added');
          // Refresh template items from the returned template
          const added = Array.isArray(res) ? res : (res.items || []);
          if (added.length) this.templateItems.push(...added);
          this.newItem = this.getEmptyItem();
          // also refresh templates list so count updates
          this.loadTemplates();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        setTimeout(() => {
          this.savingItem = false;
          this.toast('error', err?.error?.message || 'Failed to add item');
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ── History tab ────────────────────────────────────────────────────────────
  loadHistory() {
    if (!this.historyAssetId) {
      this.toast('warn', 'Select an asset to view history');
      return;
    }
    this.historyLoading = true;
    this.calibrationService.getHistoryByAsset(this.historyAssetId).subscribe({
      next: (res) => {
        setTimeout(() => {
          this.historyRecords = res || [];
          this.historyLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.historyLoading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  logHistory() {
    if (!this.historyForm.assetId) { this.toast('warn', 'Asset is required'); return; }
    const payload = { ...this.historyForm, assetId: Number(this.historyForm.assetId) };
    this.calibrationService.logHistory(payload).subscribe({
      next: () => {
        setTimeout(() => {
          this.toast('success', 'History logged');
          this.showHistoryForm = false;
          this.historyForm = this.getEmptyHistoryForm();
          this.loadSchedules();
          this.loadDue();
          // Refresh history tab if same asset
          if (this.historyAssetId === payload.assetId) this.loadHistory();
          this.cdr.detectChanges();
        });
      },
      error: (err) => this.toast('error', err?.error?.message || 'Failed')
    });
  }

  getResultSeverity(result: string): 'success' | 'danger' | 'secondary' {
    if (result === 'PASS') return 'success';
    if (result === 'FAIL') return 'danger';
    return 'secondary';
  }

  toast(severity: 'success' | 'error' | 'warn', detail: string) {
    this.messageService.add({ severity, summary: severity.toUpperCase(), detail });
  }
}
