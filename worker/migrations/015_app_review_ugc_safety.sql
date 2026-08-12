CREATE TABLE IF NOT EXISTS content_reports (
  id TEXT PRIMARY KEY,
  club_id TEXT NOT NULL,
  reporter_member_number TEXT NOT NULL,
  reported_member_number TEXT NOT NULL,
  photo_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  action TEXT NOT NULL DEFAULT 'report',
  created_at TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open'
);

CREATE TABLE IF NOT EXISTS member_blocks (
  club_id TEXT NOT NULL,
  blocker_member_number TEXT NOT NULL,
  blocked_member_number TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (club_id, blocker_member_number, blocked_member_number)
);

CREATE INDEX IF NOT EXISTS content_reports_club_created_idx ON content_reports (club_id, created_at DESC);
CREATE INDEX IF NOT EXISTS member_blocks_blocker_idx ON member_blocks (club_id, blocker_member_number);
