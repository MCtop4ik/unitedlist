# Data Model — Unified Demonlist MVP

## Overview

The model separates read-only reference data (levels and imported community records)
from local player data (guest profile, progress, completions). Imported records never
become local records automatically.

## Entities

### Level

A Geometry Dash level shown exactly once in the catalog.

| Field | Type | Rules |
|---|---|---|
| `levelId` | number | Unique primary key; matches the GD level ID |
| `name` | string | Required, non-empty |
| `author` | string | Required |
| `zone` | enum | `pointercrate`, `aredl`, `gddl` |
| `zoneRank` | number | Positive, unique within a zone |
| `globalRank` | number | Positive, unique across all levels |
| `difficulty` | string | Source-specific label, e.g. Extreme |
| `length` | enum | `tiny`, `short`, `medium`, `long`, `xl` |
| `thumbnailUrl` | string | Optional; placeholder when missing |
| `videoUrl` | string | Optional verification/showcase URL |
| `song` | string | Optional |
| `completionCount` | number | Derived count of all completion records |
| `sourceUpdatedAt` | string | ISO timestamp of last source refresh |

Invariants:

- `levelId`, `globalRank`, and `(zone, zoneRank)` are unique.
- Zone assignment priority is Pointercrate (positions 1–150), AREDL, then GDDL.
- Pointercrate `main` is zone rank 1–75; `extended` is 76–150.
- A level appears once in ALL and once in its single zone view.

### Zone

A source-specific grouping. It is a view and a ranking context, not a separate level
record.

| Value | Membership | Ordering |
|---|---|---|
| `all` | Every level | `globalRank` ascending |
| `pointercrate-main` | Pointercrate ranks 1–75 | Pointercrate rank |
| `pointercrate-extended` | Pointercrate ranks 76–150 | Pointercrate rank |
| `aredl` | AREDL levels not in Pointercrate | AREDL rank |
| `gddl` | GDDL levels not in Pointercrate or AREDL | GDDL rating descending, then ID |

### Player

A local guest profile, scoped to one browser/device.

| Field | Type | Rules |
|---|---|---|
| `id` | string | Generated unique local identifier |
| `displayName` | string | 2–32 characters, trimmed |
| `points` | number | Derived from local completions |
| `status` | enum | Derived: ROOKIE, PLAYER, SKILLED, EXTREME, LEGEND |
| `createdAt` | string | ISO timestamp |
| `leaderboardRank` | number | Derived from points; ties by earliest completion |

### Progress

A player's best percentage below 100% on one level.

| Field | Type | Rules |
|---|---|---|
| `id` | string | Unique |
| `playerId` | string | References Player |
| `levelId` | number | References Level |
| `percent` | number | Integer 1–99 |
| `updatedAt` | string | ISO timestamp |

Uniqueness: one progress record per `(playerId, levelId)`. A lower or equal percentage
never replaces a higher one.

### Completion

A local completion at 100%.

| Field | Type | Rules |
|---|---|---|
| `id` | string | Unique |
| `playerId` | string | References Player |
| `levelId` | number | References Level |
| `percent` | number | Always 100 |
| `completedAt` | string | ISO timestamp |
| `videoUrl` | string | Optional proof link |

Uniqueness: one completion per `(playerId, levelId)`. Duplicate submissions are
idempotent. Completions cannot be lowered or deleted by the player; administrators may
correct them outside the player UI.

### ImportedRecord

A read-only completion or player entry received from a community source.

| Field | Type | Rules |
|---|---|---|
| `id` | string | Unique |
| `levelId` | number | References Level |
| `playerName` | string | Display name from the source |
| `source` | enum | `pointercrate`, `aredl`, `gddl` |
| `percent` | number | Usually 100; source value |
| `completedAt` | string | Optional ISO timestamp |
| `proofUrl` | string | Optional |
| `verificationStatus` | enum | `verified`, `stat`, or `unknown`; source-provided |
| `importedAt` | string | ISO timestamp |

Rules:

- Never editable or deletable from the player UI.
- Never credited to a local Player, even if names match.
- Never contributes points or leaderboard placement.
- Always displayed with its source label.

## State transitions

### Guest profile

```text
none --(create profile)--> active
active --(clear device data)--> none
```

A missing profile blocks write actions but never blocks public browsing.

### Level activity

```text
none --(record progress 1–99)--> in_progress
in_progress --(higher progress)--> in_progress
in_progress --(record 100%)--> completed
completed --(repeat completion)--> completed (idempotent)
completed --(record lower progress)--> completed (progress ignored for points)
```

### Points and status

Points are always derived from local completions, never stored as the only source of
truth. Recalculation recomputes every player's points, status, and leaderboard rank.

## Points formula

```text
points(globalRank) = max(1, round(5000 / globalRank^0.55))
```

| Global rank | Points |
|---:|---:|
| 1 | 5,000 |
| 10 | 1,409 |
| 100 | 397 |
| 1,000 | 112 |
| 10,000 | 31 |

Status thresholds: ROOKIE 0–999, PLAYER 1,000–4,999, SKILLED 5,000–14,999,
EXTREME 15,000–29,999, LEGEND 30,000+.

Tie handling: descending points, then earliest latest completion timestamp, then
lexicographic player ID. The rule must be deterministic and documented in the UI.

## Relationships

```text
Level 1 ── * Completion * ── 1 Player
Level 1 ── * Progress   * ── 1 Player
Level 1 ── * ImportedRecord
Player 1 ── * Completion
Player 1 ── * Progress
```

## Validation summary

- Reject unknown `levelId` or `playerId`.
- Reject progress outside 1–99 and completions other than 100%.
- Reject duplicate `(playerId, levelId)` records; merge idempotently.
- Reject imported records as targets of player edits.
- Reject profile names outside 2–32 characters or only whitespace.
- Recompute points and rank after every completion, correction, or global-rank change.
