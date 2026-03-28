import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class AuditTrailService {
  private baseUrl = `${environment.apiUrl}/audit-trail`;

  constructor(private http: HttpClient) {}

  getAuditLogs(filters: any = {}): Observable<any> {
    return this.http.get(this.baseUrl, { params: this.buildParams(filters) });
  }

  getAuditLogsByEntity(entityType: string, entityId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${entityType}/${entityId}`);
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
