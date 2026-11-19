# Implementation Plan: Production Backend for Unified Demonlist

**Branch**: `001-unified-demonlist-mvp` | **Date**: 2026-11-19 | **Spec**: [spec.md](./spec.md)

**Input**: User request: "надо спланировать бекенд". The frontend-first MVP is already
implemented; the previous frontend plan is archived at `plan-frontend-mvp.md`.

## Summary

Replace the Express + `json-server` mock with a production Node.js/TypeScript backend that
serves the existing frontend contract. The level catalog is kept in memory and refreshed
from live sources with a TTL; SQLite stores only guest profiles, device tokens, progress,
completions, and points inputs.

The frontend contract stays the same except for two additions:

1. `POST /api/players` returns a device token.
2. Write endpoints require `Authorization: Bearer <guest-token>`.

No real sign-in, password, email, or external identity provider is introduced.

## Technical Context

**Language/Version**: Node.js 22+, TypeScript 5.x strict

**Primary Dependencies**: Express 4, Zod, `better-sqlite3`, Pino, Helmet, CORS,
`express-rate-limit`

**Storage**: SQLite 3 in WAL mode at `backend/data/gdul.sqlite` for player data; versioned
SQL migrations; catalog in memory from `data/levels.json` with live TTL refresh

**Testing**: Vitest + Supertest against in-memory SQLite; frontend Playwright suite against
the real backend

**Target Platform**: Linux container; Node.js 22 runtime; SQLite volume

**Project Type**: Web service + existing React client

**Performance Goals**: p95 catalog/detail/leaderboard reads < 2 seconds for 10,000+ levels;
pagination always enforced; no full-catalog response

**Constraints**: Existing `contracts/api.md` response shapes; guest tokens instead of real
auth; imported records read-only; site guest leaderboard only; source refresh is an explicit
operation; strict TypeScript; minimal dependencies

**Scale/Scope**: 10,247 levels (150 Pointercrate, ~1,600 AREDL, ~10,000 GDDL), hundreds of
guest profiles, imported completions for popular levels, one API instance

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **I. Design System Source of Truth**: PASS. Backend does not change visual decisions;
  the existing frontend and `docs/design.md` remain authoritative.
- **II. TypeScript & Minimal Dependencies**: PASS. Node.js + strict TypeScript. Express is
  reused from the mock. SQLite avoids a separate database service. Each dependency is
  justified in `research.md`.
- **III. Radix UI First**: PASS. No frontend control is added or reimplemented by this
  plan; existing Radix wrappers remain.
- **IV. UX, Accessibility & Responsiveness**: PASS. Error, loading, empty, stale, and
  success states are preserved by the contract. Token failures return user-readable errors.
- **V. Modularity, Reuse & Compliance**: PASS. Backend is split into config, DB, domain,
  HTTP, services, and jobs. Shared contract types remain in `shared/types.ts`.

No violations. Complexity Tracking is intentionally empty.

## Project Structure

### Documentation (this feature)

```text
specs/001-unified-demonlist-mvp/
├── plan.md                    # this backend plan
├── plan-frontend-mvp.md       # archived frontend plan
├── research.md                # backend decisions
├── research-frontend.md       # archived frontend research
├── data-model.md              # backend schema
├── data-model-frontend.md     # archived frontend model
├── quickstart.md              # backend runbook
├── quickstart-frontend.md     # archived frontend runbook
├── contracts/
│   ├── api.md                 # current contract (token additions)
│   └── api-frontend.md        # archived mock-era contract
└── spec.md
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── app.ts                 # Express app wiring
│   ├── server.ts              # listen + graceful shutdown
│   ├── config.ts              # env parsing and runtime config
│   ├── db/
│   │   ├── database.ts        # better-sqlite3 connection, WAL, pragmas
│   │   ├── migrate.ts         # migration runner
│   │   └── migrations/        # numbered .sql migrations
│   ├── domain/
│   │   ├── levels.ts          # level queries and zone mapping
│   │   ├── players.ts         # guest profile and token rules
│   │   ├── records.ts         # progress/completion rules
│   │   ├── ranking.ts         # points, status, deterministic ordering
│   │   └── sources.ts         # imported records and source status
│   ├── http/
│   │   ├── routes/            # levels, players, progress, completions, leaderboard, health
│   │   ├── middleware/        # auth, validation, errors, request id
│   │   └── schemas.ts         # Zod request/response schemas
│   ├── services/
│   │   ├── source-refresh.ts  # transaction-safe source refresh
│   │   └── thumbnails.ts      # optional on-disk thumbnail proxy/cache
│   └── jobs/
│       └── refresh.ts         # CLI entrypoint for cron/systemd timer
├── migrations/
├── tests/
│   ├── contract/
│   ├── integration/
│   └── fixtures/
├── Dockerfile
├── package.json
└── tsconfig.json

data/
├── levels.json                # import source for the migration
└── mock-db.json               # development mock; not used by production

frontend/                      # existing client; token header + API base URL changes only
shared/types.ts                # shared contract types
```

**Structure Decision**: One Node.js service with an embedded SQLite database. This avoids a
separate database service while keeping transactional writes, indexes, and reproducible
tests. If the project later needs multi-instance writes, the domain layer can be moved to
PostgreSQL without changing the HTTP contract.

## API and Identity

The public contract remains [contracts/api.md](./contracts/api.md). Backend changes:

- `POST /api/players` creates a profile and returns `data` plus a `token`.
- The token is random 256-bit, returned once; only its SHA-256 hash is stored.
- `POST /api/progress` and `POST /api/completions` require
  `Authorization: Bearer <token>` and derive `playerId` from the token, ignoring any
  client-supplied `playerId`.
