# Tasks: Fix Progress, Filters, and UI Affordances

**Input**: Design documents from `/specs/005-fix-progress-filter-ui/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/ui-fixes.md`, `quickstart.md`

**Tests**: Included because the user explicitly asked for Playwright verification and each
bug was confirmed with browser measurements.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: `US1`–`US4` in user-story phases only
- Every task includes an exact file path

## Path Conventions

- Backend: `backend/src/`, `backend/tests/`
- Frontend: `frontend/src/`, `frontend/tests/e2e/`
- Styles: `frontend/src/styles/global.css`

---

## Phase 1: Setup (Shared Test Fixtures)

**Purpose**: Add a reusable account/records fixture for browser tests.

- [X] T001 [P] Create `frontend/tests/e2e/support/account.ts` with helpers to register a unique account, seed `gdul.session`, and optionally create a completion and progress for known levels.

---

## Phase 2: Foundational (Shared Query Contract)

**Purpose**: Make the catalog query contract explicit before filtering work.

- [X] T002 [P] Update `levelQuerySchema` in `backend/src/http/schemas.ts` so `status` accepts only `completed` or `in-progress` (or is absent), while `playerId` remains available for account-scoped filtering.

**Checkpoint**: Status values are validated consistently; user stories can proceed.

---

## Phase 3: User Story 1 - Choose partial progress with the slider (Priority: P1) 🎯 MVP

**Goal**: Make the progress slider span the dialog and work with pointer, drag, keyboard, and the number field.

**Independent Test**: Open a level’s progress dialog, click/drag the slider, type a value, press arrow keys, save, and confirm the chosen best progress persists.

### Tests for User Story 1

- [X] T003 [P] [US1] Add `frontend/tests/e2e/progress-slider.spec.ts` covering slider track width, pointer click, drag, number-field synchronization, keyboard arrows, save, and lower-value preservation.

### Implementation for User Story 1

- [X] T004 [US1] Give the Radix slider root full width in `frontend/src/features/level/LevelDialog.tsx`, keeping the existing 1–99 input and save behavior; verify the track and thumb positions with the test from T003.

---

## Phase 4: User Story 2 - Filter levels by completion status (Priority: P1)

**Goal**: Make Completed and In Progress filters change the actual catalog results, counts, and pagination.

**Independent Test**: With one completed and one in-progress level, each filter returns only matching rows and the displayed match count changes.

### Tests for User Story 2

- [X] T005 [P] [US2] Add `backend/tests/integration/levels-filter.test.ts` covering completed, in-progress, combined filters, zero matches, missing/unknown status, missing `playerId`, and filtered totals/pages.
- [X] T006 [P] [US2] Add `frontend/tests/e2e/catalog-status-filter.spec.ts` using `support/account.ts` to assert Completed/In Progress rows, match count, combination with search/zone, and reset.

### Implementation for User Story 2

- [X] T007 [US2] Update `backend/src/http/routes/levels.ts` to derive completion and progress level-ID sets for `playerId` and return `PLAYER_ID_REQUIRED` when status is supplied without a player.
- [X] T008 [US2] Update `backend/src/services/live-catalog.ts` to accept the derived sets and filter `completed` (in completions) and `in-progress` (in progress and not in completions) before sorting and pagination.
- [X] T009 [US2] Verify `frontend/src/features/catalog/CatalogPage.tsx` and `frontend/src/lib/url-state/catalog.ts` send `status`/`playerId` and refetch on apply; fix any missing request or count update.
- [X] T010 [P] [US2] Update `mock/server.ts` so its status/playerId filtering matches the backend rules (In Progress excludes completed levels) and supports the same e2e assertions.

---

## Phase 5: User Story 3 - Show a pointer cursor on sort controls (Priority: P2)

**Goal**: Give the sort trigger and every sort menu option a pointer cursor.

**Independent Test**: Hover the trigger and each option and read a pointer cursor.

### Tests for User Story 3

- [X] T011 [P] [US3] Add `frontend/tests/e2e/ui-affordances.spec.ts` covering the sort trigger and GLOBAL/ZONE/NAME/COMPLETIONS option cursor values.

### Implementation for User Story 3

- [X] T012 [US3] Add `cursor: pointer` to the shared `.menu-item` rule in `frontend/src/styles/global.css`, covering sort and mobile menu options.

---

