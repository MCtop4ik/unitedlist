import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { DB } from '../../src/db/database.js';
import { createApp } from '../../src/app.js';
import { hashSessionToken } from '../../src/domain/accounts.js';
import { hashToken } from '../../src/domain/players.js';
import { testCatalog, testConfig, testDb } from '../helpers/db.js';

let db: DB; let app: ReturnType<typeof createApp>;
beforeEach(() => { db = testDb(); app = createApp(db, testConfig(), testCatalog()); });

async function createAccount(name: string) {
  const res = await request(app).post('/api/auth/register').send({
    email: `${name.toLowerCase()}@example.com`,
    displayName: name,
    password: 'correct horse battery',
  }).expect(201);
  return { id: res.body.data.id as string, token: res.body.token as string };
}

describe('session authorization', () => {
  it('rejects missing and invalid sessions on writes', async () => {
    const missing = await request(app).post('/api/progress').send({ levelId: 1, percent: 50 }).expect(401);
    expect(missing.body.error.code).toBe('TOKEN_REQUIRED');
    const invalid = await request(app).post('/api/completions')
      .set({ Authorization: 'Bearer not-a-session' })
      .send({ levelId: 1 })
      .expect(401);
    expect(invalid.body.error.code).toBe('TOKEN_INVALID');
  });

  it('rejects expired and revoked sessions', async () => {
    const account = await createAccount('EXPIRING');
    db.prepare('UPDATE account_sessions SET expires_at=? WHERE token_hash=?')
      .run('2020-01-01T00:00:00.000Z', hashSessionToken(account.token));
    await request(app).post('/api/progress')
      .set({ Authorization: `Bearer ${account.token}` })
      .send({ levelId: 1, percent: 50 })
      .expect(401);

    const second = await createAccount('REVOKED');
    await request(app).post('/api/auth/logout')
      .set({ Authorization: `Bearer ${second.token}` })
      .expect(204);
    await request(app).post('/api/progress')
      .set({ Authorization: `Bearer ${second.token}` })
      .send({ levelId: 1, percent: 50 })
      .expect(401);
  });

  it('rejects legacy guest tokens', async () => {
    const token = 'legacy-guest-token';
    db.prepare('INSERT INTO players (id, display_name, created_at) VALUES (?,?,?)')
      .run('local_legacy', 'LEGACY', new Date().toISOString());
    db.prepare('INSERT INTO player_tokens (player_id, token_hash, created_at) VALUES (?,?,?)')
      .run('local_legacy', hashToken(token), new Date().toISOString());
    await request(app).post('/api/progress')
      .set({ Authorization: `Bearer ${token}` })
      .send({ levelId: 1, percent: 50 })
      .expect(401);
    expect(db.prepare('SELECT COUNT(*) AS n FROM progress WHERE player_id=?').get('local_legacy')).toEqual({ n: 0 });
  });

  it('ignores a body playerId and writes only the session owner', async () => {
    const first = await createAccount('FIRST');
    const second = await createAccount('SECOND');
    const response = await request(app).post('/api/progress')
      .set({ Authorization: `Bearer ${first.token}` })
      .send({ levelId: 1, percent: 42, playerId: second.id })
      .expect(200);
    expect(response.body.data.playerId).toBe(first.id);
    const secondProgress = await request(app).get(`/api/players/${second.id}/progress`).expect(200);
    expect(secondProgress.body.data).toHaveLength(0);
  });
});
