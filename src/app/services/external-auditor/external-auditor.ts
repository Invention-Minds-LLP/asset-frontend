import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

export interface ExternalAuditor {
  id: number;
  email: string;
  name: string;
  organization?: string | null;
  phone?: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  addedById: number;
  lastUsedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class ExternalAuditorService {
  private apiUrl = `${environment.apiUrl}/external-auditors`;

  constructor(private http: HttpClient) {}

  list(filters?: { status?: string; search?: string }): Observable<ExternalAuditor[]> {
    let query = '';
    if (filters) {
      const parts = Object.entries(filters)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
        .join('&');
      if (parts) query = `?${parts}`;
    }
    return this.http.get<ExternalAuditor[]>(`${this.apiUrl}${query}`);
  }

  get(id: number): Observable<ExternalAuditor> {
    return this.http.get<ExternalAuditor>(`${this.apiUrl}/${id}`);
  }

  // Email is required on create. Name + organization + phone optional but
  // name is enforced server-side.
  create(payload: {
    email: string;
    name: string;
    organization?: string;
    phone?: string;
  }): Observable<ExternalAuditor> {
    return this.http.post<ExternalAuditor>(this.apiUrl, payload);
  }

  // Email is NOT updatable server-side — it's the login identifier.
  update(id: number, payload: {
    name?: string;
    organization?: string | null;
    phone?: string | null;
    status?: 'ACTIVE' | 'INACTIVE';
  }): Observable<ExternalAuditor> {
    return this.http.put<ExternalAuditor>(`${this.apiUrl}/${id}`, payload);
  }

  // Soft delete — flips status to INACTIVE.
  deactivate(id: number): Observable<ExternalAuditor> {
    return this.http.delete<ExternalAuditor>(`${this.apiUrl}/${id}`);
  }
}
