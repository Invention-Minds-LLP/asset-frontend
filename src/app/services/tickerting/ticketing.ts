import { Injectable } from '@angular/core';
import { environment } from '../../../environment/environment.prod';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Employee {
  id: string;
  name: string;
  // add other properties if needed
}

@Injectable({
  providedIn: 'root'
})
export class Ticketing {
  private ticketingUrl = `${environment.apiUrl}/tickets`;
  constructor(private http: HttpClient){}

  createTicket(ticketData: any): Observable<any> {
  return this.http.post(`${this.ticketingUrl}`, ticketData);
}

getAllTickets(): Observable<any[]> {
  return this.http.get<any[]>(`${this.ticketingUrl}`)
}

}
