ALTER TABLE clubs ADD COLUMN stripe_plan_subscription_id TEXT NOT NULL DEFAULT '';
ALTER TABLE clubs ADD COLUMN stripe_storage_subscription_id TEXT NOT NULL DEFAULT '';
ALTER TABLE clubs ADD COLUMN storage_addon_gb INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS stripe_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  processed_at TEXT NOT NULL
);
