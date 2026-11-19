# Feature Specification: Remove Points and Leaderboard

**Feature Branch**: `004-remove-points-leaderboard`

**Created**: 2026-11-19

**Status**: Draft

**Input**: User description: "давай уберем всю механику с очками полностью ото всюду из аккаунтов а также уберем лидерборд и уберем положение внутри аккаунта"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View a points-free account profile (Priority: P1)

A signed-in player opens their profile and sees their identity and activity without any
points, site rank, or points-derived skill status. Completions, progress, and best clear
remain visible.

**Why this priority**: The account profile is the main place where points and position are
shown. Removing them there is the core of the request.

**Independent Test**: Sign in, record progress and a completion, and open the profile;
confirm there is no points value, no site rank, no skill badge, and no empty placeholder
where those values used to be.

**Acceptance Scenarios**:

1. **Given** a signed-in player with completions, **When** they open their profile,
   **Then** they see display name, member date, completion count, progress, and best clear
   without points, rank, or skill status.
2. **Given** a new account with no activity, **When** the profile is opened, **Then** the
   empty states appear without any zero-points or unranked placeholders.
3. **Given** a profile on mobile or desktop, **When** the points/rank cards are removed,
   **Then** the remaining cards lay out cleanly without empty gaps.

---

### User Story 2 - View level completions without points or status (Priority: P1)

A visitor opens a level and sees who completed it, labeled by account, legacy, or imported
source, without points or skill-status columns.

**Why this priority**: Completion lists currently show point totals and status, which are
part of the points mechanic.

**Independent Test**: Open a level with account, legacy, and imported completions; confirm
each entry is present and correctly labeled, with no points or skill status.

**Acceptance Scenarios**:

1. **Given** a level with account completions, **When** the completion list is shown,
   **Then** each account entry shows the player name and account label but no points or
   skill status.
2. **Given** a level with legacy guest completions, **When** the list is shown, **Then**
   legacy entries remain visible and labeled as legacy.
3. **Given** imported community completions, **When** they are shown, **Then** source and
   verification labels remain unchanged.

---

### User Story 3 - Remove the leaderboard (Priority: P1)

A visitor can no longer reach or view a site leaderboard. The navigation entry, mobile menu
entry, page, and any direct-link destination are gone.

**Why this priority**: The leaderboard is entirely a points-and-position feature, so it
must be removed with the points mechanic.

**Independent Test**: Inspect desktop and mobile navigation for a leaderboard entry, and
open the old leaderboard address directly; confirm no leaderboard content is shown.

**Acceptance Scenarios**:

1. **Given** the desktop header, **When** the visitor inspects navigation,
   **Then** there is no leaderboard entry.
2. **Given** the mobile menu, **When** it is opened, **Then** there is no leaderboard item.
3. **Given** the old leaderboard address, **When** it is opened directly, **Then** the user
   sees the catalog or a not-found fallback, never leaderboard content.

---

### User Story 4 - Remove all points mechanics (Priority: P2)

The product no longer calculates, awards, stores, displays, sorts by, or recalculates
points anywhere. Points-derived skill statuses are removed as well.

**Why this priority**: Removing only the visible cards would leave dead calculations and
stale labels that can reappear or confuse future work.

**Independent Test**: Search the running product and public account/level data for points,
score, site rank, leaderboard rank, and points-derived skill status; none are present.

**Acceptance Scenarios**:

1. **Given** any profile, completion list, or catalog view, **When** account data is shown,
   **Then** no points, score, rank, or points-derived status appears.
2. **Given** an account with existing completions, **When** completions are recorded or
   viewed, **Then** no points are awarded or displayed.
3. **Given** the project's maintenance commands and background work, **When** points
   recalculation would previously run, **Then** no points recalculation capability remains.
4. **Given** a catalog sort menu, **When** sorting is shown, **Then** no points-based sort
   option remains.

---

### User Story 5 - Preserve accounts, records, and catalog data (Priority: P2)

While points and the leaderboard are removed, existing accounts, completions, progress,
imported records, and catalog data remain intact and the rest of the product keeps working.

**Why this priority**: Removing a mechanic must not delete user records or break
authentication and catalog browsing.

**Independent Test**: Use an existing account with completions and progress; confirm the
records, progress, best clear, and authentication still work after the change.

**Acceptance Scenarios**:

1. **Given** an existing account with records, **When** the update is applied,
   **Then** all completions and progress remain and are still visible.
2. **Given** import records from community sources, **When** level completions are shown,
   **Then** they remain read-only and source-labeled.
3. **Given** a visitor, **When** they browse and search the catalog, **Then** catalog
   behavior is unchanged except for removed points-related labels.

---

### Edge Cases

- An account previously had a positive point total and a leaderboard position: after the
  change, neither value appears anywhere.
- A new account has no completions: no “0 points”, “unranked”, or empty status badge is
  shown.
