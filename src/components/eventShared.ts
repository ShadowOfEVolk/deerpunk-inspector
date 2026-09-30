export const SLUG_COLORS: Record<string, { bg: string; text: string; glow: string }> = {
  'entity.spawned': { bg: '#14532d44', text: '#86efac', glow: '#22c55e44' },
  'entity.used': { bg: '#1e3a5f44', text: '#93c5fd', glow: '#3b82f644' },
  'damage.taken': { bg: '#7c2d1244', text: '#fdba74', glow: '#f9731644' },
  'entity.killed': { bg: '#7f1d1d44', text: '#fca5a5', glow: '#ef444444' },
  'power.on': { bg: '#713f1244', text: '#fde047', glow: '#eab30844' },
};

export function formatVal(v: unknown): string {
  if (v === null || v === undefined) return '—';
  if (typeof v === 'boolean') return v ? 'true' : 'false';
  if (typeof v === 'number') return Number.isInteger(v) ? String(v) : v.toFixed(2);
  return String(v);
}
