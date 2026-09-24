import { ChangeDetectorRef, Component, OnDestroy, signal } from '@angular/core';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { CommonModule } from '@angular/common';
import { CarouselModule } from 'primeng/carousel';
import { Auth } from '../services/auth/auth';
import { FormsModule, NgForm, NgModel } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { MessageService } from 'primeng/api';

/**
 * One scene of the showcase animation. The eight of them are the asset
 * lifecycle end to end — raised, bought, tagged, run, audited, valued, retired
 * — closing on the act that is the point of keeping all of it: the planning
 * the other seven make possible.
 */
interface LifecycleStage {
  key: string;
  /** PrimeIcon for the rail node. */
  icon: string;
  /** Short rail label; must stay short — eight of them share the panel width. */
  step: string;
  /** Caption headline for the scene. */
  title: string;
  /** What the scene means for whoever is signing in. */
  line: string;
}

/**
 * Scene order is the lifecycle order, and the CSS timing is derived from the
 * count: a scene owns 6s, so the loop is stages.length * 6s. Adding a stage
 * here alone will NOT retime the animation — the 48s cycle and the per-scene
 * delays in login.css have to move with it.
 */
const LIFECYCLE: LifecycleStage[] = [
  {
    key: 'request',
    icon: 'pi-file-edit',
    step: 'Request',
    title: 'A need is raised — and answered the same day',
    line: 'Indent to department head to finance to CFO, every approval time-stamped and nothing waiting in an inbox.',
  },
  {
    key: 'procure',
    icon: 'pi-truck',
    step: 'Procure',
    title: 'Ordered, delivered, matched',
    line: 'Purchase order, goods receipt and invoice reconciled at the gate — before the asset is even tagged.',
  },
  {
    key: 'tag',
    icon: 'pi-qrcode',
    step: 'Tag',
    title: 'Tagged once, findable forever',
    line: 'A QR code binds owner, cost centre, floor and warranty to the asset on day one, so nothing goes untraceable.',
  },
  {
    key: 'operate',
    icon: 'pi-cog',
    step: 'Operate',
    title: 'Kept running, not merely recorded',
    line: 'Preventive schedules, work orders, calibration and AMC cover — so a breakdown never becomes an unplanned budget line.',
  },
  {
    key: 'audit',
    icon: 'pi-search',
    step: 'Audit',
    title: 'A physical count that matches the books',
    line: 'Scan-based audits, variance flags and a trail an external auditor can sign without a week of spreadsheets.',
  },
  {
    key: 'value',
    icon: 'pi-indian-rupee',
    step: 'Value',
    title: 'Every rupee of value, tracked to the books',
    line: 'Depreciation runs, the fixed-asset schedule and a financial year that closes on evidence, not estimates.',
  },
  {
    key: 'retire',
    icon: 'pi-trash',
    step: 'Retire',
    title: 'Retired cleanly, value recovered',
    line: 'Disposal approval, gate pass, e-waste compliance — and the write-off posted the day the asset leaves the gate.',
  },
  {
    key: 'plan',
    icon: 'pi-chart-line',
    step: 'Plan',
    title: 'And management plans the next cycle on evidence',
    line: 'Utilisation, total cost of ownership and repair-versus-replace turn seven stages of history into next year’s budget.',
  },
];

@Component({
  selector: 'app-login',
  imports: [InputTextModule, PasswordModule, ButtonModule, CheckboxModule, CommonModule, CarouselModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {

  constructor(private authService: Auth, private router: Router, private route: ActivatedRoute, private messageService: MessageService, private cdr: ChangeDetectorRef) {
    // Initialize any required services or state

  }

  // Where to land after login — honours ?returnUrl (e.g. set by a QR scan that
  // needs login to show full details), falling back to the assets list.
  private get returnUrl(): string {
    return this.route.snapshot.queryParamMap.get('returnUrl') || '/assets/view';
  }

  ngOnInit(): void {

    // If a silent refresh (APP_INITIALIZER) already restored a session, skip login.
    if (this.authService.isLoggedIn()) {
      this.router.navigateByUrl(this.returnUrl);
    }
  }
  images = [
    '/system.svg',
    '/photo-camera.svg',
    '/cctv.svg'
  ];

  lifecycle = LIFECYCLE;

  /**
   * The scene the visitor has held still, 1-based, or null while the loop runs
   * itself. Everything about the animation is CSS keyframes — nothing here runs
   * a timer — so this only ever switches between "let it cycle" and "hold this
   * one", which is also what makes the panel usable under reduced motion.
   */
  pinnedStage = signal<number | null>(null);

  /** Clicking the held scene again hands it back to the loop. */
  pickStage(step: number): void {
    this.pinnedStage.set(this.pinnedStage() === step ? null : step);
  }

  /** Arrow keys walk the lifecycle rail, as a toolbar of steps should. */
  onStageKeydown(event: KeyboardEvent, index: number): void {
    const keys = ['ArrowRight', 'ArrowDown', 'ArrowLeft', 'ArrowUp', 'Home', 'End'];
    if (!keys.includes(event.key)) return;
    event.preventDefault();

    const last = LIFECYCLE.length - 1;
    let next: number;
    if (event.key === 'Home') next = 0;
    else if (event.key === 'End') next = last;
    else if (event.key === 'ArrowRight' || event.key === 'ArrowDown') next = index === last ? 0 : index + 1;
    else next = index === 0 ? last : index - 1;

    this.pinnedStage.set(next + 1);
    const rail = (event.currentTarget as HTMLElement).parentElement;
    (rail?.children[next] as HTMLElement | undefined)?.focus();
  }

  passwordFieldType = 'password';
  currentYear = new Date().getFullYear();
  employeeId: string = '';
  password: string = '';
  loading: boolean = false;


  togglePassword(): void {
    this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
  }
  onSubmit(): void {
    if (!this.employeeId || !this.password) {
      this.messageService.add({ severity: 'error', summary: 'Error', detail: 'Please enter Employee ID and Password' });
      return;
    }

    this.loading = true;

    this.authService.login(this.employeeId, this.password).subscribe({
      next: (response) => {
        // Access token → memory (Auth service); refresh token is in an httpOnly
        // cookie the server just set. Only non-secret display data is persisted.
        this.authService.setSession(response.token, response.user);
        this.employeeId = '';
        this.password = '';
        this.loading = false;
        this.router.navigateByUrl(this.returnUrl);
        this.messageService.add({ severity: 'success', summary: 'Login Successful', detail: 'Welcome back!' });
      },
      error: (error) => {
        console.error('Login failed:', error);
        this.loading = false;
        // Surface the server's reason (e.g. "Your account is inactive") instead
        // of always blaming the credentials.
        const detail = error?.error?.message || 'Invalid Employee ID or Password';
        this.messageService.add({ severity: 'error', summary: 'Login Failed', detail });
        // Zoneless app: without this the button stays stuck on "Authenticating…"
        // because nothing schedules a re-render after loading flips back.
        this.cdr.markForCheck();
      },
    });
  }

  isLoginFormValid(): boolean {
    return !!this.employeeId.trim() && !!this.password.trim();
  }

}
