import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

const BASE = `${environment.apiUrl}/reconciliation`;

@Injectable({ providedIn: 'root' })
export class ReconciliationService {
  constructor(private http: HttpClient) {}

  list(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(k => {
      if (filters[k] !== null && filters[k] !== undefined && filters[k] !== '')
        params = params.set(k, filters[k]);
    });
    return this.http.get(BASE, { params });
  }

  detail(id: number): Observable<any> {
    return this.http.get(`${BASE}/${id}`);
  }

  run(payload: any): Observable<any> {
    return this.http.post(`${BASE}/run`, payload);
  }

  resolve(id: number, payload: any): Observable<any> {
    return this.http.put(`${BASE}/${id}/resolve`, payload);
  }

  exportUrl(id: number): string {
    return `${BASE}/${id}/export`;
  }
}
