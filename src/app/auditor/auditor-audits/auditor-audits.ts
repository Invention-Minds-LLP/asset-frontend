import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ExternalAuthService } from '../../services/external-auth/external-auth';
import { ExternalAuditService } from '../../services/external-audit/external-audit';

@Component({
  selector: 'app-auditor-audits',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './auditor-audits.html',
  styleUrl: './auditor-audits.css',
})
export class AuditorAudits implements OnInit {
  audits: any[] = [];
  loading = true;
  error = '';

  constructor(
    private auth: ExternalAuthService,
    private auditService: ExternalAuditService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.auditService.listMyAudits().subscribe({
      next: (res) => {
        this.audits = Array.isArray(res?.data) ? res.data : [];
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.loading = false;
        this.error = 'Could not load your audits. Please try again.';
        this.cdr.markForCheck();
      },
    });
  }

  openAudit(audit: any): void {
    this.router.navigate(['/auditor/audits', audit.id]);
  }

  auditorName(): string {
    return this.auth.getAuditor()?.name || 'Auditor';
  }

  auditorOrg(): string {
    return this.auth.getAuditor()?.organization || '';
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/auditor/login'], { replaceUrl: true });
  }

  statusClass(status: string): string {
    return 'st-' + (status || '').toLowerCase();
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      PLANNED: 'Planned',
      IN_PROGRESS: 'In progress',
      COMPLETED: 'Completed',
    };
    return map[(status || '').toUpperCase()] || status || '—';
  }

  formatDate(value: string | null | undefined): string {
    if (!value) return '—';
    const d = new Date(value);
    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString();
  }
}
