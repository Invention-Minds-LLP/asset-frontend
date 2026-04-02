import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class GoodsReceiptService {
  private base = `${environment.apiUrl}/goods-receipt`;

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

  inspect(id: number, payload: any): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}/inspect`, payload);
  }

  accept(id: number): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}/accept`, {});
  }

  reject(id: number): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}/reject`, {});
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
