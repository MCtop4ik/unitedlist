# Tasks: Remove Points and Leaderboard

**Input**: Design documents from `/specs/004-remove-points-leaderboard/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/public-api.md`, `quickstart.md`

**Tests**: Included because the feature must prove both removal (no points/rank/leaderboard)
and preservation (records/auth/catalog still work). Add the absence/preservation checks
before or alongside the corresponding UI changes.

**Organization**: Shared-contract and backend removals are foundational. User stories then
finish the profile, completion-list, leaderboard, cleanup, and preservation work.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependency on an incomplete task)
- **[Story]**: `US1`–`US5` in user-story phases only
- Every task includes an exact file path

## Path Conventions

- Backend: `backend/src/`, `backend/tests/`
- Frontend: `frontend/src/`, `frontend/tests/`
- Shared: `shared/types.ts`
- Mock/scripts/docs: `mock/`, `scripts/`, `docs/`, `README.md`

---

## Phase 1: Setup (Shared Contract)

**Purpose**: Remove points/rank/status from the public type contract. This blocks all
backend and frontend work.

- [X] T001 Remove `Status`, `LeaderboardEntry`, `Player.points`, `Player.status`, `Player.leaderboardRank`, `LocalCompletion.playerStatus`, and `LocalCompletion.playerPoints` from `shared/types.ts`; keep `PlayerKind`, `VerificationStatus`, `completionCount`, `progressCount`, and `bestCompletion`.

---

## Phase 2: Foundational (Blocking Removals)

**Purpose**: Remove calculations, routes, mock behavior, and dead modules so the project
can compile and run without points/rank/leaderboard.

- [X] T002 Update `backend/src/domain/players.ts` to build the profile without `rankPlayers`; return only `id`, `displayName`, `createdAt`, `completionCount`, `progressCount`, and `bestCompletion`.
- [X] T003 [P] Update `backend/src/domain/records.ts` to remove the `rankPlayers` import and `playerStatus`/`playerPoints` from local completion responses; keep `playerKind`, completion data, and imported records.
- [X] T004 [P] Delete `backend/src/domain/ranking.ts`, `backend/src/http/routes/leaderboard.ts`, and `backend/tests/integration/leaderboard.test.ts`; remove the leaderboard route registration from `backend/src/app.ts`.
- [X] T005 [P] Delete `frontend/src/lib/ranking/points.ts`, `frontend/src/lib/ranking/points.test.ts`, `frontend/tests/integration/ranking.test.ts`, `scripts/recalculate-rankings.ts`, and `frontend/tests/integration/recalc-script.test.ts`; remove the `recalculate` script from `package.json`.
- [X] T006 [P] Update `mock/server.ts`: remove points/status/rank helpers, `playerDto` points/status/rank fields, local completion points/status fields, and `GET /api/leaderboard`; keep auth, sessions, playerKind, progress, and completions.
- [X] T007 [P] Remove the leaderboard type import and `api.leaderboard()` method from `frontend/src/lib/api/client.ts`.
- [X] T008 [P] Delete `frontend/src/features/leaderboard/LeaderboardPage.tsx`; remove its route from `frontend/src/app/App.tsx`; remove desktop/mobile leaderboard entries from `frontend/src/components/layout/AppChrome.tsx`; delete `frontend/tests/e2e/leaderboard.spec.ts` and remove leaderboard expectations from `frontend/tests/e2e/a11y.spec.ts`, `frontend/tests/e2e/navigation.spec.ts`, `frontend/tests/e2e/mobile-accessibility.spec.ts`, and `frontend/tests/e2e/player-labels.spec.ts`.

**Checkpoint**: The project compiles without points/rank/leaderboard modules; UI story work can proceed.

---

## Phase 3: User Story 1 - Points-free account profile (Priority: P1) 🎯 MVP

**Goal**: Profiles show identity and activity without points, site rank, or skill badge.

**Independent Test**: Sign in, record activity, open `/profile`; counts/progress/best clear appear, points/rank/status do not, and the stats layout has no gap.

### Tests for User Story 1

