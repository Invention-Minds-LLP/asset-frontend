import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class DepreciationAuditService {
  private baseUrl = `${environment.apiUrl}/depreciation-audit`;

  constructor(private http: HttpClient) {}

  getAudits(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}`);
  }

  // Map of { [fiscalYear]: status } for dashboard badges.
  getStatuses(): Observable<{ statuses: Record<number, string> }> {
    return this.http.get<{ statuses: Record<number, string> }>(`${this.baseUrl}/status`);
  }

  getAuditableYears(): Observable<{ years: { fiscalYear: number; label: string }[] }> {
    return this.http.get<{ years: { fiscalYear: number; label: string }[] }>(`${this.baseUrl}/years`);
  }

  getPreview(fy: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/preview`, { params: { fy: String(fy) } });
  }

  createAudit(body: { fiscalYear: number; notes?: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}`, body);
  }

  cfoApprove(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id}/cfo-approve`, {});
  }

  cfoReject(id: number, reason: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id}/reject`, { reason });
  }
}
