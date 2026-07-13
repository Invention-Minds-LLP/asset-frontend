import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

export interface ExternalAuditor {
  id: number;
  email: string;
  name: string;
  organization?: string | null;
}

interface ExternalLoginResponse {
  token: string;
  auditor: ExternalAuditor;
  message?: string;
}

// Auth for the external-auditor web portal. Deliberately reuses the same
// `authToken` localStorage key that staff login uses, so the existing
// AuthInterceptor attaches the JWT with no changes. The extra `userType` /
// `externalAuditor` keys let the guards tell an auditor session apart from a
// staff one and keep the two worlds from crossing over.
@Injectable({ providedIn: 'root' })
export class ExternalAuthService {
  private base = `${environment.apiUrl}/mobile/external`;

  // Shared with staff login + AuthInterceptor.
  private tokenKey = 'authToken';
  // External-only markers.
  private userTypeKey = 'userType';
  private auditorKey = 'externalAuditor';

  constructor(private http: HttpClient) {}

  // Step 1: email a 6-digit code. Backend returns 200 even for unknown /
  // inactive emails (anti-enumeration), or 429 with Retry-After if throttled.
  requestOtp(email: string): Observable<{ success: boolean }> {
    return this.http.post<{ success: boolean }>(`${this.base}/request-otp`, { email });
  }

  // Step 2: trade the code for a JWT + auditor profile, then persist.
  verifyOtp(email: string, otp: string): Observable<ExternalLoginResponse> {
    return this.http.post<ExternalLoginResponse>(`${this.base}/verify-otp`, { email, otp }).pipe(
      tap((res) => {
        if (res?.token) {
          localStorage.setItem(this.tokenKey, res.token);
          localStorage.setItem(this.userTypeKey, 'EXTERNAL');
          localStorage.setItem(this.auditorKey, JSON.stringify(res.auditor));
          // Clear any staff identity left over in this browser.
          localStorage.removeItem('user');
          localStorage.removeItem('role');
          localStorage.removeItem('name');
        }
      })
    );
  }

  getAuditor(): ExternalAuditor | null {
    const raw = localStorage.getItem(this.auditorKey);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as ExternalAuditor;
    } catch {
      return null;
    }
  }

  isExternalAuditor(): boolean {
    return (
      localStorage.getItem(this.userTypeKey) === 'EXTERNAL' &&
      !!localStorage.getItem(this.tokenKey)
    );
  }

  logout(): void {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userTypeKey);
    localStorage.removeItem(this.auditorKey);
  }
}
