import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private apiUrl = `${environment.apiUrl}/notifications`;

  constructor(private http: HttpClient) {}

  getMyNotifications(params?: { isRead?: boolean; page?: number; limit?: number }): Observable<any> {
    let query = '';
    if (params) {
      const parts = Object.entries(params)
        .filter(([, v]) => v !== undefined && v !== null)
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      if (parts) query = `?${parts}`;
    }
    return this.http.get<any>(`${this.apiUrl}/my${query}`);
  }

  getUnreadCount(): Observable<{ unreadCount: number }> {
    return this.http.get<{ unreadCount: number }>(`${this.apiUrl}/my/unread-count`);
  }

  getAll(filters?: { type?: string; priority?: string; assetId?: number; ticketId?: number }): Observable<any[]> {
    let query = '';
    if (filters) {
      const parts = Object.entries(filters)
        .filter(([, v]) => v !== undefined && v !== null && v !== '')
        .map(([k, v]) => `${k}=${v}`)
        .join('&');
      if (parts) query = `?${parts}`;
    }
    return this.http.get<any[]>(`${this.apiUrl}${query}`);
  }

  create(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, payload);
  }

  markAsRead(notificationId: number): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${notificationId}/read`, {});
  }

  markAllAsRead(): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/my/read-all`, {});
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getMyPreferences(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/preferences`);
  }

  updateMyPreferences(prefs: any[]): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/preferences`, { preferences: prefs });
  }

  getEmailTemplates(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/email-templates`);
  }

  upsertEmailTemplate(template: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/email-templates`, template);
  }

  getSmtpConfig(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/smtp-config`);
  }

  upsertSmtpConfig(config: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/smtp-config`, config);
  }
}
