import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class ReportsService {
  private baseUrl = `${environment.apiUrl}/reports`;

  constructor(private http: HttpClient) {}

  getAssetRegister(filters: any = {}): Observable<any> {
    return this.http.get(`${this.baseUrl}/asset-register`, { params: this.buildParams(filters) });
  }

  getMaintenanceCost(filters: any = {}): Observable<any> {
    return this.http.get(`${this.baseUrl}/maintenance-cost`, { params: this.buildParams(filters) });
  }

  getTicketAnalytics(filters: any = {}): Observable<any> {
    return this.http.get(`${this.baseUrl}/ticket-analytics`, { params: this.buildParams(filters) });
  }

  getExpiryReport(filters: any = {}): Observable<any> {
    return this.http.get(`${this.baseUrl}/expiry`, { params: this.buildParams(filters) });
  }

  getDepreciationReport(filters: any = {}): Observable<any> {
    return this.http.get(`${this.baseUrl}/depreciation`, { params: this.buildParams(filters) });
  }

  getInventoryStock(filters: any = {}): Observable<any> {
    return this.http.get(`${this.baseUrl}/inventory-stock`, { params: this.buildParams(filters) });
  }

  getFixedAssetsSchedule(filters: any = {}): Observable<any> {
    return this.http.get(`${this.baseUrl}/fixed-assets-schedule`, { params: this.buildParams(filters) });
  }

  getCategoryAssetDetail(filters: any = {}): Observable<any> {
    return this.http.get(`${this.baseUrl}/fixed-assets-schedule/category-detail`, { params: this.buildParams(filters) });
  }

  getConsolidatedReport(filters: any = {}): Observable<any> {
    return this.http.get(`${this.baseUrl}/consolidated`, { params: this.buildParams(filters) });
  }

  exportReport(reportType: string, format: 'csv' | 'excel', filters: any = {}): Observable<Blob> {
    const params = this.buildParams({ ...filters, export: format });
    return this.http.get(`${this.baseUrl}/${reportType}`, {
      params,
      responseType: 'blob'
    });
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
