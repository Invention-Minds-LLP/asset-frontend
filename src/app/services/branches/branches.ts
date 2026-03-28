import { Injectable } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { Observable } from "rxjs";
import { environment } from '../../../environment/environment.prod';

@Injectable({
  providedIn: 'root'
})
export class Branches {

  // private api = "http://localhost:3001/api/branches";
    private api = `${environment.apiUrl}/branches`

  constructor(private http: HttpClient) {}

  getBranches(): Observable<any[]> {
    return this.http.get<any[]>(this.api);
  }

  createBranch(name: string): Observable<any> {
    return this.http.post(this.api, { name });
  }

  updateBranch(id: number, name: string): Observable<any> {
    return this.http.put(`${this.api}/${id}`, { name });
  }

  deleteBranch(id: number): Observable<any> {
    return this.http.delete(`${this.api}/${id}`);
  }

}
