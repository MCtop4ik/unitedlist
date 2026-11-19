# Contract: Authentication API

**Feature**: `002-real-account-auth`  
**Base URL**: `/api`  
**Content type**: `application/json`

All successful responses use the existing `{ data: ... }` envelope. All errors use:

```json
{ "error": { "code": "STRING_CODE", "message": "Human-readable message", "field": "optionalField" } }
```

## Shared Types

```ts
interface AccountSession {
  data: Player;                 // public player shape, never email/password
  account: { email: string };   // owner-only
  token: string;                // opaque bearer token
  expiresAt: string;            // ISO-8601
}

interface AuthMe {
  data: { player: Player; account: { email: string } };
  expiresAt: string;
}

interface Player {
  id: string;
  displayName: string;
  points: number;
  status: 'ROOKIE' | 'PLAYER' | 'SKILLED' | 'EXTREME' | 'LEGEND';
  createdAt: string;
  leaderboardRank: number | null;
  completionCount?: number;
  progressCount?: number;
  bestCompletion?: Level | null;
}
```

## Authentication

Protected endpoints require:

```http
Authorization: Bearer <token>
```

The token is an opaque 32-byte random value. The server stores only its SHA-256 hash.
Sessions expire after 30 days without use; each successful authenticated request extends
the expiry by 30 days. Signing out revokes only the presented token.

## Endpoints

### `POST /api/auth/register`

Create a durable account and sign in immediately.

**Request**

```json
{
  "email": "player@example.com",
  "displayName": "PLAYER_ONE",
  "password": "correct horse battery staple"
}
```

**Validation**

- `email`: valid email format, trimmed, max 254 characters, normalized for uniqueness.
- `displayName`: trimmed, 2–32 characters, unique among accounts ignoring case and
  whitespace.
- `password`: 8–128 characters, not only whitespace.

**Success — `201 Created`**

```json
{
  "data": {
    "id": "acct_1a2b3c4d",
    "displayName": "PLAYER_ONE",
    "points": 0,
    "status": "ROOKIE",
    "createdAt": "2026-11-19T12:00:00.000Z",
    "leaderboardRank": null,
    "completionCount": 0,
    "progressCount": 0,
    "bestCompletion": null
  },
  "account": { "email": "player@example.com" },
  "token": "<opaque-token>",
  "expiresAt": "2026-12-19T12:00:00.000Z"
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Invalid email, display name, or password; `field` identifies the input |
| 409 | `EMAIL_TAKEN` | Normalized email already registered |
| 409 | `DISPLAY_NAME_TAKEN` | Normalized display name already registered |
| 429 | `RATE_LIMITED` | Too many auth requests or blocked after failed sign-ins |

### `POST /api/auth/login`

Sign in to an existing account.

**Request**

```json
{ "email": "player@example.com", "password": "correct horse battery staple" }
```

**Success — `200 OK`**

Same body as registration.

**Errors**

| Status | Code | When |
|--------|------|------|
| 400 | `VALIDATION_ERROR` | Missing or malformed input |
| 401 | `INVALID_CREDENTIALS` | Unknown email or wrong password; the same message is used for both |
| 429 | `RATE_LIMITED` | Five failures in 15 minutes, or too many auth requests; `message` states when to retry |

### `POST /api/auth/logout`

Revoke the presented session.

**Request headers**: `Authorization: Bearer <token>`

**Success — `204 No Content`**

Other sessions for the same account remain valid.

**Errors**

| Status | Code | When |
|--------|------|------|
| 401 | `TOKEN_REQUIRED` | No bearer token |
| 401 | `TOKEN_INVALID` | Missing, unknown, expired, or revoked session |

### `GET /api/auth/me`

Return the current account and player, and validate the stored token on page load.

**Request headers**: `Authorization: Bearer <token>`

**Success — `200 OK`**

```json
{
  "data": {
    "player": {
      "id": "acct_1a2b3c4d",
      "displayName": "PLAYER_ONE",
      "points": 5000,
      "status": "SKILLED",
      "createdAt": "2026-11-19T12:00:00.000Z",
      "leaderboardRank": 3,
      "completionCount": 1,
      "progressCount": 0,
      "bestCompletion": null
    },
    "account": { "email": "player@example.com" }
  },
  "expiresAt": "2026-12-19T12:00:00.000Z"
}
```

**Errors**

| Status | Code | When |
|--------|------|------|
| 401 | `TOKEN_REQUIRED` | No bearer token |
| 401 | `TOKEN_INVALID` | Missing, unknown, expired, or revoked session |

## Changed Write Endpoints

Both endpoints now require an account session. The server derives the player from the
session and ignores any `playerId` in the body. Guest tokens are no longer accepted.

### `POST /api/progress`

```http
Authorization: Bearer <token>
```

```json
{ "levelId": 149992717, "percent": 91 }
```

**Success — `200 OK`**

```json
{ "data": { "id": "progress_...", "playerId": "acct_1a2b3c4d", "levelId": 149992717, "percent": 91, "updatedAt": "2026-11-19T12:00:00.000Z" } }
```

**Errors**: `400 VALIDATION_ERROR`, `400 LEVEL_NOT_FOUND`,
`401 TOKEN_REQUIRED`, `401 TOKEN_INVALID`.

### `POST /api/completions`

```http
Authorization: Bearer <token>
```

```json
{ "levelId": 149992717, "videoUrl": null }
```

**Success — `201 Created` on first record, `200 OK` on an idempotent repeat**

Returns the existing local completion DTO.

**Errors**: `400 VALIDATION_ERROR`, `400 LEVEL_NOT_FOUND`,
`401 TOKEN_REQUIRED`, `401 TOKEN_INVALID`.

## Removed Endpoint

`POST /api/players` is removed. No replacement accepts a display name without
credentials. Requests to it receive `404 NOT_FOUND`. Public player reads remain:

- `GET /api/players/:playerId`
- `GET /api/players/:playerId/completions`
- `GET /api/players/:playerId/progress`
- `GET /api/leaderboard`
- `GET /api/levels`
- `GET /api/levels/:levelId`
- `GET /api/levels/:levelId/completions`

None of these include email, password hashes, or session data.

## Error Codes Summary

| Code | Status | Meaning |
|------|--------|---------|
| `VALIDATION_ERROR` | 400 | Invalid request input |
| `LEVEL_NOT_FOUND` | 400 | Write references an unknown level |
| `INVALID_CREDENTIALS` | 401 | Unknown email or wrong password |
| `TOKEN_REQUIRED` | 401 | Protected endpoint called without a bearer token |
| `TOKEN_INVALID` | 401 | Session is unknown, expired, or revoked |
| `EMAIL_TAKEN` | 409 | Email already registered |
| `DISPLAY_NAME_TAKEN` | 409 | Display name already registered |
| `RATE_LIMITED` | 429 | Auth throttling or too many auth requests |
| `NOT_FOUND` | 404 | Removed/unknown route |

## Security Notes

- Passwords are never echoed, logged, or returned.
- Session tokens are returned once at register/login and stored only as hashes.
- `Authorization` and `Cookie` headers are redacted in logs.
- Auth endpoints are rate-limited globally (20 requests/minute/IP) and per account+IP
  after failed sign-ins (5 failures/15 minutes blocks for 15 minutes).
- Public responses never contain account email addresses.