- [X] T009 [P] [US1] Add `backend/tests/integration/points-removal.test.ts` asserting player/auth DTOs omit `points`, `status`, and `leaderboardRank`, while `completionCount`, `progressCount`, and `bestCompletion` remain.
- [X] T010 [P] [US1] Add `frontend/tests/e2e/points-absence.spec.ts` asserting the signed-in profile has no points, site rank, skill badge, `0 PTS`, or `unranked` text and still shows completions/progress/best clear.

### Implementation for User Story 1

- [X] T011 [US1] Update `frontend/src/features/profile/ProfilePage.tsx`: remove points and site-rank cards, remove `playerPoints`/`playerStatus` from completion rows, keep completion/progress/best-clear stats, and make the reduced stat grid responsive.

---

## Phase 4: User Story 2 - Completion lists without points/status (Priority: P1)

**Goal**: Level and profile completion lists keep identity/source labels but drop points and
points-derived skill status.

**Independent Test**: Open a level with account, legacy, and imported completions; all
entries remain correctly labeled, with no points or skill status.

### Tests for User Story 2

- [X] T012 [P] [US2] Extend `frontend/tests/e2e/points-absence.spec.ts` to assert level completion entries contain no points or player skill status while `ACCOUNT`/`LEGACY` and imported verification labels remain.

### Implementation for User Story 2

- [X] T013 [US2] Update `frontend/src/features/level/LevelDialog.tsx`: remove `record.playerStatus`, "no points" toast copy, and "PROGRESS AWARDS NO POINTS" helper; keep player-kind and source badges.

---

## Phase 5: User Story 3 - Remove the leaderboard (Priority: P1)

**Goal**: No leaderboard entry, page, or content is reachable.

**Independent Test**: Inspect desktop/mobile navigation and open `/leaderboard`; no
leaderboard content appears.

### Tests for User Story 3

- [X] T014 [P] [US3] Update `frontend/tests/e2e/navigation.spec.ts` to assert no Leaderboard link/menu item and that `/leaderboard` renders the catalog (or not-found fallback), never leaderboard content.
- [X] T015 [P] [US3] Add a backend check to `backend/tests/integration/points-removal.test.ts` asserting `GET /api/leaderboard` returns `404 NOT_FOUND`.

---

## Phase 6: User Story 4 - Remove remaining points mechanics (Priority: P2)

**Goal**: No dead points/rank mechanics, copy, or styling remain.

**Independent Test**: Search the project and UI for points/rank/leaderboard remnants; none
are executable or visible.

### Implementation for User Story 4

- [X] T016 [P] [US4] Remove dead leaderboard/points CSS from `frontend/src/styles/global.css` (`.leaderboard-notice`, `.lb-row`, `.lb-rank`, `.lb-name`, `.lb-points`, and related responsive rules).
- [X] T017 [P] [US4] Remove remaining points/status/rank copy or references in `frontend/src/features/auth/AuthDialog.tsx`, `frontend/src/features/profile/ProfilePage.tsx`, `frontend/src/features/level/LevelDialog.tsx`, `frontend/src/features/leaderboard/LeaderboardPage.tsx`, `backend/src/domain/players.ts`, `backend/src/domain/records.ts`, and `mock/server.ts`.
- [X] T018 [US4] Remove any remaining points-based sort/verification in `frontend/src/features/catalog/CatalogPage.tsx` and `backend/src/services/live-catalog.ts`; keep global/zone/name/completions sorting.

---

## Phase 7: User Story 5 - Preserve accounts, records, and catalog (Priority: P2)

**Goal**: Records and auth remain intact while points/leaderboard disappear.

**Independent Test**: An existing account still signs in and sees the same completions and
progress; catalog browsing/filtering still works.

### Tests for User Story 5

- [X] T019 [P] [US5] Add `backend/tests/integration/records-preserved.test.ts` proving completions/progress remain after profile/completion DTO removal and auth/session flows still work.

### Implementation for User Story 5

- [X] T020 [P] [US5] Update `README.md`, `backend/README.md`, `docs/ARCHITECTURE.md`, `docs/PRD.md`, and `docs/ACCESSIBILITY.md` to remove points/rank/leaderboard claims and describe the preserved activity data.
- [X] T021 [US5] Verify auth, profile, progress/completion writes, catalog search/filter/sort, and imported records still work; fix any regressions found in `backend/src` or `frontend/src`.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Full verification and cleanup.

