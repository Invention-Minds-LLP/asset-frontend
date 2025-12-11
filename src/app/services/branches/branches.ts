import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class Branches {

  private api = "http://localhost:3001/api/branches";

  constructor(private http: HttpClient) {}

  getBranches(): Observable<any[]> {
    return this.http.get<any[]>(this.api);
  }

  createBranch(name: string): Observable<any> {
    return this.http.post(this.api, { name });
  }

}
