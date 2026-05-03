import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { useAxes, useTrackingTypes, createAxis, updateAxis, deleteAxis } from '@/db/repo';
import type { Axis } from '@/types';
import { isAxisValid } from '@/lib/score';
import { useToast } from '@/components/ui/Toast';

export function Axes() {
  const axes = useAxes();
  const types = useTrackingTypes();
  const [editing, setEditing] = useState<Axis | null>(null);
  const [creating, setCreating] = useState(false);
  const toast = useToast();

  const usageById = useMemo(() => {
    const map = new Map<string, number>();
    (types ?? []).forEach((t) => {
      map.set(t.axisXId, (map.get(t.axisXId) ?? 0) + 1);
      if (t.axisYId) map.set(t.axisYId, (map.get(t.axisYId) ?? 0) + 1);
    });
    return map;
  }, [types]);

  return (
    <div>
      <Link
        to="/settings"
        className="mb-3 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900"
      >
        <ChevronLeft size={16} /> Settings
      </Link>
      <PageHeader
        title="Axes"
        subtitle="Define scales — each tracking type maps to one or two axes."
        action={
          <button
            type="button"
            className="btn-primary"
            onClick={() => setCreating(true)}
          >
            <Plus size={16} /> New axis
          </button>
        }
      />

      {axes && axes.length === 0 && (
        <EmptyState
          title="No axes yet"
          description="Start with one — for example, a 1–10 'Energy' axis."
          action={
            <button className="btn-primary" onClick={() => setCreating(true)}>
              <Plus size={16} /> Create first axis
            </button>
          }
        />
      )}

      {axes && axes.length > 0 && (
        <ul className="space-y-2">
          {axes.map((axis) => {
            const usage = usageById.get(axis.id) ?? 0;
            return (
              <li
                key={axis.id}
                className="flex items-center justify-between rounded-2xl border border-ink-200 bg-white p-4"
              >
                <div className="min-w-0">
                  <div className="font-medium">{axis.name}</div>
                  <div className="mt-0.5 text-xs text-ink-500">
                    {axis.min} → {axis.max} · step {axis.step} · used by {usage}{' '}
                    type{usage === 1 ? '' : 's'}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="btn-ghost p-2"
                    aria-label={`Edit ${axis.name}`}
                    onClick={() => setEditing(axis)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn-ghost p-2 text-red-600 hover:bg-red-50"
                    aria-label={`Delete ${axis.name}`}
                    onClick={async () => {
                      if (usage > 0) {
                        toast.show(
                          `Cannot delete: used by ${usage} tracking type${usage === 1 ? '' : 's'}.`,
                          'error',
                        );
                        return;
                      }
                      if (!confirm(`Delete axis "${axis.name}"?`)) return;
                      try {
                        await deleteAxis(axis.id);
                        toast.show('Axis deleted');
                      } catch (e) {
                        toast.show((e as Error).message, 'error');
                      }
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <AxisForm
        open={creating || editing !== null}
        axis={editing}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSubmit={async (data) => {
          if (editing) {
            await updateAxis(editing.id, data);
            toast.show('Axis updated');
          } else {
            await createAxis(data);
            toast.show('Axis created');
          }
          setCreating(false);
          setEditing(null);
        }}
      />
    </div>
  );
}

type FormProps = {
  open: boolean;
  axis: Axis | null;
  onClose: () => void;
  onSubmit: (data: Omit<Axis, 'id' | 'createdAt'>) => Promise<void> | void;
};

function AxisForm({ open, axis, onClose, onSubmit }: FormProps) {
  const [name, setName] = useState(axis?.name ?? '');
  const [min, setMin] = useState(axis ? String(axis.min) : '0');
  const [max, setMax] = useState(axis ? String(axis.max) : '10');
  const [step, setStep] = useState(axis ? String(axis.step) : '1');
  const [error, setError] = useState<string | null>(null);

  // Sync internal state when the axis prop changes (modal reused for edit)
  const key = axis?.id ?? 'new';
  return (
    <Modal
      key={key}
      open={open}
      onClose={onClose}
      title={axis ? 'Edit axis' : 'New axis'}
      footer={
        <>
          <button className="btn-ghost" onClick={onClose} type="button">
            Cancel
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={async () => {
              const data = {
                name: name.trim(),
                min: Number(min),
                max: Number(max),
                step: Number(step),
              };
              if (!data.name) return setError('Name is required.');
              const v = isAxisValid(data);
              if (!v.ok) return setError(v.reason);
              setError(null);
              await onSubmit(data);
            }}
          >
            {axis ? 'Save' : 'Create'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="axis-name">
            Name
          </label>
          <input
            id="axis-name"
            className="input mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Happiness"
            autoFocus
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="label" htmlFor="axis-min">Min</label>
            <input
              id="axis-min"
              className="input mt-1"
              type="number"
              value={min}
              onChange={(e) => setMin(e.target.value)}
              inputMode="decimal"
            />
          </div>
          <div>
            <label className="label" htmlFor="axis-max">Max</label>
            <input
              id="axis-max"
              className="input mt-1"
              type="number"
              value={max}
              onChange={(e) => setMax(e.target.value)}
              inputMode="decimal"
            />
          </div>
          <div>
            <label className="label" htmlFor="axis-step">Step</label>
            <input
              id="axis-step"
              className="input mt-1"
              type="number"
              value={step}
              onChange={(e) => setStep(e.target.value)}
              inputMode="decimal"
              min="0"
            />
          </div>
        </div>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <p className="text-xs text-ink-500">
          Step must divide the range evenly. Examples: 1–10 step 0.5, -1 to 1 step 1, 0–100 step 5.
        </p>
      </div>
    </Modal>
  );
}
