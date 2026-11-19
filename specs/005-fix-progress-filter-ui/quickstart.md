# Quickstart Validation: Fix Progress, Filters, and UI Affordances

**Feature**: `005-fix-progress-filter-ui`  
**Date**: 2026-11-19

Use this guide to verify all four reported bugs end to end.

## Prerequisites

- Node.js 22+
- Existing development data with at least one account that has a completion and an
  in-progress level
- No other process on ports 3001 and 5173

## Setup

```bash
npm install
npm --workspace backend run migrate
npm --workspace backend run dev
```

In another terminal:

```bash
npm run dev
```

Open `http://localhost:5173`.

## 1. Progress Slider

1. Sign in.
2. Open a level with no completion.
3. Choose **UPDATE PROGRESS**.
4. Click at roughly one quarter, one half, and three quarters across the slider track.
5. Drag the thumb across the track.
6. Type a value in the number field.
7. Focus the slider and press the arrow keys.
8. Save a value.

Expected:

- The slider track spans the dialog content, not a thumb-sized sliver.
- Pointer clicks and dragging change the percentage.
- The number field and slider stay synchronized.
- Arrow keys change the value by one step.
- Saving persists the chosen best progress on the level and profile.
- A lower value does not replace a higher existing best.

## 2. Completion-Status Filter

1. Sign in with an account that has at least one completion and one in-progress level.
2. Open the catalog filter panel.
3. Apply **COMPLETED** and press **APPLY**.
4. Repeat with **IN PROGRESS**.
5. Combine a status with a zone or search filter.
6. Press **RESET**.
7. Sign out and inspect completion-status filtering.

Expected:

- Completed shows only levels with a completion for this account.
- In Progress shows only levels with progress and no completion.
- The displayed match count and pagination reflect the filtered set.
- Combining filters keeps the status condition.
- Reset restores the full catalog.
- Signed-out users see a sign-in prompt instead of an ignored filter.

## 3. Sort Cursor

1. Hover the sort trigger.
2. Open the sort menu and hover GLOBAL, ZONE, NAME, and COMPLETIONS.

Expected:

- The cursor is a pointer on the trigger and on every menu option.
- Keyboard focus and selection still work.

## 4. Profile Tab Border

1. Open `/profile` at desktop width.
2. Inspect the bordered tab row.
3. Resize to 320px and open the same tabs.

Expected:

- The border ends with the tab content or the tabs fill the row; there is no large empty
  bordered area.
- All tabs remain readable and reachable at 320px.
- The page does not scroll horizontally.

## Automated Verification

From the repository root:

```bash
npm run typecheck
npm run lint
npm test
npm run test:e2e
npm run test:e2e:backend
```

Targeted browser checks should verify:

- slider click, drag, keyboard, synchronization, and save;
- completed/in-progress result correctness and filtered totals;
- pointer cursor on the sort trigger and every option;
- profile tab border width versus content width at desktop and 320px.
