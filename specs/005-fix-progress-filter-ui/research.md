# Phase 0 Research: Fix Progress, Filters, and UI Affordances

**Feature**: `005-fix-progress-filter-ui`  
**Date**: 2026-11-19

All unknowns are resolved. No `NEEDS CLARIFICATION` markers remain.

## 1. Progress slider collapse

- **Decision**: Give the Radix slider root an explicit full width so its track spans the
  dialog. Keep the numeric input and Radix keyboard behavior unchanged.
- **Rationale**: Playwright measured the rendered slider/thumb track at about 20px wide,
  so pointer clicks had no range to map across. Full width restores the intended 1–99
  track and lets Radix position the thumb and range correctly.
- **Alternatives considered**:
  - Replace Radix Slider with a native range input: unnecessary and violates the
    Radix-first constitution.
  - Increase only the track width: the root’s shrink-to-fit width would still clip
    positioning and pointer math.

## 2. Completion-status filtering

- **Decision**: Handle status filtering in the catalog request path. When `status` is
  present, query the player’s completion and progress level IDs from SQLite and pass those
  sets into the in-memory catalog’s list operation. Filter before sorting and pagination.
- **Rationale**: The catalog levels live in memory, while completions/progress live in
  SQLite. The route owns the database and the catalog owns filtering/sorting/pagination;
  passing the small ID sets preserves that separation and keeps totals/pages correct.
- **Alternatives considered**:
  - Filter only in the browser: breaks pagination and result counts.
  - Filter after pagination: returns incomplete pages and wrong totals.
  - Add database access to `LiveCatalog`: couples an in-memory service to persistence.

## 3. Filter semantics

- **Decision**: `completed` means the level has a completion for the account.
  `in-progress` means the level has progress and no completion for that account.
- **Rationale**: This matches the existing progress/completion rule that a completion
  removes progress and gives an unambiguous state.
- **Alternatives considered**:
  - Show completed levels in both filters: contradictory UI and duplicate intent.
  - Use imported records: status filtering is account-specific.

## 4. Missing pointer cursor

- **Decision**: Add a pointer cursor to the shared dropdown menu-item style.
- **Rationale**: The trigger is a `button` and already inherits `cursor: pointer`; Radix
  menu options render as non-button elements and currently report `cursor: auto`.
- **Alternatives considered**:
  - Set cursor on every `div`: too broad and can mislead.
  - Change Radix menu items to links: changes semantics unnecessarily.

## 5. Oversized profile tab border

- **Decision**: Give the profile tab list a dedicated class and size it to its content
  (`fit-content`, capped at 100%), rather than stretching to the full page width.
- **Rationale**: The border should describe the tab group. The catalog tab row has a
  right-side note and may stay full width; the auth dialog tabs already fill their row by
  design.
- **Alternatives considered**:
  - Make profile tabs flex-grow: tabs become very wide and visually heavy.
  - Remove the border: changes the design language instead of fixing the boundary.

## 6. Verification strategy

- **Decision**: Add targeted Playwright tests for pointer and keyboard slider use, catalog
  status filtering with count assertions, sort cursor values, and tab-border width versus
  tab-content width; add a backend integration test for filtered catalog totals.
- **Rationale**: All four bugs were confirmed through browser measurements, so browser
  automation is the correct regression proof.
- **Alternatives considered**:
  - Only unit-test CSS: cannot prove pointer mapping or rendered widths.
  - Only screenshot comparison: brittle and does not prove filter data correctness.
