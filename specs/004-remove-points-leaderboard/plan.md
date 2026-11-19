# Implementation Plan: Remove Points and Leaderboard

**Branch**: `004-remove-points-leaderboard` | **Date**: 2026-11-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/004-remove-points-leaderboard/spec.md`

## Summary

Remove the points system end to end: point calculation, points-derived skill statuses,
overall player positions, points on profiles and completion lists, and the site-wide
leaderboard. Keep accounts, authentication, completions, progress, imported records, and
catalog browsing intact. Points and rank are derived values today, so no database balance
or rank column needs migration; the change is a DTO, computation, route, and UI removal
plus preservation of existing records.

## Technical Context

**Language/Version**: TypeScript 5.7, React 19, Node.js 22  
**Primary Dependencies**: Express, better-sqlite3, Zod, Radix UI, React Router; no new dependencies  
**Storage**: SQLite unchanged; points/rank are not stored columns, so no destructive migration  
**Testing**: Vitest, Supertest, Playwright, axe-core  
**Target Platform**: Existing web application, desktop and mobile  
**Project Type**: Web application monorepo (`backend/`, `frontend/`, `shared/`, `mock/`)  
**Performance Goals**: No regression; removal of per-request ranking work should be neutral or faster  
**Constraints**: Preserve all account, completion, progress, imported-record, and catalog data; breaking change for clients consuming points/rank/leaderboard; update product surfaces together  
**Scale/Scope**: One backend DTO/route removal, one frontend page/nav removal, shared-type cleanup, mock and test updates, docs cleanup

## Constitution Check

| Principle | Assessment | Evidence |
|-----------|------------|----------|
| I. Design System Source of Truth | PASS | Removals only; remaining profile cards and lists keep existing tokens |
| II. TypeScript & Minimal Dependencies | PASS | No new packages; remove dead modules and types |
| III. Radix UI First | PASS | Existing Radix navigation/dialog/tabs remain; no custom controls added |
| IV. UX, Accessibility & Responsiveness | PASS | Profile and completion lists must keep clean empty/loading/error states and responsive layouts |
| V. Modularity, Reuse & Compliance | PASS | Remove the ranking module and leaderboard page rather than leaving unused code; keep player-kind/source labels |

**Result**: No violations. No complexity tracking required.

**Post-design re-check**: PASS. The design preserves data, removes derived mechanics, and
keeps existing Radix/design-system surfaces.

## Project Structure

```text
backend/
├── src/
│   ├── app.ts                              # remove leaderboard route
│   ├── domain/
│   │   ├── players.ts                      # remove points/status/rank fields
│   │   ├── records.ts                      # remove playerPoints/playerStatus
│   │   └── ranking.ts                      # remove module
│   └── http/routes/
│       └── leaderboard.ts                  # remove module
├── tests/
│   ├── integration/leaderboard.test.ts     # remove
│   └── integration/players.test.ts         # update DTO expectations
└── package.json                            # no new scripts

frontend/
├── src/
│   ├── app/App.tsx                         # remove /leaderboard route
│   ├── components/layout/AppChrome.tsx     # remove leaderboard nav/menu entries
│   ├── features/leaderboard/LeaderboardPage.tsx # remove
│   ├── features/profile/ProfilePage.tsx    # remove points/rank cards and point/status labels
│   ├── features/level/LevelDialog.tsx      # remove points/status text
│   ├── lib/api/client.ts                   # remove leaderboard call
│   ├── lib/ranking/points.ts               # remove
│   └── lib/ranking/points.test.ts          # remove
└── tests/
    ├── e2e/leaderboard.spec.ts             # remove/update
    ├── e2e/navigation.spec.ts              # remove leaderboard nav expectations
    ├── e2e/a11y.spec.ts                    # remove leaderboard audit step
    ├── integration/ranking.test.ts         # remove
    └── integration/recalc-script.test.ts   # remove

shared/
└── types.ts                                # remove Status, LeaderboardEntry, points/rank fields

mock/
└── server.ts                               # remove points/rank/leaderboard, keep playerKind

scripts/
└── recalculate-rankings.ts                 # remove
```

**Structure Decision**: Keep the existing frontend/backend split. Delete the ranking and
leaderboard modules rather than leaving dead exports, remove derived fields from the
shared public types, and update every producer/consumer in the same change.

## Implementation Notes

1. **Shared contract**: Remove `Status`, `LeaderboardEntry`, `Player.points`,
   `Player.status`, `Player.leaderboardRank`, `LocalCompletion.playerStatus`, and
   `LocalCompletion.playerPoints`. Keep `PlayerKind`, `VerificationStatus`, progress,
   completion counts, and best completion.
2. **Backend player profile**: Build the player DTO from `players`, completions, and
   progress only. Compute `completionCount`, `progressCount`, and `bestCompletion`; do not
   call ranking logic.
3. **Backend completions**: Return player identity, `playerKind`, level, date, and video
   URL. Do not compute points or player status. Keep imported records and verification
   labels unchanged.
4. **Leaderboard removal**: Delete the leaderboard route, its app registration, the shared
   entry type, the frontend page/route, API client method, and desktop/mobile navigation
   entries. Remove the explicit `/leaderboard` route so the existing catch-all renders the
   catalog; no stale leaderboard content remains.
5. **Points mechanics**: Delete `backend/src/domain/ranking.ts`,
   `frontend/src/lib/ranking/points.ts`, `scripts/recalculate-rankings.ts`, the
   `recalculate` package script, and their tests. Remove any "awards no points" copy and
   points/status labels.
6. **Profile UI**: Keep display name, member date, completion count, progress count, and
   best clear. Lay out three stat cards responsively; remove the points/rank cards and
   any "0 PTS" / "unranked" placeholders.
7. **Completion UI**: Keep player name, account/legacy label, imported source and
   verification labels. Remove points and points-derived skill status from level dialogs
   and profile completion rows.
8. **Mock parity**: Remove mock points/status/rank computation and the leaderboard
   endpoint; keep account/session, player-kind, progress, and completion behavior.
9. **Docs**: Update README, backend README, ARCHITECTURE, PRD, and ACCESSIBILITY to remove
   points, rank, and leaderboard claims; keep records/auth descriptions.
10. **Data preservation**: No schema migration. Existing completions, progress, imported
    records, and account sessions are untouched.

## Verification

- Backend tests: profile DTO has no points/status/rank; completions have no points/status;
  records still save; leaderboard route is absent.
- Frontend tests: profile and level views contain no points/rank/status; nav/menu have no
  leaderboard; direct `/leaderboard` falls back to catalog.
- Existing auth, progress, completion, catalog, accessibility, and mobile suites pass.
- Commands: `npm run typecheck`, `npm run lint`, `npm test`, `npm run test:e2e`,
  `npm run test:e2e:backend`.
- Quickstart checks for preserved data and removed fields.

## Complexity Tracking

No constitution violations.
