# Quickstart Validation: AI-Assisted Client Behavior Tests

**Feature**: `006-ai-client-tests`  
**Date**: 2026-11-19

## Prerequisites

- Node.js 22+
- No process on ports 3001 or 5173
- Existing frontend dependencies installed

## Run the New Suite

From the repository root:

```bash
npm --workspace frontend run test:e2e -- tests/e2e/client-*.spec.ts
```

Expected: all client behavior specs pass without contacting a real external service.

Run the full client suites:

```bash
npm --workspace frontend run test
npm run test:e2e
```

## Scenario Checks

### Main journey

1. Open the catalog with a mocked successful level list.
2. Open a level and choose Update Progress while signed out.
3. Confirm the account gate is visible.
4. Create an account with valid data in the registration dialog.
5. Choose a progress value and save.
6. Confirm the visible best progress and then the profile show the same value.

Expected: the test reaches a visible result without any real backend.

### Validation and dialogs

1. Submit the registration form with empty fields.
2. Submit invalid email, short display name, and invalid password values.
3. Open the dialog, close with the close control, and reopen with Escape.
4. Mock a server conflict/error, submit valid data, and confirm the visible message.
5. Retry successfully.

Expected: messages are associated with the right fields and no request is sent for
client-side validation failures.

### Duplicate submission

1. Delay the registration response.
2. Click submit and press Enter while the request is pending.
3. Assert the request log has exactly one registration request.
4. Release the response.
5. Confirm exactly one success state.

Expected: one request and one visible result.

### UI states

1. Delay the catalog response and assert the loading state.
2. Release an empty response and assert the empty state.
3. Return a successful response and assert level rows.
4. Return an error and assert the error state.
5. Retry successfully and assert the error disappears.

Expected: each state is visible and distinct.

## Repeatability

Run the new suite twice:

```bash
npm --workspace frontend run test:e2e -- tests/e2e/client-*.spec.ts
npm --workspace frontend run test:e2e -- tests/e2e/client-*.spec.ts
```

Expected: both runs pass with no data coupling or duplicate-name failures.

## AI Review Check

Review the accepted tests against `specs/006-ai-client-tests/contracts/test-doubles.md`.
Remove any assertion that only checks component existence or internal implementation, and
confirm every criterion 7–11 has a visible-behavior test.
