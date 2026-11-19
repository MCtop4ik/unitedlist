import express from 'express';
import jsonServer from 'json-server';
import { createHash, randomBytes } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { hashPassword, verifyPassword } from '../backend/src/domain/password.js';
import type {
  Completion,
  ImportedCompletion,
  Level,
  LocalCompletion,
  Player,
  Status,
} from '../shared/types';

type LocalCompletionRow = {
  id: string;
  playerId: string;
  levelId: number;
  percent: 100;
  completedAt: string;
  videoUrl: string | null;
};

type ProgressRow = {
  id: string;
  playerId: string;
  levelId: number;
  percent: number;
  updatedAt: string;
};

type ImportedRow = Omit<ImportedCompletion, 'recordType'>;
type PlayerRow = { id: string; displayName: string; createdAt: string };
type AccountRow = {
  playerId: string;
  email: string;
  emailNormalized: string;
  displayNameKey: string;
  passwordHash: string;
  createdAt: string;
};
type SessionRow = {
  tokenHash: string;
  playerId: string;
  createdAt: string;
  expiresAt: string;
  lastUsedAt: string | null;
  revokedAt: string | null;
};
type SourceRow = {
  source: 'pointercrate' | 'aredl' | 'gddl';
  ok: boolean;
  lastUpdated: string;
  stale: boolean;
};

type Database = {
  levels: Level[];
  players: PlayerRow[];
  completions: LocalCompletionRow[];
  progress: ProgressRow[];
  imported: ImportedRow[];
  accounts: AccountRow[];
  sessions: SessionRow[];
  sourceStatus: SourceRow[];
};

const dbPath = resolve('data/mock-db.json');
let db: Database = JSON.parse(readFileSync(dbPath, 'utf8')) as Database;
db.accounts ??= [];
db.sessions ??= [];

function persist() {
  writeFileSync(dbPath, JSON.stringify(db, null, 2));
}

function pointsFor(globalRank: number) {
  return Math.max(1, Math.round(5000 / Math.pow(globalRank, 0.55)));
}

function statusFor(points: number): Status {
  if (points >= 30000) return 'LEGEND';
  if (points >= 15000) return 'EXTREME';
  if (points >= 5000) return 'SKILLED';
  if (points >= 1000) return 'PLAYER';
  return 'ROOKIE';
}

const levelById = new Map<number, Level>();
for (const level of db.levels) levelById.set(level.levelId, level);

function localPoints(playerId: string) {
  return db.completions
    .filter((c) => c.playerId === playerId && levelById.has(c.levelId))
    .reduce((sum, c) => sum + pointsFor(levelById.get(c.levelId)!.globalRank), 0);
}

function latestCompletion(playerId: string) {
  return db.completions
    .filter((c) => c.playerId === playerId)
    .map((c) => c.completedAt)
    .sort()
    .at(-1);
}

function rankPlayers() {
  return [...db.players]
    .map((player) => {
      const points = localPoints(player.id);
      return {
        player,
        playerKind: (db.accounts.some((account) => account.playerId === player.id) ? 'account' : 'legacy') as 'account' | 'legacy',
        points,
        status: statusFor(points),
        latest: latestCompletion(player.id) ?? '',
      };
    })
    .sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (a.latest !== b.latest) return a.latest < b.latest ? -1 : 1;
      return a.player.id.localeCompare(b.player.id);
    })
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

function playerDto(player: PlayerRow): Player {
  const points = localPoints(player.id);
  const ranked = rankPlayers().find((entry) => entry.player.id === player.id);
  const completions = db.completions.filter((c) => c.playerId === player.id);
  const best = [...completions]
    .map((c) => levelById.get(c.levelId))
    .filter((level): level is Level => Boolean(level))
    .sort((a, b) => a.globalRank - b.globalRank)[0];
  return {
    id: player.id,
    displayName: player.displayName,
    points,
    status: statusFor(points),
    createdAt: player.createdAt,
    leaderboardRank: ranked?.rank ?? null,
    completionCount: completions.length,
    progressCount: db.progress.filter((p) => p.playerId === player.id).length,
    bestCompletion: best ?? null,
  };
}

