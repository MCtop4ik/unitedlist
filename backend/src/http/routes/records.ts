import { Router } from 'express';
import type { DB } from '../../db/database.js';
import type { LiveCatalog } from '../../services/live-catalog.js';
import { localCompletionResponse, saveCompletion, saveProgress } from '../../domain/records.js';
import { completionSchema, progressSchema } from '../schemas.js';
import { requireAccount } from '../middleware/auth.js';

export function recordsRouter(db: DB, catalog: LiveCatalog) {
  const router = Router();
  router.post('/progress', requireAccount(db), (req, res) => {
    const body = progressSchema.parse(req.body);
    if (!catalog.get(body.levelId)) { res.status(400).json({ error: { code: 'LEVEL_NOT_FOUND', message: 'Level not found.' } }); return; }
    const row: any = saveProgress(db, req.playerId!, body.levelId, body.percent);
    res.json({ data: { id: row.id, playerId: row.player_id, levelId: row.level_id, percent: row.percent, updatedAt: row.updated_at } });
  });
  router.post('/completions', requireAccount(db), (req, res) => {
    const body = completionSchema.parse(req.body);
    if (!catalog.get(body.levelId)) { res.status(400).json({ error: { code: 'LEVEL_NOT_FOUND', message: 'Level not found.' } }); return; }
    const result = saveCompletion(db, req.playerId!, body.levelId, body.videoUrl ?? null);
    res.status(result.created ? 201 : 200).json({ data: localCompletionResponse(db, result.row, catalog.byId) });
  });
  return router;
}
