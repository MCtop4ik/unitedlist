# GD United List

Unified demonlist for Geometry Dash: Pointercrate, AREDL, and GDDL in one catalog, with
durable player accounts, progress, completions, and a site-wide leaderboard.

- Frontend: React + Vite + Radix UI
- Production backend: Node.js + Express + SQLite (WAL)
- Mock backend: Express + `json-server` for offline frontend work

## Requirements

- Node.js 22+
- npm 10+

No external database or Docker is required for local development.

## Install

From the repository root:

```bash
npm install
```

This installs the frontend, backend, mock, and shared tooling through npm workspaces.

## Option 1 — Full stack with the real backend

### 1. Prepare the player database

```bash
cd backend
npm run migrate
```

The level catalog is loaded into memory from `data/levels.json` and refreshed live from
Pointercrate and AREDL with a 10-minute TTL. GDDL is restored from the official backup CSV
(`data/GDDL backup - GDDL.csv`) because its live API returns at most 25 levels per page.
Player data stays in SQLite.

### 2. Start the backend

```bash
cd backend
npm run dev
```

Backend: `http://localhost:3001`

### 3. Start the frontend

In another terminal, from the repository root:

```bash
npm run dev
```

Frontend: `http://localhost:5173`

Vite proxies `/api` to `http://localhost:3001`.

### Accounts and sessions

Players create an account with an email, display name, and password. The backend stores
the account and a verifier in SQLite and returns an opaque session token. The frontend
keeps only the session token and public player snapshot in `localStorage` under
`gdul.session` and sends `Authorization: Bearer <token>` for progress and completion
writes. Sessions last 30 days from last use, work across devices, and are revoked on
sign-out.

Auth endpoints:

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`

`POST /api/players` no longer exists. Previously created guest profiles and their records
remain visible as read-only legacy data, but guest tokens cannot write.

## Option 2 — Frontend with the mock API

Use this for UI work without the production backend.

```bash
npm run seed:mock
npm run dev:mock
```

In another terminal:

```bash
npm run dev
```

`seed:mock` generates only `data/mock-db.json`. It does not overwrite the real catalog in
`data/levels.json`. The mock listens on `http://localhost:3001` and the frontend runs on
`http://localhost:5173`.

Do not run the mock and the real backend on port 3001 at the same time.

If you see `EADDRINUSE: address already in use :::3001`, stop the process using the port:

```bash
lsof -ti:3001 | xargs -r kill
```

## Environment

Backend variables (see `backend/.env.example`):

| Variable | Default |
|---|---|
| `DATABASE_PATH` | `./data/gdul.sqlite` |
| `PORT` | `3001` |
| `FRONTEND_ORIGIN` | `http://localhost:5173` |
| `LOG_LEVEL` | `info` |
| `CATALOG_TTL_MS` | `600000` |

If the backend runs elsewhere, point the frontend at it by changing the Vite proxy in
`frontend/vite.config.ts`.

## Data and refresh

Canonical snapshot: `data/levels.json`. At runtime the backend keeps the catalog in memory
and refreshes Pointercrate/AREDL live every `CATALOG_TTL_MS`; GDDL comes from the official
backup CSV imported into the snapshot.

Backend refresh:

```bash
cd backend
npm run refresh
```

The refresh fetches levels from Pointercrate and AREDL and prints the resulting catalog
size. The running API uses the same source adapters with in-memory TTL caching; a source
failure keeps the last known catalog.

Snapshot utilities:

```bash
npm run restore:gddl       # rebuild GDDL from data/GDDL backup - GDDL.csv (no network)
npm run snapshot:sources   # live Pointercrate + AREDL, GDDL from the backup CSV
npm run validate:levels
npm run recalculate
npm run refresh:levels     # same sources as snapshot:sources
npm run refresh:completions
npm run seed:mock
```

`data/snapshot-meta.json` records the snapshot timestamp and per-source counts. The current
snapshot uses live Pointercrate and AREDL data plus the official GDDL backup.

Pointercrate completions are not taken from the seed data: opening a Pointercrate level asks
the backend to fetch that level's approved 100% records from the Pointercrate API in real
time. The result is cached for a few seconds to avoid duplicate calls from the same dialog.

Admin correction is CLI-only:

```bash
npm run correct:records -- --player <id> --level <levelId> --confirm
```

## Tests and quality checks

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

End-to-end frontend tests against the mock:

```bash
npm run test:e2e
```

This starts the mock and frontend automatically. Stop the real backend first if it is using
port 3001.

End-to-end frontend test against the real backend with a temporary SQLite database:

```bash
npm run test:e2e:backend
```

## Project layout

```text
frontend/    React application
backend/     Node.js/Express/SQLite API
mock/        Development mock API
scripts/     Seeding, refresh, validation, ranking utilities
data/        Canonical level data and generated mock database
shared/      Shared TypeScript contract types
docs/        PRD, architecture, design system, accessibility audit
specs/       Spec Kit feature specification, plan, tasks, and contracts
```

## Documentation

- `docs/PRD.md` — product scope and goals
- `docs/ARCHITECTURE.md` — zones, API, refresh, interaction map
- `docs/design.md` — visual tokens and approved font stacks
- `docs/ACCESSIBILITY.md` — accessibility audit and fixes

## Deploy notes

The backend runs as a single SQLite-backed instance. Use one writer, a persistent volume,
and a cron/systemd timer for `npm run refresh`. See `backend/README.md` for migrations,
backup, restore, Docker, and admin correction details.
