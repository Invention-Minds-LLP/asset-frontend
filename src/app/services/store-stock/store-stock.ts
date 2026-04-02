import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class StoreStockService {
  private base = `${environment.apiUrl}/store-stock`;

  constructor(private http: HttpClient) {}

  getByStore(storeId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${storeId}`);
  }

  getSummary(): Observable<any> {
    return this.http.get<any>(`${this.base}/summary/all`);
  }

  getLowStockAlerts(): Observable<any> {
    return this.http.get<any>(`${this.base}/alerts/low-stock`);
  }

  adjustStock(storeId: number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}/${storeId}/adjust`, payload);
  }

  getMovements(storeId: number, filters: any = {}): Observable<any> {
    return this.http.get<any>(`${this.base}/${storeId}/movements`, { params: this.buildParams(filters) });
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
