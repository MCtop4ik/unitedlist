import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Level } from '../shared/types';
type Completion = { playerId: string; levelId: number };
type Progress = { playerId: string; levelId: number };
type Database = { levels: Level[]; completions: Completion[]; progress: Progress[]; [key: string]: unknown };
const args = process.argv.slice(2);
const get = (name: string) => args[args.indexOf(name) + 1];
const playerId = get('--player');
const levelId = Number(get('--level'));
if (!args.includes('--confirm') || !playerId || !levelId) {
  console.error('Usage: npx tsx scripts/correct-records.ts --player <id> --level <levelId> --confirm');
  process.exit(1);
}
const dbPath = resolve('data/mock-db.json');
const db = JSON.parse(readFileSync(dbPath, 'utf8')) as Database;
const before = db.completions.length;
db.completions = db.completions.filter((row) => !(row.playerId === playerId && row.levelId === levelId));
db.progress = db.progress.filter((row) => !(row.playerId === playerId && row.levelId === levelId));
writeFileSync(dbPath, JSON.stringify(db, null, 2));
console.log(`Removed ${before - db.completions.length} record(s) for ${playerId} / ${levelId}. Run recalculate-rankings.ts next.`);
