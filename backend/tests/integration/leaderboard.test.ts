import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { DB } from '../../src/db/database.js';
import { createApp } from '../../src/app.js';
import { testCatalog, testConfig, testDb } from '../helpers/db.js';

let db: DB; let app: ReturnType<typeof createApp>;
beforeEach(() => { db = testDb(); app = createApp(db, testConfig(), testCatalog()); });

describe('site account leaderboard', () => {
  it('awards top-heavy points, ignores progress, and excludes imported players', async () => {
    const created = await request(app).post('/api/auth/register').send({
      email: 'ranked@example.com',
      displayName: 'RANKED',
      password: 'correct horse battery',
    }).expect(201);
    const token = created.body.token as string;
    const playerId = created.body.data.id as string;
    await request(app).post('/api/progress').set({ Authorization: `Bearer ${token}` }).send({ levelId: 1, percent: 99 }).expect(200);
    expect((await request(app).get('/api/leaderboard')).body.data[0].points).toBe(0);
    await request(app).post('/api/completions').set({ Authorization: `Bearer ${token}` }).send({ levelId: 1 }).expect(201);
    const res = await request(app).get('/api/leaderboard').expect(200);
    expect(res.body.data[0].playerId).toBe(playerId);
    expect(res.body.data[0].points).toBe(5000);
    expect(res.body.data.some((row: any) => row.displayName === 'Imported')).toBe(false);
  });
});
