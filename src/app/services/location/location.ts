import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from '../../../environment/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class Location {

  // private api = "http://localhost:3001/api/location";
  private api = `${environment.apiUrl}/location`
  // Location changes now flow through the approval module: supervisor→HOD,
  // HOD→management. Management/admin edits are auto-approved server-side.
  private approvalApi = `${environment.apiUrl}/location-approval`

  constructor(private http: HttpClient) {}
  getHistory(assetId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.api}/assets/${assetId}/location/history`
    );
  }

  getCurrentLocation(assetId: number): Observable<any> {
    return this.http.get<any>(
      `${this.api}/assets/${assetId}/location/current`
    );
  }

  // Submit a new location (routes through approval). Response includes
  // { pending, message } — pending=true means it awaits sign-off.
  addLocation(payload: any): Observable<any> {
    return this.http.post<any>(`${this.approvalApi}/request`, payload);
  }

  // "Updating" a location is really requesting a new one; the locationId is no
  // longer needed because approval creates a fresh active row on sign-off.
  updateLocation(_locationId: number, payload: any): Observable<any> {
    return this.http.post<any>(`${this.approvalApi}/request`, payload);
  }
}
