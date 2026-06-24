import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environment/environment.prod';
import { Observable } from 'rxjs';

export type EmployeeRole = 'HOD' | 'SUPERVISOR' | 'EXECUTIVE' | 'ADMIN' | 'CEO_COO' | 'FINANCE' | 'OPERATIONS' | 'CFO';

export interface EmployeeCreatePayload {
  name: string;
  employeeID: string;
  departmentId: number | null;
  role: EmployeeRole;
  designation?: string | null;
  email?: string | null;
  phone?: string | null;
  reportingToId?: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class Employees {


  private base = `${environment.apiUrl}/employees`;

  constructor(private http: HttpClient) { }

  getEmployees(): Observable<any[]> {
    return this.http.get<any[]>(this.base);
  }

  createEmployee(payload: EmployeeCreatePayload): Observable<any> {
    return this.http.post(this.base, payload);
  }

  updateEmployee(id: number, payload: Partial<EmployeeCreatePayload>): Observable<any> {
    return this.http.put(`${this.base}/${id}`, payload);
  }

  deleteEmployee(id: number): Observable<any> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
