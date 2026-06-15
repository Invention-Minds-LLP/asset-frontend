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
    const qrCanvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!qrCanvas) return;

    // QR only — no asset code/name text. The QR alone carries the asset
    // identity; we just pad it with a white quiet zone for reliable scanning.
    const padding = 16;
    const out = document.createElement('canvas');
    out.width = qrCanvas.width + padding * 2;
    out.height = qrCanvas.height + padding * 2;

    const ctx = out.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, out.width, out.height);
    ctx.drawImage(qrCanvas, padding, padding);

    const link = document.createElement('a');
    link.href = out.toDataURL('image/png');
    link.download = `${this.assetId || 'asset'}-qr.png`;
    link.click();
  }

  /**
   * Print only the QR. Opens a fresh window with the rendered canvas embedded as
   * an image so the host page's sidebar / form / CSS can't leak through. No text
   * label — the QR alone carries the asset identity.
   */
  printQr(): void {
    const canvas = document.querySelector('canvas') as HTMLCanvasElement | null;
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const win = window.open('', '_blank', 'width=420,height=560');
    if (!win) return;

    const html = `<!doctype html>
<html><head><title>QR</title>
<style>
  html, body { margin: 0; padding: 0; }
  body { font-family: system-ui, sans-serif; text-align: center; padding: 32px 16px; }
  img { width: 260px; height: 260px; }
  @media print { body { padding: 12px; } }
</style></head>
<body>
  <img src="${dataUrl}" alt="QR" />
  <script>
    window.onload = function(){ window.focus(); window.print(); };
    window.onafterprint = function(){ window.close(); };
  </script>
</body></html>`;
    win.document.write(html);
    win.document.close();
  }
}
