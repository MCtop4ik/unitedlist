# Contract: Progress Slider, Status Filter, and UI Affordances

**Feature**: `005-fix-progress-filter-ui`  
**Date**: 2026-11-19

## Catalog Status Filter

`GET /api/levels?status=completed&playerId=<playerId>` filters the catalog to levels the
player completed.

`GET /api/levels?status=in-progress&playerId=<playerId>` filters to levels with progress
and no completion for that player.

Supported status values:

- `completed`
- `in-progress`
- absent (no status filter)

Semantics:

- `completed`: `levelId ∈ completions(playerId)`
- `in-progress`: `levelId ∈ progress(playerId) AND levelId ∉ completions(playerId)`
- Filtering happens before sorting and pagination.

Response remains the existing paginated catalog envelope:

```ts
interface Paginated<Level> {
  data: Level[];
  page: number;
  perPage: number;
  total: number;       // status-filtered total
  totalPages: number;  // pages for the filtered total
}
```

Errors:

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Unknown status value |
| 400 | `PLAYER_ID_REQUIRED` | Status is present without `playerId` |

The signed-out frontend does not send a status filter and shows the sign-in prompt instead.

## Progress Dialog

- Slider range: integer 1–99, step 1.
- The slider track spans the dialog content width.
- Clicking the track sets the nearest value.
- Dragging the thumb updates continuously.
- The number input and slider show the same value.
- Arrow keys change the value by one step when the slider is focused.
- `SAVE <n>%` persists the selected value.
- A lower value does not replace a higher stored best.

## Sort Control

- Trigger: `cursor: pointer`.
- Menu options: `cursor: pointer`.
- Menu options remain keyboard-focusable and selectable.
- Selecting an option updates the catalog sort as before.

## Profile Tabs

- The bordered tab row ends at the tab content or the tabs fill the available row; no
  large empty bordered region remains.
- Active tab styling is unchanged.
- At 320px, all tabs remain reachable and the page does not scroll horizontally.
- The catalog tab row (with its right-side note) and auth-dialog tabs are not required to
  change.

## Verification Hooks

- Browser automation can read the slider’s value, position, and saved progress.
- Browser automation can read the filtered match count and visible level rows.
- Browser automation can read computed cursor values.
- Browser automation can compare the tab-list border width with the sum of tab widths.
