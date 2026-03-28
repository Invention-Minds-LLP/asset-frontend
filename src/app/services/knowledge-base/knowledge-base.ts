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

  suggest(keywords: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/suggest?keywords=${encodeURIComponent(keywords)}`);
  }

  getStats(): Observable<any> {
    return this.http.get<any>(`${this.base}/stats`);
  }
}
