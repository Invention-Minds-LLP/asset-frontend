import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class GensetLogService {
  private base = `${environment.apiUrl}/genset-log`;

  constructor(private http: HttpClient) {}

  getAll(filters: any = {}): Observable<any[]> {
    let params = new HttpParams();
    for (const k of Object.keys(filters)) {
      if (filters[k] != null && filters[k] !== '') params = params.set(k, String(filters[k]));
    }
    return this.http.get<any[]>(this.base, { params });
  }

  create(payload: any): Observable<any> {
    return this.http.post<any>(this.base, payload);
  }

  update(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.base}/${id}`, payload);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
