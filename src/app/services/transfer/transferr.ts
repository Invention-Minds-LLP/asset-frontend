import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class Transferr {

  private api = "http://localhost:3001/api/transfers";

  constructor(private http: HttpClient) {}

  makeTransfer(assetId: number, payload: any): Observable<any> {
    return this.http.post(`${this.api}/${assetId}`, payload);
  }

  getHistory(assetId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.api}/${assetId}`);
  }
}
