import rateLimit from 'express-rate-limit';
import cors from 'cors';
import helmet from 'helmet';
import type { Config } from '../../config.js';
export function securityMiddleware(config: Config) {
  return [
    helmet(),
    cors({ origin: config.FRONTEND_ORIGIN, credentials: false }),
    rateLimit({ windowMs: 60_000, limit: 120, standardHeaders: true, legacyHeaders: false }),
  ];
}
export const writeLimiter = rateLimit({ windowMs: 60_000, limit: 60, standardHeaders: true, legacyHeaders: false });
