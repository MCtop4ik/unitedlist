import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Level } from '../shared/types';

type ImportedRow = { id: string; source: 'pointercrate' | 'aredl' | 'gddl'; playerName: string; levelId: number; percent: number; completedAt: string | null; proofUrl: string | null; verificationStatus: 'verified' | 'stat' | 'unknown' };
type Database = { levels: Level[]; imported: ImportedRow[]; [key: string]: unknown };
const db = JSON.parse(readFileSync(resolve('data/mock-db.json'), 'utf8')) as Database;
const levelByPosition = new Map<number, Level>(db.levels.filter((level) => level.zone === 'pointercrate').map((level) => [level.zoneRank, level]));
const next = db.imported.filter((row) => row.source !== 'pointercrate');
let after = 0;
let fetched = 0;
while (after < 500) {
  const response = await fetch(`https://pointercrate.com/api/v1/records/?limit=100&after=${after}&demon_position__lt=151`, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error(`Pointercrate records -> ${response.status}`);
  const records = await response.json() as any[];
  if (!Array.isArray(records) || records.length === 0) break;
  for (const record of records) {
    const level = levelByPosition.get(record.demon?.position);
    if (!level) continue;
    next.push({
      id: `imported_pc_${record.id}`,
      source: 'pointercrate',
      playerName: record.player?.name ?? 'unknown',
      levelId: level.levelId,
      percent: record.progress ?? 100,
      completedAt: null,
      proofUrl: record.video ?? null,
      verificationStatus: 'verified',
    });
    fetched += 1;
  }
  after = records.at(-1)?.id ?? after + 100;
}

const sourcePath = resolve('data/imported-completions.json');
if (existsSync(sourcePath)) {
  const incoming = JSON.parse(readFileSync(sourcePath, 'utf8')) as ImportedRow[];
  for (const row of incoming) next.push({ ...row, verificationStatus: row.verificationStatus ?? 'unknown' });
}

const unique = new Map<string, ImportedRow>();
for (const row of next) unique.set(`${row.source}:${row.levelId}:${row.playerName}:${row.id}`, row);
const knownLevels = new Set<number>(db.levels.map((level) => level.levelId));
const merged = [...unique.values()].filter((row) => knownLevels.has(row.levelId));
db.imported = merged;
writeFileSync(resolve('data/mock-db.json'), JSON.stringify(db, null, 2));
console.log(`Imported completion refresh: ${fetched} Pointercrate records; AREDL/GDDL come from data/imported-completions.json when present; ${db.imported.length} total.`);
