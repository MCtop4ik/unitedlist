import { Router } from 'express';
import type { LiveCatalog } from '../../services/live-catalog.js';
export function sourceStatusRouter(catalog: LiveCatalog) {
  const router = Router();
  router.get('/', (_req, res) => res.json({ data: catalog.sourceStatus }));
  return router;
}
