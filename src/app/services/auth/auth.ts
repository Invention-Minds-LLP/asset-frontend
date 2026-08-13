import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, finalize, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../environment/environment.prod';
export interface UserCreatePayload {
  username: string;
  password: string;
  role: string;
  employeeID: string;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {


  private apiUrl = `${environment.apiUrl}/users`; // Update this with your actual backend endpoint

  constructor(private http: HttpClient) { }
  private base = `${environment.apiUrl}/users`;

  // The access token lives ONLY in memory (never localStorage), so XSS can't
  // scrape it from storage. It's short-lived; the httpOnly refresh cookie mints
  // a new one via refresh(). Non-secret display/authz-hint data (role, dept,
  // name) stays in localStorage — the server enforces real authorization from
  // the access token, not from these.
  private accessToken: string | null = null;
  private refreshInFlight$: Observable<any> | null = null;

  login(employeeId: string, password: string): Observable<any> {
    // withCredentials so the backend can set the httpOnly refresh + CSRF cookies.
    return this.http.post<any>(`${this.apiUrl}/login`, { employeeId, password }, { withCredentials: true });
  }

  isLoggedIn(): boolean {
    return !!this.accessToken;
  }

  // Persist the session: access token in memory, display data in localStorage.
  setSession(token: string, user: any) {
    this.accessToken = token;
    if (user) {
      localStorage.setItem('role', user.role ?? '');
      localStorage.setItem('employeeDbId', String(user.employeeDbId ?? ''));
      localStorage.setItem('departmentId', String(user.departmentId ?? ''));
      // Employee.role, distinct from User.role — an ADMIN user can hold an HOD
      // employee role, and workflow routing keys off the employee one.
      localStorage.setItem('employeeRole', user.employeeRole ?? '');
      localStorage.setItem('name', user.name ?? '');
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  getRole(): string {
    return localStorage.getItem('role') || '';
  }

  getToken(): string {
    return this.accessToken || '';
  }

  // Silent refresh — swaps the httpOnly refresh cookie for a new access token.
  // De-duplicated so a burst of 401s triggers a single /refresh call.
  refresh(): Observable<any> {
    if (!this.refreshInFlight$) {
      this.refreshInFlight$ = this.http
        .post<any>(`${this.base}/refresh`, {}, { withCredentials: true, headers: this.csrfHeader() })
        .pipe(
          tap((res) => { if (res?.token) this.setSession(res.token, res.user); }),
          shareReplay(1),
          finalize(() => { this.refreshInFlight$ = null; })
        );
    }
    return this.refreshInFlight$;
  }

  // Clear the in-memory token + local display data (no server call).
  clearSession() {
    this.accessToken = null;
    localStorage.clear();
  }

  logout() {
    // Best-effort server revoke, then clear locally regardless of the result.
    this.http.post(`${this.base}/logout`, {}, { withCredentials: true, headers: this.csrfHeader() })
      .pipe(catchError(() => of(null)))
      .subscribe(() => this.clearSession());
    this.clearSession();
  }

  // Read the readable CSRF cookie and echo it in the header (double-submit).
  private csrfHeader(): { [k: string]: string } {
    const m = typeof document !== 'undefined'
      ? document.cookie.match(/(?:^|;\s*)csrf=([^;]+)/) : null;
    return m ? { 'X-CSRF-Token': decodeURIComponent(m[1]) } : {};
  }
  resetPassword(employeeID: string, newPassword: string): Observable<any> {
    return this.http.put(`${this.base}/reset-password`, { employeeID, newPassword });
  }
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.base);
  }

  createUser(payload: UserCreatePayload): Observable<any> {
    return this.http.post<any>(this.base, payload);
  }

  updateUser(id: number, payload: { username?: string; role?: string }): Observable<any> {
    return this.http.put<any>(`${this.base}/${id}`, payload);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
