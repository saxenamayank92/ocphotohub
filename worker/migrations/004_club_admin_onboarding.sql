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

CREATE INDEX IF NOT EXISTS club_admins_email_idx ON club_admins (club_id, email);
CREATE INDEX IF NOT EXISTS club_signup_expires_idx ON club_signup_challenges (expires_at);
CREATE INDEX IF NOT EXISTS admin_password_resets_admin_idx ON admin_password_resets (club_id, admin_id);
