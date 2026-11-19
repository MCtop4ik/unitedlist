# Tasks: Unified Demonlist MVP

**Input**: Design documents from `/specs/001-unified-demonlist-mvp/`

**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/api.md, quickstart.md

**Tests**: Validation tests are included because `plan.md` defines Vitest/React Testing Library/Playwright and `quickstart.md` requires them. They are not TDD gates.

**Organization**: Tasks are grouped by user story so each story can be implemented, tested, and demonstrated independently.

**Design reference**: Penpot page `GDUnitedList · UX/UI`, boards `DS / Design System` through `09 / Interaction Map`.

**Implementation note**: Some planned single-purpose files were consolidated into feature components (`CatalogPage`, `LevelDialog`, `ProfilePage`) to keep the first slice cohesive. All described behaviors remain implemented.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3, US4
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Initialize the frontend-first monorepo and tooling.

- [X] T001 Create the monorepo directory structure from plan.md: `frontend/src/{app,components/{ui,layout,shared},features/{catalog,level,profile,leaderboard,onboarding},lib/{api,identity,ranking,url-state},styles,test}`, `frontend/tests/{integration,e2e}`, `mock/routes`, `data`, `scripts`, `shared`
- [X] T002 Create `frontend/package.json` with React 19, Vite, Radix UI, Vitest, React Testing Library, Playwright, `json-server`, `express`, and `tsx` (dev-only mock tooling), plus scripts `dev`, `build`, `typecheck`, `lint`, `test`, `test:e2e`, `seed:mock`, `dev:mock`
- [X] T003 [P] Create strict TypeScript config in `frontend/tsconfig.json` with `strict: true`, `noUncheckedIndexedAccess: true`, and bundler resolution
- [X] T004 [P] Configure Vite and the `/api` proxy to `http://localhost:3001` in `frontend/vite.config.ts`
- [X] T005 [P] Configure ESLint and Prettier in `frontend/eslint.config.js` and `frontend/.prettierrc`
- [X] T006 [P] Configure Vitest, jsdom, and RTL setup in `frontend/src/test/setup.ts` and `frontend/vitest.config.ts`
- [X] T007 [P] Configure Playwright for `http://localhost:5173` in `frontend/playwright.config.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared contracts, tokens, primitives, data provider, and app shell required by every story.

**⚠️ CRITICAL**: No user story work starts until this phase is complete.

- [X] T008 [P] Define `Level`, `Zone`, `Player`, `Progress`, `LocalCompletion`, `ImportedCompletion`, `Completion`, `Status`, and paginated response types from data-model.md and contracts/api.md in `shared/types.ts`
- [X] T009 [P] Map `docs/design.md` to CSS custom properties: cream `#F4F1EA`, ink `#111111`, acid `#D8FF3E`, type scale, radii 4/8/16, spacing 16/32/64 in `frontend/src/styles/tokens.css`
- [X] T010 [P] Add the global reset, focus-visible ring, selection color, and responsive base rules in `frontend/src/styles/global.css`
- [X] T011 [P] Create Radix wrappers for Tabs, Dialog, AlertDialog, DropdownMenu, Popover, HoverCard, Tooltip, Progress, ScrollArea, Toast, Checkbox, and Slider in `frontend/src/components/ui/`
- [X] T012 [P] Implement the shared app chrome: logo/header, nav, guest chip, footer, and page shell in `frontend/src/components/layout/AppHeader.tsx`, `AppFooter.tsx`, and `PageShell.tsx`
- [X] T013 [P] Implement the typed fetch wrapper with error normalization and base URL handling in `frontend/src/lib/api/client.ts`
- [X] T014 [P] Implement the `json-server`-backed mock service with an Express/TypeScript entrypoint and computed routes for levels, completions, progress, players, and leaderboard in `mock/server.ts` and `mock/routes/`
- [X] T015 [P] Implement deterministic mock seeding for 10,000+ levels, 150 Pointercrate levels, AREDL exclusions, GDDL remainder, imported records, local players, and leaderboard in `scripts/seed-mock.mjs`
- [X] T016 [P] Create the app shell, route table, and providers in `frontend/src/app/App.tsx`, `frontend/src/app/routes.tsx`, and `frontend/src/app/providers.tsx`
- [X] T017 [P] Implement catalog URL-state parsing and serialization for zone, query, filters, sort, and page in `frontend/src/lib/url-state/catalog.ts`
- [X] T018 [P] Implement shared loading, empty, error, and toast surfaces in `frontend/src/components/shared/LoadingState.tsx`, `EmptyState.tsx`, `ErrorState.tsx`, and `ToastViewport.tsx`

