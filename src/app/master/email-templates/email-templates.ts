import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { DialogModule } from 'primeng/dialog';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { TextareaModule } from 'primeng/textarea';
import { InputSwitchModule } from 'primeng/inputswitch';
import { SelectModule } from 'primeng/select';
import { MessageService } from 'primeng/api';
import { NotificationsService } from '../../services/notifications/notifications';

@Component({
  selector: 'app-email-templates',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, TagModule, ToastModule, DialogModule, InputTextModule, TooltipModule, TextareaModule, InputSwitchModule, SelectModule],
  templateUrl: './email-templates.html',
  styleUrl: './email-templates.css',
  providers: [MessageService]
})
export class EmailTemplates implements OnInit {
  templates: any[] = [];
  loading = false;
  saving = false;

  showEditDialog = false;
  selectedTemplate: any = null;
  editForm = { code: '', name: '', subject: '', bodyHtml: '', bodyText: '', isActive: true };

  showPreviewDialog = false;
  previewHtml = '';

  seedingTemplates = false;

  // Send Email dialog
  showSendDialog = false;
  sendingEmail = false;
  sendForm: any = this.emptySendForm();

  readonly placeholderHint = 'Available placeholders: <code>{{name}}</code>, <code>{{title}}</code>, <code>{{message}}</code>, <code>{{assetName}}</code>, <code>{{ticketId}}</code>, <code>{{department}}</code>, <code>{{date}}</code>, <code>{{dueDate}}</code>, <code>{{assignedTo}}</code>, <code>{{priority}}</code>, <code>{{status}}</code>, <code>{{amount}}</code>';

  readonly sampleData: Record<string, string> = {
    name: 'John Doe',
    title: 'Sample Title',
    message: 'This is a test notification',
    assetName: 'MRI Machine',
    assetId: 'AST-2526-042',
    ticketId: 'TKT-2526-001',
    department: 'Radiology',
    location: 'Building A, Floor 3',
    date: '30 Mar 2026',
    dueDate: '15 Apr 2026',
    assignedTo: 'Jane Smith',
    priority: 'High',
    status: 'Open',
    warrantyEnd: '31 Dec 2026',
    contractName: 'AMC Premium',
    vendorName: 'MedTech Solutions',
    amount: '12,500.00',
    appUrl: 'https://app.smartassets.in'
  };

  constructor(
    private notificationsService: NotificationsService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadTemplates();
  }

  loadTemplates() {
    this.loading = true;
    this.notificationsService.getEmailTemplates().subscribe({
      next: (data) => {
        setTimeout(() => {
          this.templates = data || [];
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.loading = false;
          this.cdr.detectChanges();
        });
      }
    });
  }

  openEdit(template?: any) {
    if (template) {
      this.selectedTemplate = template;
      this.editForm = {
        code: template.code,
        name: template.name || '',
        subject: template.subject || '',
        bodyHtml: template.bodyHtml || '',
        bodyText: template.bodyText || '',
        isActive: template.isActive ?? true
      };
    } else {
      this.selectedTemplate = null;
      this.editForm = { code: '', name: '', subject: '', bodyHtml: '', bodyText: '', isActive: true };
    }
    this.showEditDialog = true;
    this.cdr.detectChanges();
  }

