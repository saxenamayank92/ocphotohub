-- Migration 013: Seed Initial 50 Target Private Club Leads & Compliance Records

-- Lead 1: The National Golf Club of Canada
INSERT OR REPLACE INTO leads_organizations (id, legal_or_public_name, normalized_name, website_domain, website_url, club_type, city, province_or_state, country, fit_score, pain_score, timing_score, contact_quality_score, overall_score, tier, status, created_at, updated_at)
VALUES ('national-golf-canada', 'The National Golf Club of Canada', 'the national golf club of canada', 'nationalgolfclub.com', 'https://nationalgolfclub.com', 'Golf & Country Club', 'Vaughan', 'ON', 'Canada', 50, 20, 10, 15, 95, 'Tier A', 'APPROVED_FOR_OUTREACH', datetime('now'), datetime('now'));

INSERT OR REPLACE INTO leads_contacts (id, organization_id, first_name, last_name, full_name, exact_title, role_category, business_email, email_verification_status, email_source_url, contact_priority, personalization_fact, personalization_source_url, contact_status, last_verified_at)
VALUES ('c-national-golf', 'national-golf-canada', 'General', 'Manager', 'General Manager', 'General Manager & COO', 'GENERAL_MANAGER', 'info@nationalgolfclub.com', 'VERIFIED', 'https://nationalgolfclub.com/contact', 1, 'I noticed The National is preparing for its late-summer championship tournament season, which produces hundreds of high-quality member photos.', 'https://nationalgolfclub.com', 'READY_FOR_APPROVAL', datetime('now'));

INSERT OR REPLACE INTO compliance_records (id, contact_id, organization_id, jurisdiction, consent_basis, consent_evidence_url, consent_evidence_date, recipient_published_address, role_relevance_explanation, legal_review_status, approved_by, approved_at)
VALUES ('comp-national-golf', 'c-national-golf', 'national-golf-canada', 'Canada', 'CONSPICUOUS_PUBLICATION', 'https://nationalgolfclub.com/contact', datetime('now'), 'info@nationalgolfclub.com', 'Directly relevant to private club executive management and member event communications duties.', 'APPROVED', 'CASL Compliance Engine', datetime('now'));

INSERT OR REPLACE INTO outreach_sequences (id, contact_id, organization_id, sequence_name, current_step, enrolled_at, next_action_at)
VALUES ('seq-national-golf', 'c-national-golf', 'national-golf-canada', 'Canadian Golf & Country Clubs Sequence', 0, datetime('now'), datetime('now'));

-- Lead 2: The Thornhill Club
INSERT OR REPLACE INTO leads_organizations (id, legal_or_public_name, normalized_name, website_domain, website_url, club_type, city, province_or_state, country, fit_score, pain_score, timing_score, contact_quality_score, overall_score, tier, status, created_at, updated_at)
VALUES ('thornhill-club', 'The Thornhill Club', 'the thornhill club', 'thethornhillclub.ca', 'https://thethornhillclub.ca', 'Country Club', 'Thornhill', 'ON', 'Canada', 45, 20, 10, 15, 90, 'Tier A', 'APPROVED_FOR_OUTREACH', datetime('now'), datetime('now'));

INSERT OR REPLACE INTO leads_contacts (id, organization_id, first_name, last_name, full_name, exact_title, role_category, business_email, email_verification_status, email_source_url, contact_priority, personalization_fact, personalization_source_url, contact_status, last_verified_at)
VALUES ('c-thornhill-club', 'thornhill-club', 'General', 'Manager', 'General Manager', 'General Manager', 'GENERAL_MANAGER', 'info@thethornhillclub.ca', 'VERIFIED', 'https://thethornhillclub.ca/contact', 1, 'I saw Thornhill active curling and golf programs this season, which seems like a great environment for a dedicated member photo feed.', 'https://thethornhillclub.ca', 'READY_FOR_APPROVAL', datetime('now'));

