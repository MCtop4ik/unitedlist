import { Router } from 'express';
import type { DB } from '../../db/database.js';
import type { LiveCatalog } from '../../services/live-catalog.js';
import { authenticate, normalizeEmail, registerAccount, revokeSession } from '../../domain/accounts.js';
import { getPlayer } from '../../domain/players.js';
import { loginSchema, registerSchema } from '../schemas.js';
import { requireAccount } from '../middleware/auth.js';
import { createLoginLimiter, loginKey, sendRateLimited } from '../middleware/login-rate-limit.js';

export function authRouter(db: DB, catalog: LiveCatalog, limiter = createLoginLimiter()) {
  const router = Router();

  router.post('/register', (req, res, next) => {
    try {
      const body = registerSchema.parse(req.body);
      const created = registerAccount(db, body);
      const player = getPlayer(db, created.playerId, catalog.byId);
      if (!player) throw new Error('Account player missing after registration.');
      res.status(201).json({
        data: player,
        account: { email: created.email },
        token: created.session.token,
        expiresAt: created.session.expiresAt,
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/login', (req, res, next) => {
    try {
      const body = loginSchema.parse(req.body);
      const key = loginKey(normalizeEmail(body.email), req.ip ?? 'unknown');
      const status = limiter.check(key);
      if (status.blocked) {
        const seconds = Math.max(1, Math.ceil(status.retryAfterMs / 1000));
        sendRateLimited(res, status.retryAfterMs, `Too many failed sign-in attempts. Try again in ${seconds} seconds.`);
        return;
      }
      const result = authenticate(db, body.email, body.password);
      if (!result) {
        limiter.failure(key);
        res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' } });
        return;
      }
      limiter.success(key);
      const player = getPlayer(db, result.playerId, catalog.byId);
      if (!player) throw new Error('Account player missing after sign-in.');
      res.json({
        data: player,
        account: { email: result.email },
        token: result.session.token,
        expiresAt: result.session.expiresAt,
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/logout', requireAccount(db), (req, res) => {
    if (req.sessionToken) revokeSession(db, req.sessionToken);
    res.status(204).end();
  });

  router.get('/me', requireAccount(db), (req, res) => {
    const player = getPlayer(db, req.playerId!, catalog.byId);
    if (!player) {
      res.status(404).json({ error: { code: 'PLAYER_NOT_FOUND', message: 'Player not found.' } });
      return;
    }
    res.json({
      data: { player, account: { email: req.accountEmail! } },
      expiresAt: req.sessionExpiresAt!,
    });
  });

  return router;
}
