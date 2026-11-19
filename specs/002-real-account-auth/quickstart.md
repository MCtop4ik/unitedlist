# Quickstart Validation: Real Account Authentication

**Feature**: `002-real-account-auth`  
**Date**: 2026-11-19

Use this guide to prove the feature end-to-end against the real backend. It validates
registration, sign-in, session persistence, authorization, legacy data, and the existing
public catalog.

## Prerequisites

- Node.js 22+ and npm 10+
- Empty or existing SQLite database at `backend/data/gdul.sqlite`
- No other process on port 3001 or 5173

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

In a second terminal, start the frontend:

```bash
npm run dev
```

Open `http://localhost:5173`.

The migration is additive. If the database already contains guest players, progress, or
completions from the previous delivery, they remain visible after the upgrade.

## API Scenarios

Set a unique email for the run:

```bash
EMAIL="player-$(date +%s)@example.com"
```

### 1. Register and receive a session

```bash
curl -s -X POST http://localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"displayName\":\"QUICKSTART_$(date +%s)\",\"password\":\"correct horse battery\"}"
```

Expected: `201`, a public `data` player without any password field, `account.email`,
`token`, and an `expiresAt` about 30 days ahead.

### 2. Validate the session

```bash
TOKEN="<token from step 1>"
curl -s http://localhost:3001/api/auth/me -H "Authorization: Bearer $TOKEN"
```

Expected: `200`, the same player, the owner's email, and the expiry.

### 3. Write progress and a completion

```bash
curl -s -X POST http://localhost:3001/api/progress \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"levelId":149992717,"percent":91}'

curl -s -X POST http://localhost:3001/api/completions \
  -H "Authorization: Bearer $TOKEN" -H 'Content-Type: application/json' \
  -d '{"levelId":149992717}'
```

Expected: progress returns `200` with the account's `playerId`; the completion returns
`201` the first time and `200` on a repeat. Sending another account's `playerId` in the
body has no effect.

### 4. Writes require a session

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3001/api/progress \
  -H 'Content-Type: application/json' -d '{"levelId":149992717,"percent":50}'

curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3001/api/progress \
  -H "Authorization: Bearer not-a-real-session" \
  -H 'Content-Type: application/json' -d '{"levelId":149992717,"percent":50}'
```

Expected: `401` for both. No record is created or changed. Old guest tokens are also
rejected because guest tokens no longer authorize writes.

### 5. Duplicate protection

Register the same email with surrounding spaces and different casing:

```bash
curl -s -X POST http://localhost:3001/api/auth/register \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"  ${EMAIL^^}  \",\"displayName\":\"OTHER_NAME\",\"password\":\"correct horse battery\"}"
```

Expected: `409 EMAIL_TAKEN`. Reusing an existing display name with different casing
returns `409 DISPLAY_NAME_TAKEN`.

### 6. Invalid credentials are indistinguishable

```bash
curl -s -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d "{\"email\":\"$EMAIL\",\"password\":\"wrong password\"}"

curl -s -X POST http://localhost:3001/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email":"missing@example.com","password":"wrong password"}'
```

Expected: both return `401 INVALID_CREDENTIALS` with the same message and no indication
of whether the email exists.

### 7. Failed-attempt throttling

Perform five failed sign-ins for the same email within 15 minutes, then a sixth. Expected:
the sixth returns `429 RATE_LIMITED` and states when to retry. The counter and block are
in memory and reset when the backend restarts.

### 8. Sign out revokes only the current session

```bash
curl -s -o /dev/null -w '%{http_code}\n' -X POST http://localhost:3001/api/auth/logout \
  -H "Authorization: Bearer $TOKEN"

curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

Expected: logout `204`, then `/auth/me` `401`. A second session created by signing in on
another device still works.

### 9. Public reads and legacy data

```bash
curl -s 'http://localhost:3001/api/levels?perPage=2'
curl -s http://localhost:3001/api/leaderboard
```

Expected: `200` without a token. Existing guest profiles and their completions remain in
the leaderboard and public profile responses, but their `player_tokens` cannot write.
No response includes an email address or password hash.

## UI Scenarios

1. Open `/profile` while signed out. Expected: a signed-out state with **SIGN IN** and
   **CREATE ACCOUNT** actions; no guest creation.
2. Create an account. Expected: the dialog closes, a success toast appears, the header
   shows `PLAYER / <name>`, and the profile loads.
3. Reload the page and restart the browser. Expected: still signed in.
4. Open an incognito window, sign in with the same email and password. Expected: the same
   profile and records appear.
5. Sign out from the header menu. Expected: the header returns to signed out and `/profile`
   shows the signed-out state.
6. Open a level while signed out and choose **RECORD COMPLETION**. Expected: an auth gate
   with sign-in/create-account actions; no record is written.
7. Sign in, record progress, then record a completion. Expected: the best progress is
   preserved, the completion appears once, and the leaderboard updates.
8. Open the completion-status filter while signed out. Expected: copy asks the user to
   sign in, not to create a guest profile.
9. Check keyboard flow: Tab through the auth dialog, switch tabs with arrow keys, submit
   with Enter, close with Escape, and confirm focus returns to the trigger.
10. Check mobile width: the auth dialog, header menu, and signed-out profile remain usable.

## Automated Verification

From the repository root:

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e:backend
npm run test:e2e
```

Expected:

- `typecheck` and `lint` pass with no errors.
- Backend tests cover registration, login, duplicates, throttling, session
  expiry/revocation, unauthorized and cross-account writes, legacy preservation, and the
  additive migration.
- `test:e2e:backend` proves the account flow against the real SQLite backend and confirms
  unauthenticated writes are rejected.
- `test:e2e` proves the same UI flows against the auth-enabled mock, including
  accessibility and mobile checks.

## Cleanup

Remove test data only from a disposable development database:

```bash
rm backend/data/gdul.sqlite backend/data/gdul.sqlite-wal backend/data/gdul.sqlite-shm
npm --workspace backend run migrate
```

Do not delete a database that contains records you intend to keep.
