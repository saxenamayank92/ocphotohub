DROP INDEX IF EXISTS sales_leads_email_idx;
CREATE UNIQUE INDEX IF NOT EXISTS sales_leads_email_club_idx ON sales_leads (contact_email, club_name);

INSERT OR IGNORE INTO sales_leads (
  id, visitor_id, club_name, organization_type, contact_first_name, contact_last_name,
  contact_email, status, workspace_club_id, first_seen_at, last_seen_at
)
SELECT
  'existing-' || c.id, '', c.name, c.organization_type,
  COALESCE(a.first_name, 'Club'), COALESCE(a.last_name, 'Owner'), COALESCE(a.email, ''),
  'workspace_created', c.id, c.created_at, c.created_at
FROM clubs c
LEFT JOIN club_admins a ON a.id = (
  SELECT ca.id FROM club_admins ca
  WHERE ca.club_id = c.id AND ca.status = 'active'
  ORDER BY CASE WHEN ca.role = 'owner' THEN 0 ELSE 1 END, ca.created_at
  LIMIT 1
);
