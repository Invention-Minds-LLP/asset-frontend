import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class CalibrationService {
  private apiUrl = `${environment.apiUrl}/calibration`;

  constructor(private http: HttpClient) {}

  // ── Schedules ──────────────────────────────────────────────────────────────
  getAllSchedules(filters?: { assetId?: number; isActive?: boolean }): Observable<any[]> {
    let query = '';
    if (filters) {
      const parts = Object.entries(filters)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      if (parts) query = `?${parts}`;
    }
    return this.http.get<any[]>(`${this.apiUrl}/schedules${query}`);
  }

  getSchedulesByAsset(assetId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/schedules/asset/${assetId}`);
  }

  getDueCalibrations(days = 7): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/schedules/due?days=${days}`);
  }

  createSchedule(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/schedules`, payload);
  }

  updateSchedule(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/schedules/${id}`, payload);
  }

  deleteSchedule(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/schedules/${id}`);
  }

  // ── History ────────────────────────────────────────────────────────────────
  logHistory(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/history`, payload);
  }

  getHistoryByAsset(assetId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/history/asset/${assetId}`);
  }

  getHistoryPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/history/${id}/pdf`, { responseType: 'blob' });
  }

  // ── Templates ──────────────────────────────────────────────────────────────
  getAllTemplates(filters?: { assetCategoryId?: number; assetId?: number }): Observable<any[]> {
    let query = '';
    if (filters) {
      const parts = Object.entries(filters)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      if (parts) query = `?${parts}`;
    }
    return this.http.get<any[]>(`${this.apiUrl}/templates${query}`);
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

  addTemplateItems(templateId: number, items: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/templates/${templateId}/items`, { items });
  }
}
