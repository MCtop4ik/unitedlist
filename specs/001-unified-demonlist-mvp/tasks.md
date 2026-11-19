# Tasks: Production Backend for Unified Demonlist

**Input**: Design documents from `/specs/001-unified-demonlist-mvp/`

**Prerequisites**: `plan.md`, `spec.md`, `research.md`, `data-model.md`, `contracts/api.md`, `quickstart.md`

**Tests**: Contract, integration, refresh-fixture, and final Playwright validation tasks are included because the backend plan requires them.

**Organization**: Tasks are grouped by user story. The frontend task history is archived at `tasks-frontend.md`.

**Backend stack**: Node.js 22 + strict TypeScript + Express + SQLite (`better-sqlite3`, WAL) + Zod + Pino.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: US1, US2, US3, US4
- Every task includes an exact file path

## Phase 1: Setup (Shared Infrastructure)

- [X] T001 Create the backend directory structure from plan.md: `backend/src/{db/migrations,domain,http/{routes,middleware},services,jobs}`, `backend/tests/{contract,integration,fixtures}`, `backend/data`
- [X] T002 Create `backend/package.json` with `express`, `better-sqlite3`, `zod`, `pino`, `pino-http`, `helmet`, `cors`, `express-rate-limit`, Vitest, Supertest, and scripts `dev`, `build`, `typecheck`, `test`, `migrate`, `import:levels`, `refresh`
- [X] T003 [P] Create strict TypeScript config in `backend/tsconfig.json` with `strict: true`, `noUncheckedIndexedAccess: true`, Node 22 types, and `noEmit: true`
- [X] T004 [P] Create Zod-validated environment loading in `backend/src/config.ts` for `DATABASE_PATH`, `PORT`, `FRONTEND_ORIGIN`, and `LOG_LEVEL`
- [X] T005 [P] Configure Vitest and Supertest in `backend/vitest.config.ts` and `backend/tests/setup.ts`
- [X] T006 [P] Create `backend/Dockerfile`, `backend/.dockerignore`, and `.env.example` with a non-root runtime user, health check, and SQLite volume
- [X] T007 [P] Configure ESLint for strict backend TypeScript in `backend/eslint.config.js`

## Phase 2: Foundational (Blocking Prerequisites)

**⚠️ CRITICAL**: No user story work starts until this phase is complete.

- [X] T008 Implement SQLite connection, WAL pragmas, foreign keys, busy timeout, and graceful close in `backend/src/db/database.ts`
- [X] T009 [P] Create the `levels` migration with unique `level_id`, unique `global_rank`, unique `(zone, zone_rank)`, and catalog indexes in `backend/src/db/migrations/001_levels.sql`
- [X] T010 [P] Create `players` and `player_tokens` migrations with unique `token_hash`, hashed-token storage, and cascading deletes in `backend/src/db/migrations/002_players.sql`
- [X] T011 [P] Create `progress` and `completions` migrations with unique `(player_id, level_id)`, percent 1–99, and cascading level/player foreign keys in `backend/src/db/migrations/003_records.sql`
- [X] T012 [P] Create `imported_records`, `source_status`, and `refresh_runs` migrations in `backend/src/db/migrations/004_sources.sql`
- [X] T013 Implement the migration runner and `npm run migrate` in `backend/src/db/migrate.ts`
- [X] T014 Implement the Express app, Helmet, CORS, JSON body limits, Pino request logging, request IDs, 404 handler, and centralized error mapping in `backend/src/app.ts`
- [X] T015 [P] Implement bearer guest-token parsing and SHA-256 verification middleware in `backend/src/http/middleware/auth.ts`
- [X] T016 [P] Define Zod request/query schemas for levels, players, progress, completions, and leaderboard in `backend/src/http/schemas.ts`
- [X] T017 [P] Add `GET /health` and `GET /ready` with SQLite connectivity and migration checks in `backend/src/http/routes/health.ts`
- [X] T018 [P] Add an in-memory SQLite + Supertest test harness in `backend/tests/setup.ts` and `backend/tests/helpers/db.ts`
- [X] T019 Align existing `shared/types.ts` with the production contract, including the player token response fields, in `shared/types.ts`

