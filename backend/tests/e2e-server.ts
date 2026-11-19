import { existsSync, readFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadConfig } from '../src/config.js';
import { openDatabase } from '../src/db/database.js';
import { runMigrations } from '../src/db/migrate.js';
import { createApp } from '../src/app.js';
import { LiveCatalog } from '../src/services/live-catalog.js';

const dbPath = resolve('backend/data/e2e.sqlite');
if (existsSync(dbPath)) rmSync(dbPath);
const db = openDatabase(dbPath);
runMigrations(db);
const payload = JSON.parse(readFileSync(resolve('data/levels.json'), 'utf8')) as { levels: any[] };
const insert = db.prepare(`
  INSERT INTO levels (level_id,name,author,zone,zone_rank,global_rank,difficulty,length,thumbnail_url,video_url,song,source_updated_at)
  VALUES (@levelId,@name,@author,@zone,@zoneRank,@globalRank,@difficulty,@length,@thumbnailUrl,@videoUrl,@song,@now)
`);
const now = new Date().toISOString();
const tx = db.transaction(() => { for (const level of payload.levels) insert.run({ ...level, now }); });
tx();
const config = loadConfig({ DATABASE_PATH: dbPath, PORT: '3001', FRONTEND_ORIGIN: 'http://localhost:5173', LOG_LEVEL: 'silent' });
const catalog = new LiveCatalog({ levels: payload.levels, ttlMs: Number.POSITIVE_INFINITY });
const app = createApp(db, config, catalog);
const server = app.listen(3001, () => console.log('E2E backend on :3001'));
function close() { server.close(() => { db.close(); process.exit(0); }); }
process.on('SIGTERM', close);
process.on('SIGINT', close);
