-- Migration 013: additive, fail-closed outreach safety controls.
-- Existing send history and the legacy suppression table must be reconciled before OUTREACH_ENABLED is changed.

ALTER TABLE sales_leads ADD COLUMN email_verification_status TEXT NOT NULL DEFAULT 'unverified';
ALTER TABLE sales_leads ADD COLUMN last_verified_at TEXT NOT NULL DEFAULT '';
ALTER TABLE sales_leads ADD COLUMN verification_provider TEXT NOT NULL DEFAULT '';
ALTER TABLE sales_leads ADD COLUMN organization_key TEXT NOT NULL DEFAULT '';
ALTER TABLE sales_leads ADD COLUMN outreach_review_status TEXT NOT NULL DEFAULT 'unreviewed';

CREATE TABLE IF NOT EXISTS outreach_suppressions (
  id TEXT PRIMARY KEY,
  scope TEXT NOT NULL CHECK (scope IN ('recipient', 'organization', 'domain')),
  scope_key TEXT NOT NULL,
  reason TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'manual',
  source_reference TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL DEFAULT '',
  UNIQUE (scope, scope_key)
);

CREATE TABLE IF NOT EXISTS outreach_messages (
  id TEXT PRIMARY KEY,
  idempotency_key TEXT NOT NULL UNIQUE,
  lead_id TEXT NOT NULL DEFAULT '',
  organization_key TEXT NOT NULL,
  recipient_email TEXT NOT NULL,
  campaign_id TEXT NOT NULL,
  sequence_step INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'provider_accepted', 'delivered', 'soft_bounced', 'hard_bounced', 'complained', 'unsubscribed', 'failed')),
  provider_message_id TEXT NOT NULL DEFAULT '',
  attempted_at TEXT NOT NULL,
  accepted_at TEXT NOT NULL DEFAULT '',
  delivered_at TEXT NOT NULL DEFAULT '',
  failed_at TEXT NOT NULL DEFAULT '',
  error_code TEXT NOT NULL DEFAULT '',
  error_message TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS outreach_policy (
  id TEXT PRIMARY KEY CHECK (id = 'default'),
  enabled INTEGER NOT NULL DEFAULT 0,
  daily_cap INTEGER NOT NULL DEFAULT 5,
  organization_cooldown_days INTEGER NOT NULL DEFAULT 30,
  recipient_cooldown_days INTEGER NOT NULL DEFAULT 45,
  updated_at TEXT NOT NULL,
  updated_by TEXT NOT NULL DEFAULT 'system'
);

INSERT OR IGNORE INTO outreach_policy (id, enabled, daily_cap, organization_cooldown_days, recipient_cooldown_days, updated_at)
VALUES ('default', 0, 5, 30, 45, CURRENT_TIMESTAMP);

CREATE INDEX IF NOT EXISTS outreach_suppressions_lookup_idx ON outreach_suppressions (scope, scope_key);
CREATE INDEX IF NOT EXISTS outreach_messages_recipient_idx ON outreach_messages (recipient_email, attempted_at DESC);
CREATE INDEX IF NOT EXISTS outreach_messages_org_idx ON outreach_messages (organization_key, attempted_at DESC);
CREATE INDEX IF NOT EXISTS outreach_messages_status_idx ON outreach_messages (status, attempted_at DESC);
