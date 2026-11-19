# Implementation Plan: Unified Demonlist MVP

**Branch**: `001-unified-demonlist-mvp` | **Date**: 2026-11-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/001-unified-demonlist-mvp/spec.md`

## Summary

Build the first GD United List experience as a frontend-first React application: a
unified catalog over Pointercrate, AREDL, and GDDL zones; level details; temporary guest
profiles; local progress and completions; and a local leaderboard. Validate the complete
UX against a `json-server`-backed mock API and the Penpot design page
`GDUnitedList · UX/UI`, then replace the mock with the production Node.js/TypeScript
backend without changing the client contract.

## Technical Context

**Language/Version**: Node.js 22+, TypeScript 5.x (strict), React 19, modern browser
JavaScript

**Primary Dependencies**: React, Vite, Radix UI primitives; `json-server`, Express, and
`tsx` only for the local mock adapter (development-only)

**Storage**: `data/mock-db.json` through `json-server` for the frontend-first milestone;
production storage is defined by the backend phase, not this plan

**Testing**: Vitest + React Testing Library, Playwright, TypeScript `tsc --noEmit`,
ESLint

**Target Platform**: Modern desktop and mobile browsers; responsive from 390 px to
1440 px

**Project Type**: Web application (frontend + mock API), monorepo

**Performance Goals**: 95% of catalog and zone views render within 2 seconds on
standard broadband; page transitions under 2 seconds; no full-catalog download

**Constraints**: Strict `docs/design.md` tokens; Radix UI for every interactive control;
keyboard and screen-reader support; local-only leaderboard; imported records read-only
and source-labelled; no real authentication in this delivery

**Scale/Scope**: 10,000+ levels (150 Pointercrate, ~1,600 AREDL, ~10,000 GDDL), 10
Penpot boards (design system, catalog, zone, level dialog, profile, leaderboard,
onboarding, states, mobile, interaction map), local guest profiles in the low hundreds

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Design System Source of Truth**: PASS. All visual decisions use the three
  `docs/design.md` colors, its type scale, radii (4/8/16), and spacing (16/32/64). The
  Penpot design documents the system before implementation.
- **II. TypeScript & Minimal Dependencies**: PASS. React + TypeScript strict for the
  client; Node.js + TypeScript for the mock adapter. Radix UI is the approved UI stack.
  `json-server` is a development mock only. No additional component or styling library.
- **III. Radix UI First**: PASS. Tabs, Dialog, DropdownMenu, Popover, HoverCard,
  Tooltip, Progress, ScrollArea, Toast, and form primitives come from Radix.
- **IV. UX, Accessibility & Responsiveness**: PASS. Loading, empty, error, success, and
  confirmation states are part of the design; keyboard and focus behavior are acceptance
  criteria; mobile boards are included.
- **V. Modularity, Reuse & Compliance**: PASS. Shared Radix wrappers live in
  `frontend/src/components/ui`; feature components consume them. The compliance review
  is part of the task checklist.

No violations. Complexity Tracking is intentionally empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-unified-demonlist-mvp/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   └── api.md
├── checklists/
│   └── requirements.md
└── spec.md

docs/
├── PRD.md
├── ARCHITECTURE.md
└── design.md
```

### Source Code (repository root)

```text
frontend/
├── src/
│   ├── app/
│   │   ├── App.tsx
│   │   ├── routes.tsx
│   │   └── providers.tsx
│   ├── components/
│   │   ├── ui/                  # Radix wrappers: Tabs, Dialog, Menu, Popover, Toast...
│   │   ├── layout/              # AppHeader, AppFooter, PageShell
│   │   └── shared/              # ZonePill, SourceBadge, LevelThumb, EmptyState
│   ├── features/
│   │   ├── catalog/
│   │   ├── level/
│   │   ├── profile/
│   │   ├── leaderboard/
│   │   └── onboarding/
│   ├── lib/
│   │   ├── api/                 # typed client for contracts/api.md
│   │   ├── events/              # records:changed cross-feature invalidation
│   │   ├── identity/            # guest profile persistence
│   │   ├── ranking/             # points/status presentation helpers
│   │   └── url-state/           # zone, filters, sort, page
│   ├── styles/
│   │   ├── tokens.css           # docs/design.md mapping
│   │   └── global.css
│   └── test/
├── public/
├── tests/
│   ├── integration/
│   └── e2e/
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts

mock/
├── server.ts                    # Express + json-server router entrypoint
└── routes/
    ├── levels.ts
    ├── players.ts
    ├── progress.ts
    ├── completions.ts
    ├── leaderboard.ts
    └── source-status.ts

data/
├── levels.json                  # canonical zone/rank reference data
└── mock-db.json                 # generated mock store (git-ignored)

scripts/
├── seed-mock.mjs                # deterministic 10k-level mock seed
├── refresh-levels.mjs           # level/position refresh with zone priority
├── refresh-completions.mjs      # imported completion refresh
├── recalculate-rankings.mjs     # points/rank recalculation
└── correct-records.mjs          # guarded internal admin correction (--confirm)

shared/
└── types.ts                     # Level, Player, Completion, Progress, API envelopes

tests/                            # cross-cutting fixtures if needed
```

