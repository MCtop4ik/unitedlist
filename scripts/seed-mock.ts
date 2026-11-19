import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import type { Level, Length, LevelZone } from '../shared/types';

const TOTAL = 10247;
const PC = 150;
const AREDL = 1600;

const realTop: Array<[number, string, string, string | null]> = [
  [149992717, 'GRIEF', 'icedcave', 'gB8slBPlOjc'],
  [148598469, 'Artemis 13', 'Mvngo', 'FgjOM0ef1N8'],
  [127323087, 'Society', 'Neomarbilan', null],
  [119544028, 'Thinking Space II', 'CairoX', null],
  [119550490, 'Amethyst', 'iMist', null],
  [126242564, 'Flamewall', 'Narwall', null],
  [86407629, 'Tidal Wave', 'OniLink', null],
  [142896409, 'Green Bullet', 'cherryteam', null],
  [133175713, 'ORBIT', 'MindCap', null],
  [144988390, 'Antarctic Lights', 'declanlc', null],
];

const midTop: Array<[number, string, string]> = [
  [99703915, 'Fracture', 'Arrow'],
  [85133223, 'poocubed', 'Liisp'],
  [136981369, 'Calibrate', 'Bamvie'],
  [89414220, 'MINUSdry', 'CDMusic'],
  [96314787, 'Deadlier Clubstep', 'HeroZombie80'],
  [81139702, 'The Hallucination', 'SyQual'],
  [130293163, 'Blooming Blossoms', 'nikoberry'],
];

const lengths: Length[] = ['tiny', 'short', 'medium', 'long', 'xl'];
const gddlDifficulties = ['Official', 'Easy', 'Medium', 'Hard', 'Insane', 'Extreme'];
const thumb = (levelId: number) => `https://levelthumbs.prevter.me/thumbnail/${levelId}/small`;

const levels: Level[] = [];
for (let i = 0; i < TOTAL; i += 1) {
  const globalRank = i + 1;
  let zone: LevelZone;
  let zoneRank: number;
  if (globalRank <= PC) {
    zone = 'pointercrate';
    zoneRank = globalRank;
  } else if (globalRank <= PC + AREDL) {
    zone = 'aredl';
    zoneRank = globalRank - PC;
  } else {
    zone = 'gddl';
    zoneRank = globalRank - PC - AREDL;
  }

  let name = `LEVEL ${String(globalRank).padStart(5, '0')}`;
  let author = `creator_${String(globalRank % 137).padStart(3, '0')}`;
  let levelId = 100000000 + globalRank;
  let videoUrl: string | null = null;
  let thumbnailUrl: string | null = null;

  if (globalRank <= realTop.length) {
    const row = realTop[globalRank - 1]!;
    levelId = row[0];
    name = row[1];
    author = row[2];
    videoUrl = row[3] ? `https://www.youtube.com/watch?v=${row[3]}` : null;
    thumbnailUrl = thumb(levelId);
  } else if (globalRank >= 70 && globalRank <= 76) {
    const row = midTop[globalRank - 70]!;
    levelId = row[0];
    name = row[1];
    author = row[2];
    thumbnailUrl = thumb(levelId);
  } else if (globalRank > PC && globalRank <= PC + 20) {
    const names = ['Acheron', 'Avernus', 'Silent Clubstep', 'The Golden', 'Slaughterhouse'];
    name = `${names[globalRank % names.length]} ${zoneRank}`;
  }

  levels.push({
    levelId,
    name,
    author,
    zone,
    zoneRank,
    globalRank,
    difficulty: zone === 'gddl' ? gddlDifficulties[globalRank % gddlDifficulties.length]! : 'Extreme',
    length: lengths[globalRank % lengths.length]!,
    thumbnailUrl,
    videoUrl,
    song: null,
    completionCount: Math.max(1, Math.round(1200 / Math.sqrt(globalRank))),
  });
}

const players = [
  ['local_player_one', 'PLAYER_ARCHIVE'],
  ['local_nova', 'NOVA'],
  ['local_vortex', 'VORTEX'],
  ['local_kite', 'KITE'],
  ['local_hexa', 'HEXA'],
  ['local_riven', 'RIVEN'],
  ['local_moss', 'MOSS'],
  ['local_player_two', 'PLAYER_TWO'],
].map(([id, displayName], index) => ({
  id,
  displayName,
  createdAt: `2026-11-${String(10 + index).padStart(2, '0')}T10:00:00.000Z`,
}));