function localCompletionDto(row: LocalCompletionRow): LocalCompletion | null {
  const player = db.players.find((p) => p.id === row.playerId);
  if (!player) return null;
  const dto = playerDto(player);
  return {
    id: row.id,
    recordType: 'local',
    playerId: row.playerId,
    playerName: player.displayName,
    playerKind: (db.accounts.some((account) => account.playerId === row.playerId) ? 'account' : 'legacy') as 'account' | 'legacy',
    playerStatus: dto.status,
    playerPoints: dto.points,
    levelId: row.levelId,
    levelName: levelById.get(row.levelId)?.name ?? null,
    percent: 100,
    completedAt: row.completedAt,
    videoUrl: row.videoUrl,
  };
}

function importedDto(row: ImportedRow): ImportedCompletion {
  return { ...row, recordType: 'imported' };
}

function paginate<T>(items: T[], page: number, perPage: number) {
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / perPage));
  const safePage = Math.min(Math.max(1, page), totalPages);
  return {
    data: items.slice((safePage - 1) * perPage, safePage * perPage),
    page: safePage,
    perPage,
    total,
    totalPages,
  };
}

function zoneMatches(level: Level, zone: string) {
  if (zone === 'all') return true;
  if (zone === 'pointercrate-main') return level.zone === 'pointercrate' && level.zoneRank <= 75;
  if (zone === 'pointercrate-extended') return level.zone === 'pointercrate' && level.zoneRank > 75;
  return level.zone === zone;
}

const app = express();
app.use(express.json());

const SESSION_MS = 30 * 24 * 60 * 60 * 1000;

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

function normalizeEmail(email: string) {
  return email.trim().normalize('NFKC').toLocaleLowerCase('en-US');
}

function normalizeDisplayName(displayName: string) {
  return displayName.trim().normalize('NFKC').toLocaleLowerCase('en-US');
}

function bearerToken(req: express.Request) {
  const header = req.headers.authorization;
  return header?.startsWith('Bearer ') ? header.slice(7).trim() : '';
}

function currentSession(req: express.Request) {
  const token = bearerToken(req);
  if (!token) return null;
  const session = db.sessions.find((row) => row.tokenHash === hashToken(token));
  if (!session || session.revokedAt || session.expiresAt <= new Date().toISOString()) return null;
  session.expiresAt = new Date(Date.now() + SESSION_MS).toISOString();
  session.lastUsedAt = new Date().toISOString();
  persist();
  return { session, token };
}

function accountPlayerId(req: express.Request) {
  return currentSession(req)?.session.playerId ?? null;
}

function accountForPlayer(playerId: string) {
  return db.accounts.find((account) => account.playerId === playerId) ?? null;
}

function issueMockSession(playerId: string) {
  const token = randomBytes(32).toString('base64url');
  const now = new Date().toISOString();
  const session: SessionRow = {
    tokenHash: hashToken(token),
    playerId,
    createdAt: now,
    expiresAt: new Date(Date.now() + SESSION_MS).toISOString(),
    lastUsedAt: null,
    revokedAt: null,
  };
  db.sessions.push(session);
  return { token, session };
}

function authPayload(playerId: string, token: string, session: SessionRow) {
  const player = db.players.find((row) => row.id === playerId);
  const account = accountForPlayer(playerId);
  if (!player || !account) return null;
  return {
    data: playerDto(player),
    account: { email: account.email },
    token,
    expiresAt: session.expiresAt,
  };
}

