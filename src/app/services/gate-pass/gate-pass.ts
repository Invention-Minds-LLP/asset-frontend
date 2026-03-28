import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class GatePassService {
  private apiUrl = `${environment.apiUrl}/gate-pass`;

  constructor(private http: HttpClient) {}

  getAll(filters?: { status?: string; type?: string; assetId?: number }): Observable<any[]> {
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

  create(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, payload);
  }

  update(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload);
  }

  updateStatus(id: number, status: string, reason?: string): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/status`, { status, reason });
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
