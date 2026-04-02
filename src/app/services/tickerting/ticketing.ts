import { Injectable } from '@angular/core';
import { environment } from '../../../environment/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs';

export interface Employee {
  id: string;
  name: string;
  // add other properties if needed
}

@Injectable({
  providedIn: 'root'
})
export class Ticketing {
  private ticketUrl = `${environment.apiUrl}/tickets`;
  constructor(private http: HttpClient) { }

  createTicket(ticketData: any): Observable<any> {
    return this.http.post(`${this.ticketUrl}`, ticketData);
  }

  getAllTickets(): Observable<any[]> {
    return this.http.get<any[]>(`${this.ticketUrl}`)
  }
  getTicketById(ticketId: string): Observable<any> {
    return this.http.get<any>(`${this.ticketUrl}/${ticketId}`);
  }
  updateTicket(id: number, ticketData: any): Observable<any> {
    return this.http.put<any>(`${this.ticketUrl}/${id}`, ticketData);
  }
  uploadAssetImage(file: File, ticketId: string): Observable<string> {
    const formData = new FormData();
    formData.append('file', file);
  
    return this.http.post<{ url: string }>(`${this.ticketUrl}/${ticketId}/upload-image`, formData).pipe(
      map((response: { url: string }) => response.url)
    );
  }
  assignTicket(id: number, toEmployeeId: number, comment: string) {
  return this.http.post(`${this.ticketUrl}/${id}/assign`, {
    toEmployeeId,
    comment
  });
}

reassignTicket(id: number, toEmployeeId: number, comment: string) {
  return this.http.post(`${this.ticketUrl}/${id}/reassign`, {
    toEmployeeId,
    comment
  });
}

terminateTicket(id: number, note: string) {
  return this.http.post(`${this.ticketUrl}/${id}/terminate`, { note });
}

closeTicket(id: number, remarks: string) {
  return this.http.post(`${this.ticketUrl}/${id}/close`, { remarks });
}

updateStatus(id: number, status: string) {
  return this.http.put(`${this.ticketUrl}/${id}`, { status });
}
getMyAssignedTickets() {
  return this.http.get<any[]>(`${this.ticketUrl}/my-assigned`);
}

getMyRaisedTickets() {
  return this.http.get<any[]>(`${this.ticketUrl}/my-raised`);
}
requestTransfer(ticketDbId: number, payload: any) {
  return this.http.post(`${this.ticketUrl}/${ticketDbId}/transfer`, payload);
}

getPendingTransfers() {
  return this.http.get<any[]>(`${this.ticketUrl}/transfers/pending`);
}

approveTransfer(ticketId: number, transferId: number) {
  return this.http.post(`${this.ticketUrl}/${ticketId}/transfers/${transferId}/approve`, {});
}

rejectTransfer(ticketId: number, transferId: number, reason: string) {
  return this.http.post(`${this.ticketUrl}/${ticketId}/transfers/${transferId}/reject`, { reason });
}

completeTransfer(ticketId: number, transferId: number) {
  return this.http.post(`${this.ticketUrl}/${ticketId}/transfers/${transferId}/complete`, {});
}

getTransferHistory(ticketId: number) {
  return this.http.get<any[]>(`${this.ticketUrl}/${ticketId}/transfers`);
}
getTicketMetrics(ticketDbId: number) {
  return this.http.get<any>(`${this.ticketUrl}/${ticketDbId}/metrics`);
}
completeWork(ticketId: number, note: string, rootCause?: string, resolutionSummary?: string) {
  return this.http.patch(`${this.ticketUrl}/${ticketId}/complete-work`, { note, rootCause, resolutionSummary });
}

resolveTicketByHod(ticketId: number, note: string) {
  return this.http.patch(`${this.ticketUrl}/${ticketId}/resolve`, { note });
}

addCollectionNote(ticketId: number, payload: { collectionNotes: string; collectionHandoverRemarks?: string }) {
  return this.http.post(`${this.ticketUrl}/${ticketId}/collection-note`, payload);
}
}
