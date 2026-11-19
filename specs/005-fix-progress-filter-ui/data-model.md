# Phase 1 Data Model: Fix Progress, Filters, and UI Affordances

**Feature**: `005-fix-progress-filter-ui`  
**Date**: 2026-11-19

## Overview

No database schema change. Status filtering derives two level-ID sets from existing rows;
the progress slider and UI affordances are presentation changes.

```text
players / accounts (unchanged)
  ├── completions: (player_id, level_id) -> Completed set
  └── progress:    (player_id, level_id) -> In-Progress candidate set

Catalog level list + Completed/Progress sets -> filtered catalog page
```

## Derived Filter Sets

For a requested `playerId` and `status`:

| Set | Source | Meaning |
|-----|--------|---------|
| `completedLevelIds` | `completions.level_id WHERE player_id = ?` | Levels the player completed |
| `progressLevelIds` | `progress.level_id WHERE player_id = ?` | Levels with a best progress value |

Status rules:

- `status = completed`: include a level only when its ID is in `completedLevelIds`.
- `status = in-progress`: include a level only when its ID is in `progressLevelIds` and
  not in `completedLevelIds`.
- No status: do not apply either set.

Invariant: a completion removes matching progress, so a level cannot be simultaneously
Completed and In Progress under these rules.

## Catalog Query

The existing catalog query fields remain:

- `zone`
- `q`
- `difficulty`
- `length`
- `status`
- `playerId`
- `sort`
- `page`
- `perPage`

Filter order:

1. zone / search / difficulty / length
2. status sets
3. sort
4. pagination

The `total` and `totalPages` reflect the status-filtered set.

## Progress Input

| Field | Constraint | Behavior |
|-------|------------|----------|
| Slider value | Integer 1–99 | Pointer, drag, and keyboard update the same value |
| Number input | Integer 1–99 | Typing updates the slider |
| Existing best | Higher wins | Saving a lower value does not lower the stored best |
| Completion | 100 | A completion still removes matching progress |

The slider’s rendered track must span the available dialog content width; the value range
is 1–99 with step 1.

## UI Affordances

- **Sort trigger**: pointer cursor on hover.
- **Sort menu options**: pointer cursor on hover; keyboard behavior unchanged.
- **Profile tab group**: border width matches tab content width, capped at the available
  row; active tab state remains visible.
- **Catalog tab row**: may remain full width because it includes a right-side note.
- **Auth dialog tabs**: remain full-width by design.

## Data Preservation

- Existing completions and progress rows are read, never modified, by filtering.
- The progress slider still writes through the existing progress endpoint with the same
  1–99 validation.
- No migration is required.
