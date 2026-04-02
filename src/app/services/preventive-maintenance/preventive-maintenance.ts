import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class PreventiveMaintenanceService {
  private base = `${environment.apiUrl}/preventive-maintenance`;

  constructor(private http: HttpClient) {}

  getCalendar(month: number, year: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/calendar?month=${month}&year=${year}`);
  }

  getAllSchedules(): Observable<any> {
    return this.http.get<any>(`${this.base}/schedule`);
  }

  getDueSchedules(): Observable<any> {
    return this.http.get<any>(`${this.base}/schedule/due`);
  }

  createSchedule(payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}/schedule`, payload);
  }

  updateSchedule(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.base}/schedule/${id}`, data);
  }

  reschedule(id: number, newDueDate: string, reason: string): Observable<any> {
    return this.http.put<any>(`${this.base}/schedule/${id}/reschedule`, { newDueDate, reason });
  }

  executeMaintenance(payload: any): Observable<any> {
    return this.http.post<any>(`${this.base}/execute`, payload);
  }

  getAllHistory(params: any = {}): Observable<any> {
    let q = new URLSearchParams();
    Object.keys(params).forEach(k => { if (params[k] !== null && params[k] !== undefined && params[k] !== '') q.set(k, params[k]); });
    return this.http.get<any>(`${this.base}/history/all?${q.toString()}`);
  }
}
