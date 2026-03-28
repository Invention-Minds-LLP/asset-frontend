import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment.prod';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ServiceContract {

  private base = `${environment.apiUrl}/service-contracts`;

  constructor(private http: HttpClient) { }

  getByAssetId(assetId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/asset/${assetId}`);
  }

  create(payload: any): Observable<any> {
    return this.http.post<any>(this.base, payload);
  }

  update(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.base}/${id}`, payload);
  }
  uploadDocument(assetId: string, file: File) {
    const fd = new FormData();
    fd.append("assetId", assetId);
    fd.append("file", file);
    return this.http.post<{ url: string }>(`${this.base}/service-contracts/upload-doc`, fd);
  }

  getAllPaginated(params: any = {}): Observable<any> {
    let q = new URLSearchParams();
    Object.keys(params).forEach(k => { if (params[k] !== null && params[k] !== undefined && params[k] !== '') q.set(k, params[k]); });
    return this.http.get<any>(`${this.base}/all?${q.toString()}`);
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.base}/stats`);
  }

  exportCsv(params: any = {}): Observable<Blob> {
    let q = new URLSearchParams();
    Object.keys(params).forEach(k => { if (params[k]) q.set(k, params[k]); });
    q.set('exportCsv', 'true');
    return this.http.get(`${this.base}/all?${q.toString()}`, { responseType: 'blob' });
  }
}
