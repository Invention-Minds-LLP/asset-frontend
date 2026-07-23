import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { statusColor } from './viz-palette';

@Component({
  selector: 'viz-gauge',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="g">
      <svg viewBox="0 0 120 78" class="g-svg">
        <path [attr.d]="arc(0, 100)" class="g-track" fill="none" stroke-width="12" stroke-linecap="round" />
        <path [attr.d]="arc(0, clamped)" [attr.stroke]="color" fill="none" stroke-width="12" stroke-linecap="round" />
        <text x="60" y="58" text-anchor="middle" class="g-val">{{ available ? (value + unit) : '—' }}</text>
      </svg>
      <span class="g-label">{{ label }}</span>
    </div>
  `,
  styles: [`
    .g { display:flex; flex-direction:column; align-items:center; gap:2px; }
    .g-svg { width:130px; height:84px; }
    .g-track { stroke: var(--surface-border,#e1e0d9); }
    .g-val { font-size:20px; font-weight:700; fill: var(--text-color,#0f172a); }
    .g-label { font-size:.78rem; color: var(--text-color-secondary,#64748b); }
  `],
})
export class VizGauge {
  @Input() label = '';
  @Input() value = 0;
  @Input() max = 100;
  @Input() unit = '%';
  @Input() available = true;

  get clamped(): number { return Math.max(0, Math.min(this.max, this.value)); }
  get color(): string {
    const p = (this.clamped / this.max) * 100;
    return p >= 85 ? statusColor('good') : p >= 60 ? statusColor('warning') : statusColor('critical');
  }
  // 180° arc from left (180°) to right (0°), radius 48, center (60,60).
  arc(fromPct: number, toPct: number): string {
    const a = (p: number) => Math.PI - (p / this.max) * Math.PI;
    const r = 48, cx = 60, cy = 60;
    const p1 = a(fromPct), p2 = a(toPct);
    const x1 = cx + r * Math.cos(p1), y1 = cy - r * Math.sin(p1);
    const x2 = cx + r * Math.cos(p2), y2 = cy - r * Math.sin(p2);
    const large = (p1 - p2) > Math.PI ? 1 : 0;
    return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
  }
}
