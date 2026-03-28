import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class FinancialDashboardService {
  private baseUrl = `${environment.apiUrl}/financial-dashboard`;

  constructor(private http: HttpClient) {}

  getFilterOptions(): Observable<any> {
    return this.http.get(`${this.baseUrl}/filters`);
  }

  getFinancialSummary(filters: any = {}): Observable<any> {
    return this.http.get(`${this.baseUrl}/summary`, { params: this.buildParams(filters) });
  }

  getFYBreakdown(filters: any = {}): Observable<any> {
    return this.http.get(`${this.baseUrl}/fy-breakdown`, { params: this.buildParams(filters) });
  }

  getMonthlyAssets(params: any = {}): Observable<any> {
    return this.http.get(`${this.baseUrl}/monthly-assets`, { params: this.buildParams(params) });
  }

  getCostTrend(filters: any = {}): Observable<any> {
    return this.http.get(`${this.baseUrl}/cost-trend`, { params: this.buildParams(filters) });
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
