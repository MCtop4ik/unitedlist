import { createHash } from 'node:crypto';
import type { DB } from '../db/database.js';
import type { Level, Player } from '../../../shared/types.js';
import { localCompletionResponse } from './records.js';

export function hashToken(token: string) { return createHash('sha256').update(token).digest('hex'); }

export function getPlayer(db: DB, playerId: string, levels: Map<number, Level>): Player | null {
  const base = db.prepare('SELECT id, display_name, created_at FROM players WHERE id=?').get(playerId) as any;
  if (!base) return null;
  const bestId = (db.prepare('SELECT level_id FROM completions WHERE player_id=?').all(playerId) as Array<{ level_id: number }>)
    .map((row) => levels.get(row.level_id)).filter((level): level is Level => Boolean(level)).sort((a, b) => a.globalRank - b.globalRank)[0];
  return {
    id: base.id, displayName: base.display_name, createdAt: base.created_at,
    completionCount: (db.prepare('SELECT COUNT(*) AS n FROM completions WHERE player_id=?').get(playerId) as any).n,
    progressCount: (db.prepare('SELECT COUNT(*) AS n FROM progress WHERE player_id=?').get(playerId) as any).n,
    bestCompletion: bestId ?? null,
  };
}

export function listPlayerCompletions(db: DB, playerId: string, levels: Map<number, Level>, page = 1, perPage = 50) {
  const rows = db.prepare('SELECT * FROM completions WHERE player_id=? ORDER BY completed_at DESC LIMIT ? OFFSET ?').all(playerId, perPage, (page - 1) * perPage) as any[];
  const total = (db.prepare('SELECT COUNT(*) AS n FROM completions WHERE player_id=?').get(playerId) as any).n;
  return { data: rows.map((row) => localCompletionResponse(db, row, levels)), page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) };
}
export function listPlayerProgress(db: DB, playerId: string, page = 1, perPage = 50) {
  const rows = db.prepare('SELECT * FROM progress WHERE player_id=? ORDER BY percent DESC LIMIT ? OFFSET ?').all(playerId, perPage, (page - 1) * perPage) as any[];
  const total = (db.prepare('SELECT COUNT(*) AS n FROM progress WHERE player_id=?').get(playerId) as any).n;
  return { data: rows.map((row) => ({ id: row.id, playerId, levelId: row.level_id, percent: row.percent, updatedAt: row.updated_at })), page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) };
}
