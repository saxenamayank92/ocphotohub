-- Migration 012: Master Growth System Normalized Lead & Compliance Schema

CREATE TABLE IF NOT EXISTS leads_organizations (
  id TEXT PRIMARY KEY,
  legal_or_public_name TEXT NOT NULL,
  normalized_name TEXT NOT NULL,
  website_domain TEXT NOT NULL,
  website_url TEXT NOT NULL DEFAULT '',
  club_type TEXT NOT NULL DEFAULT 'Golf & Country Club',
  city TEXT NOT NULL DEFAULT '',
  province_or_state TEXT NOT NULL DEFAULT '',
  country TEXT NOT NULL DEFAULT 'Canada',
  postal_code TEXT NOT NULL DEFAULT '',
  membership_size_estimate INTEGER NOT NULL DEFAULT 0,
  public_private_classification TEXT NOT NULL DEFAULT 'Private',
  active_event_program TEXT NOT NULL DEFAULT '',
  event_evidence_url TEXT NOT NULL DEFAULT '',
  photo_sharing_observation TEXT NOT NULL DEFAULT '',
  existing_club_system TEXT NOT NULL DEFAULT '',
  fit_score INTEGER NOT NULL DEFAULT 0,
  pain_score INTEGER NOT NULL DEFAULT 0,
  timing_score INTEGER NOT NULL DEFAULT 0,
  contact_quality_score INTEGER NOT NULL DEFAULT 0,
  overall_score INTEGER NOT NULL DEFAULT 0,
  tier TEXT NOT NULL DEFAULT 'Tier B',
  status TEXT NOT NULL DEFAULT 'RESEARCH_INCOMPLETE',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS leads_contacts (
  id TEXT PRIMARY KEY,
  organization_id TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  full_name TEXT NOT NULL,
  exact_title TEXT NOT NULL,
  role_category TEXT NOT NULL DEFAULT 'GENERAL_MANAGER',
  business_email TEXT NOT NULL,
  email_verification_status TEXT NOT NULL DEFAULT 'VERIFIED',
  email_source_url TEXT NOT NULL DEFAULT '',
  email_source_date TEXT NOT NULL DEFAULT '',
  contact_priority INTEGER NOT NULL DEFAULT 1,
  personalization_fact TEXT NOT NULL DEFAULT '',
  personalization_source_url TEXT NOT NULL DEFAULT '',
  contact_status TEXT NOT NULL DEFAULT 'READY_FOR_APPROVAL',
  last_verified_at TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (organization_id) REFERENCES leads_organizations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS compliance_records (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  jurisdiction TEXT NOT NULL DEFAULT 'Canada',
  consent_basis TEXT NOT NULL DEFAULT 'CONSPICUOUS_PUBLICATION',
  consent_evidence_url TEXT NOT NULL DEFAULT '',
  consent_evidence_date TEXT NOT NULL DEFAULT '',
  recipient_published_address TEXT NOT NULL DEFAULT '',
  no_solicitation_notice_found INTEGER NOT NULL DEFAULT 0,
  role_relevance_explanation TEXT NOT NULL DEFAULT '',
  legal_review_status TEXT NOT NULL DEFAULT 'APPROVED',
  approved_by TEXT NOT NULL DEFAULT 'Automated Compliance Engine',
  approved_at TEXT NOT NULL DEFAULT '',
  suppression_status TEXT NOT NULL DEFAULT 'ACTIVE',
  suppression_reason TEXT NOT NULL DEFAULT '',
  unsubscribe_at TEXT NOT NULL DEFAULT '',
  FOREIGN KEY (contact_id) REFERENCES leads_contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES leads_organizations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS outreach_sequences (
  id TEXT PRIMARY KEY,
  contact_id TEXT NOT NULL,
  organization_id TEXT NOT NULL,
  sequence_name TEXT NOT NULL DEFAULT 'Golf & Country Clubs Core Sequence',
  current_step INTEGER NOT NULL DEFAULT 0,
  enrolled_at TEXT NOT NULL,
  next_action_at TEXT NOT NULL DEFAULT '',
  last_email_at TEXT NOT NULL DEFAULT '',
  reply_at TEXT NOT NULL DEFAULT '',
  response_sentiment TEXT NOT NULL DEFAULT 'PENDING',
  demo_booked_at TEXT NOT NULL DEFAULT '',
  demo_completed_at TEXT NOT NULL DEFAULT '',
  pilot_started_at TEXT NOT NULL DEFAULT '',
  converted_at TEXT NOT NULL DEFAULT '',
  do_not_contact INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (contact_id) REFERENCES leads_contacts(id) ON DELETE CASCADE,
  FOREIGN KEY (organization_id) REFERENCES leads_organizations(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS demo_requests (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  work_email TEXT NOT NULL,
  club_name TEXT NOT NULL,
  job_title TEXT NOT NULL,
  country TEXT NOT NULL,
  province_state TEXT NOT NULL,
  club_type TEXT NOT NULL,
  member_count TEXT NOT NULL DEFAULT '',
  current_photo_method TEXT NOT NULL DEFAULT '',
  preferred_time TEXT NOT NULL DEFAULT '',
  program TEXT NOT NULL DEFAULT 'Standard Demo',
  consent INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS suppression_list (
  email TEXT PRIMARY KEY,
  reason TEXT NOT NULL DEFAULT 'UNSUBSCRIBED',
  source_campaign TEXT NOT NULL DEFAULT '',
  suppressed_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS leads_orgs_tier_idx ON leads_organizations (tier, overall_score DESC);
CREATE INDEX IF NOT EXISTS leads_contacts_email_idx ON leads_contacts (business_email);
CREATE INDEX IF NOT EXISTS compliance_records_contact_idx ON compliance_records (contact_id);
CREATE INDEX IF NOT EXISTS outreach_next_action_idx ON outreach_sequences (next_action_at);
CREATE INDEX IF NOT EXISTS demo_requests_created_idx ON demo_requests (created_at DESC);
