import { randomUUID } from 'node:crypto';
import type { DB } from '../db/database.js';
import type { Completion, Level, LocalCompletion } from '../../../shared/types.js';

export function saveProgress(db: DB, playerId: string, levelId: number, percent: number) {
  const existing = db.prepare('SELECT * FROM progress WHERE player_id=? AND level_id=?').get(playerId, levelId) as any;
  const now = new Date().toISOString();
  if (existing) {
    if (percent > existing.percent) db.prepare('UPDATE progress SET percent=?, updated_at=? WHERE id=?').run(percent, now, existing.id);
    return db.prepare('SELECT * FROM progress WHERE id=?').get(existing.id);
  }
  const id = `progress_${randomUUID().slice(0, 8)}`;
  db.prepare('INSERT INTO progress (id, player_id, level_id, percent, updated_at) VALUES (?,?,?,?,?)').run(id, playerId, levelId, percent, now);
  return db.prepare('SELECT * FROM progress WHERE id=?').get(id);
}

export function saveCompletion(db: DB, playerId: string, levelId: number, videoUrl: string | null) {
  const existing = db.prepare('SELECT * FROM completions WHERE player_id=? AND level_id=?').get(playerId, levelId) as any;
  if (existing) return { row: existing, created: false };
  const tx = db.transaction(() => {
    const id = `completion_${randomUUID().slice(0, 8)}`;
    db.prepare('INSERT INTO completions (id, player_id, level_id, completed_at, video_url) VALUES (?,?,?,?,?)').run(id, playerId, levelId, new Date().toISOString(), videoUrl);
    db.prepare('DELETE FROM progress WHERE player_id=? AND level_id=?').run(playerId, levelId);
  });
  tx();
  return { row: db.prepare('SELECT * FROM completions WHERE player_id=? AND level_id=?').get(playerId, levelId), created: true };
}

export function localCompletionResponse(db: DB, row: any, levels: Map<number, Level>) {
  const player = db.prepare(`
    SELECT p.display_name,
      EXISTS(SELECT 1 FROM accounts a WHERE a.player_id = p.id) AS is_account
    FROM players p WHERE p.id=?
  `).get(row.player_id) as { display_name: string; is_account: number } | undefined;
  const level = levels.get(row.level_id);
  return {
    id: row.id, recordType: 'local' as const, playerId: row.player_id, playerName: player?.display_name ?? 'unknown',
    playerKind: (player?.is_account ? 'account' : 'legacy') as 'account' | 'legacy',
    levelId: row.level_id, levelName: level?.name ?? null, percent: 100 as const, completedAt: row.completed_at, videoUrl: row.video_url,
  };
}

export function listLevelCompletions(db: DB, levels: Map<number, Level>, importedFor: (levelId: number) => any[], levelId: number, page = 1, perPage = 20, source = ''): { data: Completion[]; page: number; perPage: number; total: number; totalPages: number } {
  const localRows = db.prepare('SELECT * FROM completions WHERE level_id=?').all(levelId) as any[];
  const locals: LocalCompletion[] = localRows.map((row) => localCompletionResponse(db, row, levels));
  const imported: Completion[] = importedFor(levelId).map((row) => ({
    id: row.id, recordType: 'imported', source: row.source, playerName: row.playerName, levelId,
    percent: row.percent, completedAt: row.completedAt, proofUrl: row.proofUrl, verificationStatus: row.verificationStatus,
  }));
  let all = [...locals, ...imported];
  if (source) all = all.filter((row) => row.recordType === 'local' ? source === 'local' : row.source === source);
  all.sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
  const total = all.length;
  const safePage = Math.min(page, Math.max(1, Math.ceil(total / perPage)));
  return { data: all.slice((safePage - 1) * perPage, safePage * perPage), page: safePage, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) };
}
