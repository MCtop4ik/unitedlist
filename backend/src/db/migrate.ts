import { readdirSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { openDatabase, type DB } from './database.js';
import { loadConfig } from '../config.js';

const migrationsDir = fileURLToPath(new URL('./migrations', import.meta.url));

export function runMigrations(db: DB): string[] {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
  const applied = new Set<string>(db.prepare('SELECT name FROM schema_migrations').all().map((row: any) => row.name));
  const files = readdirSync(migrationsDir).filter((file) => file.endsWith('.sql')).sort();
  const ran: string[] = [];
  for (const file of files) {
    if (applied.has(file)) continue;
    const sql = readFileSync(join(migrationsDir, file), 'utf8');
    const transaction = db.transaction(() => {
      db.exec(sql);
      db.prepare('INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)').run(file, new Date().toISOString());
    });
    transaction();
    ran.push(file);
  }
  return ran;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const config = loadConfig();
  const db = openDatabase(config.DATABASE_PATH);
  console.log('Applied migrations:', runMigrations(db));
  db.close();
}
