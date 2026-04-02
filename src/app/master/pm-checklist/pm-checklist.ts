import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { SelectModule } from 'primeng/select';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { InputNumberModule } from 'primeng/inputnumber';
import { DatePickerModule } from 'primeng/datepicker';
import { CheckboxModule } from 'primeng/checkbox';
import { MessageService } from 'primeng/api';
import { PmChecklistService } from '../../services/pm-checklist/pm-checklist';
import { Assets } from '../../services/assets/assets';

@Component({
  selector: 'app-pm-checklist',
  standalone: true,
  imports: [
    CommonModule, FormsModule, ButtonModule, TableModule, TagModule,
    ToastModule, DialogModule, SelectModule, InputTextModule, TextareaModule,
    TooltipModule, InputNumberModule, DatePickerModule, CheckboxModule
  ],
  templateUrl: './pm-checklist.html',
  styleUrl: './pm-checklist.css',
  providers: [MessageService]
})
export class PmChecklist implements OnInit {
  activeTab: 'templates' | 'runs' = 'templates';

  // Templates
  templates: any[] = [];
  loadingTemplates = false;
  showTemplateDialog = false;
  savingTemplate = false;
  templateForm = this.emptyTemplateForm();

  // Runs
  runs: any[] = [];
  loadingRuns = false;
  selectedAssetForRuns: number | null = null;
  showRunDialog = false;
  savingRun = false;
  runForm = this.emptyRunForm();

  // Fill checklist
  showFillDialog = false;
  selectedRun: any = null;
  fillResults: { itemId: number; title: string; description: string; result: string; remarks: string }[] = [];
  submittingChecklist = false;
  viewOnly = false;

  // Dropdowns
  assetOptions: any[] = [];
  categoryOptions: any[] = [];
  templateOptions: any[] = [];

  resultOptions = [
    { label: 'PASS', value: 'PASS' },
    { label: 'FAIL', value: 'FAIL' },
    { label: 'N/A', value: 'NA' }
  ];

  constructor(
    private pmService: PmChecklistService,
    private assetsService: Assets,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadTemplates();
    this.loadAssetOptions();
    this.loadCategoryOptions();
  }

  // ── Data loading ──────────────────────────────────────────────────────────

