CREATE TABLE imported_records (
  id TEXT PRIMARY KEY,
  level_id INTEGER NOT NULL REFERENCES levels(level_id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('pointercrate','aredl','gddl')),
  player_name TEXT NOT NULL,
  percent INTEGER NOT NULL,
  completed_at TEXT,
  proof_url TEXT,
  verification_status TEXT NOT NULL CHECK (verification_status IN ('verified','stat','unknown')),
  imported_at TEXT NOT NULL
);
CREATE TABLE source_status (
  source TEXT PRIMARY KEY CHECK (source IN ('pointercrate','aredl','gddl')),
  ok INTEGER NOT NULL DEFAULT 1,
  last_updated TEXT,
  stale INTEGER NOT NULL DEFAULT 0,
  last_error TEXT
);
CREATE TABLE refresh_runs (
  id TEXT PRIMARY KEY,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  status TEXT NOT NULL CHECK (status IN ('running','success','failed')),
  counts_json TEXT,
  error TEXT
);
INSERT OR IGNORE INTO source_status (source, ok, last_updated, stale) VALUES
  ('pointercrate', 1, NULL, 0), ('aredl', 1, NULL, 0), ('gddl', 1, NULL, 0);
