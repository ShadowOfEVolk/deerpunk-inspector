export function formatSystemTime(timeUs: number): string {
  if (timeUs <= 0) return '—';
  if (timeUs >= 1_000_000) return `${(timeUs / 1_000_000).toFixed(2)}s`;
  if (timeUs >= 1000) return `${(timeUs / 1000).toFixed(2)}ms`;
  return `${Math.round(timeUs)}µs`;
}

export function formatPercent(percent: number): string {
  if (percent <= 0) return '—';
  if (percent < 0.1) return '<0.1%';
  return `${percent.toFixed(1)}%`;
}
