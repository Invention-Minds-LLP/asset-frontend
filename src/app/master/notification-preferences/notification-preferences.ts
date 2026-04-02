import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TabViewModule } from 'primeng/tabview';
import { InputTextModule } from 'primeng/inputtext';
import { ToggleButtonModule } from 'primeng/togglebutton';
import { TextareaModule } from 'primeng/textarea';
import { TooltipModule } from 'primeng/tooltip';
import { MessageService } from 'primeng/api';
import { NotificationsService } from '../../services/notifications/notifications';

@Component({
  selector: 'app-notification-preferences',
  standalone: true,
  imports: [CommonModule, FormsModule, ButtonModule, TableModule, ToastModule, TabViewModule,
    InputTextModule, ToggleButtonModule, TextareaModule, TooltipModule],
  templateUrl: './notification-preferences.html',
  styleUrl: './notification-preferences.css',
  providers: [MessageService]
})
export class NotificationPreferences implements OnInit {
  activeTab = 0;

  // User preferences
  preferences: any[] = [];
  prefsLoading = false;
  prefsSaving = false;

  // Email templates
  templates: any[] = [];
  templatesLoading = false;
  editingTemplate: any = null;
  templateSaving = false;

  // SMTP config
  smtp: any = { host: '', port: 587, user: '', password: '', fromName: '', fromEmail: '', isActive: true };
  smtpLoading = false;
  smtpSaving = false;

  // Default events list for prefs
  readonly eventList = [
    { event: 'WARRANTY_EXPIRY', label: 'Warranty Expiry' },
    { event: 'INSURANCE_EXPIRY', label: 'Insurance Expiry' },
    { event: 'CONTRACT_EXPIRY', label: 'Contract Expiry' },
    { event: 'SLA_BREACH', label: 'SLA Breach' },
    { event: 'TICKET_ASSIGNED', label: 'Ticket Assigned' },
    { event: 'TICKET_RESOLVED', label: 'Ticket Resolved' },
    { event: 'ASSET_TRANSFER', label: 'Asset Transfer' },
    { event: 'DEPRECIATION_RUN', label: 'Depreciation Run' }
  ];

  constructor(
    private notifService: NotificationsService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadPreferences();
  }

  onTabChange(event: any) {
    this.activeTab = event.index;
    if (event.index === 1 && !this.templates.length) this.loadTemplates();
    if (event.index === 2 && !this.smtp.host) this.loadSmtp();
  }

  // --- Preferences ---
loadPreferences() {
  this.prefsLoading = true;
  this.notifService.getMyPreferences().subscribe({
    next: (data: any) => {
      setTimeout(() => {
        this.preferences = [
          {
            eventCode: 'WARRANTY_EXPIRY',
            label: 'Warranty Expiry',
            emailEnabled: data?.channelEmail ?? false,
            smsEnabled: data?.channelSms ?? false,
            pushEnabled: data?.warrantyExpiry ?? true
          },
          {
            eventCode: 'INSURANCE_EXPIRY',
            label: 'Insurance Expiry',
            emailEnabled: data?.channelEmail ?? false,
            smsEnabled: data?.channelSms ?? false,
            pushEnabled: data?.insuranceExpiry ?? true
          },
          {
            eventCode: 'CONTRACT_EXPIRY',
            label: 'Contract Expiry',
            emailEnabled: data?.channelEmail ?? false,
            smsEnabled: data?.channelSms ?? false,
            pushEnabled: data?.amcCmcExpiry ?? true
          },
          {
            eventCode: 'SLA_BREACH',
            label: 'SLA Breach',
            emailEnabled: data?.channelEmail ?? false,
            smsEnabled: data?.channelSms ?? false,
            pushEnabled: data?.slaBreach ?? true
          },
          {
            eventCode: 'ASSET_TRANSFER',
            label: 'Asset Transfer',
            emailEnabled: data?.channelEmail ?? false,
            smsEnabled: data?.channelSms ?? false,
            pushEnabled: data?.assetTransfer ?? true
          },
          {
            eventCode: 'TICKET_UPDATES',
            label: 'Ticket Updates',
            emailEnabled: data?.channelEmail ?? false,
            smsEnabled: data?.channelSms ?? false,
            pushEnabled: data?.ticketUpdates ?? true
          },
          {
            eventCode: 'LOW_STOCK',
            label: 'Low Stock',
            emailEnabled: data?.channelEmail ?? false,
            smsEnabled: data?.channelSms ?? false,
            pushEnabled: data?.lowStock ?? true
          },
          {
            eventCode: 'MAINTENANCE_DUE',
            label: 'Maintenance Due',
            emailEnabled: data?.channelEmail ?? false,
            smsEnabled: data?.channelSms ?? false,
            pushEnabled: data?.maintenanceDue ?? true
          },
          {
            eventCode: 'GATEPASS_OVERDUE',
            label: 'Gatepass Overdue',
            emailEnabled: data?.channelEmail ?? false,
            smsEnabled: data?.channelSms ?? false,
            pushEnabled: data?.gatepassOverdue ?? true
          }
        ];

        this.prefsLoading = false;
        this.cdr.detectChanges();
      });
    },
    error: () => {
      setTimeout(() => {
        this.prefsLoading = false;
        this.preferences = this.eventList.map(e => ({
          eventCode: e.event,
          label: e.label,
          emailEnabled: false,
          smsEnabled: false,
          pushEnabled: true
        }));
        this.cdr.detectChanges();
      });
    }
  });
}

  savePreferences() {
    this.prefsSaving = true;
    this.notifService.updateMyPreferences(this.preferences).subscribe({
      next: () => {
        setTimeout(() => {
          this.prefsSaving = false;
          this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Preferences updated' });
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.prefsSaving = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save preferences' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  // --- Email Templates ---
  loadTemplates() {
    this.templatesLoading = true;
    this.notifService.getEmailTemplates().subscribe({
      next: (data) => {
        setTimeout(() => {
          this.templates = data || [];
          this.templatesLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => { this.templatesLoading = false; this.cdr.detectChanges(); });
      }
    });
  }

  editTemplate(tpl: any) {
    this.editingTemplate = { ...tpl };
    this.cdr.detectChanges();
  }

  saveTemplate() {
    if (!this.editingTemplate) return;
    this.templateSaving = true;
    this.notifService.upsertEmailTemplate(this.editingTemplate).subscribe({
      next: () => {
        setTimeout(() => {
          this.templateSaving = false;
          this.editingTemplate = null;
          this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'Email template updated' });
          this.loadTemplates();
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.templateSaving = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save template' });
          this.cdr.detectChanges();
        });
      }
    });
  }

  // --- SMTP ---
  loadSmtp() {
    this.smtpLoading = true;
    this.notifService.getSmtpConfig().subscribe({
      next: (data) => {
        setTimeout(() => {
          this.smtp = data || this.smtp;
          this.smtpLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => { this.smtpLoading = false; this.cdr.detectChanges(); });
      }
    });
  }

  saveSmtp() {
    this.smtpSaving = true;
    this.notifService.upsertSmtpConfig(this.smtp).subscribe({
      next: () => {
        setTimeout(() => {
          this.smtpSaving = false;
          this.messageService.add({ severity: 'success', summary: 'Saved', detail: 'SMTP configuration saved' });
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => {
          this.smtpSaving = false;
          this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Failed to save SMTP config' });
          this.cdr.detectChanges();
        });
      }
    });
  }
}