type CompletionRow = { id: string; playerId: string; levelId: number; percent: 100; completedAt: string; videoUrl: null };
const completions: CompletionRow[] = [];
let completionId = 1;
function addCompletion(playerId: string, levelId: number, day: number) {
  completions.push({
    id: `completion_${String(completionId++).padStart(3, '0')}`,
    playerId,
    levelId,
    percent: 100,
    completedAt: `2026-11-${String(day).padStart(2, '0')}T12:00:00.000Z`,
    videoUrl: null,
  });
}

for (const levelId of [1, 4, 18, 151, 640]) addCompletion('local_player_one', levels[levelId - 1]!.levelId, 19);
for (const levelId of [1, 2, 3, 4, 5, 6, 7, 8]) addCompletion('local_nova', levels[levelId - 1]!.levelId, 18);
for (const levelId of [2, 4, 7, 9, 10, 11]) addCompletion('local_vortex', levels[levelId - 1]!.levelId, 17);
for (const levelId of [3, 5, 8, 12, 20]) addCompletion('local_kite', levels[levelId - 1]!.levelId, 16);
for (const levelId of [1, 6, 10, 15, 30]) addCompletion('local_hexa', levels[levelId - 1]!.levelId, 15);
for (const levelId of [12, 20, 40, 75]) addCompletion('local_riven', levels[levelId - 1]!.levelId, 14);
for (const levelId of [30, 50, 100]) addCompletion('local_moss', levels[levelId - 1]!.levelId, 13);
for (const levelId of [4, 5, 7]) addCompletion('local_player_two', levels[levelId - 1]!.levelId, 12);

const progress = [
  ['local_player_one', 3, 92, 19],
  ['local_player_one', 5, 78, 18],
  ['local_player_one', 6, 64, 17],
  ['local_player_one', 7, 41, 16],
  ['local_nova', 9, 88, 15],
  ['local_vortex', 3, 55, 14],
].map(([playerId, levelIndex, percent, day]) => ({
  id: `progress_${String(playerId)}_${String(levelIndex)}`,
  playerId,
  levelId: levels[(levelIndex as number) - 1]!.levelId,
  percent,
  updatedAt: `2026-11-${String(day).padStart(2, '0')}T12:00:00.000Z`,
}));

type ImportedRow = { id: string; source: 'pointercrate' | 'aredl' | 'gddl'; playerName: string; levelId: number; percent: number; completedAt: string; proofUrl: null; verificationStatus: 'verified' | 'stat' | 'unknown' };
const imported: ImportedRow[] = [];
let importedId = 1;
const importedPlayers = [
  ['Doggie', 'pointercrate', 'verified'],
  ['wPopoff', 'pointercrate', 'verified'],
  ['Zoink', 'pointercrate', 'verified'],
  ['mds62', 'gddl', 'stat'],
  ['Smooth', 'aredl', 'stat'],
  ['CuatrocientosYT', 'pointercrate', 'verified'],
  ['Nickname09', 'aredl', 'stat'],
] as const;
for (let levelIndex = 0; levelIndex < 30; levelIndex += 1) {
  for (let j = 0; j < 3; j += 1) {
    const player = importedPlayers[(levelIndex + j) % importedPlayers.length]!;
    imported.push({
      id: `imported_${String(importedId++).padStart(3, '0')}`,
      source: player[1],
      playerName: player[0],
      levelId: levels[levelIndex]!.levelId,
      percent: 100,
      completedAt: `2026-10-${String(10 + j).padStart(2, '0')}T12:00:00.000Z`,
      proofUrl: null,
      verificationStatus: player[2],
    });
  }
}

const db = {
  levels,
  players,
  completions,
  progress,
  imported,
  accounts: [],
  sessions: [],
  sourceStatus: [
    { source: 'pointercrate', ok: true, lastUpdated: '2026-11-19T10:00:00.000Z', stale: false },
    { source: 'aredl', ok: true, lastUpdated: '2026-11-19T10:00:00.000Z', stale: false },
    { source: 'gddl', ok: true, lastUpdated: '2026-11-19T10:00:00.000Z', stale: false },
  ],
};

const dataPath = resolve('data/mock-db.json');
mkdirSync(dirname(dataPath), { recursive: true });
writeFileSync(dataPath, JSON.stringify(db, null, 2));
console.log(`Seeded ${levels.length} mock levels, ${players.length} local players, ${completions.length} local completions.`);
