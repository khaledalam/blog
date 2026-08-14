CREATE TABLE IF NOT EXISTS comments (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT    NOT NULL,
  name       TEXT    NOT NULL,
  body       TEXT    NOT NULL,
  created_at INTEGER NOT NULL,
  approved   INTEGER NOT NULL DEFAULT 0,
  ip_hash    TEXT
);
CREATE INDEX IF NOT EXISTS idx_comments_public  ON comments (slug, approved, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_pending ON comments (approved, created_at);
CREATE INDEX IF NOT EXISTS idx_comments_rate    ON comments (ip_hash, created_at);
