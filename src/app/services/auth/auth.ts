import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class Auth {


  private apiUrl = `${environment.apiUrl}/users`; // Update this with your actual backend endpoint

  constructor(private http: HttpClient) {}

  login(employeeId: string, password: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/login`, {
      employeeId,
      password,
    });
  }
  isLoggedIn(): boolean {
    console.log("token",localStorage.getItem('authToken'))
    return typeof window !== 'undefined' && localStorage.getItem('authToken') !== null;; // Return false if localStorage is not available
  
  }
}
