CREATE TABLE players (
  id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE TABLE player_tokens (
  player_id TEXT PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  token_hash TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL,
  last_used_at TEXT,
  revoked_at TEXT
);
