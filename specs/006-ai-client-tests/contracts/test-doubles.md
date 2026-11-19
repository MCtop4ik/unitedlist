# Contract: Client Test Doubles and Coverage

**Feature**: `006-ai-client-tests`  
**Date**: 2026-11-19

## Network Interception Contract

The client test double intercepts the existing public API shapes. No production endpoint
changes are required.

| Request | Success data |
|---------|--------------|
| `GET /api/levels` | Paginated levels with a deterministic fixture |
| `GET /api/levels/:levelId` | Level detail for the opened level |
| `GET /api/levels/:levelId/completions` | Completion list (can be empty) |
| `GET /api/source-status` | Three healthy source rows |
| `POST /api/auth/register` | `AccountSession` with player + token |
| `POST /api/auth/login` | `AccountSession` |
| `GET /api/auth/me` | Current player/account |
| `POST /api/progress` | Progress DTO with chosen percentage |
| `GET /api/players/:id` | Player profile with completion/progress counts |
| `GET /api/players/:id/progress` | Progress list including the saved percentage |
| `GET /api/players/:id/completions` | Completion list (can be empty) |

Behavior modes:

- **success**: return the fixture with `200`/`201`.
- **empty**: return an empty data array with a valid paginated envelope.
- **error**: return `{ error: { code, message } }` with the configured status.
- **delayed**: hold the response until the test explicitly releases it.
- **request log**: every intercepted request records method, path, and body for assertions.

## Visible UI Contract

- Form submission pending state shows a visible working label and a disabled submit.
- Validation messages are attached to the corresponding field.
- Dialogs open and close through visible controls and Escape.
- Loading state is visible before a delayed response is released.
- Empty state is explicit.
- Success state shows the submitted/saved data.
- Error state shows a message and a retry action.

## Coverage Map (Criteria 7–11)

| Criterion | Required proof | Planned test |
|-----------|----------------|--------------|
| 7 | Duplicate submit during pending does not create a second request | Delayed register + double click/Enter + request log count = 1 |
| 8 | Display, clicks, input, dialog open/close | Form/dialog interaction spec |
| 9 | Required fields, invalid input, error messages | Registration validation spec |
| 10 | Loading, empty, success, error with substituted responses | Catalog state spec with success/empty/delay/error/retry |
| 11 | Full client journey from action to visible result | Level → auth gate → account → progress → visible best/profile |

## Constraints

- No fixed sleeps; delays are released by the test.
- No real external services or persistent test data.
- No assertions that only check component existence.
- Unique account identifiers per run.
- The suite must pass on repeated runs.