**Checkpoint**: Contract types, tokens, mock data, Radix primitives, and app shell are ready.

---

## Phase 3: User Story 1 — Browse the unified level catalog (Priority: P1) 🎯 MVP

**Goal**: A visitor browses ALL and zone views, searches, filters, sorts, paginates, opens level details, and sees completions with source labels.

**Independent Test**: Open `/catalog`, switch ALL/POINTERCRATE/AREDL/GDDL, search `GRIEF`, filter, open the level dialog, and confirm imported records show their source and no level repeats across zones.

### Implementation

- [X] T019 [P] [US1] Define zone order and membership rules — ALL, Pointercrate main 1–75, Pointercrate extended 76–150, AREDL outside top 150, GDDL remainder — in `frontend/src/features/catalog/zone-config.ts`
- [X] T020 [P] [US1] Implement catalog query functions for `GET /api/levels` (including `playerId` when `status` is set), `GET /api/levels/{levelId}`, and `GET /api/levels/{levelId}/completions` against contracts/api.md in `frontend/src/features/catalog/api.ts`
- [X] T021 [P] [US1] Implement the catalog data hook with loading/error/empty states, `playerId` propagation for status filtering, and page reset on query/filter changes in `frontend/src/features/catalog/useCatalogQuery.ts`
- [X] T022 [P] [US1] Build the catalog page composition in `frontend/src/features/catalog/CatalogPage.tsx`
- [X] T023 [US1] Implement accessible Radix Tabs for ALL, POINTERCRATE, AREDL, and GDDL in `frontend/src/features/catalog/ZoneTabs.tsx`
- [X] T024 [P] [US1] Implement the debounced search field for name/author with `/` and `⌘K` focus shortcuts in `frontend/src/features/catalog/SearchField.tsx`
- [X] T025 [P] [US1] Implement the Radix Popover filter panel using Radix Checkbox controls for zone, difficulty, length, and completion status with Apply/Reset in `frontend/src/features/catalog/FilterPopover.tsx`
- [X] T026 [P] [US1] Implement the Radix DropdownMenu sort control for global, zone, name, and completion count in `frontend/src/features/catalog/SortMenu.tsx`
- [X] T027 [US1] Implement the catalog table/column layout and responsive mobile list in `frontend/src/features/catalog/LevelTable.tsx`
- [X] T028 [US1] Implement level rows with rank, thumbnail, name, author, zone pill, difficulty, length, completion count, and row-open action in `frontend/src/features/catalog/LevelRow.tsx`
- [X] T029 [US1] Implement pagination with page count, URL updates, loading skeleton, and scroll-to-top in `frontend/src/features/catalog/Pagination.tsx`
- [X] T030 [US1] Implement the level detail Radix Dialog with preview, global rank, zone rank, difficulty, author, and actions in `frontend/src/features/level/LevelDialog.tsx`
- [X] T031 [US1] Implement the combined completion list with source-labelled imported records, verification status, and local player entries in `frontend/src/features/level/CompletionList.tsx`
- [X] T032 [P] [US1] Implement the shared `SourceBadge` for PC, AREDL, GDDL, and LOCAL in `frontend/src/components/shared/SourceBadge.tsx`
- [X] T033 [P] [US1] Implement lazy thumbnails with an ink/cream placeholder fallback in `frontend/src/components/shared/LevelThumb.tsx`
- [X] T034 [US1] Wire URL restoration, empty states, and focus restoration on dialog close in `frontend/src/features/catalog/CatalogPage.tsx` and `frontend/src/features/level/LevelDialog.tsx`
- [X] T035 [US1] Add integration coverage for zone switching, search, filters, pagination, level dialog, source labels, duplicate prevention, and `playerId` being required when the status filter is set in `frontend/tests/integration/catalog.test.tsx`

