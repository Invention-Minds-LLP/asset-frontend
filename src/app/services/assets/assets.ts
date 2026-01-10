import { Injectable } from '@angular/core';
import { environment } from '../../../environment/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';



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

  getAssetByAssetId(assetId: string): Observable<any> {
    return this.http.get<any>(`${this.assetsUrl}/${assetId}`);
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

  createCategory(data: { name: string }): Observable<any> {
    return this.http.post<any>(` ${environment.apiUrl}/categories`, data);
  }
  
  getDepartments() {
    return this.http.get<{ id: number; name: string }[]>(`${environment.apiUrl}/departments`);
  }
  
  createDepartment(data: { name: string }): Observable<any> {
    return this.http.post<any>(` ${environment.apiUrl}/departments`, data);
  }
  

  getEmployees() {
    return this.http.get<{ id: number; name: string; employeeID: string, departmentId:any }[]>(`${environment.apiUrl}/employees`);
  }

  getVendors() {
    return this.http.get<{ id: number; name: string }[]>(`${environment.apiUrl}/vendors`);
  }

  createVendor(data: { name: string; contact: string; email: string }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/vendors`, data);
  }

  updateVendor(id: number, data: { name?: string; contact?: string; email?: string }): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/vendors/${id}`, data);
  }

  uploadAssetImage(file: File, assetId: string): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
  
    return this.http.post<{ url: string }>(`${this.assetsUrl}/${assetId}/upload-image`, formData).pipe(
      map((response: { url: string }) => response.url)
    );
  }
  getDepartmentNameByEmployeeID(employeeID: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/employees/${employeeID}/department`);
  }
   // ------------------------------
  // INSURANCE DOCUMENT UPLOAD
  // ------------------------------
  uploadInsuranceDocument(insuranceId: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append("document", file);

    return this.http.post(
      `${environment.apiUrl}//insurance/insurance/${insuranceId}/upload`,
      formData
    );
  }
  // ------------------------------
// DEPRECIATION API
// ------------------------------
addDepreciation(assetId: number, data: any): Observable<any> {
  return this.http.post(`${environment.apiUrl}/depreciation/assets/${assetId}/depreciation`, data);
}

updateDepreciation(id: number, data: any): Observable<any> {
  return this.http.put(`${environment.apiUrl}/depreciation/depreciation/${id}`, data);
}

calculateDepreciation(assetId: number): Observable<any> {
  return this.http.get(`${environment.apiUrl}/depreciation/assets/${assetId}/depreciation/calc`);
}

runAnnualDepreciation(): Observable<any> {
  return this.http.post(`${environment.apiUrl}/depreciation/depreciation/run-batch`, {});
}
// ------------------------------
// INSURANCE API
// ------------------------------
addInsurance(data: any): Observable<any> {
  return this.http.post(`${environment.apiUrl}/insurance/insurance`, data);
}

updateInsurance(id: number, data: any): Observable<any> {
  return this.http.put(`${environment.apiUrl}/insurance/insurance/${id}`, data);
}

getInsuranceHistory(assetId: number): Observable<any> {
  return this.http.get(`${environment.apiUrl}/insurance/insurance/history/${assetId}`);
}

markInsuranceExpired(): Observable<any> {
  return this.http.post(`${environment.apiUrl}/insurance/insurance/expire`, {});
}

updateAssignment(assetId: number, payload: any) {
  return this.http.patch(
    `${environment.apiUrl}/assets/${assetId}/assignment`,
    payload
  );
}


  
}
