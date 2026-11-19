CREATE TABLE progress (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  level_id INTEGER NOT NULL REFERENCES levels(level_id) ON DELETE CASCADE,
  percent INTEGER NOT NULL CHECK (percent BETWEEN 1 AND 99),
  updated_at TEXT NOT NULL,
  UNIQUE (player_id, level_id)
);
CREATE TABLE completions (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  level_id INTEGER NOT NULL REFERENCES levels(level_id) ON DELETE CASCADE,
  completed_at TEXT NOT NULL,
  video_url TEXT,
  UNIQUE (player_id, level_id)
);
