CREATE TABLE IF NOT EXISTS clubs (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  logo_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  organization_type TEXT NOT NULL DEFAULT 'Private Club',
  plan_status TEXT NOT NULL DEFAULT 'active',
  trial_started_at TEXT NOT NULL DEFAULT '',
  trial_ends_at TEXT NOT NULL DEFAULT '',
  storage_limit_bytes INTEGER NOT NULL DEFAULT 26843545600,
  created_at TEXT NOT NULL
);

INSERT OR IGNORE INTO clubs (id, slug, name, short_name, logo_url, status, created_at)
VALUES ('oakville-club', 'oakville-club', 'Oakville Club', 'Oakville', '/oakville-logo.jpg', 'active', datetime('now'));

CREATE TABLE IF NOT EXISTS members (
  club_id TEXT NOT NULL,
  member_number TEXT NOT NULL,
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  password TEXT NOT NULL DEFAULT '',
  registered_at TEXT NOT NULL DEFAULT '',
  password_hash TEXT NOT NULL DEFAULT '',
  password_salt TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'member',
  email TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (club_id, member_number),
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL,
  object_key TEXT,
  external_url TEXT,
  caption TEXT NOT NULL,
  category TEXT NOT NULL,
  uploader_name TEXT NOT NULL,
  uploader_id TEXT NOT NULL,
  created_at TEXT NOT NULL,
  hearts INTEGER NOT NULL DEFAULT 0,
  byte_size INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS photo_likes (
  club_id TEXT NOT NULL,
  photo_id TEXT NOT NULL,
  member_number TEXT NOT NULL,
  PRIMARY KEY (club_id, photo_id, member_number),
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  club_id TEXT NOT NULL,
  member_number TEXT NOT NULL,
  role TEXT NOT NULL,
  csrf_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS password_resets (
  token_hash TEXT PRIMARY KEY,
  club_id TEXT NOT NULL,
  member_number TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS registration_challenges (
  club_id TEXT NOT NULL,
  member_number TEXT NOT NULL,
  email_hash TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL,
  PRIMARY KEY (club_id, member_number),
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS club_admins (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL,
  email TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  password_salt TEXT NOT NULL,
  verified_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  role TEXT NOT NULL DEFAULT 'owner',
  created_at TEXT NOT NULL,
  UNIQUE (club_id, email),
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS club_signup_challenges (
  id TEXT PRIMARY KEY,
  club_slug TEXT NOT NULL,
  club_name TEXT NOT NULL,
  club_short_name TEXT NOT NULL,
  club_logo_url TEXT NOT NULL DEFAULT '',
  organization_type TEXT NOT NULL DEFAULT 'Private Club',
  admin_email TEXT NOT NULL,
  admin_first_name TEXT NOT NULL,
  admin_last_name TEXT NOT NULL,
  code_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS admin_password_resets (
  token_hash TEXT PRIMARY KEY,
  club_id TEXT NOT NULL,
  admin_id TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
  FOREIGN KEY (admin_id) REFERENCES club_admins(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS members_club_email_idx ON members (club_id, email);
CREATE INDEX IF NOT EXISTS photos_club_created_idx ON photos (club_id, created_at DESC);
CREATE INDEX IF NOT EXISTS sessions_expires_at_idx ON sessions (expires_at);
CREATE INDEX IF NOT EXISTS password_resets_member_idx ON password_resets (club_id, member_number);
CREATE INDEX IF NOT EXISTS club_admins_email_idx ON club_admins (club_id, email);
CREATE INDEX IF NOT EXISTS club_signup_expires_idx ON club_signup_challenges (expires_at);
CREATE INDEX IF NOT EXISTS admin_password_resets_admin_idx ON admin_password_resets (club_id, admin_id);
