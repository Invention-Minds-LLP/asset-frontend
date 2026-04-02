import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class PmChecklistService {
  private base = `${environment.apiUrl}/pm-checklist`;
  constructor(private http: HttpClient) {}

  getTemplates(): Observable<any> { return this.http.get(this.base + '/template'); }
  createTemplate(payload: any): Observable<any> { return this.http.post(this.base + '/template', payload); }
  addItems(templateId: number, items: any[]): Observable<any> { return this.http.post(`${this.base}/template/${templateId}/items`, { items }); }
  createRun(payload: any): Observable<any> { return this.http.post(this.base + '/run', payload); }
  submitRun(runId: number, results: any[]): Observable<any> { return this.http.post(`${this.base}/run/${runId}/submit`, { results }); }
  getRunsByAsset(assetId: number): Observable<any> { return this.http.get(`${this.base}/run/asset/${assetId}`); }
  getRunById(id: number): Observable<any> { return this.http.get(`${this.base}/run/${id}`); }
  getRunPdfUrl(runId: number): string { return `${this.base}/run/${runId}/pdf`; }
}
