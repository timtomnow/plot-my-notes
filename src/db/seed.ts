import { db } from './schema';
import { newId } from '@/lib/id';
import { PALETTE } from '@/lib/color';

let seedPromise: Promise<void> | null = null;

export function ensureSeed(): Promise<void> {
  if (!seedPromise) seedPromise = run();
  return seedPromise;
}

async function run(): Promise<void> {
  const axisCount = await db.axes.count();
  if (axisCount > 0) return;

  const now = Date.now();

  const happiness = { id: newId(), name: 'Happiness', min: -1, max: 1, step: 0.5, createdAt: now };
  const energy    = { id: newId(), name: 'Energy',    min: 1,  max: 10, step: 1,  createdAt: now + 1 };
  const focus     = { id: newId(), name: 'Focus',     min: 0,  max: 100, step: 5, createdAt: now + 2 };

  await db.axes.bulkAdd([happiness, energy, focus]);

  await db.trackingTypes.bulkAdd([
    {
      id: newId(),
      name: 'Mood',
      color: PALETTE[5], // blue
      axisXId: happiness.id,
      axisYId: energy.id,
      createdAt: now + 3,
    },
    {
      id: newId(),
      name: 'Work',
      color: PALETTE[7], // purple
      axisXId: focus.id,
      axisYId: null,
      createdAt: now + 4,
    },
  ]);
}
