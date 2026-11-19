# Phase 0 Research: Remove Points and Leaderboard

**Feature**: `004-remove-points-leaderboard`  
**Date**: 2026-11-19

All unknowns are resolved. No `NEEDS CLARIFICATION` markers remain.

## 1. Scope of “all points mechanics”

- **Decision**: Remove point calculation, point awards, points-based sorting/recalculation,
  points-derived skill statuses, overall player positions, and every points/rank/status
  display. Keep completion counts, progress, and best clear.
- **Rationale**: Skill statuses and rank are derived entirely from points, so leaving them
  would leave the mechanic partially alive and visibly inconsistent. Completion count,
  progress, and best clear are activity facts rather than points.
- **Alternatives considered**:
  - Keep statuses with fixed labels: they would be meaningless without points.
  - Keep completion count as a score-like proxy for sorting: it is an activity fact and
    remains available, but is not presented as points or rank.

## 2. Data migration

- **Decision**: No database migration. Points and rank are derived at read time; there is
  no stored points balance or rank column to drop.
- **Rationale**: Removing derived fields preserves accounts, completions, progress,
  imported records, and sessions without destructive schema work.
- **Alternatives considered**:
  - Add and then drop columns: unnecessary and risks data loss.
  - Recompute totals once and store them: opposite of the requested removal.

## 3. Profile information architecture

- **Decision**: Profile keeps display name, member date, completion count, progress count,
  and best clear. It removes points, site rank, and skill badge. The stat area becomes a
  three-card layout on desktop and responsive two-column/one-column layout as needed.
- **Rationale**: These are the remaining personal activity facts and keep the profile
  useful after the points mechanic is removed.
- **Alternatives considered**:
  - Empty profile stats: loses useful activity data.
  - Keep completion count but label it as a score: contradicts the request.

## 4. Completion list contract

- **Decision**: Remove `playerPoints` and `playerStatus` from local completion records and
  from the UI. Keep player name, `playerKind` (`account`/`legacy`), completion date, and
  imported source/verification labels.
- **Rationale**: The level dialog remains a record of who cleared a level, without a score
  or skill judgment. Player-kind labels are identity/source facts and remain useful.
- **Alternatives considered**:
  - Keep status only: it is points-derived and would require hidden point data.
  - Remove account/legacy labels too: unrelated to points and still useful.

## 5. Leaderboard removal and old URLs

- **Decision**: Remove the page, route, desktop link, mobile menu item, API method, backend
  route, and shared entry type. Remove the explicit `/leaderboard` route; the app's existing
  catch-all renders the catalog for that URL.
- **Rationale**: Direct bookmarks must not expose stale leaderboard content, while falling
  back to the catalog avoids a dead-end 404.
- **Alternatives considered**:
  - Redirect to profile: profile has no ranking replacement.
  - Leave the route with an empty state: keeps a points feature surface alive.

## 6. Points sorting and recalculation

- **Decision**: Remove points-based sorting and all recalculation tooling. Keep catalog
  sorts that are not points-based (`global`, `zone`, `name`, `completions`).
- **Rationale**: The catalog sort menu does not expose a points sort today, but any
  internal points ordering/recalculation must go. Completion-count sorting is unaffected.
- **Alternatives considered**:
  - Keep the recalculation command as a no-op: dead tooling invites confusion.

## 7. Backward compatibility

- **Decision**: Treat this as an intentional breaking change for clients consuming points,
  rank, status, or leaderboard data. Update all product surfaces together; document the
  removal.
- **Rationale**: Keeping removed fields as zeros/nulls would violate "remove everywhere"
  and hide the change.
- **Alternatives considered**:
  - Compatibility shims returning `points: 0`: explicitly rejected by the request.

## 8. Data and test preservation

- **Decision**: Preserve existing rows and sessions. Remove points/leaderboard tests and
  add absence checks (no points/rank/status in DTOs or views; old leaderboard URL does not
  show a leaderboard; records survive).
- **Rationale**: The feature removes a mechanic, not user data. Regression tests should
  prove both removal and preservation.
- **Alternatives considered**:
  - Only delete tests: loses proof that records and auth still work.
  - Keep leaderboard tests against a hidden route: contradicts the scope.
