import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { LineChart as ChartIcon } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { LineChart1D } from '@/components/charts/LineChart1D';
import { ScatterChart2D } from '@/components/charts/ScatterChart2D';
import { Modal } from '@/components/ui/Modal';
import { useAxes, useEntries, useTrackingTypes } from '@/db/repo';
import type { JournalEntry } from '@/types';
import { formatDay } from '@/lib/date';
import { formatScore as fmt } from '@/lib/score';

const RANGES = [
  { id: '7', label: '7d', days: 7 },
  { id: '30', label: '30d', days: 30 },
  { id: 'all', label: 'All', days: null as number | null },
] as const;

type RangeId = (typeof RANGES)[number]['id'];

export function Charts() {
  const types = useTrackingTypes();
  const axes = useAxes();
  const [selected, setSelected] = useState<string | null>(null);
  const [range, setRange] = useState<RangeId>('30');
  const [openEntry, setOpenEntry] = useState<JournalEntry | null>(null);
  const [connectByDate, setConnectByDate] = useState(false);

  // Default to first type with entries
  const allEntries = useEntries();
  useEffect(() => {
    if (selected || !types || types.length === 0) return;
    const counts = new Map<string, number>();
    (allEntries ?? []).forEach((e) =>
      counts.set(e.trackingTypeId, (counts.get(e.trackingTypeId) ?? 0) + 1),
    );
    const first = [...types].sort(
      (a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0),
    )[0];
    setSelected(first.id);
  }, [types, allEntries, selected]);

  const trackingType = types?.find((t) => t.id === selected) ?? null;
  const axisX = axes?.find((a) => a.id === trackingType?.axisXId) ?? null;
  const axisY = trackingType?.axisYId
    ? axes?.find((a) => a.id === trackingType.axisYId) ?? null
    : null;

  const entriesForType = useEntries(selected ? { trackingTypeId: selected } : undefined);
  const days = RANGES.find((r) => r.id === range)?.days ?? null;
  const filteredEntries = useMemo(() => {
    if (!entriesForType) return [];
    if (days === null) return entriesForType;
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
    return entriesForType.filter((e) => e.date >= cutoff);
  }, [entriesForType, days]);

  if (types && types.length === 0) {
    return (
      <div>
        <PageHeader title="Charts" />
        <EmptyState
          icon={<ChartIcon size={32} />}
          title="No tracking types yet"
          description="Create at least one tracking type, log some entries, and they'll show up here."
          action={
            <Link to="/settings/tracking-types" className="btn-primary">
              Set up a type
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Charts"
        subtitle={
          trackingType
            ? trackingType.axisYId
              ? 'Scatter shows pairs of values; brighter dots are more recent.'
              : 'Line shows value over time; the dashed line is a 7-point moving average.'
            : undefined
        }
      />

      {/* Type filter */}
      <div className="mb-3 -mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-2">
          {types?.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setSelected(t.id)}
              className={['chip', selected === t.id ? 'chip-active' : ''].join(' ')}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
              {t.name}
              <span className="ml-1 text-[10px] opacity-60">{t.axisYId ? '2D' : '1D'}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Range chips */}
      <div className="mb-5 flex gap-2">
        {RANGES.map((r) => (
          <button
            key={r.id}
            type="button"
            onClick={() => setRange(r.id)}
            className={['chip', range === r.id ? 'chip-active' : ''].join(' ')}
          >
            {r.label}
          </button>
        ))}
      </div>

      {trackingType && axisX && axisY && (
        <>
          <div className="card p-4 md:p-6">
            <div className="mb-3 flex items-center justify-end">
              <label className="inline-flex cursor-pointer items-center gap-2 text-xs text-ink-600">
                <span>Connect by date</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={connectByDate}
                  onClick={() => setConnectByDate((v) => !v)}
                  className={[
                    'relative h-5 w-9 rounded-full transition',
                    connectByDate ? 'bg-ink-900' : 'bg-ink-300',
                  ].join(' ')}
                >
                  <span
                    className={[
                      'absolute top-0.5 h-4 w-4 rounded-full bg-white transition',
                      connectByDate ? 'left-[18px]' : 'left-0.5',
                    ].join(' ')}
                  />
                </button>
              </label>
            </div>
            <ScatterChart2D
              axisX={axisX}
              axisY={axisY}
              color={trackingType.color}
              entries={filteredEntries}
              connectByDate={connectByDate}
              onPointClick={(e) => setOpenEntry(e)}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4">
            <div className="card p-4 md:p-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium text-ink-700">
                  {axisX.name} <span className="text-ink-400">over time</span>
                </h3>
                <span className="text-[10px] uppercase tracking-wider text-ink-400">X axis</span>
              </div>
              <LineChart1D
                axis={axisX}
                color={trackingType.color}
                entries={filteredEntries}
                field="x"
                heightClass="h-40"
                showMovingAverage={false}
                onPointClick={(e) => setOpenEntry(e)}
              />
            </div>
            <div className="card p-4 md:p-5">
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-medium text-ink-700">
                  {axisY.name} <span className="text-ink-400">over time</span>
                </h3>
                <span className="text-[10px] uppercase tracking-wider text-ink-400">Y axis</span>
              </div>
              <LineChart1D
                axis={axisY}
                color={trackingType.color}
                entries={filteredEntries}
                field="y"
                heightClass="h-40"
                showMovingAverage={false}
                onPointClick={(e) => setOpenEntry(e)}
              />
            </div>
          </div>
        </>
      )}

      {trackingType && axisX && !axisY && (
        <div className="card p-4 md:p-6">
          <LineChart1D
            axis={axisX}
            color={trackingType.color}
            entries={filteredEntries}
            onPointClick={(e) => setOpenEntry(e)}
          />
        </div>
      )}

      {!trackingType && (
        <div className="card rounded-xl bg-ink-50 p-6 text-center text-sm text-ink-400">
          Select a tracking type.
        </div>
      )}

      <p className="mt-3 text-xs text-ink-400">
        {filteredEntries.length} entr{filteredEntries.length === 1 ? 'y' : 'ies'} in range.
      </p>

      <PointDetail
        entry={openEntry}
        onClose={() => setOpenEntry(null)}
      />
    </div>
  );
}

function PointDetail({ entry, onClose }: { entry: JournalEntry | null; onClose: () => void }) {
  const types = useTrackingTypes();
  const axes = useAxes();
  if (!entry) return null;
  const t = types?.find((tt) => tt.id === entry.trackingTypeId);
  const ax = axes?.find((a) => a.id === t?.axisXId);
  const ay = axes?.find((a) => a.id === t?.axisYId);
  return (
    <Modal open={!!entry} onClose={onClose} title={entry.title || t?.name || 'Entry'}>
      <div className="space-y-3 text-sm">
        <div className="text-ink-500">{formatDay(entry.date)}</div>
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-ink-50 p-3 tabular-nums">
          {ax && (
            <div>
              <div className="text-xs text-ink-500">{ax.name}</div>
              <div className="text-xl font-semibold">{fmt(entry.x, ax)}</div>
            </div>
          )}
          {ay && entry.y !== null && (
            <div>
              <div className="text-xs text-ink-500">{ay.name}</div>
              <div className="text-xl font-semibold">{fmt(entry.y, ay)}</div>
            </div>
          )}
        </div>
        {entry.notes && <p className="whitespace-pre-wrap text-ink-700">{entry.notes}</p>}
      </div>
    </Modal>
  );
}
