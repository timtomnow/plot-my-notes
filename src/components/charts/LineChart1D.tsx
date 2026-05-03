import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Axis, JournalEntry } from '@/types';
import { formatDayShort } from '@/lib/date';

type Props = {
  axis: Axis;
  color: string;
  entries: JournalEntry[];
  onPointClick?: (e: JournalEntry) => void;
};

type Point = {
  ts: number;
  value: number;
  ma?: number | null;
  entry: JournalEntry;
};

export function LineChart1D({ axis, color, entries, onPointClick }: Props) {
  const sorted = [...entries].sort((a, b) => a.date - b.date);
  const data: Point[] = sorted.map((e, i) => {
    const window = sorted.slice(Math.max(0, i - 6), i + 1);
    const ma = window.reduce((acc, p) => acc + p.x, 0) / window.length;
    return { ts: e.date, value: e.x, ma: window.length >= 3 ? ma : null, entry: e };
  });

  if (data.length === 0) {
    return <div className="rounded-xl bg-ink-50 p-6 text-center text-sm text-ink-400">No data in range.</div>;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 10, right: 16, bottom: 0, left: -16 }}>
          <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" vertical={false} />
          <XAxis
            dataKey="ts"
            tickFormatter={(v: number) => formatDayShort(v)}
            stroke="#a1a1aa"
            fontSize={11}
            tickMargin={8}
          />
          <YAxis
            domain={[axis.min, axis.max]}
            stroke="#a1a1aa"
            fontSize={11}
            width={40}
          />
          <Tooltip
            cursor={{ stroke: '#71717a', strokeDasharray: '3 3' }}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const p = payload[0]?.payload as Point | undefined;
              if (!p) return null;
              return (
                <div className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs shadow-md">
                  <div className="text-ink-500">{formatDayShort(p.ts)}</div>
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
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
