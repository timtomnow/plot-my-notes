# CLAUDE.md

Notes for future Claude (or human) sessions working on this project.

## What this is
**Plot My Notes** — a local-first journaling + emotional-tracking PWA. See
[plan.md](plan.md) for the full product spec, phased build plan, and the exact
prompts to continue any unfinished phase.

## Quick start
```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # production build (also generates the service worker)
npm run preview      # serve the production build locally to test PWA install
npm run typecheck
```

## Stack
- **Vite + React 18 + TypeScript** (strict)
- **Tailwind CSS** for styling — mobile-first, no extra CSS layer
- **react-router-dom v6** for navigation
- **Dexie** (IndexedDB) for local persistence — no backend
- **dexie-react-hooks** `useLiveQuery` powers reactive UI; we don't need Redux
- **Recharts** for line + scatter charts
- **vite-plugin-pwa** — installable, offline-capable

## Code map
```
src/
  app/             router, providers, layout entry
  components/
    inputs/        Slider1D, Pad2D (the 2D drag pad — the centerpiece UX)
    charts/        LineChart1D, ScatterChart2D
    layout/        AppShell, BottomNav, Sidebar
  pages/           Dashboard, NewEntry, Entries, Charts, Axes, TrackingTypes
  db/
    schema.ts      Dexie database (versioned)
    repo.ts        typed CRUD — components import from here, never from dexie
    seed.ts        first-run sample data
  lib/             id, color, date, scoring helpers
  types.ts         Axis, TrackingType, JournalEntry
```

## Conventions
- **Never call Dexie directly from a component.** Go through `src/db/repo.ts`.
- **Reactive reads** use `useLiveQuery` (see `repo.ts` for the wrappers).
- **IDs** are `crypto.randomUUID()` — generated in the repo, not the caller.
- **Dates** are unix-ms numbers in the DB; format only at the view layer.
- **Tailwind** classes only; if you reach for `style={{}}` ask whether a class
  would do the job. The 2D pad is an exception — it positions the thumb with
  inline transforms because the value is dynamic.
- **No new top-level deps** without updating `plan.md`'s "Stack & Key Decisions"
  table and explaining the tradeoff.

## PWA notes
- `vite-plugin-pwa` is configured with `registerType: 'autoUpdate'`.
- Manifest lives in `vite.config.ts` (not a separate `manifest.json`) so we can
  share metadata with the build.
- Icons in `public/`: `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`.
  Phase 10 will replace the placeholder icons with branded ones.

## Working on this codebase
- Look at `plan.md` first — it tells you which phases are done and the prompt
  for each remaining phase. Each phase is intentionally independent.
- Prefer editing existing files over adding new ones. The folder structure is
  intentionally flat.
- When you change the data model, **bump the Dexie version** in `schema.ts` and
  add a migration. Do not silently change a schema.
