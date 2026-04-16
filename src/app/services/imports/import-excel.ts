import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

export interface ImportResponse {
  message: string;
  summary: any;
  error?: string;
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
}
