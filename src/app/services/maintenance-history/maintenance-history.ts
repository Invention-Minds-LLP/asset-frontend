import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment.prod';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MaintenanceHistory {

  private base = `${environment.apiUrl}/maintenance-history`;

  constructor(private http: HttpClient) { }

  getByAssetId(assetId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/${assetId}`);
  }

  uploadReport(formData: FormData): Observable<any> {
    return this.http.post<any>(`${this.base}/upload-report`, formData);
  }

}
