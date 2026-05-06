import {
  CartesianGrid,
  ReferenceArea,
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
import { resolveBands, type ResolvedBand } from '@/lib/bands';

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
    return <div className="rounded-xl bg-ink-50 p-6 text-center text-sm text-ink-400 dark:bg-ink-800/50 dark:text-ink-500">No data in range.</div>;
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

  const bandsX = resolveBands(axisX);
  const bandsY = resolveBands(axisY);
  const cells = buildBandCells(axisX, axisY, bandsX, bandsY);

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 10, right: 16, bottom: 16, left: -8 }}>
          <CartesianGrid stroke="var(--chart-grid)" strokeDasharray="3 3" />
          {cells.map((c) => (
            <ReferenceArea
              key={c.key}
              x1={c.x1}
              x2={c.x2}
              y1={c.y1}
              y2={c.y2}
              fill={c.fill}
              fillOpacity={c.opacity}
              stroke="none"
              ifOverflow="extendDomain"
              label={
                c.label
                  ? {
                      value: c.label,
                      position: 'insideTopLeft',
                      fontSize: 10,
                      fill: 'var(--chart-text)',
                    }
                  : undefined
              }
            />
          ))}
          <XAxis
            type="number"
            dataKey="x"
            domain={[axisX.min, axisX.max]}
            name={axisX.name}
            stroke="var(--chart-axis)"
            fontSize={11}
            label={{ value: axisX.name, position: 'insideBottom', offset: -8, fontSize: 11, fill: 'var(--chart-text)' }}
          />
          <YAxis
            type="number"
            dataKey="y"
            domain={[axisY.min, axisY.max]}
            name={axisY.name}
            stroke="var(--chart-axis)"
            fontSize={11}
            width={40}
            label={{ value: axisY.name, angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--chart-text)' }}
          />
          <ZAxis range={[60, 60]} />
          <Tooltip
            cursor={{ strokeDasharray: '3 3', stroke: 'var(--chart-text)' }}
            content={({ active, payload }) => {
              if (!active || !payload || payload.length === 0) return null;
              const p = payload[0]?.payload as Point | undefined;
              if (!p) return null;
              return (
                <div className="rounded-lg border border-ink-200 bg-white px-3 py-2 text-xs shadow-md dark:border-ink-800 dark:bg-ink-900">
                  <div className="text-ink-500 dark:text-ink-400">{formatDayShort(p.ts)}</div>
                  <div className="font-semibold tabular-nums" style={{ color }}>
                    {axisX.name}: {p.x} · {axisY.name}: {p.y}
                  </div>
                  {p.entry.title && <div className="mt-0.5 text-ink-700 dark:text-ink-200">{p.entry.title}</div>}
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

type BandCell = {
  key: string;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  fill: string;
  opacity: number;
  label?: string;
};

const NEUTRAL_TINT_A = 'rgba(15, 23, 42, 0.06)';
const NEUTRAL_TINT_B = 'rgba(15, 23, 42, 0.00)';

/**
 * Build the rectangular cells used to shade band regions on the 2D chart.
 * If both axes have bands we render a checkerboard of [xBand] × [yBand] cells;
 * if only one axis has bands we render stripes for that axis.
 */
function buildBandCells(
  axisX: Axis,
  axisY: Axis,
  bandsX: ResolvedBand[],
  bandsY: ResolvedBand[],
): BandCell[] {
  if (bandsX.length === 0 && bandsY.length === 0) return [];
  // Treat the absent axis as a single full-range "band" so the cell math is uniform.
  const xs = bandsX.length > 0 ? bandsX : [fullSpanBand(axisX)];
  const ys = bandsY.length > 0 ? bandsY : [fullSpanBand(axisY)];
  const cells: BandCell[] = [];
  for (let i = 0; i < xs.length; i++) {
    for (let j = 0; j < ys.length; j++) {
      const xb = xs[i];
      const yb = ys[j];
      const explicit =
        (bandsX.length > 0 && xb.hasExplicitColor) ||
        (bandsY.length > 0 && yb.hasExplicitColor);
      // If either band has an explicit color, prefer it (X wins for cells).
      let fill: string;
      let opacity: number;
      if (explicit) {
        fill = xb.hasExplicitColor && bandsX.length > 0 ? xb.color : yb.color;
        opacity = 0.35;
      } else {
        fill = (i + j) % 2 === 0 ? NEUTRAL_TINT_A : NEUTRAL_TINT_B;
        opacity = 1;
      }
      // Only the top-left cell of each X band shows the X label, similarly for Y —
      // avoids clutter while still giving users a quadrant readout.
      const labelParts: string[] = [];
      if (j === ys.length - 1 && xb.label) labelParts.push(xb.label);
      if (i === 0 && yb.label) labelParts.push(yb.label);
      cells.push({
        key: `${xb.id}:${yb.id}`,
        x1: xb.from,
        x2: xb.to,
        y1: yb.from,
        y2: yb.to,
        fill,
        opacity,
        label: labelParts.join(' · ') || undefined,
      });
    }
  }
  return cells;
}

function fullSpanBand(axis: Axis): ResolvedBand {
  return {
    id: `${axis.id}:full`,
    from: axis.min,
    to: axis.max,
    color: NEUTRAL_TINT_B,
    hasExplicitColor: false,
  };
}
