import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

const BASE = `${environment.apiUrl}/legacy-migration`;

@Injectable({ providedIn: 'root' })
export class LegacyMigrationService {
  constructor(private http: HttpClient) {}

  list(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(k => {
      if (filters[k] !== null && filters[k] !== undefined && filters[k] !== '')
        params = params.set(k, filters[k]);
    });
    return this.http.get(`${BASE}/list`, { params });
  }

  migrateSingle(payload: any): Observable<any> {
    return this.http.post(`${BASE}/single`, payload);
  }

  migrateBulk(payload: any): Observable<any> {
    return this.http.post(`${BASE}/bulk`, payload);
  }

  migrateProportional(payload: any): Observable<any> {
    return this.http.post(`${BASE}/proportional`, payload);
  }

  revert(assetId: number): Observable<any> {
    return this.http.delete(`${BASE}/${assetId}`);
  }
}