**Checkpoint**: Database, migrations, HTTP shell, auth primitives, and test harness are ready.

---

## Phase 3: User Story 1 — Browse the unified level catalog (Priority: P1) 🎯 MVP

**Goal**: Serve ALL and zone views, search, filters, sorting, pagination, level details, and combined completions from SQLite.

**Independent Test**: `GET /api/levels` returns 50 ordered levels; zone filters match Pointercrate 1–75/76–150, AREDL, and GDDL; detail and completion endpoints return contract shapes.

### Implementation

- [X] T020 [P] [US1] Implement the level import CLI from `data/levels.json` into SQLite with upserts and zone-priority validation in `backend/src/jobs/import-levels.ts`
- [X] T021 [P] [US1] Implement zone mapping and level query builders in `backend/src/domain/levels.ts`
- [X] T022 [US1] Implement `GET /api/levels` with `zone`, `q`, `difficulty`, `length`, `status`, `playerId`, `sort`, `page`, and `perPage` in `backend/src/http/routes/levels.ts`
- [X] T023 [US1] Enforce server-side pagination (max 100), case-insensitive name/author search, and stable sort order in `backend/src/domain/levels.ts`
- [X] T024 [US1] Implement `GET /api/levels/{levelId}` returning the full `Level` plus zone view and completion counts in `backend/src/http/routes/levels.ts`
- [X] T025 [US1] Implement combined local/imported completions with `recordType`, source, verification status, and pagination in `backend/src/domain/records.ts`
- [X] T026 [US1] Add source labels and `verification_status` to imported completion responses in `backend/src/http/routes/levels.ts`
- [X] T027 [P] [US1] Add catalog query indexes for search, filters, zone order, and completion counts in `backend/src/db/migrations/005_catalog_indexes.sql`
- [X] T028 [P] [US1] Implement the optional thumbnail proxy/cache at `GET /api/thumbnails/{levelId}` in `backend/src/services/thumbnails.ts`
- [X] T029 [US1] Add contract tests for catalog, detail, combined completions, filters, and pagination in `backend/tests/contract/levels.test.ts`

**Checkpoint**: The backend catalog is independently useful and is the MVP.

---

## Phase 4: User Story 2 — Track personal progress and completions (Priority: P2)

**Goal**: Create guest profiles with device tokens, authorize writes, record best progress and idempotent completions, and serve profiles/history.

**Independent Test**: `POST /api/players` returns a token; writes without the token return 401; 87% → 91% → 50% keeps 91%; duplicate completion returns one row.

### Implementation

- [X] T030 [P] [US2] Implement guest profile creation with a 256-bit token, SHA-256 hash storage, and one-time token response in `backend/src/domain/players.ts`
- [X] T031 [P] [US2] Implement player profile queries with points, status, site leaderboard rank, completion count, progress count, and best clear in `backend/src/domain/players.ts`
- [X] T032 [US2] Implement `POST /api/players`, `GET /api/players/{playerId}`, `/completions`, and `/progress` in `backend/src/http/routes/players.ts`
- [X] T033 [US2] Require the guest token on `POST /api/progress` and `POST /api/completions` and derive `playerId` from the token in `backend/src/http/middleware/auth.ts`
- [X] T034 [US2] Implement higher-only progress upserts (integer 1–99) in a transaction in `backend/src/domain/records.ts`
- [X] T035 [US2] Implement idempotent 100% completions in a transaction, returning the existing completion on repeats in `backend/src/domain/records.ts`
- [X] T036 [US2] Validate unknown levels/players, reject invalid bodies, and return user-readable 400/401 errors in `backend/src/http/routes/records.ts`
- [X] T037 [P] [US2] Ensure tokens, request bodies, and secrets are not logged and add write rate limiting in `backend/src/http/middleware/security.ts`
- [X] T038 [US2] Add integration tests for token failures, profile creation, higher-only progress, duplicate completions, and immutable records in `backend/tests/integration/players.test.ts`

