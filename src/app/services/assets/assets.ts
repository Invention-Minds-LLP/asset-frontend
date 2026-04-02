import { Injectable } from '@angular/core';
import { environment } from '../../../environment/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { HttpParams } from '@angular/common/http';



@Injectable({
  providedIn: 'root'
})
export class Assets {

  private assetsUrl = `${environment.apiUrl}/assets`;
  private subAssetsUrl = `${environment.apiUrl}/sub-assets`;
  private slaUrl = `${environment.apiUrl}/sla`;
  private inventoryUrl =`${environment.apiUrl}/inventory`;
  constructor(private http: HttpClient) { }

  /** GET all assets */
  getAllAssets(): Observable<any[]> {
    return this.http.get<any[]>(`${this.assetsUrl}`);
  }

  /** GET all assets for dropdowns (no role filter — anyone can raise ticket for any asset) */
  getAllAssetsForDropdown(): Observable<any[]> {
    return this.http.get<any[]>(`${this.assetsUrl}/all-dropdown`);
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
    return this.http.get<{ id: number; name: string }[]>(`${environment.apiUrl}/categories`);
  }

  createCategory(data: { name: string }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/categories`, data);
  }

  getDepartments() {
    return this.http.get<{ id: number; name: string }[]>(`${environment.apiUrl}/departments`);
  }

  createDepartment(data: { name: string }): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/departments`, data);
  }


  getEmployees() {
    return this.http.get<{ id: number; name: string; employeeID: string, departmentId: any }[]>(`${environment.apiUrl}/employees`);
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

  deleteVendor(id: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/vendors/${id}`);
  }

  updateCategory(id: number, name: string): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/categories/${id}`, { name });
  }

  deleteCategory(id: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/categories/${id}`);
  }

  updateDepartment(id: number, name: string): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/departments/${id}`, { name });
  }

  deleteDepartment(id: number): Observable<any> {
    return this.http.delete<any>(`${environment.apiUrl}/departments/${id}`);
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
    return this.http.post(`${environment.apiUrl}/insurance`, data);
  }

  updateInsurance(id: number, data: any): Observable<any> {
    return this.http.put(`${environment.apiUrl}/insurance/${id}`, data);
  }

  getInsuranceHistory(id: number): Observable<any> {
    return this.http.get(`${environment.apiUrl}/insurance/asset/${id}`);
  }

  markInsuranceExpired(): Observable<any> {
    return this.http.post(`${environment.apiUrl}/insurance/expire`, {});
  }

  renewInsurance(data: any) {
    return this.http.post(`${environment.apiUrl}/insurance/renew`, data);
  }

  createClaim(data: any) {
    return this.http.post(`${environment.apiUrl}/insurance/claim`, data);
  }

  updateClaim(id: number, data: any) {
    return this.http.put(`${environment.apiUrl}/insurance/claim/${id}`, data);
  }
  getClaims(assetId: number) {
    return this.http.get<any[]>(
      `${environment.apiUrl}/insurance/claims/${assetId}`
    );
  }
  updateAssignment(assetId: number, payload: any) {
    return this.http.patch(
      `${environment.apiUrl}/assets/${assetId}/assignment`,
      payload
    );
  }
  initiateHodAck(assetId: number, payload: { departmentId: number; conditionAtHandover?: string }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/assignments/${assetId}/initiate-hod-ack`, payload);
  }

  hodAssignSupervisor(assetId: number, payload: { supervisorId: number; conditionAtHandover?: string }): Observable<any> {
    return this.http.post(`${environment.apiUrl}/assignments/${assetId}/assign/supervisor`, payload);
  }

  // ✅ target dept flow
  supervisorAssignTargetDepartment(
    assetId: number,
    payload: { targetDepartmentId: number; conditionAtHandover?: string }
  ): Observable<any> {
    return this.http.post(`${environment.apiUrl}/assignments/${assetId}/assign/target-department`, payload);
  }

  targetHodAssignEndUser(
    assetId: number,
    payload: { allottedToId?: number; skipEndUser?: boolean; conditionAtHandover?: string }
  ): Observable<any> {
    return this.http.post(`${environment.apiUrl}/assignments/${assetId}/assign/target-end-user`, payload);
  }

  // optional: no-target direct end user
  supervisorAssignEndUser(
    assetId: number,
    payload: { allottedToId?: number; skipEndUser?: boolean; conditionAtHandover?: string }
  ): Observable<any> {
    return this.http.post(`${environment.apiUrl}/assignments/${assetId}/assign/end-user`, payload);
  }

  getAssignmentState(assetId: number): Observable<any> {
    return this.http.get(`${environment.apiUrl}/assignments/${assetId}/assignments/state`);
  }

  getAssetAssignmentHistory(assetId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/assignments/${assetId}/assignments/history`);
  }

  getMyPendingAcknowledgements(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/assignments/my/pending`);
  }

  acknowledgeAssignment(assignmentId: number, payload: FormData) {
    return this.http.post(
      `${environment.apiUrl}/assignments/${assignmentId}/acknowledge`,
      payload
    );
  }

  rejectAssignment(assignmentId: number, payload: { rejectionReason?: string | null }) {
    return this.http.post(`${environment.apiUrl}/assignments/${assignmentId}/reject`, payload);
  }

  getAssignmentChecklist(assignmentId: number): Observable<any> {
  return this.http.get<any>(
    `${environment.apiUrl}/assignments/${assignmentId}/checklist`
  );
}
  getParentOptions(q: string, excludeAssetId?: string): Observable<{ label: string; value: string }[]> {
    let params = new HttpParams().set("q", q || "");
    if (excludeAssetId) params = params.set("excludeAssetId", excludeAssetId);
    return this.http.get<{ label: string; value: string }[]>(`${this.subAssetsUrl}/parent-options`, { params });
  }
  getChildren(assetId: string): Observable<any> {
    return this.http.get(`${this.subAssetsUrl}/${assetId}/children`);
  }

  getTree(assetId: string): Observable<any> {
    return this.http.get(`${this.subAssetsUrl}/${assetId}/tree`);
  }

  linkParent(childAssetId: string, parentAssetId: string | null): Observable<any> {
    return this.http.patch(`${this.subAssetsUrl}/${childAssetId}/link-parent`, { parentAssetId });
  }
  createSubAsset(parentAssetId: string, payload: any): Observable<any> {
    return this.http.post(`${this.subAssetsUrl}/${parentAssetId}/sub-assets`, payload);
  }

  replaceSubAsset(parentAssetId: string, oldSubAssetId: string, payload: any): Observable<any> {
    return this.http.post(`${this.subAssetsUrl}/${parentAssetId}/sub-assets/${oldSubAssetId}/replace`, payload);
  }

  getReplacementHistory(parentAssetId: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.subAssetsUrl}/${parentAssetId}/replacement-history`);
  }
  getSpecifications(assetId: number) {
    return this.http.get<any[]>(`${this.assetsUrl}/${assetId}/specifications`);
  }

  createSpecification(payload: any) {
    return this.http.post(`${this.assetsUrl}/specifications`, payload);
  }

  updateSpecification(id: number, payload: any) {
    return this.http.put(`${this.assetsUrl}/specifications/${id}`, payload);
  }

  getAssetScanDetails(assetId: string): Observable<any> {
    return this.http.get<any>(
      `${this.assetsUrl}/scan/${encodeURIComponent(assetId)}`
    );
  }

  searchSpareParts(query: string) {
    return this.http.get<{ label: string; value: number }[]>(
      `${environment.apiUrl}/sub-assets/options?q=${encodeURIComponent(query)}`
    );
  }

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.slaUrl);
  }

  getByCategory(assetCategoryId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.slaUrl}/category/${assetCategoryId}`);
  }

  getCategoriesByCategory(assetCategoryId: number): Observable<{ slaCategory: string }[]> {
    return this.http.get<{ slaCategory: string }[]>(
      `${this.slaUrl}/category/${assetCategoryId}/categories`
    );
  }

  getByCategoryAndSla(assetCategoryId: number, slaCategory: string): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.slaUrl}/category/${assetCategoryId}/sla/${slaCategory}`
    );
  }

  create(payload: Partial<any>) {
    return this.http.post(this.slaUrl, payload);
  }

  update(id: number, payload: Partial<any>) {
    return this.http.put(`${this.slaUrl}/${id}`, payload);
  }

  delete(id: number) {
    return this.http.delete(`${this.slaUrl}/${id}`);
  }
  // ================= SPARE PARTS =================
  getAllSpareParts() {
    return this.http.get<any[]>(`${this.inventoryUrl}/spare-parts`);
  }

  createSparePart(payload: any) {
    return this.http.post(`${this.inventoryUrl}/spare-parts`, payload);
  }

  updateSparePart(id: number, payload: any) {
    return this.http.put(`${this.inventoryUrl}/spare-parts/${id}`, payload);
  }

  deleteSparePart(id: number) {
    return this.http.delete(`${this.inventoryUrl}/spare-parts/${id}`);
  }

  // ================= CONSUMABLES =================
  getAllConsumables() {
    return this.http.get<any[]>(`${this.inventoryUrl}/consumables`);
  }

  createConsumable(payload: any) {
    return this.http.post(`${this.inventoryUrl}/consumables`, payload);
  }

  updateConsumable(id: number, payload: any) {
    return this.http.put(`${this.inventoryUrl}/consumables/${id}`, payload);
  }

  deleteConsumable(id: number) {
    return this.http.delete(`${this.inventoryUrl}/consumables/${id}`);
  }

  hodApproveAsset(id: number, payload: { decision: string; remarks?: string }): Observable<any> {
    return this.http.post(`${this.assetsUrl}/${id}/hod-approval`, payload);
  }

  getDepartmentAssets(departmentId: number, params?: { status?: string; category?: string }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.status) httpParams = httpParams.set('status', params.status);
    if (params?.category) httpParams = httpParams.set('category', params.category);
    return this.http.get(`${environment.apiUrl}/departments/${departmentId}/assets`, { params: httpParams });
  }

  getEmployeeAssets(employeeId: number): Observable<any> {
    return this.http.get(`${environment.apiUrl}/employees/${employeeId}/assets`);
  }
}