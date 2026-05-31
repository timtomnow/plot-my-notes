import { db } from './schema';
import { newId } from '@/lib/id';
import { newBandId } from '@/lib/bands';
import { newRegionId } from '@/lib/regions';
import { PALETTE } from '@/lib/color';
import type { Axis, TrackingType } from '@/types';

let seedPromise: Promise<void> | null = null;

export function ensureSeed(): Promise<void> {
  if (!seedPromise) seedPromise = run();
  return seedPromise;
}

async function run(): Promise<void> {
  const axisCount = await db.axes.count();
  if (axisCount > 0) return;

  const now = Date.now();
  let order = 0;
  const at = () => now + order++;

  // ---------- Axes ----------

  const happiness: Axis = {
    id: newId(),
    name: 'Happiness',
    min: -1,
    max: 1,
    step: 0.5,
    shortDescription: 'How pleasant you feel, from very low (−1) to very high (+1).',
    description:
      'A simple pleasantness scale centred on zero. −1 is feeling really down, 0 is neutral, and +1 is genuinely good. Keeping it short makes it easy to answer honestly in a few seconds.',
    createdAt: at(),
  };

  const energy: Axis = {
    id: newId(),
    name: 'Energy',
    min: 1,
    max: 10,
    step: 1,
    shortDescription: 'Physical and mental energy, from drained (1) to wired (10).',
    createdAt: at(),
  };

  const focus: Axis = {
    id: newId(),
    name: 'Focus',
    min: 0,
    max: 100,
    step: 5,
    shortDescription: 'How focused and clear-headed you felt, as a percentage.',
    createdAt: at(),
  };

  const sleep: Axis = {
    id: newId(),
    name: 'Sleep',
    min: 1,
    max: 100,
    step: 1,
    shortDescription: 'Overall sleep quality on a 1–100 scale.',
    description:
      'A single score for how restorative your sleep was — factoring in how long, how deep, and how rested you feel. The colored bands give a quick read: 1–25 poor, 26–50 fair, 51–75 good, 76–100 great.',
    bands: [
      { id: newBandId(), max: 25, label: 'Poor', color: '#fee2e2' },
      { id: newBandId(), max: 50, label: 'Fair', color: '#ffedd5' },
      { id: newBandId(), max: 75, label: 'Good', color: '#fef9c3' },
      { id: newBandId(), max: 100, label: 'Great', color: '#dcfce7' },
    ],
    createdAt: at(),
  };

  // Confidence Map axes (Peter Atwater)
  const certainty: Axis = {
    id: newId(),
    name: 'Certainty',
    min: 0,
    max: 100,
    step: 1,
    shortDescription: 'How predictable and clear things feel right now (low → high).',
    createdAt: at(),
  };

  const control: Axis = {
    id: newId(),
    name: 'Control',
    min: 0,
    max: 100,
    step: 1,
    shortDescription: 'How much agency you feel over the situation (low → high).',
    createdAt: at(),
  };

  // Olson Circumplex axes
  const cohesion: Axis = {
    id: newId(),
    name: 'Cohesion',
    min: 0,
    max: 100,
    step: 1,
    shortDescription: 'Emotional closeness in a relationship (disengaged → enmeshed).',
    description:
      'Olson’s cohesion dimension: how connected people are. The balanced middle (Somewhat Connected → Very Connected) tends to be healthiest; the extremes — Disengaged (too distant) and Enmeshed (no separateness) — are where strain shows up.',
    bands: [
      { id: newBandId(), max: 15, label: 'Disengaged' },
      { id: newBandId(), max: 35, label: 'Somewhat Connected' },
      { id: newBandId(), max: 65, label: 'Connected' },
      { id: newBandId(), max: 85, label: 'Very Connected' },
      { id: newBandId(), max: 100, label: 'Enmeshed' },
    ],
    createdAt: at(),
  };

  const flexibility: Axis = {
    id: newId(),
    name: 'Flexibility',
    min: 0,
    max: 100,
    step: 1,
    shortDescription: 'Adaptability of a relationship (rigid → chaotic).',
    description:
      'Olson’s flexibility dimension: how much roles, rules and leadership can change. The balanced middle (Somewhat Flexible → Very Flexible) adapts without losing stability; the extremes — Rigid (won’t change) and Chaotic (no structure) — are harder to sustain.',
    bands: [
      { id: newBandId(), max: 15, label: 'Rigid' },
      { id: newBandId(), max: 35, label: 'Somewhat Flexible' },
      { id: newBandId(), max: 65, label: 'Flexible' },
      { id: newBandId(), max: 85, label: 'Very Flexible' },
      { id: newBandId(), max: 100, label: 'Chaotic' },
    ],
    createdAt: at(),
  };

  await db.axes.bulkAdd([
    happiness,
    energy,
    focus,
    sleep,
    certainty,
    control,
    cohesion,
    flexibility,
  ]);

  // ---------- Tracking types ----------

  const types: TrackingType[] = [
    {
      id: newId(),
      name: 'Mood',
      color: PALETTE[5], // blue
      axisXId: happiness.id,
      axisYId: energy.id,
      shortDescription: 'Happiness paired with Energy — a fuller picture than mood alone.',
      description:
        'Plotting happiness against energy separates "low and flat" from "low and agitated", and "calm and content" from "buzzing and great". The pairing often says more than either number on its own.',
      createdAt: at(),
    },
    {
      id: newId(),
      name: 'Work',
      color: PALETTE[7], // purple
      axisXId: focus.id,
      axisYId: null,
      shortDescription: 'How focused your work time felt today.',
      createdAt: at(),
    },
    {
      id: newId(),
      name: 'Happiness',
      color: PALETTE[3], // green
      axisXId: happiness.id,
      axisYId: null,
      shortDescription: 'A quick daily check-in on how happy you feel.',
      description:
        'The simplest possible entry: one slider for how you feel, from −1 to +1. Great for building a daily habit and watching the trend over weeks.',
      createdAt: at(),
    },
    {
      id: newId(),
      name: 'Sleep',
      color: PALETTE[6], // indigo
      axisXId: sleep.id,
      axisYId: null,
      shortDescription: 'Rate last night’s sleep from 1 to 100.',
      description:
        'Log how well you slept each morning. The colored bands (poor / fair / good / great) make it easy to spot rough patches and see whether changes to your routine actually help.',
      createdAt: at(),
    },
    {
      id: newId(),
      name: 'Confidence Map',
      color: PALETTE[4], // teal
      axisXId: certainty.id,
      axisYId: control.id,
      shortDescription: 'Certainty × Control — comfort, launch pad, passenger seat, or stress.',
      description:
        'Peter Atwater’s Confidence Map (2023) plots how certain things feel (X) against how much control you have (Y), revealing whether you’re in your comfort zone, launch pad, passenger seat, or stress centre — and why.\n\n• Comfort Zone (high certainty, high control): confident and at ease.\n• Launch Pad (low certainty, high control): in control but heading into the unknown — where growth happens.\n• Passenger Seat (high certainty, low control): you know what’s coming but can’t steer it.\n• Stress Centre (low certainty, low control): uncertain and powerless — the hardest place to be.\n\nSource: Peter Atwater, "The Confidence Map" (peteratwater.com/the-confidence-map-2).',
      regions: [
        {
          id: newRegionId(),
          x1: 50,
          x2: 100,
          y1: 50,
          y2: 100,
          color: '#dcfce7', // green
          label: 'Comfort Zone',
        },
        {
          id: newRegionId(),
          x1: 0,
          x2: 50,
          y1: 50,
          y2: 100,
          color: '#dbeafe', // blue
          label: 'Launch Pad',
        },
        {
          id: newRegionId(),
          x1: 50,
          x2: 100,
          y1: 0,
          y2: 50,
          color: '#fef9c3', // yellow
          label: 'Passenger Seat',
        },
        {
          id: newRegionId(),
          x1: 0,
          x2: 50,
          y1: 0,
          y2: 50,
          color: '#fee2e2', // red
          label: 'Stress Centre',
        },
      ],
      createdAt: at(),
    },
    {
      id: newId(),
      name: 'Olson Circumplex Model',
      color: PALETTE[8], // pink
      axisXId: cohesion.id,
      axisYId: flexibility.id,
      shortDescription: 'Cohesion × Flexibility — how balanced a relationship feels.',
      description:
        'David Olson’s Circumplex Model (1979) maps relationships on two dimensions: Cohesion (closeness, X) and Flexibility (adaptability, Y). Both work best in the balanced middle. The extremes mark strain — too distant or enmeshed, too rigid or chaotic.\n\nThe shading shows balance: the lightly tinted centre is the balanced, healthy zone; grey edges mean one dimension has gone to an extreme; dark corners mean both have — the most stressed combinations (e.g. Rigid + Disengaged, or Chaotic + Enmeshed). Useful for any important bond, not just family.\n\nSource: David Olson, Circumplex Model of Marital & Family Systems (1979).',
      regions: [
        // Balanced centre (healthy zone)
        {
          id: newRegionId(),
          x1: 15,
          x2: 85,
          y1: 15,
          y2: 85,
          color: '#dcfce7', // soft green
          opacity: 0.25,
          label: 'Balanced',
        },
        // Mid-range edges (one dimension unbalanced)
        { id: newRegionId(), x1: 15, x2: 85, y1: 0, y2: 15, color: '#cbd5e1', opacity: 0.5 },
        { id: newRegionId(), x1: 15, x2: 85, y1: 85, y2: 100, color: '#cbd5e1', opacity: 0.5 },
        { id: newRegionId(), x1: 0, x2: 15, y1: 15, y2: 85, color: '#cbd5e1', opacity: 0.5 },
        { id: newRegionId(), x1: 85, x2: 100, y1: 15, y2: 85, color: '#cbd5e1', opacity: 0.5 },
        // Unbalanced corners (both dimensions extreme)
        { id: newRegionId(), x1: 0, x2: 15, y1: 0, y2: 15, color: '#64748b', opacity: 0.55 },
        { id: newRegionId(), x1: 85, x2: 100, y1: 0, y2: 15, color: '#64748b', opacity: 0.55 },
        { id: newRegionId(), x1: 0, x2: 15, y1: 85, y2: 100, color: '#64748b', opacity: 0.55 },
        { id: newRegionId(), x1: 85, x2: 100, y1: 85, y2: 100, color: '#64748b', opacity: 0.55 },
      ],
      createdAt: at(),
    },
  ];

  await db.trackingTypes.bulkAdd(types);
}