**Checkpoint**: Guest identity and write flows work independently against SQLite.

---

## Phase 5: User Story 3 — Rank site guest profiles by completion points (Priority: P3)

**Goal**: Compute top-heavy points and status, produce a deterministic service-wide guest leaderboard, and exclude imported records.

**Independent Test**: A completion of rank 1 adds 5000 points; progress adds zero; imported players never appear; equal points tie by earliest latest completion then player ID.

### Implementation

- [X] T039 [P] [US3] Implement the points curve `max(1, round(5000 / globalRank^0.55))` and status thresholds in `backend/src/domain/ranking.ts`
- [X] T040 [US3] Implement the leaderboard SQL query and window ranking over guest completions in `backend/src/domain/ranking.ts`
- [X] T041 [US3] Implement `GET /api/leaderboard` with pagination and deterministic tie ordering in `backend/src/http/routes/leaderboard.ts`
- [X] T042 [US3] Exclude imported records from all points and leaderboard queries in `backend/src/domain/ranking.ts`
- [X] T043 [US3] Ensure rank changes and refresh operations affect leaderboard results without stored-point reconciliation in `backend/src/domain/ranking.ts`
- [X] T044 [US3] Add contract/integration tests for top-heavy points, zero progress points, service-wide guest entries, ties, and recalculation in `backend/tests/integration/leaderboard.test.ts`

**Checkpoint**: Ranking is correct and independent of imported community data.

---

## Phase 6: User Story 4 — Keep catalog data current and resilient (Priority: P4)

**Goal**: Refresh levels, zone positions, and completion records from all three sources transactionally, remove stale levels, prune orphans, and preserve the last known catalog on failure.

**Independent Test**: A fixture refresh updates positions, removes a removed level, prunes its records, and keeps ranks unique; a failing source rolls back and marks the source stale.

### Implementation

- [X] T045 [P] [US4] Implement Pointercrate level adapter for ranks 1–150 with pagination in `backend/src/services/sources/pointercrate.ts`
- [X] T046 [P] [US4] Implement AREDL level adapter excluding Pointercrate IDs in `backend/src/services/sources/aredl.ts`
- [X] T047 [P] [US4] Implement GDDL level adapter ordered by rating descending in `backend/src/services/sources/gddl.ts`
- [X] T048 [P] [US4] Implement completion adapters for Pointercrate, AREDL, and GDDL with bounded concurrency, exponential backoff, and resumable cursors in `backend/src/services/sources/completions.ts`
- [X] T049 [US4] Implement the transactional refresh service: upsert, remove stale levels, reassign global ranks, prune orphaned progress/completions/imported records, and update source status in `backend/src/services/source-refresh.ts`
- [X] T050 [US4] Implement the refresh CLI and systemd/cron-friendly exit codes in `backend/src/jobs/refresh.ts`
- [X] T051 [US4] Implement stale-source persistence and last-known-catalog behavior in `backend/src/domain/sources.ts` and `backend/src/http/routes/source-status.ts`
- [X] T052 [US4] Record refresh run counts, errors, started/finished timestamps, and rollback outcomes in `backend/src/services/source-refresh.ts`
- [X] T053 [US4] Add fixture-based refresh tests for zone priority, removal, orphan pruning, uniqueness, all-source completions, and rollback in `backend/tests/integration/refresh.test.ts`

**Checkpoint**: The catalog remains current and usable through source outages.

---

## Phase 7: Frontend Integration & Polish

**Purpose**: Connect the existing client, secure operations, and validate the full stack.

