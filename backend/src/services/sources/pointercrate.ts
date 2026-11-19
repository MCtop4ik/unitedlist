import type { ImportedCompletion } from '../../../../shared/types.js';
import type { SourceLevel } from './types.js';
import { json } from './http.js';

interface ListedDemon { id: number; position: number; level_id: number; }
let listedCache: { at: number; rows: ListedDemon[] } | null = null;

async function listedDemons(): Promise<ListedDemon[]> {
  if (listedCache && Date.now() - listedCache.at < 60_000) return listedCache.rows;
  const rows = [
    ...await json('https://pointercrate.com/api/v2/demons/listed/?limit=100&after=0'),
    ...await json('https://pointercrate.com/api/v2/demons/listed/?limit=100&after=100'),
  ].filter((row: any) => row.position >= 1 && row.position <= 150);
  listedCache = { at: Date.now(), rows };
  return rows;
}

export async function pointercrateLevelCompletions(level: { levelId: number; zone: string; zoneRank: number }): Promise<ImportedCompletion[]> {
  if (level.zone !== 'pointercrate') return [];
  let demon: ListedDemon | undefined;
  try {
    demon = (await listedDemons()).find((row) => row.level_id === level.levelId);
  } catch { /* fall back to the snapshot position */ }
  const position = demon?.position ?? level.zoneRank;
  const rows: any[] = [];
  let after = 0;
  for (let page = 0; page < 100; page += 1) {
    const batch: any[] = await json(`https://pointercrate.com/api/v1/records/?limit=100&progress=100&status=approved&demon_position=${position}&after=${after}`);
    if (!Array.isArray(batch) || batch.length === 0) break;
    rows.push(...(demon ? batch.filter((row) => row.demon?.id === demon.id) : batch));
    const next = batch.at(-1)?.id;
    if (!next || next === after || batch.length < 100) break;
    after = next;
  }
  return rows.map((row) => ({
    id: `pc_${row.id}`,
    recordType: 'imported' as const,
    source: 'pointercrate' as const,
    playerName: row.player?.name ?? 'unknown',
    levelId: level.levelId,
    percent: row.progress ?? 100,
    completedAt: null,
    proofUrl: row.video ?? null,
    verificationStatus: 'verified' as const,
  }));
}

export async function pointercrateLevels(): Promise<SourceLevel[]> {
  const rows: any[] = [];
  for (const after of [0, 100]) rows.push(...await json(`https://pointercrate.com/api/v2/demons/listed/?limit=100&after=${after}`));
  return rows.filter((row) => row.position >= 1 && row.position <= 150).map((row) => ({
    levelId: row.level_id, name: row.name, author: row.publisher?.name ?? 'unknown', zone: 'pointercrate' as const,
    zoneRank: row.position, difficulty: 'Extreme', length: 'xl' as const,
    thumbnailUrl: row.thumbnail ?? `https://levelthumbs.prevter.me/thumbnail/${row.level_id}/small`,
    videoUrl: row.video ?? null,
  }));
}
