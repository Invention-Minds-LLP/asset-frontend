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

    // Compose a final image: white background + QR + asset ID + (optional) asset name.
    // So the saved PNG identifies itself without relying on the filename.
    const padding = 16;
    const labelGap = 10;
    const idFont = 'bold 18px ui-monospace, monospace';
    const nameFont = '14px system-ui, sans-serif';
    const idLine = this.assetId || '';
    const nameLine = this.assetName || '';
    const lineHeight = 22;

    // Measure text widths first using a throwaway context so we can size the
    // output canvas wide enough to fit whichever is widest: QR, ID, or name.
    const measureCtx = document.createElement('canvas').getContext('2d')!;
    measureCtx.font = idFont;
    const idWidth = idLine ? Math.ceil(measureCtx.measureText(idLine).width) : 0;
    measureCtx.font = nameFont;
    const nameWidth = nameLine ? Math.ceil(measureCtx.measureText(nameLine).width) : 0;

    const labelLines = (idLine ? 1 : 0) + (nameLine ? 1 : 0);
    const labelHeight = labelLines > 0 ? (labelLines * lineHeight + labelGap) : 0;

    const contentWidth = Math.max(qrCanvas.width, idWidth, nameWidth);

    const out = document.createElement('canvas');
    out.width = contentWidth + padding * 2;
    out.height = qrCanvas.height + padding * 2 + labelHeight;

    const ctx = out.getContext('2d');
    if (!ctx) return;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, out.width, out.height);

    // QR centered horizontally
    const qrX = (out.width - qrCanvas.width) / 2;
    ctx.drawImage(qrCanvas, qrX, padding);

    // Labels below, centered
    ctx.textAlign = 'center';
    let y = padding + qrCanvas.height + labelGap + 4;
    if (idLine) {
      ctx.font = idFont;
      ctx.fillStyle = '#1e3a8a';
      ctx.fillText(idLine, out.width / 2, y);
      y += lineHeight;
    }
    if (nameLine) {
      ctx.font = nameFont;
      ctx.fillStyle = '#555';
      ctx.fillText(nameLine, out.width / 2, y);
    }

    const link = document.createElement('a');
    link.href = out.toDataURL('image/png');
    link.download = `${this.assetId || 'asset'}-qr.png`;
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