app.post('/api/auth/register', (req, res) => {
  const email = String(req.body?.email ?? '').trim();
  const displayName = String(req.body?.displayName ?? '').trim();
  const password = String(req.body?.password ?? '');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Enter a valid email address.', field: 'email' } });
    return;
  }
  if (displayName.length < 2 || displayName.length > 32) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Display name must be 2-32 characters.', field: 'displayName' } });
    return;
  }
  if (password.length < 8 || password.length > 128 || password.trim().length === 0) {
    res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Password must be 8-128 characters.', field: 'password' } });
    return;
  }
  const emailNormalized = normalizeEmail(email);
  const displayNameKey = normalizeDisplayName(displayName);
  if (db.accounts.some((account) => account.emailNormalized === emailNormalized)) {
    res.status(409).json({ error: { code: 'EMAIL_TAKEN', message: 'An account with this email already exists.', field: 'email' } });
    return;
  }
  if (db.accounts.some((account) => account.displayNameKey === displayNameKey)) {
    res.status(409).json({ error: { code: 'DISPLAY_NAME_TAKEN', message: 'This display name is already taken.', field: 'displayName' } });
    return;
  }
  const playerId = `acct_${crypto.randomUUID().slice(0, 8)}`;
  const player: PlayerRow = { id: playerId, displayName, createdAt: new Date().toISOString() };
  const { token, session } = issueMockSession(playerId);
  db.players.push(player);
  db.accounts.push({
    playerId,
    email,
    emailNormalized,
    displayNameKey,
    passwordHash: hashPassword(password),
    createdAt: player.createdAt,
  });
  persist();
  const payload = authPayload(playerId, token, session);
  res.status(201).json(payload);
});

app.post('/api/auth/login', (req, res) => {
  const email = String(req.body?.email ?? '');
  const password = String(req.body?.password ?? '');
  const account = db.accounts.find((row) => row.emailNormalized === normalizeEmail(email));
  if (!account || !verifyPassword(password, account.passwordHash)) {
    res.status(401).json({ error: { code: 'INVALID_CREDENTIALS', message: 'Email or password is incorrect.' } });
    return;
  }
  const { token, session } = issueMockSession(account.playerId);
  persist();
  res.json(authPayload(account.playerId, token, session));
});

app.post('/api/auth/logout', (req, res) => {
  const current = currentSession(req);
  if (!current) {
    res.status(401).json({ error: { code: 'TOKEN_INVALID', message: 'Your session is invalid or has expired. Sign in again.' } });
    return;
  }
  current.session.revokedAt = new Date().toISOString();
  persist();
  res.status(204).end();
});

app.get('/api/auth/me', (req, res) => {
  const current = currentSession(req);
  if (!current) {
    res.status(401).json({ error: { code: 'TOKEN_INVALID', message: 'Your session is invalid or has expired. Sign in again.' } });
    return;
  }
  const player = db.players.find((row) => row.id === current.session.playerId);
  const account = accountForPlayer(current.session.playerId);
  if (!player || !account) {
    res.status(404).json({ error: { code: 'PLAYER_NOT_FOUND', message: 'Player not found.' } });
    return;
  }
  res.json({
    data: { player: playerDto(player), account: { email: account.email } },
    expiresAt: current.session.expiresAt,
  });
});

app.get('/api/levels', (req, res) => {
  const zone = String(req.query.zone ?? 'all');
  const q = String(req.query.q ?? '').trim().toLowerCase();
  const difficulties = String(req.query.difficulty ?? '').split(',').filter(Boolean);
  const lengths = String(req.query.length ?? '').split(',').filter(Boolean);
  const status = String(req.query.status ?? '');
  const playerId = String(req.query.playerId ?? '');
  const sort = String(req.query.sort ?? 'global');
  const page = Number(req.query.page ?? 1);
  const perPage = Math.min(100, Number(req.query.perPage ?? 50));

  if (status && !playerId) {
    res.status(400).json({ error: { code: 'PLAYER_ID_REQUIRED', message: 'playerId is required when status is set.', field: 'playerId' } });
    return;
  }

  let items = db.levels.filter((level) => {
    if (!level.difficulty || Number(level.difficulty) === 0) return false;
    if (!zoneMatches(level, zone)) return false;
    if (q && !`${level.name} ${level.author}`.toLowerCase().includes(q)) return false;
    if (difficulties.length && !difficulties.includes(level.difficulty)) return false;
    if (lengths.length && !lengths.includes(level.length)) return false;
    if (status) {
      const completed = db.completions.some((c) => c.playerId === playerId && c.levelId === level.levelId);
      const inProgress = db.progress.some((p) => p.playerId === playerId && p.levelId === level.levelId);
      if (status === 'completed' && !completed) return false;
      if (status === 'in-progress' && !inProgress) return false;
    }
    return true;
  });

  items = [...items].sort((a, b) => {
    if (sort === 'name') return a.name.localeCompare(b.name);
    if (sort === 'completions') return b.completionCount - a.completionCount;
    if (sort === 'zone') return a.zoneRank - b.zoneRank;
    return a.globalRank - b.globalRank;
  });

  res.json(paginate(items, page, perPage));
});

