import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { TagModule } from 'primeng/tag';
import { TableModule } from 'primeng/table';
import { ToastModule } from 'primeng/toast';
import { TabViewModule } from 'primeng/tabview';
import { MessageService } from 'primeng/api';
import { MasterService } from '../../services/master/master';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    ButtonModule,
    CardModule,
    TagModule,
    TableModule,
    ToastModule,
    TabViewModule
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
  providers: [MessageService]
})
export class Dashboard implements OnInit {
  loading = false;
  stats: any = {};
  ticketStatusBreakdown: any[] = [];
  assetsByCategory: any[] = [];
  recentTickets: any[] = [];
  recentAssets: any[] = [];
  expiryAlerts: any = {};
  expiryDays = 30;

  constructor(
    private masterService: MasterService,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadDashboard();
    this.loadExpiryAlerts();
  }

  loadDashboard() {
    this.loading = true;
    this.masterService.getDashboardStats().subscribe({
      next: (res) => {
        setTimeout(() => {
          this.stats = res.summary || {};
          this.ticketStatusBreakdown = res.ticketStatusBreakdown || [];
          this.assetsByCategory = res.assetsByCategory || [];
          this.recentTickets = res.recentTickets || [];
          this.recentAssets = res.recentAssets || [];
          this.loading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => { this.loading = false; this.cdr.detectChanges(); });
        this.toast('error', 'Failed to load dashboard');
      }
    });
  }

  loadExpiryAlerts() {
    this.masterService.getExpiryAlerts(this.expiryDays).subscribe({
      next: (res) => {
        setTimeout(() => { this.expiryAlerts = res; this.cdr.detectChanges(); });
      },
      error: () => this.toast('error', 'Failed to load expiry alerts')
    });
  }

  getSeverity(status: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const map: Record<string, 'success' | 'info' | 'warn' | 'danger'> = {
      OPEN: 'info',
      IN_PROGRESS: 'warn',
      RESOLVED: 'success',
      CLOSED: 'secondary' as any,
      TERMINATED: 'danger',
      ON_HOLD: 'warn'
    };
    return map[status] ?? 'secondary';
  }

  toast(severity: 'success' | 'error' | 'warn', detail: string) {
    this.messageService.add({ severity, summary: severity.toUpperCase(), detail });
  }
}