**Structure Decision**: Frontend-first web application. The mock server mirrors the
contract so the production backend can replace it later. `shared/types.ts` keeps the
contract type-safe on both sides. `backend/` is deliberately not created in this
milestone; the contract and types define the integration seam.

## Design Deliverables

Penpot page: `GDUnitedList · UX/UI`.

| Board | Purpose |
|---|---|
| `DS / Design System` | Colors, typography, spacing, radii, core components |
| `01 / Catalog — ALL` | Main catalog, search, filters, rows, pagination |
| `02 / Zone — Pointercrate` | Zone tabs, main/extended, source context |
| `03 / Level Dialog` | Details, preview, actions, local/imported completions |
| `04 / Player Profile` | Guest profile, points, status, progress, completions |
| `05 / Local Leaderboard` | Local ranking and imported-records exclusion notice |
| `06 / Guest Onboarding` | Profile creation and device-only explanation |
| `07 / States` | Loading, empty, error, success, confirmation, source failure |
| `08 / Mobile` | Mobile catalog, level sheet, profile, leaderboard |
| `09 / Interaction Map` | Confirmations, profile gate, filters, sort, share, imported-record info, pagination, retry, mobile sheet |

Component mapping:

- Zone tabs → Radix Tabs
- Filters and sort → Radix DropdownMenu + Popover
- Level details, profile creation, confirmations → Radix Dialog / AlertDialog
- Completion rows and player summaries → Radix HoverCard / Tooltip
- Progress bars → Radix Progress
- Filter checkboxes → Radix Checkbox
- Progress input → Radix Slider + numeric input
- Long lists and dialogs → Radix ScrollArea
- Save/error feedback → Radix Toast

## Implementation Phases

### Phase A — Foundation

- Initialize Vite + React + TypeScript strict.
- Add tokens from `docs/design.md` and global reset.
- Build shared Radix wrappers and the layout shell.
- Add the typed API client.

### Phase B — Catalog and level details

- Catalog ALL view with server-side query contract.
- Zone views with Pointercrate main/extended.
- Search, filters, sort, pagination, URL state.
- Level dialog with preview and combined completion list.
- Loading, empty, error, and image fallback states.

### Phase C — Profile, writes, leaderboard

- Guest onboarding and device-local identity.
- Progress and completion writes with idempotent behavior.
- Profile overview, completions, progress.
- Local leaderboard with top-heavy points and status.
- Success/error toasts for player writes. Administrative corrections remain internal
  and outside the player UI.

### Phase D — Validation and handoff

- Accessibility and keyboard pass.
- Responsive verification against mobile boards.
- Unit, integration, and Playwright coverage for P1–P3 stories.
- Replace mock base URL with the backend contract when available.

## Mock Data Strategy

`scripts/seed-mock.mjs` deterministically generates:

- 150 Pointercrate levels (75 main + 75 extended) using real top-level fixtures.
- ~1,600 AREDL levels, excluding Pointercrate IDs.
- GDDL levels filling the remaining catalog up to 10,000+.
- Imported completions with source labels for popular levels.
- A small set of local guest players, completions, progress, and a precomputed
  leaderboard.

The mock server exposes the contract in `contracts/api.md`. Computed routes
(`/api/leaderboard`, nested completions) use the `json-server` router plus a thin
TypeScript adapter. The seed is safe to rerun and never overwrites `data/levels.json`.

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| Mock diverges from production contract | Single typed contract in `shared/types.ts`; contract tests against the mock |
| 10k-level catalog feels slow | Server-side pagination in the contract; `json-server` pagination; lazy thumbnails |
| Imported records mistaken for local | `recordType` + source label always rendered; points exclude imported |
| Guest profile loss surprises users | Onboarding explains device-only storage; explicit recovery message |
| Font substitution changes the look | Documented fallback stacks; visual check against Penpot boards |
| Design drift during implementation | Shared UI wrappers and the mandatory compliance checklist |
