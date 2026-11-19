import { Router } from 'express';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { DB } from '../../db/database.js';

export function thumbnailsRouter(db: DB) {
  const router = Router();
  const cacheDir = resolve('data/thumbnails');
  mkdirSync(cacheDir, { recursive: true });
  router.get('/:levelId', async (req, res) => {
    const level = db.prepare('SELECT thumbnail_url FROM levels WHERE level_id=?').get(Number(req.params.levelId)) as { thumbnail_url: string | null } | undefined;
    if (!level?.thumbnail_url) { res.status(404).json({ error: { code: 'THUMBNAIL_NOT_FOUND', message: 'Thumbnail not found.' } }); return; }
    const file = resolve(cacheDir, String(req.params.levelId));
    if (existsSync(file)) { res.type('image/jpeg').send(readFileSync(file)); return; }
    try {
      const response = await fetch(level.thumbnail_url);
      if (!response.ok) throw new Error('fetch failed');
      const buffer = Buffer.from(await response.arrayBuffer());
      writeFileSync(file, buffer);
      res.type(response.headers.get('content-type') ?? 'image/jpeg').send(buffer);
    } catch {
      res.status(502).json({ error: { code: 'THUMBNAIL_FAILED', message: 'Thumbnail source unavailable.' } });
    }
  });
  return router;
}
