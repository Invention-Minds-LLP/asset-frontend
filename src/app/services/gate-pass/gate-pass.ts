import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

export interface GatePassItem {
  assetId: number;
  quantity?: number;
  remarks?: string | null;
}

@Injectable({
  providedIn: 'root'
})
export class GatePassService {
  private apiUrl = `${environment.apiUrl}/gate-pass`;

  constructor(private http: HttpClient) {}

  // ── Lists ────────────────────────────────────────────────────────────────
  getAll(filters?: { status?: string; approvalStatus?: string; type?: string; assetId?: number; ticketId?: number }): Observable<any[]> {
    let query = '';
    if (filters) {
      const params = Object.entries(filters)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      if (params) query = `?${params}`;
    }
    return this.http.get<any[]>(`${this.apiUrl}${query}`);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  getByAsset(assetId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/asset/${assetId}`);
  }

  getOverdue(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/overdue`);
  }

  /** HOD inbox — passes pending approval for the current user's department */
  getPendingApproval(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pending-approval`);
  }

  /** Security inbox — APPROVED (ready to issue) + ISSUED (awaiting return) */
  getSecurityQueue(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/security-queue`);
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────
  create(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, payload);
  }

  update(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // ── Lifecycle ────────────────────────────────────────────────────────────
  submit(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/submit`, {});
  }

  approve(id: number, remarks?: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/approve`, { remarks });
  }

  reject(id: number, reason: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/reject`, { reason });
  }

  /** Security marks pass as physically gated out (asset leaves premises) */
  gateOut(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/gate-out`, {});
  }

  /** Security marks pass as physically gated in (asset returned). Provide per-item return data when applicable. */
  gateIn(id: number, payload: { itemReturns?: { itemId: number; condition: string; remarks?: string }[]; returnCondition?: string; returnedBy?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/gate-in`, payload);
  }

  /** Generic close/cancel for back-compat */
  updateStatus(id: number, status: string, reason?: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, { status, reason });
  }

  /** Returns the absolute URL the browser/iframe can hit to download the PDF. */
  pdfUrl(id: number): string {
    return `${this.apiUrl}/${id}/pdf`;
  }

  /** Fetch the PDF as a blob (for triggering native download via blob URL). */
  downloadPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/pdf`, { responseType: 'blob' });
  }
}
