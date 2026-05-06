import type { Axis, AxisBand } from '@/types';

export type ResolvedBand = {
  id: string;
  from: number;
  to: number;
  label?: string;
  color: string;
  hasExplicitColor: boolean;
};

/** Default alternating tints used when a band has no explicit color. */
const DEFAULT_TINTS = [
  'rgba(15, 23, 42, 0.06)', // ink-ish, very subtle
  'rgba(15, 23, 42, 0.00)', // transparent — gives a stripe feel
];

/**
 * Resolve an axis's `bands` into rendering-friendly `[from, to]` ranges with
 * a guaranteed color. Bands cover [axis.min..first.max], [prev.max..next.max],
 * etc. Out-of-order or duplicate breakpoints are sorted/deduped here so chart
 * code can rely on contiguity.
 */
export function resolveBands(axis: Axis): ResolvedBand[] {
  if (!axis.bands || axis.bands.length === 0) return [];
  const sorted = [...axis.bands]
    .filter((b) => Number.isFinite(b.max))
    .map((b) => ({ ...b, max: clamp(b.max, axis.min, axis.max) }))
    .sort((a, b) => a.max - b.max);
  const out: ResolvedBand[] = [];
  let cursor = axis.min;
  for (let i = 0; i < sorted.length; i++) {
    const b = sorted[i];
    if (b.max <= cursor) continue; // skip degenerate / duplicate breakpoints
    const explicit = !!b.color;
    out.push({
      id: b.id,
      from: cursor,
      to: b.max,
      label: b.label,
      color: explicit ? (b.color as string) : DEFAULT_TINTS[out.length % DEFAULT_TINTS.length],
      hasExplicitColor: explicit,
    });
    cursor = b.max;
  }
  // Tail band — auto-extend the last band to axis.max if the user didn't.
  if (cursor < axis.max) {
    const last = out[out.length - 1];
    if (last) last.to = axis.max;
  }
  return out;
}

/** Pre-defined palette for the band color picker — soft tinted versions. */
export const BAND_PALETTE = [
  '#fee2e2', // red-100
  '#ffedd5', // orange-100
  '#fef9c3', // yellow-100
  '#dcfce7', // green-100
  '#ccfbf1', // teal-100
  '#dbeafe', // blue-100
  '#e0e7ff', // indigo-100
  '#f3e8ff', // purple-100
  '#fce7f3', // pink-100
  '#e4e4e7', // zinc-200
] as const;

export function newBandId(): string {
  return crypto.randomUUID();
}

/** Validate a list of bands against an axis. Returns null if OK. */
export function validateBands(axis: { min: number; max: number }, bands: AxisBand[]): string | null {
  if (bands.length === 0) return null;
  for (const b of bands) {
    if (!Number.isFinite(b.max)) return 'Each band needs a numeric breakpoint.';
    if (b.max <= axis.min || b.max > axis.max) {
      return `Breakpoints must be between ${axis.min} and ${axis.max}.`;
    }
  }
  const sorted = [...bands].sort((a, b) => a.max - b.max);
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i].max <= sorted[i - 1].max) {
      return 'Band breakpoints must be strictly increasing.';
    }
  }
  return null;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
