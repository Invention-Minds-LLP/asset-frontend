import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class RcaService {
  private base = `${environment.apiUrl}/rca`;

  constructor(private http: HttpClient) {}

  getAll(params: any = {}): Observable<any> {
    let q = new URLSearchParams();
    Object.keys(params).forEach(k => { if (params[k] != null && params[k] !== '') q.set(k, params[k]); });
    return this.http.get<any>(`${this.base}?${q.toString()}`);
  }

  getByTicket(ticketId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/ticket/${ticketId}`);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}`);
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
}
