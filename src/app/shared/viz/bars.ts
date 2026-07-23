import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { seriesColor } from './viz-palette';

interface Item { name: string; value: number; }

@Component({
  selector: 'viz-bars',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="viz">
      <span class="viz-title">{{ title }}</span>
      <div class="b-list">
        <div class="b-row" *ngFor="let it of items">
          <span class="b-name" [title]="it.name">{{ it.name }}</span>
          <span class="b-track">
            <span class="b-fill" [style.width.%]="pct(it.value)" [style.background]="color"></span>
          </span>
          <span class="b-val">{{ it.value }}</span>
        </div>
        <div class="b-empty" *ngIf="!items.length">No data</div>
      </div>
    </div>
  `,
  styles: [`
    .viz { display:flex; flex-direction:column; gap:8px; }
    .viz-title { font-size:.82rem; font-weight:600; color: var(--text-color,#0f172a); }
    .b-list { display:flex; flex-direction:column; gap:8px; }
    .b-row { display:grid; grid-template-columns: 130px 1fr 40px; align-items:center; gap:10px; }
    .b-name { font-size:.78rem; color: var(--text-color-secondary,#64748b); overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
    .b-track { height:10px; background: var(--surface-border,#eef0f3); border-radius:6px; overflow:hidden; }
    .b-fill { display:block; height:100%; border-radius:6px; min-width:3px; transition:width .3s ease; }
    .b-val { font-size:.78rem; font-weight:600; text-align:right; color: var(--text-color,#0f172a); font-variant-numeric:tabular-nums; }
    .b-empty { color: var(--text-color-secondary,#94a3b8); font-size:.8rem; padding:8px 0; }
  `],
})
export class VizBars {
  @Input() title = '';
  @Input() items: Item[] = [];
  @Input() colorSlot = 1;

  get color(): string { return seriesColor(this.colorSlot); }
  get max(): number { return Math.max(1, ...this.items.map((i) => i.value)); }
  pct(v: number): number { return Math.round((v / this.max) * 100); }
}
