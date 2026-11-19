# Feature Specification: UI Resilience Bugfixes

**Feature Branch**: `003-ui-bugfixes`

**Created**: 2026-11-19

**Status**: Draft

**Input**: UI audit from the request "ищем UI баги": missing leaderboard navigation, responsive overflow with long names and narrow screens, unreachable filter/auth actions, inconsistent account/legacy labels, and minor dialog/favicon issues.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reach the site leaderboard (Priority: P1)

A visitor can discover and open the site leaderboard from the primary navigation on desktop and from the mobile menu.

**Why this priority**: The leaderboard is a core page but currently has no visible navigation entry.

**Independent Test**: Open the home page at desktop and mobile widths, use the visible navigation, and reach `/leaderboard` without typing a URL.

**Acceptance Scenarios**:

1. **Given** a desktop visitor on any page, **When** they inspect the primary navigation, **Then** a Leaderboard link is present and marked current on `/leaderboard`.
2. **Given** a mobile visitor, **When** they open the menu, **Then** a Leaderboard item is present and opens `/leaderboard`.

---

### User Story 2 - Keep layouts usable on small screens and with long names (Priority: P1)

The site remains readable and scrolls only vertically at 320px width, including when a player's display name is the maximum allowed 32 unbroken characters. Header controls, profile statistics, and leaderboard rows stay inside the viewport.

**Why this priority**: Valid display names and common small phones currently cause horizontal page scrolling and hide controls.

**Independent Test**: View the catalog, profile, and leaderboard at 390px and 320px with a 32-character unbroken display name; verify no horizontal document scroll, all header controls are visible, and cards/rows do not expand beyond the viewport.

**Acceptance Scenarios**:

1. **Given** a 390px viewport and a 32-character display name, **When** the catalog or profile is shown, **Then** the account menu and page content stay within the viewport with no horizontal page scroll.
2. **Given** a 320px viewport with a normal display name, **When** the catalog is shown, **Then** the account chip and menu trigger remain fully visible.
3. **Given** a long display name, **When** the profile is shown, **Then** the title wraps or truncates without widening the stats grid.
4. **Given** a long display name, **When** the leaderboard is shown, **Then** the row text wraps or truncates without overflowing the row.
5. **Given** a 320px viewport, **When** the zone tabs are shown, **Then** every zone, including GDDL, is reachable.

---

### User Story 3 - Apply filters on short screens (Priority: P1)

A player on a short mobile viewport can open the filter panel, reach every control, and apply or reset filters.

**Why this priority**: At 320×568 the Apply button currently falls outside the viewport and the panel does not scroll, blocking filtering.

**Independent Test**: At 320×568, open Filters, scroll within the panel if needed, activate a filter, and press Apply; results update.

**Acceptance Scenarios**:

1. **Given** a 320×568 viewport, **When** Filters opens, **Then** Reset and Apply are reachable.
2. **Given** a short viewport, **When** the filter panel is taller than the available space, **Then** the panel itself scrolls and keeps its actions usable.

---

### User Story 4 - Distinguish account records from legacy records (Priority: P2)

Account-backed players and preserved legacy guest profiles are labeled consistently and correctly in level completion lists and on the leaderboard.

**Why this priority**: The current UI labels account records as `LOCAL` in level dialogs and labels legacy guests as accounts on the leaderboard.

**Independent Test**: Seed one account completion and one legacy completion; open the level and leaderboard and confirm each is labeled `ACCOUNT` or `LEGACY` consistently.

**Acceptance Scenarios**:

1. **Given** an account-backed completion, **When** it appears in a level dialog and profile, **Then** it is labeled `ACCOUNT` in both places.
2. **Given** a legacy guest completion, **When** it appears in a level dialog, **Then** it is labeled `LEGACY`.
3. **Given** a legacy guest on the leaderboard, **When** the row is shown, **Then** it is not described as an account.

---

### User Story 5 - Reach auth actions on short screens (Priority: P2)

A user on a short mobile viewport can see and reach the primary submit and cancel actions in the sign-in and registration dialog. The auth tabs fill their row instead of leaving a large empty area on desktop.

