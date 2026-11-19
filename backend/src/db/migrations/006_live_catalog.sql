CREATE TABLE progress_new (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  level_id INTEGER NOT NULL,
  percent INTEGER NOT NULL CHECK (percent BETWEEN 1 AND 99),
  updated_at TEXT NOT NULL,
  UNIQUE (player_id, level_id)
);
INSERT INTO progress_new SELECT * FROM progress;
DROP TABLE progress;
ALTER TABLE progress_new RENAME TO progress;

CREATE TABLE completions_new (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  level_id INTEGER NOT NULL,
  completed_at TEXT NOT NULL,
  video_url TEXT,
  UNIQUE (player_id, level_id)
);
INSERT INTO completions_new SELECT * FROM completions;
DROP TABLE completions;
ALTER TABLE completions_new RENAME TO completions;

DROP TABLE imported_records;
DELETE FROM levels;

CREATE INDEX idx_completions_level ON completions(level_id);
CREATE INDEX idx_completions_player ON completions(player_id);
CREATE INDEX idx_progress_level ON progress(level_id);
CREATE INDEX idx_progress_player ON progress(player_id);
