import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class EWasteService {
  private base = `${environment.apiUrl}/e-waste`;

  constructor(private http: HttpClient) {}

  getAll(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    for (const k of Object.keys(filters)) {
      if (filters[k] != null && filters[k] !== '') params = params.set(k, String(filters[k]));
    }
    return this.http.get<any>(this.base, { params });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}`);
  }

  hodSign(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.base}/${id}/hod-sign`, payload);
  }

  operationsSign(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.base}/${id}/operations-sign`, payload);
  }

  securitySign(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.base}/${id}/security-sign`, payload);
  }

  updateDetails(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.base}/${id}/details`, payload);
  }

  uploadCert(id: number, file: File): Observable<any> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<any>(`${this.base}/${id}/upload-cert`, fd);
  }
}
