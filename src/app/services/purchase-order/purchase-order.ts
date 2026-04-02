import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private base = `${environment.apiUrl}/purchase-order`;

  constructor(private http: HttpClient) {}

  getAll(filters: any = {}): Observable<any> {
    return this.http.get<any>(this.base, { params: this.buildParams(filters) });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}`);
  }

  create(payload: any): Observable<any> {
    return this.http.post<any>(this.base, payload);
  }

  update(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.base}/${id}`, payload);
  }

  approve(id: number, payload: any): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}/approve`, payload);
  }

  sendToVendor(id: number): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}/send`, {});
  }

  cancel(id: number): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}/cancel`, {});
  }

  createFromIndent(indentId: number, body: any = {}): Observable<any> {
    return this.http.post<any>(`${this.base}/from-indent/${indentId}`, body);
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
