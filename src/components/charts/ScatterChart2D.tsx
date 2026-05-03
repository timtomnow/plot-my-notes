import {
  CartesianGrid,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from 'recharts';
import type { Axis, JournalEntry } from '@/types';
import { formatDayShort } from '@/lib/date';

type Props = {
  axisX: Axis;
  axisY: Axis;
  color: string;
  entries: JournalEntry[];
  connectByDate?: boolean;
  onPointClick?: (e: JournalEntry) => void;
};

type Point = {
  x: number;
  y: number;
  ts: number;
  recency: number; // 0..1, 1 = newest
  entry: JournalEntry;
};

export function ScatterChart2D({ axisX, axisY, color, entries, connectByDate, onPointClick }: Props) {
  const filtered = entries.filter((e) => e.y !== null && e.y !== undefined);
  if (filtered.length === 0) {
    return <div className="rounded-xl bg-ink-50 p-6 text-center text-sm text-ink-400">No data in range.</div>;
  }
  const ts = filtered.map((e) => e.date);
  const minTs = Math.min(...ts);
  const maxTs = Math.max(...ts);
  const span = Math.max(1, maxTs - minTs);

  // Recharts draws Scatter `line` in array order — sort by date so the line
  // traces the user's journey through time, not arbitrary insertion order.
  const data: Point[] = filtered
    .slice()
    .sort((a, b) => a.date - b.date)
    .map((e) => ({
      x: e.x,
      y: e.y as number,
      ts: e.date,
      recency: (e.date - minTs) / span,
      entry: e,
    }));

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 16, bottom: 16, left: -8 }}>
          <CartesianGrid stroke="#e4e4e7" strokeDasharray="3 3" />
          <XAxis
            type="number"
            dataKey="x"
            domain={[axisX.min, axisX.max]}
            name={axisX.name}
            stroke="#a1a1aa"
            fontSize={11}
            label={{ value: axisX.name, position: 'insideBottom', offset: -8, fontSize: 11, fill: '#71717a' }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[axisY.min, axisY.max]}
            name={axisY.name}
            stroke="#a1a1aa"
            fontSize={11}
            width={40}
            label={{ value: axisY.name, angle: -90, position: 'insideLeft', fontSize: 11, fill: '#71717a' }}
          />
          <ZAxis range={[60, 60]} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3', stroke: '#71717a' }}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const p = payload[0]?.payload as Point | undefined;
              if (!p) return null;
              return (
                <div className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs shadow-md">
                  <div className="text-ink-500">{formatDayShort(p.ts)}</div>
                  <div className="font-semibold tabular-nums" style={{ color }}>
                    {axisX.name}: {p.x} · {axisY.name}: {p.y}
                  </div>
                  {p.entry.title && <div className="mt-0.5 text-ink-700">{p.entry.title}</div>}
                </div>
              );
            }}
          />
          <Scatter
            data={data}
            fill={color}
            isAnimationActive={false}
            line={connectByDate ? { stroke: color, strokeOpacity: 0.4, strokeWidth: 1.5 } : false}
            lineType="joint"
            onClick={(payload) => {
              const p = payload as unknown as Point;
              if (p?.entry && onPointClick) onPointClick(p.entry);
            }}
            shape={(props: unknown) => {
              const { cx, cy, payload } = props as { cx: number; cy: number; payload: Point };
              const opacity = 0.35 + 0.65 * payload.recency;
              return <circle cx={cx} cy={cy} r={6} fill={color} opacity={opacity} />;
            }}
          />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}
