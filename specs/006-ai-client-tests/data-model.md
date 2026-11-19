# Phase 1 Data Model: AI-Assisted Client Behavior Tests

**Feature**: `006-ai-client-tests`  
**Date**: 2026-11-19

## Overview

No application data model changes. This feature adds test-double state and observable UI
states.

```text
MockApi
  ├── fixtures (levels, level detail, profile)
  ├── requestLog[]
  └── response behavior (success | empty | error | delayed)

Test scenario -> user actions -> intercepted requests -> visible UI state
```

## Test-Double Entities

### Mock API

| Field | Type | Purpose |
|-------|------|---------|
| `fixtures` | minimal catalog/level/profile objects | Deterministic visible data |
| `requests` | `{ method, url, body }[]` | Proves request counts and payloads |
| `behavior` | `success` / `empty` / `error` / `delayed` | Per-endpoint response mode |
| `release` | deferred function | Releases a delayed response explicitly |
| `errorStatus` | number | HTTP status for error scenarios |

### Test Scenario

| Field | Type | Purpose |
|-------|------|---------|
| `name` | string | Behavior under test |
| `steps` | user actions | Open, click, type, submit, close |
| `mocked` | Mock API behavior | Controlled server data |
| `expectedVisible` | text/role/state | Observable outcome |
| `expectedRequests` | count | Duplicate-submit assertions |

### Form Validation Case

| Field | Constraint | Visible outcome |
|-------|------------|-----------------|
| Email | Required, valid address | Field error when empty/invalid |
| Display name | Required, 2–32 trimmed characters | Field error outside range |
| Password | Required, 8–128, not whitespace-only | Field error and no request |
| Server conflict | Duplicate email/name | Visible server message, form usable |
| Progress percent | 1–99 | Slider/input constrained; value visible |

## UI State Machine (Catalog)

```text
[idle] --request--> [loading] --success--> [data]
                         ├──empty response--> [empty]
                         ├──error response--> [error] --retry--> [loading]
                         └──delayed response stays [loading] until released
```

## UI State Machine (Form Submission)

```text
[editing] --valid submit--> [pending] --success--> [closed/success]
                               ├──error--> [editing + visible error]
                               ├──second submit--> ignored (no request)
                               └──cancel/close--> [closed]
```

## Invariants

- A pending form submission produces exactly one request even if the user attempts another
  submit or presses Enter again.
- Validation failures produce no network request.
- Delayed responses show loading until explicitly released.
- Empty responses show an explicit empty state, not blank content.
- Error responses show a visible error and a retry path.
- Tests use unique identifiers per run and reset mock state between tests.
