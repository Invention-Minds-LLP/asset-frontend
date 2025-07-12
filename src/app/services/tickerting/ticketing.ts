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

}
