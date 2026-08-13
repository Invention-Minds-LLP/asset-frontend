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

  /**
   * Look up a pass by its printed number — used by the QR deep link and by the
   * scan screen's paste box (older labels carry a QR that isn't a link).
   */
  getByNo(gatePassNo: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/scan/${encodeURIComponent(gatePassNo.trim())}`);
  }

  getOverdue(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/overdue`);
  }

  /** HOD inbox — passes pending approval for the current user's department */
  getPendingApproval(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/pending-approval`);
  }

  /** Security inbox — APPROVED (ready to issue) + ISSUED returnable (awaiting return) */
  getSecurityQueue(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/security-queue`);
  }

  /**
   * Security history — every pass that physically crossed the gate. Paginated,
   * because unlike the queue this only ever grows.
   */
  getSecurityHistory(params: {
    page?: number; limit?: number; search?: string;
    from?: string; to?: string; type?: string; status?: string;
  } = {}): Observable<{ data: any[]; total: number; page: number; limit: number }> {
    const query = Object.entries(params)
      .filter(([, v]) => v !== undefined && v !== null && v !== '')
      .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
      .join('&');
    return this.http.get<{ data: any[]; total: number; page: number; limit: number }>(
      `${this.apiUrl}/security-history${query ? `?${query}` : ''}`
    );
  }

  /** Label queue — APPROVED passes awaiting a stick-on label (security executive) */
  getLabelQueue(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/label-queue`);
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

  /**
   * Desk clearance — supervisor has checked the items and recorded the vehicle.
   * The parcel is still on site; the label is printed after this.
   */
  securityClear(id: number, payload: { vehicleNo?: string; vehicleType?: string; courierDetails?: string } = {}): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/security-clear`, payload);
  }

  /** The parcel actually leaves. Everything was captured at clearance. */
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

  /**
   * Compact stick-on label for the parcel (4x6in). Generating it stamps
   * labelPrintedAt/By on the pass, so callers should refresh their list after.
   */
  downloadLabel(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/label`, { responseType: 'blob' });
  }
}
