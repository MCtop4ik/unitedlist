CREATE TABLE levels (
  level_id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  author TEXT NOT NULL,
  zone TEXT NOT NULL CHECK (zone IN ('pointercrate','aredl','gddl')),
  zone_rank INTEGER NOT NULL CHECK (zone_rank > 0),
  global_rank INTEGER NOT NULL UNIQUE CHECK (global_rank > 0),
  difficulty TEXT NOT NULL,
  length TEXT NOT NULL CHECK (length IN ('tiny','short','medium','long','xl')),
  thumbnail_url TEXT,
  video_url TEXT,
  song TEXT,
  source_updated_at TEXT NOT NULL,
  UNIQUE (zone, zone_rank)
);
