import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { seriesColor } from './viz-palette';

interface Slice { name: string; value: number; }

@Component({
  selector: 'viz-donut',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="viz">
      <span class="viz-title">{{ title }}</span>
      <div class="d-row">
        <svg viewBox="0 0 120 120" class="d-svg">
          <circle cx="60" cy="60" r="46" fill="none" class="d-track" stroke-width="16" *ngIf="!total" />
          <g *ngFor="let s of arcs">
            <path [attr.d]="s.d" fill="none" [attr.stroke]="s.color" stroke-width="16" />
          </g>
          <text x="60" y="56" text-anchor="middle" class="d-total">{{ total }}</text>
          <text x="60" y="72" text-anchor="middle" class="d-cap">total</text>
        </svg>
        <div class="d-legend">
          <div class="d-lg" *ngFor="let s of legend">
            <i class="sw" [style.background]="s.color"></i>
            <span class="nm">{{ s.name }}</span>
            <span class="vl">{{ s.value }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .viz { display:flex; flex-direction:column; gap:8px; }
    .viz-title { font-size:.82rem; font-weight:600; color: var(--text-color,#0f172a); }
    .d-row { display:flex; align-items:center; gap:16px; }
    .d-svg { width:120px; height:120px; flex:none; }
    .d-track { stroke: var(--surface-border,#e1e0d9); }
    .d-total { font-size:22px; font-weight:700; fill: var(--text-color,#0f172a); }
    .d-cap { font-size:9px; fill: var(--text-color-secondary,#898781); text-transform:uppercase; letter-spacing:.5px; }
    .d-legend { display:flex; flex-direction:column; gap:5px; min-width:0; flex:1; }
    .d-lg { display:flex; align-items:center; gap:7px; font-size:.76rem; }
    .sw { width:10px; height:10px; border-radius:2px; flex:none; }
    .nm { color: var(--text-color-secondary,#64748b); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; flex:1; }
    .vl { font-weight:600; color: var(--text-color,#0f172a); font-variant-numeric:tabular-nums; }
  `],
})
export class VizDonut {
  @Input() title = '';
  @Input() set slices(v: Slice[]) { this._slices = (v || []).filter((s) => s.value > 0).sort((a, b) => b.value - a.value); }
  _slices: Slice[] = [];

  get total(): number { return this._slices.reduce((s, x) => s + x.value, 0); }
  get legend() { return this._slices.slice(0, 6).map((s, i) => ({ ...s, color: seriesColor(i + 1) })); }

  get arcs() {
    const r = 46, cx = 60, cy = 60, C = 2 * Math.PI * r;
    let acc = 0;
    const t = this.total || 1;
    return this._slices.slice(0, 6).map((s, i) => {
      const frac = s.value / t;
      const a0 = (acc / t) * 2 * Math.PI - Math.PI / 2;
      acc += s.value;
      const a1 = (acc / t) * 2 * Math.PI - Math.PI / 2;
      const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
      const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      const large = frac > 0.5 ? 1 : 0;
      return { d: `M ${x0.toFixed(2)} ${y0.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`, color: seriesColor(i + 1) };
    });
  }
}
