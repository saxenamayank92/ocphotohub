ALTER TABLE members ADD COLUMN email TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS password_resets (
  token_hash TEXT PRIMARY KEY,
  member_number TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER
);

CREATE INDEX IF NOT EXISTS password_resets_member_idx ON password_resets (member_number);
