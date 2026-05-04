import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, ChevronLeft, Layers } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import {
  useAxes,
  useTrackingTypes,
  useEntries,
  createTrackingType,
  updateTrackingType,
  deleteTrackingType,
} from '@/db/repo';
import { PALETTE, nextColor } from '@/lib/color';
import { useToast } from '@/components/ui/Toast';
import type { TrackingType } from '@/types';

export function TrackingTypes() {
  const types = useTrackingTypes();
  const axes = useAxes();
  const allEntries = useEntries();
  const [editing, setEditing] = useState<TrackingType | null>(null);
  const [creating, setCreating] = useState(false);
  const toast = useToast();

  const usageById = useMemo(() => {
    const map = new Map<string, number>();
    (allEntries ?? []).forEach((e) => {
      map.set(e.trackingTypeId, (map.get(e.trackingTypeId) ?? 0) + 1);
    });
    return map;
  }, [allEntries]);

  const axisName = (id: string | null | undefined) =>
    id ? axes?.find((a) => a.id === id)?.name ?? '—' : '—';

  if (axes && axes.length === 0) {
    return (
      <div>
        <Link to="/settings" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-50">
          <ChevronLeft size={16} /> Settings
        </Link>
        <PageHeader title="Tracking Types" />
        <EmptyState
          icon={<Layers size={32} />}
          title="Create an axis first"
          description="A tracking type combines one or two axes. Define your axes, then come back."
          action={
            <Link to="/settings/axes" className="btn-primary">
              Go to Axes
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div>
      <Link to="/settings" className="mb-3 inline-flex items-center gap-1 text-sm text-ink-500 hover:text-ink-900 dark:text-ink-400 dark:hover:text-ink-50">
        <ChevronLeft size={16} /> Settings
      </Link>
      <PageHeader
        title="Tracking Types"
        subtitle="What you log — combine one or two axes (1D or 2D)."
        action={
          <button className="btn-primary" type="button" onClick={() => setCreating(true)}>
            <Plus size={16} /> New type
          </button>
        }
      />

      {types && types.length === 0 && (
        <EmptyState
          title="No tracking types yet"
          description="Create one — for example, a 2D 'Mood' type combining Happiness and Energy."
          action={
            <button className="btn-primary" onClick={() => setCreating(true)}>
              <Plus size={16} /> Create type
            </button>
          }
        />
      )}

      {types && types.length > 0 && (
        <ul className="space-y-2">
          {types.map((t) => {
            const usage = usageById.get(t.id) ?? 0;
            return (
              <li key={t.id} className="flex items-center justify-between rounded-2xl border border-ink-200 bg-white p-4 dark:border-ink-800 dark:bg-ink-900">
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className="h-3.5 w-3.5 shrink-0 rounded-full"
                    style={{ backgroundColor: t.color }}
                  />
                  <div className="min-w-0">
                    <div className="font-medium">{t.name}</div>
                    <div className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                      {t.axisYId ? '2D' : '1D'} · X: {axisName(t.axisXId)}
                      {t.axisYId && <> · Y: {axisName(t.axisYId)}</>} · {usage} entr{usage === 1 ? 'y' : 'ies'}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="btn-ghost p-2"
                    aria-label={`Edit ${t.name}`}
                    onClick={() => setEditing(t)}
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    type="button"
                    className="btn-ghost p-2 text-red-600 hover:bg-red-50"
                    aria-label={`Delete ${t.name}`}
                    onClick={async () => {
                      if (usage > 0) {
                        toast.show(
                          `Cannot delete: has ${usage} entr${usage === 1 ? 'y' : 'ies'}.`,
                          'error',
                        );
                        return;
                      }
                      if (!confirm(`Delete tracking type "${t.name}"?`)) return;
                      try {
                        await deleteTrackingType(t.id);
                        toast.show('Type deleted');
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

      <TrackingTypeForm
        open={creating || editing !== null}
        type={editing}
        existingColors={(types ?? []).map((t) => t.color)}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        onSubmit={async (data) => {
          if (editing) {
            await updateTrackingType(editing.id, data);
            toast.show('Type updated');
          } else {
            await createTrackingType(data);
            toast.show('Type created');
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
  type: TrackingType | null;
  existingColors: string[];
  onClose: () => void;
  onSubmit: (data: Omit<TrackingType, 'id' | 'createdAt'>) => Promise<void> | void;
};

function TrackingTypeForm({ open, type, existingColors, onClose, onSubmit }: FormProps) {
  const axes = useAxes();
  const [name, setName] = useState(type?.name ?? '');
  const [color, setColor] = useState(type?.color ?? nextColor(existingColors));
  const [axisXId, setAxisXId] = useState(type?.axisXId ?? '');
  const [is2D, setIs2D] = useState(!!type?.axisYId);
  const [axisYId, setAxisYId] = useState(type?.axisYId ?? '');
  const [error, setError] = useState<string | null>(null);

  const key = type?.id ?? 'new';

  return (
    <Modal
      key={key}
      open={open}
      onClose={onClose}
      title={type ? 'Edit tracking type' : 'New tracking type'}
      footer={
        <>
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button
            type="button"
            className="btn-primary"
            onClick={async () => {
              const trimmed = name.trim();
              if (!trimmed) return setError('Name is required.');
              const x = axisXId || (axes?.[0]?.id ?? '');
              if (!x) return setError('Pick an X axis.');
              if (is2D && !axisYId) return setError('Pick a Y axis or switch to 1D.');
              if (is2D && axisYId === x) return setError('X and Y axes must differ.');
              setError(null);
              await onSubmit({
                name: trimmed,
                color,
                axisXId: x,
                axisYId: is2D ? axisYId : null,
              });
            }}
          >
            {type ? 'Save' : 'Create'}
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <div>
          <label className="label" htmlFor="tt-name">Name</label>
          <input
            id="tt-name"
            className="input mt-1"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mood, Work, Fitness"
            autoFocus
          />
        </div>

        <div>
          <span className="label">Color</span>
          <div className="mt-2 flex flex-wrap gap-2">
            {PALETTE.map((c) => (
              <button
                key={c}
                type="button"
                className={[
                  'h-8 w-8 rounded-full ring-2 ring-offset-2 ring-offset-white transition',
                  color === c ? 'ring-ink-900' : 'ring-transparent',
                ].join(' ')}
                style={{ backgroundColor: c }}
                aria-label={`Color ${c}`}
                onClick={() => setColor(c)}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-ink-200 bg-ink-50 p-3 dark:border-ink-800 dark:bg-ink-800/40">
          <div>
            <div className="text-sm font-medium">2D tracking</div>
            <div className="text-xs text-ink-500 dark:text-ink-400">Use a second axis (e.g. Energy along with Happiness).</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={is2D}
            onClick={() => setIs2D((v) => !v)}
            className={[
              'relative h-6 w-11 rounded-full transition',
              is2D ? 'bg-ink-900 dark:bg-ink-50' : 'bg-ink-300 dark:bg-ink-700',
            ].join(' ')}
          >
            <span
              className={[
                'absolute top-0.5 h-5 w-5 rounded-full bg-white transition dark:bg-ink-900',
                is2D ? 'left-[22px]' : 'left-0.5',
              ].join(' ')}
            />
          </button>
        </div>

        <div>
          <label className="label" htmlFor="tt-x">X axis</label>
          <select
            id="tt-x"
            className="input mt-1"
            value={axisXId || axes?.[0]?.id || ''}
            onChange={(e) => setAxisXId(e.target.value)}
          >
            {axes?.map((a) => (
              <option key={a.id} value={a.id}>{a.name} ({a.min}–{a.max})</option>
            ))}
          </select>
        </div>

        {is2D && (
          <div>
            <label className="label" htmlFor="tt-y">Y axis</label>
            <select
              id="tt-y"
              className="input mt-1"
              value={axisYId}
              onChange={(e) => setAxisYId(e.target.value)}
            >
              <option value="">Choose…</option>
              {axes?.map((a) => (
                <option key={a.id} value={a.id}>{a.name} ({a.min}–{a.max})</option>
              ))}
            </select>
          </div>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
