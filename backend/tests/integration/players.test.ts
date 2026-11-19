import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { DB } from '../../src/db/database.js';
import { createApp } from '../../src/app.js';
import { testCatalog, testConfig, testDb } from '../helpers/db.js';

let db: DB; let app: ReturnType<typeof createApp>;
beforeEach(() => { db = testDb(); app = createApp(db, testConfig(), testCatalog()); });

async function createAccount(name = 'TEST_PLAYER') {
  const res = await request(app).post('/api/auth/register').send({
    email: `${name.toLowerCase()}@example.com`,
    displayName: name,
    password: 'correct horse battery',
  }).expect(201);
  return { id: res.body.data.id as string, token: res.body.token as string };
}

describe('account identity and writes', () => {
  it('rejects writes without a token', async () => {
    await request(app).post('/api/progress').send({ levelId: 1, percent: 50 }).expect(401);
    await request(app).post('/api/completions').send({ levelId: 1 }).expect(401);
  });
  it('keeps the higher progress value', async () => {
    const account = await createAccount();
    const auth = { Authorization: `Bearer ${account.token}` };
    await request(app).post('/api/progress').set(auth).send({ levelId: 1, percent: 87 }).expect(200);
    await request(app).post('/api/progress').set(auth).send({ levelId: 1, percent: 95 }).expect(200);
    const res = await request(app).post('/api/progress').set(auth).send({ levelId: 1, percent: 50 }).expect(200);
    expect(res.body.data.percent).toBe(95);
  });
  it('stores one idempotent completion and removes progress', async () => {
    const account = await createAccount();
    const auth = { Authorization: `Bearer ${account.token}` };
    await request(app).post('/api/progress').set(auth).send({ levelId: 1, percent: 90 }).expect(200);
    await request(app).post('/api/completions').set(auth).send({ levelId: 1 }).expect(201);
    await request(app).post('/api/completions').set(auth).send({ levelId: 1 }).expect(200);
    const profile = await request(app).get(`/api/players/${account.id}`).expect(200);
    expect(profile.body.data.completionCount).toBe(1);
    expect(profile.body.data.progressCount).toBe(0);
  });
  it('derives the player from the token, not the body', async () => {
    const account = await createAccount();
    const other = await createAccount('OTHER');
    const res = await request(app).post('/api/progress').set({ Authorization: `Bearer ${account.token}` }).send({ levelId: 1, percent: 42, playerId: other.id }).expect(200);
    expect(res.body.data.playerId).toBe(account.id);
  });
});
