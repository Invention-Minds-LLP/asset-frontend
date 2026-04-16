import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class DepreciationService {
  private base = `${environment.apiUrl}/depreciation`;

  constructor(private http: HttpClient) {}

  getAll(params: any = {}): Observable<any> {
    let q = new URLSearchParams();
    Object.keys(params).forEach(k => { if (params[k] !== null && params[k] !== undefined && params[k] !== '') q.set(k, params[k]); });
    return this.http.get<any>(`${this.base}/all?${q.toString()}`);
  }

  getLogs(params: any = {}): Observable<any> {
    let q = new URLSearchParams();
    Object.keys(params).forEach(k => { if (params[k] !== null && params[k] !== undefined && params[k] !== '') q.set(k, params[k]); });
    return this.http.get<any>(`${this.base}/logs?${q.toString()}`);
  }

  batchPreview(filters: any = {}): Observable<any> {
    let q = new URLSearchParams();
    Object.keys(filters).forEach(k => { if (filters[k] != null && filters[k] !== '') q.set(k, filters[k]); });
    return this.http.get<any>(`${this.base}/batch-preview?${q.toString()}`);
  }

  runBatch(filters: any = {}): Observable<any> {
    return this.http.post<any>(`${this.base}/batch-run`, filters);
  }

  getDepreciableAssets(filters: any = {}): Observable<any> {
    let q = new URLSearchParams();
    Object.keys(filters).forEach(k => { if (filters[k] != null && filters[k] !== '') q.set(k, filters[k]); });
    return this.http.get<any>(`${this.base}/depreciable-assets?${q.toString()}`);
  }

  runAssetDepreciation(assetId: number, forceOverride = false): Observable<any> {
    return this.http.post<any>(`${this.base}/asset-run`, { assetId, forceOverride });
  }

  getRoundOffImpact(): Observable<any> {
    return this.http.get<any>(`${this.base}/roundoff-impact`);
  }

  getSchedule(assetId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/schedule/${assetId}`);
  }

  getBatchRuns(): Observable<any> {
    return this.http.get<any>(`${this.base}/batch-runs`);
  }

  approveBatchRun(runId: number): Observable<any> {
    return this.http.post<any>(`${this.base}/batch-runs/${runId}/approve`, {});
  }

  rejectBatchRun(runId: number, reason: string): Observable<any> {
    return this.http.post<any>(`${this.base}/batch-runs/${runId}/reject`, { reason });
  }
}
