import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class TenantConfigService {
  private base = `${environment.apiUrl}/tenant-config`;

  constructor(private http: HttpClient) {}

  getAll(group?: string): Observable<any[]> {
    let params = new HttpParams();
    if (group) {
      params = params.set('group', group);
    }
    return this.http.get<any[]>(this.base, { params });
  }

  getByKey(key: string): Observable<any> {
    return this.http.get<any>(`${this.base}/${key}`);
  }

  update(key: string, payload: any): Observable<any> {
    return this.http.put<any>(`${this.base}/${key}`, payload);
  }

  seedDefaults(): Observable<any> {
    return this.http.post<any>(`${this.base}/seed`, {});
  }
}
