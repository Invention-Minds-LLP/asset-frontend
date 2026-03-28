import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class LoginHistoryService {
  private base = `${environment.apiUrl}/login-history`;

  constructor(private http: HttpClient) {}

  getAll(params: any = {}): Observable<any> {
    let q = new URLSearchParams();
    Object.keys(params).forEach(k => { if (params[k] !== null && params[k] !== undefined && params[k] !== '') q.set(k, params[k]); });
    return this.http.get<any>(`${this.base}?${q.toString()}`);
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.base}/stats`);
  }

  exportCsv(params: any = {}): Observable<Blob> {
    let q = new URLSearchParams();
    Object.keys(params).forEach(k => { if (params[k]) q.set(k, params[k]); });
    q.set('exportCsv', 'true');
    return this.http.get(`${this.base}?${q.toString()}`, { responseType: 'blob' });
  }
}
