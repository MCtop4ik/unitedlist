import type { DB } from '../db/database.js';
import type { Level, Length, LevelZone, Zone } from '../../../shared/types.js';

export interface LevelRow {
  level_id: number; name: string; author: string; zone: LevelZone; zone_rank: number; global_rank: number;
  difficulty: string; length: Length; thumbnail_url: string | null; video_url: string | null; song: string | null;
}
export function toLevel(row: LevelRow, completionCount = 0): Level {
  return {
    levelId: row.level_id, name: row.name, author: row.author, zone: row.zone, zoneRank: row.zone_rank,
    globalRank: row.global_rank, difficulty: row.difficulty, length: row.length,
    thumbnailUrl: row.thumbnail_url, videoUrl: row.video_url, song: row.song, completionCount,
  };
}
export function zoneView(level: LevelRow): Zone {
  return level.zone === 'pointercrate' ? (level.zone_rank <= 75 ? 'pointercrate-main' : 'pointercrate-extended') : level.zone;
}
export function listLevels(db: DB, query: any): { data: Level[]; page: number; perPage: number; total: number; totalPages: number } {
  const page = Math.max(1, Number(query.page ?? 1));
  const perPage = Math.min(100, Math.max(1, Number(query.perPage ?? 50)));
  const conditions: string[] = [];
  const params: any[] = [];
  const zone = String(query.zone ?? 'all');
  if (zone === 'pointercrate-main') { conditions.push("l.zone = 'pointercrate' AND l.zone_rank <= 75"); }
  else if (zone === 'pointercrate-extended') { conditions.push("l.zone = 'pointercrate' AND l.zone_rank > 75"); }
  else if (zone !== 'all') { conditions.push('l.zone = ?'); params.push(zone); }
  if (query.q) { conditions.push('(l.name LIKE ? COLLATE NOCASE OR l.author LIKE ? COLLATE NOCASE)'); params.push(`%${query.q}%`, `%${query.q}%`); }
  const difficulties = String(query.difficulty ?? '').split(',').filter(Boolean);
  if (difficulties.length) { conditions.push(`l.difficulty IN (${difficulties.map(() => '?').join(',')})`); params.push(...difficulties); }
  const lengths = String(query.length ?? '').split(',').filter(Boolean);
  if (lengths.length) { conditions.push(`l.length IN (${lengths.map(() => '?').join(',')})`); params.push(...lengths); }
  const status = String(query.status ?? '');
  const playerId = String(query.playerId ?? '');
  if (status && !playerId) throw Object.assign(new Error('playerId is required when status is set.'), { statusCode: 400, code: 'PLAYER_ID_REQUIRED' });
  if (status === 'completed') { conditions.push('EXISTS (SELECT 1 FROM completions c WHERE c.level_id=l.level_id AND c.player_id=?)'); params.push(playerId); }
  if (status === 'in-progress') { conditions.push('EXISTS (SELECT 1 FROM progress p WHERE p.level_id=l.level_id AND p.player_id=?)'); params.push(playerId); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sort = String(query.sort ?? 'global');
  const order = sort === 'zone' ? 'l.zone_rank ASC, l.global_rank ASC' : sort === 'name' ? 'l.name COLLATE NOCASE ASC' : sort === 'completions' ? 'completion_count DESC' : 'l.global_rank ASC';
  const base = `FROM levels l WHERE 1=1 ${where.replace(/^WHERE /, 'AND ')}`;
  const countRow = db.prepare(`SELECT COUNT(*) AS total ${base}`).get(...params) as { total: number };
  const rows = db.prepare(`
    SELECT l.*, (
      (SELECT COUNT(*) FROM completions c WHERE c.level_id=l.level_id) +
      (SELECT COUNT(*) FROM imported_records i WHERE i.level_id=l.level_id)
    ) AS completion_count
    ${base}
    ORDER BY ${order}
    LIMIT ? OFFSET ?
  `).all(...params, perPage, (page - 1) * perPage) as Array<LevelRow & { completion_count: number }>;
  const total = countRow.total;
  return { data: rows.map((row) => toLevel(row, row.completion_count)), page, perPage, total, totalPages: Math.max(1, Math.ceil(total / perPage)) };
}
export function getLevel(db: DB, levelId: number) {
  const row = db.prepare('SELECT * FROM levels WHERE level_id = ?').get(levelId) as LevelRow | undefined;
  if (!row) return null;
  const local = (db.prepare('SELECT COUNT(*) AS n FROM completions WHERE level_id=?').get(levelId) as { n: number }).n;
  const imported = (db.prepare('SELECT COUNT(*) AS n FROM imported_records WHERE level_id=?').get(levelId) as { n: number }).n;
  return { level: toLevel(row, local + imported), zoneView: zoneView(row), completionCount: local + imported, localCompletionCount: local, importedCompletionCount: imported };
}
