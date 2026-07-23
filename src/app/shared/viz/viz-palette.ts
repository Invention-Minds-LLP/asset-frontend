// Validated categorical palette (dataviz skill reference instance). Fixed order —
// never cycled. Light/dark columns are the same hues stepped per surface.
export const CATEGORICAL_LIGHT = ['#2a78d6', '#1baf7a', '#eda100', '#008300', '#4a3aa7', '#e34948', '#e87ba4', '#eb6834'];
export const CATEGORICAL_DARK = ['#3987e5', '#199e70', '#c98500', '#008300', '#9085e9', '#e66767', '#d55181', '#d95926'];

// Reserved status colors — always paired with an icon + label, never color-alone.
export const STATUS = {
  good: '#0ca30c',
  warning: '#fab219',
  serious: '#ec835a',
  critical: '#d03b3b',
  info: '#2a78d6',
};

export function isDark(): boolean {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('app-dark');
}

// 1-based series slot → hex for the current theme.
export function seriesColor(slot: number): string {
  const arr = isDark() ? CATEGORICAL_DARK : CATEGORICAL_LIGHT;
  return arr[(slot - 1) % arr.length];
}

export function statusColor(role: string): string {
  return (STATUS as any)[role] || STATUS.info;
}
