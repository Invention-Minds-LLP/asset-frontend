import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class GlobalSearchService {
  private base = `${environment.apiUrl}/global-search`;

  constructor(private http: HttpClient) {}

  search(q: string, limit: number = 10): Observable<any> {
    return this.http.get<any>(`${this.base}?q=${encodeURIComponent(q)}&limit=${limit}`);
  }
}
