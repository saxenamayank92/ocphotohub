ALTER TABLE members ADD COLUMN password_hash TEXT NOT NULL DEFAULT '';
ALTER TABLE members ADD COLUMN password_salt TEXT NOT NULL DEFAULT '';
ALTER TABLE members ADD COLUMN role TEXT NOT NULL DEFAULT 'member';

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  member_number TEXT NOT NULL,
  role TEXT NOT NULL,
  csrf_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);
