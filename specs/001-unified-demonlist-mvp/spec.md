# Feature Specification: Unified Demonlist MVP

**Feature Branch**: `001-unified-demonlist-mvp`

**Created**: 2026-11-19

**Status**: Draft

**Input**: User description: "попробуй опираться на docs" — scope derived from `docs/PRD.md`
and `docs/ARCHITECTURE.md`.

## Clarifications

### Session 2026-11-19

- Q: Should each level's completion list combine records imported from community lists with completions recorded by players on this site, or use only one of those sources? → A: Both: imported community records are shown read-only, and local players can add their own progress and completions.
- Q: How should players sign in to record progress and appear on the leaderboard? → A: Temporary guest profile; real authentication is deferred. The first delivery is frontend-first against representative mock data.
- Q: How should completion points be weighted across the overall level ranking? → A: Top-heavy curve: each higher global position is worth progressively more, with the hardest levels dominating.
- Q: How should players correct a progress entry or a completion they recorded by mistake? → A: No correction in this delivery; corrections require an administrator.
- Q: Should the leaderboard rank imported community players alongside local guest profiles, or only local guest profiles in this delivery? → A: Only local guest profiles; imported records remain informational and MUST show which source they came from.
- Q: Should the production leaderboard rank every guest profile created on the service, or only profiles stored on the current device? → A: Service-wide guest leaderboard; “local” means created on this site, not confined to one device.
- Q: Should the backend authorize guest writes with a device token issued at profile creation, or accept writes without authentication? → A: Issue a one-time device token on profile creation and require it for writes.
- Q: In the first backend release, should completion records be imported automatically from all three sources, or only Pointercrate with AREDL/GDDL supplied as a file? → A: Auto-import completion records from all three sources.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Browse the unified level catalog (Priority: P1)

A visitor opens the catalog and sees levels from all supported community lists in one
place. They can switch between the overall ranking and individual zones, search for a
level, filter the results, and open a level to see its position, difficulty, author,
preview, and the players who completed it.

**Why this priority**: The catalog is the core value of the product. Without a single
browsable place for 10,000+ levels, none of the personal or rating features matter.

**Independent Test**: A visitor can open the catalog, switch zones, search for a known
level, apply a filter, open the level details, and view its completions using only
public pages.

**Acceptance Scenarios**:

1. **Given** the catalog contains levels from multiple lists, **When** a visitor opens
   the overall view, **Then** levels are shown in one global difficulty order with
   pagination.
2. **Given** a visitor is on the overall view, **When** they select a zone, **Then**
   only levels belonging to that zone are shown in that zone's order.
3. **Given** a visitor enters part of a level or author name, **When** the search is
   applied, **Then** only matching levels are shown and the result count is clear.
4. **Given** a visitor applies a difficulty, length, or completion-status filter,
   **When** results update, **Then** the active filters are visible and can be reset.
5. **Given** a visitor opens a level, **When** the details load, **Then** they see the
   global position, zone position, zone, difficulty, author, preview, and completion
   list.
6. **Given** a level appears in more than one source list, **When** the catalog is
   built, **Then** the level is shown once, in the highest-priority zone, with no
   duplicate entry in other zones.

---

### User Story 2 - Track personal progress and completions (Priority: P2)

A player creates a temporary guest profile on their device, records their best progress
on levels, and marks levels as completed. Their profile shows status, points, rank,
completions, and current progress, while other visitors can see who completed a given
level.

**Why this priority**: Personal tracking turns the catalog into a tool players return
to. It is the first feature that requires identity and stored player data.

**Independent Test**: A player can create a guest profile, record progress below 100%,
later record a completion, and see both reflected on their profile and on the level's
completion list.

**Acceptance Scenarios**:

1. **Given** a player has an active guest profile and opens a level, **When** they
   record a progress value below 100%, **Then** the value appears on their profile as
   their best progress for that level.
2. **Given** a player has recorded progress, **When** they record a higher percentage
   for the same level, **Then** the profile keeps only the best value.
3. **Given** a player records 100%, **When** the record is saved, **Then** the level
   appears as completed and no longer counts as in-progress.
4. **Given** a player submits the same completion twice, **When** the second submission
   is saved, **Then** the profile still shows one completion for that level.
