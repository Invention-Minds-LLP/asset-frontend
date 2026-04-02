import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class DecisionEngineService {
  private base = `${environment.apiUrl}/decision-engine`;

  constructor(private http: HttpClient) {}

  getDashboardSummary(): Observable<any> {
    return this.http.get<any>(`${this.base}/dashboard-summary`);
  }

  evaluateAll(params: any = {}): Observable<any> {
    const q = new URLSearchParams();
    Object.keys(params).forEach(k => {
      if (params[k] !== null && params[k] !== undefined && params[k] !== '')
        q.set(k, params[k]);
    });
    return this.http.get<any>(`${this.base}/evaluate-all?${q.toString()}`);
  }

  evaluateSingle(assetDbId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/evaluate/${assetDbId}`);
  }

  getHistory(assetDbId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/history/${assetDbId}`);
  }

  getConfigs(): Observable<any> {
    return this.http.get<any>(`${this.base}/config`);
  }

  upsertConfig(payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}/config`, payload);
  }
}
