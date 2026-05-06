import Dexie, { type Table } from 'dexie';
import type { Axis, JournalEntry, TrackingType } from '@/types';

/** Bumped whenever the on-disk shape changes. Written into JSON exports. */
export const SCHEMA_VERSION = 2;

export class PlotMyNotesDB extends Dexie {
  axes!: Table<Axis, string>;
  trackingTypes!: Table<TrackingType, string>;
  entries!: Table<JournalEntry, string>;

  constructor() {
    super('plot-my-notes');
    this.version(1).stores({
      axes: 'id, name, createdAt',
      trackingTypes: 'id, name, axisXId, axisYId, createdAt',
      entries: 'id, trackingTypeId, date, createdAt',
    });
    // v2: optional `bands` on axes, optional `tags` on entries (multi-entry index).
    // No data migration needed — both fields default to undefined.
    this.version(2).stores({
      axes: 'id, name, createdAt',
      trackingTypes: 'id, name, axisXId, axisYId, createdAt',
      entries: 'id, trackingTypeId, date, createdAt, *tags',
    });
  }
}

export const db = new PlotMyNotesDB();
