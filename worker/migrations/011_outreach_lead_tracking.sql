-- Migration 011: Add outreach lead tracking and click engagement metrics

ALTER TABLE sales_leads ADD COLUMN lead_code TEXT NOT NULL DEFAULT '';
ALTER TABLE sales_leads ADD COLUMN clicks_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE sales_leads ADD COLUMN last_clicked_at TEXT NOT NULL DEFAULT '';
ALTER TABLE sales_leads ADD COLUMN notes TEXT NOT NULL DEFAULT '';

CREATE INDEX IF NOT EXISTS sales_leads_code_idx ON sales_leads (lead_code);
