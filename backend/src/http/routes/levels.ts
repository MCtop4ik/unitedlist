import { Router } from 'express';
import type { DB } from '../../db/database.js';
import type { LiveCatalog } from '../../services/live-catalog.js';
import { listLevelCompletions } from '../../domain/records.js';
import { levelQuerySchema, pageSchema } from '../schemas.js';

export function levelsRouter(db: DB, catalog: LiveCatalog) {
  const router = Router();
  router.get('/', (req, res) => res.json(catalog.list(levelQuerySchema.parse(req.query))));
  router.get('/:levelId', async (req, res) => {
    const levelId = Number(req.params.levelId);
    if (!catalog.get(levelId)) { res.status(404).json({ error: { code: 'LEVEL_NOT_FOUND', message: 'Level not found.' } }); return; }
    const localCount = (db.prepare('SELECT COUNT(*) AS n FROM completions WHERE level_id=?').get(levelId) as { n: number }).n;
    const imported = await catalog.fetchCompletions(levelId);
    const result = catalog.getDetail(levelId, localCount, imported);
    res.json({ data: result });
  });
  router.get('/:levelId/completions', async (req, res) => {
    const levelId = Number(req.params.levelId);
    if (!catalog.get(levelId)) { res.status(404).json({ error: { code: 'LEVEL_NOT_FOUND', message: 'Level not found.' } }); return; }
    const page = pageSchema.parse(req.query);
    const imported = await catalog.fetchCompletions(levelId);
    res.json(listLevelCompletions(db, catalog.byId, () => imported, levelId, page.page, Math.min(page.perPage, 100), String(req.query.source ?? '')));
  });
  return router;
}
