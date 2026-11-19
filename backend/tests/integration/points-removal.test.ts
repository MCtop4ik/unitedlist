import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { DB } from '../../src/db/database.js';
import { createApp } from '../../src/app.js';
import { testCatalog, testConfig, testDb } from '../helpers/db.js';

let db: DB; let app: ReturnType<typeof createApp>;
beforeEach(() => { db = testDb(); app = createApp(db, testConfig(), testCatalog()); });

async function createAccount() {
  const response = await request(app).post('/api/auth/register').send({
    email: 'no-points@example.com',
    displayName: 'NO_POINTS',
    password: 'correct horse battery',
  }).expect(201);
  return { id: response.body.data.id as string, token: response.body.token as string, body: response.body };
}

describe('points removal', () => {
  it('removes points, rank, and skill status from public player data', async () => {
    const account = await createAccount();
    expect(account.body.data).not.toHaveProperty('points');
    expect(account.body.data).not.toHaveProperty('status');
    expect(account.body.data).not.toHaveProperty('leaderboardRank');

    const auth = { Authorization: `Bearer ${account.token}` };
    await request(app).post('/api/completions').set(auth).send({ levelId: 1 }).expect(201);
    await request(app).post('/api/progress').set(auth).send({ levelId: 2, percent: 50 }).expect(200);

    const profile = await request(app).get(`/api/players/${account.id}`).expect(200);
    expect(profile.body.data).toMatchObject({ completionCount: 1, progressCount: 1 });
    expect(profile.body.data).not.toHaveProperty('points');
    expect(profile.body.data).not.toHaveProperty('status');
    expect(profile.body.data).not.toHaveProperty('leaderboardRank');

    const me = await request(app).get('/api/auth/me').set(auth).expect(200);
    expect(me.body.data.player).not.toHaveProperty('points');
    expect(me.body.data.player).not.toHaveProperty('status');
    expect(me.body.data.player).not.toHaveProperty('leaderboardRank');
  });

  it('removes points and player status from local completions', async () => {
    const account = await createAccount();
    await request(app).post('/api/completions')
      .set({ Authorization: `Bearer ${account.token}` })
      .send({ levelId: 1 })
      .expect(201);

    const completions = await request(app).get('/api/levels/1/completions').expect(200);
    const local = completions.body.data.find((row: any) => row.playerId === account.id);
    expect(local).toMatchObject({ playerKind: 'account', percent: 100 });
    expect(local).not.toHaveProperty('playerPoints');
    expect(local).not.toHaveProperty('playerStatus');
  });

  it('removes the leaderboard endpoint', async () => {
    const response = await request(app).get('/api/leaderboard').expect(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});
