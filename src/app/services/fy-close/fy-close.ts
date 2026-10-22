import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

// Financial-year finalization (books closed): Finance submits, CFO approves or
// rejects. The CFO may undo a finalization within 24 hours; after that it stays closed.
@Injectable({ providedIn: 'root' })
export class FyCloseService {
  private baseUrl = `${environment.apiUrl}/fy-close`;

  constructor(private http: HttpClient) {}

  listYears(): Observable<{ currentFiscalYear: number; years: any[] }> {
    return this.http.get<{ currentFiscalYear: number; years: any[] }>(this.baseUrl);
  }

  preview(fiscalYear: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${fiscalYear}/preview`);
  }

  submit(fiscalYear: number, notes?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${fiscalYear}/submit`, { notes });
  }

  approve(fiscalYear: number, notes?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${fiscalYear}/approve`, { notes });
  }

  reject(fiscalYear: number, reason: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${fiscalYear}/reject`, { reason });
  }

  // CFO only, within 24 hours of finalizing.
  undo(fiscalYear: number, reason: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${fiscalYear}/undo`, { reason });
  }
}
