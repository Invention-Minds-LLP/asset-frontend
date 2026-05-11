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

  /**
   * Print only the QR + asset label. Opens a fresh window with the rendered canvas
   * embedded as an image so the host page's sidebar / form / CSS can't leak through.
   */
  printQr(): void {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const win = window.open('', '_blank', 'width=420,height=560');
    if (!win) return;

    const html = `<!doctype html>
<html><head><title>QR – ${this.assetId}</title>
<style>
  html, body { margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; text-align: center; padding: 32px 16px; }
  img { width: 260px; height: 260px; }
  .id { font-family: ui-monospace, monospace; font-size: 14px; font-weight: 700; color: #1e3a8a; margin-top: 16px; word-break: break-all; }
  .name { font-size: 13px; color: #555; margin-top: 4px; }
  @media print { body { padding: 12px; } }
</style></head>
<body>
  <img src="${dataUrl}" alt="QR" />
  <div class="id">${this.assetId}</div>
  <div class="name">${this.assetName ?? ''}</div>
  <script>
    window.onload = function(){ window.focus(); window.print(); };
    window.onafterprint = function(){ window.close(); };
  </script>
</body></html>`;
    win.document.write(html);
    win.document.close();
  }
}
