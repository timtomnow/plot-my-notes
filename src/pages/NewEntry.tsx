import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useSearchParams, Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Slider1D } from '@/components/inputs/Slider1D';
import { Pad2D } from '@/components/inputs/Pad2D';
import { TagInput } from '@/components/inputs/TagInput';
import { dedupeTags, rankTags } from '@/lib/tags';
import {
  useAxes,
  useTrackingTypes,
  useEntries,
  createEntry,
  updateEntry,
  useEntry,
} from '@/db/repo';
import {
  fromDateInputValue,
  toDateInputValue,
  todayStart,
} from '@/lib/date';
import { useToast } from '@/components/ui/Toast';

const LAST_TYPE_KEY = 'pmn:lastTypeId';

export function NewEntry() {
  const params = useParams();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('edit');
  const editing = useEntry(editId);
  const types = useTrackingTypes();
  const axes = useAxes();
  const recent = useEntries({ limit: 50 });
  const navigate = useNavigate();
  const toast = useToast();

  // Selected tracking type — initial preference: URL param > editing entry > last used > most recent in entries > first
  const [trackingTypeId, setTrackingTypeId] = useState<string | null>(null);
  useEffect(() => {
    if (trackingTypeId) return;
    if (!types || types.length === 0) return;
    const fromUrl = params.trackingTypeId && types.some((t) => t.id === params.trackingTypeId) ? params.trackingTypeId : null;
    const fromEdit = editing?.trackingTypeId;
    const fromStorage = (() => {
      try {
        const v = localStorage.getItem(LAST_TYPE_KEY);
        return v && types.some((t) => t.id === v) ? v : null;
      } catch {
        return null;
      }
    })();
    setTrackingTypeId(fromUrl ?? fromEdit ?? fromStorage ?? types[0].id);
  }, [params.trackingTypeId, editing?.trackingTypeId, types, trackingTypeId]);

  const trackingType = useMemo(
    () => types?.find((t) => t.id === trackingTypeId) ?? null,
    [types, trackingTypeId],
  );
  const axisX = useMemo(
    () => axes?.find((a) => a.id === trackingType?.axisXId) ?? null,
    [axes, trackingType],
  );
  const axisY = useMemo(
    () => (trackingType?.axisYId ? axes?.find((a) => a.id === trackingType.axisYId) ?? null : null),
    [axes, trackingType],
  );

  // Centered initial values; reset whenever the type changes (or load editing entry)
  const [x, setX] = useState<number>(0);
  const [y, setY] = useState<number>(0);
  const [date, setDate] = useState<number>(todayStart());
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const allEntries = useEntries();
  const tagSuggestions = useMemo(() => rankTags(allEntries), [allEntries]);

  useEffect(() => {
    if (editing && editing.trackingTypeId === trackingTypeId) {
      setX(editing.x);
      setY(editing.y ?? 0);
      setDate(editing.date);
      setTitle(editing.title ?? '');
      setNotes(editing.notes ?? '');
      setTags(editing.tags ?? []);
      return;
    }
    if (axisX) setX((axisX.min + axisX.max) / 2);
    if (axisY) setY((axisY.min + axisY.max) / 2);
  }, [trackingTypeId, axisX, axisY, editing]);

  // Recently-used type ordering
  const orderedTypes = useMemo(() => {
    if (!types) return [];
    const lastUsed = new Map<string, number>();
    (recent ?? []).forEach((e) => {
      const cur = lastUsed.get(e.trackingTypeId) ?? 0;
      if (e.createdAt > cur) lastUsed.set(e.trackingTypeId, e.createdAt);
    });
    return [...types].sort((a, b) => (lastUsed.get(b.id) ?? 0) - (lastUsed.get(a.id) ?? 0));
  }, [types, recent]);

  if (types && types.length === 0) {
    return (
      <div>
        <PageHeader title="New entry" />
        <EmptyState
          icon={<Plus size={32} />}
          title="Set up your first tracking type"
          description="You need at least one axis and a tracking type before you can log."
          action={
            <Link to="/settings/axes" className="btn-primary">
              Get started
            </Link>
          }
        />
      </div>
    );
  }

  const canSave = !!trackingType && !!axisX && (!trackingType.axisYId || !!axisY);

  return (
    <div>
      <PageHeader
        title={editing ? 'Edit entry' : 'New entry'}
        subtitle={editing ? 'Update and save.' : 'Pick a type, set the score, save.'}
      />

      {/* Type chips */}
      <div className="mb-6 -mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max gap-2">
          {orderedTypes.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => {
                setTrackingTypeId(t.id);
                try { localStorage.setItem(LAST_TYPE_KEY, t.id); } catch { /* ignore */ }
              }}
              className={[
                'chip',
                trackingTypeId === t.id ? 'chip-active' : '',
              ].join(' ')}
            >
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
              {t.name}
              <span className="ml-1 text-[10px] opacity-60">
                {t.axisYId ? '2D' : '1D'}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Score input */}
      <div className="card p-5">
        {axisX && !axisY && (
          <Slider1D axis={axisX} value={x} onChange={setX} />
        )}
        {axisX && axisY && (
          <Pad2D
            axisX={axisX}
            axisY={axisY}
            x={x}
            y={y}
            color={trackingType?.color}
            onChange={(nx, ny) => {
              setX(nx);
              setY(ny);
            }}
          />
        )}
      </div>

      {/* Optional details */}
      <div className="mt-4 card p-5 space-y-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="entry-date">Date</label>
            <input
              id="entry-date"
              type="date"
              className="input mt-1"
              value={toDateInputValue(date)}
              onChange={(e) => setDate(fromDateInputValue(e.target.value))}
              max={toDateInputValue(todayStart())}
            />
          </div>
          <div>
            <label className="label" htmlFor="entry-title">Title (optional)</label>
            <input
              id="entry-title"
              className="input mt-1"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="A word or two"
            />
          </div>
        </div>
        <div>
          <label className="label" htmlFor="entry-notes">Notes (optional)</label>
          <textarea
            id="entry-notes"
            className="input mt-1 min-h-[88px] resize-y"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="What happened? What helped?"
          />
        </div>
        <div>
          <span className="label">Tags (optional)</span>
          <div className="mt-1">
            <TagInput value={tags} onChange={setTags} suggestions={tagSuggestions} />
          </div>
        </div>
      </div>

      {/* Save bar */}
      <div className="sticky bottom-[calc(80px+var(--safe-bottom))] z-10 mt-6 md:bottom-6">
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!canSave}
            className="btn-primary px-6"
            onClick={async () => {
              if (!trackingType) return;
              try {
                const cleanedTags = dedupeTags(tags);
                if (editing) {
                  await updateEntry(editing.id, {
                    trackingTypeId: trackingType.id,
                    date,
                    x,
                    y: trackingType.axisYId ? y : null,
                    title: title.trim() || undefined,
                    notes: notes.trim() || undefined,
                    tags: cleanedTags.length > 0 ? cleanedTags : undefined,
                  });
                  toast.show('Entry updated');
                } else {
                  await createEntry({
                    trackingTypeId: trackingType.id,
                    date,
                    x,
                    y: trackingType.axisYId ? y : null,
                    title: title.trim() || undefined,
                    notes: notes.trim() || undefined,
                    tags: cleanedTags.length > 0 ? cleanedTags : undefined,
                  });
                  toast.show('Entry saved');
                }
                try { localStorage.setItem(LAST_TYPE_KEY, trackingType.id); } catch { /* ignore */ }
                navigate('/');
              } catch (e) {
                toast.show((e as Error).message, 'error');
              }
            }}
          >
            {editing ? 'Save changes' : 'Save entry'}
          </button>
        </div>
      </div>
    </div>
  );
}
