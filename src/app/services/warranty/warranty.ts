import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class Warranty {
  private apiUrl =  `${environment.apiUrl}/warranties`;  // Adjust base URL if needed

  constructor(private http: HttpClient) {}

  // Create a new warranty
  createWarranty(warrantyData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}`, warrantyData);
  }

  // Get all warranties
  getAllWarranties(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}`);
  }

  // Get a specific warranty by ID
  getWarrantyById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  // Update a warranty by ID
  updateWarranty(id: number, warrantyData: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, warrantyData);
  }

  // Delete a warranty by ID
  deleteWarranty(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getWarrantyByAssetId(assetId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/by-asset/${assetId}`);
  }

  saveMaintenanceHistoryWithFile(formData: FormData) {
    return this.http.post(`${environment.apiUrl}/maintenance-history/upload-report`, formData);
  }
  getMaintenanceHistory(assetId: string) {
    return this.http.get<any[]>(`${environment.apiUrl}/maintenance-history/${assetId}`);
  }
  
  
}
