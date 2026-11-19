import type { DB } from '../db/database.js';
import type { Level, PlayerKind, Status } from '../../../shared/types.js';

export function pointsFor(globalRank: number) {
  return Math.max(1, Math.round(5000 / Math.pow(globalRank, 0.55)));
}
export function statusFor(points: number): Status {
  if (points >= 30000) return 'LEGEND';
  if (points >= 15000) return 'EXTREME';
  if (points >= 5000) return 'SKILLED';
  if (points >= 1000) return 'PLAYER';
  return 'ROOKIE';
}

export interface RankedPlayer {
  playerId: string; displayName: string; playerKind: PlayerKind; createdAt: string; points: number; status: Status;
  rank: number; completionCount: number; latest: string;
}

export function rankPlayers(db: DB, levels: Map<number, Level>): RankedPlayer[] {
  const rows = db.prepare(`
    SELECT p.id AS playerId, p.display_name AS displayName, p.created_at AS createdAt, c.level_id AS levelId, c.completed_at AS completedAt
    FROM players p LEFT JOIN completions c ON c.player_id = p.id
  `).all() as Array<{ playerId: string; displayName: string; createdAt: string; levelId: number | null; completedAt: string | null }>;
  const accountIds = new Set((db.prepare('SELECT player_id FROM accounts').all() as Array<{ player_id: string }>).map((row) => row.player_id));
  const map = new Map<string, RankedPlayer>();
  for (const row of rows) {
    const current = map.get(row.playerId) ?? {
      playerId: row.playerId,
      displayName: row.displayName,
      playerKind: accountIds.has(row.playerId) ? 'account' : 'legacy',
      createdAt: row.createdAt,
      points: 0,
      status: 'ROOKIE' as Status,
      rank: 0,
      completionCount: 0,
      latest: '',
    };
    const level = row.levelId != null ? levels.get(row.levelId) : undefined;
    if (level) {
      current.points += pointsFor(level.globalRank);
      current.completionCount += 1;
      if (row.completedAt && row.completedAt > current.latest) current.latest = row.completedAt;
    }
    map.set(row.playerId, current);
  }
  return [...map.values()]
    .map((entry) => ({ ...entry, status: statusFor(entry.points) }))
    .sort((a, b) => b.points - a.points || a.latest.localeCompare(b.latest) || a.playerId.localeCompare(b.playerId))
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}
