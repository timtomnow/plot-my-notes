export type Axis = {
  id: string;
  name: string;
  min: number;
  max: number;
  step: number;
  createdAt: number;
};

export type TrackingType = {
  id: string;
  name: string;
  color: string;
  axisXId: string;
  axisYId: string | null;
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
  imageStub?: string;
  createdAt: number;
  updatedAt: number;
};

export type Dim = '1d' | '2d';
