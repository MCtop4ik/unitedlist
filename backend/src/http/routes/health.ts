import { Router } from 'express';
import type { DB } from '../../db/database.js';
export function healthRouter(db: DB) {
  const router = Router();
  router.get('/health', (_req, res) => res.json({ ok: true }));
  router.get('/ready', (_req, res) => {
    try { db.prepare('SELECT 1').get(); res.json({ ok: true }); }
    catch { res.status(503).json({ ok: false }); }
  });
  return router;
}
