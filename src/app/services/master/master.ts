import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class MasterService {
  private baseUrl = `${environment.apiUrl}/master`;

  constructor(private http: HttpClient) {}

  getDashboardStats(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/dashboard`);
  }

  getLookupData(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/lookup`);
  }

  getAssetLifecycleSummary(assetId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/asset-lifecycle/${assetId}`);
  }

  getExpiryAlerts(days = 30): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/expiry-alerts?days=${days}`);
  }
}
