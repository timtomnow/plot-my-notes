import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { EntryRow } from '@/components/EntryRow';
import { useAxes, useEntries, useTrackingTypes } from '@/db/repo';
import { rollingAverage, type WindowAvg } from '@/lib/insights';
import { formatScore, decimals } from '@/lib/score';
import type { Axis, TrackingType } from '@/types';

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Up late';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function Dashboard() {
  const navigate = useNavigate();
  const types = useTrackingTypes();
  const axes = useAxes();
  const entries = useEntries({ limit: 200 });
  const recent5 = useMemo(() => (entries ?? []).slice(0, 5), [entries]);

  const insights = useMemo(() => {
    if (!types || !axes || !entries) return [];
    return types
      .map((t) => {
        const ax = axes.find((a) => a.id === t.axisXId);
        if (!ax) return null;
        const ay = t.axisYId ? axes.find((a) => a.id === t.axisYId) ?? null : null;
        const ofType = entries.filter((e) => e.trackingTypeId === t.id);
        if (ofType.length === 0) return null;
        return {
          type: t,
          axisX: ax,
          axisY: ay,
          xAvg: rollingAverage(ofType, 'x', 7),
          yAvg: ay ? rollingAverage(ofType, 'y', 7) : null,
          count: ofType.length,
        };
      })
      .filter((v): v is NonNullable<typeof v> => v !== null);
  }, [types, axes, entries]);

  return (
    <div>
      <PageHeader
        title={greeting()}
        subtitle={
          entries && entries.length > 0
            ? 'A glance at the last seven days.'
            : 'Welcome — start by logging your first entry.'
        }
        action={
          <button className="btn-primary" type="button" onClick={() => navigate('/new')}>
            <Plus size={16} /> New entry
          </button>
        }
      />

      {entries && entries.length === 0 && (
        <EmptyState
          title="Nothing logged yet"
          description="Tap “New entry” to capture how you feel right now. It takes seconds."
          action={
            <button className="btn-primary" type="button" onClick={() => navigate('/new')}>
              <Plus size={16} /> New entry
            </button>
          }
        />
      )}

      {insights.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-3 text-xs font-semibold uppercase tracking-wide text-ink-400 dark:text-ink-500">
            Quick insight
          </h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {insights.map((i) => (
              <InsightCard key={i.type.id} {...i} />
            ))}
          </div>
        </section>
      )}

      {recent5.length > 0 && (
        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-400 dark:text-ink-500">
              Recent
            </h2>
            <Link to="/entries" className="text-xs text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-50">
              See all →
            </Link>
          </div>
          <ul className="space-y-2">
            {recent5.map((e) => {
              const t = types?.find((tt) => tt.id === e.trackingTypeId);
              return (
                <li key={e.id}>
                  <EntryRow
                    entry={e}
                    trackingType={t}
                    axisX={axes?.find((a) => a.id === t?.axisXId)}
                    axisY={axes?.find((a) => a.id === t?.axisYId)}
                    showDate
                    onClick={() => navigate(`/entries`)}
                  />
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

type InsightProps = {
  type: TrackingType;
  axisX: Axis;
  axisY: Axis | null;
  xAvg: WindowAvg;
  yAvg: WindowAvg | null;
  count: number;
};

function InsightCard({ type, axisX, axisY, xAvg, yAvg, count }: InsightProps) {
  return (
    <Link
      to="/charts"
      className="block rounded-2xl border border-ink-200 bg-white p-4 transition hover:border-ink-300 dark:border-ink-800 dark:bg-ink-900 dark:hover:border-ink-700"
    >
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: type.color }} />
        <span className="text-sm font-medium">{type.name}</span>
        <span className="ml-auto text-[10px] uppercase tracking-wider text-ink-400 dark:text-ink-500">
          {type.axisYId ? '2D' : '1D'} · {count}
        </span>
      </div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <Stat axis={axisX} avg={xAvg} />
        {axisY && yAvg && <Stat axis={axisY} avg={yAvg} />}
      </div>
    </Link>
  );
}

function Stat({ axis, avg }: { axis: Axis; avg: WindowAvg }) {
  if (avg.current === null) {
    return (
      <div>
        <div className="text-[10px] uppercase tracking-wider text-ink-400 dark:text-ink-500">{axis.name}</div>
        <div className="text-base text-ink-400 dark:text-ink-500">No data</div>
      </div>
    );
  }

  const dec = Math.max(decimals(axis.step), 1);
  const Icon = avg.delta == null
    ? null
    : Math.abs(avg.delta) < axis.step / 2
      ? Minus
      : avg.delta > 0
        ? ArrowUpRight
        : ArrowDownRight;
  const tone = avg.delta == null || Math.abs(avg.delta) < axis.step / 2
    ? 'text-ink-400 dark:text-ink-500'
    : avg.delta > 0
      ? 'text-emerald-600'
      : 'text-amber-600';

  return (
    <div>
      <div className="text-[10px] uppercase tracking-wider text-ink-400 dark:text-ink-500">{axis.name}</div>
      <div className="mt-0.5 flex items-baseline gap-1.5">
        <div className="text-xl font-semibold tabular-nums">
          {formatScore(avg.current, axis)}
        </div>
        {Icon && avg.delta !== null && (
          <div className={`flex items-center gap-0.5 text-xs tabular-nums ${tone}`}>
            <Icon size={12} />
            {Math.abs(avg.delta).toFixed(dec)}
          </div>
        )}
      </div>
      <div className="text-[10px] text-ink-400 dark:text-ink-500">7-day avg</div>
    </div>
  );
}
