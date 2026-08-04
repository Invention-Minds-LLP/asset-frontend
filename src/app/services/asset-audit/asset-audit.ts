import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

@Injectable({ providedIn: 'root' })
export class AssetAuditService {
  private baseUrl = `${environment.apiUrl}/asset-audit`;

  /** Backend origin without the trailing /api — for resolving /uploads image URLs. */
  readonly fileBase = environment.apiUrl.replace(/\/api\/?$/, '');

  constructor(private http: HttpClient) {}

  getAll(filters: any = {}): Observable<any> {
    return this.http.get(this.baseUrl, { params: this.buildParams(filters) });
  }

  getById(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}`);
  }

  create(payload: any): Observable<any> {
    return this.http.post(this.baseUrl, payload);
  }

  start(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/start`, {});
  }

  verifyItem(itemId: number, payload: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/items/${itemId}/verify`, payload);
  }

  complete(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}/complete`, {});
  }

  getLocationOptions(): Observable<any> {
    return this.http.get(`${this.baseUrl}/locations`);
  }

  getSummary(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}/summary`);
  }

  // Active employees for the internal-auditor picker (reuses /employees).
  getEmployees(): Observable<any> {
    return this.http.get(`${environment.apiUrl}/employees`);
  }

  // ── Scope wizard (floor ↔ category, either direction) ──
  getScopeFloors(filters: any = {}): Observable<any> {
    return this.http.get(`${this.baseUrl}/scope/floors`, { params: this.buildParams(filters) });
  }

  getScopeBlocks(filters: any = {}): Observable<any> {
    return this.http.get(`${this.baseUrl}/scope/blocks`, { params: this.buildParams(filters) });
  }

  getScopeRooms(filters: any = {}): Observable<any> {
    return this.http.get(`${this.baseUrl}/scope/rooms`, { params: this.buildParams(filters) });
  }

  getScopeCategories(filters: any = {}): Observable<any> {
    return this.http.get(`${this.baseUrl}/scope/categories`, { params: this.buildParams(filters) });
  }

  getScopePreview(filters: any = {}): Observable<any> {
    return this.http.get(`${this.baseUrl}/scope/preview`, { params: this.buildParams(filters) });
  }

  // ── Floor map + routing ──
  getFloorMap(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}/floor-map`);
  }

  getNextItem(id: number, fromItemId?: number | null): Observable<any> {
    const params = fromItemId ? this.buildParams({ fromItemId }) : undefined;
    return this.http.get(`${this.baseUrl}/${id}/next-item`, params ? { params } : {});
  }

  /**
   * Room-level rollup of the audit onto the plan's traced zones: per-room
   * verified/missing/pending counts, the room walking order and the not-found list.
   */
  getZoneProgress(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}/zone-progress`);
  }

  /** Grouped, filterable checklist — the primary way to work an audit. */
  getChecklist(
    id: number,
    filters: { groupBy?: string; assetStatus?: string; itemStatus?: string; sticker?: string; q?: string } = {}
  ): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}/checklist`, { params: this.buildParams(filters) });
  }

  /**
   * How much of a prospective scope the guided audit can actually direct
   * someone to — shown before the audit is created, while it can still be fixed.
   */
  getLocationReadiness(filters: any = {}): Observable<any> {
    return this.http.get(`${this.baseUrl}/location-readiness`, { params: this.buildParams(filters) });
  }

  /** Why "Complete audit" is or isn't available. */
  getCompletionCheck(id: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/${id}/completion-check`);
  }

  /** Full URL for a stored floor-plan image. */
  imageUrl(plan: any): string {
    if (!plan?.imageUrl) return '';
    return plan.imageUrl.startsWith('http') ? plan.imageUrl : `${this.fileBase}${plan.imageUrl}`;
  }

  private buildParams(obj: any): HttpParams {
    let params = new HttpParams();
    for (const key of Object.keys(obj)) {
      if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
        params = params.set(key, String(obj[key]));
      }
    }
    return params;
  }
}
