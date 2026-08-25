import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment.prod';

/**
 * Institution profile — sector and legal entity type.
 * The sector decides which registers exist; the entity type decides which
 * depreciation books are produced and whether the charitable
 * application-of-income rule applies.
 */
@Injectable({ providedIn: 'root' })
export class InstitutionProfileService {
  private base = `${environment.apiUrl}/institution-profile`;

  constructor(private http: HttpClient) {}

  get(): Observable<any> {
    return this.http.get<any>(this.base);
  }

  save(payload: any): Observable<any> {
    return this.http.put<any>(this.base, payload);
  }

  /** What a given entity type implies, before the choice is committed. */
  implications(entityType: string): Observable<any> {
    return this.http.get<any>(`${this.base}/implications/${entityType}`);
  }
}
