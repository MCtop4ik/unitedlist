import express from 'express';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import pino from 'pino';
import type { DB } from './db/database.js';
import type { Config } from './config.js';
import type { LiveCatalog } from './services/live-catalog.js';
import { securityMiddleware, writeLimiter } from './http/middleware/security.js';
import { errorHandler } from './http/middleware/errors.js';
import { authRouter } from './http/routes/auth.js';
import { levelsRouter } from './http/routes/levels.js';
import { playersRouter } from './http/routes/players.js';
import { recordsRouter } from './http/routes/records.js';
import { leaderboardRouter } from './http/routes/leaderboard.js';
import { healthRouter } from './http/routes/health.js';
import { sourceStatusRouter } from './http/routes/source-status.js';
import { thumbnailsRouter } from './http/routes/thumbnails.js';

export function createApp(db: DB, config: Config, catalog: LiveCatalog) {
  const app = express();
  const logger = pino({
    level: config.LOG_LEVEL,
    redact: {
      paths: ['req.headers.authorization', 'req.headers.cookie'],
      censor: '[REDACTED]',
    },
  });
  app.use(pinoHttp({ logger, genReqId: (req) => String(req.headers['x-request-id'] ?? crypto.randomUUID()) }));
  app.use(...securityMiddleware(config));
  app.use(express.json({ limit: '32kb' }));

  const authLimiter = rateLimit({
    windowMs: 60_000,
    limit: 20,
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, res) => res.status(429).json({
      error: { code: 'RATE_LIMITED', message: 'Too many authentication requests. Try again shortly.' },
    }),
  });

  app.use(healthRouter(db));
  app.use('/api/levels', levelsRouter(db, catalog));
  app.use('/api/auth', authLimiter, authRouter(db, catalog));
  app.use('/api/players', playersRouter(db, catalog));
  app.use('/api', writeLimiter, recordsRouter(db, catalog));
  app.use('/api/leaderboard', leaderboardRouter(db, catalog));
  app.use('/api/source-status', sourceStatusRouter(catalog));
  app.use('/api/thumbnails', thumbnailsRouter(db));

  app.use((_req, res) => res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Route not found.' } }));
  app.use(errorHandler);
  return app;
}
