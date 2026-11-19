import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { DB } from '../../src/db/database.js';
import { createApp } from '../../src/app.js';
import { testCatalog, testConfig, testDb } from '../helpers/db.js';

let db: DB; let app: ReturnType<typeof createApp>;
beforeEach(() => { db = testDb(); app = createApp(db, testConfig(), testCatalog()); });

const account = {
  email: 'security@example.com',
  displayName: 'SECURITY_PLAYER',
  password: 'correct horse battery',
};

describe('auth security', () => {
  it('blocks after five failed sign-ins and tells the client when to retry', async () => {
    await request(app).post('/api/auth/register').send(account).expect(201);
    for (let attempt = 0; attempt < 5; attempt += 1) {
      await request(app).post('/api/auth/login').send({ email: account.email, password: 'wrong password' }).expect(401);
    }
    const blocked = await request(app).post('/api/auth/login')
      .send({ email: account.email, password: account.password })
      .expect(429);
    expect(blocked.body.error.code).toBe('RATE_LIMITED');
    expect(blocked.body.error.message).toMatch(/retry|seconds/i);
    expect(blocked.headers['retry-after']).toBeTruthy();
  });

  it('does not expose credentials or emails through public views', async () => {
    const registered = await request(app).post('/api/auth/register').send(account).expect(201);
    const registerBody = JSON.stringify(registered.body);
    expect(registerBody).not.toContain('scrypt$');
    expect(registerBody).not.toContain('password_hash');
    expect(registerBody).not.toContain(account.password);

    const profile = await request(app).get(`/api/players/${registered.body.data.id}`).expect(200);
    expect(JSON.stringify(profile.body)).not.toContain(account.email);
    const leaderboard = await request(app).get('/api/leaderboard').expect(200);
    expect(JSON.stringify(leaderboard.body)).not.toContain(account.email);
  });

  it('normalizes email and display-name uniqueness for registration', async () => {
    await request(app).post('/api/auth/register').send(account).expect(201);
    const duplicateEmail = await request(app).post('/api/auth/login')
      .send({ email: '  SECURITY@EXAMPLE.COM ', password: account.password })
      .expect(200);
    expect(duplicateEmail.body.data.displayName).toBe(account.displayName);

    const conflict = await request(app).post('/api/auth/register').send({
      email: 'another@example.com',
      displayName: ' security_player ',
      password: account.password,
    }).expect(409);
    expect(conflict.body.error.code).toBe('DISPLAY_NAME_TAKEN');
  });
});