- [X] T022 Run `npm run typecheck` and `npm run lint` from `package.json`; fix all failures.
- [X] T023 Run `npm test` from `package.json`; fix all failures.
- [X] T024 Run `npm run test:e2e` and `npm run test:e2e:backend` from `package.json`; fix all failures.
- [X] T025 Re-run the visual audit at 1440×900, 390×844, and 320×568; confirm no points/rank/status placeholders and no empty stat-card gaps in `frontend/src`.
- [X] T026 [P] Clean up unused imports, dead leaderboard/ranking files, and stale points copy across `frontend/src`, `backend/src`, `shared`, `mock`, `scripts`; keep behavior unchanged.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup**: T001 blocks all other tasks.
- **Foundational**: T002–T008 depend on T001. T002/T003 must precede T004. T005–T008 can follow once their imports are removed.
- **US1**: Depends on T001/T002; T009/T010 before T011.
- **US2**: Depends on T001/T003; T012 before T013.
- **US3**: Depends on T004/T008; T014/T015 after removals.
- **US4**: Depends on foundational removals; T016/T017/T018 can run in parallel after T008.
- **US5**: Depends on T002/T003; T019 can run after DTOs, T020 after implementation, T021 after all stories.
- **Polish**: Depends on all desired stories.

### User Story Dependencies

- **US1 (P1)**: Profile DTO and UI.
- **US2 (P1)**: Completion DTO and level UI.
- **US3 (P1)**: Navigation/route/API removal and proof.
- **US4 (P2)**: Cleanup of mechanics and dead styles.
- **US5 (P2)**: Preservation and docs.

### Parallel Opportunities

- T002 and T003 can run in parallel after T001.
- T005, T006, T007, and T008 touch different areas and can run in parallel after the
  shared/backend contract is ready.
- T009 and T010 (profile tests) are parallel; T012 and T013 are sequential.
- T014/T015 are parallel.
- T016/T017/T018 touch different files and can run in parallel.
- T019 and T020 are parallel once DTOs are removed.

### Within Each Story

- Add the absence/preservation check first where listed.
- Keep record and account behavior unchanged.
- Re-run the story check before moving on.

---

## Parallel Example: Foundational Removals

```bash
Task: "T002 Update backend profile DTO in backend/src/domain/players.ts"
Task: "T003 Update backend completion DTO in backend/src/domain/records.ts"
Task: "T005 Remove points/ranking modules and recalculation tooling"
Task: "T006 Update mock server in mock/server.ts"
Task: "T007 Update frontend API client in frontend/src/lib/api/client.ts"
Task: "T008 Remove leaderboard page/route/nav and e2e expectations"
```

## Parallel Example: P1 Stories

```bash
Task: "T009 Add backend profile DTO absence test in backend/tests/integration/points-removal.test.ts"
Task: "T010 Add profile absence e2e in frontend/tests/e2e/points-absence.spec.ts"
Task: "T014 Add leaderboard absence e2e in frontend/tests/e2e/navigation.spec.ts"
Task: "T015 Add leaderboard 404 check in backend/tests/integration/points-removal.test.ts"
```

---

## Implementation Strategy

### MVP First (US1 + US2 + US3)

All three P1 stories are required for a coherent removal: profile, completion lists, and
leaderboard.

1. Complete T001 and the foundational removals T002–T008.
2. Add profile absence tests and update the profile; validate US1.
3. Add completion absence test and update the level dialog; validate US2.
4. Add leaderboard absence tests; validate US3.
5. Stop and run P1 checks.

### Incremental Delivery

1. Shared contract + backend/mock removals.
2. P1 profile/completions/leaderboard.
3. P2 cleanup and preservation.
4. Docs, full tests, visual audit.

---

## Notes

- Do not delete or rewrite existing account, completion, progress, imported-record, or
  catalog rows; points/rank are derived and can simply stop being computed.
- Keep `PlayerKind` and imported `VerificationStatus`; they are not points-derived.
- Keep non-points catalog sorting (`global`, `zone`, `name`, `completions`).
- The old `/leaderboard` address must fall through to the catalog or not-found fallback.
- Remove dead code rather than leaving no-op points functions.
