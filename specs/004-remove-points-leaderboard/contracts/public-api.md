# Contract: Public Data After Points Removal

**Feature**: `004-remove-points-leaderboard`  
**Base URL**: `/api`  
**Content type**: `application/json`

## Public Player Shape

`GET /api/players/:playerId`, auth responses, and embedded player data no longer contain
`points`, `status`, or `leaderboardRank`.

```ts
interface Player {
  id: string;
  displayName: string;
  createdAt: string;
  completionCount?: number;
  progressCount?: number;
  bestCompletion?: Level | null;
}
```

`points`, `status`, and `leaderboardRank` MUST NOT appear, even as zero/null placeholders.

## Local Completion Shape

Local completion entries no longer contain `playerStatus` or `playerPoints`.

```ts
interface LocalCompletion {
  id: string;
  recordType: 'local';
  playerId: string;
  playerName: string;
  playerKind: 'account' | 'legacy';
  levelId: number;
  levelName?: string | null;
  percent: 100;
  completedAt: string;
  videoUrl: string | null;
}
```

Imported completion entries are unchanged:

```ts
interface ImportedCompletion {
  id: string;
  recordType: 'imported';
  source: 'pointercrate' | 'aredl' | 'gddl';
  playerName: string;
  levelId: number;
  percent: number;
  completedAt: string | null;
  proofUrl: string | null;
  verificationStatus: 'verified' | 'stat' | 'unknown';
}
```

## Removed Endpoint

`GET /api/leaderboard` is removed. Requests receive the standard not-found response:

```json
{ "error": { "code": "NOT_FOUND", "message": "Route not found." } }
```

No replacement ranking endpoint is provided.

## Profile UI Contract

The profile displays:

- display name
- member date
- completion count
- progress count
- best clear
- completion and progress tabs

The profile MUST NOT display points, site rank, leaderboard position, or a points-derived
skill badge. Loading, empty, error, and signed-out states MUST NOT contain points/rank
placeholders.

## Completion UI Contract

Level completion lists and profile completion rows display:

- player name
- `ACCOUNT` or `LEGACY` for local records
- imported source and verification labels
- completion date where already shown

They MUST NOT display player points or points-derived skill status.

## Navigation Contract

- Desktop primary navigation has no Leaderboard entry.
- Mobile menu has no Leaderboard item.
- The explicit `/leaderboard` route is removed; the application's catalog fallback may
  render for that address, but no leaderboard content appears.

## Unchanged Contracts

- Account registration, sign-in, sign-out, and session validation are unchanged in shape
  except that their embedded `Player` no longer has points/status/rank.
- `GET /api/levels`, level detail, filters, and non-points sorting remain available.
- `POST /api/progress` and `POST /api/completions` keep their request/response behavior
  except for removed points/status fields in returned local completions.
- Existing completions, progress, imported records, and catalog data are preserved.
