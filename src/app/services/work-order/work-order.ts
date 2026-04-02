import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class WorkOrderService {
  private base = `${environment.apiUrl}/work-order`;

  constructor(private http: HttpClient) {}

  getAll(filters: any = {}): Observable<any> {
    return this.http.get<any>(this.base, { params: this.buildParams(filters) });
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

  approve(id: number, payload: any): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}/approve`, payload);
  }

  start(id: number): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}/start`, {});
  }

  issueMaterial(id: number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}/${id}/issue-material`, payload);
  }

  complete(id: number): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}/complete`, {});
  }

  issueWCC(id: number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}/${id}/wcc`, payload);
  }

  close(id: number): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}/close`, {});
  }

  cancel(id: number): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}/cancel`, {});
  }

  private buildParams(obj: any): HttpParams {
    let params = new HttpParams();
    for (const key of Object.keys(obj)) {
      if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
        params = params.set(key, String(obj[key]));
      }
    }
    return params;
  }
}
