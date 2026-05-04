import { db, SCHEMA_VERSION } from './schema';
import type { Axis, JournalEntry, TrackingType } from '@/types';

export type ExportPayload = {
  version: number;
  exportedAt: number;
  axes: Axis[];
  trackingTypes: TrackingType[];
  entries: JournalEntry[];
};

export type ImportMode = 'merge' | 'replace';

export type ImportSummary = {
  axesAdded: number;
  axesSkipped: number;
  trackingTypesAdded: number;
  trackingTypesSkipped: number;
  entriesAdded: number;
  entriesSkipped: number;
};

export async function exportData(): Promise<ExportPayload> {
  const [axes, trackingTypes, entries] = await Promise.all([
    db.axes.toArray(),
    db.trackingTypes.toArray(),
    db.entries.toArray(),
  ]);
  return {
    version: SCHEMA_VERSION,
    exportedAt: Date.now(),
    axes,
    trackingTypes,
    entries,
  };
}

export function exportFilename(now: Date = new Date()): string {
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `plot-my-notes-export-${yyyy}-${mm}-${dd}.json`;
}

export function downloadJson(filename: string, value: unknown): void {
  const blob = new Blob([JSON.stringify(value, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

/**
 * Validate an unknown value as a well-shaped ExportPayload. Throws with a
 * human-readable message on any failure — never partially succeeds.
 */
export function parseExportPayload(value: unknown): ExportPayload {
  if (!value || typeof value !== 'object') {
    throw new Error('File is empty or not a JSON object.');
  }
  const v = value as Record<string, unknown>;
  if (typeof v.version !== 'number') {
    throw new Error('Missing "version" field.');
  }
  if (v.version > SCHEMA_VERSION) {
    throw new Error(
      `File was exported by a newer version (${v.version}). This app supports up to v${SCHEMA_VERSION}.`,
    );
  }
  if (!Array.isArray(v.axes) || !Array.isArray(v.trackingTypes) || !Array.isArray(v.entries)) {
    throw new Error('Missing one of "axes", "trackingTypes", or "entries".');
  }

  const axes = v.axes.map((a, i) => requireAxis(a, i));
  const trackingTypes = v.trackingTypes.map((t, i) => requireTrackingType(t, i));
  const entries = v.entries.map((e, i) => requireEntry(e, i));

  return {
    version: v.version,
    exportedAt: typeof v.exportedAt === 'number' ? v.exportedAt : Date.now(),
    axes,
    trackingTypes,
    entries,
  };
}

function requireAxis(a: unknown, idx: number): Axis {
  const o = asObj(a, `axes[${idx}]`);
  return {
    id: requireString(o.id, `axes[${idx}].id`),
    name: requireString(o.name, `axes[${idx}].name`),
    min: requireNumber(o.min, `axes[${idx}].min`),
    max: requireNumber(o.max, `axes[${idx}].max`),
    step: requireNumber(o.step, `axes[${idx}].step`),
    createdAt: requireNumber(o.createdAt, `axes[${idx}].createdAt`),
  };
}

function requireTrackingType(t: unknown, idx: number): TrackingType {
  const o = asObj(t, `trackingTypes[${idx}]`);
  const axisYRaw = o.axisYId;
  const axisYId =
    axisYRaw === null || axisYRaw === undefined ? null : requireString(axisYRaw, `trackingTypes[${idx}].axisYId`);
  return {
    id: requireString(o.id, `trackingTypes[${idx}].id`),
    name: requireString(o.name, `trackingTypes[${idx}].name`),
    color: requireString(o.color, `trackingTypes[${idx}].color`),
    axisXId: requireString(o.axisXId, `trackingTypes[${idx}].axisXId`),
    axisYId,
    createdAt: requireNumber(o.createdAt, `trackingTypes[${idx}].createdAt`),
  };
}

function requireEntry(e: unknown, idx: number): JournalEntry {
  const o = asObj(e, `entries[${idx}]`);
  const yRaw = o.y;
  const y = yRaw === null || yRaw === undefined ? null : requireNumber(yRaw, `entries[${idx}].y`);
  return {
    id: requireString(o.id, `entries[${idx}].id`),
    trackingTypeId: requireString(o.trackingTypeId, `entries[${idx}].trackingTypeId`),
    date: requireNumber(o.date, `entries[${idx}].date`),
    x: requireNumber(o.x, `entries[${idx}].x`),
    y,
    title: typeof o.title === 'string' ? o.title : undefined,
    notes: typeof o.notes === 'string' ? o.notes : undefined,
    imageStub: typeof o.imageStub === 'string' ? o.imageStub : undefined,
    createdAt: requireNumber(o.createdAt, `entries[${idx}].createdAt`),
    updatedAt: requireNumber(o.updatedAt, `entries[${idx}].updatedAt`),
  };
}

function asObj(v: unknown, where: string): Record<string, unknown> {
  if (!v || typeof v !== 'object') throw new Error(`${where} is not an object.`);
  return v as Record<string, unknown>;
}
function requireString(v: unknown, where: string): string {
  if (typeof v !== 'string' || v.length === 0) throw new Error(`${where} must be a non-empty string.`);
  return v;
}
function requireNumber(v: unknown, where: string): number {
  if (typeof v !== 'number' || !Number.isFinite(v)) throw new Error(`${where} must be a finite number.`);
  return v;
}

/**
 * Apply a parsed payload to the DB. The whole operation runs in a single
 * Dexie transaction so a mid-flight failure leaves the DB untouched.
 */
export async function importData(payload: ExportPayload, mode: ImportMode): Promise<ImportSummary> {
  const summary: ImportSummary = {
    axesAdded: 0,
    axesSkipped: 0,
    trackingTypesAdded: 0,
    trackingTypesSkipped: 0,
    entriesAdded: 0,
    entriesSkipped: 0,
  };

  await db.transaction('rw', db.axes, db.trackingTypes, db.entries, async () => {
    if (mode === 'replace') {
      await Promise.all([db.axes.clear(), db.trackingTypes.clear(), db.entries.clear()]);
      await db.axes.bulkAdd(payload.axes);
      await db.trackingTypes.bulkAdd(payload.trackingTypes);
      await db.entries.bulkAdd(payload.entries);
      summary.axesAdded = payload.axes.length;
      summary.trackingTypesAdded = payload.trackingTypes.length;
      summary.entriesAdded = payload.entries.length;
      return;
    }

    // Merge mode: skip rows whose id already exists.
    const [existingAxisIds, existingTypeIds, existingEntryIds] = await Promise.all([
      db.axes.toCollection().primaryKeys() as Promise<string[]>,
      db.trackingTypes.toCollection().primaryKeys() as Promise<string[]>,
      db.entries.toCollection().primaryKeys() as Promise<string[]>,
    ]);
    const axisSet = new Set(existingAxisIds);
    const typeSet = new Set(existingTypeIds);
    const entrySet = new Set(existingEntryIds);

    const newAxes = payload.axes.filter((a) => !axisSet.has(a.id));
    const newTypes = payload.trackingTypes.filter((t) => !typeSet.has(t.id));
    const newEntries = payload.entries.filter((e) => !entrySet.has(e.id));

    if (newAxes.length) await db.axes.bulkAdd(newAxes);
    if (newTypes.length) await db.trackingTypes.bulkAdd(newTypes);
    if (newEntries.length) await db.entries.bulkAdd(newEntries);

    summary.axesAdded = newAxes.length;
    summary.axesSkipped = payload.axes.length - newAxes.length;
    summary.trackingTypesAdded = newTypes.length;
    summary.trackingTypesSkipped = payload.trackingTypes.length - newTypes.length;
    summary.entriesAdded = newEntries.length;
    summary.entriesSkipped = payload.entries.length - newEntries.length;
  });

  return summary;
}