- [X] T054 Add `VITE_API_URL` support and guest token storage/refresh handling to `frontend/src/lib/api/client.ts` and `frontend/src/lib/identity/guest.ts`
- [X] T055 Send the bearer token on writes and reopen guest onboarding on 401 in `frontend/src/features/level/LevelDialog.tsx`
- [X] T056 Update leaderboard copy from “local” to “site guest” and keep imported records out of the board in `frontend/src/features/leaderboard/LeaderboardPage.tsx`
- [X] T057 [P] Add Helmet, CORS, per-IP/per-token write rate limiting, and graceful shutdown in `backend/src/app.ts` and `backend/src/server.ts`
- [X] T058 [P] Add Pino structured logging, request IDs, and health/readiness checks in `backend/src/app.ts` and `backend/src/http/routes/health.ts`
- [X] T059 [P] Add migration-on-release, SQLite backup/restore, refresh scheduling, and environment documentation in `backend/README.md`
- [X] T060 Point Playwright at the real backend with a test database in `frontend/playwright.config.ts` and `backend/tests/fixtures/`
- [X] T061 Run backend `typecheck`, `test`, migration/import/refresh smoke tests, and frontend `test:e2e`; fix all failures in `backend/package.json`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Starts immediately.
- **Foundational (Phase 2)**: Depends on Setup; blocks all stories.
- **US1 (Phase 3)**: Starts after Foundational; no story dependency.
- **US2 (Phase 4)**: Starts after Foundational; uses US1 level lookup.
- **US3 (Phase 5)**: Starts after US2; needs profile/completion data.
- **US4 (Phase 6)**: Starts after Foundational; integrates US1 catalog tables.
- **Polish (Phase 7)**: After desired stories.

### User Story Dependencies

- **US1 (P1)**: Independent catalog MVP.
- **US2 (P2)**: Needs US1 levels; otherwise independent.
- **US3 (P3)**: Needs US2 profiles/completions.
- **US4 (P4)**: Independent refresh surface; uses US1 tables.

### Parallel Opportunities

- Setup: T003–T007 after T001–T002.
- Foundational: T009–T012 migrations and T015–T018 middleware/tests in parallel.
- US1: T020, T021, T027, T028 in parallel; route work after.
- US2: T030, T031, T037 in parallel; routes after.
- US3: T039–T042 after US2 data exists; tests after.
- US4: T045–T048 adapters in parallel; T049 after adapters; T053 after T049.
- Polish: T057, T058, T059 in parallel.

---

## Parallel Example: User Story 1

```bash
Task: "Implement level import CLI in backend/src/jobs/import-levels.ts"
Task: "Implement level query builders in backend/src/domain/levels.ts"
Task: "Add catalog indexes in backend/src/db/migrations/005_catalog_indexes.sql"
Task: "Implement thumbnail proxy in backend/src/services/thumbnails.ts"
```

## Parallel Example: User Story 4

```bash
Task: "Implement Pointercrate adapter in backend/src/services/sources/pointercrate.ts"
Task: "Implement AREDL adapter in backend/src/services/sources/aredl.ts"
Task: "Implement GDDL adapter in backend/src/services/sources/gddl.ts"
Task: "Implement completion adapters in backend/src/services/sources/completions.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1)

1. Complete Setup + Foundational.
2. Complete US1 catalog.
3. Import `data/levels.json`, validate contract, demo the read-only catalog.
4. Stop before writes if a minimal public read-only deployment is desired.

### Incremental Delivery

1. Setup + Foundational → database and HTTP shell.
2. US1 → catalog MVP.
3. US2 → guest tokens and writes.
4. US3 → site guest leaderboard.
5. US4 → all-source refresh and resilience.
6. Polish → frontend integration, security, deployment.

## Notes

- Backend owns the SQLite database; the frontend never talks to external sources.
- Guest tokens are device-scoped and not recovery credentials.
- The site leaderboard includes all guest profiles created on the service; imported players are excluded.
- Refresh is transactional and all-source: Pointercrate, AREDL, GDDL.
- Migrate to PostgreSQL before multi-instance writes.
- Frontend task history remains in `tasks-frontend.md`.
