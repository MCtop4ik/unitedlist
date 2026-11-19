import { Router } from 'express';
import type { DB } from '../../db/database.js';
import type { LiveCatalog } from '../../services/live-catalog.js';
import { rankPlayers } from '../../domain/ranking.js';
import { pageSchema } from '../schemas.js';

export function leaderboardRouter(db: DB, catalog: LiveCatalog) {
  const router = Router();
  router.get('/', (req, res) => {
    const { page, perPage } = pageSchema.parse(req.query);
    const all = rankPlayers(db, catalog.byId).map((entry) => ({
      rank: entry.rank, playerId: entry.playerId, displayName: entry.displayName, playerKind: entry.playerKind,
      points: entry.points, status: entry.status, completionCount: entry.completionCount,
    }));
    res.json({ data: all.slice((page - 1) * perPage, page * perPage), page, perPage, total: all.length, totalPages: Math.max(1, Math.ceil(all.length / perPage)) });
  });
  return router;
}
