import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

// Asset reclassification: Finance/CFO raise, the CFO (not the requester)
// approves. Applies from 1 April of the current financial year only.
@Injectable({ providedIn: 'root' })
export class ReclassificationService {
  private baseUrl = `${environment.apiUrl}/reclassification`;

  constructor(private http: HttpClient) {}

  list(status?: string): Observable<any[]> {
    const q = status ? `?status=${encodeURIComponent(status)}` : '';
    return this.http.get<any[]>(`${this.baseUrl}${q}`);
  }

  get(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  candidates(opts: { categoryId?: number; assetId?: number; search?: string }): Observable<any[]> {
    const params: any = {};
    if (opts.categoryId) params.categoryId = String(opts.categoryId);
    if (opts.assetId) params.assetId = String(opts.assetId);
    if (opts.search) params.search = opts.search;
    return this.http.get<any[]>(`${this.baseUrl}/candidates`, { params });
  }

  preview(body: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/preview`, body);
  }

  create(body: any): Observable<any> {
    return this.http.post(this.baseUrl, body);
  }

  approve(id: number, notes?: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id}/approve`, { notes });
  }

  reject(id: number, reason: string): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id}/reject`, { reason });
  }

  cancel(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id}/cancel`, {});
  }

  /** Re-try the GL entry of an approved request whose entry wasn't created. */
  postGl(id: number): Observable<any> {
    return this.http.post(`${this.baseUrl}/${id}/post-gl`, {});
  }
}
