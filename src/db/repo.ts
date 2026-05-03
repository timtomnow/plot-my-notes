import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './schema';
import { newId } from '@/lib/id';
import type { Axis, JournalEntry, TrackingType } from '@/types';

// ---------- Axes ----------

export async function createAxis(
  input: Omit<Axis, 'id' | 'createdAt'>,
): Promise<Axis> {
  const axis: Axis = { ...input, id: newId(), createdAt: Date.now() };
  await db.axes.add(axis);
  return axis;
}

export async function updateAxis(id: string, patch: Partial<Axis>): Promise<void> {
  await db.axes.update(id, patch);
}

export async function deleteAxis(id: string): Promise<void> {
  const usedBy = await db.trackingTypes
    .filter((t) => t.axisXId === id || t.axisYId === id)
    .count();
  if (usedBy > 0) {
    throw new Error(
      `Cannot delete: this axis is used by ${usedBy} tracking type${usedBy === 1 ? '' : 's'}.`,
    );
  }
  await db.axes.delete(id);
}

export function useAxes(): Axis[] | undefined {
  return useLiveQuery(() => db.axes.orderBy('createdAt').toArray(), []);
}

export function useAxis(id: string | null | undefined): Axis | undefined {
  return useLiveQuery(
    async () => (id ? await db.axes.get(id) : undefined),
    [id],
  );
}

// ---------- Tracking Types ----------

export async function createTrackingType(
  input: Omit<TrackingType, 'id' | 'createdAt'>,
): Promise<TrackingType> {
  const t: TrackingType = { ...input, id: newId(), createdAt: Date.now() };
  await db.trackingTypes.add(t);
  return t;
}

export async function updateTrackingType(
  id: string,
  patch: Partial<TrackingType>,
): Promise<void> {
  await db.trackingTypes.update(id, patch);
}

export async function deleteTrackingType(id: string): Promise<void> {
  const used = await db.entries.where('trackingTypeId').equals(id).count();
  if (used > 0) {
    throw new Error(
      `Cannot delete: this tracking type has ${used} entr${used === 1 ? 'y' : 'ies'}.`,
    );
  }
  await db.trackingTypes.delete(id);
}

export function useTrackingTypes(): TrackingType[] | undefined {
  return useLiveQuery(
    () => db.trackingTypes.orderBy('createdAt').toArray(),
    [],
  );
}

export function useTrackingType(
  id: string | null | undefined,
): TrackingType | undefined {
  return useLiveQuery(
    async () => (id ? await db.trackingTypes.get(id) : undefined),
    [id],
  );
}

// ---------- Entries ----------

export async function createEntry(
  input: Omit<JournalEntry, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<JournalEntry> {
  const now = Date.now();
  const entry: JournalEntry = {
    ...input,
    id: newId(),
    createdAt: now,
    updatedAt: now,
  };
  await db.entries.add(entry);
  return entry;
}

export async function updateEntry(
  id: string,
  patch: Partial<JournalEntry>,
): Promise<void> {
  await db.entries.update(id, { ...patch, updatedAt: Date.now() });
}

export async function deleteEntry(id: string): Promise<void> {
  await db.entries.delete(id);
}

export function useEntries(opts?: {
  trackingTypeId?: string;
  limit?: number;
}): JournalEntry[] | undefined {
  const trackingTypeId = opts?.trackingTypeId;
  const limit = opts?.limit;
  return useLiveQuery(async () => {
    const arr = trackingTypeId
      ? await db.entries.where('trackingTypeId').equals(trackingTypeId).toArray()
      : await db.entries.toArray();
    arr.sort((a, b) => b.date - a.date);
    return limit ? arr.slice(0, limit) : arr;
  }, [trackingTypeId, limit]);
}

export function useEntry(id: string | null | undefined): JournalEntry | undefined {
  return useLiveQuery(
    async () => (id ? await db.entries.get(id) : undefined),
    [id],
  );
}