  loadTemplates() {
    this.loadingTemplates = true;
    this.pmService.getTemplates().subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.templates = Array.isArray(res) ? res : (res?.data ?? []);
          this.templateOptions = this.templates.map((t: any) => ({
            label: t.name,
            value: t.id
          }));
          this.loadingTemplates = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => { this.loadingTemplates = false; this.cdr.detectChanges(); });
      }
    });
  }

  loadRuns(assetId: number) {
    this.loadingRuns = true;
    this.pmService.getRunsByAsset(assetId).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.runs = Array.isArray(res) ? res : (res?.data ?? []);
          this.loadingRuns = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => { this.loadingRuns = false; this.cdr.detectChanges(); });
      }
    });
  }

  loadAssetOptions() {
    this.assetsService.getAllAssets().subscribe({
      next: (data: any) => {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        this.assetOptions = list.map((a: any) => ({
          label: `${a.assetId} — ${a.assetName}`,
          value: a.id
        }));
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  loadCategoryOptions() {
    this.assetsService.getCategories().subscribe({
      next: (data: any) => {
        const list = Array.isArray(data) ? data : (data?.data ?? []);
        this.categoryOptions = list.map((c: any) => ({
          label: c.name,
          value: c.id
        }));
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  // ── Template CRUD ─────────────────────────────────────────────────────────

  emptyTemplateForm() {
    return {
      name: '',
      description: '',
      assetCategoryId: null as number | null,
      items: [] as { title: string; description: string; sortOrder: number; isRequired: boolean }[]
    };
  }

  openCreateTemplate() {
    this.templateForm = this.emptyTemplateForm();
    this.showTemplateDialog = true;
  }

  addItem() {
    this.templateForm.items.push({
      title: '',
      description: '',
      sortOrder: this.templateForm.items.length + 1,
      isRequired: true
    });
  }

  removeItem(i: number) {
    this.templateForm.items.splice(i, 1);
  }

  saveTemplate() {
    if (!this.templateForm.name.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Missing', detail: 'Template name is required' });
      return;
    }
    this.savingTemplate = true;

    const payload: any = {
      name: this.templateForm.name,
      description: this.templateForm.description
    };
    if (this.templateForm.assetCategoryId) {
      payload.assetCategoryId = this.templateForm.assetCategoryId;
    }

    this.pmService.createTemplate(payload).subscribe({
      next: (template: any) => {
        const templateId = template.id ?? template.data?.id;
        if (this.templateForm.items.length && templateId) {
          this.pmService.addItems(templateId, this.templateForm.items).subscribe({
            next: () => {
              this.finishTemplateSave();
            },
            error: () => {
              this.messageService.add({ severity: 'warn', summary: 'Partial', detail: 'Template created but items failed to save' });
              this.finishTemplateSave();
            }
          });
        } else {
          this.finishTemplateSave();
        }
      },
      error: () => {
        this.savingTemplate = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create template' });
        this.cdr.detectChanges();
      }
    });
  }

  private finishTemplateSave() {
    this.savingTemplate = false;
    this.showTemplateDialog = false;
    this.loadTemplates();
    this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Template created successfully' });
    this.cdr.detectChanges();
  }

  // ── Run CRUD ──────────────────────────────────────────────────────────────

  emptyRunForm() {
    return {
      assetId: null as number | null,
      templateId: null as number | null,
      scheduledDue: null as Date | null
    };
  }

  openCreateRun() {
    this.runForm = this.emptyRunForm();
    this.showRunDialog = true;
  }

  saveRun() {
    if (!this.runForm.assetId || !this.runForm.templateId) {
      this.messageService.add({ severity: 'warn', summary: 'Missing', detail: 'Asset and template are required' });
      return;
    }
    this.savingRun = true;
    const payload: any = {
      assetId: this.runForm.assetId,
      templateId: this.runForm.templateId
    };
    if (this.runForm.scheduledDue) {
      payload.scheduledDue = this.runForm.scheduledDue;
    }
    this.pmService.createRun(payload).subscribe({
      next: () => {
        this.savingRun = false;
        this.showRunDialog = false;
        if (this.selectedAssetForRuns) {
          this.loadRuns(this.selectedAssetForRuns);
        }
        this.messageService.add({ severity: 'success', summary: 'Created', detail: 'Checklist run created' });
        this.cdr.detectChanges();
      },
      error: () => {
        this.savingRun = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to create run' });
        this.cdr.detectChanges();
      }
    });
  }

  // ── Fill / View checklist ─────────────────────────────────────────────────

  openFillChecklist(run: any) {
    this.viewOnly = false;
    this.loadRunDetails(run);
  }

  openViewChecklist(run: any) {
    this.viewOnly = true;
    this.loadRunDetails(run);
  }

  private loadRunDetails(run: any) {
    this.selectedRun = run;
    this.pmService.getRunById(run.id).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.selectedRun = res.data ?? res;
          const items = this.selectedRun.template?.items ?? this.selectedRun.items ?? [];
          const existingResults = this.selectedRun.results ?? [];

          this.fillResults = items.map((item: any) => {
            const existing = existingResults.find((r: any) => r.itemId === item.id);
            return {
              itemId: item.id,
              title: item.title,
              description: item.description || '',
              result: existing?.result || 'PASS',
              remarks: existing?.remarks || ''
            };
          });
          this.showFillDialog = true;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to load run details' });
      }
    });
  }

  submitChecklist() {
    if (!this.selectedRun) return;
    this.submittingChecklist = true;
    const results = this.fillResults.map(r => ({
      itemId: r.itemId,
      result: r.result,
      remarks: r.remarks
    }));
    this.pmService.submitRun(this.selectedRun.id, results).subscribe({
      next: () => {
        this.submittingChecklist = false;
        this.showFillDialog = false;
        if (this.selectedAssetForRuns) {
          this.loadRuns(this.selectedAssetForRuns);
        }
        this.messageService.add({ severity: 'success', summary: 'Submitted', detail: 'Checklist submitted successfully' });
        this.cdr.detectChanges();
      },
      error: () => {
        this.submittingChecklist = false;
        this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to submit checklist' });
        this.cdr.detectChanges();
      }
    });
  }

  downloadPdf(runId: number) {
    window.open(this.pmService.getRunPdfUrl(runId), '_blank');
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  onAssetFilterChange() {
    if (this.selectedAssetForRuns) {
      this.loadRuns(this.selectedAssetForRuns);
    } else {
      this.runs = [];
    }
  }

  getStatusSeverity(status: string): 'success' | 'warn' | 'danger' | 'info' {
    switch (status) {
      case 'COMPLETED': return 'success';
      case 'DUE': return 'warn';
      case 'OVERDUE': return 'danger';
      default: return 'info';
    }
  }

  getResultSeverity(result: string): 'success' | 'danger' | 'info' {
    switch (result) {
      case 'PASS': return 'success';
      case 'FAIL': return 'danger';
      default: return 'info';
    }
  }
}
