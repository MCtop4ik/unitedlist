import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { DB } from '../../src/db/database.js';
import { createApp } from '../../src/app.js';
import { testCatalog, testConfig, testDb } from '../helpers/db.js';

let db: DB; let app: ReturnType<typeof createApp>;
beforeEach(() => { db = testDb(); app = createApp(db, testConfig(), testCatalog()); });

describe('auth contract', () => {
  it('registers, returns the session envelope, and validates it through me', async () => {
    const registered = await request(app).post('/api/auth/register').send({
      email: 'contract@example.com',
      displayName: 'CONTRACT_PLAYER',
      password: 'correct horse battery',
    }).expect(201);

    expect(registered.body).toMatchObject({
      data: { displayName: 'CONTRACT_PLAYER' },
      account: { email: 'contract@example.com' },
    });
    expect(registered.body.data.id).toMatch(/^acct_/);
    expect(typeof registered.body.token).toBe('string');
    expect(registered.body.expiresAt).toBeTruthy();
    expect(JSON.stringify(registered.body)).not.toContain('password');
    expect(JSON.stringify(registered.body)).not.toContain('scrypt$');

    const me = await request(app).get('/api/auth/me')
      .set({ Authorization: `Bearer ${registered.body.token}` })
      .expect(200);
    expect(me.body).toMatchObject({
      data: { player: { id: registered.body.data.id }, account: { email: 'contract@example.com' } },
    });
    expect(me.body.expiresAt).toBeTruthy();

    await request(app).post('/api/auth/logout')
      .set({ Authorization: `Bearer ${registered.body.token}` })
      .expect(204);

    await request(app).get('/api/auth/me')
      .set({ Authorization: `Bearer ${registered.body.token}` })
      .expect(401)
      .expect(({ body }) => expect(body.error).toMatchObject({ code: 'TOKEN_INVALID' }));
  });

  it('uses the standard error envelope for missing sessions', async () => {
    const response = await request(app).get('/api/auth/me').expect(401);
    expect(response.body).toEqual({ error: { code: 'TOKEN_REQUIRED', message: 'Sign in to perform this action.' } });
  });
});
