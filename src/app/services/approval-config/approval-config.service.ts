import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class ApprovalConfigService {
  private base = `${environment.apiUrl}/approval-config`;

  constructor(private http: HttpClient) {}

  getAll(module?: string): Observable<any[]> {
    let params = new HttpParams();
    if (module) params = params.set('module', module);
    return this.http.get<any[]>(this.base, { params });
  }

  create(payload: any): Observable<any> {
    return this.http.post<any>(this.base, payload);
  }

  update(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/${id}`);
  }

  seedDefaults(): Observable<any> {
    return this.http.post<any>(`${this.base}/seed`, {});
  }

  getRequiredLevel(module: string, amount: number): Observable<any> {
    const params = new HttpParams().set('module', module).set('amount', String(amount));
    return this.http.get<any>(`${this.base}/required-level`, { params });
  }
}
