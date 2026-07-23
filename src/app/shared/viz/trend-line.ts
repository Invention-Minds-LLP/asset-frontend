import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { seriesColor } from './viz-palette';

interface Series { name: string; color: number; values: number[]; }

@Component({
  selector: 'viz-trend-line',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="viz">
      <div class="viz-head">
        <span class="viz-title">{{ title }}</span>
        <span class="viz-legend" *ngIf="series.length > 1">
          <span class="lg" *ngFor="let s of series">
            <i class="sw" [style.background]="hex(s.color)"></i>{{ s.name }}
          </span>
        </span>
      </div>
      <svg [attr.viewBox]="'0 0 ' + W + ' ' + H" preserveAspectRatio="none" class="viz-svg">
        <!-- recessive baseline -->
        <line [attr.x1]="pad" [attr.y1]="H - pad" [attr.x2]="W - pad" [attr.y2]="H - pad" class="axis" />
        <g *ngFor="let s of series; let i = index">
          <path [attr.d]="areaPath(s)" [attr.fill]="hex(s.color)" opacity="0.10" />
          <path [attr.d]="linePath(s)" [attr.stroke]="hex(s.color)" fill="none" stroke-width="2"
            stroke-linejoin="round" stroke-linecap="round" />
          <circle [attr.cx]="lastX()" [attr.cy]="y(s.values[s.values.length-1], s)" r="3" [attr.fill]="hex(s.color)" />
        </g>
      </svg>
      <div class="viz-x"><span>{{ labels[0] }}</span><span>{{ labels[labels.length-1] }}</span></div>
    </div>
  `,
  styles: [`
    .viz { display:flex; flex-direction:column; gap:6px; }
    .viz-head { display:flex; justify-content:space-between; align-items:center; gap:8px; flex-wrap:wrap; }
    .viz-title { font-size:.82rem; font-weight:600; color: var(--text-color, #0f172a); }
    .viz-legend { display:flex; gap:12px; }
    .lg { display:inline-flex; align-items:center; gap:5px; font-size:.72rem; color: var(--text-color-secondary,#64748b); }
    .sw { width:9px; height:9px; border-radius:2px; display:inline-block; }
    .viz-svg { width:100%; height:120px; display:block; }
    .axis { stroke: var(--surface-border,#e1e0d9); stroke-width:1; }
    .viz-x { display:flex; justify-content:space-between; font-size:.68rem; color: var(--text-color-secondary,#898781); }
  `],
})
export class VizTrendLine {
  @Input() title = '';
  @Input() labels: string[] = [];
  @Input() series: Series[] = [];

  W = 320; H = 110; pad = 6;

  private get max(): number {
    const m = Math.max(1, ...this.series.flatMap((s) => s.values));
    return m;
  }
  private x(i: number): number {
    const n = Math.max(1, (this.series[0]?.values.length || 1) - 1);
    return this.pad + (i / n) * (this.W - this.pad * 2);
  }
  y(v: number, _s?: Series): number {
    const h = this.H - this.pad * 2;
    return this.pad + h - (v / this.max) * h;
  }
  lastX(): number { return this.x((this.series[0]?.values.length || 1) - 1); }
  hex(slot: number): string { return seriesColor(slot); }

  linePath(s: Series): string {
    return s.values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${this.x(i).toFixed(1)} ${this.y(v, s).toFixed(1)}`).join(' ');
  }
  areaPath(s: Series): string {
    const line = s.values.map((v, i) => `${i === 0 ? 'M' : 'L'} ${this.x(i).toFixed(1)} ${this.y(v, s).toFixed(1)}`).join(' ');
    return `${line} L ${this.lastX().toFixed(1)} ${(this.H - this.pad).toFixed(1)} L ${this.x(0).toFixed(1)} ${(this.H - this.pad).toFixed(1)} Z`;
  }
}