**Checkpoint**: The catalog is independently usable and is the MVP.

---

## Phase 4: User Story 2 — Track personal progress and completions (Priority: P2)

**Goal**: A player creates a device-local guest profile, records progress below 100%, confirms completions, and sees the records on the profile and level completion list.

**Independent Test**: Clear site data, create `PLAYER_ONE`, record 87% then 91% on GRIEF, record 100%, repeat the completion, and confirm one best progress plus one completion; imported records stay read-only.

### Implementation

- [X] T036 [P] [US2] Implement guest profile persistence with a generated ID and device-only scope in `frontend/src/lib/identity/guest.ts`
- [X] T037 [P] [US2] Implement player/profile API functions for create, profile, completions, and progress in `frontend/src/features/profile/api.ts`
- [X] T038 [US2] Implement the reusable Radix Dialog profile gate for write actions without a profile in `frontend/src/features/onboarding/ProfileGateDialog.tsx`
- [X] T039 [US2] Implement guest profile creation with trimmed display name constrained to 2–32 characters in `frontend/src/features/onboarding/GuestProfileDialog.tsx`
- [X] T040 [US2] Build the profile page with overview, completions, progress, points, status, rank, device-only notice, and the explicit lost-profile message in `frontend/src/features/profile/ProfilePage.tsx`
- [X] T041 [US2] Implement the Radix AlertDialog completion confirmation with `+points` preview and irreversible-action warning in `frontend/src/features/level/RecordCompletionDialog.tsx`
- [X] T042 [US2] Implement the progress dialog with a 1–99 integer input and Radix Slider, enforcing the higher-only best-value rule in `frontend/src/features/level/UpdateProgressDialog.tsx`
- [X] T043 [US2] Implement the player records hook that updates profile and level completion-list caches and emits a `records:changed` event through `frontend/src/lib/events/records.ts` in `frontend/src/features/profile/usePlayerRecords.ts`
- [X] T044 [US2] Implement profile stat cards and derived status display in `frontend/src/features/profile/ProfileStats.tsx`
- [X] T045 [US2] Implement the profile completions list with local source label, date, and points in `frontend/src/features/profile/ProfileCompletions.tsx`
- [X] T046 [US2] Implement the profile progress list with best-percent bars and continue actions in `frontend/src/features/profile/ProfileProgress.tsx`
- [X] T047 [US2] Enforce immutable player records — no lowering or deleting progress/completions — and add the guarded internal correction command with an explicit `--confirm` flag in `frontend/src/features/level/completion-rules.ts` and `scripts/correct-records.mjs`; no admin UI in this delivery
- [X] T048 [US2] Implement the empty profile state and device-loss state with a create-profile action and durable-accounts explanation in `frontend/src/features/onboarding/ProfileEmptyState.tsx`
- [X] T049 [US2] Make profile and guest onboarding screens responsive with the mobile bottom-nav layout in `frontend/src/features/profile/ProfilePage.tsx` and `frontend/src/features/onboarding/GuestProfileDialog.tsx`
- [X] T050 [US2] Add integration coverage for profile gate, creation, progress best-value, idempotent completion, immutable records, and device loss messaging in `frontend/tests/integration/profile.test.tsx`

**Checkpoint**: Profile and write flows work against the mock API independently of the leaderboard.

---

## Phase 5: User Story 3 — Rank local players by completion points (Priority: P3)

**Goal**: Local completions award top-heavy points, derive status, and determine a deterministic local leaderboard that excludes imported community players.

**Independent Test**: Complete a top-ranked and a low-ranked level with two local profiles; verify top-heavy points, zero points for sub-100% progress, imported records excluded, and stable tie ordering.

