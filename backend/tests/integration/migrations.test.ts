import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { openDatabase, type DB } from '../../src/db/database.js';
import { hashToken } from '../../src/domain/players.js';

const migrations = join(process.cwd(), 'src/db/migrations');

function apply(db: DB, files: string[]) {
  db.exec('CREATE TABLE IF NOT EXISTS schema_migrations (name TEXT PRIMARY KEY, applied_at TEXT NOT NULL)');
  for (const file of files) {
    db.exec(readFileSync(join(migrations, file), 'utf8'));
    db.prepare('INSERT INTO schema_migrations (name, applied_at) VALUES (?, ?)').run(file, new Date().toISOString());
  }
}

describe('accounts migration', () => {
  it('preserves legacy players and records while adding account tables', () => {
    const db = openDatabase(':memory:');
    apply(db, [
      '001_levels.sql',
      '002_players.sql',
      '003_records.sql',
      '004_sources.sql',
      '005_catalog_indexes.sql',
      '006_live_catalog.sql',
    ]);
    const token = 'legacy-token';
    db.prepare('INSERT INTO players (id, display_name, created_at) VALUES (?,?,?)')
      .run('local_legacy', 'LEGACY_PLAYER', '2026-01-01T00:00:00.000Z');
    db.prepare('INSERT INTO player_tokens (player_id, token_hash, created_at) VALUES (?,?,?)')
      .run('local_legacy', hashToken(token), '2026-01-01T00:00:00.000Z');
    db.prepare('INSERT INTO progress (id, player_id, level_id, percent, updated_at) VALUES (?,?,?,?,?)')
      .run('progress_legacy', 'local_legacy', 1, 50, '2026-01-01T00:00:00.000Z');
    db.prepare('INSERT INTO completions (id, player_id, level_id, completed_at, video_url) VALUES (?,?,?,?,?)')
      .run('completion_legacy', 'local_legacy', 2, '2026-01-02T00:00:00.000Z', null);

    apply(db, ['007_accounts.sql']);

    expect(db.prepare('SELECT * FROM players WHERE id=?').get('local_legacy')).toMatchObject({ display_name: 'LEGACY_PLAYER' });
    expect(db.prepare('SELECT * FROM player_tokens WHERE player_id=?').get('local_legacy')).toMatchObject({ token_hash: hashToken(token) });
    expect(db.prepare('SELECT * FROM progress WHERE id=?').get('progress_legacy')).toMatchObject({ percent: 50 });
    expect(db.prepare('SELECT * FROM completions WHERE id=?').get('completion_legacy')).toMatchObject({ level_id: 2 });
    expect(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='accounts'").get()).toBeTruthy();
    expect(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='account_sessions'").get()).toBeTruthy();
    db.close();
  });
});
