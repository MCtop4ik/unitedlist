# API Contract — Production Backend

Base path: `/api`. JSON over HTTPS. All list endpoints are paginated. Dates are ISO 8601.

## Authentication

Public reads need no authentication.

`POST /api/players` returns a device token. Write endpoints require:

```http
Authorization: Bearer <guest-token>
```

The server derives the player from the token and ignores any client-supplied `playerId`.
Only a SHA-256 hash of the token is stored. Tokens are device-scoped with no recovery.

## Common types

```ts
type Zone = "all" | "pointercrate-main" | "pointercrate-extended" | "aredl" | "gddl";
type Status = "ROOKIE" | "PLAYER" | "SKILLED" | "EXTREME" | "LEGEND";

type Level = {
  levelId: number;
  name: string;
  author: string;
  zone: "pointercrate" | "aredl" | "gddl";
  zoneRank: number;
  globalRank: number;
  difficulty: string;
  length: "tiny" | "short" | "medium" | "long" | "xl";
  thumbnailUrl: string | null;
  videoUrl: string | null;
  song: string | null;
  completionCount: number;
};

type LocalCompletion = {
  id: string;
  recordType: "local";
  playerId: string;
  playerName: string;
  playerStatus: Status;
  playerPoints: number;
  levelId: number;
  levelName?: string | null;
  percent: 100;
  completedAt: string;
  videoUrl: string | null;
};

type ImportedCompletion = {
  id: string;
  recordType: "imported";
  source: "pointercrate" | "aredl" | "gddl";
  playerName: string;
  levelId: number;
  percent: number;
  completedAt: string | null;
  proofUrl: string | null;
  verificationStatus: "verified" | "stat" | "unknown";
};

type Completion = LocalCompletion | ImportedCompletion;
```

## `GET /api/levels`

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `zone` | Zone | `all` | `all` merges every level by `globalRank` |
| `q` | string | — | Matches level name or author |
| `difficulty` | string | — | Comma-separated exact source difficulties |
| `length` | string | — | Comma-separated lengths |
| `status` | string | — | `completed` / `in-progress` |
| `playerId` | string | — | Required when `status` is set |
| `sort` | string | `global` | `global`, `zone`, `name`, `completions` |
| `page` | number | 1 | 1-based |
| `perPage` | number | 50 | Maximum 100 |

Response:

```json
{
  "data": [
    {
      "levelId": 149992717,
      "name": "GRIEF",
      "author": "icedcave",
      "zone": "pointercrate",
      "zoneRank": 1,
      "globalRank": 1,
      "difficulty": "Extreme",
      "length": "xl",
      "thumbnailUrl": "https://levelthumbs.prevter.me/thumbnail/149992717/small",
      "videoUrl": "https://www.youtube.com/watch?v=gB8slBPlOjc",
      "song": "482872",
      "completionCount": 1204
    }
  ],
  "page": 1,
  "perPage": 50,
  "total": 10247,
  "totalPages": 205
}
```

Errors: `400` invalid query, or `status` without `playerId`.

## `GET /api/levels/{levelId}`

Returns one full `Level` plus:

```json
{
  "data": {
    "level": { "levelId": 149992717, "name": "GRIEF" },
    "zoneView": "pointercrate-main",
    "completionCount": 1204,
    "localCompletionCount": 12,
    "importedCompletionCount": 1192
  }
}
```

`level` MUST contain every `Level` field. Errors: `404`.

## `GET /api/levels/{levelId}/completions`

Combined local and imported records, newest first.

| Parameter | Type | Default |
|---|---|---|
| `page` | number | 1 |
| `perPage` | number | 20 |
| `source` | string | — |

Imported entries MUST include `recordType`, `source`, and `verificationStatus`. Local
entries MUST include `recordType`, `playerId`, `playerStatus`, and `playerPoints`.

Refresh scope: the production pipeline imports completion records automatically from
Pointercrate, AREDL, and GDDL using bounded concurrency and resumable cursors.

## `POST /api/players`

```json
{ "displayName": "PLAYER_ONE" }
```

Response `201`:

```json
{
  "data": {
    "id": "local_8f12c3",
    "displayName": "PLAYER_ONE",
    "points": 0,
    "status": "ROOKIE",
    "createdAt": "2026-11-19T10:00:00.000Z",
    "leaderboardRank": null
  },
  "token": "one-time-device-token"
}
```

Validation: `displayName` trimmed, 2–32 characters. `400` otherwise.

## `GET /api/players/{playerId}`

Returns points, status, leaderboard rank, completion count, progress count, and best clear.
Errors: `404`.

## `GET /api/players/{playerId}/completions`

Local completions, newest first, paginated.

## `GET /api/players/{playerId}/progress`

Best progress entries, highest first, paginated.

## `POST /api/progress`

Requires `Authorization`. `playerId` is derived from the token.

```json
{ "levelId": 149992717, "percent": 87 }
```

Response `200` with the stored best. Lower or equal values do not replace it.
`400` for outside 1–99 or unknown level. `401` for missing/invalid token.

## `POST /api/completions`

Requires `Authorization`.

```json
{ "levelId": 149992717, "videoUrl": null }
```

Response `201` on create, `200` when the completion already exists. Completion is always
100%. `400` for unknown level; `401` for missing/invalid token.

## `GET /api/leaderboard`

Guest profiles created on the service only. Imported players are never included.

| Parameter | Type | Default |
|---|---|---|
| `page` | number | 1 |
| `perPage` | number | 50 |

```json
{
  "data": [
    {
      "rank": 1,
      "playerId": "local_8f12c3",
      "displayName": "PLAYER_ONE",
      "points": 12480,
      "status": "SKILLED",
      "completionCount": 84
    }
  ],
  "page": 1,
  "perPage": 50,
  "total": 128,
  "totalPages": 3
}
```

Tie order: points descending, earliest latest completion, then player ID ascending.

## Source status

`GET /api/source-status` returns:

```json
{
  "data": [
    { "source": "pointercrate", "ok": true, "lastUpdated": "2026-11-19T10:00:00.000Z", "stale": false }
  ]
}
```

The refresh toggle used by the mock is not part of the production public contract.

## Health

- `GET /health` — process liveness.
- `GET /ready` — SQLite connectivity and migrations applied.

## Errors

```json
{
  "error": {
    "code": "INVALID_PROGRESS",
    "message": "Progress must be an integer between 1 and 99.",
    "field": "percent"
  }
}
```

- `400` invalid input.
- `401` missing/invalid guest token.
- `404` unknown level, player, or route.
- `405` method not allowed.
- `429` rate limited.
- `500` unexpected server error.
