# Feature Specification: Fix Progress, Filters, and UI Affordances

**Feature Branch**: `005-fix-progress-filter-ui`

**Created**: 2026-11-19

**Status**: Draft

**Input**: User description: "нашли баги 1) не работает выбор частичного прогресса на уровне в модалке он просто сломано посмотри через playwright и убедись что оно работает 2) не работает фильтр(как минимум на пройденные лвлы) 3) курсор на наведение на сортировку должен быть пальчиком просто его вообще нету 4) еще посмотри на обводку которая почему то дальше чем элемент и там пустое пространство"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Choose partial progress with a progress-bar control (Priority: P1)

A signed-in player opens a level, opens “Update Progress”, and selects any value from 1
to 99 using a progress-bar-style range control. The thumb sits inside the bar, the number
field stays in sync, and saving persists the chosen best progress.

**Why this priority**: Progress tracking is a core account feature, and the slider is the
main way to choose a value. It is currently unusable.

**Independent Test**: Open a level with no completion, open Update Progress, click and drag
the slider across its full width, confirm the visible value changes, save, and confirm the
profile/level shows the chosen percentage.

**Acceptance Scenarios**:

1. **Given** a signed-in player on a level, **When** they open Update Progress,
   **Then** the slider spans the available dialog width and its thumb is positioned at the
   current value.
2. **Given** the progress dialog is open, **When** the player clicks a point on the
   slider, **Then** the percentage changes to the corresponding value and the number field
   updates.
3. **Given** the progress dialog is open, **When** the player drags the thumb,
   **Then** the percentage follows the pointer continuously within 1–99.
4. **Given** the player changes the number field, **When** the value is valid,
   **Then** the slider thumb moves to the matching position.
5. **Given** the player chooses a value and saves, **Then** the level and profile show that
   best progress, and a lower value never replaces an existing higher best.
6. **Given** keyboard use, **When** the slider is focused and arrow keys are pressed,
   **Then** the value changes by the expected step.

---

### User Story 2 - Filter levels by completion status (Priority: P1)

A signed-in player filters the catalog by Completed or In Progress and sees only levels that
match their own records. The result count updates and the filter can be combined with other
filters or reset.

**Why this priority**: The filter currently changes the URL but does not change results,
so it appears broken.

**Independent Test**: With one completed and one in-progress level, apply Completed and
confirm only completed levels appear; apply In Progress and confirm only progress records
appear; reset and confirm all levels return.

**Acceptance Scenarios**:

1. **Given** a signed-in player with at least one completion, **When** they apply
   Completed, **Then** only levels they completed are listed and the match count reflects
   that subset.
2. **Given** a signed-in player with at least one in-progress level and no completion on
   it, **When** they apply In Progress, **Then** only levels with progress are listed.
3. **Given** a status filter is active, **When** the player adds a zone, search,
   difficulty, or length filter, **Then** the status condition still applies.
4. **Given** a status filter is active, **When** the player resets filters,
   **Then** the full catalog returns.
5. **Given** a signed-out visitor, **When** they inspect completion-status filtering,
   **Then** they are prompted to sign in rather than seeing an ignored filter.

---

### User Story 3 - Show a pointer cursor on sort controls (Priority: P2)

A visitor hovers the sort control and its menu options and sees a pointer cursor, making it
clear that both are interactive.

**Why this priority**: Missing cursor feedback makes the sort menu feel non-interactive.

**Independent Test**: Hover the sort trigger and each sort option; confirm the cursor is a
pointer on every interactive target.

**Acceptance Scenarios**:

1. **Given** the catalog toolbar, **When** the pointer hovers the sort trigger,
   **Then** the cursor is a pointer.
2. **Given** the sort menu is open, **When** the pointer hovers GLOBAL, ZONE, NAME, or
   COMPLETIONS, **Then** the cursor is a pointer on each option.

---

### User Story 4 - Make tab borders match tab content (Priority: P2)

The bordered tab bar on the profile does not extend into a large empty area beyond the
tabs. The visual boundary matches the tab content, while tabs remain usable on mobile.

**Why this priority**: The oversized border looks like a broken layout and leaves a visible
empty space.

**Independent Test**: Open the profile on desktop and confirm the tab border ends with the
tabs or the tabs fill the row; open it on mobile and confirm all tabs remain reachable.

**Acceptance Scenarios**:

1. **Given** a desktop profile, **When** the tab bar is shown, **Then** there is no large
   empty bordered area beyond the last tab.
2. **Given** the same tab group, **When** tabs fill the available row, **Then** each tab
   remains legible and the active state is clear.
3. **Given** a narrow mobile viewport, **When** the profile tabs are shown,
   **Then** all tabs remain reachable without horizontal page overflow.

---

### User Story 5 - Verify the full mobile experience (Priority: P1)

A visitor using a small mobile screen can use the catalog, filters, sort, level dialog,
progress control, auth dialogs, and profile without broken layout or unreachable controls.

**Why this priority**: Small-screen breakage affects core flows, and the progress control
must be verified on the same devices.

**Independent Test**: Run the main flows at 320×568, 360×640, 375×667, 390×844, and
844×390 landscape; confirm no horizontal page overflow and that every primary action is
reachable.

**Acceptance Scenarios**:

1. **Given** a 320px-wide phone, **When** the catalog, filters, sort, level dialog, auth
   dialogs, and profile are opened, **Then** no screen scrolls horizontally and all primary
   controls are reachable.
2. **Given** a short phone screen, **When** the progress and auth dialogs open,
   **Then** their primary actions remain reachable.
