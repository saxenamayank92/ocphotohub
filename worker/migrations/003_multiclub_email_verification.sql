PRAGMA foreign_keys = OFF;

CREATE TABLE clubs (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  short_name TEXT NOT NULL,
  logo_url TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TEXT NOT NULL
);

INSERT INTO clubs (id, slug, name, short_name, logo_url, status, created_at)
VALUES ('oakville-club', 'oakville-club', 'Oakville Club', 'Oakville', '/oakville-logo.jpg', 'active', datetime('now'));

CREATE TABLE members_v2 (
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
INSERT INTO members_v2 SELECT 'oakville-club', member_number, last_name, first_name, password, registered_at, password_hash, password_salt, role, email FROM members;

CREATE TABLE photos_v2 (
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
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);
INSERT INTO photos_v2 SELECT id, 'oakville-club', object_key, external_url, caption, category, uploader_name, uploader_id, created_at, hearts FROM photos;

CREATE TABLE photo_likes_data (
  club_id TEXT NOT NULL,
  photo_id TEXT NOT NULL,
  member_number TEXT NOT NULL
);
INSERT INTO photo_likes_data SELECT 'oakville-club', photo_id, member_number FROM photo_likes;

CREATE TABLE sessions_v2 (
  token_hash TEXT PRIMARY KEY,
  club_id TEXT NOT NULL,
  member_number TEXT NOT NULL,
  role TEXT NOT NULL,
  csrf_hash TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);
INSERT INTO sessions_v2 SELECT token_hash, 'oakville-club', member_number, role, csrf_hash, expires_at FROM sessions;

CREATE TABLE password_resets_v2 (
  token_hash TEXT PRIMARY KEY,
  club_id TEXT NOT NULL,
  member_number TEXT NOT NULL,
  expires_at INTEGER NOT NULL,
  used_at INTEGER,
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE
);
INSERT INTO password_resets_v2 SELECT token_hash, 'oakville-club', member_number, expires_at, used_at FROM password_resets;

DROP TABLE photo_likes;
DROP TABLE photos;
DROP TABLE sessions;
DROP TABLE password_resets;
DROP TABLE members;

ALTER TABLE members_v2 RENAME TO members;
ALTER TABLE photos_v2 RENAME TO photos;
ALTER TABLE sessions_v2 RENAME TO sessions;
ALTER TABLE password_resets_v2 RENAME TO password_resets;

CREATE TABLE photo_likes (
  club_id TEXT NOT NULL,
  photo_id TEXT NOT NULL,
  member_number TEXT NOT NULL,
  PRIMARY KEY (club_id, photo_id, member_number),
  FOREIGN KEY (club_id) REFERENCES clubs(id) ON DELETE CASCADE,
  FOREIGN KEY (photo_id) REFERENCES photos(id) ON DELETE CASCADE
);
INSERT INTO photo_likes SELECT club_id, photo_id, member_number FROM photo_likes_data;
DROP TABLE photo_likes_data;

CREATE TABLE registration_challenges (
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

CREATE INDEX members_club_email_idx ON members (club_id, email);
CREATE INDEX photos_club_created_idx ON photos (club_id, created_at DESC);
CREATE INDEX sessions_expires_at_idx ON sessions (expires_at);
CREATE INDEX password_resets_member_idx ON password_resets (club_id, member_number);

PRAGMA foreign_keys = ON;