## Phase 6: User Story 4 - Make the profile tab border match its content (Priority: P2)

**Goal**: Remove the large empty bordered area to the right of the profile tabs while keeping tabs usable at 320px.

**Independent Test**: Inspect the profile tab border at 1440px and 320px; its width matches the tabs or fills the row, with no page overflow.

### Tests for User Story 4

- [X] T013 [P] [US4] Add `frontend/tests/e2e/profile-tabs.spec.ts` comparing the tab-list border width to the sum of tab widths at desktop and checking no horizontal page overflow at 320px.

### Implementation for User Story 4

- [X] T014 [US4] Add a `profile-tabs` class to the profile `Tabs.List` in `frontend/src/features/profile/ProfilePage.tsx` and style it in `frontend/src/styles/global.css` so the border is content-sized and capped at the available width, without changing auth/catalog tabs.
- [X] T015 [US4] Verify the 1440px and 320px tab layouts from T013; adjust tab padding/wrapping in `frontend/src/styles/global.css` only if needed to keep all tabs reachable without page overflow.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Full verification and cleanup.

- [X] T016 Run `npm run typecheck` and `npm run lint` from `package.json`; fix all failures.
- [X] T017 Run `npm test` from `package.json`; fix all failures.
- [X] T018 Run `npm run test:e2e` and `npm run test:e2e:backend` from `package.json`; fix all failures.
- [X] T019 Re-run the Playwright audit for all four bugs at 1440×900, 390×844, and 320×568 using `frontend/tests/e2e`; capture screenshots and confirm slider selection, filter results, cursors, and tab-border widths.
- [X] T020 [P] Clean up unused CSS/imports and stale test data in `frontend/src`, `backend/src`, and `frontend/tests/e2e`; keep behavior unchanged.

---

## Phase 8: User Story 1 Follow-up - Progress-bar geometry and mobile selection (Priority: P1)

**Goal**: Turn the progress control into a true progress-bar-style range with inset thumb
and a filled track, and prove it at mobile widths.

**Independent Test**: Open the progress dialog at 390×844 and 320×568; the bar spans the
content with padding, the thumb is inset at 1 and 99, the fill matches the value, and
pointer/keyboard/save work.

### Tests for User Story 1 follow-up

- [X] T021 [P] [US1] Extend `frontend/tests/e2e/progress-slider.spec.ts` to assert filled-track width, thumb inset at 1 and 99, value-to-position mapping, and pointer/keyboard/save at 390×844 and 320×568.

### Implementation for User Story 1 follow-up

- [X] T022 [US1] Restyle the progress control in `frontend/src/features/level/LevelDialog.tsx` and `frontend/src/styles/global.css` as a progress-bar-style range: horizontal inset, filled range, thumb inside the track, full-width layout.
- [X] T023 [US1] Re-run the desktop/mobile progress tests and fix any overflow or reachability issues in `LevelDialog.tsx` or `global.css`.

---

## Phase 9: User Story 5 - Full mobile verification (Priority: P1)

**Goal**: Prove the complete product on small screens and landscape, and fix any layout or
reachability regressions found.

**Independent Test**: Run catalog, filters, sort, level dialog, progress control, auth
dialogs, and profile at 320×568, 360×640, 375×667, 390×844, and 844×390; no horizontal
page overflow and every primary action is reachable.

### Tests for User Story 5

- [X] T024 [P] [US5] Add `frontend/tests/e2e/mobile-full-audit.spec.ts` covering the mobile matrix and primary flows, using `frontend/tests/e2e/support/layout.ts` for overflow and viewport assertions.

### Implementation for User Story 5

- [X] T025 [US5] Fix catalog toolbar, filters, sort menu, and zone tabs at the mobile matrix in `frontend/src/features/catalog/CatalogPage.tsx` and `frontend/src/styles/global.css`.
- [X] T026 [US5] Fix level/progress/auth dialog height, scrolling, and action reachability on short screens and landscape in `frontend/src/features/level/LevelDialog.tsx`, `frontend/src/features/auth/AuthDialog.tsx`, and `frontend/src/styles/global.css`.
- [X] T027 [US5] Fix profile, completion rows, and header account controls at 320–390px and landscape in `frontend/src/features/profile/ProfilePage.tsx`, `frontend/src/components/layout/AppChrome.tsx`, and `frontend/src/styles/global.css`.
- [X] T028 [US5] Extend `frontend/tests/e2e/ui-resilience.spec.ts`, `frontend/tests/e2e/filter-panel.spec.ts`, and `frontend/tests/e2e/mobile-accessibility.spec.ts` with the new mobile matrix assertions; re-run after T025–T027.

