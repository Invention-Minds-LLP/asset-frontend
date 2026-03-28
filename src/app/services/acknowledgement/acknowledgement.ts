import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class AcknowledgementService {
  private apiUrl = `${environment.apiUrl}/acknowledgement`;

  constructor(private http: HttpClient) {}

  // ── Templates ──────────────────────────────────────────────────────────────
  getAllTemplates(filters?: { assetCategoryId?: number; assetId?: number; purpose?: string; isActive?: boolean }): Observable<any[]> {
    let query = '';
    if (filters) {
      const parts = Object.entries(filters)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      if (parts) query = `?${parts}`;
    }
    return this.http.get<any[]>(`${this.apiUrl}/templates${query}`);
  }

  getTemplateById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/templates/${id}`);
  }

  createTemplate(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/templates`, payload);
  }

  updateTemplate(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/templates/${id}`, payload);
  }

  deleteTemplate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/templates/${id}`);
  }

  addItems(templateId: number, items: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/templates/${templateId}/items`, { items });
  }

  // ── Runs ───────────────────────────────────────────────────────────────────
  getRunsByAsset(assetId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/runs/asset/${assetId}`);
  }

  getRunById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/runs/${id}`);
  }

  getMyPending(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/runs/my-pending`);
  }

  createRun(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/runs`, payload);
  }

  submitRun(runId: number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/runs/${runId}/submit`, payload);
  }
}
