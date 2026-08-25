import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class PurchaseOrderService {
  private base = `${environment.apiUrl}/purchase-order`;

  constructor(private http: HttpClient) {}

  getAll(filters: any = {}): Observable<any> {
    return this.http.get<any>(this.base, { params: this.buildParams(filters) });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}`);
  }

  create(payload: any): Observable<any> {
    return this.http.post<any>(this.base, payload);
  }

  update(id: number, payload: any): Observable<any> {
    return this.http.put<any>(`${this.base}/${id}`, payload);
  }

  approve(id: number, payload: any): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}/approve`, payload);
  }

  reject(id: number, payload: { remarks: string }): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}/reject`, payload);
  }

  sendToVendor(id: number): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}/send`, {});
  }

  cancel(id: number): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}/cancel`, {});
  }

  createFromIndent(indentId: number, body: any = {}): Observable<any> {
    return this.http.post<any>(`${this.base}/from-indent/${indentId}`, body);
  }

  createFromIndents(body: {
    vendorId: number;
    indentIds: number[];
    deliveryDate?: any;
    notes?: string;
    paymentTerms?: string;
    advancePercent?: number | null;
    shippingAddress?: string;
    lines?: { indentId: number; quantity?: number; unitPrice?: number | null; taxPercent?: number; hsnCode?: string }[];
  }): Observable<any> {
    return this.http.post<any>(`${this.base}/from-indents`, body);
  }

  /** Approved vs paid vs still owed on one order, plus any active payment hold. */
  getPaymentLedger(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}/payment-ledger`);
  }

  /**
   * Orders this vendor has been paid an advance on. An advance with no asset
   * against it is money at risk, so unreconciled ones are listed first.
   */
  getAdvancePaidOrders(vendorId?: number | null): Observable<any> {
    let params = new HttpParams();
    if (vendorId) params = params.set('vendorId', String(vendorId));
    return this.http.get<any>(`${this.base}/advance-paid-orders`, { params });
  }

  /** What actually arrived against an order — the accounting side of the link. */
  getLinkedAssets(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}/linked-assets`);
  }

  amend(id: number, body: { reason: string; lines: { lineId: number; newQuantity?: number; newUnitPrice?: number }[] }): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}/amend`, body);
  }

  decideAmendment(id: number, amendmentId: number, body: { decision: string; remarks?: string }): Observable<any> {
    return this.http.patch<any>(`${this.base}/${id}/amendments/${amendmentId}/decision`, body);
  }

  getAmendments(id: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${id}/amendments`);
  }

  private buildParams(obj: any): HttpParams {
    let params = new HttpParams();
    for (const key of Object.keys(obj)) {
      if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
        params = params.set(key, String(obj[key]));
      }
    }
    return params;
  }
}
