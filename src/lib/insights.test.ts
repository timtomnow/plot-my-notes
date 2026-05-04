import { describe, expect, it } from 'vitest';
import { rollingAverage } from './insights';
import type { JournalEntry } from '@/types';

const NOW = new Date('2026-05-03T12:00:00Z').getTime();
const DAY = 24 * 60 * 60 * 1000;

const entry = (over: Partial<JournalEntry> = {}): JournalEntry => ({
  id: 'e' + Math.random(),
  trackingTypeId: 't',
  date: NOW,
  x: 0,
  y: null,
  createdAt: NOW,
  updatedAt: NOW,
  ...over,
});

describe('rollingAverage', () => {
  it('returns all-null on empty input', () => {
    expect(rollingAverage([], 'x', 7, NOW)).toEqual({ current: null, prior: null, delta: null });
  });

  it('returns just the current average when there\'s no prior data', () => {
    const entries = [
      entry({ date: NOW - 1 * DAY, x: 4 }),
      entry({ date: NOW - 2 * DAY, x: 6 }),
    ];
    const r = rollingAverage(entries, 'x', 7, NOW);
    expect(r.current).toBe(5);
    expect(r.prior).toBeNull();
    expect(r.delta).toBeNull();
  });

  it('computes both windows and the delta', () => {
    const entries = [
      // Current 7-day window (avg 6)
      entry({ date: NOW - 1 * DAY, x: 5 }),
      entry({ date: NOW - 3 * DAY, x: 7 }),
      // Prior 7-day window (avg 4)
      entry({ date: NOW - 8 * DAY, x: 3 }),
      entry({ date: NOW - 12 * DAY, x: 5 }),
    ];
    const r = rollingAverage(entries, 'x', 7, NOW);
    expect(r.current).toBe(6);
    expect(r.prior).toBe(4);
    expect(r.delta).toBe(2);
  });

  it('skips null y values when averaging the y field', () => {
    const entries = [
      entry({ date: NOW - 1 * DAY, x: 1, y: 2 }),
      entry({ date: NOW - 2 * DAY, x: 1, y: null }), // skipped for y
      entry({ date: NOW - 3 * DAY, x: 1, y: 4 }),
    ];
    const r = rollingAverage(entries, 'y', 7, NOW);
    expect(r.current).toBe(3); // (2 + 4) / 2
  });

  it('respects the day boundary at exactly N days ago', () => {
    // An entry exactly N days ago should fall into the *current* window
    // (cutoff is inclusive of the recent side: date >= recentCutoff).
    const exactly7 = entry({ date: NOW - 7 * DAY, x: 10 });
    const r = rollingAverage([exactly7], 'x', 7, NOW);
    expect(r.current).toBe(10);
    expect(r.prior).toBeNull();
  });

  it('drops entries older than the prior window', () => {
    const entries = [
      entry({ date: NOW - 1 * DAY, x: 5 }),
      entry({ date: NOW - 30 * DAY, x: 99 }), // outside both 7-day windows
    ];
    const r = rollingAverage(entries, 'x', 7, NOW);
    expect(r.current).toBe(5);
    expect(r.prior).toBeNull();
  });
});
