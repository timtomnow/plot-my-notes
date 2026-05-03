import type { Axis } from '@/types';

export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

export function snapToStep(v: number, axis: Axis): number {
  const { min, max, step } = axis;
  if (step <= 0) return clamp(v, min, max);
  const snapped = Math.round((v - min) / step) * step + min;
  return Number(clamp(snapped, min, max).toFixed(decimals(step)));
}

export function decimals(step: number): number {
  if (!isFinite(step) || step <= 0) return 0;
  const s = step.toString();
  const i = s.indexOf('.');
  return i < 0 ? 0 : s.length - i - 1;
}

export function formatScore(v: number, axis: Axis): string {
  return v.toFixed(decimals(axis.step));
}

export function valueToFraction(v: number, axis: Axis): number {
  const range = axis.max - axis.min;
  if (range === 0) return 0;
  return clamp((v - axis.min) / range, 0, 1);
}

export function fractionToValue(f: number, axis: Axis): number {
  return clamp(axis.min + f * (axis.max - axis.min), axis.min, axis.max);
}

export function isAxisValid(axis: {
  min: number;
  max: number;
  step: number;
}): { ok: true } | { ok: false; reason: string } {
  if (!Number.isFinite(axis.min) || !Number.isFinite(axis.max)) {
    return { ok: false, reason: 'Min and max must be numbers.' };
  }
  if (axis.min >= axis.max) {
    return { ok: false, reason: 'Min must be less than max.' };
  }
  if (!Number.isFinite(axis.step) || axis.step <= 0) {
    return { ok: false, reason: 'Step must be greater than 0.' };
  }
  const range = axis.max - axis.min;
  const ratio = range / axis.step;
  if (Math.abs(ratio - Math.round(ratio)) > 1e-6) {
    return { ok: false, reason: 'Step must divide the range evenly.' };
  }
  return { ok: true };
}
