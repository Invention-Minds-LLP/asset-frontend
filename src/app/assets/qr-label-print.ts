// Shared QR label-sticker printer.
// Opens a fresh print window where each QR is laid out on its own physical
// label (one sticker per page) sized for a label printer such as the Zebra roll.
// Used by both the single asset form (QR tab) and the bulk Quick Actions screen.

export interface QrLabelTile {
  dataUrl: string;   // PNG data URL captured from a rendered QR <canvas>
  id: string;        // asset ID, printed under the QR
  name?: string;     // optional — usually omitted on small labels
}

export interface QrLabelOptions {
  widthMm?: number;  // label width  (default 30)
  heightMm?: number; // label height (default 30)
}

export function printQrLabels(tiles: QrLabelTile[], opts: QrLabelOptions = {}): void {
  const valid = tiles.filter(t => t.dataUrl);
  if (valid.length === 0) return;

  const w = opts.widthMm ?? 30;
  const h = opts.heightMm ?? 30;
  // QR occupies ~72% of the shorter edge, leaving room for the ID line.
  const qrMm = Math.max(8, Math.round(Math.min(w, h) * 0.72));

  const labels = valid
    .map(
      t => `<div class="label">
  <img src="${t.dataUrl}" alt="QR" />
  <div class="id">${escapeHtml(t.id)}</div>
</div>`
    )
    .join('');

  const win = window.open('', '_blank', 'width=480,height=640');
  if (!win) return;

  const html = `<!doctype html>
<html><head><title>QR Labels</title>
<style>
  @page { size: ${w}mm ${h}mm; margin: 0; }
  html, body { margin: 0; padding: 0; }
  .label {
    width: ${w}mm; height: ${h}mm;
    box-sizing: border-box;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 1mm;
    page-break-after: always;
    break-after: page;
  }
  .label:last-child { page-break-after: auto; break-after: auto; }
  .label img { width: ${qrMm}mm; height: ${qrMm}mm; display: block; }
  .label .id {
    font-family: ui-monospace, monospace;
    font-size: 6pt; font-weight: 700; color: #111;
    margin-top: 0.6mm; text-align: center;
    line-height: 1; word-break: break-all;
    max-width: ${Math.max(1, w - 2)}mm;
  }
</style></head>
<body>
  ${labels}
  <script>
    window.onload = function(){ window.focus(); window.print(); };
    window.onafterprint = function(){ window.close(); };
  </script>
</body></html>`;
  win.document.write(html);
  win.document.close();
}

function escapeHtml(value: string): string {
  return (value ?? '').replace(/[&<>"']/g, c => {
    switch (c) {
      case '&': return '&amp;';
      case '<': return '&lt;';
      case '>': return '&gt;';
      case '"': return '&quot;';
      default:  return '&#39;';
    }
  });
}
