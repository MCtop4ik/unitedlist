# Data Model — Production Backend

## Overview

SQLite is the source of truth for guest player data only. The production catalog is kept in
memory and refreshed from live sources; `data/levels.json` is the startup/fallback snapshot.
Imported records remain read-only. Points and leaderboard positions are derived, not stored
as the only truth.

> The `levels` table described below is a legacy schema retained for the mock-generation
> path; the live backend does not read or write it. Player records reference level IDs
> without a database foreign key.

## Schema

### `levels`

| Column | Type | Rules |
|---|---|---|
| `level_id` | INTEGER | Primary key; GD level ID |
| `name` | TEXT | NOT NULL |
| `author` | TEXT | NOT NULL |
| `zone` | TEXT | `pointercrate`, `aredl`, `gddl` |
| `zone_rank` | INTEGER | Positive; unique per zone |
| `global_rank` | INTEGER | Positive; unique; defines ALL order |
| `difficulty` | TEXT | NOT NULL |
| `length` | TEXT | `tiny`, `short`, `medium`, `long`, `xl` |
| `thumbnail_url` | TEXT | Nullable |
| `video_url` | TEXT | Nullable |
| `song` | TEXT | Nullable |
| `source_updated_at` | TEXT | ISO timestamp |

Indexes: `global_rank`, `(zone, zone_rank)`, `lower(name)`, `lower(author)`.

### `players`

| Column | Type | Rules |
|---|---|---|
| `id` | TEXT | Primary key; generated local ID |
| `display_name` | TEXT | Trimmed, 2–32 characters |
| `created_at` | TEXT | ISO timestamp |

### `player_tokens`

| Column | Type | Rules |
|---|---|---|
| `player_id` | TEXT | PK/FK → `players.id`, `ON DELETE CASCADE` |
| `token_hash` | TEXT | Unique SHA-256 hash; raw token never stored |
| `created_at` | TEXT | ISO timestamp |
| `last_used_at` | TEXT | Nullable |
| `revoked_at` | TEXT | Nullable |

### `progress`

| Column | Type | Rules |
|---|---|---|
| `id` | TEXT | Primary key |
| `player_id` | TEXT | FK → `players.id`, `ON DELETE CASCADE` |
| `level_id` | INTEGER | FK → `levels.level_id`, `ON DELETE CASCADE` |
| `percent` | INTEGER | 1–99 |
| `updated_at` | TEXT | ISO timestamp |

Unique: `(player_id, level_id)`. A lower or equal value never replaces the stored best.

### `completions`

| Column | Type | Rules |
|---|---|---|
| `id` | TEXT | Primary key |
| `player_id` | TEXT | FK → `players.id`, `ON DELETE CASCADE` |
| `level_id` | INTEGER | FK → `levels.level_id`, `ON DELETE CASCADE` |
| `completed_at` | TEXT | ISO timestamp |
| `video_url` | TEXT | Nullable |

Unique: `(player_id, level_id)`. Duplicate writes return the existing row.

### `imported_records`

| Column | Type | Rules |
|---|---|---|
| `id` | TEXT | Primary key |
| `level_id` | INTEGER | FK → `levels.level_id`, `ON DELETE CASCADE` |
| `source` | TEXT | `pointercrate`, `aredl`, `gddl` |
| `player_name` | TEXT | Source display name |
| `percent` | INTEGER | Source value; usually 100 |
| `completed_at` | TEXT | Nullable |
| `proof_url` | TEXT | Nullable |
| `verification_status` | TEXT | `verified`, `stat`, `unknown` |
| `imported_at` | TEXT | ISO timestamp |

No write route touches this table. It never contributes points or leaderboard placement.

### `source_status`

| Column | Type | Rules |
|---|---|---|
| `source` | TEXT | PK; one of the three sources |
| `ok` | INTEGER | 0/1 |
| `last_updated` | TEXT | Last successful refresh |
| `stale` | INTEGER | 0/1 |
| `last_error` | TEXT | Nullable |

### `refresh_runs`

| Column | Type | Rules |
|---|---|---|
| `id` | TEXT | Primary key |
| `started_at` | TEXT | ISO timestamp |
| `finished_at` | TEXT | Nullable |
| `status` | TEXT | `running`, `success`, `failed` |
| `counts_json` | TEXT | Per-source and prune counts |
| `error` | TEXT | Nullable |

## Invariants

- `level_id`, `global_rank`, and `(zone, zone_rank)` are unique.
- Zone priority is Pointercrate (1–150), AREDL, then GDDL.
- A level exists once; ALL is a sorted view, not a table.
- One progress row and one completion row per player/level.
- Imported records are never assigned to a guest player.
- Foreign keys are enabled; deleting a level cascades its records.
- Refresh removes stale levels and prunes orphans in one transaction.

## Points and leaderboard

```text
points(global_rank) = max(1, round(5000 / global_rank^0.55))
```

Status thresholds:

| Status | Points |
|---|---:|
| ROOKIE | 0–999 |
| PLAYER | 1,000–4,999 |
| SKILLED | 5,000–14,999 |
| EXTREME | 15,000–29,999 |
| LEGEND | 30,000+ |

Leaderboard query joins `players` to `completions` and `levels`, sums points, and ranks by:

1. points descending;
2. earliest latest completion timestamp;
3. player ID ascending.

Imported records are excluded from the query.

## State transitions

```text
none --(record 1–99)--> in_progress
in_progress --(higher %)--> in_progress
in_progress --(record 100%)--> completed
completed --(repeat completion)--> completed (idempotent)
completed --(lower progress)--> completed (ignored)
```

## Validation summary

- Reject unknown levels and players.
- Reject progress outside 1–99.
- Reject completions not at 100%.
- Reject names outside 2–32 characters.
- Reject writes without a valid token.
- Reject imported records as targets of player routes.
- Recalculate points from stored completions on read; no orphaned rows after refresh.
