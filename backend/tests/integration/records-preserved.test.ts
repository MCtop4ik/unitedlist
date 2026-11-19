import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { DB } from '../../src/db/database.js';
import { createApp } from '../../src/app.js';
import { testCatalog, testConfig, testDb } from '../helpers/db.js';

let db: DB; let app: ReturnType<typeof createApp>;
beforeEach(() => { db = testDb(); app = createApp(db, testConfig(), testCatalog()); });

describe('records preserved after points removal', () => {
  it('keeps completions, progress, sessions, and catalog reads working', async () => {
    const registered = await request(app).post('/api/auth/register').send({
      email: 'preserved@example.com',
      displayName: 'PRESERVED',
      password: 'correct horse battery',
    }).expect(201);
    const token = registered.body.token as string;
    const playerId = registered.body.data.id as string;
    const auth = { Authorization: `Bearer ${token}` };

    await request(app).post('/api/completions').set(auth).send({ levelId: 1 }).expect(201);
    await request(app).post('/api/progress').set(auth).send({ levelId: 2, percent: 75 }).expect(200);

    expect(db.prepare('SELECT COUNT(*) AS n FROM completions WHERE player_id=?').get(playerId)).toEqual({ n: 1 });
    expect(db.prepare('SELECT COUNT(*) AS n FROM progress WHERE player_id=?').get(playerId)).toEqual({ n: 1 });

    const profile = await request(app).get(`/api/players/${playerId}`).expect(200);
    expect(profile.body.data).toMatchObject({ completionCount: 1, progressCount: 1 });

    await request(app).post('/api/auth/logout').set(auth).expect(204);
    const login = await request(app).post('/api/auth/login').send({
      email: 'preserved@example.com',
      password: 'correct horse battery',
    }).expect(200);
    await request(app).get(`/api/players/${playerId}/completions`)
      .set({ Authorization: `Bearer ${login.body.token}` })
      .expect(200);
    await request(app).get('/api/levels?perPage=2').expect(200);
  });
});
