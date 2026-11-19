import { Router } from 'express';
import type { DB } from '../../db/database.js';
import type { LiveCatalog } from '../../services/live-catalog.js';
import { listLevelCompletions } from '../../domain/records.js';
import { levelQuerySchema, pageSchema } from '../schemas.js';

export function levelsRouter(db: DB, catalog: LiveCatalog) {
  const router = Router();
  router.get('/', (req, res) => {
    const query = levelQuerySchema.parse(req.query);
    if (query.status && !query.playerId) {
      res.status(400).json({ error: { code: 'PLAYER_ID_REQUIRED', message: 'playerId is required when status is set.', field: 'playerId' } });
      return;
    }
    let filters: { completed?: Set<number>; progress?: Set<number> } | undefined;
    if (query.status && query.playerId) {
      const completed = new Set((db.prepare('SELECT level_id FROM completions WHERE player_id=?').all(query.playerId) as Array<{ level_id: number }>).map((row) => row.level_id));
      const progress = new Set((db.prepare('SELECT level_id FROM progress WHERE player_id=?').all(query.playerId) as Array<{ level_id: number }>).map((row) => row.level_id));
      filters = { completed, progress };
    }
    res.json(catalog.list(query, filters));
  });
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
