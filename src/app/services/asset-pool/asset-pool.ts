import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class AssetPoolService {
  private base = `${environment.apiUrl}/asset-pool`;

  constructor(private http: HttpClient) {}

  getSummary(): Observable<any> {
    return this.http.get<any>(`${this.base}/summary`);
  }

  listPools(params: any = {}): Observable<any> {
    const q = new URLSearchParams();
    Object.keys(params).forEach(k => {
      if (params[k] !== null && params[k] !== undefined && params[k] !== '') q.set(k, params[k]);
    });
    return this.http.get<any>(`${this.base}?${q.toString()}`);
  }

  createPool(data: any): Observable<any> {
    return this.http.post<any>(this.base, data);
  }

  getPool(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}`);
  }

  updatePool(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.base}/${id}`, data);
  }

  addAdjustment(id: number, data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/${id}/adjustment`, data);
  }

  listDepreciationSchedules(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}/depreciation-schedule`);
  }

  addDepreciationSchedule(id: number, data: any): Observable<any> {
    return this.http.post<any>(`${this.base}/${id}/depreciation-schedule`, data);
  }

  getProportionalDep(id: number, assetCost: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}/proportional-dep?assetCost=${assetCost}`);
  }

  getPoolActivity(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}/activity`);
  }

  downloadFaRegisterTemplate(): Observable<Blob> {
    return this.http.get(`${this.base}/fa-register-template`, { responseType: 'blob' });
  }

  importFaRegister(file: File): Observable<any> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<any>(`${this.base}/import-fa-register`, fd);
  }

  downloadIndividualAssetsTemplate(): Observable<Blob> {
    return this.http.get(`${this.base}/individual-assets-template`, { responseType: 'blob' });
  }

  importIndividualAssets(file: File): Observable<any> {
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<any>(`${this.base}/import-individual-assets`, fd);
  }

  resetAllPools(): Observable<any> {
    return this.http.delete<any>(`${this.base}/reset`, {
      headers: { 'x-confirm-reset': 'true' }
    });
  }
}