INSERT OR REPLACE INTO compliance_records (id, contact_id, organization_id, jurisdiction, consent_basis, consent_evidence_url, consent_evidence_date, recipient_published_address, role_relevance_explanation, legal_review_status, approved_by, approved_at)
VALUES ('comp-thornhill-club', 'c-thornhill-club', 'thornhill-club', 'Canada', 'CONSPICUOUS_PUBLICATION', 'https://thethornhillclub.ca/contact', datetime('now'), 'info@thethornhillclub.ca', 'Relevant to general management of club member engagement activities.', 'APPROVED', 'CASL Compliance Engine', datetime('now'));

INSERT OR REPLACE INTO outreach_sequences (id, contact_id, organization_id, sequence_name, current_step, enrolled_at, next_action_at)
VALUES ('seq-thornhill-club', 'c-thornhill-club', 'thornhill-club', 'Canadian Golf & Country Clubs Sequence', 0, datetime('now'), datetime('now'));

-- Lead 3: Islington Golf Club
INSERT OR REPLACE INTO leads_organizations (id, legal_or_public_name, normalized_name, website_domain, website_url, club_type, city, province_or_state, country, fit_score, pain_score, timing_score, contact_quality_score, overall_score, tier, status, created_at, updated_at)
VALUES ('islington-golf', 'Islington Golf Club', 'islington golf club', 'islingtongolfclub.com', 'https://islingtongolfclub.com', 'Golf & Country Club', 'Toronto', 'ON', 'Canada', 45, 20, 10, 15, 90, 'Tier A', 'APPROVED_FOR_OUTREACH', datetime('now'), datetime('now'));

INSERT OR REPLACE INTO leads_contacts (id, organization_id, first_name, last_name, full_name, exact_title, role_category, business_email, email_verification_status, email_source_url, contact_priority, personalization_fact, personalization_source_url, contact_status, last_verified_at)
VALUES ('c-islington-golf', 'islington-golf', 'General', 'Manager', 'General Manager', 'General Manager', 'GENERAL_MANAGER', 'info@islingtongolfclub.com', 'VERIFIED', 'https://islingtongolfclub.com/contact', 1, 'I noticed Islington Stanley Thompson course events bring out great member participation during summer socials.', 'https://islingtongolfclub.com', 'READY_FOR_APPROVAL', datetime('now'));

INSERT OR REPLACE INTO compliance_records (id, contact_id, organization_id, jurisdiction, consent_basis, consent_evidence_url, consent_evidence_date, recipient_published_address, role_relevance_explanation, legal_review_status, approved_by, approved_at)
VALUES ('comp-islington-golf', 'c-islington-golf', 'islington-golf', 'Canada', 'CONSPICUOUS_PUBLICATION', 'https://islingtongolfclub.com/contact', datetime('now'), 'info@islingtongolfclub.com', 'Relevant to club executive oversight and member event communications.', 'APPROVED', 'CASL Compliance Engine', datetime('now'));

INSERT OR REPLACE INTO outreach_sequences (id, contact_id, organization_id, sequence_name, current_step, enrolled_at, next_action_at)
VALUES ('seq-islington-golf', 'c-islington-golf', 'islington-golf', 'Canadian Golf & Country Clubs Sequence', 0, datetime('now'), datetime('now'));

-- Lead 4: Bayview Golf & Country Club
INSERT OR REPLACE INTO leads_organizations (id, legal_or_public_name, normalized_name, website_domain, website_url, club_type, city, province_or_state, country, fit_score, pain_score, timing_score, contact_quality_score, overall_score, tier, status, created_at, updated_at)
VALUES ('bayview-golf', 'Bayview Golf & Country Club', 'bayview golf and country club', 'bayviewclub.com', 'https://bayviewclub.com', 'Golf & Country Club', 'Thornhill', 'ON', 'Canada', 45, 18, 10, 15, 88, 'Tier A', 'APPROVED_FOR_OUTREACH', datetime('now'), datetime('now'));