app.get('/api/levels/:levelId', (req, res) => {
  const level = levelById.get(Number(req.params.levelId));
  if (!level) {
    res.status(404).json({ error: { code: 'LEVEL_NOT_FOUND', message: 'Level not found.' } });
    return;
  }
  const localCompletionCount = db.completions.filter((c) => c.levelId === level.levelId).length;
  const importedCompletionCount = db.imported.filter((c) => c.levelId === level.levelId).length;
  res.json({
    data: {
      level,
      zoneView:
        level.zone === 'pointercrate'
          ? level.zoneRank <= 75
            ? 'pointercrate-main'
            : 'pointercrate-extended'
          : level.zone,
      completionCount: localCompletionCount + importedCompletionCount,
      localCompletionCount,
      importedCompletionCount,
    },
  });
});

app.get('/api/levels/:levelId/completions', (req, res) => {
  const levelId = Number(req.params.levelId);
  const level = levelById.get(levelId);
  if (!level) {
    res.status(404).json({ error: { code: 'LEVEL_NOT_FOUND', message: 'Level not found.' } });
    return;
  }
  const source = String(req.query.source ?? '');
  const locals: Completion[] = db.completions
    .filter((c) => c.levelId === levelId)
    .map(localCompletionDto)
    .filter((c): c is LocalCompletion => Boolean(c));
  const imported: Completion[] = db.imported
    .filter((c) => c.levelId === levelId)
    .map(importedDto);
  const all = [...locals, ...imported]
    .filter((c) => {
      if (!source) return true;
      return c.recordType === 'local' ? source === 'local' : c.source === source;
    })
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''));
  res.json(paginate(all, Number(req.query.page ?? 1), Math.min(100, Number(req.query.perPage ?? 20))));
});

app.get('/api/players/:playerId', (req, res) => {
  const player = db.players.find((p) => p.id === req.params.playerId);
  if (!player) {
    res.status(404).json({ error: { code: 'PLAYER_NOT_FOUND', message: 'Player not found.' } });
    return;
  }
  res.json({ data: playerDto(player) });
});

app.get('/api/players/:playerId/completions', (req, res) => {
  const items = db.completions
    .filter((c) => c.playerId === req.params.playerId)
    .map(localCompletionDto)
    .filter((c): c is LocalCompletion => Boolean(c))
    .sort((a, b) => b.completedAt.localeCompare(a.completedAt));
  res.json(paginate(items, Number(req.query.page ?? 1), Math.min(100, Number(req.query.perPage ?? 50))));
});

app.get('/api/players/:playerId/progress', (req, res) => {
  const items = db.progress
    .filter((p) => p.playerId === req.params.playerId)
    .map((p) => ({ ...p, level: levelById.get(p.levelId) ?? null }))
    .sort((a, b) => b.percent - a.percent);
  res.json(paginate(items, Number(req.query.page ?? 1), Math.min(100, Number(req.query.perPage ?? 50))));
});

