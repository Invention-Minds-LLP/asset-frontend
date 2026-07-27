import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TrialService, TrialStatus } from '../../services/trial/trial';
import { Auth } from '../../services/auth/auth';

/**
 * Countdown strip shown to the demo user. Renders nothing at all when the
 * instance is not a demo (`trial: false`), so it is inert on a customer's system.
 */
@Component({
  selector: 'app-trial-banner',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="trial-banner" *ngIf="visible" [class.urgent]="urgent">
      <i class="pi pi-clock"></i>
      <span>
        <b>{{ status?.clientName }} demo</b> — {{ label }}
      </span>
    </div>
  `,
  styles: [`
    .trial-banner {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.5rem 1rem;
      background: #fef3c7;
      color: #92400e;
      font-size: 0.85rem;
      border-bottom: 1px solid #fde68a;
    }
    .trial-banner.urgent {
      background: #fee2e2;
      color: #991b1b;
      border-bottom-color: #fecaca;
    }
  `],
})
export class TrialBanner implements OnInit {
  status: TrialStatus | null = null;

  constructor(
    private svc: TrialService,
    private auth: Auth,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    if (!this.auth.isLoggedIn()) return;
    this.svc.status().subscribe({
      next: (res) => {
        this.status = res;
        // Zoneless app — nothing schedules a check for us after an HTTP callback.
        this.cdr.detectChanges();
      },
      error: () => {},
    });
  }

  get visible(): boolean {
    return !!this.status?.trial && !!this.status?.active;
  }

  get urgent(): boolean {
    return (this.status?.hoursLeft ?? 999) < 24;
  }

  get label(): string {
    const h = this.status?.hoursLeft ?? 0;
    if (h < 1) return 'expires within the hour';
    if (h < 48) return `expires in ${h} hour${h === 1 ? '' : 's'}`;
    return `expires in ${this.status?.daysLeft} days`;
  }
}
