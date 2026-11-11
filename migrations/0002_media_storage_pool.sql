-- CineVerse multi-provider media storage pool
ALTER TABLE episodes ADD COLUMN video_provider TEXT;
ALTER TABLE episodes ADD COLUMN video_url TEXT;

CREATE TABLE IF NOT EXISTS media_objects (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  object_key TEXT NOT NULL,
  public_url TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  content_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('uploading','ready','failed','deleted')),
  created_at INTEGER NOT NULL,
  UNIQUE(provider_id, object_key)
);

CREATE INDEX IF NOT EXISTS idx_media_objects_provider_status
  ON media_objects(provider_id, status);
