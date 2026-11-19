# Tasks: UI Resilience Bugfixes

**Input**: Design documents from `/specs/003-ui-bugfixes/`

**Prerequisites**: `plan.md`, `spec.md`

**Tests**: Included because these are regression fixes for measured layout and labeling
defects. Add the failing browser checks before the CSS/DTO changes where practical.

**Organization**: Tasks are grouped by the six UI-audit user stories.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: `US1`–`US6` in user-story phases only
- Every task includes an exact file path

## Path Conventions

- Frontend: `frontend/src/`, `frontend/tests/e2e/`, `frontend/public/`
- Backend: `backend/src/`, `backend/tests/`
- Shared: `shared/types.ts`
- Docs: `docs/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Add shared player-kind contracts and reusable browser layout assertions.

- [X] T001 Add `PlayerKind = 'account' | 'legacy'` and a `playerKind` field to `LocalCompletion` and `LeaderboardEntry` in `shared/types.ts`.
- [X] T002 [P] Create `frontend/tests/e2e/support/layout.ts` with helpers to assert no horizontal document overflow and to read the header/menu control boxes at a given viewport.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Make the backend expose player kind so the UI can label records correctly.

- [X] T003 Implement player-kind derivation in `backend/src/domain/ranking.ts` and `backend/src/domain/records.ts` using the existing `accounts` table; map the new field through `backend/src/http/routes/leaderboard.ts`, `backend/src/http/routes/levels.ts`, and `backend/src/http/routes/players.ts` without rewriting legacy rows.
- [X] T004 [P] Add `backend/tests/integration/player-kind.test.ts` asserting account completions/leaderboard rows are `account` and preserved legacy rows are `legacy`.

**Checkpoint**: Public DTOs expose a stable player kind; UI stories can proceed.

---

## Phase 3: User Story 1 - Reach the site leaderboard (Priority: P1) 🎯 MVP

**Goal**: Add a visible Leaderboard entry to desktop navigation and the mobile menu.

**Independent Test**: From `/`, reach `/leaderboard` through one visible navigation action on desktop and mobile; the active state is clear.

### Tests for User Story 1

- [X] T005 [P] [US1] Add `frontend/tests/e2e/navigation.spec.ts` covering the desktop nav, mobile menu, and active leaderboard state.

### Implementation for User Story 1

- [X] T006 [US1] Add Leaderboard `NavLink` to the desktop nav and a Leaderboard item to the mobile dropdown in `frontend/src/components/layout/AppChrome.tsx`, using existing active-link styling.
- [X] T007 [US1] Update the mobile navigation expectations in `frontend/tests/e2e/mobile-accessibility.spec.ts` if the new menu item changes its accessible contents.

---

## Phase 4: User Story 2 - Keep layouts usable on small screens and with long names (Priority: P1)

**Goal**: Remove horizontal overflow at 320/390px and safely handle 32-character display names.

**Independent Test**: At 390px with a 32-character unbroken name, the header controls are visible and the document has no horizontal scroll; at 320px with a normal name the same is true; profile and leaderboard text stays inside its container; GDDL is reachable.

### Tests for User Story 2

- [X] T008 [P] [US2] Add `frontend/tests/e2e/ui-resilience.spec.ts` using `support/layout.ts` to cover long-name overflow in header/profile/leaderboard, normal-name overflow at 320px, and GDDL reachability.

### Implementation for User Story 2

- [X] T009 [US2] Harden the header in `frontend/src/styles/global.css` and `frontend/src/components/layout/AppChrome.tsx`: `min-width: 0` on flex children, shrinkable wordmark, account-chip max width with ellipsis, and no clipped mobile menu at 320px.
- [X] T010 [US2] Harden the profile layout in `frontend/src/styles/global.css`: prevent the profile title from widening the hero/stats grid and allow unbroken names to wrap or truncate.
- [X] T011 [US2] Harden leaderboard rows in `frontend/src/styles/global.css` and `frontend/src/features/leaderboard/LeaderboardPage.tsx`: constrain the name cell and wrap/ellipsize long names.
- [X] T012 [US2] Make all four zone tabs reachable at 320px in `frontend/src/styles/global.css` (wrap or visible horizontal scroll), without changing desktop tab behavior.

---

## Phase 5: User Story 3 - Apply filters on short screens (Priority: P1)

**Goal**: Keep Reset and Apply reachable when the filter panel is taller than the viewport.

**Independent Test**: At 320×568, open Filters, scroll inside the panel, activate a filter, and press Apply; results update.

### Tests for User Story 3

- [X] T013 [P] [US3] Add `frontend/tests/e2e/filter-panel.spec.ts` asserting Reset/Apply are reachable and the panel scrolls at 320×568.

### Implementation for User Story 3

- [X] T014 [US3] Add viewport-relative `max-height` and `overflow-y: auto` to `.popover` in `frontend/src/styles/global.css`, keeping the existing Radix positioning behavior.

---

## Phase 6: User Story 4 - Distinguish account records from legacy records (Priority: P2)

**Goal**: Show `ACCOUNT` and `LEGACY` consistently in level dialogs, profile, and leaderboard.

**Independent Test**: One account completion and one legacy completion render with different labels in a level dialog; legacy leaderboard rows are not labeled as accounts.

### Tests for User Story 4

- [X] T015 [P] [US4] Add `frontend/tests/e2e/player-labels.spec.ts` with one account and one legacy completion/leaderboard row, asserting `ACCOUNT`/`LEGACY` labels.

### Implementation for User Story 4

- [X] T016 [US4] Extend the local-record badge in `frontend/src/components/shared/Badges.tsx` to render `ACCOUNT` or `LEGACY` from `playerKind` while leaving imported source badges unchanged.
- [X] T017 [US4] Update `frontend/src/features/level/LevelDialog.tsx` to pass `record.playerKind` to the local-record badge.
- [X] T018 [US4] Update `frontend/src/features/leaderboard/LeaderboardPage.tsx` so legacy rows say `LEGACY` and account rows say `ACCOUNT`.
- [X] T019 [US4] Verify/update `frontend/src/features/profile/ProfilePage.tsx` so account completion labels remain consistent with the level dialog and leaderboard.

---

## Phase 7: User Story 5 - Reach auth actions on short screens (Priority: P2)

**Goal**: Keep auth submit/cancel reachable at 320×568 and make the two auth tabs fill their row.

**Independent Test**: At 320×568, the registration dialog can scroll to and activate submit/cancel; at 1440px the auth tabs fill the row.

### Tests for User Story 5

- [X] T020 [P] [US5] Add `frontend/tests/e2e/auth-dialog-layout.spec.ts` asserting submit/cancel reachability at 320×568 and tab widths at 1440px.

### Implementation for User Story 5

- [X] T021 [US5] Adjust `frontend/src/features/auth/AuthDialog.tsx` and `frontend/src/styles/global.css` so the dialog header stays fixed and the body/actions remain reachable within the `92vh` max height.
- [X] T022 [US5] Make the auth tabs fill the tab row via the dialog-specific tab styling in `frontend/src/styles/global.css`.

---

## Phase 8: User Story 6 - Finish small UI polish items (Priority: P3)

**Goal**: Serve a favicon and remove the repeated 404 console error.

**Independent Test**: Load any page; the favicon request succeeds and no favicon 404 appears.

### Implementation for User Story 6

- [X] T023 [US6] Add `frontend/public/favicon.svg` and link it from `frontend/index.html`.
- [X] T024 [P] [US6] Add `frontend/tests/e2e/favicon.spec.ts` asserting the favicon response is successful and the page does not log a favicon 404.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Documentation, full verification, and a final viewport audit.

- [X] T025 [P] Update `docs/ACCESSIBILITY.md` with the 320×568, 390×844, and long-display-name checks.
- [X] T026 Run `npm run typecheck`, `npm run lint`, and `npm test` from `package.json`; fix all failures.
- [X] T027 Run `npm run test:e2e` and `npm run test:e2e:backend` from `package.json`; fix all failures.
- [X] T028 Re-run the visual audit at 1440×900, 390×844, 375×667, 360×640, and 320×568 using the helpers in `frontend/tests/e2e/support/layout.ts`; confirm no horizontal page overflow and capture screenshots.
- [X] T029 [P] Clean up unused CSS/imports and confirm no `320px` overflow remains in `frontend/src` and `frontend/tests/e2e`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup**: T001 and T002 can start immediately.
- **Foundational**: T003 depends on T001; T004 depends on T003. Blocks US4.
- **US1**: Starts after Setup; test T005 before T006.
- **US2**: Starts after Setup; test T008 before T009–T012.
- **US3**: Starts after Setup; test T013 before T014.
- **US4**: Starts after T003/T004; test T015 before T016–T019.
- **US5**: Starts after Setup; test T020 before T021–T022.
- **US6**: Starts after Setup; T023 before T024.
- **Polish**: Depends on all desired stories.

### Parallel Opportunities

- T001/T002 in Setup.
- US1, US2, US3, US5, and US6 can proceed in parallel after Setup.
- US4 waits for the backend player-kind task but can run alongside the CSS stories afterward.
- Within US2, T009/T010/T011 target different selectors in `global.css`; coordinate edits sequentially if working in one file.
- Polish docs (T025), full commands (T026/T027), visual audit (T028), and cleanup (T029) follow story completion.

### Within Each Story

- Add the failing regression test first where listed.
- Implement the smallest CSS/DTO change that fixes the measured issue.
- Re-run the story's test before moving on.

---

## Parallel Example: User Story 2

```bash
Task: "T008 [US2] Add long-name and 320px regression checks in frontend/tests/e2e/ui-resilience.spec.ts"
Task: "T009 [US2] Harden header layout in frontend/src/styles/global.css"
Task: "T010 [US2] Harden profile layout in frontend/src/styles/global.css"
Task: "T011 [US2] Harden leaderboard rows in frontend/src/styles/global.css"
```

## Parallel Example: User Story 3 and User Story 5

```bash
Task: "T013 [US3] Add filter Apply reachability test in frontend/tests/e2e/filter-panel.spec.ts"
Task: "T020 [US5] Add auth dialog action reachability test in frontend/tests/e2e/auth-dialog-layout.spec.ts"
Task: "T014 [US3] Add popover max-height/scroll in frontend/src/styles/global.css"
Task: "T021 [US5] Fix auth dialog action reachability in frontend/src/features/auth/AuthDialog.tsx"
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US3)

These are the P1 usability blockers: discoverability, no layout overflow, and filter
reachability on small screens.

1. Complete Setup and the player-kind foundation.
2. Add navigation tests and the Leaderboard link.
3. Add responsive regression tests, then fix header/profile/leaderboard/tabs CSS.
4. Add the filter reachability test and popover CSS.
5. Stop and validate P1 stories independently.

### Incremental Delivery

1. P1 navigation + responsive + filters.
2. P2 account/legacy labels and auth dialog reachability.
3. P3 favicon and docs.
4. Full verification and visual re-audit.

---

## Notes

- Do not change the brutalist visual system; use existing CSS variables and Radix wrappers.
- Keep imported-record labels unchanged; only site-local records use `ACCOUNT`/`LEGACY`.
- Do not rewrite legacy rows in the database; derive player kind at read time.
- Tests are included because each finding was measured with a concrete repro.
