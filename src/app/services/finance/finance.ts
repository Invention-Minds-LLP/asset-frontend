import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private base = `${environment.apiUrl}/finance`;

  constructor(private http: HttpClient) {}

  // Config
  getConfig(): Observable<any> { return this.http.get(`${this.base}/config`); }
  updateConfig(data: any): Observable<any> { return this.http.put(`${this.base}/config`, data); }

  // GL Mappings
  getGLMappings(): Observable<any[]> { return this.http.get<any[]>(`${this.base}/gl-mappings`); }
  getGLMapping(categoryId: number): Observable<any> { return this.http.get(`${this.base}/gl-mappings/${categoryId}`); }
  upsertGLMapping(categoryId: number, data: any): Observable<any> { return this.http.put(`${this.base}/gl-mappings/${categoryId}`, data); }

  // Vouchers
  getVouchers(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(k => { if (filters[k] != null && filters[k] !== '') params = params.set(k, filters[k]); });
    return this.http.get(`${this.base}/vouchers`, { params });
  }
  getVoucher(id: number): Observable<any> { return this.http.get(`${this.base}/vouchers/${id}`); }
  createVoucher(data: any): Observable<any> { return this.http.post(`${this.base}/vouchers`, data); }
  approveVoucher(id: number): Observable<any> { return this.http.post(`${this.base}/vouchers/${id}/approve`, {}); }
  rejectVoucher(id: number, reason: string): Observable<any> { return this.http.post(`${this.base}/vouchers/${id}/reject`, { reason }); }
  voidVoucher(id: number): Observable<any> { return this.http.post(`${this.base}/vouchers/${id}/void`, {}); }

  // Ledger / Reporting
  getTrialBalance(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    return this.http.get(`${this.base}/trial-balance`, { params });
  }
  getAssetCostLedger(assetId: number): Observable<any> { return this.http.get(`${this.base}/asset-cost-ledger/${assetId}`); }
  getDepartmentCostSummary(fiscalYear?: number): Observable<any[]> {
    let params = new HttpParams();
    if (fiscalYear) params = params.set('fiscalYear', fiscalYear);
    return this.http.get<any[]>(`${this.base}/department-cost-summary`, { params });
  }

  // Capex Budgets
  getCapexBudgets(fiscalYear?: number): Observable<any> {
    let params = new HttpParams();
    if (fiscalYear) params = params.set('fiscalYear', fiscalYear);
    return this.http.get(`${this.base}/capex-budgets`, { params });
  }
  createCapexBudget(data: any): Observable<any> { return this.http.post(`${this.base}/capex-budgets`, data); }
  updateCapexBudget(id: number, data: any): Observable<any> { return this.http.put(`${this.base}/capex-budgets/${id}`, data); }
  refreshCapexActuals(fiscalYear?: number): Observable<any> {
    let params = new HttpParams();
    if (fiscalYear) params = params.set('fiscalYear', fiscalYear);
    return this.http.post(`${this.base}/capex-budgets/refresh-actuals`, {}, { params });
  }

  // Export Centre
  getExportBatches(): Observable<any[]> { return this.http.get<any[]>(`${this.base}/export-batches`); }
  createExportBatch(data: any): Observable<any> { return this.http.post(`${this.base}/export-batches`, data); }
  downloadExportBatch(id: number): Observable<Blob> {
    return this.http.get(`${this.base}/export-batches/${id}/download`, { responseType: 'blob' });
  }

  // Chart of Accounts
  getChartOfAccounts(): Observable<any[]> { return this.http.get<any[]>(`${this.base}/chart-of-accounts`); }
  updateExternalCodes(id: number, data: any): Observable<any> { return this.http.put(`${this.base}/chart-of-accounts/${id}/external-codes`, data); }

  // Manual Ledger
  getManualLedger(filters: any = {}): Observable<any[]> {
    let params = new HttpParams();
    if (filters.from) params = params.set('from', filters.from);
    if (filters.to) params = params.set('to', filters.to);
    return this.http.get<any[]>(`${this.base}/manual-ledger`, { params });
  }
  createManualLedger(data: any): Observable<any> { return this.http.post(`${this.base}/manual-ledger`, data); }
  deleteManualLedger(id: number): Observable<any> { return this.http.delete(`${this.base}/manual-ledger/${id}`); }
}