- `GET` endpoints remain public.
- Invalid or missing tokens return `401 TOKEN_REQUIRED` / `401 TOKEN_INVALID`.
- Tokens are device-scoped and have no recovery. This preserves the no-sign-in MVP while
  preventing one client from writing as another guest.

Imported records never receive write routes. Administrative correction is a guarded CLI
(`backend/src/jobs/correct-record.ts --confirm`) and is not exposed as an HTTP route.

## Storage Design

Tables:

- `levels` — source-of-truth catalog and ranks.
- `players` — guest profile identity.
- `player_tokens` — hashed bearer tokens, one active token per player.
- `progress` — one row per player/level, best percent 1–99.
- `completions` — one row per player/level at 100%.
- `imported_records` — read-only source records with source/verification status.
- `source_status` — source health, last successful refresh, stale flag.
- `refresh_runs` — refresh audit history.

Constraints and indexes:

- unique `levels.level_id`, `levels.global_rank`, `(levels.zone, levels.zone_rank)`;
- unique `(progress.player_id, progress.level_id)`;
- unique `(completions.player_id, completions.level_id)`;
- foreign keys with `ON DELETE CASCADE` for player data;
- indexes for catalog filters, zone ordering, completion lookup, and leaderboard points;
- refresh deletes or marks levels absent from a successful source snapshot and prunes
  orphaned imported/progress/completion rows in the same transaction.

Points and status are derived from completed levels, not stored as the only truth. The
leaderboard is a SQL query with a window rank ordered by points, then earliest latest
completion, then player ID.

## Source Refresh

`backend/src/jobs/refresh.ts` is invoked by an external scheduler (cron/systemd timer):

1. Fetch Pointercrate 1–150, AREDL, and GDDL in bounded batches.
2. Start a SQLite transaction.
3. Upsert levels with zone priority Pointercrate > AREDL > GDDL.
4. Remove or mark levels absent from the successful snapshot.
5. Reassign `global_rank` by zone priority and zone rank.
6. Prune records that reference removed levels.
7. Fetch completion records from Pointercrate, AREDL, and GDDL using per-level adapters
   with bounded concurrency, rate-limit backoff, and resumable cursors.
8. Update `source_status` and `refresh_runs`, then commit.

On any fetch/parse failure the transaction rolls back and `source_status` marks the source
stale; the last known catalog remains served.

## Security and Operations

- Helmet security headers; CORS limited to `FRONTEND_ORIGIN`.
- Zod validation on all request bodies/query parameters; 100-row pagination cap.
- Rate limit writes per IP and per token.
- Pino structured logs with request IDs; no tokens or request bodies with secrets logged.
- `GET /health` checks process; `GET /ready` checks SQLite.
- Graceful shutdown closes the HTTP server and database.
- SQLite backup by copying after `VACUUM INTO` or using Litestream-compatible snapshots.
- Docker image runs as non-root, with a persistent volume for the SQLite file.

## Implementation Phases

### Phase A — Foundation

- Create `backend/` Express + strict TypeScript project.
- Add config, Zod env validation, database connection, WAL pragmas, migration runner.
- Add `levels`, `players`, `player_tokens`, `progress`, `completions`, `imported_records`,
  `source_status`, `refresh_runs` migrations and indexes.
- Add health/readiness endpoints and centralized error handling.

### Phase B — Catalog read API

- Implement `GET /api/levels`, `/levels/:id`, and `/levels/:id/completions` with filters,
  search, sort, pagination, and source labels.
- Import `data/levels.json` into the database.
- Add contract tests matching the existing frontend responses.

### Phase C — Guest identity, writes, ranking

- Create guest profiles and hashed tokens.
- Add bearer middleware to progress/completion writes.
- Enforce higher-only progress and idempotent completions in transactions.
- Implement profile, player history/progress, points/status, and leaderboard queries.
- Add integration tests for token failures, duplicate writes, and recalculation.

### Phase D — Source refresh and resilience

- Implement the transactional refresh job with Pointercrate, AREDL, and GDDL completion adapters and a CLI entrypoint.
- Add stale-source behavior, refresh run audit, stale pruning, and imported-record merge.
- Add fixture-based refresh tests for zone priority, removals, duplicates, and rollback.
- Add an optional thumbnail proxy/cache.

### Phase E — Frontend integration

- Add `VITE_API_URL` support and guest token storage to the existing client.
- Update leaderboard copy from “local” to “site guest” so it matches the service-wide ranking.
- Send `Authorization` on writes and handle `401` by reopening guest onboarding.
- Point Playwright at the real backend; keep the mock suite for offline development.

### Phase F — Deployment and validation

- Multi-stage Dockerfile, non-root user, persistent volume, health checks.
- Run migrations on startup or as a release step.
- Add backup/restore and refresh scheduling documentation.
- Run contract, integration, migration, and Playwright suites.

## Risks and Mitigations

| Risk | Mitigation |
|---|---|
| SQLite write contention | WAL, short transactions, single writer, indexes; migrate to Postgres if needed |
| Guest impersonation | Bearer token hash; writes ignore client-supplied playerId |
| Refresh partially applies | One transaction per refresh; rollback on any source failure |
| Orphaned records after removal | Prune in the same transaction; validate after refresh |
| Thumbnail dependency | Placeholder plus optional backend cache/proxy |
| Contract drift | Shared types and contract tests against the frontend |
| Token unrecoverable | Explicit device-only onboarding message; future auth migration path |

## Complexity Tracking

No constitution violations. SQLite is chosen over a separate database service to keep the
first production deployment operable by one person while preserving a clean migration path.
