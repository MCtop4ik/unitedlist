import { openDatabase, type DB } from '../../src/db/database.js';
import { runMigrations } from '../../src/db/migrate.js';
import { loadConfig } from '../../src/config.js';
import { LiveCatalog } from '../../src/services/live-catalog.js';
import type { Level } from '../../../shared/types.js';

export function testDb(): DB {
  const db = openDatabase(':memory:');
  runMigrations(db);
  return db;
}
export function testConfig() {
  return loadConfig({ DATABASE_PATH: ':memory:', PORT: '3001', FRONTEND_ORIGIN: 'http://localhost:5173', LOG_LEVEL: 'silent' });
}
export const testLevels: Level[] = [
  { levelId: 1, name: 'GRIEF', author: 'icedcave', zone: 'pointercrate', zoneRank: 1, globalRank: 1, difficulty: 'Extreme', length: 'xl', thumbnailUrl: null, videoUrl: null, song: null, completionCount: 0 },
  { levelId: 2, name: 'Artemis 13', author: 'Mvngo', zone: 'pointercrate', zoneRank: 2, globalRank: 2, difficulty: 'Extreme', length: 'xl', thumbnailUrl: null, videoUrl: null, song: null, completionCount: 0 },
  { levelId: 3, name: 'Society', author: 'Neomarbilan', zone: 'pointercrate', zoneRank: 3, globalRank: 3, difficulty: 'Extreme', length: 'long', thumbnailUrl: null, videoUrl: null, song: null, completionCount: 0 },
  { levelId: 4, name: 'Umbral', author: 'creator', zone: 'aredl', zoneRank: 1, globalRank: 4, difficulty: 'Extreme', length: 'xl', thumbnailUrl: null, videoUrl: null, song: null, completionCount: 0 },
  { levelId: 5, name: 'Rest', author: 'creator', zone: 'gddl', zoneRank: 1, globalRank: 5, difficulty: 'Hard', length: 'medium', thumbnailUrl: null, videoUrl: null, song: null, completionCount: 0 },
];
export function testCatalog(levels: Level[] = testLevels) {
  return new LiveCatalog({ levels, ttlMs: Number.POSITIVE_INFINITY });
}
