CREATE TABLE accounts (
  player_id TEXT PRIMARY KEY REFERENCES players(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  email_normalized TEXT NOT NULL UNIQUE,
  display_name_key TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE account_sessions (
  token_hash TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES accounts(player_id) ON DELETE CASCADE,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  last_used_at TEXT,
  revoked_at TEXT
);

CREATE INDEX idx_account_sessions_player ON account_sessions(player_id);