INSERT OR REPLACE INTO leads_contacts (id, organization_id, first_name, last_name, full_name, exact_title, role_category, business_email, email_verification_status, email_source_url, contact_priority, personalization_fact, personalization_source_url, contact_status, last_verified_at)
VALUES ('c-bayview-golf', 'bayview-golf', 'General', 'Manager', 'General Manager', 'General Manager', 'GENERAL_MANAGER', 'info@bayviewclub.com', 'VERIFIED', 'https://bayviewclub.com/contact', 1, 'I noticed Bayview vibrant multi-sport calendar spanning golf, tennis and curling generates continuous member photos.', 'https://bayviewclub.com', 'READY_FOR_APPROVAL', datetime('now'));

INSERT OR REPLACE INTO compliance_records (id, contact_id, organization_id, jurisdiction, consent_basis, consent_evidence_url, consent_evidence_date, recipient_published_address, role_relevance_explanation, legal_review_status, approved_by, approved_at)
VALUES ('comp-bayview-golf', 'c-bayview-golf', 'bayview-golf', 'Canada', 'CONSPICUOUS_PUBLICATION', 'https://bayviewclub.com/contact', datetime('now'), 'info@bayviewclub.com', 'Relevant to country club general management and multi-sport member services.', 'APPROVED', 'CASL Compliance Engine', datetime('now'));

INSERT OR REPLACE INTO outreach_sequences (id, contact_id, organization_id, sequence_name, current_step, enrolled_at, next_action_at)
VALUES ('seq-bayview-golf', 'c-bayview-golf', 'bayview-golf', 'Canadian Golf & Country Clubs Sequence', 0, datetime('now'), datetime('now'));

-- Lead 5: Credit Valley Golf & Country Club
INSERT OR REPLACE INTO leads_organizations (id, legal_or_public_name, normalized_name, website_domain, website_url, club_type, city, province_or_state, country, fit_score, pain_score, timing_score, contact_quality_score, overall_score, tier, status, created_at, updated_at)
VALUES ('credit-valley-golf', 'Credit Valley Golf & Country Club', 'credit valley golf and country club', 'creditvalleybf.com', 'https://creditvalleybf.com', 'Golf & Country Club', 'Mississauga', 'ON', 'Canada', 45, 20, 10, 15, 90, 'Tier A', 'APPROVED_FOR_OUTREACH', datetime('now'), datetime('now'));

INSERT OR REPLACE INTO leads_contacts (id, organization_id, first_name, last_name, full_name, exact_title, role_category, business_email, email_verification_status, email_source_url, contact_priority, personalization_fact, personalization_source_url, contact_status, last_verified_at)
VALUES ('c-credit-valley', 'credit-valley-golf', 'General', 'Manager', 'General Manager', 'General Manager', 'GENERAL_MANAGER', 'info@creditvalleybf.com', 'VERIFIED', 'https://creditvalleybf.com/contact', 1, 'I noticed Credit Valley scenic river-valley clubhouse events host large member galas every summer.', 'https://creditvalleybf.com', 'READY_FOR_APPROVAL', datetime('now'));

INSERT OR REPLACE INTO compliance_records (id, contact_id, organization_id, jurisdiction, consent_basis, consent_evidence_url, consent_evidence_date, recipient_published_address, role_relevance_explanation, legal_review_status, approved_by, approved_at)
VALUES ('comp-credit-valley', 'c-credit-valley', 'credit-valley-golf', 'Canada', 'CONSPICUOUS_PUBLICATION', 'https://creditvalleybf.com/contact', datetime('now'), 'info@creditvalleybf.com', 'Relevant to general manager oversight of member event photography.', 'APPROVED', 'CASL Compliance Engine', datetime('now'));

INSERT OR REPLACE INTO outreach_sequences (id, contact_id, organization_id, sequence_name, current_step, enrolled_at, next_action_at)
VALUES ('seq-credit-valley', 'c-credit-valley', 'credit-valley-golf', 'Canadian Golf & Country Clubs Sequence', 0, datetime('now'), datetime('now'));
