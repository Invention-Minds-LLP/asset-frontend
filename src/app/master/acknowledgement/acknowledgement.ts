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
import { MessageService } from 'primeng/api';
import { AcknowledgementService } from '../../services/acknowledgement/acknowledgement';
import { Assets } from '../../services/assets/assets';

@Component({
  selector: 'app-acknowledgement',
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
    TextareaModule
  ],
  templateUrl: './acknowledgement.html',
  styleUrl: './acknowledgement.css',
  providers: [MessageService]
})
export class Acknowledgement implements OnInit {
  templates: any[] = [];
  pendingRuns: any[] = [];
  loading = false;
  editingTemplateId: number | null = null;
  showTemplateForm = false;
  showItemForm = false;
  selectedTemplateId: number | null = null;

  templateForm = this.getEmptyTemplateForm();
  itemsInput = '';

  // Submit ack run
  activeRun: any = null;
  submitForm: any = { acknowledgedBy: '', remarks: '', rows: [] };

  purposeOptions = [
    { label: 'Assignment', value: 'ASSIGNMENT' },
    { label: 'Transfer Return', value: 'TRANSFER_RETURN' },
    { label: 'Transfer Out', value: 'TRANSFER_OUT' },
    { label: 'Maintenance', value: 'MAINTENANCE' }
  ];

  categoryOptions: { label: string; value: number }[] = [];

  constructor(
    private ackService: AcknowledgementService,
    private assetsService: Assets,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadTemplates();
    this.loadPending();
    this.loadCategories();
  }

  getEmptyTemplateForm() {
    return { name: '', description: '', purpose: 'ASSIGNMENT', assetCategoryId: null as number | null, isActive: true };
  }

  loadTemplates() {
    this.loading = true;
    this.ackService.getAllTemplates().subscribe({
      next: (res) => { setTimeout(() => { this.templates = res || []; this.loading = false; this.cdr.detectChanges(); }); },
      error: () => { setTimeout(() => { this.loading = false; this.cdr.detectChanges(); }); }
    });
  }

  loadPending() {
    this.ackService.getMyPending().subscribe({
      next: (res) => { setTimeout(() => { this.pendingRuns = res || []; this.cdr.detectChanges(); }); },
      error: () => {}
    });
  }

  loadCategories() {
    this.assetsService.getCategories().subscribe({
      next: (res: any[]) => { setTimeout(() => { this.categoryOptions = res.map(c => ({ label: c.name, value: c.id })); this.cdr.detectChanges(); }); },
      error: () => {}
    });
  }

  saveTemplate() {
    if (!this.templateForm.name) { this.toast('warn', 'Name is required'); return; }
    const payload = { ...this.templateForm };

    if (this.editingTemplateId) {
      this.ackService.updateTemplate(this.editingTemplateId, payload).subscribe({
        next: () => { setTimeout(() => { this.toast('success', 'Template updated'); this.resetTemplateForm(); this.loadTemplates(); this.cdr.detectChanges(); }); },
        error: () => this.toast('error', 'Failed')
      });
    } else {
      this.ackService.createTemplate(payload).subscribe({
        next: () => { setTimeout(() => { this.toast('success', 'Template created'); this.resetTemplateForm(); this.loadTemplates(); this.cdr.detectChanges(); }); },
        error: () => this.toast('error', 'Failed')
      });
    }
  }

  editTemplate(row: any) {
    this.editingTemplateId = row.id;
    this.showTemplateForm = true;
    this.templateForm = {
      name: row.name,
      description: row.description || '',
      purpose: row.purpose,
      assetCategoryId: row.assetCategoryId ?? null,
      isActive: row.isActive
    };
  }

  deleteTemplate(row: any) {
    if (!confirm('Delete this template?')) return;
    this.ackService.deleteTemplate(row.id).subscribe({
      next: () => { setTimeout(() => { this.toast('success', 'Deleted'); this.loadTemplates(); this.cdr.detectChanges(); }); },
      error: () => this.toast('error', 'Failed')
    });
  }

  resetTemplateForm() {
    this.editingTemplateId = null;
    this.showTemplateForm = false;
    this.templateForm = this.getEmptyTemplateForm();
  }

  openAddItems(templateId: number) {
    this.selectedTemplateId = templateId;
    this.itemsInput = '';
    this.showItemForm = true;
  }

  saveItems() {
    if (!this.itemsInput.trim() || !this.selectedTemplateId) return;
    const lines = this.itemsInput.split('\n').filter(l => l.trim());
    const items = lines.map((l, idx) => ({ title: l.trim(), sortOrder: idx }));
    this.ackService.addItems(this.selectedTemplateId!, items).subscribe({
      next: () => { setTimeout(() => { this.toast('success', `${items.length} item(s) added`); this.showItemForm = false; this.loadTemplates(); this.cdr.detectChanges(); }); },
      error: () => this.toast('error', 'Failed to add items')
    });
  }

  // Submit a pending ack run
  openRun(run: any) {
    this.activeRun = run;
    this.submitForm = {
      acknowledgedBy: '',
      remarks: '',
      rows: (run.rows || []).map((r: any) => ({ itemId: r.itemId, checked: false, remarks: '' }))
    };
  }

  submitRun() {
    if (!this.activeRun) return;
    this.ackService.submitRun(this.activeRun.id, this.submitForm).subscribe({
      next: () => {
        setTimeout(() => {
          this.toast('success', 'Acknowledgement submitted');
          this.activeRun = null;
          this.loadPending();
          this.cdr.detectChanges();
        });
      },
      error: (err) => this.toast('error', err?.error?.message || 'Failed')
    });
  }

  toast(severity: 'success' | 'error' | 'warn', detail: string) {
    this.messageService.add({ severity, summary: severity.toUpperCase(), detail });
  }
}
