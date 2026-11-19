import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Level } from '../../shared/types';
import { parseCsv } from './csv';

export interface GddlBackupRow {
  levelId: number;
  name: string;
  author: string;
  song: string | null;
  difficulty: string;
  tier: number;
}

export const GDDL_BACKUP_PATH = resolve('data/GDDL backup - GDDL.csv');

export function loadGddlBackup(path = GDDL_BACKUP_PATH): GddlBackupRow[] {
  const [header, ...rows] = parseCsv(readFileSync(path, 'utf8'));
  const expected = ['ID', 'Level name', 'Creator', 'Song name', 'Official Difficulty', 'Tier'];
  if (!header || expected.some((name, index) => header[index] !== name)) {
    throw new Error(`${path} is not a GDDL backup CSV (unexpected header).`);
  }
  return rows.flatMap((row) => {
    const levelId = Number(row[0]);
    const name = row[1] ?? '';
    if (!Number.isInteger(levelId) || levelId <= 0 || !name) return [];
    const creator = row[2] ?? '';
    const song = row[3] ?? '';
    return [{
      levelId,
      name,
      author: creator && creator !== '-' ? creator : 'unknown',
      song: song && song !== '-' ? song : null,
      difficulty: row[4] || 'Hard',
      tier: Number(row[5]) || 0,
    }];
  });
}

export function gddlLevelsFromBackup(excluded: Set<number>, backup = loadGddlBackup()): Level[] {
  const unique = new Map<number, GddlBackupRow>();
  for (const row of backup) {
    if (!excluded.has(row.levelId) && !unique.has(row.levelId)) unique.set(row.levelId, row);
  }
  return [...unique.values()]
    .sort((a, b) => b.tier - a.tier || a.levelId - b.levelId)
    .map((row, index) => ({
      levelId: row.levelId,
      name: row.name,
      author: row.author,
      zone: 'gddl' as const,
      zoneRank: index + 1,
      globalRank: 0,
      difficulty: row.difficulty,
      length: 'medium' as const,
      thumbnailUrl: `https://levelthumbs.prevter.me/thumbnail/${row.levelId}/small`,
      videoUrl: null,
      song: row.song,
      completionCount: 0,
    }));
}
