# Implementation Plan: Fix Progress, Filters, and UI Affordances

**Branch**: `005-fix-progress-filter-ui` | **Date**: 2026-11-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/005-fix-progress-filter-ui/spec.md`

## Summary

Fix four confirmed UI defects: the progress slider collapses to thumb width, completion
status filters change the URL but not the catalog results, sort menu options lack a pointer
cursor, and the profile tab border extends far beyond its tabs. The fixes are a slider
width correction, server-side completion/progress filtering in the catalog query, menu
cursor styling, and a content-sized profile tab bar. Browser automation proves each fix.

## Technical Context

**Language/Version**: TypeScript 5.7, React 19, Node.js 22  
**Primary Dependencies**: Express, better-sqlite3, Radix UI (Slider, Tabs, DropdownMenu), React Router  
**Storage**: Existing SQLite `completions` and `progress` tables; no schema change  
**Testing**: Vitest, Supertest, Playwright; pointer/keyboard/filter/viewport scenarios  
**Target Platform**: Existing web app, desktop and 320px mobile  
**Project Type**: Web application monorepo (`backend/`, `frontend/`, `shared/`)  
**Performance Goals**: Status filtering should filter in the existing in-memory catalog without a full catalog reload; no measurable regression  
**Constraints**: Preserve existing progress rules, catalog pagination, auth, and accessibility; no new dependencies  
**Scale/Scope**: Four focused fixes in one level dialog, catalog route/query, sort menu styling, and profile tabs

## Constitution Check

| Principle | Assessment | Evidence |
|-----------|------------|----------|
| I. Design System Source of Truth | PASS | Use existing slider, menu, and tab styles; no new visual language |
| II. TypeScript & Minimal Dependencies | PASS | No new packages; extend existing catalog query path |
| III. Radix UI First | PASS | Keep Radix Slider, DropdownMenu, and Tabs primitives |
| IV. UX, Accessibility & Responsiveness | PASS | Fix pointer selection, keyboard slider use, filter feedback, cursor affordance, and 320px tab layout |
| V. Modularity, Reuse & Compliance | PASS | Keep filtering in the catalog query layer and styling in shared CSS |

**Result**: No violations; no complexity tracking required.

**Post-design re-check**: PASS. The design changes only existing query/UI layers and adds
no parallel implementation.

## Project Structure

```text
backend/
├── src/
│   ├── http/routes/levels.ts          # parse status/playerId and supply record sets
│   └── services/live-catalog.ts       # filter by completed/in-progress sets
└── tests/
    └── integration/levels-filter.test.ts

frontend/
├── src/
│   ├── features/level/LevelDialog.tsx # full-width slider root
│   ├── features/profile/ProfilePage.tsx # profile-tabs class
│   ├── styles/global.css              # menu cursor, profile tab sizing
│   └── lib/url-state/catalog.ts       # existing URL state; verify
└── tests/e2e/
    ├── progress-slider.spec.ts
    ├── catalog-status-filter.spec.ts
    └── ui-affordances.spec.ts
```

**Structure Decision**: Keep filtering in `levelsRouter` + `LiveCatalog.list` because the
route owns the database and the catalog owns pagination/sorting. Keep slider, cursor, and
tab fixes in existing components/CSS. Add focused Playwright tests for each reported bug.

## Implementation Notes

1. **Progress slider**: Give the Radix `Slider.Root` full width in
   `frontend/src/features/level/LevelDialog.tsx` so the track spans the dialog and pointer
   clicks map across 1–99. Keep the existing number field; Radix handles keyboard support
   and two-way value updates.
2. **Status filter**: In `backend/src/http/routes/levels.ts`, when `status` is present,
   require a `playerId` (existing query contract), query the player's completion and
   progress level IDs, and pass those sets to `catalog.list`. In
   `backend/src/services/live-catalog.ts`, filter:
   - `completed`: level ID in completions;
   - `in-progress`: level ID in progress and not in completions.
   Apply this before sorting and pagination so count/pages are correct.
3. **Cursor**: Add `cursor: pointer` to the shared `.menu-item` class so Radix dropdown
   options (including sort) show the pointer. The trigger already inherits pointer from
   `button`.
4. **Profile tab border**: Add a `profile-tabs` class to the profile `Tabs.List` and make
   it content-sized (`width: fit-content; max-width: 100%`) so its border ends with the
   tabs. Keep auth-dialog tabs full-width. At 320px, keep all three tabs reachable; if
   they exceed the row, allow the existing horizontal tab overflow rather than a page
   overflow.
5. **Verification**: Add Playwright tests for slider pointer/keyboard/save, completed and
   in-progress filtering with count checks, sort trigger/menu cursors, and profile tab
   border width vs tab content widths. Add a backend integration test for filtered
   catalog totals.

## Verification

- `npm run typecheck`, `npm run lint`, `npm test`
- `npm run test:e2e` (mock) and `npm run test:e2e:backend`
- Targeted Playwright checks:
  - slider click/drag/keyboard updates the number field and saves;
  - completed/in-progress results match account records;
  - sort menu options report `cursor: pointer`;
  - profile tab border width is not dramatically wider than the tabs at desktop and does
    not overflow the page at 320px.

## Complexity Tracking

No constitution violations.
