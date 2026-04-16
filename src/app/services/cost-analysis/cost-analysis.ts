import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class CostAnalysisService {
  private base = `${environment.apiUrl}/cost-analysis`;

  constructor(private http: HttpClient) {}

  getAnalysis(assetDbId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${assetDbId}`);
  }

  getDepreciationAlerts(): Observable<any> {
    return this.http.get<any>(`${this.base}/alerts`);
  }

  getRevenueEntries(assetDbId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${assetDbId}/revenue`);
  }

  addRevenueEntry(assetDbId: number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}/${assetDbId}/revenue`, payload);
  }

  deleteRevenueEntry(entryId: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/revenue/${entryId}`);
  }

  getAllocations(assetDbId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${assetDbId}/allocations`);
  }

  addAllocation(assetDbId: number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}/${assetDbId}/allocations`, payload);
  }

  updateAllocation(entryId: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.base}/allocations/${entryId}`, payload);
  }

  deleteAllocation(entryId: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/allocations/${entryId}`);
  }
}
