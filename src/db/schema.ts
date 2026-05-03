import Dexie, { type Table } from 'dexie';
import type { Axis, JournalEntry, TrackingType } from '@/types';

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
  }
}

export const db = new PlotMyNotesDB();
