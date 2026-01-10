import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class Location {

  private api = "http://localhost:3001/api/location";

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

  addLocation(payload: any): Observable<any> {
    return this.http.post<any>(this.api, payload);
  }

  updateLocation(locationId: number, payload: any): Observable<any> {
    return this.http.put<any>(
      `${this.api}/${locationId}`,
      payload
    );
  }
}
