import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Level, LevelZone } from '../shared/types';
import { gddlLevelsFromBackup, loadGddlBackup } from './lib/gddl-backup';

interface LevelReference {
  levelId: number;
}

interface Database {
  levels: Level[];
  completions: Array<LevelReference & Record<string, unknown>>;
  progress: Array<LevelReference & Record<string, unknown>>;
  imported: Array<LevelReference & Record<string, unknown>>;
  sourceStatus: Array<Record<string, unknown>>;
  [key: string]: unknown;
}

const priority: Record<LevelZone, number> = { pointercrate: 0, aredl: 1, gddl: 2 };
const dbPath = resolve('data/mock-db.json');
const db = JSON.parse(readFileSync(dbPath, 'utf8')) as Database;
const sourceLevels = db.levels.filter((level) => level.zone !== 'gddl');
const pcIds = new Set(sourceLevels.filter((level) => level.zone === 'pointercrate').map((level) => level.levelId));
const aredlIds = new Set(sourceLevels.filter((level) => level.zone === 'aredl').map((level) => level.levelId));
const backup = loadGddlBackup();
const gddl = gddlLevelsFromBackup(new Set([...pcIds, ...aredlIds]), backup);

const unique = new Map<number, Level>();
for (const level of [...sourceLevels, ...gddl]) if (!unique.has(level.levelId)) unique.set(level.levelId, level);
const levels = [...unique.values()].sort((a, b) => priority[a.zone] - priority[b.zone] || a.zoneRank - b.zoneRank || a.levelId - b.levelId);
levels.forEach((level, index) => { level.globalRank = index + 1; });

const valid = new Set(levels.map((level) => level.levelId));
const prune = <T extends LevelReference>(rows: T[]): T[] => rows.filter((row) => valid.has(row.levelId));
db.levels = levels;
db.completions = prune(db.completions);
db.progress = prune(db.progress);
db.imported = prune(db.imported);
db.sourceStatus = db.sourceStatus.map((row) => row.source === 'gddl'
  ? { ...row, ok: true, stale: false, lastUpdated: new Date().toISOString(), last_error: null }
  : row);

const byZone = levels.reduce<Record<string, number>>((counts, level) => {
  counts[level.zone] = (counts[level.zone] ?? 0) + 1;
  return counts;
}, {});

writeFileSync(dbPath, JSON.stringify(db, null, 2));
writeFileSync(resolve('data/levels.json'), JSON.stringify({ levels }, null, 2));
writeFileSync(resolve('data/snapshot-meta.json'), JSON.stringify({
  fetchedAt: new Date().toISOString(),
  pointercrate: byZone.pointercrate ?? 0,
  aredl: byZone.aredl ?? 0,
  gddl: byZone.gddl ?? 0,
  total: levels.length,
  note: 'GDDL restored from the official backup CSV; Pointercrate and AREDL retained from the current snapshot.',
}, null, 2));

console.log(`Restored ${byZone.gddl ?? 0} GDDL levels from ${backup.length} backup rows; ${byZone.pointercrate ?? 0} PC and ${byZone.aredl ?? 0} AREDL retained (${levels.length} total).`);
