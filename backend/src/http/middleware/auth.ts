import type { NextFunction, Request, Response } from 'express';
import type { DB } from '../../db/database.js';
import { findSession } from '../../domain/accounts.js';

export function bearerToken(req: Request) {
  const header = req.headers.authorization;
  return header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

export function requireAccount(db: DB) {
  return (req: Request, res: Response, next: NextFunction) => {
    const token = bearerToken(req);
    if (!token) {
      res.status(401).json({ error: { code: 'TOKEN_REQUIRED', message: 'Sign in to perform this action.' } });
      return;
    }
    const session = findSession(db, token);
    if (!session) {
      res.status(401).json({ error: { code: 'TOKEN_INVALID', message: 'Your session is invalid or has expired. Sign in again.' } });
      return;
    }
    req.playerId = session.playerId;
    req.accountEmail = session.email;
    req.sessionToken = token;
    req.sessionExpiresAt = session.expiresAt;
    next();
  };
}
