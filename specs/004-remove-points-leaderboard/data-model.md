# Phase 1 Data Model: Remove Points and Leaderboard

**Feature**: `004-remove-points-leaderboard`  
**Date**: 2026-11-19

## Overview

No database schema change is required. Points, points-derived skill status, and leaderboard
position are derived values, not stored columns. This feature removes those derived values
and the leaderboard view while preserving all existing rows.

```text
players (unchanged rows)
  1 ──── 0..1 accounts (unchanged)
  1 ──── 0..N progress (unchanged)
  1 ──── 0..N completions (unchanged)

imported_records (unchanged)

Derived/removed:
  points, player status, overall rank, leaderboard entry
```

## Public Profile

The public profile remains the player identity plus activity facts. Removed fields are
no longer produced or returned.

| Field | Status | Notes |
|-------|--------|-------|
| `id` | kept | Player identifier |
| `displayName` | kept | Public display name |
| `createdAt` | kept | Member date |
| `completionCount` | kept | Number of site completions |
| `progressCount` | kept | Number of in-progress levels |
| `bestCompletion` | kept | Hardest completed level by global catalog position |
| `points` | **removed** | No point balance or total anywhere |
| `status` | **removed** | Points-derived skill status |
| `leaderboardRank` | **removed** | Overall/site position |

## Local Completion

| Field | Status | Notes |
|-------|--------|-------|
| `id` | kept | Completion identifier |
| `recordType` | kept | `local` discriminator |
| `playerId` | kept | Owning player |
| `playerName` | kept | Public player name |
| `playerKind` | kept | `account` or `legacy` |
| `levelId` | kept | Completed level |
| `levelName` | kept | Display convenience |
| `percent` | kept | Always `100` |
| `completedAt` | kept | Completion date |
| `videoUrl` | kept | Optional proof URL |
| `playerStatus` | **removed** | Points-derived skill status |
| `playerPoints` | **removed** | Player point total |

## Imported Completion

Unchanged. Imported records remain read-only and retain:

- `source`: `pointercrate`, `aredl`, or `gddl`
- `verificationStatus`: `verified`, `stat`, or `unknown`
- player name, level, percent, completion date, proof URL

`verificationStatus` is not points-derived and stays.

## Progress

Unchanged: `id`, `playerId`, `levelId`, `percent`, `updatedAt`. A completion still removes
matching progress; progress awards nothing and displays no points.

## Leaderboard

Removed entirely:

- No public leaderboard entry type
- No leaderboard page/route
- No leaderboard navigation entry
- No leaderboard ranking query or points ordering

## Removed Types and Mechanics

- `Status` (`ROOKIE` / `PLAYER` / `SKILLED` / `EXTREME` / `LEGEND`): removed.
- `LeaderboardEntry`: removed.
- `pointsFor`, `statusFor`, `rankPlayers`: removed.
- Point-award rules, points sorting, and recalculation tooling: removed.

## Data Preservation Invariants

- Existing `players`, `accounts`, `account_sessions`, `completions`, `progress`, and
  `imported_records` rows MUST NOT be deleted or rewritten.
- `completionCount`, `progressCount`, and `bestCompletion` MUST continue to be derived from
  existing activity.
- Account authentication and session behavior MUST remain unchanged.
- Catalog levels and catalog sorting options other than points MUST remain available.
- The old `/leaderboard` address MUST NOT render leaderboard content; the catalog fallback
  may be shown.
