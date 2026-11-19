import type { SourceCompletion } from './types.js';
import { json, mapLimit } from './http.js';

export async function pointercrateCompletions(levelsByPosition: Map<number, number>): Promise<SourceCompletion[]> {
  const result: SourceCompletion[] = [];
  let after = 0;
  for (let i = 0; i < 5; i += 1) {
    const rows: any[] = await json(`https://pointercrate.com/api/v1/records/?limit=100&after=${after}&demon_position__lt=151`);
    if (!rows.length) break;
    for (const row of rows) {
      const levelId = levelsByPosition.get(row.demon?.position);
      if (!levelId) continue;
      result.push({ id: `pc_${row.id}`, source: 'pointercrate', playerName: row.player?.name ?? 'unknown', levelId, percent: row.progress ?? 100, completedAt: null, proofUrl: row.video ?? null, verificationStatus: 'verified' });
    }
    after = rows.at(-1)?.id ?? after + 100;
  }
  return result;
}

export async function aredlCompletions(levelIds: number[]): Promise<SourceCompletion[]> {
  return (await mapLimit(levelIds, 6, async (levelId) => {
    const result: SourceCompletion[] = [];
    for (let page = 1; page <= 3; page += 1) {
      const payload = await json(`https://api.aredl.net/v2/api/aredl/levels/${levelId}/records?per_page=100&page=${page}`);
      const rows: any[] = Array.isArray(payload) ? payload : payload.data ?? [];
      if (!rows.length) break;
      for (const row of rows) result.push({
        id: `aredl_${levelId}_${row.id ?? row.record_id ?? `${page}_${result.length}`}`,
        source: 'aredl', playerName: row.player?.name ?? row.player_name ?? row.user?.name ?? 'unknown',
        levelId, percent: row.progress ?? row.percent ?? 100, completedAt: row.created_at ?? row.date ?? null,
        proofUrl: row.video ?? row.proof ?? null, verificationStatus: 'stat',
      });
    }
    return result;
  })).flat();
}

export async function gddlCompletions(levelIds: number[]): Promise<SourceCompletion[]> {
  return (await mapLimit(levelIds, 6, async (levelId) => {
    const result: SourceCompletion[] = [];
    for (let page = 0; page < 3; page += 1) {
      const payload = await json(`https://gdladder.com/api/levels/${levelId}/submissions?limit=100&page=${page}`);
      const rows: any[] = payload.data ?? [];
      if (!rows.length) break;
      for (const row of rows) result.push({
        id: `gddl_${levelId}_${row.ID ?? `${page}_${result.length}`}`,
        source: 'gddl', playerName: row.User?.Name ?? row.username ?? 'unknown', levelId,
        percent: row.Progress ?? 100, completedAt: row.DateAdded ?? null, proofUrl: row.Proof ?? null,
        verificationStatus: 'stat',
      });
    }
    return result;
  })).flat();
}
