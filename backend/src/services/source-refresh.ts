import { randomUUID } from 'node:crypto';
import type { DB } from '../db/database.js';
import type { SourceSnapshot } from './sources/types.js';
import { aredlLevels } from './sources/aredl.js';
import { gddlLevels } from './sources/gddl.js';
import { pointercrateLevels } from './sources/pointercrate.js';
import { aredlCompletions, gddlCompletions, pointercrateCompletions } from './sources/completions.js';

const priority: Record<string, number> = { pointercrate: 0, aredl: 1, gddl: 2 };

export function applyRefresh(db: DB, snapshot: SourceSnapshot) {
  const tx = db.transaction(() => {
    const upsert = db.prepare(`
      INSERT INTO levels (level_id,name,author,zone,zone_rank,global_rank,difficulty,length,thumbnail_url,video_url,song,source_updated_at)
      VALUES (@levelId,@name,@author,@zone,@zoneRank,(SELECT COALESCE(MAX(global_rank),0)+1 FROM levels),@difficulty,@length,@thumbnailUrl,@videoUrl,NULL,@now)
      ON CONFLICT(level_id) DO UPDATE SET
        name=excluded.name, author=excluded.author, zone=excluded.zone, zone_rank=excluded.zone_rank,
        difficulty=excluded.difficulty, length=excluded.length, thumbnail_url=excluded.thumbnail_url,
        video_url=excluded.video_url, source_updated_at=excluded.source_updated_at
    `);
    const now = new Date().toISOString();
    const seen = new Set<number>();
    for (const level of snapshot.levels) {
      upsert.run({ ...level, now });
      seen.add(level.levelId);
    }
    const stale = (db.prepare('SELECT level_id FROM levels').all() as Array<{ level_id: number }>).filter((row) => !seen.has(row.level_id));
    for (const row of stale) db.prepare('DELETE FROM levels WHERE level_id=?').run(row.level_id);

    db.exec('UPDATE levels SET global_rank = global_rank + 1000000');
    const ordered = db.prepare('SELECT level_id, zone, zone_rank FROM levels').all() as Array<{ level_id: number; zone: string; zone_rank: number }>;
    ordered.sort((a, b) => priority[a.zone]! - priority[b.zone]! || a.zone_rank - b.zone_rank || a.level_id - b.level_id);
    const rank = db.prepare('UPDATE levels SET global_rank=? WHERE level_id=?');
    ordered.forEach((row, index) => rank.run(index + 1, row.level_id));

    db.exec('DELETE FROM progress WHERE level_id NOT IN (SELECT level_id FROM levels)');
    db.exec('DELETE FROM completions WHERE level_id NOT IN (SELECT level_id FROM levels)');
    db.exec('DELETE FROM imported_records');
    const insert = db.prepare(`
      INSERT INTO imported_records (id,level_id,source,player_name,percent,completed_at,proof_url,verification_status,imported_at)
      VALUES (?,?,?,?,?,?,?,?,?)
    `);
    for (const row of snapshot.completions) insert.run(row.id, row.levelId, row.source, row.playerName, row.percent, row.completedAt, row.proofUrl, row.verificationStatus, now);
    db.prepare("UPDATE source_status SET ok=1, stale=0, last_updated=?, last_error=NULL").run(now);
    return { levels: snapshot.levels.length, staleRemoved: stale.length, completions: snapshot.completions.length };
  });
  return tx();
}

export async function refreshEverything(db: DB) {
  const runId = `refresh_${randomUUID().slice(0, 8)}`;
  db.prepare('INSERT INTO refresh_runs (id, started_at, status) VALUES (?,?,?)').run(runId, new Date().toISOString(), 'running');
  try {
    const pc = await pointercrateLevels();
    const pcIds = new Set(pc.map((level) => level.levelId));
    const aredl = await aredlLevels(pcIds);
    const aredlIds = new Set(aredl.map((level) => level.levelId));
    const gddl = await gddlLevels(new Set([...pcIds, ...aredlIds]));
    const levelsByPosition = new Map(pc.map((level) => [level.zoneRank, level.levelId]));
    const completions = [
      ...await pointercrateCompletions(levelsByPosition),
      ...await aredlCompletions(aredl.map((level) => level.levelId)),
      ...await gddlCompletions(gddl.map((level) => level.levelId)),
    ];
    const counts = applyRefresh(db, { levels: [...pc, ...aredl, ...gddl], completions, fetched: { pointercrate: pc.length, aredl: aredl.length, gddl: gddl.length } });
    db.prepare('UPDATE refresh_runs SET finished_at=?, status=?, counts_json=? WHERE id=?').run(new Date().toISOString(), 'success', JSON.stringify(counts), runId);
    return counts;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    db.prepare("UPDATE source_status SET ok=0, stale=1, last_error=?").run(message);
    db.prepare('UPDATE refresh_runs SET finished_at=?, status=?, error=? WHERE id=?').run(new Date().toISOString(), 'failed', message, runId);
    throw error;
  }
}
