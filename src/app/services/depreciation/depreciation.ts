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

  batchPreview(): Observable<any> {
    return this.http.get<any>(`${this.base}/batch-preview`);
  }

  runBatch(): Observable<any> {
    return this.http.post<any>(`${this.base}/batch-run`, {});
  }
}
