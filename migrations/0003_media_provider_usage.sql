-- Monthly free-tier request guards for the media storage pool
CREATE TABLE IF NOT EXISTS media_provider_usage (
  provider_id TEXT NOT NULL,
  month_key TEXT NOT NULL,
  read_requests INTEGER NOT NULL DEFAULT 0,
  write_requests INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (provider_id, month_key)
);
