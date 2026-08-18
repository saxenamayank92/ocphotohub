-- Known exceptions found during the August 2026 Gmail audit.
-- Organization-level decline: Richmond Hill Curling Club.
INSERT OR IGNORE INTO outreach_suppressions
  (id, scope, scope_key, reason, source, source_reference, created_at)
VALUES
  ('supp_audit_rhcurling_org', 'organization', 'richmond-hill-curling-club', 'explicit_decline', 'gmail_audit', 'Reply received 2026-08-10', CURRENT_TIMESTAMP),
  ('supp_audit_rhcurling_email', 'recipient', 'manager@rhcurling.com', 'explicit_decline', 'gmail_audit', 'Reply received 2026-08-10', CURRENT_TIMESTAMP),
  ('supp_audit_rogc_unmonitored', 'recipient', 'info@rogc.com', 'unmonitored_mailbox', 'gmail_audit', 'Automatic reply received 2026-08-05', CURRENT_TIMESTAMP),
  ('supp_audit_toronto_retired', 'recipient', 'arichardson@torontogolfclub.com', 'retired_contact', 'gmail_audit', 'Automatic reply received 2026-08-04', CURRENT_TIMESTAMP);

-- Exact recipients that received duplicate initial pitches are held until history reconciliation completes.
INSERT OR IGNORE INTO outreach_suppressions
  (id, scope, scope_key, reason, source, source_reference, created_at, expires_at)
VALUES
  ('supp_audit_dup_lexington', 'recipient', 'ptruchan@lexingtoncountryclub.com', 'duplicate_initial_pitch_hold', 'gmail_audit', 'Duplicate sends 2026-08-04 and 2026-08-06', CURRENT_TIMESTAMP, ''),
  ('supp_audit_dup_sevenoaks', 'recipient', 'econtreras@sevenoakscountryclub.com', 'duplicate_initial_pitch_hold', 'gmail_audit', 'Duplicate sends 2026-08-04 and 2026-08-06', CURRENT_TIMESTAMP, ''),
  ('supp_audit_dup_winchester', 'recipient', 'steve@wcc1923.com', 'duplicate_initial_pitch_hold', 'gmail_audit', 'Duplicate sends 2026-08-04 and 2026-08-06', CURRENT_TIMESTAMP, ''),
  ('supp_audit_dup_moorhead', 'recipient', 'chris.larson@moorheadcountryclub.com', 'duplicate_initial_pitch_hold', 'gmail_audit', 'Duplicate sends 2026-08-04 and 2026-08-06', CURRENT_TIMESTAMP, '');
