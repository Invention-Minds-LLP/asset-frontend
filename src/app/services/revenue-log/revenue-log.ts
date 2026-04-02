import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class RevenueLogService {
  private base = `${environment.apiUrl}/revenue-log`;
  constructor(private http: HttpClient) {}

  // Rate Card
  getRateCard(assetId: number): Observable<any> { return this.http.get(`${this.base}/rate-card/${assetId}`); }
  upsertRateCard(assetId: number, payload: any): Observable<any> { return this.http.post(`${this.base}/rate-card/${assetId}`, payload); }

  // Daily Usage Logs
  getDailyLogs(assetId: number, params?: any): Observable<any> {
    const q = new URLSearchParams();
    if (params) Object.keys(params).forEach(k => { if (params[k] != null && params[k] !== '') q.set(k, params[k]); });
    return this.http.get(`${this.base}/daily/${assetId}?${q.toString()}`);
  }
  upsertDailyLog(assetId: number, payload: any): Observable<any> { return this.http.post(`${this.base}/daily/${assetId}`, payload); }
  deleteDailyLog(logId: number): Observable<any> { return this.http.delete(`${this.base}/daily/${logId}`); }
  verifyDailyLog(logId: number): Observable<any> { return this.http.patch(`${this.base}/daily/${logId}/verify`, {}); }

  // Analytics
  getUtilization(assetId: number): Observable<any> { return this.http.get(`${this.base}/utilization/${assetId}`); }
  getOee(assetId: number): Observable<any> { return this.http.get(`${this.base}/oee/${assetId}`); }
  getRevenueSummary(assetId: number): Observable<any> { return this.http.get(`${this.base}/revenue-summary/${assetId}`); }
  getDashboard(): Observable<any> { return this.http.get(`${this.base}/dashboard`); }
  getMissingLogs(days?: number): Observable<any> { return this.http.get(`${this.base}/missing-logs${days ? '?days=' + days : ''}`); }
  getDowntimeAnalysis(assetId: number): Observable<any> { return this.http.get(`${this.base}/downtime-analysis/${assetId}`); }
  getLeaderboard(params?: any): Observable<any> {
    const q = new URLSearchParams();
    if (params) Object.keys(params).forEach(k => { if (params[k] != null) q.set(k, params[k]); });
    return this.http.get(`${this.base}/leaderboard?${q.toString()}`);
  }
  getShiftAnalysis(assetId: number): Observable<any> { return this.http.get(`${this.base}/shift-analysis/${assetId}`); }
}
