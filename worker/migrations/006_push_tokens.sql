CREATE TABLE IF NOT EXISTS device_push_tokens (
  club_id TEXT NOT NULL,
  member_number TEXT NOT NULL,
  token TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'unknown',
  created_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  PRIMARY KEY (club_id, token),
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS device_push_tokens_member_idx ON device_push_tokens (club_id, member_number);
