# Quickstart — Unified Demonlist MVP

## Design reference

Penpot page: `GDUnitedList · UX/UI`.

Boards:

- `DS / Design System`
- `01 / Catalog — ALL`
- `02 / Zone — Pointercrate`
- `03 / Level Dialog`
- `04 / Player Profile`
- `05 / Local Leaderboard`
- `06 / Guest Onboarding`
- `07 / States`
- `08 / Mobile`
- `09 / Interaction Map`

All visual tokens come from `docs/design.md`. Penpot font fallbacks: Inter for
Helvetica Neue, Courier Prime for Courier New; Georgia is available.

## Prerequisites

- Node.js 22+
- npm 10+
- A modern browser

## Setup

```bash
npm install
npm run seed:mock
```

`seed:mock` generates `data/mock-db.json` with 10,247 levels, imported records, seeded
local players, completions, progress, and source status. The seed is deterministic and
safe to rerun; it replaces the mock database.

## Run locally

In two terminals:

```bash
npm run dev:mock
```

Starts the mock service on `http://localhost:3001`.

```bash
npm run dev
```

Starts the React app on `http://localhost:5173`. The Vite dev server proxies `/api` to
the mock service.

## Validation scenarios

### 1. Catalog and zones

1. Open `/catalog`.
2. Confirm the ALL view is ordered by global rank and shows the total count.
3. Select POINTERCRATE. Confirm `MAIN` (1–75) and `EXTENDED` (76–150) are available.
4. Select AREDL and GDDL. Confirm no level repeats across zones.
5. Search for `GRIEF`, filter by difficulty and length, then reset filters.
6. Confirm the address bar contains zone, query, filters, sort, and page.

Expected: every view loads within 2 seconds against the seeded dataset; an empty search
shows the empty state with a reset action.

### 2. Level details

1. Open `GRIEF` from the catalog.
2. Confirm global rank, zone rank, zone, difficulty, author, preview, and completion
   list.
3. Confirm imported records show their source label and local records show the local
   player.
4. Confirm a missing preview falls back to a placeholder.

### 3. Guest profile and writes

1. Clear site data, then open a level and choose `RECORD COMPLETION`.
2. Create a guest profile with a 2–32 character display name.
3. Record progress at 87%, then 91%; the profile keeps 91%.
4. Record a completion; the level moves from progress to completed.
5. Submit the same completion again; the profile still shows one completion.
6. Reload the page; the guest profile and records persist on the same device.
7. Clear site data; the profile is gone and the UI explains that durable accounts are
   deferred.

Expected: players cannot lower or delete records; imported records stay read-only.

### 4. Points and leaderboard

1. Complete a top-ranked level and a low-ranked level.
2. Confirm the top-ranked completion awards more points.
3. Confirm progress below 100% awards no points.
4. Open `/leaderboard`; confirm only local profiles appear and rank order matches points.
5. Confirm imported community players appear only in level completion lists, labelled
   with their source.

### 5. States and accessibility

1. Simulate a slow mock response; confirm loading skeletons.
2. Stop the mock service; confirm the error state with retry and that the last known
   catalog remains usable.
3. Navigate the catalog, zone tabs, level dialog, and forms using only the keyboard.
4. Confirm visible focus, Escape closes overlays, and focus returns to the trigger.

## Quality checks

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
```

Expected: all checks pass. Any new dependency must have a written justification in the
change and must not replace Node.js, React, Radix UI, or the design system.
