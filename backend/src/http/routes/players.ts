import { Router } from 'express';
import type { DB } from '../../db/database.js';
import type { LiveCatalog } from '../../services/live-catalog.js';
import { getPlayer, listPlayerCompletions, listPlayerProgress } from '../../domain/players.js';

export function playersRouter(db: DB, catalog: LiveCatalog) {
  const router = Router();
  router.get('/:playerId', (req, res) => {
    const player = getPlayer(db, req.params.playerId, catalog.byId);
    if (!player) { res.status(404).json({ error: { code: 'PLAYER_NOT_FOUND', message: 'Player not found.' } }); return; }
    res.json({ data: player });
  });
  router.get('/:playerId/completions', (req, res) => {
    if (!getPlayer(db, req.params.playerId, catalog.byId)) { res.status(404).json({ error: { code: 'PLAYER_NOT_FOUND', message: 'Player not found.' } }); return; }
    res.json(listPlayerCompletions(db, req.params.playerId, catalog.byId, Number(req.query.page ?? 1), Math.min(100, Number(req.query.perPage ?? 50))));
  });
  router.get('/:playerId/progress', (req, res) => {
    if (!getPlayer(db, req.params.playerId, catalog.byId)) { res.status(404).json({ error: { code: 'PLAYER_NOT_FOUND', message: 'Player not found.' } }); return; }
    res.json(listPlayerProgress(db, req.params.playerId, Number(req.query.page ?? 1), Math.min(100, Number(req.query.perPage ?? 50))));
  });
  return router;
}
