# API Contract — Unified Demonlist MVP

Base path: `/api`. The frontend uses this contract against the local mock server during
the frontend-first milestone and against the production Node.js/TypeScript service
later.

All responses are JSON. All list endpoints are paginated. Dates are ISO 8601 strings.

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

Catalog query.

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `zone` | Zone | `all` | `all` merges every level by `globalRank` |
| `q` | string | — | Matches level name or author |
| `difficulty` | string | — | Exact source difficulty |
| `length` | string | — | `tiny` / `short` / `medium` / `long` / `xl` |
| `status` | string | — | `completed` / `in-progress` for the active local player |
| `playerId` | string | — | Required when `status` is set; identifies the active local guest profile |
| `sort` | string | `global` | `global`, `zone`, `name`, `completions` |
| `page` | number | 1 | 1-based |
| `perPage` | number | 50 | Maximum 100 |

If `status` is provided without `playerId`, the server MUST return `400` with
`error.code = "PLAYER_ID_REQUIRED"`.

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

Errors: `400` invalid zone, sort, page, perPage, or a `status` value without `playerId`.

## `GET /api/levels/{levelId}`

Returns one `Level` plus:

```json
{
  "data": {
    "level": {
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
    },
    "zoneView": "pointercrate-main",
    "completionCount": 1204,
    "localCompletionCount": 12,
    "importedCompletionCount": 1192
  }
}
```

Errors: `404` when the level is unknown.

## `GET /api/levels/{levelId}/completions`

Returns combined local and imported records, newest first by default.

| Parameter | Type | Default | Notes |
|---|---|---|---|
| `page` | number | 1 | 1-based |
| `perPage` | number | 20 | Maximum 100 |
| `source` | string | — | `local` or a community source |

Imported entries MUST include `recordType: "imported"`, `source`, and
`verificationStatus`. Local entries MUST include `recordType: "local"`, `playerId`,
`playerStatus`, and `playerPoints`.

Refresh scope: the MVP pipeline imports Pointercrate completion records automatically.
AREDL and GDDL completion records are supplied through
`data/imported-completions.json` until dedicated rate-limited adapters are added.

Errors: `404` when the level is unknown.

## `POST /api/players`

Creates a temporary guest profile.

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
  }
}
```

Validation: `displayName` trimmed, 2–32 characters. `400` otherwise.

## `GET /api/players/{playerId}`

Returns the profile with points, status, leaderboard rank, completion count, progress
count, and best completion.

Errors: `404` for an unknown profile.

## `GET /api/players/{playerId}/completions`

Returns the local player's completions, newest first, paginated.

## `GET /api/players/{playerId}/progress`

Returns the local player's best progress entries, highest percentage first, paginated.

## `POST /api/progress`

Creates or improves one progress record. Lower or equal values never replace the stored
best.

```json
{ "playerId": "local_8f12c3", "levelId": 149992717, "percent": 87 }
```

Response `200` with the stored progress. `400` for a percentage outside 1–99, unknown
player, or unknown level.

## `POST /api/completions`

Creates a local completion at 100%. Repeated submissions for the same
`(playerId, levelId)` are idempotent and return the existing record with `200`.

```json
{ "playerId": "local_8f12c3", "levelId": 149992717, "videoUrl": null }
```

Response `201` (or `200` when it already exists):

```json
{
  "data": {
    "id": "completion_01",
    "recordType": "local",
    "playerId": "local_8f12c3",
    "levelId": 149992717,
    "percent": 100,
    "completedAt": "2026-11-19T10:04:00.000Z",
    "videoUrl": null
  }
}
```

`400` for an unknown player or level. Players cannot edit or delete completions.

## `GET /api/leaderboard`

Returns local guest profiles only. Imported community players are never included.

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
- `404` unknown level, player, or route.
- `405` method not allowed.
- `500` unexpected server error.

Player-facing messages must be human-readable; the client must not display raw error
codes alone.
