import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Axis, JournalEntry } from '@/types';
import { formatDayShort } from '@/lib/date';
import { resolveBands } from '@/lib/bands';

type Props = {
  axis: Axis;
  color: string;
  entries: JournalEntry[];
  /** Which field of the entry to plot on the y-axis. Defaults to 'x'. */
  field?: 'x' | 'y';
  /** Tailwind height class, e.g. 'h-72' (default) or 'h-40' for compact charts. */
  heightClass?: string;
  showMovingAverage?: boolean;
  onPointClick?: (e: JournalEntry) => void;
};

type Point = {
  ts: number;
  value: number;
  ma?: number | null;
  entry: JournalEntry;
};

export function LineChart1D({
  axis,
  color,
  entries,
  field = 'x',
  heightClass = 'h-72',
  showMovingAverage = true,
  onPointClick,
}: Props) {
  const sorted = [...entries]
    .filter((e) => {
      const v = field === 'x' ? e.x : e.y;
      return v !== null && v !== undefined;
    })
    .sort((a, b) => a.date - b.date);

  const data: Point[] = sorted.map((e, i) => {
    const value = (field === 'x' ? e.x : (e.y as number));
    const window = sorted.slice(Math.max(0, i - 6), i + 1);
    const ma =
      window.reduce((acc, p) => acc + (field === 'x' ? p.x : (p.y as number)), 0) /
      window.length;
    return { ts: e.date, value, ma: window.length >= 3 ? ma : null, entry: e };
  });

  if (data.length === 0) {
    return <div className="rounded-xl bg-ink-50 p-6 text-center text-sm text-ink-400 dark:bg-ink-800/50 dark:text-ink-500">No data in range.</div>;
  }

  return (
    <div className={`${heightClass} w-full`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" vertical={false} />
          {resolveBands(axis).map((b) => (
            <ReferenceArea
              key={b.id}
              y1={b.from}
              y2={b.to}
              fill={b.color}
              fillOpacity={b.hasExplicitColor ? 0.35 : 1}
              stroke="none"
              ifOverflow="extendDomain"
              label={
                b.label
                  ? {
                      value: b.label,
                      position: 'insideTopRight',
                      fontSize: 10,
                      fill: 'var(--chart-text)',
                    }
                  : undefined
              }
            />
          ))}
          <XAxis
            dataKey="ts"
            tickFormatter={(v: number) => formatDayShort(v)}
            stroke="var(--chart-axis)"
            fontSize={11}
            tickMargin={8}
          />
          <YAxis
            domain={[axis.min, axis.max]}
            stroke="var(--chart-axis)"
            fontSize={11}
            width={40}
          />
          <Tooltip
            cursor={{ stroke: 'var(--chart-text)', strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const p = payload[0]?.payload as Point | undefined;
              if (!p) return null;
              return (
                <div className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs shadow-md dark:border-ink-800 dark:bg-ink-900">
                  <div className="text-ink-500 dark:text-ink-400">{formatDayShort(p.ts)}</div>
                  <div className="font-semibold tabular-nums" style={{ color }}>
                    {p.entry.title || axis.name}: {p.value}
                  </div>
                </div>
              );
            }}
          />
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3, fill: color, strokeWidth: 0 }}
            activeDot={{
              r: 5,
              onClick: (_e, payload) => {
                const p = (payload as unknown as { payload?: Point })?.payload;
                if (p && onPointClick) onPointClick(p.entry);
              },
            }}
            isAnimationActive={false}
          />
          {showMovingAverage && (
            <Line
              type="monotone"
              dataKey="ma"
              stroke={color}
              strokeOpacity={0.35}
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
              isAnimationActive={false}
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
