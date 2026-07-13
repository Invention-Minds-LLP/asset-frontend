import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class LocationApprovalService {
  private api = `${environment.apiUrl}/location-approval`;

  constructor(private http: HttpClient) {}

  // Changes awaiting the current user's approval (HOD or management tier).
  getPending(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.api}/pending`);
  }

  // The current user's own submitted changes + their status.
  getMyRequests(): Observable<{ data: any[] }> {
    return this.http.get<{ data: any[] }>(`${this.api}/my-requests`);
  }

  approve(id: number, reason?: string): Observable<any> {
    return this.http.post<any>(`${this.api}/${id}/approve`, { reason: reason || null });
  }

  reject(id: number, reason?: string): Observable<any> {
    return this.http.post<any>(`${this.api}/${id}/reject`, { reason: reason || null });
  }
}
