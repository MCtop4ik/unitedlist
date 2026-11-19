import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Level, LevelZone } from '../../shared/types';
import { aredlLevels } from '../../backend/src/services/sources/aredl.js';
import { pointercrateLevels } from '../../backend/src/services/sources/pointercrate.js';
import { gddlLevelsFromBackup } from './gddl-backup';

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

export async function buildLevels(previous: Level[]): Promise<Level[]> {
  const pc = await pointercrateLevels();
  const pcIds = new Set(pc.map((level) => level.levelId));
  const aredl = await aredlLevels(pcIds);
  const aredlIds = new Set(aredl.map((level) => level.levelId));
  const gddl = gddlLevelsFromBackup(new Set([...pcIds, ...aredlIds]));
  const previousById = new Map(previous.map((level) => [level.levelId, level]));
  const unique = new Map<number, Level>();
  for (const source of [...pc, ...aredl]) {
    if (unique.has(source.levelId)) continue;
    const old = previousById.get(source.levelId);
    unique.set(source.levelId, {
      ...source,
      globalRank: 0,
      song: old?.song ?? null,
      completionCount: 0,
    });
  }
  for (const level of gddl) {
    if (!unique.has(level.levelId)) unique.set(level.levelId, level);
  }
  const ordered = [...unique.values()].sort((a, b) => priority[a.zone] - priority[b.zone] || a.zoneRank - b.zoneRank || a.levelId - b.levelId);
  ordered.forEach((level, index) => { level.globalRank = index + 1; });
  return ordered;
}

export async function writeCatalogSnapshot() {
  const dbPath = resolve('data/mock-db.json');
  const db = JSON.parse(readFileSync(dbPath, 'utf8')) as Database;
  const levels = await buildLevels(db.levels);
  const valid = new Set(levels.map((level) => level.levelId));
  const prune = <T extends LevelReference>(rows: T[]): T[] => rows.filter((row) => valid.has(row.levelId));

  db.levels = levels;
  db.completions = prune(db.completions);
  db.progress = prune(db.progress);
  db.imported = prune(db.imported);
  db.sourceStatus = db.sourceStatus.map((row) => ({ ...row, ok: true, stale: false, lastUpdated: new Date().toISOString(), last_error: null }));

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
    note: 'Pointercrate, AREDL, and GDDL captured from live API responses.',
  }, null, 2));

  return {
    levels: levels.length,
    pointercrate: byZone.pointercrate ?? 0,
    aredl: byZone.aredl ?? 0,
    gddl: byZone.gddl ?? 0,
  };
}
