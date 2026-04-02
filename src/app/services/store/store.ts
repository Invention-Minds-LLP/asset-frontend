import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class StoreService {
  private base = `${environment.apiUrl}/store`;

  constructor(private http: HttpClient) {}

  getAll(filters: any = {}): Observable<any[]> {
    return this.http.get<any[]>(this.base, { params: this.buildParams(filters) });
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

  getLocations(storeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/${storeId}/locations`);
  }

  createLocation(storeId: number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}/${storeId}/locations`, payload);
  }

  getHierarchy(): Observable<any> {
    return this.http.get<any>(`${this.base}/hierarchy/tree`);
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
