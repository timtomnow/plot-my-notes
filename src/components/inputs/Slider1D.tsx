import { useId } from 'react';
import type { Axis } from '@/types';
import { formatScore, snapToStep } from '@/lib/score';

type Props = {
  axis: Axis;
  value: number;
  onChange: (v: number) => void;
};

export function Slider1D({ axis, value, onChange }: Props) {
  const id = useId();
  return (
    <div className="space-y-3">
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="label">
          {axis.name}
        </label>
        <div className="text-3xl font-semibold tabular-nums">
          {formatScore(value, axis)}
        </div>
      </div>
      <input
        id={id}
        type="range"
        min={axis.min}
        max={axis.max}
        step={axis.step}
        value={value}
        onChange={(e) => onChange(snapToStep(Number(e.target.value), axis))}
        className="h-12 w-full cursor-pointer accent-ink-900"
      />
      <div className="flex justify-between text-xs text-ink-400 dark:text-ink-500">
        <span>{axis.min}</span>
        <span>{axis.max}</span>
      </div>
    </div>
  );
}
