import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import type { DB } from '../../src/db/database.js';
import { createApp } from '../../src/app.js';
import { testCatalog, testConfig, testDb } from '../helpers/db.js';

let db: DB; let app: ReturnType<typeof createApp>;
beforeEach(() => { db = testDb(); app = createApp(db, testConfig(), testCatalog()); });

describe('catalog contract', () => {
  it('lists levels ordered by global rank with pagination', async () => {
    const res = await request(app).get('/api/levels?perPage=2').expect(200);
    expect(res.body.data).toHaveLength(2);
    expect(res.body.data[0].levelId).toBe(1);
    expect(res.body.total).toBe(5);
  });
  it('filters zones and searches', async () => {
    expect((await request(app).get('/api/levels?zone=pointercrate-main')).body.total).toBe(3);
    expect((await request(app).get('/api/levels?zone=pointercrate-extended')).body.total).toBe(0);
    expect((await request(app).get('/api/levels?q=GRIEF')).body.data[0].name).toBe('GRIEF');
  });
  it('returns full level detail', async () => {
    const res = await request(app).get('/api/levels/1').expect(200);
    expect(res.body.data.level).toMatchObject({ levelId: 1, name: 'GRIEF', globalRank: 1, zone: 'pointercrate' });
    expect(res.body.data.zoneView).toBe('pointercrate-main');
  });
});
