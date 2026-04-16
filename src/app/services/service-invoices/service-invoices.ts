import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

const BASE = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class ServiceInvoicesService {
  constructor(private http: HttpClient) {}

  getAll(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(k => {
      if (filters[k] !== null && filters[k] !== undefined && filters[k] !== '') {
        params = params.set(k, filters[k]);
      }
    });
    return this.http.get<any>(`${BASE}/service-invoices`, { params });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${BASE}/service-invoices/${id}`);
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${BASE}/service-invoices/stats`);
  }

  create(data: any): Observable<any> {
    return this.http.post<any>(`${BASE}/service-invoices`, data);
  }

  approve(id: number): Observable<any> {
    return this.http.put<any>(`${BASE}/service-invoices/${id}/approve`, {});
  }

  reject(id: number, remarks: string): Observable<any> {
    return this.http.put<any>(`${BASE}/service-invoices/${id}/reject`, { remarks });
  }

  markPaid(id: number, paymentMode: string, paymentRef: string): Observable<any> {
    return this.http.put<any>(`${BASE}/service-invoices/${id}/mark-paid`, { paymentMode, paymentRef });
  }

  uploadDoc(id: number, file: File): Observable<any> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<any>(`${BASE}/service-invoices/${id}/upload`, fd);
  }
}
