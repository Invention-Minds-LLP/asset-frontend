import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class DisposalService {
  private baseUrl = `${environment.apiUrl}/disposal`;

  constructor(private http: HttpClient) {}

  getAll(filters: any = {}): Observable<any> {
    return this.http.get(this.baseUrl, { params: this.buildParams(filters) });
  }

  getById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  request(payload: any): Observable<any> {
    return this.http.post(this.baseUrl, payload);
  }

  review(id: number, payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/review`, payload);
  }

  approve(id: number, payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/approve`, payload);
  }

  reject(id: number, payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/reject`, payload);
  }

  complete(id: number, payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/complete`, payload);
  }

  getSubAssets(disposalId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${disposalId}/sub-assets`);
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