- A level has only progress and no completions: progress still appears where it did before.
- A completion list combines account, legacy, and imported entries: only the removed
  points/status fields disappear; identity and source labels remain.
- A user opens an old leaderboard bookmark: the app must not show stale leaderboard data.
- A visitor uses the catalog’s completion sort: the sort remains available; any
  points-based sort is gone.
- Existing points values exist only as derived data: no stored record is lost when the
  calculation is removed.
- Imported verification status (`verified`, `stat`, `unknown`) is not a points-derived
  skill status and remains visible.

## Requirements *(mandatory)*

### Functional Requirements

**Points and rank removal**

- **FR-001**: The product MUST NOT display points or scores for any player, account, or
  completion anywhere.
- **FR-002**: The product MUST NOT display a site rank, leaderboard position, or any other
  overall player position on a profile or elsewhere.
- **FR-003**: The product MUST NOT display points-derived skill statuses on accounts,
  profiles, or completion entries.
- **FR-004**: Public player/profile data MUST NOT include points, rank, or points-derived
  skill-status fields.
- **FR-005**: Completing a level MUST NOT award points or trigger any points-based change.

**Profile**

- **FR-006**: A profile MUST show display name, member date, completion count, progress,
  and best clear.
- **FR-007**: A profile MUST NOT show points, site rank, or a points-derived skill badge.
- **FR-008**: Empty profiles MUST NOT show zero-points, unranked, or placeholder skill
  states.
- **FR-009**: Profile statistics MUST adapt to the reduced set of cards on desktop and
  mobile without empty gaps or overflow.

**Completion lists**

- **FR-010**: Level completion lists MUST keep player names and account, legacy, or
  imported source labels.
- **FR-011**: Level completion lists MUST NOT show points or points-derived skill status.
- **FR-012**: Imported source and verification labels MUST remain visible and unchanged.

**Leaderboard**

- **FR-013**: The desktop navigation MUST NOT include a leaderboard entry.
- **FR-014**: The mobile navigation MUST NOT include a leaderboard entry.
- **FR-015**: The leaderboard page and its public data MUST be removed.
- **FR-016**: Opening the old leaderboard address MUST NOT display leaderboard content;
  the visitor sees the catalog or a not-found fallback.

**Mechanics and maintenance**

- **FR-017**: Points calculation, point-award rules, points-based sorting, and points
  recalculation tooling MUST be removed.
- **FR-018**: Points-derived status thresholds MUST be removed.
- **FR-019**: The catalog MUST keep its non-points sorting options, including completion
  count sorting.
- **FR-020**: Documentation and tests that describe points, rank, or the leaderboard MUST
  be updated or removed.
- **FR-021**: The change MUST leave no points, rank, or leaderboard placeholders in loading,
  empty, error, or success states.

**Data preservation**

- **FR-022**: Existing accounts, completions, progress, imported records, and catalog data
  MUST NOT be deleted or rewritten by this change.
- **FR-023**: Authentication, profile access, progress recording, and completion recording
  MUST continue to work.
- **FR-024**: Existing account and record behavior not related to points MUST remain
  unchanged.

### Key Entities

- **Account profile**: The public identity and activity for an account. It keeps display
  name, member date, completions, progress, and best clear; it loses points, rank, and
  skill status.
- **Completion**: A player’s completed level. It keeps player identity, source/account
  label, and completion date; it loses points and skill status.
- **Progress**: A player’s best percentage below completion. It is unchanged.
- **Imported completion**: A read-only community record with source and verification
  labels. It is unchanged.
- **Leaderboard**: A points-and-position view that is removed entirely.
- **Catalog**: The level list and level details. Points-related labels are removed; the
  rest is unchanged.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of profile views show no points, site rank, or skill badge.
- **SC-002**: 100% of level completion entries show no points or skill status.
- **SC-003**: The leaderboard is unreachable from every navigation surface and directly
  displays no leaderboard content.
- **SC-004**: No public account or completion view contains points, rank, or skill-status
  data.
- **SC-005**: 100% of existing completions and progress records remain visible after the
  change.
- **SC-006**: Zero points-recalculation commands or background operations remain.
- **SC-007**: Profile, auth, progress, completion, and catalog flows pass their existing
  verification checks without points-related failures.
- **SC-008**: No new critical or serious accessibility violations appear in the audited
  profile and level views.

## Assumptions

- “All points mechanics” includes points-derived skill statuses (e.g. rookie/player/
  skilled) and site/leaderboard positions.
- The leaderboard is removed completely, with no replacement ranking or scoreboard.
- Completion count and best clear are activity facts, not points, and remain visible.
- Imported record verification labels are not points-derived and remain.
- Points are derived values rather than separately stored balances; removing the mechanic
  requires no destructive migration.
- This is an intentional breaking change for any integration that consumed points, rank,
  or leaderboard data; all product surfaces are updated together.
- Existing records are preserved; no historical account or completion is deleted.
- Catalog sorting by completion count and other non-points options remains.
