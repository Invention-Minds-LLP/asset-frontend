import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class QuickActionsService {
  private base = `${environment.apiUrl}/quick-actions`;

  constructor(private http: HttpClient) {}

  duplicateAsset(id: number, data: { assetId: string; serialNumber: string }): Observable<any> {
    return this.http.post<any>(`${this.base}/duplicate-asset/${id}`, data);
  }

  bulkUpdateStatus(payload: { assetIds: number[]; status: string }): Observable<any> {
    return this.http.put<any>(`${this.base}/bulk-status`, payload);
  }

  getQRBulkPrintData(assetIds: number[]): Observable<any[]> {
    return this.http.post<any[]>(`${this.base}/qr-bulk-print`, { assetIds });
  }
}
