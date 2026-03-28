import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class ModuleAccessService {
  private base = `${environment.apiUrl}/module-access`;

  constructor(private http: HttpClient) {}

  // ── Seed ──────────────────────────────────────────────────────────────────
  seedModules(): Observable<any> {
    return this.http.post(`${this.base}/seed`, {});
  }

  // ── Modules ───────────────────────────────────────────────────────────────
  getModules(): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/modules`);
  }

  createModule(data: any): Observable<any> {
    return this.http.post(`${this.base}/modules`, data);
  }

  updateModule(id: number, data: any): Observable<any> {
    return this.http.put(`${this.base}/modules/${id}`, data);
  }

  deleteModule(id: number): Observable<any> {
    return this.http.delete(`${this.base}/modules/${id}`);
  }

  // ── Module Items ──────────────────────────────────────────────────────────
  addModuleItem(moduleId: number, data: any): Observable<any> {
    return this.http.post(`${this.base}/modules/${moduleId}/items`, data);
  }

  updateModuleItem(moduleId: number, itemId: number, data: any): Observable<any> {
    return this.http.put(`${this.base}/modules/${moduleId}/items/${itemId}`, data);
  }

  deleteModuleItem(moduleId: number, itemId: number): Observable<any> {
    return this.http.delete(`${this.base}/modules/${moduleId}/items/${itemId}`);
  }

  // ── Permissions ───────────────────────────────────────────────────────────
  getPermissions(filters?: { role?: string; employeeId?: number }): Observable<any[]> {
    let url = `${this.base}/permissions`;
    const params: string[] = [];
    if (filters?.role)       params.push(`role=${filters.role}`);
    if (filters?.employeeId) params.push(`employeeId=${filters.employeeId}`);
    if (params.length)       url += '?' + params.join('&');
    return this.http.get<any[]>(url);
  }

  setPermission(data: any): Observable<any> {
    return this.http.post(`${this.base}/permissions`, data);
  }

  bulkSetPermissions(permissions: any[]): Observable<any> {
    return this.http.post(`${this.base}/permissions/bulk`, { permissions });
  }

  deletePermission(id: number): Observable<any> {
    return this.http.delete(`${this.base}/permissions/${id}`);
  }

  // ── My Access ─────────────────────────────────────────────────────────────
  getMyAccess(): Observable<any> {
    return this.http.get<any>(`${this.base}/my-access`);
  }
}
