import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { DB } from '../../src/db/database.js';
import { createApp } from '../../src/app.js';
import { testCatalog, testConfig, testDb } from '../helpers/db.js';

let db: DB; let app: ReturnType<typeof createApp>;
beforeEach(() => { db = testDb(); app = createApp(db, testConfig(), testCatalog()); });

describe('player kind DTOs', () => {
  it('labels account and legacy players consistently', async () => {
    const registered = await request(app).post('/api/auth/register').send({
      email: 'kind@example.com',
      displayName: 'KIND_ACCOUNT',
      password: 'correct horse battery',
    }).expect(201);
    const accountId = registered.body.data.id as string;
    const token = registered.body.token as string;

    await request(app).post('/api/completions')
      .set({ Authorization: `Bearer ${token}` })
      .send({ levelId: 1 })
      .expect(201);

    db.prepare('INSERT INTO players (id, display_name, created_at) VALUES (?,?,?)')
      .run('local_kind_legacy', 'KIND_LEGACY', '2026-01-01T00:00:00.000Z');
    db.prepare('INSERT INTO completions (id, player_id, level_id, completed_at, video_url) VALUES (?,?,?,?,?)')
      .run('completion_kind_legacy', 'local_kind_legacy', 2, '2026-01-02T00:00:00.000Z', null);

    const accountLevel = await request(app).get('/api/levels/1/completions').expect(200);
    expect(accountLevel.body.data.find((row: any) => row.playerId === accountId)).toMatchObject({ playerKind: 'account' });
    const legacyLevel = await request(app).get('/api/levels/2/completions').expect(200);
    expect(legacyLevel.body.data.find((row: any) => row.playerId === 'local_kind_legacy')).toMatchObject({ playerKind: 'legacy' });

    const leaderboard = await request(app).get('/api/leaderboard?perPage=100').expect(200);
    expect(leaderboard.body.data.find((row: any) => row.playerId === accountId)).toMatchObject({ playerKind: 'account' });
    expect(leaderboard.body.data.find((row: any) => row.playerId === 'local_kind_legacy')).toMatchObject({ playerKind: 'legacy' });
  });
});
