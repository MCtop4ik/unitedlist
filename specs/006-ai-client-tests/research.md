# Phase 0 Research: AI-Assisted Client Behavior Tests

**Feature**: `006-ai-client-tests`  
**Date**: 2026-11-19

All unknowns are resolved. No `NEEDS CLARIFICATION` markers remain.

## 1. Test layer

- **Decision**: Use Playwright browser tests for the new behavior suite, with request
  interception for all server responses.
- **Rationale**: The requirement is visible UI behavior, dialog transitions, and
  network-state substitution. Playwright exercises the real rendered forms and dialogs and
  can control responses at the network boundary without mocking React internals.
- **Alternatives considered**:
  - Vitest + Testing Library: good for isolated form logic, but would require mocking the
    API module and providers repeatedly; less direct proof of dialog/network behavior.
  - Real backend: cannot deterministically produce delayed, empty, and error responses.

## 2. Server response substitution

- **Decision**: Add one stateful `mock-api.ts` helper that intercepts `/api/**` routes,
  returns minimal fixtures, records requests, and supports success, empty, error, delayed,
  and deferred-release responses.
- **Rationale**: A shared helper keeps every test deterministic, avoids duplicated route
  code, and makes request counts (duplicate-submit proof) reliable.
- **Alternatives considered**:
  - Per-test inline `page.route` handlers: repetitive and easy to drift.
  - Reuse the development mock server: cannot inject delays/errors per test and persists
    data between runs.

## 3. Duplicate-submit protection

- **Decision**: Submit the registration form twice during a delayed response (button click
  and Enter), assert exactly one `POST /api/auth/register` in the request log, then release
  the response and assert one success result. If the UI invokes twice before re-render, add
  a synchronous in-flight guard in `AuthDialog.tsx`.
- **Rationale**: Relying only on a disabled attribute can leave a same-tick double-click
  race. The request log proves the visible loading state actually prevents duplicate work.
- **Alternatives considered**:
  - Only assert the button is disabled: does not prove no second request was sent.
  - Debounce the submit: changes behavior and complicates error retry.

## 4. Delay and determinism

- **Decision**: Use deferred promises in route handlers; assert loading, then release the
  response explicitly. Never use arbitrary sleeps.
- **Rationale**: Deferred release proves the loading state before completion and makes the
  test fast and deterministic.
- **Alternatives considered**:
  - `waitForTimeout`: flaky and does not prove the intermediate state.
  - Real network latency: non-deterministic.

## 5. Validation coverage

- **Decision**: Exercise the real registration/sign-in forms for required fields, invalid
  email, display-name length, password length/whitespace, field-specific errors, server
  error, and retry.
- **Rationale**: These are visible user behaviors and already implemented client-side; the
  tests should protect them.
- **Alternatives considered**:
  - Unit-testing validation helpers only: does not prove messages are associated with the
    form fields or that no request is sent.

## 6. UI state coverage

- **Decision**: Cover four catalog states with the mock API: delayed loading, empty result,
  successful rows, and error with a successful retry.
- **Rationale**: These states are visible in the product and map directly to criterion 10.
- **Alternatives considered**:
  - Only success/error: misses the empty and loading requirements.
  - Screenshot-only assertions: brittle and not semantic.

## 7. Main journey

- **Decision**: One test performs: open GRIEF → account gate → create account → open
  progress → select a value → save → see best progress → open profile → see the saved
  progress.
- **Rationale**: This is the required action-to-visible-result scenario and covers forms,
  dialogs, network writes, and result rendering together.
- **Alternatives considered**:
  - Separate partial journeys: does not prove the integrated flow.
  - Real backend: slower and not deterministic for error/duplicate variants.

## 8. AI-proposed test review

- **Decision**: Treat generated tests as drafts; map every accepted test to criteria 7–11
  and reject assertions that only check component existence or implementation details.
- **Rationale**: The requirement explicitly asks for AI-proposed checks to be reviewed and
  refined; a coverage map makes gaps visible.
- **Alternatives considered**:
  - Accept generated tests wholesale: risks shallow or brittle coverage.

## 9. Test isolation

- **Decision**: Use unique account/display names per run and reset mock state in
  `beforeEach`; each test creates its own page routes via the helper.
- **Rationale**: Prevents cross-test data coupling and makes repeated runs reliable.
- **Alternatives considered**:
  - Shared seeded data: creates order dependence and duplicate-name failures.