5. **Given** a visitor opens a level, **When** they view the completion list, **Then**
   each local entry shows name, completion date, status, and points, and each imported
   entry shows name, completion date, source list, and verification status.
6. **Given** a player has no recorded activity, **When** they open their profile,
   **Then** an explicit empty state explains how to add progress.
7. **Given** a player uses another device or clears their device data, **When** they
   open the site, **Then** the guest profile is not available and a message explains
   that durable accounts are not part of this delivery.

---

### User Story 3 - Rank players by completion points (Priority: P3)

Players earn points for completing levels with guest profiles created on the service, with
harder levels worth more. Points determine status and a place on the site leaderboard, so
players can compare their achievements. Imported community records remain visible as
source-labelled statistics but do not enter this leaderboard.

**Why this priority**: A unified list needs a credible measure of achievement. It
builds on the catalog and personal tracking but is not required to browse or record
progress.

**Independent Test**: Two local players complete different levels, their points and
leaderboard positions are calculated from those completions, and adding a harder
completion changes the order as expected; imported records do not change either
player's position.

**Acceptance Scenarios**:

1. **Given** a local player completes a level, **When** their profile is viewed,
   **Then** points reflect the completed level's global position and only completed
   levels contribute points.
2. **Given** progress is below 100%, **When** points are calculated, **Then** that
   progress contributes zero points.
3. **Given** multiple players have points, **When** the leaderboard is opened, **Then**
   players are ordered by points with ties handled consistently.
4. **Given** a level's global position or the points rule changes, **When** rankings
   are recalculated, **Then** all players' points and leaderboard positions reflect
   the new values without duplicate completions.

---

### User Story 4 - Keep catalog data current (Priority: P4)

The catalog regularly reflects the current state of the supported community lists, and
temporary failures in one source do not make the catalog unusable.

**Why this priority**: Fresh data keeps the list trustworthy, but the MVP can launch
with an imported snapshot and add refresh behavior afterwards.

**Independent Test**: Refresh the catalog after a source changes, confirm updated
positions and new levels appear, then simulate a source failure and confirm the
previously known catalog remains available.

**Acceptance Scenarios**:

1. **Given** a source added, removed, or moved a level, **When** the catalog is
   refreshed, **Then** the visible catalog reflects the change without duplicates.
2. **Given** one source is unavailable, **When** a visitor browses the catalog,
   **Then** previously available data is still shown and the failure is not presented
   as a blank page.
3. **Given** a level's preview image cannot be loaded, **When** the level is shown,
   **Then** a placeholder is displayed and the rest of the level information remains
   usable.
4. **Given** a shared catalog link contains a zone, filters, and page, **When** another
   visitor opens it, **Then** they see the same catalog state.

---

### Edge Cases

- A level belongs to several source lists: it appears once, in the highest-priority
  zone, and is never duplicated across zones.
- A level is removed from its source: it no longer appears in that zone, and the
  overall order remains consistent.
- A search or filter returns no results: a clear empty state appears with an option to
  reset filters.
- A requested page is beyond the available range: the visitor sees an empty or
  corrected state instead of broken pagination.
- Two players have equal points: leaderboard order remains stable and explainable.
- A player's progress is lower than their existing best: the best value is preserved.
- A player records progress after already completing the level: the completion remains
  and the lower progress does not replace it.
- A completion is reported with an unknown level or player: the action is rejected
  with a clear message.
- A player records an incorrect 100% and cannot correct it themselves: the interface
  explains that correction requires an administrator.
- An imported completion has the same player name as a local guest profile: it stays a
  separate read-only imported record and is never credited to the local profile.
- A write arrives with a missing, invalid, or revoked device token: it is rejected with a
  clear unauthorized error and no data is changed.
- Preview images fail or load slowly: placeholders and lazy display keep the list
  usable.
- A source is slow or unavailable: browsing continues with the last known data.

## Requirements *(mandatory)*

### Functional Requirements

**Catalog**

- **FR-001**: The system MUST present a unified catalog containing all levels from the
  supported community lists, including 10,000+ levels without requiring the visitor to
  load the entire catalog at once.
- **FR-002**: The system MUST provide an overall view ordered by a stored global
  difficulty position and separate views for the Pointercrate, AREDL, and GDDL (GD
  Ladder) zones, with Pointercrate split into main (positions 1–75) and extended (76–150).
