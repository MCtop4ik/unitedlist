import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Level } from '../shared/types';
type Database = { levels: Level[]; completions: Array<{ levelId: number }>; progress: Array<{ levelId: number }>; imported: Array<{ levelId: number }> };
const db = JSON.parse(readFileSync(resolve('data/mock-db.json'), 'utf8')) as Database;
const ids = new Set<number>();
const ranks = new Set<number>();
const zoneRanks = new Set<string>();
for (const level of db.levels) {
  if (ids.has(level.levelId)) throw new Error(`Duplicate levelId ${level.levelId}`);
  if (ranks.has(level.globalRank)) throw new Error(`Duplicate globalRank ${level.globalRank}`);
  const zoneKey = `${level.zone}:${level.zoneRank}`;
  if (zoneRanks.has(zoneKey)) throw new Error(`Duplicate zone rank ${zoneKey}`);
  ids.add(level.levelId); ranks.add(level.globalRank); zoneRanks.add(zoneKey);
}
const pointercrate = db.levels.filter((level) => level.zone === 'pointercrate');
if (pointercrate.length !== 150) throw new Error(`Pointercrate must own 150 levels, found ${pointercrate.length}`);
if (!pointercrate.every((level) => level.zoneRank >= 1 && level.zoneRank <= 150)) throw new Error('Pointercrate zone ranks must be 1-150');
const pcIds = new Set<number>(pointercrate.map((level) => level.levelId));
const aredl = db.levels.filter((level) => level.zone === 'aredl');
if (aredl.some((level) => pcIds.has(level.levelId))) throw new Error('AREDL must exclude Pointercrate levels');
const aredlIds = new Set<number>(aredl.map((level) => level.levelId));
const gddl = db.levels.filter((level) => level.zone === 'gddl');
if (gddl.some((level) => pcIds.has(level.levelId) || aredlIds.has(level.levelId))) throw new Error('GDDL must exclude Pointercrate and AREDL levels');
if (!pointercrate.every((level) => level.globalRank <= 150)) throw new Error('Pointercrate must occupy the top 150 global ranks');
const knownIds = new Set<number>(db.levels.map((level) => level.levelId));
const orphans = [...db.completions, ...db.progress, ...db.imported].filter((row) => !knownIds.has(row.levelId));
if (orphans.length > 0) throw new Error(`${orphans.length} orphaned records reference missing levels`);
console.log(`Validated ${db.levels.length} levels: ${pointercrate.length} PC, ${aredl.length} AREDL, ${gddl.length} GDDL; no orphaned records.`);
