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
};

export function EntryRow({ entry, trackingType, axisX, axisY, onClick, showDate }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-2xl border border-ink-200 bg-white p-4 text-left transition hover:border-ink-300"
    >
      <span
        className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
        style={{ backgroundColor: trackingType?.color ?? '#a1a1aa' }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="truncate text-sm font-medium">
            {entry.title || trackingType?.name || 'Untitled'}
          </div>
          {showDate && (
            <div className="shrink-0 text-xs text-ink-400">{formatDay(entry.date)}</div>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-baseline gap-x-2 text-xs text-ink-500">
          <span>{trackingType?.name ?? 'Unknown type'}</span>
          {axisX && (
            <span className="tabular-nums">
              {axisX.name} <span className="font-semibold text-ink-700">{formatScore(entry.x, axisX)}</span>
            </span>
          )}
          {axisY && entry.y !== null && (
            <span className="tabular-nums">
              {axisY.name} <span className="font-semibold text-ink-700">{formatScore(entry.y, axisY)}</span>
            </span>
          )}
        </div>
        {entry.notes && (
          <div className="mt-1 line-clamp-2 text-xs text-ink-500">{entry.notes}</div>
        )}
      </div>
    </button>
  );
}
