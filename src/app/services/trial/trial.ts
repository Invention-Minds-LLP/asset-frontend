import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

export interface TrialStatus {
  trial: boolean;
  clientName?: string;
  status?: string;
  expiresAt?: string;
  active?: boolean;
  code?: string;
  message?: string;
  hoursLeft?: number;
  daysLeft?: number;
}

@Injectable({ providedIn: 'root' })
export class TrialService {
  private base = `${environment.apiUrl}/trial`;

  // sessionStorage, not localStorage: the admin key should die with the tab
  // rather than sit on disk on whatever machine we opened the console from.
  private readonly KEY_STORE = 'trialAdminKey';

  constructor(private http: HttpClient) {}

  getAdminKey(): string {
    if (typeof window === 'undefined') return '';
    return sessionStorage.getItem(this.KEY_STORE) || '';
  }

  setAdminKey(key: string): void {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(this.KEY_STORE, key);
  }

  clearAdminKey(): void {
    if (typeof window === 'undefined') return;
    sessionStorage.removeItem(this.KEY_STORE);
  }

  private adminOpts() {
    return { headers: new HttpHeaders({ 'x-trial-admin-key': this.getAdminKey() }) };
  }

  /** Countdown banner feed — plain logged-in access, no admin key. */
  status(): Observable<TrialStatus> {
    return this.http.get<TrialStatus>(`${this.base}/status`);
  }

  get(): Observable<any> {
    return this.http.get<any>(this.base, this.adminOpts());
  }

  save(payload: any): Observable<any> {
    return this.http.put<any>(this.base, payload, this.adminOpts());
  }

  extend(days: number): Observable<any> {
    return this.http.post<any>(`${this.base}/extend`, { days }, this.adminOpts());
  }

  revoke(): Observable<any> {
    return this.http.post<any>(`${this.base}/revoke`, {}, this.adminOpts());
  }

  reactivate(): Observable<any> {
    return this.http.post<any>(`${this.base}/reactivate`, {}, this.adminOpts());
  }

  resetLockedIp(): Observable<any> {
    return this.http.post<any>(`${this.base}/reset-ip`, {}, this.adminOpts());
  }

  endSessions(): Observable<any> {
    return this.http.post<any>(`${this.base}/end-sessions`, {}, this.adminOpts());
  }

  violations(limit = 100): Observable<any> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<any>(`${this.base}/violations`, { ...this.adminOpts(), params });
  }

  logins(limit = 100): Observable<any> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<any>(`${this.base}/logins`, { ...this.adminOpts(), params });
  }
}
