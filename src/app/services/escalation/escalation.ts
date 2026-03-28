import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class EscalationService {
  private apiUrl = `${environment.apiUrl}/escalation`;

  constructor(private http: HttpClient) {}

  // ── Matrix Rules ───────────────────────────────────────────────────────────
  getAllRules(filters?: { departmentId?: number; assetCategoryId?: number; priority?: string }): Observable<any[]> {
    let query = '';
    if (filters) {
      const parts = Object.entries(filters)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      if (parts) query = `?${parts}`;
    }
    return this.http.get<any[]>(`${this.apiUrl}/rules${query}`);
  }

  getRuleById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/rules/${id}`);
  }

  createRule(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/rules`, payload);
  }

  bulkSaveRules(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/rules/bulk`, payload);
  }

  updateRule(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/rules/${id}`, payload);
  }

  deleteRule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/rules/${id}`);
  }

  // ── Ticket Escalations ─────────────────────────────────────────────────────
  getTicketEscalations(ticketId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ticket/${ticketId}`);
  }

  triggerEscalation(ticketId: number, payload: { level: number; notifiedEmployeeId?: number; message?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/ticket/${ticketId}/trigger`, payload);
  }

  checkAndEscalate(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/check-and-escalate`, {});
  }
}
