import type { JournalEntry } from '@/types';

export type WindowAvg = {
  current: number | null;
  prior: number | null;
  delta: number | null;
};

/**
 * Average of `field` over the last `days` days vs the prior `days` days.
 * Returns null fields when there aren't enough entries to compute that window.
 */
export function rollingAverage(
  entries: JournalEntry[],
  field: 'x' | 'y',
  days: number,
  now: number = Date.now(),
): WindowAvg {
  const dayMs = 24 * 60 * 60 * 1000;
  const recentCutoff = now - days * dayMs;
  const priorCutoff = now - 2 * days * dayMs;

  const recent: number[] = [];
  const prior: number[] = [];
  for (const e of entries) {
    const v = field === 'x' ? e.x : e.y;
    if (v === null || v === undefined) continue;
    if (e.date >= recentCutoff) recent.push(v);
    else if (e.date >= priorCutoff) prior.push(v);
  }
  const avg = (arr: number[]) =>
    arr.length === 0 ? null : arr.reduce((a, b) => a + b, 0) / arr.length;
  const current = avg(recent);
  const priorAvg = avg(prior);
  const delta =
    current !== null && priorAvg !== null ? current - priorAvg : null;
  return { current, prior: priorAvg, delta };
}
