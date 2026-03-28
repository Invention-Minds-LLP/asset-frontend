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
import { NotificationsService } from '../../services/notifications/notifications';

@Component({
  selector: 'app-notifications',
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
  templateUrl: './notifications.html',
  styleUrl: './notifications.css',
  providers: [MessageService]
})
export class Notifications implements OnInit {
  myNotifications: any[] = [];
  allNotifications: any[] = [];
  unreadCount = 0;
  loading = false;

  showCreateForm = false;
  createForm = this.getEmptyCreateForm();

  typeOptions = [
    { label: 'Warranty Expiry', value: 'WARRANTY_EXPIRY' },
    { label: 'Insurance Expiry', value: 'INSURANCE_EXPIRY' },
    { label: 'AMC/CMC Expiry', value: 'AMC_CMC_EXPIRY' },
    { label: 'Maintenance Due', value: 'MAINTENANCE_DUE' },
    { label: 'SLA Breach', value: 'SLA_BREACH' },
    { label: 'Low Stock', value: 'LOW_STOCK' },
    { label: 'Gate Pass Overdue', value: 'GATEPASS_OVERDUE' },
    { label: 'Other', value: 'OTHER' }
  ];

  priorityOptions = [
    { label: 'Low', value: 'LOW' },
    { label: 'Medium', value: 'MEDIUM' },
    { label: 'High', value: 'HIGH' },
    { label: 'Critical', value: 'CRITICAL' }
  ];

  constructor(
    private notificationsService: NotificationsService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadMyNotifications();
    this.loadAllNotifications();
    this.loadUnreadCount();
  }

  getEmptyCreateForm() {
    return { type: 'OTHER', title: '', message: '', priority: 'MEDIUM' };
  }

  loadMyNotifications() {
    this.loading = true;
    this.notificationsService.getMyNotifications().subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.myNotifications = res.data || [];
          this.unreadCount = res.unreadCount ?? 0;
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => { setTimeout(() => { this.loading = false; this.cdr.detectChanges(); }); }
    });
  }

  loadAllNotifications() {
    this.notificationsService.getAll().subscribe({
      next: (res) => { setTimeout(() => { this.allNotifications = res || []; this.cdr.detectChanges(); }); },
      error: () => {}
    });
  }

  loadUnreadCount() {
    this.notificationsService.getUnreadCount().subscribe({
      next: (res) => { setTimeout(() => { this.unreadCount = res.unreadCount; this.cdr.detectChanges(); }); },
      error: () => {}
    });
  }

  markAsRead(row: any) {
    this.notificationsService.markAsRead(row.notificationId).subscribe({
      next: () => { setTimeout(() => { this.loadMyNotifications(); this.loadUnreadCount(); this.cdr.detectChanges(); }); },
      error: () => this.toast('error', 'Failed to mark as read')
    });
  }

  markAllAsRead() {
    this.notificationsService.markAllAsRead().subscribe({
      next: () => { setTimeout(() => { this.toast('success', 'All marked as read'); this.loadMyNotifications(); this.loadUnreadCount(); this.cdr.detectChanges(); }); },
      error: () => this.toast('error', 'Failed')
    });
  }

  create() {
    if (!this.createForm.message || !this.createForm.type) {
      this.toast('warn', 'Type and message are required');
      return;
    }
    this.notificationsService.create(this.createForm).subscribe({
      next: () => {
        setTimeout(() => {
          this.toast('success', 'Notification created');
          this.showCreateForm = false;
          this.createForm = this.getEmptyCreateForm();
          this.loadAllNotifications();
          this.cdr.detectChanges();
        });
      },
      error: (err) => this.toast('error', err?.error?.message || 'Failed to create')
    });
  }

  delete(id: number) {
    if (!confirm('Delete this notification?')) return;
    this.notificationsService.delete(id).subscribe({
      next: () => { setTimeout(() => { this.toast('success', 'Deleted'); this.loadAllNotifications(); this.cdr.detectChanges(); }); },
      error: () => this.toast('error', 'Failed to delete')
    });
  }

  getPrioritySeverity(priority: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const map: Record<string, any> = {
      LOW: 'secondary',
      MEDIUM: 'info',
      HIGH: 'warn',
      CRITICAL: 'danger'
    };
    return map[priority] ?? 'secondary';
  }

  toast(severity: 'success' | 'error' | 'warn', detail: string) {
    this.messageService.add({ severity, summary: severity.toUpperCase(), detail });
  }
}
