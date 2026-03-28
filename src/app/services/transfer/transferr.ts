import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from '../../../environment/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class Transferr {

  private api = `${environment.apiUrl}/transfers`;

  constructor(private http: HttpClient) { }

  requestTransfer(payload: any): Observable<any> {
    return this.http.post(
      `${this.api}/assets/transfer/request`,
      payload
    );
  }

  approveTransfer(id: number, payload: { approvalReason?: string }): Observable<any> {
    return this.http.post(
      `${this.api}/assets/transfer/${id}/approve`,
      payload
    );
  }

  rejectTransfer(id: number, payload: { rejectionReason?: string }): Observable<any> {
    return this.http.post(
      `${this.api}/assets/transfer/${id}/reject`,
      payload
    );
  }

  returnTransfer(id: number, payload: { returnReason?: string }): Observable<any> {
    return this.http.post(
      `${this.api}/assets/transfer/${id}/return`,
      payload
    );
  }

  getHistory(assetId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.api}/assets/${assetId}/transfer-history`
    );
  }

  getPendingRequests(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.api}/assets/transfer/pending`
    );
  }

  getMyPendingApprovals(): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.api}/assets/transfer/my-pending-approvals`
    );
  }
  approveReturnTransfer(id: number, body: any) {
  return this.http.post(`${this.api}/assets/transfer/${id}/approve-return`, body);
}

rejectReturnTransfer(id: number, body: any) {
  return this.http.post(`${this.api}/assets/transfer/${id}/reject-return`, body);
}
getReturnChecklist(id: number) {
  return this.http.get(`${this.api}/assets/transfer/${id}/return-checklist`);
}

completeReturn(id: number, data: FormData) {
  return this.http.post(`${this.api}/assets/transfer/${id}/complete-return`, data);
}
}
