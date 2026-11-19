import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { DB } from '../../src/db/database.js';
import { createApp } from '../../src/app.js';
import { openDatabase } from '../../src/db/database.js';
import { runMigrations } from '../../src/db/migrate.js';
import { testCatalog, testConfig, testDb } from '../helpers/db.js';

let db: DB; let app: ReturnType<typeof createApp>;
beforeEach(() => { db = testDb(); app = createApp(db, testConfig(), testCatalog()); });

const account = {
  email: 'player@example.com',
  displayName: 'TEST_PLAYER',
  password: 'correct horse battery',
};

describe('account registration and sign-in', () => {
  it('registers and signs in immediately', async () => {
    const response = await request(app).post('/api/auth/register').send(account).expect(201);
    const me = await request(app).get('/api/auth/me')
      .set({ Authorization: `Bearer ${response.body.token}` })
      .expect(200);
    expect(me.body.data.player.displayName).toBe('TEST_PLAYER');
  });

  it('rejects duplicate email and display name ignoring case and whitespace', async () => {
    await request(app).post('/api/auth/register').send(account).expect(201);
    const emailConflict = await request(app).post('/api/auth/register').send({
      email: '  PLAYER@EXAMPLE.COM  ',
      displayName: 'OTHER_NAME',
      password: 'correct horse battery',
    }).expect(409);
    expect(emailConflict.body.error).toMatchObject({ code: 'EMAIL_TAKEN', field: 'email' });

    const nameConflict = await request(app).post('/api/auth/register').send({
      email: 'other@example.com',
      displayName: '  test_player ',
      password: 'correct horse battery',
    }).expect(409);
    expect(nameConflict.body.error).toMatchObject({ code: 'DISPLAY_NAME_TAKEN', field: 'displayName' });
  });

  it('rejects invalid registration input', async () => {
    await request(app).post('/api/auth/register').send({ ...account, email: 'not-an-email' }).expect(400);
    await request(app).post('/api/auth/register').send({ ...account, password: 'short' }).expect(400);
    await request(app).post('/api/auth/register').send({ ...account, password: '        ' }).expect(400);
    await request(app).post('/api/auth/register').send({ ...account, displayName: 'A' }).expect(400);
  });

  it('signs in and uses the same generic error for wrong password and unknown email', async () => {
    await request(app).post('/api/auth/register').send(account).expect(201);
    const signedIn = await request(app).post('/api/auth/login').send({ email: account.email, password: account.password }).expect(200);
    expect(signedIn.body.token).toBeTruthy();

    const wrong = await request(app).post('/api/auth/login').send({ email: account.email, password: 'wrong password' }).expect(401);
    const unknown = await request(app).post('/api/auth/login').send({ email: 'missing@example.com', password: 'wrong password' }).expect(401);
    expect(wrong.body).toEqual(unknown.body);
    expect(wrong.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('revokes only the current session on logout', async () => {
    const first = await request(app).post('/api/auth/register').send(account).expect(201);
    const second = await request(app).post('/api/auth/login').send({ email: account.email, password: account.password }).expect(200);
    await request(app).post('/api/auth/logout').set({ Authorization: `Bearer ${first.body.token}` }).expect(204);
    await request(app).get('/api/auth/me').set({ Authorization: `Bearer ${first.body.token}` }).expect(401);
    await request(app).get('/api/auth/me').set({ Authorization: `Bearer ${second.body.token}` }).expect(200);
  });

  it('keeps accounts and sessions after reopening the database', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'gdul-auth-'));
    const path = join(directory, 'auth.sqlite');
    const firstDb = openDatabase(path);
    runMigrations(firstDb);
    const firstApp = createApp(firstDb, testConfig(), testCatalog());
    const registered = await request(firstApp).post('/api/auth/register').send(account).expect(201);
    firstDb.close();

    const secondDb = openDatabase(path);
    const secondApp = createApp(secondDb, testConfig(), testCatalog());
    await request(secondApp).get('/api/auth/me')
      .set({ Authorization: `Bearer ${registered.body.token}` })
      .expect(200);
    secondDb.close();
    rmSync(directory, { recursive: true, force: true });
  });
});
