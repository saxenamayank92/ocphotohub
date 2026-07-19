CREATE TABLE IF NOT EXISTS members (
  member_number TEXT PRIMARY KEY,
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  password TEXT NOT NULL DEFAULT '',
  registered_at TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL DEFAULT '',
  password_salt TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'member',
  email TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  object_key TEXT,
  external_url TEXT,
  caption TEXT NOT NULL,
  category TEXT NOT NULL,
  uploader_name TEXT NOT NULL,
  uploader_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  hearts INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS photo_likes (
  photo_id TEXT NOT NULL,
  member_number TEXT NOT NULL,
  PRIMARY KEY (photo_id, member_number),
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  member_number TEXT NOT NULL,
  role TEXT NOT NULL,
  csrf_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS password_resets (
  token_hash TEXT PRIMARY KEY,
  member_number TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER
);
