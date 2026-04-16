import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { ToastModule } from 'primeng/toast';
import { TabViewModule } from 'primeng/tabview';
import { MessageService } from 'primeng/api';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment.prod';

@Component({
  selector: 'app-hierarchy-config',
  standalone: true,
  imports: [CommonModule, ButtonModule, TableModule, TagModule, ToastModule, TabViewModule],
  templateUrl: './hierarchy-config.html',
  styleUrl: './hierarchy-config.css',
  providers: [MessageService]
})
export class HierarchyConfig implements OnInit {
  private base = `${environment.apiUrl}/hierarchy-config`;

  slaAlerts: any[] = [];
  repeatTickets: any[] = [];
  escalationSummary: any = null;

  slaLoading = false;
  repeatLoading = false;
  escalationLoading = false;

  constructor(
    private http: HttpClient,
    private messageService: MessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadSlaAlerts();
    this.loadRepeatTickets();
    this.loadEscalationSummary();
  }

  loadSlaAlerts() {
    this.slaLoading = true;
    this.http.get<any>(`${this.base}/sla-breach-alerts`).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.slaAlerts = res.departments ?? [];
          this.slaLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => { this.slaLoading = false; this.cdr.detectChanges(); });
      }
    });
  }

  loadRepeatTickets() {
    this.repeatLoading = true;
    this.http.get<any>(`${this.base}/repeat-tickets`).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.repeatTickets = Array.isArray(res) ? res : (res.data ?? []);
          this.repeatLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => { this.repeatLoading = false; this.cdr.detectChanges(); });
      }
    });
  }

  loadEscalationSummary() {
    this.escalationLoading = true;
    this.http.get<any>(`${this.base}/escalation-summary`).subscribe({
      next: (res: any) => {
        setTimeout(() => {
          this.escalationSummary = res ?? null;
          this.escalationLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: () => {
        setTimeout(() => { this.escalationLoading = false; this.cdr.detectChanges(); });
      }
    });
  }

  refreshAll() {
    this.loadSlaAlerts();
    this.loadRepeatTickets();
    this.loadEscalationSummary();
  }

  getPrioritySeverity(p: string): 'danger' | 'warn' | 'info' | 'secondary' {
    if (p === 'CRITICAL') return 'danger';
    if (p === 'HIGH') return 'warn';
    if (p === 'MEDIUM') return 'info';
    return 'secondary';
  }

  formatDate(d: any): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
}
