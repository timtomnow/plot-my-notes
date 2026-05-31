import type { Axis, ChartRegion } from '@/types';
import { valueToFraction } from '@/lib/score';

/** Default fill opacity for a region when it doesn't specify one. */
export const DEFAULT_REGION_OPACITY = 0.35;

/**
 * Palette for the region color picker. Soft tints (good as quadrant fills) plus
 * a couple of neutral greys for "balance" style overlays like the Olson grid.
 */
export const REGION_PALETTE = [
  '#fee2e2', // red-100
  '#ffedd5', // orange-100
  '#fef9c3', // yellow-100
  '#dcfce7', // green-100
  '#ccfbf1', // teal-100
  '#dbeafe', // blue-100
  '#e0e7ff', // indigo-100
  '#f3e8ff', // purple-100
  '#fce7f3', // pink-100
  '#cbd5e1', // slate-300 (mid grey)
  '#64748b', // slate-500 (dark grey)
] as const;

export function newRegionId(): string {
  return crypto.randomUUID();
}

/** A region clamped to both axes' domains, with normalised corners. */
export type ResolvedRegion = {
  id: string;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  color: string;
  label?: string;
  opacity: number;
};

/**
 * Clamp regions to the axes' ranges and drop degenerate ones so chart/pad code
 * can render them without bounds checks. Corners are normalised so x1<x2, y1<y2.
 */
export function resolveRegions(
  regions: ChartRegion[] | undefined,
  axisX: Axis,
  axisY: Axis,
): ResolvedRegion[] {
  if (!regions || regions.length === 0) return [];
  const out: ResolvedRegion[] = [];
  for (const r of regions) {
    const x1 = clamp(Math.min(r.x1, r.x2), axisX.min, axisX.max);
    const x2 = clamp(Math.max(r.x1, r.x2), axisX.min, axisX.max);
    const y1 = clamp(Math.min(r.y1, r.y2), axisY.min, axisY.max);
    const y2 = clamp(Math.max(r.y1, r.y2), axisY.min, axisY.max);
    if (x2 <= x1 || y2 <= y1) continue;
    out.push({
      id: r.id,
      x1,
      x2,
      y1,
      y2,
      color: r.color,
      label: r.label,
      opacity: typeof r.opacity === 'number' ? r.opacity : DEFAULT_REGION_OPACITY,
    });
  }
  return out;
}

/** Region geometry as 0..100 percentages for absolute positioning on the pad. */
export type RegionBox = ResolvedRegion & {
  left: number;
  top: number;
  width: number;
  height: number;
};

/**
 * Convert resolved regions into CSS-percentage boxes for the 2D pad. The pad's
 * y axis grows upward, so `top` is measured from the high end.
 */
export function regionBoxes(
  regions: ResolvedRegion[],
  axisX: Axis,
  axisY: Axis,
): RegionBox[] {
  return regions.map((r) => {
    const fx1 = valueToFraction(r.x1, axisX);
    const fx2 = valueToFraction(r.x2, axisX);
    const fy1 = valueToFraction(r.y1, axisY);
    const fy2 = valueToFraction(r.y2, axisY);
    return {
      ...r,
      left: fx1 * 100,
      width: (fx2 - fx1) * 100,
      top: (1 - fy2) * 100,
      height: (fy2 - fy1) * 100,
    };
  });
}

/** Validate a list of regions against the two axes. Returns null if OK. */
export function validateRegions(
  axisX: { min: number; max: number },
  axisY: { min: number; max: number },
  regions: ChartRegion[],
): string | null {
  for (const r of regions) {
    for (const v of [r.x1, r.x2, r.y1, r.y2]) {
      if (!Number.isFinite(v)) return 'Every region needs numeric bounds.';
    }
    if (Math.min(r.x1, r.x2) < axisX.min || Math.max(r.x1, r.x2) > axisX.max) {
      return `X bounds must be between ${axisX.min} and ${axisX.max}.`;
    }
    if (Math.min(r.y1, r.y2) < axisY.min || Math.max(r.y1, r.y2) > axisY.max) {
      return `Y bounds must be between ${axisY.min} and ${axisY.max}.`;
    }
    if (r.x1 === r.x2 || r.y1 === r.y2) return 'A region must have width and height.';
  }
  return null;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, v));
}
