# Phase 0 Research — Production Backend

## 1. Database: SQLite instead of PostgreSQL

**Decision**: Use SQLite 3 through `better-sqlite3` in WAL mode.

**Rationale**: 10,000+ levels and hundreds of guest profiles fit comfortably in SQLite.
A single file gives transactional writes, indexes, simple backups, and no separate database
service. The domain layer keeps SQL isolated so a later PostgreSQL migration does not
change the HTTP contract.

**Alternatives considered**:

- PostgreSQL — operationally heavier than the MVP needs; deferred until multi-instance
  writes or advanced analytics are required.
- File-backed JSON (`json-server`) — no transactionality, constraints, or safe concurrent
  writes; acceptable only for the mock.
- In-memory store — loses all data on restart.

## 2. HTTP framework: Express 4

**Decision**: Express 4 with Zod validation, Helmet, CORS, Pino, and rate limiting.

**Rationale**: The mock already uses Express, so the team keeps one HTTP mental model.
Express is mature, supports typed middleware, and is sufficient for the read-heavy API.

**Alternatives considered**:

- Fastify — excellent performance/schema support, but introduces a second framework with
  no measured need.
- Native `node:http` — too much routing, validation, and middleware work.

## 3. Guest identity: device bearer tokens

**Decision**: On profile creation, issue a random 256-bit token, store only its SHA-256
hash, and require `Authorization: Bearer <token>` for writes. The server derives the player
from the token.

**Rationale**: The spec defers real authentication, but accepting `playerId` from the client
would let anyone write as another guest. A device token preserves no-sign-in UX while
closing that impersonation hole. There is no recovery, which matches the documented
device-only boundary.

**Alternatives considered**:

- No token — rejected: trivial impersonation.
- Full accounts — out of scope for this delivery.
- Signed stateless JWT without DB state — rejected: revocation and token-hash audit are
  simpler with a database row.

## 4. Points and ranking stay derived

**Decision**: Keep the top-heavy power curve:

```text
points(globalRank) = max(1, round(5000 / globalRank^0.55))
```

Status thresholds remain ROOKIE 0–999, PLAYER 1,000–4,999, SKILLED 5,000–14,999,
EXTREME 15,000–29,999, LEGEND 30,000+. Compute points and status from completions in SQL
or in the domain layer; do not store them as the only truth.

**Rationale**: A rank change or points-rule change recalculates consistently without a
separate reconciliation job. SQLite window functions provide deterministic leaderboard
positions.

**Alternatives considered**:

- Stored points/rank columns — faster reads but creates reconciliation risk; revisit only
  if profiling shows a bottleneck.

## 5. Source refresh: explicit transactional job

**Decision**: Run `backend/src/jobs/refresh.ts` from cron/systemd, not from request
handlers. Each refresh is one transaction: fetch, validate, upsert, remove stale levels,
reassign global ranks, prune orphaned records, merge imported completions, update source
status.

**Rationale**: Refresh is a background operation with external failure modes. A transaction
prevents partial catalogs. External scheduling avoids a long-running worker dependency.

**Alternatives considered**:

- In-process timer — works for one instance but hides operational failures.
- Per-source incremental commits — risks a half-refreshed catalog.

## 6. Imported completion scope

**Decision**: Automatically import completion records from all three sources. Pointercrate
uses its paginated records endpoint; AREDL and GDDL use per-level record endpoints with
bounded concurrency, exponential backoff, and resumable cursors.

**Rationale**: The product should show current completions from every supported list.
Per-level adapters need more requests, so refresh runs in a background job with rate-limit
handling and transaction-safe checkpoints rather than blocking HTTP requests.

## 7. Thumbnails

**Decision**: Return source thumbnail URLs and add an optional backend proxy/cache at
`/api/thumbnails/:levelId` with on-disk caching.

**Rationale**: Keeps the frontend simple and protects against hotlink/rate-limit failures.
The proxy is optional for the first deployment.

## 8. Testing

**Decision**: Vitest + Supertest against an in-memory SQLite database for contract,
integration, and refresh fixtures. Keep Playwright for the real frontend + backend flow.

**Rationale**: In-memory SQLite is fast and exercises the real SQL. Playwright proves the
token flow and contract against the actual server.

## 9. Deployment

**Decision**: Multi-stage Docker image, non-root user, persistent volume for SQLite,
readiness/liveness endpoints, migrations on release or startup, and documented backup via
`VACUUM INTO`.

**Rationale**: One container plus one volume is the smallest operable production shape.
