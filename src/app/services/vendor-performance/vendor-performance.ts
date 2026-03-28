import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class VendorPerformanceService {
  private base = `${environment.apiUrl}/vendor-performance`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.base);
  }

  updateRating(vendorId: number, rating: number): Observable<any> {
    return this.http.put<any>(`${this.base}/${vendorId}/rating`, { rating });
  }
}
