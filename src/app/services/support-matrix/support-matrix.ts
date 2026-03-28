import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class SupportMatrixService {
  private apiUrl = `${environment.apiUrl}/support-matrix`;

  constructor(private http: HttpClient) {}

  getAll(filters?: { assetCategoryId?: number; assetId?: number }): Observable<any[]> {
    let query = '';
    if (filters) {
      const parts = Object.entries(filters)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      if (parts) query = `?${parts}`;
    }
    return this.http.get<any[]>(`${this.apiUrl}${query}`);
  }

  getByAsset(assetId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/asset/${assetId}`);
  }

  getByCategory(assetCategoryId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/category/${assetCategoryId}`);
  }

  create(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, payload);
  }

  bulkSave(payload: { assetCategoryId?: number; assetId?: number; entries: any[] }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/bulk`, payload);
  }

  update(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
