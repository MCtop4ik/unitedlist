# Phase 1 Data Model: Real Account Authentication

**Feature**: `002-real-account-auth`  
**Date**: 2026-11-19

## Overview

The existing SQLite schema keeps `players` as the public identity used by progress,
completions, ranking, profiles, and the leaderboard. This feature adds a 1:1 `accounts`
extension for credentials and a 1:many `account_sessions` table for sign-in sessions.
Legacy guest players simply have no `accounts` row and are never modified.

```text
players (existing)
  1 ──── 0..1 accounts
  1 ──── 0..N account_sessions
  1 ──── 0..N progress        (existing)
  1 ──── 0..N completions     (existing)
  1 ──── 0..N player_tokens   (existing legacy guest tokens)

accounts (new)
  1 ──── 1 player             (FK accounts.player_id)
  1 ──── 0..N account_sessions
```

## New Tables

### `accounts`

One row per durable account. The player row owns all public records; the account row
owns credentials and normalized uniqueness keys.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `player_id` | TEXT | PRIMARY KEY, FK `players(id)` ON DELETE CASCADE | 1:1 link to the public player |
| `email` | TEXT | NOT NULL | Trimmed original email; owner-visible only |
| `email_normalized` | TEXT | NOT NULL, UNIQUE | Trim + NFKC + lowercase; used for sign-in and uniqueness |
| `display_name_key` | TEXT | NOT NULL, UNIQUE | Trim + NFKC + lowercase display name; uniqueness only among accounts |
| `password_hash` | TEXT | NOT NULL | Versioned scrypt verifier, never returned |
| `created_at` | TEXT | NOT NULL | ISO-8601 |

### `account_sessions`

One row per signed-in device. The primary key is the SHA-256 hash of the bearer token,
so a database leak does not expose usable session credentials.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| `token_hash` | TEXT | PRIMARY KEY | SHA-256 hex of the opaque session token |
| `player_id` | TEXT | NOT NULL, FK `accounts(player_id)` ON DELETE CASCADE | Session owner |
| `created_at` | TEXT | NOT NULL | ISO-8601 |
| `expires_at` | TEXT | NOT NULL | ISO-8601; extended on successful use |
| `last_used_at` | TEXT | NULL | Last successful authentication |
| `revoked_at` | TEXT | NULL | Set by sign-out; non-null sessions are rejected |

Index:

- `idx_account_sessions_player ON account_sessions(player_id)`

## Migration

`backend/src/db/migrations/007_accounts.sql`:

```sql
CREATE TABLE accounts (
  player_id TEXT PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  email_normalized TEXT NOT NULL UNIQUE,
  display_name_key TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE account_sessions (
  token_hash TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES accounts(player_id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_used_at TEXT,
  revoked_at TEXT
);

CREATE INDEX idx_account_sessions_player ON account_sessions(player_id);
```

The migration is additive: it creates new tables and one index, does not alter `players`,
`player_tokens`, `progress`, `completions`, or catalog tables, and preserves all existing
rows. Rolling back drops only the two new tables; account player rows and their records
remain as legacy players.

## Existing Entities (unchanged)

- **`players`**: `id`, `display_name`, `created_at`. Public identity used by profiles,
  leaderboard, progress, and completions.
- **`player_tokens`**: Legacy guest device tokens. No longer accepted for writes; retained
  so old data and foreign keys are not disturbed.
- **`progress`**: `id`, `player_id`, `level_id`, `percent` (1–99), `updated_at`; unique per
  player and level.
- **`completions`**: `id`, `player_id`, `level_id`, `completed_at`, `video_url`; unique per
  player and level.
- **`levels`**, **`imported_records`**, **`source_status`**, **`refresh_runs`**: unchanged
  catalog/import data.

## Validation Rules

Derived from the functional requirements:

| Field | Rule | Error code |
|-------|------|------------|
| `email` | Valid email format, trimmed, at most 254 characters; normalized for uniqueness and lookup | `VALIDATION_ERROR` |
| `password` | 8–128 characters, not only whitespace; never trimmed | `VALIDATION_ERROR` |
| `displayName` | Trimmed, 2–32 characters; unique among accounts ignoring case and whitespace | `VALIDATION_ERROR` / `DISPLAY_NAME_TAKEN` |
| Duplicate email | Same normalized email as an existing account | `EMAIL_TAKEN` |
| Sign-in credentials | Unknown email or wrong password returns the same message | `INVALID_CREDENTIALS` |
| Session token | Required for writes; must be unexpired and unrevoked | `TOKEN_REQUIRED` / `TOKEN_INVALID` |
| Login throttle | 5 failures per normalized email + IP in 15 minutes blocks for 15 minutes | `RATE_LIMITED` |

Normalization for email and display-name keys:

1. Trim leading/trailing whitespace.
2. Apply Unicode NFKC normalization.
3. Lowercase with `toLocaleLowerCase('en-US')`.

## State Transitions

### Account

```text
[visitor] --register (valid, unique)--> [account active]
[account active] --(no delete/rename in this delivery)--> [account active]
```

### Session

```text
[issued] --authenticated request--> [active, expiresAt = now + 30d]
[active] --30 days without use--> [expired]  (rejected)
[active] --POST /api/auth/logout--> [revoked] (rejected)
[active] --valid use--> [active, expiresAt extended by 30d]
```

### Legacy guest player

```text
[guest player + records] --migration--> [guest player + records, read-only]
```

No guest token can move a legacy player into the account state, and no new guest player
rows are created by the application.

## DTOs and Invariants

- **Public `Player`** keeps its existing shape: `id`, `displayName`, `points`, `status`,
  `createdAt`, `leaderboardRank`, `completionCount`, `progressCount`, `bestCompletion`.
  It never contains email, password hash, or session data.
- **`AccountSession`** (register/login response): `{ data: Player, account: { email },
  token, expiresAt }`. The owner sees their own email; public reads never do.
- **`AuthMe`** (`GET /api/auth/me`): `{ data: { player: Player, account: { email } },
  expiresAt }`.
- **Ownership invariant**: Every progress/completion write uses `req.playerId` derived
  from the session; a `playerId` supplied in a request body is ignored or rejected.
- **Cardinality invariant**: An account has exactly one player; a player has zero or one
  account. Sessions belong to accounts, not directly to players.
- **Uniqueness invariant**: `email_normalized` and `display_name_key` are unique among
  accounts at the database level, so concurrent registration cannot create duplicates.
- **Legacy invariant**: Existing guest players, tokens, progress, completions, and
  leaderboard entries remain readable and unchanged after migration.
- **Ranking invariant**: Points and leaderboard positions continue to be calculated from
  `completions`; account rows add no ranking fields and no duplicate player entries.
