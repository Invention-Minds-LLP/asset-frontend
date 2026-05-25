import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

export interface ImportResponse {
  message: string;
  summary: any;
  error?: string;
  results?: SubAssetRowResult[];
}

export interface SubAssetRowResult {
  row: number;
  parentAssetId: string;
  serialNumber: string;
  status: 'CREATED' | 'SKIPPED' | 'ERROR';
  subAssetId?: string;
  reason?: string;
  flagged?: boolean; // created but value >= 40% of parent
}

export interface LocationRowResult {
  row: number;
  assetId: string;
  status: 'UPDATED' | 'ERROR';
  reason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ImportExcel {

  private http = inject(HttpClient);

  // Change this if you use full backend URL
  private baseUrl = `${environment.apiUrl}/import`;

  uploadAssetsWorkbook(file: File): Observable<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ImportResponse>(`${this.baseUrl}/import-excel`, formData);
  }

  uploadChecklistWorkbook(file: File): Observable<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);

    return this.http.post<ImportResponse>(`${this.baseUrl}/checklists/import-workbook`, formData);
  }

  downloadLegacyTemplate(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/legacy-template`, { responseType: 'blob' });
  }

  downloadChecklistTemplate(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/checklists/template`, { responseType: 'blob' });
  }

  uploadSubAssetsWorkbook(file: File): Observable<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImportResponse>(`${this.baseUrl}/sub-assets-excel`, formData);
  }

  downloadSubAssetTemplate(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/sub-assets-template`, { responseType: 'blob' });
  }

  uploadLocationsWorkbook(file: File): Observable<ImportResponse> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<ImportResponse>(`${this.baseUrl}/locations-excel`, formData);
  }

  downloadLocationTemplate(): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/locations-template`, { responseType: 'blob' });
  }
}