**Why this priority**: The submit button starts below the viewport at 320×568, and the desktop tabs look unfinished.

**Independent Test**: At 320×568, open the registration dialog, scroll within it, and submit or cancel; at 1440px, verify the two auth tabs occupy the available row.

**Acceptance Scenarios**:

1. **Given** a 320×568 viewport, **When** the registration dialog opens, **Then** the primary action can be reached without leaving the dialog.
2. **Given** a desktop auth dialog, **When** the tabs are shown, **Then** the two tabs fill the tab row.

---

### User Story 6 - Finish small UI polish items (Priority: P3)

The site serves a favicon and avoids console noise on every page load.

**Why this priority**: Cosmetic but visible in the browser tab and console.

**Independent Test**: Load any page and confirm the favicon request succeeds without a 404.

## Edge Cases

- Display name contains 32 unbroken characters with no spaces.
- Viewport is 320px wide or 320×568 tall.
- Filter panel content is taller than the available viewport.
- Auth form is open with the software keyboard reducing available height.
- Legacy player and account player share the same display name.
- Account chip text is longer than the available header space.
- Leaderboard row and profile title use the longest allowed display name.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The primary desktop navigation MUST include a link to the leaderboard.
- **FR-002**: The mobile navigation menu MUST include a link to the leaderboard.
- **FR-003**: The active leaderboard link MUST be visually distinguishable from inactive links.
- **FR-004**: At 320px and 390px viewport widths, the page MUST NOT produce horizontal document scrolling for normal or maximum-length display names.
- **FR-005**: Header controls, including the account chip and mobile menu trigger, MUST remain fully visible at 320px.
- **FR-006**: Long display names MUST wrap or truncate in the profile title without widening stat cards.
- **FR-007**: Long display names MUST wrap or truncate in leaderboard rows without overflowing them.
- **FR-008**: Every zone tab, including GDDL, MUST be reachable at 320px.
- **FR-009**: The filter panel MUST remain within the viewport or scroll internally so Reset and Apply are reachable at 320×568.
- **FR-010**: The auth dialog MUST allow users to reach its primary and cancel actions at 320×568.
- **FR-011**: Auth tabs MUST fill the available tab row.
- **FR-012**: Account-backed local completions MUST be labeled `ACCOUNT`.
- **FR-013**: Legacy guest completions MUST be labeled `LEGACY`.
- **FR-014**: Leaderboard rows MUST distinguish legacy players from account players.
- **FR-015**: Account/legacy labeling MUST be consistent between level dialogs, profile, and leaderboard.
- **FR-016**: The site MUST serve a favicon and MUST NOT produce a favicon 404 on page load.
- **FR-017**: Fixes MUST reuse the existing design tokens and Radix primitives.
- **FR-018**: Existing catalog, profile, auth, and leaderboard behavior MUST NOT regress.

### Key Entities

- **Player kind**: Whether a player is backed by an account or is a preserved legacy guest profile.
- **Leaderboard entry**: A public player row that includes display name, points, status, completion count, and player kind.
- **Local completion**: A site-recorded completion whose label depends on the player kind.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The leaderboard is reachable in one navigation action from any page on desktop and mobile.
- **SC-002**: Zero horizontal document overflow at 320px and 390px with a 32-character unbroken display name.
- **SC-003**: Reset and Apply are fully visible or reachable through panel scrolling at 320×568.
- **SC-004**: Auth submit and cancel are reachable at 320×568.
- **SC-005**: 100% of tested account and legacy rows show the correct label in level dialogs and leaderboard.
- **SC-006**: The favicon request returns a successful response and the browser console has no favicon 404.
- **SC-007**: Automated accessibility checks report no new critical or serious violations.

## Assumptions

- The minimum supported viewport is 320×568.
- Display names may be up to 32 unbroken characters.
- Legacy players are identifiable from existing data; no historical records are rewritten.
- The brutalist visual system and Radix UI primitives remain unchanged.
- Account and legacy labels are user-facing terms; no new roles or permissions are introduced.