app.post('/api/progress', (req, res) => {
  const playerId = accountPlayerId(req);
  const levelId = Number(req.body?.levelId);
  const percent = Number(req.body?.percent);
  if (!playerId) {
    const code = bearerToken(req) ? 'TOKEN_INVALID' : 'TOKEN_REQUIRED';
    res.status(401).json({ error: { code, message: 'Sign in to perform this action.' } });
    return;
  }
  if (!levelById.has(levelId)) {
    res.status(400).json({ error: { code: 'LEVEL_NOT_FOUND', message: 'Level not found.' } });
    return;
  }
  if (!Number.isInteger(percent) || percent < 1 || percent > 99) {
    res.status(400).json({ error: { code: 'INVALID_PROGRESS', message: 'Progress must be an integer between 1 and 99.', field: 'percent' } });
    return;
  }
  const existing = db.progress.find((p) => p.playerId === playerId && p.levelId === levelId);
  if (existing) {
    if (percent > existing.percent) {
      existing.percent = percent;
      existing.updatedAt = new Date().toISOString();
      persist();
    }
    res.json({ data: existing });
    return;
  }
  const row: ProgressRow = { id: `progress_${crypto.randomUUID().slice(0, 8)}`, playerId, levelId, percent, updatedAt: new Date().toISOString() };
  db.progress.push(row);
  persist();
  res.status(201).json({ data: row });
});

app.post('/api/completions', (req, res) => {
  const playerId = accountPlayerId(req);
  const levelId = Number(req.body?.levelId);
  if (!playerId) {
    const code = bearerToken(req) ? 'TOKEN_INVALID' : 'TOKEN_REQUIRED';
    res.status(401).json({ error: { code, message: 'Sign in to perform this action.' } });
    return;
  }
  if (!levelById.has(levelId)) {
    res.status(400).json({ error: { code: 'LEVEL_NOT_FOUND', message: 'Level not found.' } });
    return;
  }
  const existing = db.completions.find((c) => c.playerId === playerId && c.levelId === levelId);
  if (existing) {
    res.json({ data: localCompletionDto(existing) });
    return;
  }
  const row: LocalCompletionRow = {
    id: `completion_${crypto.randomUUID().slice(0, 8)}`,
    playerId,
    levelId,
    percent: 100,
    completedAt: new Date().toISOString(),
    videoUrl: typeof req.body?.videoUrl === 'string' ? req.body.videoUrl : null,
  };
  db.completions.push(row);
  db.progress = db.progress.filter((p) => !(p.playerId === playerId && p.levelId === levelId));
  persist();
  res.status(201).json({ data: localCompletionDto(row) });
});

app.get('/api/leaderboard', (req, res) => {
  const items = rankPlayers().map((entry) => ({
    rank: entry.rank,
    playerId: entry.player.id,
    displayName: entry.player.displayName,
    playerKind: entry.playerKind,
    points: entry.points,
    status: entry.status,
    completionCount: db.completions.filter((c) => c.playerId === entry.player.id && levelById.has(c.levelId)).length,
  }));
  res.json(paginate(items, Number(req.query.page ?? 1), Math.min(100, Number(req.query.perPage ?? 50))));
});

app.get('/api/source-status', (_req, res) => {
  res.json({ data: db.sourceStatus });
});

app.post('/api/source-status/:source/toggle', (req, res) => {
  const row = db.sourceStatus.find((s) => s.source === req.params.source);
  if (!row) {
    res.status(404).json({ error: { code: 'SOURCE_NOT_FOUND', message: 'Source not found.' } });
    return;
  }
  row.ok = !row.ok;
  row.stale = !row.ok;
  row.lastUpdated = new Date().toISOString();
  persist();
  res.json({ data: row });
});

app.use('/raw', jsonServer.router(dbPath));

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  const message = err instanceof Error ? err.message : 'Unexpected server error.';
  res.status(500).json({ error: { code: 'INTERNAL_ERROR', message } });
});

app.listen(3001, () => {
  console.log('GD United List mock API on http://localhost:3001');
});
