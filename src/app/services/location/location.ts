import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class Location {

  private api = "http://localhost:3001/api/location";

  constructor(private http: HttpClient) {}

  // History
  getHistory(assetId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/${assetId}`);
  }

  // Update
  updateLocation(assetId: number, payload: any): Observable<any> {
    return this.http.post(`${this.api}/${assetId}`, payload);
  }
}
