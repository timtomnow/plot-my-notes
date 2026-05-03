# Plot My Notes — Build Plan

A journaling + emotional-tracking PWA. Users define **axes** (a measurable
dimension of feeling), bundle them into **tracking types** (1D or 2D), and log
**journal entries** that can be visualized as line / scatter charts over time.

This file is both the product roadmap **and** a list of self-contained prompts a
future Claude session (or any engineer) can paste in to continue the work. Each
phase is sized so it can be implemented and verified independently.

---

## Stack & Key Decisions

| Concern        | Choice                              | Why                                                                 |
| -------------- | ----------------------------------- | ------------------------------------------------------------------- |
| Bundler / dev  | **Vite**                            | Fastest DX, first-class PWA plugin, TS out of the box.              |
| Framework      | **React 18 + TypeScript**           | Ubiquitous, excellent typing for our data model.                    |
| Styling        | **Tailwind CSS**                    | Mobile-first responsive, no custom CSS pipeline, calm minimal look. |
| Routing        | **react-router-dom v6**             | Standard, supports nested layouts.                                  |
| Persistence    | **Dexie (IndexedDB)**               | Local-first, works offline, no backend needed for MVP.              |
| Charts         | **Recharts**                        | Declarative React API, handles line + scatter cleanly.              |
| PWA            | **vite-plugin-pwa** (Workbox)       | Generates manifest + service worker; installable on iOS/Android.    |
| Icons          | **lucide-react**                    | Lightweight, consistent line icons.                                 |
| State          | React Context + Dexie hooks         | No Redux — Dexie's `useLiveQuery` is reactive.                      |

### 2D Input Decision (the hardest UX)
Three patterns were considered:

1. **Drag-a-dot pad** — Touch a 2D plane, drag to set both values at once.
   *Pros:* fastest, intuitive, feels like emotion-mapping.
   *Cons:* precision on small screens; needs grid/snapping.
2. **Dual sliders** — Two stacked sliders, one per axis.
   *Pros:* precise, accessible, simple.
   *Cons:* slow, doesn't convey the "2D feel" the product promises.
3. **Preset zones + nudge** — Tap a quadrant ("excited", "calm"), then fine-tune.
   *Pros:* great for new users; great recall.
   *Cons:* zone labels leak opinion into user data; mismatch for custom axes.

**Chosen default:** **#1 Drag-a-dot pad** with snap-to-grid and live numeric
readouts. Mobile-first, hits the "under 10s entry" goal. We expose a small
"Use sliders instead" toggle for accessibility.

---

## Data Model

```ts
type Axis = {
  id: string;
  name: string;     // "Happiness"
  min: number;      // -1
  max: number;      // 1
  step: number;     // 0.5
  createdAt: number;
};

type TrackingType = {
  id: string;
  name: string;     // "Work"
  color: string;    // hex, for chart series
  axisXId: string;          // required
  axisYId: string | null;   // null => 1D
  createdAt: number;
};

type JournalEntry = {
  id: string;
  trackingTypeId: string;
  date: number;           // unix ms; the day the entry is *for*
  x: number;              // value on axisX
  y: number | null;       // value on axisY (null when 1D)
  title?: string;
  notes?: string;
  imageStub?: string;     // placeholder; image upload not in MVP
  createdAt: number;
  updatedAt: number;
};
```

---

## Folder Layout

```
src/
  app/                # router, providers, layout
  components/         # presentational + small composites
    inputs/           # AxisInput, Pad2D, Slider1D
    charts/           # LineChart1D, ScatterChart2D
    layout/           # AppShell, BottomNav, Sidebar
  pages/              # route components
    Dashboard.tsx
    NewEntry.tsx
    Entries.tsx
    Charts.tsx
    Axes.tsx
    TrackingTypes.tsx
  db/
    schema.ts         # Dexie database
    repo.ts           # typed CRUD helpers
    seed.ts           # sample axes + types
  lib/                # utils (id, color, date, score formatting)
  types.ts            # shared TS types
  index.css           # tailwind entry
  main.tsx
public/
  icon-192.png
  icon-512.png
  apple-touch-icon.png
```

---

## Phases (each phase = one Claude prompt)

> ✅ = done in this initial pass
> ⏳ = remaining

### Phase 1 — Project scaffold ✅
**Prompt:** *"Initialize a Vite + React + TypeScript project named `plot-my-notes`.
Add Tailwind CSS, vite-plugin-pwa with autoUpdate + a manifest covering both
mobile and desktop, react-router-dom, dexie, dexie-react-hooks, recharts, and
lucide-react. Configure tsconfig strict mode, write a sensible .gitignore and a
CLAUDE.md describing how the project is laid out. Include `npm run dev`, `build`,
`preview`, `lint`, `typecheck` scripts."*

