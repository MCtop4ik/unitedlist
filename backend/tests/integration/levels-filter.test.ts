import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { DB } from '../../src/db/database.js';
import { createApp } from '../../src/app.js';
import { testCatalog, testConfig, testDb } from '../helpers/db.js';

let db: DB; let app: ReturnType<typeof createApp>;
beforeEach(() => { db = testDb(); app = createApp(db, testConfig(), testCatalog()); });

async function accountWithRecords() {
  const registered = await request(app).post('/api/auth/register').send({
    email: 'filter@example.com',
    displayName: 'FILTER_PLAYER',
    password: 'correct horse battery',
  }).expect(201);
  const token = registered.body.token as string;
  const playerId = registered.body.data.id as string;
  const auth = { Authorization: `Bearer ${token}` };
  await request(app).post('/api/completions').set(auth).send({ levelId: 1 }).expect(201);
  await request(app).post('/api/progress').set(auth).send({ levelId: 2, percent: 50 }).expect(200);
  await request(app).post('/api/progress').set(auth).send({ levelId: 3, percent: 70 }).expect(200);
  return { playerId, token };
}

describe('catalog completion-status filter', () => {
  it('returns only completed levels', async () => {
    const { playerId } = await accountWithRecords();
    const response = await request(app).get(`/api/levels?status=completed&playerId=${playerId}`).expect(200);
    expect(response.body.total).toBe(1);
    expect(response.body.data.map((row: any) => row.levelId)).toEqual([1]);
  });

  it('returns only in-progress levels and excludes completed levels', async () => {
    const { playerId } = await accountWithRecords();
    const response = await request(app).get(`/api/levels?status=in-progress&playerId=${playerId}&perPage=1`).expect(200);
    expect(response.body.total).toBe(2);
    expect(response.body.totalPages).toBe(2);
    expect(response.body.data).toHaveLength(1);
    expect([2, 3]).toContain(response.body.data[0].levelId);
  });

  it('combines status with zone and search filters', async () => {
    const { playerId } = await accountWithRecords();
    const zoned = await request(app).get(`/api/levels?status=completed&playerId=${playerId}&zone=aredl`).expect(200);
    expect(zoned.body.total).toBe(0);
    const searched = await request(app).get(`/api/levels?status=in-progress&playerId=${playerId}&q=Artemis`).expect(200);
    expect(searched.body.total).toBe(1);
    expect(searched.body.data[0].levelId).toBe(2);
  });

  it('rejects status without a player and unknown status values', async () => {
    await request(app).get('/api/levels?status=completed').expect(400);
    await request(app).get('/api/levels?status=unknown&playerId=x').expect(400);
  });
});
