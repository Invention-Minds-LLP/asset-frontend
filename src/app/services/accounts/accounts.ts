import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

const BASE = environment.apiUrl;

@Injectable({ providedIn: 'root' })
export class AccountsService {
  constructor(private http: HttpClient) {}

  // ── Chart of Accounts ─────────────────────────────────────────────────────
  getAllAccounts(): Observable<any[]> {
    return this.http.get<any[]>(`${BASE}/accounts/chart-of-accounts`);
  }
  getAccountsDropdown(): Observable<any[]> {
    return this.http.get<any[]>(`${BASE}/accounts/chart-of-accounts/dropdown`);
  }
  getAccountById(id: number): Observable<any> {
    return this.http.get<any>(`${BASE}/accounts/chart-of-accounts/${id}`);
  }
  createAccount(data: any): Observable<any> {
    return this.http.post<any>(`${BASE}/accounts/chart-of-accounts`, data);
  }
  updateAccount(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${BASE}/accounts/chart-of-accounts/${id}`, data);
  }
  deleteAccount(id: number): Observable<any> {
    return this.http.delete<any>(`${BASE}/accounts/chart-of-accounts/${id}`);
  }

  // ── Purchase Vouchers ─────────────────────────────────────────────────────
  getPurchaseVouchers(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(k => { if (filters[k] !== null && filters[k] !== undefined && filters[k] !== '') params = params.set(k, filters[k]); });
    return this.http.get<any>(`${BASE}/accounts/purchase-vouchers`, { params });
  }
  getPurchaseVoucherById(id: number): Observable<any> {
    return this.http.get<any>(`${BASE}/accounts/purchase-vouchers/${id}`);
  }
  createPurchaseVoucher(data: any): Observable<any> {
    return this.http.post<any>(`${BASE}/accounts/purchase-vouchers`, data);
  }
  updatePurchaseVoucher(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${BASE}/accounts/purchase-vouchers/${id}`, data);
  }
  approvePurchaseVoucher(id: number, remarks?: string): Observable<any> {
    return this.http.patch<any>(`${BASE}/accounts/purchase-vouchers/${id}/approve`, { remarks });
  }
  postPurchaseVoucher(id: number): Observable<any> {
    return this.http.patch<any>(`${BASE}/accounts/purchase-vouchers/${id}/post`, {});
  }
  cancelPurchaseVoucher(id: number): Observable<any> {
    return this.http.patch<any>(`${BASE}/accounts/purchase-vouchers/${id}/cancel`, {});
  }

  // ── Payment Vouchers ──────────────────────────────────────────────────────
  getPaymentVouchers(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(k => { if (filters[k] !== null && filters[k] !== undefined && filters[k] !== '') params = params.set(k, filters[k]); });
    return this.http.get<any>(`${BASE}/accounts/payment-vouchers`, { params });
  }
  getPaymentVoucherById(id: number): Observable<any> {
    return this.http.get<any>(`${BASE}/accounts/payment-vouchers/${id}`);
  }
  createPaymentVoucher(data: any): Observable<any> {
    return this.http.post<any>(`${BASE}/accounts/payment-vouchers`, data);
  }
  updatePaymentVoucher(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${BASE}/accounts/payment-vouchers/${id}`, data);
  }
  approvePaymentVoucher(id: number, remarks?: string): Observable<any> {
    return this.http.patch<any>(`${BASE}/accounts/payment-vouchers/${id}/approve`, { remarks });
  }
  postPaymentVoucher(id: number): Observable<any> {
    return this.http.patch<any>(`${BASE}/accounts/payment-vouchers/${id}/post`, {});
  }
  cancelPaymentVoucher(id: number): Observable<any> {
    return this.http.patch<any>(`${BASE}/accounts/payment-vouchers/${id}/cancel`, {});
  }

  // ── Journal Entries ───────────────────────────────────────────────────────
  getJournalEntries(filters: any = {}): Observable<any> {
    let params = new HttpParams();
    Object.keys(filters).forEach(k => { if (filters[k] !== null && filters[k] !== undefined && filters[k] !== '') params = params.set(k, filters[k]); });
    return this.http.get<any>(`${BASE}/accounts/journal-entries`, { params });
  }
  getJournalEntryById(id: number): Observable<any> {
    return this.http.get<any>(`${BASE}/accounts/journal-entries/${id}`);
  }
  createJournalEntry(data: any): Observable<any> {
    return this.http.post<any>(`${BASE}/accounts/journal-entries`, data);
  }
  getAccountLedger(accountId: number, fromDate?: string, toDate?: string): Observable<any> {
    let params = new HttpParams().set('accountId', accountId);
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<any>(`${BASE}/accounts/journal-entries/ledger`, { params });
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  getAccountsSummary(): Observable<any> {
    return this.http.get<any>(`${BASE}/accounts/summary`);
  }
}
