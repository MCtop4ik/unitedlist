import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { loadConfig } from '../config.js';
import { openDatabase } from '../db/database.js';
import { runMigrations } from '../db/migrate.js';

const config = loadConfig();
const db = openDatabase(config.DATABASE_PATH);
runMigrations(db);
const fileArg = process.argv.indexOf('--file');
const file = fileArg >= 0 ? process.argv[fileArg + 1] : '../data/levels.json';
if (!file) throw new Error('Missing --file');
const payload = JSON.parse(readFileSync(resolve(file), 'utf8')) as { levels: any[] };
const insert = db.prepare(`
  INSERT INTO levels (level_id,name,author,zone,zone_rank,global_rank,difficulty,length,thumbnail_url,video_url,song,source_updated_at)
  VALUES (@levelId,@name,@author,@zone,@zoneRank,@globalRank,@difficulty,@length,@thumbnailUrl,@videoUrl,@song,@now)
  ON CONFLICT(level_id) DO UPDATE SET
    name=excluded.name, author=excluded.author, zone=excluded.zone, zone_rank=excluded.zone_rank,
    global_rank=excluded.global_rank, difficulty=excluded.difficulty, length=excluded.length,
    thumbnail_url=excluded.thumbnail_url, video_url=excluded.video_url, song=excluded.song,
    source_updated_at=excluded.source_updated_at
`);
const now = new Date().toISOString();
const replace = process.argv.includes('--replace');
const tx = db.transaction(() => {
  if (replace) db.exec('DELETE FROM levels');
  for (const level of payload.levels) insert.run({ ...level, now });
});
tx();
console.log(`Imported ${payload.levels.length} levels${replace ? ' (replaced catalog)' : ''}.`);
db.close();
