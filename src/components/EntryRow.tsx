import type { ReactNode } from 'react';
import type { JournalEntry, TrackingType, Axis } from '@/types';
import { formatDay } from '@/lib/date';
import { formatScore } from '@/lib/score';

type Props = {
  entry: JournalEntry;
  trackingType: TrackingType | undefined;
  axisX: Axis | undefined;
  axisY: Axis | undefined;
  onClick?: () => void;
  showDate?: boolean;
  /** Case-insensitive substring to wrap in <mark> within title and notes. */
  highlight?: string;
};

export function EntryRow({ entry, trackingType, axisX, axisY, onClick, showDate, highlight }: Props) {
  const titleText = entry.title || trackingType?.name || 'Untitled';
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-2xl border border-ink-200 bg-white p-4 text-left transition hover:border-ink-300 dark:border-ink-800 dark:bg-ink-900 dark:hover:border-ink-700"
    >
      <span
        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: trackingType?.color ?? '#a1a1aa' }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate text-sm font-medium">
            {highlightMatches(titleText, highlight)}
          </div>
          {showDate && (
            <div className="shrink-0 text-xs text-ink-400 dark:text-ink-500">{formatDay(entry.date)}</div>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-xs text-ink-500 dark:text-ink-400">
          <span>{trackingType?.name ?? 'Unknown type'}</span>
          {axisX && (
            <span className="tabular-nums">
              {axisX.name} <span className="font-semibold text-ink-700 dark:text-ink-200">{formatScore(entry.x, axisX)}</span>
            </span>
          )}
          {axisY && entry.y !== null && (
            <span className="tabular-nums">
              {axisY.name} <span className="font-semibold text-ink-700 dark:text-ink-200">{formatScore(entry.y, axisY)}</span>
            </span>
          )}
        </div>
        {entry.notes && (
          <div className="mt-1 line-clamp-2 text-xs text-ink-500 dark:text-ink-400">
            {highlightMatches(entry.notes, highlight)}
          </div>
        )}
        {entry.tags && entry.tags.length > 0 && (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {entry.tags.map((t) => (
              <span
                key={t}
                className="rounded-full bg-ink-100 px-1.5 py-0.5 text-[10px] font-medium text-ink-600 dark:bg-ink-800 dark:text-ink-300"
              >
                {t}
              </span>
            ))}
          </div>
        )}
      </div>
    </button>
  );
}

function highlightMatches(text: string, query: string | undefined): ReactNode {
  if (!query) return text;
  const q = query.trim();
  if (!q) return text;
  const haystack = text.toLowerCase();
  const needle = q.toLowerCase();
  const out: ReactNode[] = [];
  let cursor = 0;
  let i = haystack.indexOf(needle, cursor);
  let key = 0;
  while (i !== -1) {
    if (i > cursor) out.push(text.slice(cursor, i));
    out.push(
      <mark
        key={`m${key++}`}
        className="rounded bg-yellow-200 px-0.5 text-ink-900 dark:bg-yellow-500/40 dark:text-ink-50"
      >
        {text.slice(i, i + needle.length)}
      </mark>,
    );
    cursor = i + needle.length;
    i = haystack.indexOf(needle, cursor);
  }
  if (cursor < text.length) out.push(text.slice(cursor));
  return out;
}
