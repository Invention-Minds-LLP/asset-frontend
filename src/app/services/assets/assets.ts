import { Injectable } from '@angular/core';
import { environment } from '../../../environment/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';



@Injectable({
  providedIn: 'root'
})
export class Assets {

  private assetsUrl = `${environment.apiUrl}/assets`; 
  constructor(private http: HttpClient) {}

  /** GET all assets */
  getAllAssets(): Observable<any[]> {
    return this.http.get<any[]>(`${this.assetsUrl}`);
  }

  /** GET single asset by ID */
  getAssetById(id: number): Observable<any> {
    return this.http.get<any>(`${this.assetsUrl}/${id}`);
  }

  /** POST create new asset */
  createAsset(assetData: any): Observable<any> {
    return this.http.post<any>(`${this.assetsUrl}`, assetData);
  }

  /** PUT update asset by ID */
  updateAsset(id: number, assetData: any): Observable<any> {
    return this.http.put<any>(`${this.assetsUrl}/${id}`, assetData);
  }

  /** DELETE asset by ID */
  deleteAsset(id: number): Observable<void> {
    return this.http.delete<void>(`${this.assetsUrl}/${id}`);
  }

  getCategories() {
    return this.http.get<{ id: number; name: string }[]>(` ${environment.apiUrl}/categories`);
  }

  getDepartments() {
    return this.http.get<{ id: number; name: string }[]>(`${environment.apiUrl}/departments`);
  }

  getEmployees() {
    return this.http.get<{ id: number; name: string; employeeID: string }[]>(`${environment.apiUrl}/employees`);
  }

  getVendors() {
    return this.http.get<{ id: number; name: string }[]>(`${environment.apiUrl}/vendors`);
  }
}
