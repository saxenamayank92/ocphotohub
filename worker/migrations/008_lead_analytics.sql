ALTER TABLE club_signup_challenges ADD COLUMN visitor_id TEXT NOT NULL DEFAULT '';

CREATE TABLE IF NOT EXISTS lead_events (
  id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  path TEXT NOT NULL DEFAULT '',
  referrer TEXT NOT NULL DEFAULT '',
  club_id TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS sales_leads (
  id TEXT PRIMARY KEY,
  visitor_id TEXT NOT NULL DEFAULT '',
  club_name TEXT NOT NULL,
  organization_type TEXT NOT NULL,
  contact_first_name TEXT NOT NULL,
  contact_last_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'verification_started',
  workspace_club_id TEXT NOT NULL DEFAULT '',
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS lead_events_type_created_idx ON lead_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS lead_events_visitor_idx ON lead_events (visitor_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS sales_leads_email_idx ON sales_leads (contact_email);
CREATE INDEX IF NOT EXISTS sales_leads_last_seen_idx ON sales_leads (last_seen_at DESC);
