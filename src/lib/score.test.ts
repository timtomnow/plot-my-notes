import { describe, expect, it } from 'vitest';
import {
  clamp,
  decimals,
  formatScore,
  fractionToValue,
  isAxisValid,
  snapToStep,
  valueToFraction,
} from './score';
import type { Axis } from '@/types';

const axis = (over: Partial<Axis> = {}): Axis => ({
  id: 'a',
  name: 'Test',
  min: 0,
  max: 10,
  step: 1,
  createdAt: 0,
  ...over,
});

describe('clamp', () => {
  it('passes values inside the range through', () => {
    expect(clamp(5, 0, 10)).toBe(5);
  });
  it('clamps below min', () => {
    expect(clamp(-3, 0, 10)).toBe(0);
  });
  it('clamps above max', () => {
    expect(clamp(99, 0, 10)).toBe(10);
  });
  it('handles negative ranges', () => {
    expect(clamp(0.5, -1, 1)).toBe(0.5);
    expect(clamp(2, -1, 1)).toBe(1);
    expect(clamp(-2, -1, 1)).toBe(-1);
  });
});

describe('decimals', () => {
  it('returns 0 for integer steps', () => {
    expect(decimals(1)).toBe(0);
    expect(decimals(5)).toBe(0);
  });
  it('counts fractional digits', () => {
    expect(decimals(0.5)).toBe(1);
    expect(decimals(0.05)).toBe(2);
    expect(decimals(0.125)).toBe(3);
  });
  it('returns 0 for invalid steps', () => {
    expect(decimals(0)).toBe(0);
    expect(decimals(-1)).toBe(0);
    expect(decimals(Number.POSITIVE_INFINITY)).toBe(0);
  });
});

describe('snapToStep', () => {
  it('snaps a value to the nearest step', () => {
    const a = axis({ min: 0, max: 10, step: 0.5 });
    expect(snapToStep(0.3, a)).toBe(0.5);
    expect(snapToStep(0.74, a)).toBe(0.5);
    expect(snapToStep(0.76, a)).toBe(1);
  });

  it('does not exceed the bounds when snapping near the upper bound', () => {
    // Regression target from the issue: rounding 9.9 with step 1 must clamp to 10, not 11.
    const a = axis({ min: 0, max: 10, step: 1 });
    expect(snapToStep(9.9, a)).toBe(10);
    expect(snapToStep(15, a)).toBe(10);
    expect(snapToStep(-99, a)).toBe(0);
  });

  it('handles axes with negative ranges', () => {
    const a = axis({ min: -1, max: 1, step: 0.5 });
    expect(snapToStep(0, a)).toBe(0);
    expect(snapToStep(-0.24, a)).toBe(0);
    expect(snapToStep(-0.26, a)).toBe(-0.5);
    expect(snapToStep(-2, a)).toBe(-1);
    expect(snapToStep(2, a)).toBe(1);
  });

  it('falls back to clamping when step is invalid', () => {
    const a = axis({ min: 0, max: 10, step: 0 });
    expect(snapToStep(7, a)).toBe(7);
    expect(snapToStep(99, a)).toBe(10);
  });

  it('preserves the step\'s precision in the output', () => {
    const a = axis({ min: 0, max: 1, step: 0.1 });
    // Floating-point math would normally yield e.g. 0.30000000000000004 here.
    expect(snapToStep(0.3, a)).toBe(0.3);
    expect(Number.isInteger(snapToStep(0.3, a) * 10)).toBe(true);
  });
});

describe('valueToFraction / fractionToValue', () => {
  it('round-trips midpoint values', () => {
    const a = axis({ min: 0, max: 10, step: 1 });
    expect(valueToFraction(5, a)).toBe(0.5);
    expect(fractionToValue(0.5, a)).toBe(5);
  });

  it('handles negative ranges', () => {
    const a = axis({ min: -1, max: 1, step: 0.5 });
    expect(valueToFraction(0, a)).toBe(0.5);
    expect(fractionToValue(0, a)).toBe(-1);
    expect(fractionToValue(1, a)).toBe(1);
  });

  it('clamps fractions to [0, 1]', () => {
    const a = axis({ min: 0, max: 10, step: 1 });
    expect(valueToFraction(-99, a)).toBe(0);
    expect(valueToFraction(99, a)).toBe(1);
  });

  it('treats a zero-width axis as fraction 0', () => {
    const a = axis({ min: 5, max: 5, step: 1 });
    expect(valueToFraction(5, a)).toBe(0);
  });
});

describe('formatScore', () => {
  it('uses the step\'s precision', () => {
    expect(formatScore(0.5, axis({ step: 0.5 }))).toBe('0.5');
    expect(formatScore(7, axis({ step: 1 }))).toBe('7');
    expect(formatScore(0.123, axis({ step: 0.01 }))).toBe('0.12');
  });
});

describe('isAxisValid', () => {
  it('accepts a sane axis', () => {
    expect(isAxisValid({ min: 0, max: 10, step: 1 })).toEqual({ ok: true });
    expect(isAxisValid({ min: -1, max: 1, step: 0.5 })).toEqual({ ok: true });
  });

  it('rejects min >= max', () => {
    expect(isAxisValid({ min: 10, max: 0, step: 1 }).ok).toBe(false);
    expect(isAxisValid({ min: 5, max: 5, step: 1 }).ok).toBe(false);
  });

  it('rejects non-positive step', () => {
    expect(isAxisValid({ min: 0, max: 10, step: 0 }).ok).toBe(false);
    expect(isAxisValid({ min: 0, max: 10, step: -1 }).ok).toBe(false);
  });

  it('rejects steps that don\'t divide the range', () => {
    expect(isAxisValid({ min: 0, max: 10, step: 3 }).ok).toBe(false);
    expect(isAxisValid({ min: 0, max: 1, step: 0.3 }).ok).toBe(false);
  });

  it('accepts a step that divides the range with floating-point noise', () => {
    // 1 / 0.1 is not exactly 10 in IEEE-754, but the validator should tolerate it.
    expect(isAxisValid({ min: 0, max: 1, step: 0.1 })).toEqual({ ok: true });
  });

  it('rejects non-finite numbers', () => {
    expect(isAxisValid({ min: NaN, max: 10, step: 1 }).ok).toBe(false);
    expect(isAxisValid({ min: 0, max: Infinity, step: 1 }).ok).toBe(false);
  });
});
