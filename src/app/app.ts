import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InputSwitchModule } from 'primeng/inputswitch';
import { FormsModule } from '@angular/forms';
import { CommonModule, Location } from '@angular/common';
import { Sidebar } from "./sidebar/sidebar";
import { Login } from "./login/login";
import { Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { BadgeModule } from 'primeng/badge';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { NotificationsService } from './services/notifications/notifications';
import { Auth } from './services/auth/auth';
import { TrialBanner } from './shared/trial-banner/trial-banner';
import { environment } from '../environment/environment.prod';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, InputSwitchModule, Sidebar, RouterOutlet, ToastModule, BadgeModule, OverlayPanelModule, ButtonModule, ConfirmDialogModule, TrialBanner],
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true,
  providers: [ConfirmationService]
})
export class App implements OnInit, OnDestroy {

  constructor(
    private router: Router,
    private notifService: NotificationsService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
    private confirmationService: ConfirmationService,
    private location: Location,
    private auth: Auth,
  ) {}

  goBack() {
    this.location.back();
  }

  dark = false;
  isSidebarCollapsed = false;
  // Read from localStorage on every change-detection pass instead of caching
  // at construction. Reason: the App component is constructed once (before any
  // login), so a plain field stays empty until a hard refresh — and after a
  // logout-then-login as a different user, a cached field still shows the
  // previous user's name. The getter is read at render time, so the topbar
  // always reflects the current logged-in user.
  get name(): string {
    return localStorage.getItem('name') || '';
  }
  showUserMenu = false;

  // Notification state
  unreadCount = 0;
  notifications: any[] = [];
  loadingNotifs = false;
  showNotifPanel = false;
  private eventSource: EventSource | null = null;
  private notifAudio: HTMLAudioElement | null = null;

  ngOnInit() {
    if (this.isLoggedIn()) {
      this.loadUnreadCount();
      this.loadRecentNotifications();
      this.connectSSE();
    }
  }

  ngOnDestroy() {
    this.disconnectSSE();
  }

  // ── Notification methods ──

  loadUnreadCount() {
    this.notifService.getUnreadCount().subscribe({
      next: (res) => {
        this.unreadCount = res.unreadCount ?? 0;
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  loadRecentNotifications() {
    this.loadingNotifs = true;
    this.notifService.getMyNotifications({ limit: 15 }).subscribe({
      next: (res: any) => {
        this.notifications = res.data ?? res ?? [];
        this.unreadCount = res.unreadCount ?? this.unreadCount;
        this.loadingNotifs = false;
        this.cdr.detectChanges();
      },
      error: () => { this.loadingNotifs = false; }
    });
  }

  connectSSE() {
    const empId = localStorage.getItem('employeeDbId') || localStorage.getItem('empId');
    if (!empId || this.eventSource) return;

    const url = `${environment.apiUrl}/notifications/stream?employeeId=${empId}`;
    this.eventSource = new EventSource(url);

    this.eventSource.addEventListener('notification', (event: any) => {
      this.zone.run(() => {
        const data = JSON.parse(event.data);
        this.notifications.unshift(data);
        this.unreadCount++;
        this.playNotificationSound();
        this.cdr.detectChanges();
      });
    });

    this.eventSource.onerror = () => {
      // Silently reconnect after 5 seconds
      this.disconnectSSE();
      setTimeout(() => this.connectSSE(), 5000);
    };
  }

  playNotificationSound() {
    try {
      if (!this.notifAudio) {
        // Use Web Audio API to generate a short chime — no external file needed
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);       // A5
        osc.frequency.setValueAtTime(1108, audioCtx.currentTime + 0.1); // C#6
        gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);
        osc.start(audioCtx.currentTime);
        osc.stop(audioCtx.currentTime + 0.4);
      }
    } catch (e) {
      // Audio playback blocked by browser policy — ignore silently
    }
  }

  disconnectSSE() {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  markAsRead(notif: any) {
    if (notif.notification?.id) {
      this.notifService.markAsRead(notif.notification.id).subscribe({
        next: () => {
          notif.isRead = true;
          if (this.unreadCount > 0) this.unreadCount--;
          this.cdr.detectChanges();
        },
        error: () => {}
      });
    } else if (notif.id) {
      this.notifService.markAsRead(notif.id).subscribe({
        next: () => {
          notif.isRead = true;
          if (this.unreadCount > 0) this.unreadCount--;
          this.cdr.detectChanges();
        },
        error: () => {}
      });
    }
  }

  markAllRead() {
    this.notifService.markAllAsRead().subscribe({
      next: () => {
        this.unreadCount = 0;
        this.notifications.forEach(n => n.isRead = true);
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  getNotifTitle(n: any): string {
    return n.notification?.title || n.title || 'Notification';
  }

  getNotifMessage(n: any): string {
    return n.notification?.message || n.message || '';
  }

  getNotifTime(n: any): string {
    const date = n.notification?.createdAt || n.createdAt;
    if (!date) return '';
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  }

  isLoggedIn(): boolean {
    return this.auth.isLoggedIn();
  }

  toggleTheme() {
    document.documentElement.classList.toggle('app-dark', this.dark);
  }

  settings() {
    this.router.navigate(['/settings']);
  }

  logout() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to logout?',
      header: 'Confirm Logout',
      icon: 'pi pi-sign-out',
      acceptLabel: 'Logout',
      rejectLabel: 'Cancel',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.auth.logout();
        this.router.navigate(['/login']);
      }
    });
  }

  isLoginRoute(): boolean {
    // Strip any query string (e.g. /login?returnUrl=…) before matching.
    return this.router.url.split('?')[0] === '/login';
  }

  isNoLayoutRoute(): boolean {
    const url = this.router.url.split('?')[0];
    // The external-auditor portal renders its own chrome — never show the
    // staff sidebar/topbar for it. Same for the demo trial screens: the console
    // is ours (no client session at all) and the blocked screen is terminal.
    return url === '/login'
      || url.startsWith('/assets/scan/')
      || url.startsWith('/auditor')
      || url.startsWith('/trial-admin')
      || url.startsWith('/trial-blocked');
  }

  goToNotifications() {
    this.showNotifPanel = false;
    this.router.navigate(['/notifications']);
  }
}
