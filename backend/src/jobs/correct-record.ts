import { loadConfig } from '../config.js';
import { openDatabase } from '../db/database.js';
import { runMigrations } from '../db/migrate.js';
const args = process.argv.slice(2);
const get = (name: string) => args[args.indexOf(name) + 1];
const playerId = get('--player');
const levelId = Number(get('--level'));
if (!args.includes('--confirm') || !playerId || !levelId) {
  console.error('Usage: npm run correct-record -- --player <id> --level <levelId> --confirm');
  process.exit(1);
}
const db = openDatabase(loadConfig().DATABASE_PATH);
runMigrations(db);
const tx = db.transaction(() => {
  db.prepare('DELETE FROM completions WHERE player_id=? AND level_id=?').run(playerId, levelId);
  db.prepare('DELETE FROM progress WHERE player_id=? AND level_id=?').run(playerId, levelId);
});
tx();
console.log(`Corrected records for ${playerId} / ${levelId}.`);
db.close();
