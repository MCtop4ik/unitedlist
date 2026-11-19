import type { SourceLevel } from './types.js';
import { json } from './http.js';
export async function aredlLevels(excluded: Set<number>): Promise<SourceLevel[]> {
  const rows: any[] = await json('https://api.aredl.net/v2/api/aredl/levels?exclude_legacy=true');
  return rows.filter((row) => !excluded.has(row.level_id)).map((row) => ({
    levelId: row.level_id, name: row.name, author: row.publisher_name ?? 'unknown', zone: 'aredl' as const,
    zoneRank: row.position, difficulty: 'Extreme', length: 'xl' as const,
    thumbnailUrl: `https://levelthumbs.prevter.me/thumbnail/${row.level_id}/small`, videoUrl: null,
  }));
}
