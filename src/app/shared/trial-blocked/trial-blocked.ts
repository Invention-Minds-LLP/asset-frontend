import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';

/**
 * Terminal screen for a demo that has ended. The interceptor parks the reason
 * here before navigating, because the 403 that triggered it is not repeatable —
 * once the session is cleared there is no authenticated call left to re-ask with.
 */
@Component({
  selector: 'app-trial-blocked',
  standalone: true,
  imports: [CommonModule, ButtonModule],
  templateUrl: './trial-blocked.html',
  styleUrl: './trial-blocked.css',
})
export class TrialBlocked {
  static readonly STORE_KEY = 'trialBlockedMessage';

  message =
    (typeof window !== 'undefined' && sessionStorage.getItem(TrialBlocked.STORE_KEY)) ||
    'Your demo period has ended. Please contact Invention Minds to continue.';

  constructor(private router: Router) {}

  backToLogin() {
    if (typeof window !== 'undefined') sessionStorage.removeItem(TrialBlocked.STORE_KEY);
    this.router.navigate(['/login']);
  }
}
