import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class DocumentsService {
  private apiUrl = `${environment.apiUrl}/documents`;

  constructor(private http: HttpClient) {}

  getAll(filters?: { entityType?: string; entityId?: number; documentType?: string; assetId?: number }): Observable<any[]> {
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

  upload(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/upload`, formData);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getAllPaginated(params: any = {}): Observable<any> {
    let q = new URLSearchParams();
    Object.keys(params).forEach(k => { if (params[k] !== null && params[k] !== undefined && params[k] !== '') q.set(k, params[k]); });
    return this.http.get<any>(`${this.apiUrl}/all?${q.toString()}`);
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/stats`);
  }

  exportCsv(params: any = {}): Observable<Blob> {
    let q = new URLSearchParams();
    Object.keys(params).forEach(k => { if (params[k]) q.set(k, params[k]); });
    q.set('exportCsv', 'true');
    return this.http.get(`${this.apiUrl}/all?${q.toString()}`, { responseType: 'blob' });
  }
}