---

## Phase 10: Follow-up Polish & Cross-Cutting Concerns

- [X] T029 [P] Update `docs/ACCESSIBILITY.md` with the mobile matrix, orientation, and Playwright audit commands.
- [X] T030 Run `npm run typecheck` and `npm run lint` from `package.json`; fix all failures.
- [X] T031 Run `npm test` from `package.json`; fix all failures.
- [X] T032 Run `npm run test:e2e` and `npm run test:e2e:backend` from `package.json`; fix all failures.
- [X] T033 Re-run the full Playwright mobile matrix in `frontend/tests/e2e/mobile-full-audit.spec.ts` and capture screenshots for catalog, filters, level/progress dialogs, auth, and profile.
- [X] T034 [P] Clean up unused CSS/imports and test-data assumptions in `frontend/src`, `frontend/tests/e2e`, and `backend/src`.


---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup**: T001 starts immediately.
- **Foundational**: T002 starts immediately and does not block UI-only stories, but must be
  complete before US2 filter work.
- **US1**: T003 then T004; independent of US2–US4. Follow-up T021 then T022/T023.
- **US2**: T005/T006 after T002; T007/T008 after tests; T009 after T007/T008; T010 can run
  alongside T007/T008 because it touches the mock only.
- **US3**: T011 before T012; independent of other stories.
- **US4**: T013 before T014; T015 after T014.
- **US5**: T024 before T025–T028; T028 after layout fixes.
- **Polish**: T016–T020 for the first pass, then T029–T034 for the follow-up; final polish
  depends on US1 follow-up and US5.

### User Story Dependencies

- **US1 (P1)**: Independent.
- **US2 (P1)**: Depends on the status query contract in T002.
- **US3 (P2)**: Independent.
- **US4 (P2)**: Independent.

### Parallel Opportunities

- T001 and T002.
- T003 (slider test), T005 (backend filter test), T006 (browser filter test), T011 (cursor
  test), and T013 (tab test) touch different files and can be written in parallel.
- T005 and T006 are parallel.
- T010 can run parallel with T007/T008 (mock vs real backend).
- T012 and T014 both touch `global.css`; run them sequentially.
- T016/T017/T018 are sequential; T019/T020 follow.
- T021 (progress test) and T024 (mobile audit) are parallel.
- T022, T025, T026, and T027 all touch `global.css` and related components; run them
  sequentially or coordinate the CSS edits.
- T029/T034 can run in parallel after implementation; T030–T033 run sequentially after fixes.

### Within Each Story

- Add the failing browser/integration check first.
- Make the smallest change that fixes the measured issue.
- Re-run the story check before moving on.

---

## Parallel Example: P1 Checks

```bash
Task: "T003 [US1] Add progress-slider e2e in frontend/tests/e2e/progress-slider.spec.ts"
Task: "T005 [US2] Add backend level-filter test in backend/tests/integration/levels-filter.test.ts"
Task: "T006 [US2] Add catalog-status-filter e2e in frontend/tests/e2e/catalog-status-filter.spec.ts"
Task: "T011 [US3] Add sort cursor e2e in frontend/tests/e2e/ui-affordances.spec.ts"
Task: "T013 [US4] Add profile tab-border e2e in frontend/tests/e2e/profile-tabs.spec.ts"
```

---

## Implementation Strategy

### MVP First (US1 + US2)

These are the P1 functional blockers: progress selection and working status filters.

1. Complete Setup and the status query contract.
2. Add and pass the slider tests, then fix the slider.
3. Add and pass backend/UI filter tests, then fix real and mock filtering.
4. Validate US1 + US2 independently.

### Incremental Delivery

1. P1 slider and filters.
2. P2 pointer cursor and profile tab border.
3. Full regression suite and visual audit.

---

## Notes

- Keep the existing 1–99 progress validation and lower-value rule.
- Status filtering is account-scoped and read-only.
- Do not change catalog/ auth tab full-width behavior; only profile tabs without a note.
- Use Playwright measurements, not screenshots alone, for cursor and width proof.
