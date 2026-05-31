import { useMemo, useState } from 'react';
import { Plus, Pencil, Trash2, ChevronLeft, Layers, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { DescriptionInfo } from '@/components/ui/DescriptionInfo';
import {
  useAxes,
  useTrackingTypes,
  useEntries,
  createTrackingType,
  updateTrackingType,
  deleteTrackingType,
} from '@/db/repo';
import { PALETTE, nextColor } from '@/lib/color';
import { REGION_PALETTE, newRegionId, validateRegions } from '@/lib/regions';
import { useToast } from '@/components/ui/Toast';
import type { Axis, ChartRegion, TrackingType } from '@/types';

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
                    <div className="flex items-center gap-1.5">
                      <span className="font-medium">{t.name}</span>
                      <DescriptionInfo
                        title={t.name}
                        description={t.description}
                        showShort={false}
                      />
                    </div>
                    <div className="mt-0.5 text-xs text-ink-500 dark:text-ink-400">
                      {t.axisYId ? '2D' : '1D'} · X: {axisName(t.axisXId)}
                      {t.axisYId && <> · Y: {axisName(t.axisYId)}</>} · {usage} entr{usage === 1 ? 'y' : 'ies'}
                      {t.regions && t.regions.length > 0 && (
                        <> · {t.regions.length} region{t.regions.length === 1 ? '' : 's'}</>
                      )}
                    </div>
                    {t.shortDescription && (
                      <div className="mt-1 text-xs text-ink-500 dark:text-ink-400">
                        {t.shortDescription}
                      </div>
                    )}
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
        key={editing?.id ?? (creating ? 'new' : 'closed')}
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
  const [shortDescription, setShortDescription] = useState(type?.shortDescription ?? '');
  const [description, setDescription] = useState(type?.description ?? '');
  const [regions, setRegions] = useState<ChartRegion[]>(type?.regions ?? []);
  const [error, setError] = useState<string | null>(null);

  const resolvedXId = axisXId || axes?.[0]?.id || '';
  const axisX = axes?.find((a) => a.id === resolvedXId) ?? null;
  const axisY = is2D ? axes?.find((a) => a.id === axisYId) ?? null : null;

  const addRegion = () => {
    if (!axisX || !axisY) return;
    const midX = (axisX.min + axisX.max) / 2;
    const midY = (axisY.min + axisY.max) / 2;
    setRegions((prev) => [
      ...prev,
      {
        id: newRegionId(),
        x1: axisX.min,
        x2: midX,
        y1: axisY.min,
        y2: midY,
        color: REGION_PALETTE[prev.length % REGION_PALETTE.length],
        label: '',
      },
    ]);
  };
  const updateRegion = (id: string, patch: Partial<ChartRegion>) => {
    setRegions((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };
  const removeRegion = (id: string) => {
    setRegions((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <Modal
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
              const cleanedRegions: ChartRegion[] = is2D
                ? regions.map((r) => ({
                    id: r.id,
                    x1: Number(r.x1),
                    x2: Number(r.x2),
                    y1: Number(r.y1),
                    y2: Number(r.y2),
                    color: r.color,
                    label: r.label?.trim() || undefined,
                    opacity: typeof r.opacity === 'number' ? r.opacity : undefined,
                  }))
                : [];
              if (is2D && axisX && axisY) {
                const regionError = validateRegions(axisX, axisY, cleanedRegions);
                if (regionError) return setError(regionError);
              }
              setError(null);
              await onSubmit({
                name: trimmed,
                color,
                axisXId: x,
                axisYId: is2D ? axisYId : null,
                regions: cleanedRegions.length > 0 ? cleanedRegions : undefined,
                shortDescription: shortDescription.trim() || undefined,
                description: description.trim() || undefined,
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
          <label className="label" htmlFor="tt-short">Short description (optional)</label>
          <input
            id="tt-short"
            className="input mt-1"
            value={shortDescription}
            onChange={(e) => setShortDescription(e.target.value)}
            placeholder="One line shown under the name"
          />
        </div>
        <div>
          <label className="label" htmlFor="tt-desc">Full description (optional)</label>
          <textarea
            id="tt-desc"
            className="input mt-1 min-h-[72px] resize-y"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Longer explanation, shown behind an info button"
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

        {is2D && axisX && axisY && (
          <RegionsEditor
            axisX={axisX}
            axisY={axisY}
            regions={regions}
            onAdd={addRegion}
            onUpdate={updateRegion}
            onRemove={removeRegion}
          />
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}

type RegionsEditorProps = {
  axisX: Axis;
  axisY: Axis;
  regions: ChartRegion[];
  onAdd: () => void;
  onUpdate: (id: string, patch: Partial<ChartRegion>) => void;
  onRemove: (id: string) => void;
};

function RegionsEditor({ axisX, axisY, regions, onAdd, onUpdate, onRemove }: RegionsEditorProps) {
  return (
    <div className="rounded-xl border border-ink-200 bg-ink-50 p-3 dark:border-ink-800 dark:bg-ink-800/40">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Quadrants / regions (optional)</div>
          <div className="text-xs text-ink-500 dark:text-ink-400">
            Colored rectangles shaded on the 2D chart and input pad.
          </div>
        </div>
        <button type="button" className="btn-ghost text-xs" onClick={onAdd}>
          <Plus size={14} /> Add region
        </button>
      </div>

      {regions.length > 0 && (
        <ul className="mt-3 space-y-2">
          {regions.map((r) => (
            <li
              key={r.id}
              className="rounded-lg border border-ink-200 bg-white p-2 dark:border-ink-800 dark:bg-ink-900"
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-4 w-4 shrink-0 rounded"
                  style={{ backgroundColor: r.color }}
                />
                <input
                  className="input flex-1 py-1 text-sm"
                  placeholder="Label (optional)"
                  value={r.label ?? ''}
                  onChange={(e) => onUpdate(r.id, { label: e.target.value })}
                />
                <button
                  type="button"
                  className="btn-ghost p-1.5"
                  aria-label="Remove region"
                  onClick={() => onRemove(r.id)}
                >
                  <X size={14} />
                </button>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2">
                <label className="text-[10px] uppercase tracking-wide text-ink-500 dark:text-ink-400">
                  {axisX.name} from
                  <input
                    className="input mt-0.5 py-1 text-sm tabular-nums"
                    type="number"
                    inputMode="decimal"
                    value={String(r.x1)}
                    onChange={(e) => onUpdate(r.id, { x1: Number(e.target.value) })}
                  />
                </label>
                <label className="text-[10px] uppercase tracking-wide text-ink-500 dark:text-ink-400">
                  {axisX.name} to
                  <input
                    className="input mt-0.5 py-1 text-sm tabular-nums"
                    type="number"
                    inputMode="decimal"
                    value={String(r.x2)}
                    onChange={(e) => onUpdate(r.id, { x2: Number(e.target.value) })}
                  />
                </label>
                <label className="text-[10px] uppercase tracking-wide text-ink-500 dark:text-ink-400">
                  {axisY.name} from
                  <input
                    className="input mt-0.5 py-1 text-sm tabular-nums"
                    type="number"
                    inputMode="decimal"
                    value={String(r.y1)}
                    onChange={(e) => onUpdate(r.id, { y1: Number(e.target.value) })}
                  />
                </label>
                <label className="text-[10px] uppercase tracking-wide text-ink-500 dark:text-ink-400">
                  {axisY.name} to
                  <input
                    className="input mt-0.5 py-1 text-sm tabular-nums"
                    type="number"
                    inputMode="decimal"
                    value={String(r.y2)}
                    onChange={(e) => onUpdate(r.id, { y2: Number(e.target.value) })}
                  />
                </label>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {REGION_PALETTE.map((c) => (
                  <button
                    key={c}
                    type="button"
                    aria-label={`Region color ${c}`}
                    className={[
                      'h-5 w-5 rounded-full ring-1 ring-ink-300 dark:ring-ink-700',
                      r.color === c ? 'ring-2 ring-ink-900 dark:ring-ink-50' : '',
                    ].join(' ')}
                    style={{ backgroundColor: c }}
                    onClick={() => onUpdate(r.id, { color: c })}
                  />
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
