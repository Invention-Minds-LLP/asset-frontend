import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';
export interface UserCreatePayload {
  username: string;
  password: string;
  role: string;
  employeeID: string;
}

@Injectable({
  providedIn: 'root'
})
export class Auth {


  private apiUrl = `${environment.apiUrl}/users`; // Update this with your actual backend endpoint

  constructor(private http: HttpClient) { }
  private base = `${environment.apiUrl}/users`;

  login(employeeId: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, {
      employeeId,
      password,
    });
  }
  isLoggedIn(): boolean {
    console.log("token", localStorage.getItem('authToken'))
    return typeof window !== 'undefined' && localStorage.getItem('authToken') !== null;; // Return false if localStorage is not available

  }
  // Save token and user details
  saveAuth(token: string, user: any) {
    localStorage.setItem("token", token);
    localStorage.setItem("role", user.role);
    localStorage.setItem("employeeDbId", user.employeeDbId);
    localStorage.setItem("departmentId", user.departmentId);
    localStorage.setItem("name", user.name)
  }

  getRole(): string {
    return localStorage.getItem("role") || "";
  }

  getToken(): string {
    return localStorage.getItem("token") || "";
  }

  logout() {
    localStorage.clear();
  }
  resetPassword(employeeID: string, newPassword: string): Observable<any> {
    return this.http.put(`${this.base}/reset-password`, { employeeID, newPassword });
  }
  getUsers(): Observable<any[]> {
    return this.http.get<any[]>(this.base);
  }

  createUser(payload: UserCreatePayload): Observable<any> {
    return this.http.post<any>(this.base, payload);
  }

  deleteUser(id: number): Observable<any> {
    return this.http.delete(`${this.base}/${id}`);
  }
}
