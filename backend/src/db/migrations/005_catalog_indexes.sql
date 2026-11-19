CREATE INDEX idx_levels_global_rank ON levels(global_rank);
CREATE INDEX idx_levels_zone_rank ON levels(zone, zone_rank);
CREATE INDEX idx_levels_name ON levels(name COLLATE NOCASE);
CREATE INDEX idx_levels_author ON levels(author COLLATE NOCASE);
CREATE INDEX idx_completions_level ON completions(level_id);
CREATE INDEX idx_completions_player ON completions(player_id);
CREATE INDEX idx_progress_level ON progress(level_id);
CREATE INDEX idx_progress_player ON progress(player_id);
CREATE INDEX idx_imported_level ON imported_records(level_id);
