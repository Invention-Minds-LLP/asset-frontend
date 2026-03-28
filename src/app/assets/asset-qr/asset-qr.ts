import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { QRCodeComponent } from 'angularx-qrcode';

@Component({
  selector: 'app-asset-qr',
  imports: [CommonModule, QRCodeComponent],
  templateUrl: './asset-qr.html',
  styleUrl: './asset-qr.css'
})
export class AssetQr {
  @Input() assetId = '';
  @Input() assetName = '';

  qrValue = '';

ngOnChanges(changes: SimpleChanges): void {
  if (this.assetId) {
    const baseUrl = window.location.origin;
    this.qrValue = `${baseUrl}/assets/scan/${encodeURIComponent(this.assetId)}`;
  }
}

  downloadQr(): void {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    const image = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = image;
    link.download = `${this.assetId}-qr.png`;
    link.click();
  }

  printQr(): void {
    window.print();
  }
}
