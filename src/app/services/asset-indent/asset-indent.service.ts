import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class AssetIndentService {
  private base = `${environment.apiUrl}/asset-indent`;

  constructor(private http: HttpClient) {}

  getAll(filters: any = {}): Observable<any[]> {
    let params = new HttpParams();
    for (const k of Object.keys(filters)) {
      if (filters[k] !== null && filters[k] !== undefined && filters[k] !== '') {
        params = params.set(k, String(filters[k]));
      }
    }
    return this.http.get<any[]>(this.base, { params });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}`);
  }

  create(payload: any): Observable<any> {
    return this.http.post<any>(this.base, payload);
  }

  hodApprove(id: number, payload: { decision: string; remarks?: string }): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}/hod-approval`, payload);
  }

  managementApprove(id: number, payload: { decision: string; remarks?: string }): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}/management-approval`, payload);
  }

  fulfill(id: number, payload: { fulfilledAssetId?: number }): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}/fulfill`, payload);
  }

  cancel(id: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/${id}`);
  }
}