3. **Given** a landscape phone, **When** the same flows are used, **Then** the layout
   remains usable without clipped controls.
4. **Given** the mobile audit, **When** accessibility checks run, **Then** no new critical
   or serious violations appear.

---

### Edge Cases

- Progress slider is focused and used with keyboard only.
- Player has a completion on a level and no progress: In Progress must not show it.
- Player has progress below 100 and no completion: Completed must not show it.
- Player has both progress and completion for the same level: the level is Completed, not
  In Progress.
- Status filter is combined with a zone/search that has no matches.
- Status filter is applied while signed out or after the session expires.
- Sort menu is opened with keyboard: focus and activation still work.
- Profile tabs are viewed at 320px, 390px, and desktop widths.
- A tab group with a right-side note (catalog) is not required to use the same width rule
  as a tab group without a note (profile).

## Requirements *(mandatory)*

### Functional Requirements

**Progress slider**

- **FR-001**: The progress control MUST span the available width of its dialog content with horizontal padding, so its thumb never sits at the dialog edge.
- **FR-002**: The control MUST render as a filled progress bar with a thumb inset from both ends.
- **FR-003**: Clicking anywhere on the progress track MUST set the progress to the corresponding
  value between 1 and 99.
- **FR-004**: Dragging the progress thumb MUST update progress continuously between 1 and 99.
- **FR-005**: The number field and progress control MUST stay synchronized in both directions.
- **FR-006**: The progress control MUST support keyboard adjustment with a visible focused state.
- **FR-007**: Saving MUST persist the selected value and refresh the level/profile display.
- **FR-008**: A lower value MUST NOT replace an existing higher best progress.

**Completion-status filter**

- **FR-009**: Completed filtering MUST return only levels with a completion record for the
  signed-in account.
- **FR-010**: In Progress filtering MUST return only levels with progress for the signed-in
  account and no completion on that level.
- **FR-011**: Status filtering MUST be applied by the data layer used by the catalog, not
  only reflected in the URL.
- **FR-012**: The match count and pagination MUST reflect the filtered result set.
- **FR-013**: Status filtering MUST combine with zone, search, difficulty, length, and sort
  filters.
- **FR-014**: Reset MUST clear the status filter and restore the unfiltered catalog.
- **FR-015**: Signed-out users MUST be directed to sign in for completion-status filtering.

**Cursor feedback**

- **FR-016**: The sort trigger MUST show a pointer cursor on hover.
- **FR-017**: Every sort menu option MUST show a pointer cursor on hover.
- **FR-018**: Keyboard focus and activation of sort controls MUST remain unchanged.

**Tab boundary**

- **FR-019**: A tab group without a right-side note MUST not show a large empty bordered
  area beyond its tabs.
- **FR-020**: Tabs MUST remain legible and the active state clear after the width fix.
- **FR-021**: Tab groups with a right-side note MAY retain their current full-width layout.
- **FR-022**: The tab fix MUST not introduce horizontal page overflow at 320px.

**Mobile verification and regression safety**

- **FR-023**: All primary flows MUST be checked at 320×568, 360×640, 375×667, and 390×844 portrait.
- **FR-024**: All primary flows MUST be checked in 844×390 landscape.
- **FR-025**: No primary-flow screen MUST produce horizontal page overflow at the mobile matrix sizes.
- **FR-026**: Existing progress, completion, catalog, auth, and profile behavior MUST keep working.
- **FR-027**: Every fix MUST be verified with browser automation covering pointer, keyboard,
  filter, progress-bar geometry, and responsive behavior.

### Key Entities

- **Progress**: The player's best percentage below completion on a level; set through the
  slider and number field.
- **Completion status filter**: A catalog condition based on the signed-in player's
  completion and progress records.
- **Sort control**: The trigger and menu options that change catalog ordering.
- **Tab group**: A set of tab triggers whose visual boundary must match its content.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can select any percentage from 1 to 99 with the pointer and save it
  successfully.
- **SC-002**: The slider and number field show identical values after pointer, keyboard, or
  typed changes.
- **SC-003**: Completed filtering returns 100% matching levels in verification data, with
  zero non-completed levels.
- **SC-004**: In Progress filtering returns 100% matching levels and excludes completed
  levels.
- **SC-005**: The filtered match count changes when a status filter is applied.
- **SC-006**: The sort trigger and all four sort options report a pointer cursor on hover.
- **SC-007**: The profile tab border has no empty region wider than one tab beyond the last
  tab.
- **SC-008**: Existing automated checks for auth, progress, completions, catalog, and
  accessibility pass without new serious violations.
- **SC-009**: The progress thumb is visibly inset from both ends at values 1 and 99.
- **SC-010**: The mobile matrix 320×568, 360×640, 375×667, 390×844, and 844×390 shows zero
  horizontal page overflow and reachable primary actions.

## Assumptions

- Completion-status filtering is account-scoped and requires a signed-in session.
- “Completed” means a completion record; “In Progress” means progress without a completion
  on the same level.
- The existing rule that lower progress does not replace a higher best remains unchanged.
- The sort trigger already appears interactive; the missing feedback is on the menu
  options.
- The oversized border refers to tab groups without a right-side note, such as the profile
  tabs; the catalog tab row with its note is out of scope.
- Browser automation is the source of truth for verifying pointer selection, keyboard use,
  filter results, viewport behavior, and every mobile flow.
- The progress control is a progress-bar-style range: filled track, thumb inset from both
  ends, and direct pointer/keyboard selection 1–99.
- Mobile acceptance uses 320×568, 360×640, 375×667, 390×844 portrait and 844×390 landscape.
