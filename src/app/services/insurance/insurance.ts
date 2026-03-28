import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class InsuranceService {
  private base = `${environment.apiUrl}/insurance`;

  constructor(private http: HttpClient) {}

  getAllPolicies(params: any = {}): Observable<any> {
    let q = new URLSearchParams();
    Object.keys(params).forEach(k => { if (params[k] !== null && params[k] !== undefined && params[k] !== '') q.set(k, params[k]); });
    return this.http.get<any>(`${this.base}/all?${q.toString()}`);
  }

  getAllClaims(params: any = {}): Observable<any> {
    let q = new URLSearchParams();
    Object.keys(params).forEach(k => { if (params[k] !== null && params[k] !== undefined && params[k] !== '') q.set(k, params[k]); });
    return this.http.get<any>(`${this.base}/claims/all?${q.toString()}`);
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.base}/stats`);
  }

  exportPoliciesCsv(params: any = {}): Observable<Blob> {
    let q = new URLSearchParams();
    Object.keys(params).forEach(k => { if (params[k]) q.set(k, params[k]); });
    q.set('exportCsv', 'true');
    return this.http.get(`${this.base}/all?${q.toString()}`, { responseType: 'blob' });
  }

  exportClaimsCsv(params: any = {}): Observable<Blob> {
    let q = new URLSearchParams();
    Object.keys(params).forEach(k => { if (params[k]) q.set(k, params[k]); });
    q.set('exportCsv', 'true');
    return this.http.get(`${this.base}/claims/all?${q.toString()}`, { responseType: 'blob' });
  }
}
