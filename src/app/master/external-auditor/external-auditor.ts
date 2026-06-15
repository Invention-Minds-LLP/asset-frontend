import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { InputTextModule } from 'primeng/inputtext';
import { FloatLabelModule } from 'primeng/floatlabel';
import { SelectModule } from 'primeng/select';
import { TooltipModule } from 'primeng/tooltip';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { MessageService, ConfirmationService } from 'primeng/api';
import {
  ExternalAuditorService,
  ExternalAuditor as ExternalAuditorRecord,
} from '../../services/external-auditor/external-auditor';

interface AuditorFormState {
  email: string;
  name: string;
  organization: string;
  phone: string;
  status: 'ACTIVE' | 'INACTIVE';
}

@Component({
  selector: 'app-external-auditor',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ButtonModule,
    TableModule,
    TagModule,
    ToastModule,
    InputTextModule,
    FloatLabelModule,
    SelectModule,
    TooltipModule,
    ConfirmDialogModule,
  ],
  templateUrl: './external-auditor.html',
  styleUrl: './external-auditor.css',
  providers: [MessageService, ConfirmationService],
})
export class ExternalAuditor implements OnInit {
  auditors: ExternalAuditorRecord[] = [];
  loading = false;

  showForm = false;
  editingId: number | null = null;
  form: AuditorFormState = this.getEmptyForm();

  // Filter state
  statusFilter: 'ALL' | 'ACTIVE' | 'INACTIVE' = 'ACTIVE';
  searchTerm = '';

  statusFilterOptions = [
    { label: 'Active only', value: 'ACTIVE' },
    { label: 'Inactive only', value: 'INACTIVE' },
    { label: 'All', value: 'ALL' },
  ];

  constructor(
    private auditorService: ExternalAuditorService,
    private messageService: MessageService,
    private confirmationService: ConfirmationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    const filters: any = {};
    if (this.statusFilter !== 'ALL') filters.status = this.statusFilter;
    if (this.searchTerm.trim()) filters.search = this.searchTerm.trim();

    this.auditorService.list(filters).subscribe({
      next: (res) => {
        this.auditors = Array.isArray(res) ? res : [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.loading = false;
        this.messageService.add({
          severity: 'error',
          summary: 'Load failed',
          detail: err?.error?.message || 'Could not load external auditors',
        });
      },
    });
  }

  // ── Form lifecycle ──
  openAdd(): void {
    this.editingId = null;
    this.form = this.getEmptyForm();
    this.showForm = true;
  }

  openEdit(row: ExternalAuditorRecord): void {
    this.editingId = row.id;
    this.form = {
      email: row.email,
      name: row.name,
      organization: row.organization || '',
      phone: row.phone || '',
      status: row.status,
    };
    this.showForm = true;
  }

  resetForm(): void {
    this.editingId = null;
    this.form = this.getEmptyForm();
    this.showForm = false;
  }

  save(): void {
    const name = this.form.name.trim();
    const email = this.form.email.trim().toLowerCase();

    if (!name) {
      this.messageService.add({ severity: 'warn', summary: 'Name required', detail: 'Enter the auditor\'s name.' });
      return;
    }
    if (this.editingId === null && (!email || !email.includes('@'))) {
      this.messageService.add({ severity: 'warn', summary: 'Email required', detail: 'Enter a valid email address.' });
      return;
    }

    if (this.editingId !== null) {
      // Update — email cannot change. Send only mutable fields.
      this.auditorService
        .update(this.editingId, {
          name,
          organization: this.form.organization.trim() || null,
          phone: this.form.phone.trim() || null,
          status: this.form.status,
        })
        .subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Updated', detail: 'External auditor updated.' });
            this.resetForm();
            this.load();
          },
          error: (err) => this.handleSaveError(err),
        });
    } else {
      this.auditorService
        .create({
          email,
          name,
          organization: this.form.organization.trim() || undefined,
          phone: this.form.phone.trim() || undefined,
        })
        .subscribe({
          next: () => {
            this.messageService.add({ severity: 'success', summary: 'Created', detail: 'External auditor added.' });
            this.resetForm();
            this.load();
          },
          error: (err) => this.handleSaveError(err),
        });
    }
  }

  confirmDeactivate(row: ExternalAuditorRecord): void {
    this.confirmationService.confirm({
      header: 'Deactivate auditor',
      message: `Deactivate ${row.name} (${row.email})? They won't be able to log in to the mobile app, but their assignment on past audits is preserved.`,
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Deactivate',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => this.deactivate(row.id),
    });
  }

  private deactivate(id: number): void {
    this.auditorService.deactivate(id).subscribe({
      next: () => {
        this.messageService.add({ severity: 'success', summary: 'Deactivated', detail: 'Auditor deactivated.' });
        this.load();
      },
      error: (err) => {
        this.messageService.add({
          severity: 'error',
          summary: 'Failed',
          detail: err?.error?.message || 'Could not deactivate auditor',
        });
      },
    });
  }

  // ── helpers ──
  statusSeverity(status: string): 'success' | 'secondary' | 'info' {
    return status === 'ACTIVE' ? 'success' : 'secondary';
  }

  formatLastUsed(value: string | null | undefined): string {
    if (!value) return '—';
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
  }

  private handleSaveError(err: any): void {
    const status = err?.status;
    let detail = err?.error?.message || 'Save failed';
    if (status === 409) {
      detail = 'An external auditor with this email already exists.';
    }
    this.messageService.add({ severity: 'error', summary: 'Save failed', detail });
  }

  private getEmptyForm(): AuditorFormState {
    return {
      email: '',
      name: '',
      organization: '',
      phone: '',
      status: 'ACTIVE',
    };
  }
}
