import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class KnowledgeBaseService {
  private base = `${environment.apiUrl}/knowledge-base`;

  constructor(private http: HttpClient) {}

  search(query: string, issueType?: string): Observable<any[]> {
    let q = new URLSearchParams();
    q.set('q', query);
    if (issueType) q.set('issueType', issueType);
    return this.http.get<any[]>(`${this.base}/search?${q.toString()}`);
  }

  suggest(params: { issueType?: string; description?: string; assetId?: string }): Observable<any[]> {
    const q = new URLSearchParams();
    if (params.issueType) q.set('issueType', params.issueType);
    if (params.description) q.set('description', params.description);
    if (params.assetId) q.set('assetId', params.assetId);
    return this.http.get<any[]>(`${this.base}/suggest?${q.toString()}`);
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.base}/stats`);
  }
}
