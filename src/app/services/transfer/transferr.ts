import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class Transferr {

  private api = "http://localhost:3001/api/transfers";

  constructor(private http: HttpClient) {}

  makeTransfer(payload: any): Observable<any> {
    return this.http.post(
      `${this.api}/assets/transfer`,
      payload
    );
  }

  getHistory(assetId: number): Observable<any[]> {
    return this.http.get<any[]>(
      `${this.api}/assets/${assetId}/transfer-history`
    );
  }
}
