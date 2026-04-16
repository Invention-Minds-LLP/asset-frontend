import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private base = `${environment.apiUrl}/analytics`;

  constructor(private http: HttpClient) {}

  getTCO(filters: any = {}): Observable<any> {
    return this.http.get<any>(`${this.base}/tco`, { params: this.buildParams(filters) });
  }

  getAssetTurnover(filters: any = {}): Observable<any> {
    return this.http.get<any>(`${this.base}/asset-turnover`, { params: this.buildParams(filters) });
  }

  getCfoDashboard(filters: any = {}): Observable<any> {
    return this.http.get<any>(`${this.base}/cfo-dashboard`, { params: this.buildParams(filters) });
  }

  getIdleCapital(filters: any = {}): Observable<any> {
    return this.http.get<any>(`${this.base}/idle-capital`, { params: this.buildParams(filters) });
  }

  getCooDashboard(filters: any = {}): Observable<any> {
    return this.http.get<any>(`${this.base}/coo-dashboard`, { params: this.buildParams(filters) });
  }

  getRepeatTickets(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/hierarchy-config/repeat-tickets`);
  }

  getSlaBreachAlerts(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/hierarchy-config/sla-breach-alerts`);
  }

  getInStoreAging(): Observable<any> {
    return this.http.get<any>(`${this.base}/in-store-aging`);
  }

  getUncoveredAssets(filters: any = {}): Observable<any> {
    return this.http.get<any>(`${this.base}/uncovered-assets`, { params: this.buildParams(filters) });
  }

  getMaintenanceByCategory(filters: any = {}): Observable<any> {
    return this.http.get<any>(`${this.base}/maintenance-by-category`, { params: this.buildParams(filters) });
  }

  getAssetValueBuckets(): Observable<any> {
    return this.http.get<any>(`${this.base}/asset-value-buckets`);
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
