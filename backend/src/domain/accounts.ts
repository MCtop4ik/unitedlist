import { createHash, randomBytes, randomUUID } from 'node:crypto';
import type { DB } from '../db/database.js';
import { dummyVerify, hashPassword, verifyPassword } from './password.js';

export const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

export class AuthError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public field?: string,
  ) {
    super(message);
  }
}

export interface RegisterInput {
  email: string;
  displayName: string;
  password: string;
}

export interface IssuedSession {
  token: string;
  expiresAt: string;
}

export interface ActiveSession {
  playerId: string;
  email: string;
  expiresAt: string;
}

export interface RegisteredAccount {
  playerId: string;
  email: string;
  session: IssuedSession;
}

interface AccountRow {
  player_id: string;
  email: string;
  email_normalized: string;
  display_name_key: string;
  password_hash: string;
}

export function normalizeEmail(email: string) {
  return email.trim().normalize('NFKC').toLocaleLowerCase('en-US');
}

export function normalizeDisplayNameKey(displayName: string) {
  return displayName.trim().normalize('NFKC').toLocaleLowerCase('en-US');
}

export function hashSessionToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function issueSession(db: DB, playerId: string, now = Date.now()): IssuedSession {
  const token = randomBytes(32).toString('base64url');
  const createdAt = new Date(now).toISOString();
  const expiresAt = new Date(now + SESSION_MS).toISOString();
  db.prepare('INSERT INTO account_sessions (token_hash, player_id, created_at, expires_at) VALUES (?,?,?,?)')
    .run(hashSessionToken(token), playerId, createdAt, expiresAt);
  return { token, expiresAt };
}

export function findSession(db: DB, token: string, now = Date.now()): ActiveSession | null {
  const nowIso = new Date(now).toISOString();
  const row = db.prepare(`
    SELECT s.player_id AS playerId, a.email AS email, s.expires_at AS expiresAt
    FROM account_sessions s JOIN accounts a ON a.player_id = s.player_id
    WHERE s.token_hash = ? AND s.revoked_at IS NULL AND s.expires_at > ?
  `).get(hashSessionToken(token), nowIso) as ActiveSession | undefined;
  if (!row) return null;
  const expiresAt = new Date(now + SESSION_MS).toISOString();
  db.prepare('UPDATE account_sessions SET expires_at = ?, last_used_at = ? WHERE token_hash = ?')
    .run(expiresAt, nowIso, hashSessionToken(token));
  return { playerId: row.playerId, email: row.email, expiresAt };
}

export function revokeSession(db: DB, token: string, now = Date.now()) {
  db.prepare('UPDATE account_sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL')
    .run(new Date(now).toISOString(), hashSessionToken(token));
}

export function registerAccount(db: DB, input: RegisterInput, now = Date.now()): RegisteredAccount {
  const email = input.email.trim();
  const emailNormalized = normalizeEmail(email);
  const displayName = input.displayName.trim();
  const displayNameKey = normalizeDisplayNameKey(displayName);
  const passwordHash = hashPassword(input.password);
  const playerId = `acct_${randomUUID().slice(0, 8)}`;
  const createdAt = new Date(now).toISOString();
  const token = randomBytes(32).toString('base64url');
  const expiresAt = new Date(now + SESSION_MS).toISOString();

  const transaction = db.transaction(() => {
    db.prepare('INSERT INTO players (id, display_name, created_at) VALUES (?,?,?)').run(playerId, displayName, createdAt);
    db.prepare(`
      INSERT INTO accounts (player_id, email, email_normalized, display_name_key, password_hash, created_at)
      VALUES (?,?,?,?,?,?)
    `).run(playerId, email, emailNormalized, displayNameKey, passwordHash, createdAt);
    db.prepare('INSERT INTO account_sessions (token_hash, player_id, created_at, expires_at) VALUES (?,?,?,?)')
      .run(hashSessionToken(token), playerId, createdAt, expiresAt);
  });

  try {
    transaction();
  } catch (error) {
    if ((error as { code?: string }).code?.startsWith('SQLITE_CONSTRAINT')) {
      if (db.prepare('SELECT 1 FROM accounts WHERE email_normalized = ?').get(emailNormalized)) {
        throw new AuthError(409, 'EMAIL_TAKEN', 'An account with this email already exists.', 'email');
      }
      if (db.prepare('SELECT 1 FROM accounts WHERE display_name_key = ?').get(displayNameKey)) {
        throw new AuthError(409, 'DISPLAY_NAME_TAKEN', 'This display name is already taken.', 'displayName');
      }
    }
    throw error;
  }

  return { playerId, email, session: { token, expiresAt } };
}

export function authenticate(db: DB, email: string, password: string, now = Date.now()): { playerId: string; email: string; session: IssuedSession } | null {
  const account = db.prepare(`
    SELECT player_id, email, email_normalized, display_name_key, password_hash
    FROM accounts WHERE email_normalized = ?
  `).get(normalizeEmail(email)) as AccountRow | undefined;
  if (!account) {
    dummyVerify(password);
    return null;
  }
  if (!verifyPassword(password, account.password_hash)) return null;
  return { playerId: account.player_id, email: account.email, session: issueSession(db, account.player_id, now) };
}
