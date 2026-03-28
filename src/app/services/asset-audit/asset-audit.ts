import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class AssetAuditService {
  private baseUrl = `${environment.apiUrl}/asset-audit`;

  constructor(private http: HttpClient) {}

  getAll(filters: any = {}): Observable<any> {
    return this.http.get(this.baseUrl, { params: this.buildParams(filters) });
  }

  getById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  create(payload: any): Observable<any> {
    return this.http.post(this.baseUrl, payload);
  }

  start(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/start`, {});
  }

  verifyItem(itemId: number, payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/items/${itemId}/verify`, payload);
  }

  complete(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/complete`, {});
  }

  getSummary(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}/summary`);
  }

  private buildParams(obj: any): HttpParams {
    let params = new HttpParams();
    for (const key of Object.keys(obj)) {
      if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
        params = params.set(key, String(obj[key]));
      }
    }
    return params;
  }
}
