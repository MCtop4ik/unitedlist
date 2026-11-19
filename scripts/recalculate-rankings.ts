import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { Level, Status } from '../shared/types';
type Completion = { playerId: string; levelId: number; completedAt: string };
type Player = { id: string; displayName: string };
type Database = { levels: Level[]; players: Player[]; completions: Completion[] };
const db = JSON.parse(readFileSync(resolve('data/mock-db.json'), 'utf8')) as Database;
const levelById = new Map<number, Level>(db.levels.map((level) => [level.levelId, level]));
const pointsFor = (rank: number) => Math.max(1, Math.round(5000 / rank ** 0.55));
const statusFor = (points: number): Status => points >= 30000 ? 'LEGEND' : points >= 15000 ? 'EXTREME' : points >= 5000 ? 'SKILLED' : points >= 1000 ? 'PLAYER' : 'ROOKIE';
const rows = db.players.map((player) => {
  const completions = db.completions.filter((completion) => completion.playerId === player.id && levelById.has(completion.levelId));
  const points = completions.reduce((sum, completion) => sum + pointsFor(levelById.get(completion.levelId)!.globalRank), 0);
  const latest = completions.map((completion) => completion.completedAt).sort().at(-1) ?? '';
  return { playerId: player.id, displayName: player.displayName, points, status: statusFor(points), completionCount: completions.length, latest };
}).sort((a, b) => b.points - a.points || (a.latest < b.latest ? -1 : 1) || a.playerId.localeCompare(b.playerId));
console.log(`Recalculated ${rows.length} local players (the mock API computes these values live):`);
for (const [index, row] of rows.entries()) console.log(`${index + 1}. ${row.displayName} — ${row.points} PTS / ${row.status} / ${row.completionCount} clears`);
