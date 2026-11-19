# Implementation Plan: UI Resilience Bugfixes

**Branch**: `003-ui-bugfixes` | **Date**: 2026-11-19 | **Spec**: [spec.md](./spec.md)

**Input**: UI audit from `specs/003-ui-bugfixes/spec.md`.

## Summary

Fix the UI defects found in the audit without changing the product model: add the missing
leaderboard navigation entry, make the header/profile/leaderboard resilient to long names
and 320px viewports, keep the filter panel and auth actions reachable on short screens,
distinguish account records from legacy guest records, and add a favicon. The work uses
the existing React/CSS/Radix stack and existing design tokens.

## Technical Context

**Language/Version**: TypeScript 5.7, React 19, Node.js 22  
**Primary Dependencies**: React Router, Radix UI, existing CSS tokens; no new dependencies  
**Storage**: Existing SQLite accounts/players; no schema changes required for player-kind labels  
**Testing**: Vitest, Playwright, axe-core; existing browser matrix (desktop, 390×844, 320×568, 375×667)  
**Target Platform**: Current desktop and mobile browsers, minimum 320×568  
**Project Type**: Web application monorepo (`frontend/`, `backend/`, `shared/`)  
**Performance Goals**: No measurable regression in catalog render or page navigation  
**Constraints**: Preserve brutalist design tokens and Radix primitives; no horizontal page overflow; no new dependencies  
**Scale/Scope**: UI-focused; one backend DTO refinement for player kind

## Constitution Check

| Principle | Assessment | Evidence |
|-----------|------------|----------|
| I. Design System Source of Truth | PASS | Fixes only adjust existing layout/CSS tokens; no new visual language |
| II. TypeScript & Minimal Dependencies | PASS | Strict TypeScript; no new packages |
| III. Radix UI First | PASS | Existing nav, popover, dialog, and tabs primitives remain |
| IV. UX, Accessibility & Responsiveness | PASS | This feature directly fixes responsive and reachability defects; axe coverage retained |
| V. Modularity, Reuse & Compliance | PASS | CSS fixes stay in `global.css`; player-kind labels use shared types and existing badges |

**Result**: No violations; no complexity tracking required.

## Project Structure

```text
frontend/
├── src/
│   ├── components/layout/AppChrome.tsx       # leaderboard nav entry
│   ├── components/shared/Badges.tsx          # account/legacy badge if needed
│   ├── features/leaderboard/LeaderboardPage.tsx
│   ├── features/level/LevelDialog.tsx
│   ├── features/profile/ProfilePage.tsx
│   ├── features/auth/AuthDialog.tsx
│   ├── styles/global.css                     # responsive/layout fixes
│   └── index.html                            # favicon link
├── public/favicon.svg                        # new asset
└── tests/e2e/
    ├── navigation.spec.ts
    ├── ui-resilience.spec.ts
    └── auth-security.spec.ts                 # existing flows remain green

backend/
├── src/domain/ranking.ts                     # leaderboard playerKind
├── src/domain/records.ts                     # completion playerKind
└── tests/                                    # DTO/label tests

shared/
└── types.ts                                  # player kind on public DTOs
```

## Implementation Notes

1. **Navigation**: Add `Leaderboard` as a `NavLink` in the desktop nav and as a menu item
   in the mobile Radix dropdown. It uses the same active-link styling as Catalog/Profile.
2. **Header overflow**: Give header flex children `min-width: 0`; make the wordmark
   shrinkable; cap the account chip width and use ellipsis. At very narrow widths, hide
   the wordmark subtitle before controls clip.
3. **Profile overflow**: Set `min-width: 0` on profile hero children and allow
   `overflow-wrap: anywhere` on the title so the stats grid cannot be widened by one
   unbroken name.
4. **Leaderboard overflow**: Set `min-width: 0` on grid cells and allow the name to wrap
   or ellipsize inside the row.
5. **Zone tabs**: At mobile widths, allow the tab row to wrap or make the horizontal
   scroll affordance visible; ensure GDDL is reachable without a hidden gesture.
6. **Filter panel**: Add a viewport-relative max height and `overflow-y: auto` to the
   popover so Reset/Apply remain reachable on 320×568.
7. **Auth dialog**: Keep the header fixed and make the body/actions scrollable or sticky
   within the dialog's `92vh` max height, so submit/cancel are reachable. Make auth tabs
   `flex: 1` so two tabs fill the row.
8. **Player kind labels**: Add `playerKind: 'account' | 'legacy'` to public leaderboard
   entries and local completion DTOs, derived from the existing `accounts` table. Update
   frontend labels so level dialogs, profile, and leaderboard agree. Do not rewrite
   historical rows.
9. **Favicon**: Add `frontend/public/favicon.svg` and reference it in `index.html`.

## Verification

- Playwright: navigation reachability, 390px/320px overflow measurements with a 32-char
  name, filter Apply visibility at 320×568, auth action reachability, account/legacy
  labels, and favicon response.
- Backend: DTO tests for `playerKind` on completions and leaderboard.
- Existing suites: `npm run typecheck`, `npm run lint`, `npm test`,
  `npm run test:e2e`, `npm run test:e2e:backend`.
- Visual re-check at 1440×900, 390×844, 375×667, 360×640, 320×568.

## Complexity Tracking

No constitution violations.
