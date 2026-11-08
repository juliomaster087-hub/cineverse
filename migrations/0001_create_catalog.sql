-- CineVerse content schema
CREATE TABLE IF NOT EXISTS series (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  synopsis TEXT NOT NULL DEFAULT '',
  genre TEXT NOT NULL DEFAULT '',
  year INTEGER,
  poster_url TEXT NOT NULL DEFAULT '',
  featured INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS episodes (
  id TEXT PRIMARY KEY,
  series_id TEXT NOT NULL REFERENCES series(id) ON DELETE CASCADE,
  season_number INTEGER NOT NULL DEFAULT 1,
  episode_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  synopsis TEXT NOT NULL DEFAULT '',
  youtube_url TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('draft','published','scheduled')),
  scheduled_at INTEGER,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  UNIQUE(series_id, season_number, episode_number)
);

CREATE INDEX IF NOT EXISTS idx_episodes_series ON episodes(series_id, season_number, episode_number);
CREATE INDEX IF NOT EXISTS idx_episodes_release ON episodes(status, scheduled_at);
