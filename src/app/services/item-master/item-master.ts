import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

// Item master — the approved list the asset form and indent form pick names from.
// Reading is open to any signed-in user; create/update/delete are ADMIN/FINANCE
// only and will come back 403 for anyone else.
@Injectable({ providedIn: 'root' })
export class ItemMaster {

  private api = `${environment.apiUrl}/asset-items`;

  constructor(private http: HttpClient) {}

  getItems(opts: { search?: string; assetCategoryId?: number; includeInactive?: boolean } = {}): Observable<any[]> {
    const params = new URLSearchParams();
    if (opts.search) params.set('search', opts.search);
    if (opts.assetCategoryId != null) params.set('assetCategoryId', String(opts.assetCategoryId));
    if (opts.includeInactive) params.set('includeInactive', 'true');
    const q = params.toString();
    return this.http.get<any[]>(`${this.api}${q ? '?' + q : ''}`);
  }

  createItem(data: any): Observable<any> {
    return this.http.post<any>(this.api, data);
  }

  updateItem(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.api}/${id}`, data);
  }

  deleteItem(id: number): Observable<any> {
    return this.http.delete<any>(`${this.api}/${id}`);
  }
}