- **FR-003**: The system MUST assign each level to exactly one zone using the priority
  Pointercrate, then AREDL, then GD Ladder, and MUST NOT show the same level more than
  once within zone views or in the overall view.
- **FR-004**: Visitors MUST be able to search levels by name or author.
- **FR-005**: Visitors MUST be able to filter the catalog by zone, difficulty, length,
  and completion status, and to clear all filters.
- **FR-006**: Visitors MUST be able to sort results in a meaningful order within the
  active view.
- **FR-007**: Each level MUST expose its name, author, zone, zone position, global
  position, difficulty, length, preview image, and verification video when available.
- **FR-008**: Each level MUST show the players who completed it, paginated when long.
  Local entries MUST show name, completion date, current status, and points. Imported
  entries MUST show name, completion date, source list, and verification status.
  Imported and local entries MUST appear in the same list and MUST be visually
  distinguishable.
- **FR-009**: The catalog state, including zone, search, filters, sort, and page, MUST
  be reflected in the page address so it can be shared and restored.

**Players and progress**

- **FR-010**: Visitors MUST be able to browse the catalog and level completions without
  an account.
- **FR-011**: Players MUST be able to create and use a temporary guest profile without
  signing in, persisted on the current device. Profile creation MUST issue a one-time
  device token used to authorize writes. Cross-device accounts and sign-in are out of
  scope for this delivery.
- **FR-012**: A player with an active guest profile MUST be able to record a best
  progress percentage for any level.
- **FR-013**: A player with an active guest profile MUST be able to record a completion
  for any level.
- **FR-014**: The system MUST keep at most one progress value and one completion per
  player and level, preserving the higher value and preventing duplicates.
- **FR-014a**: Players MUST NOT be able to lower or delete submitted progress or
  completions in this delivery; submitting a higher result remains allowed. Correction
  requests MUST be handled by an administrator outside the player-facing workflow.
- **FR-015**: A player profile MUST show display name, points, status, site leaderboard
  position, completed levels, and current progress.
- **FR-016**: A level's completion list and a player's completion history MUST remain
  consistent with each other after every change.
- **FR-016a**: Imported community completions MUST be read-only on this site and MUST
  NOT be editable, deletable, or assignable to a local player profile.
- **FR-016b**: Local progress and completions MUST be attributable to the active guest
  profile that recorded them. The backend MUST derive the player from the device token,
  not from a client-supplied player ID.
- **FR-017**: The system MUST show explicit loading, empty, success, and error states
  for catalog, profile, progress, and completion actions.

**Rating**

- **FR-018**: Only levels completed by a local guest profile MUST contribute points to
  the site leaderboard; progress below 100% and imported community records MUST
  contribute zero points.
- **FR-019**: Points for a completed level MUST follow one top-heavy curve applied
  consistently across the product: each higher global position is worth progressively
  more than the next lower position, so differences near the top of the ranking exceed
  differences near the bottom.
- **FR-020**: A player's status MUST be derived from their points and completions, not
  edited independently.
- **FR-021**: The site leaderboard MUST order guest profiles created on the service by points and
  handle ties deterministically.
- **FR-021a**: Imported community players MUST NOT appear in the site leaderboard;
  their records remain informational and source-labelled on level pages.
- **FR-022**: When global positions or the points rule change, the system MUST
  recalculate affected points and ranks from stored completions.

**Data freshness and resilience**

- **FR-023**: The system MUST support refreshing levels, zone positions, and completion
  data automatically from all supported community sources: Pointercrate, AREDL, and GDDL.
- **FR-024**: Refresh MUST NOT create duplicate levels and MUST preserve the
  established zone priority.
- **FR-025**: Source-provided data MUST NOT silently overwrite the stored global
  ordering or zone ownership; those changes require an explicit refresh or update step.
- **FR-026**: If a source is unavailable or slow, the catalog MUST continue serving the
  last known data and MUST NOT fail as a whole.
- **FR-027**: Preview images MUST be requested lazily and MUST degrade to a placeholder
  when unavailable.
- **FR-028**: Reusable interactive interface elements MUST be built from the approved
  accessible component library and shared project wrappers per the project
  constitution.

