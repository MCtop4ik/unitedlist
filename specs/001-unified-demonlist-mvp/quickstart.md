# Quickstart — Production Backend

## Prerequisites

- Node.js 22+
- npm 10+
- The existing frontend dependencies installed at the repository root

## Setup

```bash
mkdir -p backend/data
cd backend
npm install
```

Environment:

```bash
DATABASE_PATH=./data/gdul.sqlite
PORT=3001
FRONTEND_ORIGIN=http://localhost:5173
LOG_LEVEL=info
```

## Migrate and import

```bash
npm run migrate
```

The API loads the catalog from `data/levels.json` into memory, then refreshes Pointercrate
and AREDL live every `CATALOG_TTL_MS`. SQLite stores only player data.

## Run

```bash
npm run dev
```

API: `http://localhost:3001`.

Frontend:

```bash
cd ..
VITE_API_URL=http://localhost:3001 npm run dev
```

## Refresh sources

```bash
cd backend
npm run refresh
```

Run this to force an immediate live catalog refresh. A source failure keeps the last known
in-memory catalog.

## Tests

```bash
cd backend
npm run typecheck
npm test
```

Integration tests use an in-memory SQLite database and Supertest. Frontend contract tests:

```bash
cd ..
npm run test:e2e
```

## Validation scenarios

### Catalog

1. `GET /api/levels?zone=all&page=1&perPage=50` returns 50 levels ordered by global rank.
2. `zone=pointercrate-main` returns only ranks 1–75; `pointercrate-extended` only 76–150.
3. Search `q=grief`, filter by difficulty/length, and paginate without duplicates.
4. `GET /api/levels/149992717` returns the full level shape.

### Guest profile and writes

1. `POST /api/players` returns `data` and `token`.
2. Write without the token → `401`.
3. Write with another player's token/playerId → the server uses the token's player.
4. `POST /api/progress` at 87%, then 91%, then 50% → stored best remains 91%.
5. `POST /api/completions` twice → one completion row.
6. `GET /api/leaderboard` includes guest profiles created on the service only; imported players are excluded.

### Source failure

1. Make one source unreachable in the refresh fixture.
2. Run refresh → transaction rolls back; `source_status.stale=true`.
3. `GET /api/levels` still returns the last known catalog.
4. Restore the source and refresh → stale clears.

### Refresh integrity

1. Remove a level from the source fixture and refresh.
2. The level disappears from its zone and ALL.
3. Its local/imported records are pruned.
4. `global_rank`, `(zone, zone_rank)`, and `level_id` remain unique.

## Operational notes

- SQLite runs in WAL mode; keep one writer.
- Back up with `VACUUM INTO 'backup.sqlite'` or a filesystem snapshot.
- The API must run as a single instance while SQLite is the store.
- Migrate to PostgreSQL before running multiple write instances.
