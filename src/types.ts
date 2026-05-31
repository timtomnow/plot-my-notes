export type AxisBand = {
  id: string;
  max: number;
  label?: string;
  color?: string;
};

/**
 * A rectangular shaded region on a 2D tracking type's chart, expressed in
 * axis-value coordinates. Used for "quadrant"-style overlays (e.g. the
 * Confidence Map or the Olson Circumplex). Independent of axis bands.
 */
export type ChartRegion = {
  id: string;
  x1: number;
  x2: number;
  y1: number;
  y2: number;
  color: string;
  label?: string;
  /** Fill opacity 0..1. Defaults to 0.35 when omitted. */
  opacity?: number;
};

export type Axis = {
  id: string;
  name: string;
  min: number;
  max: number;
  step: number;
  bands?: AxisBand[];
  /** One-line summary, shown inline in most places. */
  shortDescription?: string;
  /** Fuller explanation, surfaced behind an info button. */
  description?: string;
  createdAt: number;
};

export type TrackingType = {
  id: string;
  name: string;
  color: string;
  axisXId: string;
  axisYId: string | null;
  /** Colored quadrant/region overlays for 2D types. */
  regions?: ChartRegion[];
  /** One-line summary, shown inline in most places. */
  shortDescription?: string;
  /** Fuller explanation, surfaced behind an info button. */
  description?: string;
  createdAt: number;
};

export type JournalEntry = {
  id: string;
  trackingTypeId: string;
  date: number;
  x: number;
  y: number | null;
  title?: string;
  notes?: string;
  tags?: string[];
  imageStub?: string;
  createdAt: number;
  updatedAt: number;
};

export type Dim = '1d' | '2d';
