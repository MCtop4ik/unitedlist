# Implementation Plan: AI-Assisted Client Behavior Tests

**Branch**: `006-ai-client-tests` | **Date**: 2026-11-19 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `/specs/006-ai-client-tests/spec.md`

## Summary

Add a focused browser-level client test suite that proves visible behavior rather than
component presence. A small stateful API test double intercepts client requests and can
return success, empty, delayed, or error responses. Tests cover the account and progress
forms, validation, dialog open/close, duplicate-submit protection, loading/empty/success/
error states, and one full user journey from opening a level to seeing saved progress.
The suite maps directly to criteria 7–11 and runs with the existing Playwright stack.

## Technical Context

**Language/Version**: TypeScript 5.7, React 19, Node.js 22  
**Primary Dependencies**: Existing Playwright, Vitest, React Testing Library; no new packages  
**Storage**: N/A for tests; API interactions are intercepted in the browser  
**Testing**: Playwright browser tests with request interception; client unit/integration suite remains Vitest  
**Target Platform**: Existing web client at desktop viewport for the primary suite; mobile behavior already covered by the responsive suite  
**Project Type**: Web application monorepo (`frontend/`)  
**Performance Goals**: The main journey test completes in under 10 seconds; no fixed sleeps; delayed responses are controlled explicitly  
**Constraints**: Tests must assert visible behavior, not existence-only; no real external services; deterministic mocked responses; unique test data per run  
**Scale/Scope**: Four focused client specs plus one reusable mock-API helper; no production feature changes unless duplicate submission exposes a bug

## Constitution Check

| Principle | Assessment | Evidence |
|-----------|------------|----------|
| I. Design System Source of Truth | PASS | Tests use the existing rendered UI; no visual changes |
| II. TypeScript & Minimal Dependencies | PASS | Existing Playwright/Vitest stack; no new packages |
| III. Radix UI First | PASS | Tests interact through real Radix dialogs/menus rendered by the app |
| IV. UX, Accessibility & Responsiveness | PASS | Tests assert visible messages, dialog states, focus-relevant controls, and loading/error feedback |
| V. Modularity, Reuse & Compliance | PASS | One reusable API test double; no duplicated per-test mock logic |

**Result**: No violations. No complexity tracking required.

**Post-design re-check**: PASS. The design adds tests and one test helper; no production
architecture changes unless the duplicate-submit test proves a real guard is missing.

## Project Structure

```text
frontend/
├── tests/e2e/
│   ├── support/
│   │   ├── mock-api.ts          # stateful request interception + request log
│   │   └── account.ts           # existing account fixture (reused where useful)
│   ├── client-journey.spec.ts   # full action-to-visible-result scenario
│   ├── client-forms.spec.ts     # display, input, validation, dialog open/close
│   ├── client-duplicate-submit.spec.ts
│   └── client-states.spec.ts    # loading, empty, success, error, retry
└── src/
    └── features/auth/AuthDialog.tsx  # only if duplicate-submit guard is needed
```

**Structure Decision**: Use Playwright because the requirement is visible behavior plus
controlled server responses. A single `mock-api.ts` helper owns route interception, response
variants, delays, and request counting. Tests remain small and read as user journeys.

## Implementation Notes

1. **Mock API helper**: Create `frontend/tests/e2e/support/mock-api.ts` with:
   - minimal catalog/level/profile fixtures;
   - request handlers for levels, level detail, completions, register/login, me, progress,
     player profile, and source status;
   - a per-test request log;
   - configurable response behavior: `success`, `empty`, `error`, `delay`, and deferred
     release.
2. **Main journey**: `client-journey.spec.ts` opens a level, opens the account gate,
   creates an account, chooses progress, saves, and asserts the visible best percentage and
   profile result. All server responses are intercepted.
3. **Forms and dialogs**: `client-forms.spec.ts` asserts dialog open/close, required fields,
   invalid email/name/password, field errors, server errors, retry, and success.
4. **Duplicate submit**: `client-duplicate-submit.spec.ts` delays registration, attempts a
   double click and Enter during the pending state, asserts exactly one POST in the request
   log, releases the response, and asserts one visible success result. If the current form
   can still invoke twice before re-render, add a synchronous in-flight guard in
   `AuthDialog.tsx` and re-run.
5. **States**: `client-states.spec.ts` covers loading (deferred response), empty catalog,
   success data, error with retry, and retry success.
6. **Coverage map**: Add a short test-coverage section/comment linking tests to criteria
   7–11 so reviewers can verify the requested mapping.
7. **AI review**: Treat generated assertions as drafts; keep only behavior-level checks and
   remove existence-only or implementation-coupled tests.

## Verification

- Targeted: `npm --workspace frontend run test:e2e -- tests/e2e/client-*.spec.ts`
- Full client: `npm test` and `npm run test:e2e`
- Repeat the new suite to confirm deterministic behavior.
- Confirm no existing client or backend tests regress.

## Complexity Tracking

No constitution violations.
