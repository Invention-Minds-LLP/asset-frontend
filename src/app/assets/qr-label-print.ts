// Shared QR label-sticker printer.
// Opens a fresh print window where each QR is laid out on its own physical
// label (one sticker per page) sized for a label printer such as the Zebra roll.
// Used by both the single asset form (QR tab) and the bulk Quick Actions screen.

export interface QrLabelTile {
  dataUrl: string;   // PNG data URL captured from a rendered QR <canvas>
  id: string;        // asset ID (no longer printed — kept for callers/back-compat)
  name?: string;     // optional — usually omitted on small labels
}

export interface QrLabelOptions {
  widthMm?: number;  // sticker width  (default 30)
  heightMm?: number; // sticker height (default 30)
  gapMm?: number;    // blank gap between stickers on the roll (default 3)
}

export function printQrLabels(tiles: QrLabelTile[], opts: QrLabelOptions = {}): void {
  const valid = tiles.filter(t => t.dataUrl);
  if (valid.length === 0) return;

  const w = opts.widthMm ?? 30;
  const h = opts.heightMm ?? 30;
  const gap = opts.gapMm ?? 3;
  // Each printed page must equal the roll PITCH (sticker + gap), or the printer
  // advances further than the page and every QR drifts up into the previous
  // label, accumulating down the strip.
  const pageH = h + gap;
  // QR only (no ID line). ~66% of the sticker leaves a clear quiet-zone margin
  // on every side so minor feed drift never bleeds across the gap.
  const qrMm = Math.max(8, Math.round(Math.min(w, h) * 0.66));

  // QR only — no asset-code text. The QR alone carries the asset identity.
  // The sticker holds the QR centred; the gap below is left blank so it lands
  // on the die-cut gap between physical labels.
  const labels = valid
    .map(
      t => `<div class="label">
  <div class="sticker"><img src="${t.dataUrl}" alt="QR" /></div>
</div>`
    )
    .join('');

  const win = window.open('', '_blank', 'width=480,height=640');
  if (!win) return;

  const html = `<!doctype html>
<html><head><title>QR Labels</title>
<style>
  @page { size: ${w}mm ${pageH}mm; margin: 0; }
  html, body { margin: 0; padding: 0; }
  .label {
    width: ${w}mm; height: ${pageH}mm;
    box-sizing: border-box;
    display: flex; flex-direction: column;
    overflow: hidden;
    page-break-after: always;
    break-after: page;
  }
  .label:last-child { page-break-after: auto; break-after: auto; }
  .label .sticker {
    width: ${w}mm; height: ${h}mm;
    box-sizing: border-box;
    display: flex; align-items: center; justify-content: center;
    padding: 2mm;
  }
  .label .sticker img { width: ${qrMm}mm; height: ${qrMm}mm; display: block; }
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