### Implementation

- [X] T051 [P] [US3] Implement `max(1, round(5000 / globalRank^0.55))`, status thresholds (ROOKIE 0–999, PLAYER 1,000–4,999, SKILLED 5,000–14,999, EXTREME 15,000–29,999, LEGEND 30,000+), and deterministic tie ordering in `frontend/src/lib/ranking/points.ts`
- [X] T052 [P] [US3] Implement the leaderboard API client for `GET /api/leaderboard` in `frontend/src/features/leaderboard/api.ts`
- [X] T053 [P] [US3] Implement the computed mock leaderboard route including only local profiles and excluding imported records in `mock/routes/leaderboard.ts`
- [X] T054 [US3] Build the local leaderboard page with explanation of the imported-record exclusion in `frontend/src/features/leaderboard/LeaderboardPage.tsx`
- [X] T055 [US3] Implement leaderboard rows with rank, player, status, points, completions, and trend in `frontend/src/features/leaderboard/LeaderboardTable.tsx`
- [X] T056 [US3] Implement the pinned current-player position row and empty/loading states in `frontend/src/features/leaderboard/PinnedPositionRow.tsx`
- [X] T057 [P] [US3] Implement the shared `StatusBadge` for ROOKIE through LEGEND in `frontend/src/components/shared/StatusBadge.tsx`
- [X] T058 [US3] Implement the leaderboard data hook that subscribes to `records:changed` and refreshes after completion writes in `frontend/src/features/leaderboard/useLeaderboard.ts`
- [X] T059 [US3] Add integration coverage for top-heavy points, zero progress points, local-only entries, tie order, and recalculation after a completion, global-position change, or points-rule change in `frontend/tests/integration/leaderboard.test.tsx`

**Checkpoint**: Local ranking is correct and independent of imported community data.

---

## Phase 6: User Story 4 — Keep catalog data current and resilient (Priority: P4)

**Goal**: Source refreshes update levels and positions without duplicates, and source failures keep the last known catalog browsable with an explicit stale state and retry.

**Independent Test**: Refresh after a position change, verify the new order; toggle a source failure, verify the last catalog stays usable with a stale badge; retry and verify recovery.

### Implementation

- [X] T060 [P] [US4] Implement source status and refresh types/functions in `frontend/src/lib/api/source-status.ts`
- [X] T061 [P] [US4] Implement mock source-status and failure-toggle routes in `mock/routes/source-status.ts`
- [X] T062 [US4] Implement the source status banner with stale badge, source name, and last-updated time in `frontend/src/features/catalog/SourceStatusBanner.tsx`
- [X] T063 [US4] Implement retry behavior that keeps last known results and clears the stale badge on success in `frontend/src/features/catalog/useSourceRetry.ts`
- [X] T064 [US4] Implement explicit refresh scripts for levels, zone positions, and imported completions, plus ranking recalculation when global ranks or the points rule change; preserve Pointercrate > AREDL > GDDL priority and prevent duplicate `levelId` values in `scripts/refresh-levels.mjs`, `scripts/refresh-completions.mjs`, and `scripts/recalculate-rankings.mjs`
- [X] T065 [US4] Add validation for unique `levelId`, unique `globalRank`, unique `(zone, zoneRank)`, and zone priority in `data/levels.schema.json` and `scripts/validate-levels.mjs`
- [X] T066 [US4] Add integration coverage for refresh ordering, duplicate prevention, stale catalog, and retry recovery in `frontend/tests/integration/source-failure.test.tsx`

**Checkpoint**: The catalog remains usable during source outages and refreshes without duplicates.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Accessibility, responsiveness, performance, documentation, and final compliance.

