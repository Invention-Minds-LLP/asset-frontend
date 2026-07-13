import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

// Item verify status set — mirrors the backend enum.
export type AuditItemStatus = 'PENDING' | 'VERIFIED' | 'MISSING' | 'MISMATCH';

export interface VerifyItemPayload {
  status: 'VERIFIED' | 'MISSING' | 'MISMATCH';
  locationMatch?: boolean | null;
  conditionMatch?: boolean | null;
  actualLocation?: string | null;
  actualCondition?: string | null;
  remarks?: string | null;
}

// Backend enforces scope on every one of these endpoints — an auditor only
// ever sees audits they're assigned to. There's nothing to filter client-side.
@Injectable({ providedIn: 'root' })
export class ExternalAuditService {
  private base = `${environment.apiUrl}/external-audit`;
  // Backend origin without /api — used to resolve /uploads floor-plan images.
  readonly fileBase = environment.apiUrl.replace(/\/api\/?$/, '');

  constructor(private http: HttpClient) {}

  listMyAudits(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.base}/audits`);
  }

  getAudit(id: number): Observable<{ data: any }> {
    return this.http.get<{ data: any }>(`${this.base}/audits/${id}`);
  }

  getFloorMap(id: number): Observable<{ data: any }> {
    return this.http.get<{ data: any }>(`${this.base}/audits/${id}/floor-map`);
  }

  // Suggested next asset + full walk order for the pinned items.
  getNextItem(id: number, fromItemId?: number | null): Observable<{ data: any }> {
    const url = `${this.base}/audits/${id}/next-item`;
    return this.http.get<{ data: any }>(
      fromItemId ? `${url}?fromItemId=${fromItemId}` : url
    );
  }

  startAudit(id: number): Observable<{ data: any; message?: string }> {
    return this.http.put<{ data: any; message?: string }>(`${this.base}/audits/${id}/start`, {});
  }

  completeAudit(id: number): Observable<{ data: any; message?: string }> {
    return this.http.put<{ data: any; message?: string }>(`${this.base}/audits/${id}/complete`, {});
  }

  verifyItem(itemId: number, payload: VerifyItemPayload): Observable<{ data: any; message?: string }> {
    return this.http.put<{ data: any; message?: string }>(
      `${this.base}/audit-items/${itemId}/verify`,
      payload
    );
  }

  // Full URL for a stored floor-plan image (same rule as FloorPlanService).
  imageUrl(plan: any): string {
    if (!plan?.imageUrl) return '';
    return plan.imageUrl.startsWith('http') ? plan.imageUrl : `${this.fileBase}${plan.imageUrl}`;
  }
}
