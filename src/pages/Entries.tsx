import { useMemo, useState } from 'react';
import { Plus, Trash2, Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/PageHeader';
import { EmptyState } from '@/components/ui/EmptyState';
import { Modal } from '@/components/ui/Modal';
import { EntryRow } from '@/components/EntryRow';
import {
  useEntries,
  useTrackingTypes,
  useAxes,
  deleteEntry,
} from '@/db/repo';
import { useToast } from '@/components/ui/Toast';
import { formatDay } from '@/lib/date';
import { startOfDay } from '@/lib/date';
import type { JournalEntry } from '@/types';
import { formatScore } from '@/lib/score';

export function Entries() {
  const types = useTrackingTypes();
  const axes = useAxes();
  const [filter, setFilter] = useState<string | null>(null);
  const entries = useEntries(filter ? { trackingTypeId: filter } : undefined);
  const navigate = useNavigate();
  const toast = useToast();
  const [openEntry, setOpenEntry] = useState<JournalEntry | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<number, JournalEntry[]>();
    (entries ?? []).forEach((e) => {
      const day = startOfDay(e.date);
      const arr = map.get(day) ?? [];
      arr.push(e);
      map.set(day, arr);
    });
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, [entries]);

  const trackingTypeFor = (id: string) => types?.find((t) => t.id === id);
  const axisFor = (id: string | null | undefined) => axes?.find((a) => a.id === id);

  return (
    <div>
      <PageHeader
        title="Entries"
        subtitle={entries ? `${entries.length} total` : undefined}
        action={
          <button className="btn-primary" type="button" onClick={() => navigate('/new')}>
            <Plus size={16} /> New
          </button>
        }
      />

      {/* Filter chips */}
      {types && types.length > 0 && (
        <div className="mb-5 -mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max gap-2">
            <button
              type="button"
              onClick={() => setFilter(null)}
              className={['chip', filter === null ? 'chip-active' : ''].join(' ')}
            >
              All
            </button>
            {types.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setFilter(t.id)}
                className={['chip', filter === t.id ? 'chip-active' : ''].join(' ')}
              >
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
                {t.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {entries && entries.length === 0 && (
        <EmptyState
          title="No entries yet"
          description="Log your first one — it takes about ten seconds."
          action={
            <button className="btn-primary" onClick={() => navigate('/new')}>
              <Plus size={16} /> New entry
            </button>
          }
        />
      )}

      <div className="space-y-6">
        {grouped.map(([day, items]) => (
          <section key={day}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400 dark:text-ink-500">
              {formatDay(day)}
            </h2>
            <ul className="space-y-2">
              {items.map((e) => {
                const t = trackingTypeFor(e.trackingTypeId);
                return (
                  <li key={e.id}>
                    <EntryRow
                      entry={e}
                      trackingType={t}
                      axisX={axisFor(t?.axisXId)}
                      axisY={axisFor(t?.axisYId)}
                      onClick={() => setOpenEntry(e)}
                    />
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <EntryDetail
        entry={openEntry}
        onClose={() => setOpenEntry(null)}
        onEdit={(e) => {
          setOpenEntry(null);
          navigate(`/new?edit=${e.id}`);
        }}
        onDelete={async (e) => {
          if (!confirm('Delete this entry?')) return;
          await deleteEntry(e.id);
          toast.show('Entry deleted');
          setOpenEntry(null);
        }}
      />
    </div>
  );
}

type DetailProps = {
  entry: JournalEntry | null;
  onClose: () => void;
  onEdit: (e: JournalEntry) => void;
  onDelete: (e: JournalEntry) => void;
};

function EntryDetail({ entry, onClose, onEdit, onDelete }: DetailProps) {
  const types = useTrackingTypes();
  const axes = useAxes();
  if (!entry) return null;
  const t = types?.find((tt) => tt.id === entry.trackingTypeId);
  const ax = axes?.find((a) => a.id === t?.axisXId);
  const ay = axes?.find((a) => a.id === t?.axisYId);

  return (
    <Modal
      open={!!entry}
      onClose={onClose}
      title={entry.title || t?.name || 'Entry'}
      footer={
        <>
          <button className="btn-danger" type="button" onClick={() => onDelete(entry)}>
            <Trash2 size={14} /> Delete
          </button>
          <button className="btn-primary" type="button" onClick={() => onEdit(entry)}>
            <Pencil size={14} /> Edit
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-sm text-ink-500 dark:text-ink-400">
          {t && (
            <span className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: t.color }} />
              {t.name}
            </span>
          )}
          <span>·</span>
          <span>{formatDay(entry.date)}</span>
        </div>
        <div className="grid grid-cols-2 gap-3 rounded-xl bg-ink-50 p-3 tabular-nums dark:bg-ink-800/40">
          {ax && (
            <div>
              <div className="text-xs text-ink-500 dark:text-ink-400">{ax.name}</div>
              <div className="text-xl font-semibold">{formatScore(entry.x, ax)}</div>
            </div>
          )}
          {ay && entry.y !== null && (
            <div>
              <div className="text-xs text-ink-500 dark:text-ink-400">{ay.name}</div>
              <div className="text-xl font-semibold">{formatScore(entry.y, ay)}</div>
            </div>
          )}
        </div>
        {entry.notes && (
          <div>
            <div className="label">Notes</div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink-700 dark:text-ink-200">{entry.notes}</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