- [X] T067 [P] Update `docs/ARCHITECTURE.md` interaction map and API notes to match the implemented Penpot flows
- [X] T068 [P] Validate and update the runbook in `specs/001-unified-demonlist-mvp/quickstart.md` with final commands and seeded data counts
- [X] T069 Run a keyboard and screen-reader audit across catalog, dialog, profile, and leaderboard using the Radix wrappers in `frontend/src/components/ui/`
- [X] T070 Polish responsive layouts at 390 px, 768 px, and 1440 px in `frontend/src/styles/global.css`
- [X] T071 Lazy-load thumbnails and avoid full-catalog rendering in `frontend/src/features/catalog/LevelTable.tsx` and `frontend/src/components/shared/LevelThumb.tsx`
- [X] T072 Add Playwright coverage for catalog search, zone switch, level dialog, guest creation, completion, and leaderboard in `frontend/tests/e2e/catalog-profile.spec.ts`
- [X] T073 Add Playwright coverage for mobile navigation, bottom sheet close, and keyboard escape/focus return in `frontend/tests/e2e/mobile-accessibility.spec.ts`
- [X] T074 Verify visual compliance with `docs/design.md`, the `DS / Design System` board, and Radix usage in `frontend/src/styles/tokens.css` and `frontend/src/components/ui/`
- [X] T075 Add and run `typecheck`, `lint`, `test`, and `test:e2e`, including SC-002/SC-003 performance validation in `frontend/tests/e2e/performance.spec.ts`, from `frontend/package.json`; fix all failures before completion

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately.
- **Foundational (Phase 2)**: Depends on Setup and blocks all user stories.
- **US1 (Phase 3)**: Starts after Foundational; no story dependency.
- **US2 (Phase 4)**: Starts after Foundational. Profile page is independent; level write flows integrate with US1's `LevelDialog`.
- **US3 (Phase 5)**: Starts after Foundational with seeded data; full recalculation integration depends on US2 writes.
- **US4 (Phase 6)**: Starts after Foundational; uses US1 catalog seams.
- **Polish (Phase 7)**: Depends on the desired user stories.

### User Story Dependencies

- **US1 (P1)**: Independent. Complete first for the MVP.
- **US2 (P2)**: Independent profile surface; write actions reuse US1 level dialog.
- **US3 (P3)**: Independent with seeded leaderboard; live updates integrate with US2.
- **US4 (P4)**: Independent resilience surface; integrates with US1 catalog.

US2 emits `records:changed`; US3 consumes it. US2 MUST NOT import or depend on US3.

### Within Each Story

- Types and API functions before hooks.
- Hooks before page composition.
- Shared primitives before feature integration.
- Test/validation tasks after the story implementation.

### Parallel Opportunities

- Setup tasks T003–T007 can run in parallel after T001–T002.
- Foundational tasks T008–T018 are mostly parallel because they touch different files.
- US1: T019, T020, T024, T025, T026, T032, T033 can run in parallel; table/dialog tasks follow.
- US2: T036 and T037 can run in parallel; dialogs and profile lists follow.
- US3: T051, T052, T053, T057 can run in parallel; page/table tasks follow.
- US4: T060 and T061 can run in parallel; banner/retry follow.
- Polish test tasks T072 and T073 can run in parallel.

---

## Parallel Example: User Story 1

```bash
# Start independent catalog building blocks together:
Task: "Define zone order in frontend/src/features/catalog/zone-config.ts"
Task: "Implement catalog API functions in frontend/src/features/catalog/api.ts"
Task: "Implement SearchField in frontend/src/features/catalog/SearchField.tsx"
Task: "Implement FilterPopover in frontend/src/features/catalog/FilterPopover.tsx"
Task: "Implement SortMenu in frontend/src/features/catalog/SortMenu.tsx"
Task: "Implement SourceBadge in frontend/src/components/shared/SourceBadge.tsx"
Task: "Implement LevelThumb in frontend/src/components/shared/LevelThumb.tsx"
```

## Parallel Example: User Story 2

```bash
Task: "Implement guest identity in frontend/src/lib/identity/guest.ts"
Task: "Implement profile API in frontend/src/features/profile/api.ts"
```

## Parallel Example: User Story 3

