import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class FloorPlanService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/floor-plan`;

  /** Backend origin without the trailing /api — for resolving /uploads image URLs. */
  readonly fileBase = environment.apiUrl.replace(/\/api\/?$/, '');

  list(filters: { branchId?: number; block?: string; floor?: string } = {}): Observable<any[]> {
    let p = new HttpParams();
    for (const [k, v] of Object.entries(filters)) {
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    }
    return this.http.get<any[]>(this.base, { params: p });
  }

  upload(form: FormData): Observable<any> {
    return this.http.post<any>(this.base, form);
  }

  get(id: number): Observable<{ plan: any; pins: any[] }> {
    return this.http.get<{ plan: any; pins: any[] }>(`${this.base}/${id}`);
  }

  pinnable(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/${id}/pinnable`);
  }

  savePin(id: number, body: { assetId: number; planX: number; planY: number }): Observable<any> {
    return this.http.post<any>(`${this.base}/${id}/pin`, body);
  }

  removePin(id: number, assetId: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/${id}/pin/${assetId}`);
  }

  remove(id: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/${id}`);
  }

  // ── Zones (traced rooms / areas) ──
  zones(id: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.base}/${id}/zones`);
  }

  /** Zones plus the assets that fall inside each (derived server-side). */
  zoneStats(id: number): Observable<{ zones: any[]; totals: any }> {
    return this.http.get<{ zones: any[]; totals: any }>(`${this.base}/${id}/zone-stats`);
  }

  createZone(id: number, body: any): Observable<any> {
    return this.http.post<any>(`${this.base}/${id}/zones`, body);
  }

  updateZone(id: number, zoneId: number, body: any): Observable<any> {
    return this.http.put<any>(`${this.base}/${id}/zones/${zoneId}`, body);
  }

  deleteZone(id: number, zoneId: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/${id}/zones/${zoneId}`);
  }

  /** Full URL for a stored floor-plan image. */
  imageUrl(plan: any): string {
    if (!plan?.imageUrl) return '';
    return plan.imageUrl.startsWith('http') ? plan.imageUrl : `${this.fileBase}${plan.imageUrl}`;
  }
}
