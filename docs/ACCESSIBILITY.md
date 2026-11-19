# Accessibility Audit

Date: 2026-11-19

## Scope

Automated audit covers:

- catalog (desktop and mobile)
- level dialog
- auth gate and sign-in/create-account dialog
- signed-out and signed-in profile
- signed-in header account menu

Tooling: `@axe-core/playwright` against the running app at `http://localhost:5173`.

Run:

```bash
npm run dev:mock
npm run dev
npm run test:e2e -- tests/e2e/a11y.spec.ts
```

## Result

After fixes: **0 critical and 0 serious violations** in the audited views.

## Fixes applied

- Removed invalid `role="row"` from interactive catalog row buttons and replaced the
  pseudo-table roles with a list of labelled buttons. Row content supplies the accessible
  name.
- Added `forceMount` tab panels so Radix `Tabs` triggers reference existing
  `aria-controls` targets.
- Raised muted text opacity from 0.5–0.55 to 0.7 so small labels meet WCAG AA contrast
  on the cream background.
- Preserved keyboard coverage through Playwright tests for `/`, `⌘K`, arrow-key tabs,
  Escape close, focus return, filter popover, and sort menu.
- Added the auth dialog to the axe audit with labeled fields, tabbed sign-in/registration,
  inline field errors, and a disabled submitting state.
- The header account menu keeps its visible player text in the accessible name and exposes
  sign-out through the Radix dropdown menu.
- Added responsive checks at 320×568, 360×640, 375×667, 390×844, 844×390 landscape, and
  1440×900, including a 32-character unbroken display name. Every primary flow (catalog,
  filters, sort, level/progress dialogs, auth, profile) is checked for horizontal overflow
  and reachable actions. The progress control is a full-width progress bar with an inset
  thumb on mobile.

## Manual follow-up

A screen-reader spot check is still recommended before a public launch, particularly for
the combined local/imported completion list and the mobile navigation menu.
