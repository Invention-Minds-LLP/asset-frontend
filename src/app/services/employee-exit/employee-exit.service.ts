import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class EmployeeExitService {
  private base = `${environment.apiUrl}/employee-exit`;

  constructor(private http: HttpClient) {}

  getAll(filters: any = {}): Observable<any[]> {
    let params = new HttpParams();
    for (const k of Object.keys(filters)) {
      if (filters[k] !== null && filters[k] !== undefined && filters[k] !== '') {
        params = params.set(k, String(filters[k]));
      }
    }
    return this.http.get<any[]>(this.base, { params });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}`);
  }

  getByEmployee(employeeId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/employee/${employeeId}`);
  }

  initiate(payload: any): Observable<any> {
    return this.http.post<any>(this.base, payload);
  }

  returnAsset(exitId: number, payload: any): Observable<any> {
    return this.http.patch<any>(`${this.base}/${exitId}/return-asset`, payload);
  }

  complete(exitId: number): Observable<any> {
    return this.http.patch<any>(`${this.base}/${exitId}/complete`, {});
  }
}
