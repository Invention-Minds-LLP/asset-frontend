import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

export interface ExportParams {
  startDate?:        string;
  endDate?:          string;
  year?:             number;
  month?:            number;
  financialYear?:    string;   // e.g. "2025-26"
  assetCategoryId?:  number;
  departmentId?:     number;
  branchId?:         number;
  vendorId?:         number;
  assetType?:        string;
}

@Injectable({ providedIn: 'root' })
export class ExportService {
  private readonly base = `${environment.apiUrl}/export`;

  constructor(private http: HttpClient) {}

  /** Calls /api/export/:report with the given filters and returns an .xlsx blob. */
  getBlob(report: string, params: ExportParams = {}): Observable<Blob> {
    let hp = new HttpParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') hp = hp.set(k, String(v));
    }
    return this.http.get(`${this.base}/${report}`, {
      params: hp,
      responseType: 'blob',
    });
  }

  /** Saves the blob as a file in the user's browser. */
  triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}
