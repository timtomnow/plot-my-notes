import { useEffect, useMemo, useState } from 'react';
import { Plus, Trash2, Pencil, Search, X } from 'lucide-react';
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
import { rankTags, tagKey } from '@/lib/tags';

export function Entries() {
  const types = useTrackingTypes();
  const axes = useAxes();
  const [filter, setFilter] = useState<string | null>(null);
  const entries = useEntries(filter ? { trackingTypeId: filter } : undefined);
  const navigate = useNavigate();
  const toast = useToast();
  const [openEntry, setOpenEntry] = useState<JournalEntry | null>(null);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTags, setActiveTags] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const id = setTimeout(() => setDebouncedSearch(search), 150);
    return () => clearTimeout(id);
  }, [search]);

  const tagSuggestions = useMemo(() => rankTags(entries), [entries]);

  const filteredEntries = useMemo(() => {
    const q = debouncedSearch.trim().toLowerCase();
    return (entries ?? []).filter((e) => {
      if (q) {
        const hay = `${e.title ?? ''}\n${e.notes ?? ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      if (activeTags.size > 0) {
        const tagsLower = (e.tags ?? []).map(tagKey);
        for (const t of activeTags) {
          if (!tagsLower.includes(t)) return false;
        }
      }
      return true;
    });
  }, [entries, debouncedSearch, activeTags]);

  const grouped = useMemo(() => {
    const map = new Map<number, JournalEntry[]>();
    filteredEntries.forEach((e) => {
      const day = startOfDay(e.date);
      const arr = map.get(day) ?? [];
      arr.push(e);
      map.set(day, arr);
    });
    return Array.from(map.entries()).sort((a, b) => b[0] - a[0]);
  }, [filteredEntries]);

  const toggleTag = (key: string) => {
    setActiveTags((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };
  const filtersActive = !!debouncedSearch.trim() || activeTags.size > 0;

  const trackingTypeFor = (id: string) => types?.find((t) => t.id === id);
  const axisFor = (id: string | null | undefined) => axes?.find((a) => a.id === id);

  return (
    <div>
      <PageHeader
        title="Entries"
        subtitle={
          entries
            ? filtersActive
              ? `${filteredEntries.length} of ${entries.length}`
              : `${entries.length} total`
            : undefined
        }
        action={
          <button className="btn-primary" type="button" onClick={() => navigate('/new')}>
            <Plus size={16} /> New
          </button>
        }
      />

      {/* Search input — sticky so it stays in view above the on-screen keyboard. */}
      {entries && entries.length > 0 && (
        <div className="sticky top-0 z-20 -mx-4 mb-3 bg-ink-50/80 px-4 py-2 backdrop-blur dark:bg-ink-950/70">
          <label className="relative block">
            <span className="sr-only">Search entries</span>
            <Search
              size={16}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400 dark:text-ink-500"
              aria-hidden
            />
            <input
              type="search"
              className="input pl-9 pr-9"
              placeholder="Search title and notes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoCapitalize="none"
              autoCorrect="off"
            />
            {search && (
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1 text-ink-400 hover:bg-ink-100 dark:hover:bg-ink-800"
                aria-label="Clear search"
                onClick={() => setSearch('')}
              >
                <X size={14} />
              </button>
            )}
          </label>
        </div>
      )}

      {/* Tag filter chips */}
      {tagSuggestions.length > 0 && (
        <div className="mb-3 -mx-4 overflow-x-auto px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <div className="flex w-max items-center gap-2">
            <span className="text-[10px] uppercase tracking-wide text-ink-400 dark:text-ink-500">
              Tags
            </span>
            {tagSuggestions.slice(0, 16).map((s) => {
              const k = tagKey(s.tag);
              const active = activeTags.has(k);
              return (
                <button
                  key={k}
                  type="button"
                  className={['chip', active ? 'chip-active' : ''].join(' ')}
                  onClick={() => toggleTag(k)}
                >
                  {s.tag}
                  <span className="ml-1 text-[10px] opacity-60">{s.count}</span>
                </button>
              );
            })}
            {activeTags.size > 0 && (
              <button
                type="button"
                className="chip"
                onClick={() => setActiveTags(new Set())}
              >
                Clear tags
              </button>
            )}
          </div>
        </div>
      )}

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

      {entries && entries.length > 0 && filteredEntries.length === 0 && (
        <EmptyState
          title="Nothing matches"
          description="Try a different search term or clear the tag filters."
          action={
            <button
              type="button"
              className="btn-ghost"
              onClick={() => {
                setSearch('');
                setActiveTags(new Set());
              }}
            >
              Clear filters
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
                      highlight={debouncedSearch.trim() || undefined}
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
        {entry.tags && entry.tags.length > 0 && (
          <div>
            <div className="label">Tags</div>
            <div className="mt-1 flex flex-wrap gap-1.5">
              {entry.tags.map((t) => (
                <span
                  key={t}
                  className="rounded-full bg-ink-100 px-2 py-0.5 text-xs font-medium text-ink-700 dark:bg-ink-800 dark:text-ink-200"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
