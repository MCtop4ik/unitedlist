# Quickstart Validation: Remove Points and Leaderboard

**Feature**: `004-remove-points-leaderboard`  
**Date**: 2026-11-19

Use this guide to prove that points, rank, status, and the leaderboard are gone while
accounts and activity records still work.

## Prerequisites

- Node.js 22+
- Existing development database at `backend/data/gdul.sqlite`
- No other process on ports 3001 and 5173

## Setup

From the repository root:

```bash
npm install
npm --workspace backend run migrate
```

Start the real backend:

```bash
npm --workspace backend run dev
```

In a second terminal:

```bash
npm run dev
```

Open `http://localhost:5173`.

## Account and Profile

1. Sign in or create an account.
2. Record progress on one level and a completion on another.
3. Open `/profile`.

Expected:

- Display name, member date, completion count, progress count, and best clear are visible.
- No points value, score, site rank, leaderboard position, or skill badge appears.
- No `0 PTS`, `unranked`, or empty points/rank cards appear.
- The stats layout has no empty gap where points/rank used to be.
- Completions and progress remain listed.

## Level Completion List

1. Open a level with local and, if available, imported completions.
2. Inspect the completion list.

Expected:

- Account and legacy local records remain labeled `ACCOUNT` / `LEGACY`.
- Imported records keep their source and verification labels.
- No player points or points-derived skill status appears.
- Progress still shows the player's best percentage and still awards no points language.

## Leaderboard Removal

1. Inspect the desktop primary navigation.
2. Open the mobile menu at a phone width.
3. Open `http://localhost:5173/leaderboard` directly.

Expected:

- No Leaderboard link in the desktop nav.
- No Leaderboard item in the mobile menu.
- The old address does not show a leaderboard; the catalog (or a not-found fallback) is
  shown instead.

## API Checks

Use an existing account session token or register a temporary account:

```bash
EMAIL="points-check-$(date +%s)@example.com"
curl -s -X POST http://localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"displayName\":\"NO_POINTS_$(date +%s)\",\"password\":\"correct horse battery\"}"
```

Expected registration/login response: the `data` player contains `id`, `displayName`,
`createdAt`, `completionCount`, `progressCount`, and `bestCompletion`, but no `points`,
`status`, or `leaderboardRank`.

```bash
TOKEN="<token>"
curl -s -X POST http://localhost:3001/api/progress \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"levelId":149992717,"percent":91}'
curl -s -X POST http://localhost:3001/api/completions \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"levelId":149992717}'
curl -s http://localhost:3001/api/players/<player-id>/completions
```

Expected: progress and completion still work; local completion entries contain
`playerKind`, but not `playerPoints` or `playerStatus`.

```bash
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3001/api/leaderboard
```

Expected: `404`.

## Data Preservation

Before the change, note an existing account's completion and progress counts. After the
change:

- The same counts remain.
- Existing completions and progress are still returned.
- Sign-in and session validation still work.
- Catalog levels, search, filters, and non-points sorting still work.

## Automated Verification

From the repository root:

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run test:e2e:backend
```

Expected:

- Typecheck and lint pass.
- Backend tests confirm no points/status/rank in profile/completion DTOs, records still
  save, and the leaderboard route is absent.
- Frontend/e2e tests confirm no leaderboard nav or page, no points/rank/status in profile
  and level views, and the old URL does not render a leaderboard.
- Existing auth, catalog, accessibility, and mobile checks pass.