**Accessibility and responsiveness**

- **FR-029**: All primary flows MUST be operable by keyboard with visible focus and
  correct focus management for dialogs and overlays.
- **FR-030**: Interactive elements MUST expose appropriate accessible names, roles, and
  states.
- **FR-031**: The catalog, level details, profile, and leaderboard MUST remain usable
  and readable on common desktop and mobile screen sizes.
- **FR-032**: Any destructive action exposed in the product UI MUST require confirmation
  and provide immediate feedback. This delivery exposes no destructive player actions;
  administrative corrections are performed through internal data tooling with explicit
  confirmation.

### Key Entities

- **Level**: A Geometry Dash level present in the catalog. Key attributes: unique level
  identifier, name, author, zone, zone position, global position, difficulty, length,
  preview reference, verification video reference.
- **Zone**: A source-specific grouping with its own ordering and rules. The four views
  are overall, Pointercrate (main and extended), AREDL, and GDDL (GD Ladder). Overall is
  a view over all levels, not a fourth exclusive zone.
- **Player**: A person identified by a temporary guest profile on one device. Key
  attributes: display name, points, derived status, site leaderboard position, and a
  hashed device token used to authorize writes. The profile identity remains device-scoped,
  but its leaderboard entry is visible service-wide. Tokens are not recovery credentials.
  Durable cross-device identity is deferred.
- **Progress**: A player's best percentage below 100% on a level. One per player and
  level.
- **Completion**: A completed level at 100%. Local completions belong to one player
  profile; imported completions belong to a community-recorded player identity and are
  read-only. One local completion per player and level, with a completion date and
  optional proof link.
- **Imported Record**: A completion or player entry received from a community list,
  carrying the name of that source and a verification status. Imported records are
  read-only, visually distinguished from local records, and excluded from local points
  and leaderboard placement.
- **Points Rule**: The single top-heavy rule that converts a completed level's global
  position into points and determines status thresholds.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In usability testing, at least 90% of participants find a requested level
  in three actions or fewer.
- **SC-002**: At least 95% of catalog page views show results within 2 seconds on a
  standard broadband connection, including when the catalog exceeds 10,000 levels.
- **SC-003**: Switching between the overall view and any zone completes within 2
  seconds for at least 95% of attempts.
- **SC-004**: The catalog contains zero duplicate level entries across zone views and
  zero duplicate player-level completions.
- **SC-010**: 100% of leaderboard entries belong to guest profiles created on the service, and 100% of
  imported records visibly name their source list.
- **SC-005**: At least 90% of first-time players can record progress and a completion
  without assistance.
- **SC-006**: A player's profile, points, and leaderboard position remain consistent
  after a ranking recalculation, with zero orphaned completions.
- **SC-007**: When one data source is unavailable, 100% of previously known levels
  remain browsable and no page shows a blank catalog.
- **SC-008**: All primary flows are completable using only a keyboard, with no critical
  accessibility failures in automated or manual review.
- **SC-009**: A shared catalog link restores the same zone, filters, sort, and page for
  at least 95% of tested links.

## Assumptions

- Public browsing is free and requires no account; an active guest profile and its device
  token are required only for progress, completions, points, and leaderboard placement.
- The MVP uses self-reported local progress and completions without a review workflow;
  moderation and proof verification are out of scope for this phase. Imported
  community records are treated as read-only source data and are not verified locally.
  Administrators can correct mistaken player records through an internal capability;
  there is no player-facing correction workflow.
- Pointercrate, AREDL, and GD Ladder remain the authoritative sources for zone
  membership and zone positions; the product does not replace them.
- The stored global position in the project's level data is the source of truth for the
  overall order; it is maintained during import and explicit updates rather than
  recalculated on every page view.
- The product supports the level dataset described in the docs (10,000+ levels, four
  zone views) and targets current desktop and mobile browsers.
- The interface language and branding may be refined later; the functional behavior in
  this specification is not language-specific.
- Level previews may be unavailable for some levels and must degrade to placeholders.
- The first delivery is frontend-first: user flows are validated against representative
  mock data before real authentication and live source synchronization are implemented.
- The MVP targets public read access plus guest-profile player actions; administrative
  source synchronization is an internal capability, not a public user role.