  saveTemplate() {
    if (!this.editForm.code || !this.editForm.name || !this.editForm.subject) {
      this.messageService.add({ severity: 'warn', summary: 'Validation', detail: 'Code, Name, and Subject are required' });
      return;
    }
    this.saving = true;
    this.notificationsService.upsertEmailTemplate(this.editForm).subscribe({
      next: () => {
        setTimeout(() => {
          this.saving = false;
          this.showEditDialog = false;
          this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Email template saved successfully' });
          this.loadTemplates();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.saving = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save email template' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  toggleActive(template: any) {
    const payload = { ...template, isActive: !template.isActive };
    this.notificationsService.upsertEmailTemplate(payload).subscribe({
      next: () => {
        setTimeout(() => {
          template.isActive = !template.isActive;
          this.messageService.add({ severity: 'success', summary: 'Updated', detail: `Template ${template.isActive ? 'activated' : 'deactivated'}` });
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to update template status' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  previewTemplate(template: any) {
    let html = template.bodyHtml || template.bodyText || '<p>No template body defined.</p>';
    html = this.replacePlaceholders(html);
    this.previewHtml = html;
    this.showPreviewDialog = true;
    this.cdr.detectChanges();
  }

  private replacePlaceholders(text: string): string {
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return this.sampleData[key] || match;
    });
  }

  highlightPlaceholders(text: string): string {
    if (!text) return '';
    return text.replace(/\{\{(\w+)\}\}/g, '<span class="placeholder-tag">{{\$1}}</span>');
  }

  seedDefaults() {
    this.seedingTemplates = true;
    this.notificationsService.seedEmailTemplates().subscribe({
      next: () => {
        setTimeout(() => {
          this.seedingTemplates = false;
          this.messageService.add({ severity: 'success', summary: 'Seeded', detail: 'Default email templates created' });
          this.loadTemplates();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.seedingTemplates = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to seed default templates' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  // ── Send Email ──

  emptySendForm() {
    return {
      toEmails: '',        // comma-separated emails
      ccEmails: '',        // comma-separated CC
      bccEmails: '',       // comma-separated BCC
      templateCode: null as string | null,
      subject: '',
      body: '',
      useTemplate: true,
    };
  }

  get templateOptions() {
    return this.templates.filter(t => t.isActive).map(t => ({ label: `${t.code} — ${t.name}`, value: t.code }));
  }

  openSendEmail(template?: any) {
    this.sendForm = this.emptySendForm();
    if (template) {
      this.sendForm.templateCode = template.code;
      this.sendForm.subject = template.subject;
      this.sendForm.body = template.bodyHtml;
      this.sendForm.useTemplate = true;
    }
    this.showSendDialog = true;
  }

  onTemplateSelect() {
    if (this.sendForm.templateCode) {
      const t = this.templates.find(tpl => tpl.code === this.sendForm.templateCode);
      if (t) {
        this.sendForm.subject = t.subject;
        this.sendForm.body = t.bodyHtml;
      }
    }
  }

  submitSendEmail() {
    if (!this.sendForm.toEmails?.trim()) {
      this.messageService.add({ severity: 'warn', summary: 'Missing', detail: 'At least one recipient email is required' });
      return;
    }

    const parseEmails = (str: string): string[] =>
      str.split(/[,;\s]+/).map(e => e.trim()).filter(e => e.includes('@'));

    const payload: any = {
      to: parseEmails(this.sendForm.toEmails),
    };
    if (this.sendForm.ccEmails?.trim()) payload.cc = parseEmails(this.sendForm.ccEmails);
    if (this.sendForm.bccEmails?.trim()) payload.bcc = parseEmails(this.sendForm.bccEmails);

    if (this.sendForm.useTemplate && this.sendForm.templateCode) {
      payload.templateCode = this.sendForm.templateCode;
      payload.templateData = this.sampleData; // use sample data for manual sends
    }
    if (this.sendForm.subject) payload.subject = this.sendForm.subject;
    if (this.sendForm.body) payload.body = this.sendForm.body;

    this.sendingEmail = true;
    this.notificationsService.sendManualEmail(payload).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.sendingEmail = false;
          this.showSendDialog = false;
          this.messageService.add({ severity: 'success', summary: 'Sent', detail: `Email sent to ${res.sentTo} recipient(s)${res.cc ? ', CC: ' + res.cc : ''}${res.bcc ? ', BCC: ' + res.bcc : ''}` });
          this.cdr.detectChanges();
        });
      },
      error: (err: any) => {
        setTimeout(() => {
          this.sendingEmail = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: err?.error?.message || 'Failed to send email' });
          this.cdr.detectChanges();
        });
      }
    });
  }
}
