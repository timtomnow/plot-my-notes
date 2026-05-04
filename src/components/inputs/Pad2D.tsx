import { useCallback, useEffect, useRef, useState } from 'react';
import type { Axis } from '@/types';
import {
  formatScore,
  fractionToValue,
  snapToStep,
  valueToFraction,
} from '@/lib/score';

type Props = {
  axisX: Axis;
  axisY: Axis;
  x: number;
  y: number;
  color?: string;
  onChange: (x: number, y: number) => void;
};

const PAD_SIZE = 320;
const PAD_PADDING = 32;

/**
 * 2D drag-pad input. Coordinate convention: x increases left→right,
 * y increases bottom→top (so "happier" feels like "up").
 */
export function Pad2D({ axisX, axisY, x, y, color = '#0a0a0a', onChange }: Props) {
  const surfaceRef = useRef<HTMLDivElement | null>(null);
  const [dragging, setDragging] = useState(false);
  const [touched, setTouched] = useState(false);

  const fx = valueToFraction(x, axisX);
  const fy = valueToFraction(y, axisY);

  const updateFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      const surface = surfaceRef.current;
      if (!surface) return;
      const rect = surface.getBoundingClientRect();
      const px = (clientX - rect.left) / rect.width;
      const py = 1 - (clientY - rect.top) / rect.height; // invert Y
      const newX = snapToStep(fractionToValue(Math.min(1, Math.max(0, px)), axisX), axisX);
      const newY = snapToStep(fractionToValue(Math.min(1, Math.max(0, py)), axisY), axisY);
      onChange(newX, newY);
    },
    [axisX, axisY, onChange],
  );

  // Step counts for the visual grid (capped to keep it readable)
  const xSteps = Math.min(20, Math.round((axisX.max - axisX.min) / axisX.step));
  const ySteps = Math.min(20, Math.round((axisY.max - axisY.min) / axisY.step));

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: PointerEvent) => updateFromPointer(e.clientX, e.clientY);
    const onUp = () => setDragging(false);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, [dragging, updateFromPointer]);

  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <div>
          <div className="label">{axisX.name} × {axisY.name}</div>
          <div className="mt-1 text-xs text-ink-400 dark:text-ink-500">Drag the dot or tap anywhere.</div>
        </div>
        <div className="text-right tabular-nums">
          <div className="text-2xl font-semibold leading-tight">
            {formatScore(x, axisX)}, {formatScore(y, axisY)}
          </div>
          <div className="text-xs text-ink-400 dark:text-ink-500">
            {axisX.name}, {axisY.name}
          </div>
        </div>
      </div>

      <div
        className="relative mx-auto select-none"
        style={{ maxWidth: PAD_SIZE }}
      >
        {/* Y axis label (left) */}
        <div
          className="pointer-events-none absolute -left-1 top-0 flex h-full flex-col justify-between text-[10px] text-ink-400 dark:text-ink-500"
          style={{ width: PAD_PADDING - 8 }}
        >
          <span>{axisY.max}</span>
          <span className="rotate-180 [writing-mode:vertical-rl]">{axisY.name}</span>
          <span>{axisY.min}</span>
        </div>

        {/* Surface */}
        <div
          ref={surfaceRef}
          role="application"
          aria-label={`${axisX.name} and ${axisY.name} pad`}
          className="relative aspect-square w-full cursor-crosshair touch-none rounded-2xl border border-ink-200 bg-white shadow-inner dark:border-ink-800 dark:bg-ink-950"
          style={{ marginLeft: PAD_PADDING - 8 }}
          onPointerDown={(e) => {
            (e.target as Element).setPointerCapture?.(e.pointerId);
            setDragging(true);
            setTouched(true);
            updateFromPointer(e.clientX, e.clientY);
          }}
        >
          {/* Grid */}
          <svg className="absolute inset-0 h-full w-full text-ink-200 dark:text-ink-800" preserveAspectRatio="none" viewBox="0 0 100 100">
            {Array.from({ length: xSteps + 1 }, (_, i) => {
              const xp = (i / xSteps) * 100;
              return <line key={`vx-${i}`} x1={xp} y1={0} x2={xp} y2={100} stroke="currentColor" strokeWidth={i === 0 || i === xSteps ? 0.4 : 0.2} />;
            })}
            {Array.from({ length: ySteps + 1 }, (_, i) => {
              const yp = (i / ySteps) * 100;
              return <line key={`hy-${i}`} x1={0} y1={yp} x2={100} y2={yp} stroke="currentColor" strokeWidth={i === 0 || i === ySteps ? 0.4 : 0.2} />;
            })}
            {/* Center crosshair if axis crosses zero */}
            {axisX.min < 0 && axisX.max > 0 && (
              <line x1={(0 - axisX.min) / (axisX.max - axisX.min) * 100} y1={0} x2={(0 - axisX.min) / (axisX.max - axisX.min) * 100} y2={100} stroke="currentColor" strokeWidth={0.6} />
            )}
            {axisY.min < 0 && axisY.max > 0 && (
              <line x1={0} y1={100 - (0 - axisY.min) / (axisY.max - axisY.min) * 100} x2={100} y2={100 - (0 - axisY.min) / (axisY.max - axisY.min) * 100} stroke="currentColor" strokeWidth={0.6} />
            )}
          </svg>

          {/* Thumb */}
          <div
            className={[
              'absolute h-7 w-7 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg transition-opacity',
              dragging ? 'scale-110' : '',
              touched ? 'opacity-100' : 'opacity-90',
            ].join(' ')}
            style={{
              left: `${fx * 100}%`,
              top: `${(1 - fy) * 100}%`,
              backgroundColor: color,
              transition: dragging ? 'transform 60ms ease-out' : 'transform 120ms ease-out, opacity 120ms',
            }}
          />
          {/* Crosshair lines from thumb */}
          <div
            className="pointer-events-none absolute h-px bg-ink-300/70 dark:bg-ink-700/70"
            style={{ left: 0, right: 0, top: `${(1 - fy) * 100}%` }}
          />
          <div
            className="pointer-events-none absolute w-px bg-ink-300/70 dark:bg-ink-700/70"
            style={{ top: 0, bottom: 0, left: `${fx * 100}%` }}
          />
        </div>

        {/* X axis label (bottom) */}
        <div
          className="mt-1 flex items-center justify-between text-[10px] text-ink-400 dark:text-ink-500"
          style={{ marginLeft: PAD_PADDING - 8 }}
        >
          <span>{axisX.min}</span>
          <span>{axisX.name}</span>
          <span>{axisX.max}</span>
        </div>
      </div>
    </div>
  );
}
