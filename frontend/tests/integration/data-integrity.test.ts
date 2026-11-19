import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

type Row = { levelId: number; zone: string; zoneRank: number; globalRank: number };
const data = JSON.parse(readFileSync(resolve('../data/levels.json'), 'utf8')) as { levels: Row[] };

describe('level data integrity', () => {
  it('has unique level IDs, global ranks, and zone ranks', () => {
    expect(new Set(data.levels.map((level) => level.levelId)).size).toBe(data.levels.length);
    expect(new Set(data.levels.map((level) => level.globalRank)).size).toBe(data.levels.length);
    expect(new Set(data.levels.map((level) => `${level.zone}:${level.zoneRank}`)).size).toBe(data.levels.length);
  });

  it('keeps Pointercrate in the top 150 and excludes duplicates from other zones', () => {
    const pointercrate = data.levels.filter((level) => level.zone === 'pointercrate');
    expect(pointercrate).toHaveLength(150);
    expect(pointercrate.every((level) => level.globalRank <= 150)).toBe(true);
    expect(new Set(pointercrate.map((level) => level.levelId)).size).toBe(150);
  });
});
