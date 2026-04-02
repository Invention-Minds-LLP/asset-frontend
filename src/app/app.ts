import { Component, OnInit, OnDestroy, ChangeDetectorRef, NgZone } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { InputSwitchModule } from 'primeng/inputswitch';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Sidebar } from "./sidebar/sidebar";
import { Login } from "./login/login";
import { Router } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { BadgeModule } from 'primeng/badge';
import { OverlayPanelModule } from 'primeng/overlaypanel';
import { ButtonModule } from 'primeng/button';
import { NotificationsService } from './services/notifications/notifications';
import { environment } from '../environment/environment.prod';

@Component({
  selector: 'app-root',
  imports: [CommonModule, FormsModule, InputSwitchModule, Sidebar, RouterOutlet, ToastModule, BadgeModule, OverlayPanelModule, ButtonModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
  standalone: true
})
export class App implements OnInit, OnDestroy {

  constructor(
    private router: Router,
    private notifService: NotificationsService,
    private cdr: ChangeDetectorRef,
    private zone: NgZone,
  ) {}

  dark = false;
  isSidebarCollapsed = false;

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
    return !!localStorage.getItem('authToken');
  }

  toggleTheme() {
    document.documentElement.classList.toggle('app-dark', this.dark);
  }

  isLoginRoute(): boolean {
    return this.router.url === '/login';
  }

  isNoLayoutRoute(): boolean {
    const url = this.router.url;
    return url === '/login' || url.startsWith('/assets/scan/');
  }

  goToNotifications() {
    this.showNotifPanel = false;
    this.router.navigate(['/notifications']);
  }
}