### Phase 2 — Data layer ✅
**Prompt:** *"Define the `Axis`, `TrackingType`, and `JournalEntry` types in
`src/types.ts`. Create `src/db/schema.ts` with a Dexie database (version 1) that
indexes the fields we'll query (`trackingTypeId`, `date`). Add `src/db/repo.ts`
exposing typed CRUD helpers and a `useLive*` hook layer over `useLiveQuery`.
Add `src/db/seed.ts` that inserts 3 sample axes + 2 tracking types if the DB is
empty, called once on app boot."*

### Phase 3 — App shell & responsive layout ✅
**Prompt:** *"Build `AppShell` with a top brand bar + responsive nav: a fixed
bottom tab bar on mobile (Home, New, Charts, Settings) and a left sidebar on md+.
Wire react-router-dom routes to placeholder pages. Use a calm palette
(neutral-50 / neutral-900) and ensure the layout is safe-area aware on iOS."*

### Phase 4 — Axes management ✅
**Prompt:** *"Build the Axes management page with a list of existing axes + a
modal form to create/edit/delete one. Validate that `min < max` and `step > 0`
and divides the range. Use the repo helpers — never call Dexie directly from
components. Show how each axis is used (count of tracking types) and prevent
deletion if in use."*

### Phase 5 — Tracking types management ✅
**Prompt:** *"Build the Tracking Types page. A type has a name, color picker
(small swatch grid), an X axis selector, and an optional Y axis selector
(toggle '2D'). Empty state nudges the user to create an axis first. Prevent
deletion if entries exist; allow rename freely."*

### Phase 6 — New Entry flow (1D + 2D pad) ✅
**Prompt:** *"Build the New Entry flow optimized for <10s logging. Step 1:
choose tracking type (chips, last-used first). Step 2: render `Slider1D` for 1D
or `Pad2D` for 2D. The Pad2D is the centerpiece — a square SVG/Canvas surface
with axis labels at the edges, snap-to-step grid, draggable thumb, and a live
numeric readout. Optional: title, notes, date (defaults to today). One big Save
button. After save, route to Dashboard with a confirmation toast."*

### Phase 7 — Entries list + edit/delete ✅
**Prompt:** *"Build the Entries page: a list grouped by day, each row showing
tracking type chip, score(s), and title. Tap to open a detail sheet that lets
the user edit (reuses the New Entry components via `?edit=<id>`) or delete with
confirmation. Filter bar at top by tracking type."*

### Phase 8 — Dashboard ✅
**Prompt:** *"Build the Dashboard: a time-of-day greeting, a 'New Entry' CTA,
the 5 most recent entries, and one quick insight per active tracking type
(7-day average per axis with a small ↑/↓ delta vs the prior 7 days). Keep it
scannable; no heavy charts here."*

### Phase 9 — Charts ✅
**Prompt:** *"Build the Charts page with a tracking-type filter. For 1D types,
render a Recharts LineChart of value over time with a 7-point moving average
overlay. For 2D types, render a ScatterChart with axisX/axisY where dot opacity
encodes recency. Tap a point to open an entry detail sheet. Time-range chips:
7d / 30d / All."*

### Phase 10 — Polish + PWA finalize ⏳ (mostly stubbed)
**Status of what's done:** PWA manifest is wired up (theme color, background,
display=standalone, scope, start_url, icons), the service worker precaches the
build via Workbox, the app is safe-area-aware on iOS, the bottom nav uses a
floating FAB, empty states exist on every page, and `n` opens New Entry on
desktop.
**What's left for a future session:**
*"Generate proper 192/512 PNG icons + apple-touch-icon (currently SVG icons,
which work for installability on most platforms but are not iOS-friendly for
the home-screen icon). Add an offline fallback page. Verify Lighthouse PWA
score ≥ 90. Optionally swap `confirm()` calls for an in-app confirm dialog."*

---

## Progress Marker

**Completed in initial pass:** Phases 1 → 9 plus the structural work for
Phase 10 (manifest, service worker, safe-area, keyboard shortcut, empty states).

**Remaining:** the cosmetic/quality-of-life items in Phase 10 above —
specifically PNG icon generation and an offline fallback page. The app is
functional end-to-end without these.

---

## Future (post-MVP)

1. **Cloud sync via WebDAV / iCloud Drive folder export** — local-first stays
   the default; sync is opt-in and BYO storage.
2. **Pattern detection** — surface correlations between tracking types
   ("Energy is 0.3 lower on days you log < 6h sleep").
3. **Voice-to-entry** — tap-and-hold the mic, dictate a note, an LLM extracts
   the score and assigns the tracking type.
