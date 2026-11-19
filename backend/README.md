# GD United List Backend

Node.js 22 + strict TypeScript + Express + SQLite (WAL).

## Run

```bash
cd backend
cp .env.example .env
npm install
npm run migrate
npm run dev
```

Environment:

- `DATABASE_PATH` — SQLite file, default `./data/gdul.sqlite`
- `PORT` — default `3001`
- `FRONTEND_ORIGIN` — CORS origin, default `http://localhost:5173`
- `LOG_LEVEL` — Pino level
- `CATALOG_TTL_MS` — live catalog TTL, default `600000` (10 minutes)

## Refresh

```bash
npm run refresh
```

The running API keeps the level catalog in memory and refreshes Pointercrate/AREDL every
`CATALOG_TTL_MS`. GDDL comes from the official backup CSV imported into
`data/levels.json`; its live adapter paginates at 25 levels per page, but runtime does not
query it. Pointercrate completions are fetched on demand for the opened level through
`/api/v1/records/` (approved 100% records) and cached for a few seconds. SQLite stores
accounts, sessions, players, progress, and completions.

`npm run refresh` forces an immediate live refresh and prints the resulting level count.

## Accounts and sessions

- `accounts` is a 1:1 extension of `players` with normalized email/display-name keys and a
  scrypt password verifier.
- `account_sessions` stores SHA-256 token hashes, expiry, last use, and revocation.
- Sessions expire after 30 days without use and are extended on successful use.
- Auth endpoints: `POST /api/auth/register`, `POST /api/auth/login`,
  `POST /api/auth/logout`, `GET /api/auth/me`.
- Progress and completion writes require an account session. Guest tokens no longer
  authorize writes, and `POST /api/players` is removed.
- Auth requests are limited to 20/minute/IP. Sign-in is blocked for 15 minutes after five
  failures in 15 minutes, keyed by normalized email plus IP. The failure counters are
  in-memory, so the limit is per process; keep one backend instance while SQLite is the
  store.
- `Authorization` and `Cookie` headers are redacted from logs. Public responses never
  include email addresses or password verifiers.
- Existing guest players and records remain readable as legacy data; they are not
  converted into accounts.

## Test

```bash
npm run typecheck
npm run lint
npm test
```

Integration tests use in-memory SQLite. The frontend Playwright suite uses the development
mock; backend contract tests use Supertest.

## Backup and restore

```bash
sqlite3 data/gdul.sqlite "VACUUM INTO 'data/backup.sqlite'"
# restore: stop the service, replace data/gdul.sqlite with backup.sqlite, start
```

Keep one writer instance while SQLite is the store. Move to PostgreSQL before running
multiple write instances.

## Docker

Build from the repository root:

```bash
docker build -f backend/Dockerfile -t gd-united-list-backend .
docker run -p 3001:3001 -v gdul-data:/app/backend/data gd-united-list-backend
```

Run migrations and the initial level import as a release step or one-off container.

## Admin correction

```bash
npm run correct-record -- --player <id> --level <levelId> --confirm
```