```bash
Task: "Implement points/status rules in frontend/src/lib/ranking/points.ts"
Task: "Implement leaderboard API in frontend/src/features/leaderboard/api.ts"
Task: "Implement mock leaderboard route in mock/routes/leaderboard.ts"
Task: "Implement StatusBadge in frontend/src/components/shared/StatusBadge.tsx"
```

## Parallel Example: User Story 4

```bash
Task: "Implement source status client in frontend/src/lib/api/source-status.ts"
Task: "Implement mock source status route in mock/routes/source-status.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup.
2. Complete Phase 2: Foundational.
3. Complete Phase 3: User Story 1.
4. Validate `/catalog`, zones, search, filters, level dialog, completion sources, and URL sharing.
5. Stop and demo the catalog MVP.

### Incremental Delivery

1. Setup + Foundational → foundation ready.
2. US1 → catalog MVP.
3. US2 → guest profile and records.
4. US3 → local leaderboard.
5. US4 → refresh and source resilience.
6. Polish → accessibility, responsive, e2e, compliance.

### Parallel Team Strategy

- Developer A: US1 catalog.
- Developer B: US2 profile and writes after shared dialog seams exist.
- Developer C: US3 ranking and leaderboard with seeded data.
- Developer D: US4 refresh/resilience and test fixtures.

## Notes

- All visual work follows `docs/design.md` and Penpot board `09 / Interaction Map`.
- Imported records are always read-only, source-labelled, and excluded from points.
- Player records cannot be lowered or deleted; admin correction is internal-only in this delivery and no admin route or dialog ships.
- `json-server` is development-only; the production backend implements the same contract.
- Commit after each task or logical task group; stop at story checkpoints for independent validation.
- Definition of Done for every task: follow `docs/design.md`, use the relevant Radix primitive, verify keyboard/focus behavior, and cover loading/empty/error feedback where applicable.


---

## Phase 8: Convergence

- [X] T076 CRITICAL: Add strict Node/mock TypeScript typechecking for `mock/server.ts`, `shared/types.ts`, and `scripts/` via `tsconfig.node.json` and a `typecheck:node` script; fix all errors per Constitution II (partial)
- [X] T077 CRITICAL: Route all component Radix imports through the shared `frontend/src/components/ui/index.ts` wrappers and reuse them per Constitution V (partial)
- [X] T078 Add a verification video link or embed to the level dialog when `videoUrl` is present per FR-007 (missing)
- [X] T079 Fetch the active player's progress and completion for the opened level and replace the hardcoded `YOUR BEST / 87%` with real state per FR-012/FR-015 (contradicts)
- [X] T080 Show local player status alongside points in the level completion list per FR-008 and US2/AC5 (partial)
- [X] T081 Gate or disable the completion-status filter when no guest profile exists, with a clear create-profile action, instead of issuing a request that returns `PLAYER_ID_REQUIRED` per FR-005 (partial)
- [X] T082 Extend refresh scripts to update Pointercrate (positions 1–150), AREDL, GDDL, and imported completions while enforcing zone priority and duplicate prevention per FR-023/FR-024/FR-025 (partial)
- [X] T083 Enforce the 2-second SC-002 threshold and add a zone-switch SC-003 performance check in `frontend/tests/e2e/performance.spec.ts` (partial)
- [X] T084 Add automated regression coverage for URL restore (SC-009), ranking recalculation (SC-006), and duplicate prevention (SC-004) in `frontend/tests/integration/` (missing)
- [X] T085 Strengthen `scripts/validate-levels.mjs` to verify Pointercrate 1–150 ownership, AREDL exclusion of top 150, and GDDL remainder per T065/FR-024 (partial)
- [X] T086 Derive leaderboard page count from the API response and implement the pinned current-player row when the player is outside the visible page per T056/FR-021 (partial)
- [X] T087 Add keyboard end-to-end coverage for zone tabs, filters, dialogs, and focus return, and give Pointercrate subtabs roving-tabindex semantics per SC-008/FR-029 (partial)
- [X] T088 Review and either consume `data/leaderboard.json` in the mock/recalculation flow or remove the generated artifact per plan: recalculate-rankings decision (unrequested)


---

## Phase 9: Convergence

- [X] T089 CRITICAL: Convert `scripts/seed-mock.mjs`, `refresh-levels.mjs`, `refresh-completions.mjs`, `recalculate-rankings.mjs`, `validate-levels.mjs`, and `correct-records.mjs` to strict TypeScript (`.ts`), run them with `tsx`, include `scripts/**/*.ts` in `tsconfig.node.json`, and update `package.json` scripts per Constitution II (partial)
- [X] T090 Preserve existing AREDL authors during refresh instead of overwriting them with `unknown` when `publisher_name` is absent; resolve the publisher name or keep the stored value per FR-023/FR-025 (partial)
- [X] T091 Include `frontend/tests` and `frontend/playwright.config.ts` in a strict TypeScript check so test code is governed by the same typing rules per Constitution II (partial)
- [X] T092 Add keyboard end-to-end coverage for zone tabs, Pointercrate subtabs, filter popover, sort menu, and dialog focus return per SC-008/FR-029 (partial)
- [X] T093 Add executable regression coverage for `recalculate-rankings` and browser URL restore, not only pure serialization and points helpers, per SC-006/SC-009/T084 (partial)


---

## Phase 10: Convergence

- [X] T094 Remove or mark levels that disappear from a refreshed source so stale entries no longer remain in zone views or ALL, while preserving Pointercrate > AREDL > GDDL priority and uniqueness per FR-023/FR-024 and the removed-level edge case (partial)
- [X] T095 Extend imported completion refresh to AREDL and GDDL records, or explicitly document the narrowed source scope and update the architecture/contracts accordingly per FR-023 (missing)


---

## Phase 11: Convergence

- [X] T096 Prune local completions, progress, and imported records for levels removed by refresh, and make mock/recalculate points ignore unknown level IDs instead of applying a fallback rank, so no orphaned records affect points per SC-006/FR-022/FR-023 (partial)
- [X] T097 Add a mobile navigation menu or bottom nav with CATALOG, LEADERBOARD, and PROFILE because the current mobile CSS hides the desktop nav and leaves leaderboard/profile unreachable per FR-031/FR-029 (partial)
- [X] T098 Keep completion date and score/status visible or accessible in the mobile level dialog instead of hiding them in the responsive completion row per FR-008/FR-031 (partial)


---

## Phase 12: Convergence

- [X] T099 Add integration coverage for profile gate, profile creation, higher-only progress, idempotent completion, immutable records, and device-loss messaging per T050/FR-011/FR-014 (partial)
- [X] T100 Add leaderboard integration coverage for top-heavy points, zero points for progress, local-only entries, deterministic ties, and recalculation consistency per T059/FR-018/FR-021 (partial)
- [X] T101 Add source-failure integration coverage for stale catalog browsing, retry recovery, and imported-record preservation per T066/FR-026/SC-007 (partial)


---

## Phase 13: Convergence

- [X] T102 Extend the profile-flow e2e to assert that a lower progress value is ignored, a higher value replaces the stored best, and a duplicate completion request remains idempotent per T099/FR-014 (partial)
- [X] T103 Extend the leaderboard integration test to assert points and rank change consistently after a local completion is added, not only the zero-progress and tie-order cases per T100/FR-022/SC-006 (partial)
- [X] T104 Extend the source-failure e2e to assert that imported completion records remain visible and source-labelled while the source is unavailable per T101/FR-008/SC-007 (partial)


---

## Phase 14: Convergence

- [X] T105 Run and record an automated accessibility audit for the catalog, level dialog, profile, and leaderboard, fix serious/critical findings, and correct the table row/cell semantics where interactive rows are currently exposed as `role="row"` buttons per T069/SC-008/FR-029/FR-030 (partial)


---

## Phase 15: Convergence

- [ ] T106 Move the catalog body inside the active `Tabs.Content` panel (or replace the zone Tabs with a non-panel toggle control) so tab triggers control real content, and record a manual screen-reader spot check per SC-008/FR-030 (partial)
