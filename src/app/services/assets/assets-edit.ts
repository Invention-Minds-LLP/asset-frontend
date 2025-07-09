import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AssetEditService {
  private assetSource = new BehaviorSubject<any | null>(null);
  currentAsset$ = this.assetSource.asObservable();

  setAsset(asset: any) {
    this.assetSource.next(asset);
  }

  clearAsset() {
    this.assetSource.next(null);
  }
}
