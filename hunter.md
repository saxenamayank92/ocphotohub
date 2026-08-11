# 🏹 Hunter AI & B2B Lead Engine Architecture Specification
> **System Blueprint & Implementation Guide for Recreating Hunter AI & Lead Dashboard on `xtide.io`**

---

## 1. Executive Summary & Core Philosophy

**Hunter AI** is an autonomous, B2B sales and lead generation co-pilot designed to streamline cold outreach, lead tracking, workspace claims, and conversion analytics. 

It combines two powerful engines:
1. **Rule-Based Fast Execution Engine**: Low-latency, deterministic handlers for batch email dispatches, database suppression audits, and target queue inspection.
2. **Gemini 2.5 Flash LLM Reasoning Engine**: An executive AI Sales Director persona that analyzes real-time CRM pipeline metrics, writes hyper-personalized pitch copy, and enforces safety guardrails before executing commands.

---

## 2. System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (REACT)                              │
│                                                                         │
│   ┌───────────────────────────────┐   ┌─────────────────────────────┐   │
│   │   AIAgentConsole.jsx          │   │   LeadDashboard.jsx         │   │
│   │   (Terminal UI & AI Chat)     │   │   (CRM Pipeline & Sourcing) │   │
│   └───────────────┬───────────────┘   └──────────────┬──────────────┘   │
└───────────────────┼──────────────────────────────────┼──────────────────┘
                    │ REST API                         │ REST API
┌───────────────────▼──────────────────────────────────▼──────────────────┐
│                   CLOUDFLARE WORKER BACKEND ENGINE                       │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ handleAgentChatCommand()                                          │  │
│  │  ├─ 1. Rule Matcher (Test Emails, Sourcing, Follow-ups, Audits)   │  │
│  │  └─ 2. Gemini 2.5 Flash LLM Co-Pilot (Strategic Reasoning)        │  │
│  └─────────────────────────────────┬─────────────────────────────────┘  │
│                                    │                                    │
│   ┌──────────────────────────────┐ │ ┌──────────────────────────────┐   │
│   │ MailerSend API               │ │ │ Cloudflare D1 (SQLite DB)    │   │
│   │ (Email Delivery Engine)      │ │ │ (Leads & Suppression Tables) │   │
│   └──────────────────────────────┘ │ └──────────────────────────────┘   │
└────────────────────────────────────┼────────────────────────────────────┘
                                     │ Cron Trigger (Daily 9:00 AM UTC)
                                     ▼
                    ┌─────────────────────────────────┐
                    │ Autonomous Daily Batch Campaign │
                    └─────────────────────────────────┘
```

---

## 3. Database Schema (Cloudflare D1 / SQLite)

### 3.1 `sales_leads` Table
Stores targeted leads, contact details, preview engagement metrics, and sales status.

```sql
CREATE TABLE IF NOT EXISTS sales_leads (
  id TEXT PRIMARY KEY,
  visitor_id TEXT DEFAULT '',
  lead_code TEXT UNIQUE,
  club_name TEXT NOT NULL,
  organization_type TEXT DEFAULT 'Private Club',
  contact_first_name TEXT DEFAULT '',
  contact_last_name TEXT DEFAULT '',
  contact_email TEXT NOT NULL,
  status TEXT DEFAULT 'new', -- Statuses: 'new', 'outreach_sent', 'link_clicked', 'hot_prospect', 'claim_requested', 'converted'
  clicks_count INTEGER DEFAULT 0,
  last_clicked_at TEXT DEFAULT '',
  notes TEXT DEFAULT '',
  first_seen_at TEXT NOT NULL,
  last_seen_at TEXT NOT NULL,
  CONSTRAINT unique_lead_contact UNIQUE (contact_email, club_name)
);
```

### 3.2 `suppression_list` Table
Enforces zero duplicate email sends and tracks outreach history.

```sql
CREATE TABLE IF NOT EXISTS suppression_list (
  id TEXT PRIMARY KEY,
  contact_email TEXT UNIQUE NOT NULL,
  club_name TEXT DEFAULT '',
  reason TEXT DEFAULT 'outreach_sent',
  created_at TEXT NOT NULL
);
```

---

## 4. The 2-Step CMO Conversion Strategy & Email Templates

### 🎯 Step 1: Initial Cold Outreach (Focus: 1-Click Interactive Preview)
- **Objective**: Maximum link click rate.
- **Copy Structure**:
  - **Subject**: `Interactive Concept for {{company_name}} Leadership`
  - **Pain Point**: Photos/data scattered across unverified tools (Google Drive, Dropbox, email attachments).
  - **Differentiator**: Private, branded solution secured directly by official member/organization roster.
  - **1-Click CTA**: `👉 Explore Interactive Preview →` (`https://xtide.io/preview/{{lead_code}}`)
  - **Rule**: NO em-dashes (`—`), NO pitch clutter, single clear link.

### 💰 Step 2: Follow-Up Sequence (Sent 3 Days Later)
- **Objective**: High-margin monetization & ROI breakdown.
- **Copy Structure**:
  - **Subject**: `Re: Self-funding platform for {{company_name}}`
  - **Security Pitch**: Roster-level security (Member # + Last Name). No link leaks, zero Gmail sign-ins.
  - **Self-Funding Pitch**: Explains how billing $80–$200 per private event invoice makes the software pay for itself with just 6–8 events per year ($0 transaction fees).

---

## 5. Email Engine Implementation (`clubPhotoHubEmail`)

To guarantee emails render perfectly across Microsoft Outlook, Apple Mail, Gmail, and iOS/Android without raw HTML tags or escaping glitches:

```javascript
const emailEscape = value => escapeHtml(String(value ?? ''));

const clubPhotoHubEmail = ({ eyebrow = '', title, intro, code, details, actionLabel, actionUrl, signature, securityNote = true }) => {
  const codeMarkup = code
    ? `<div style="margin:28px 0 24px;padding:18px 22px;background:#f7f3eb;border:1px solid #d8c39a;border-radius:14px;color:#17133f;font-family:Arial,sans-serif;font-size:34px;font-weight:700;letter-spacing:9px;text-align:center">${emailEscape(code)}</div>`
    : '';

  const actionMarkup = actionUrl
    ? `<div style="margin:28px 0"><a href="${emailEscape(actionUrl)}" style="display:inline-block;background:#29216b;color:#ffffff;text-decoration:none;padding:14px 24px;border-radius:9px;font-family:Arial,sans-serif;font-size:16px;font-weight:700">${emailEscape(actionLabel || 'Continue')}</a></div>`
    : '';

  const noteMarkup = securityNote ? '<p style="margin:28px 0 0;color:#697874;font-size:13px;line-height:1.6">If you did not request this email, you can safely ignore it. For help, contact <a href="mailto:support@xtide.io" style="color:#285c59">support@xtide.io</a>.</p>' : '';
  const eyebrowMarkup = eyebrow ? `<div style="color:#a78345;font-size:12px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:12px">${emailEscape(eyebrow)}</div>` : '';

  // Parse paragraphs separated by double newlines into clean HTML <p> blocks
  const introMarkup = String(intro || '')
    .split(/\n\s*\n/)
    .map(p => `<p style="margin:0 0 16px;font-size:15px;line-height:1.65;color:#1e293b">${emailEscape(p).replace(/\n/g, '<br/>')}</p>`)
    .join('');

  return `<!doctype html><html><body style="margin:0;background:#f7f5f0;color:#1c2531;font-family:Arial,Helvetica,sans-serif"><div style="padding:32px 16px"><div style="max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #dce2e0;border-top:7px solid #c8a76b;border-radius:20px;overflow:hidden;box-shadow:0 10px 28px rgba(13,23,40,.09)"><div style="padding:26px 32px 24px;background:#172238;color:#ffffff"><img src="https://clubphotohub.com/club-photo-hub-icon-192.png" width="48" height="48" alt="Club PhotoHub" style="display:block;width:48px;height:48px;border:0;border-radius:12px"><div style="margin-top:16px;color:#e2c892;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase">Club PhotoHub</div><div style="margin-top:8px;font-family:Georgia,'Times New Roman',serif;font-size:26px;line-height:1.2">${emailEscape(title)}</div></div><div style="padding:32px">${eyebrowMarkup}${introMarkup}${codeMarkup}${actionMarkup}${noteMarkup}</div><div style="padding:18px 32px;background:#faf9f6;border-top:1px solid #e6e8e4;color:#697874;font-size:12px;line-height:1.5">A private place for the moments that bring your club together.<br><span style="color:#a78345">Club PhotoHub by xTide Apps</span></div></div></div></body></html>`;
};
```

---

## 6. Live Workspace Claim API & Instant Alerts (`/leads/claim`)

When a lead or GM clicks **Claim Workspace** on their preview link and submits the form, the API:
1. Registers/updates the lead status in D1 DB as `claim_requested`.
2. Sends an instant alert email to the Founder (`mayank.saxena@xtide.io`).
3. Sends a welcome confirmation email directly to the applicant's inbox.

```javascript
async function handleClaimWorkspace(request, env, origin) {
  const body = await request.json();
  const { clubName, name, email, phone, leadCode } = body;

  if (!email || !validEmail(email)) {
    return json({ error: 'Please enter a valid email address.' }, 400, origin);
  }

  const now = new Date().toISOString();
  const founderEmail = env.FOUNDER_EMAIL || 'mayank.saxena@xtide.io';
  const founderName = env.FOUNDER_NAME || 'Mayank Saxena';
  const targetClub = clubName || 'Target Organization';
  const contactName = name || 'Executive Lead';
  const code = leadCode || targetClub.toLowerCase().replace(/[^a-z0-9]/g, '-').slice(0, 30);

  // 1. Record lead in D1 Database
  const id = `lead_${randomToken(12)}`;
  try {
    await env.DB.prepare(`INSERT INTO sales_leads (id, visitor_id, lead_code, club_name, organization_type, contact_first_name, contact_last_name, contact_email, status, clicks_count, last_clicked_at, notes, first_seen_at, last_seen_at)
      VALUES (?, '', ?, ?, 'Private Club', ?, '', ?, 'claim_requested', 1, ?, ?, ?, ?)
      ON CONFLICT(contact_email, club_name) DO UPDATE SET status = 'claim_requested', last_seen_at = excluded.last_seen_at`)
      .bind(id, code, targetClub, contactName, email, now, `Claim requested by ${contactName} (${phone || 'no phone'})`, now, now).run();
  } catch (err) {
    console.warn('Claim DB error:', err.message);
  }

  if (env.MAILERSEND_API_TOKEN) {
    // 2. Alert to Founder
    try {
      await sendMail(env, {
        to: founderEmail,
        subject: `🚨 NEW WORKSPACE CLAIM: ${targetClub} (${contactName})`,
        text: `Great news! A decision maker claimed their workspace.\n\n• Target: ${targetClub}\n• Executive: ${contactName}\n• Email: ${email}\n• Phone: ${phone || 'Not provided'}\n• Code: ${code}\n• Time: ${now}`,
        html: clubPhotoHubEmail({
          eyebrow: '🚨 Workspace Claim Alert',
          title: `New Workspace Claim for ${targetClub}`,
          intro: `Great news! A decision maker just requested workspace activation for ${targetClub}.\n\n• Executive Name: ${contactName}\n• Email: ${email}\n• Phone: ${phone || 'Not provided'}`,
          actionLabel: 'Open Lead Dashboard →',
          actionUrl: 'https://xtide.io/?admin=1'
        })
      });
    } catch (e) {
      console.error('Founder alert error:', e.message);
    }

    // 3. Confirmation to Applicant
    try {
      await sendMail(env, {
        to: email,
        fromName: `${founderName}, xTide Apps`,
        replyTo: founderEmail,
        subject: `Workspace Claim Received: Welcome to ${targetClub}`,
        text: `Hi ${contactName},\n\nThank you for claiming your official workspace for ${targetClub}.\n\nMayank Saxena will reach out directly within 2 hours to help your team set up your custom domain & credentials.\n\nBest regards,\nMayank Saxena\n${founderEmail}`,
        html: clubPhotoHubEmail({
          eyebrow: 'Workspace Claim Received',
          title: `Welcome to ${targetClub}`,
          intro: `Hi ${contactName},\n\nThank you for claiming your official workspace for ${targetClub}.\n\nMayank Saxena will reach out directly within 2 hours to help your team set up your custom domain and credentials.`,
          actionLabel: `Explore Workspace Preview →`,
          actionUrl: `https://xtide.io/preview/${encodeURIComponent(code)}`
        })
      });
    } catch (e) {
      console.error('Applicant confirmation email error:', e.message);
    }
  }

  return json({ success: true, message: `Workspace claim for ${targetClub} submitted successfully!` }, 200, origin);
}
```

---

## 7. Hunter AI Backend Agent (`handleAgentChatCommand`)

### 7.1 System Prompt Configuration for Gemini 2.5 Flash
```javascript
const systemPrompt = `You are Hunter, the Senior Executive AI Sales & Growth Director for xTide Apps (founded by Mayank Saxena). You operate with total precision, deep strategic intelligence, and strict safety guardrails.

Real-time Platform State:
- Target Queue: ${queuedCount} uncontacted B2B targets ready for outreach.
- Suppression List: ${suppCount} previously contacted decision makers locked (0 repeat spam guarantee).
- Active Demo Explorers: ${demoCount} prospects who clicked demo links or viewed preview pages.
- Live Integrations: MailerSend live delivery bound, Cloudflare D1 database synced.

Core Directives & Safety Principles:
1. OUTREACH STRATEGY & MESSAGING:
   - Email 1 (Initial Cold Pitch): Focus 100% on driving a 1-click preview link click (https://xtide.io/preview/[lead_code]). Highlight security & roster validation. NO em-dashes, NO pitch clutter.
   - Email 2 (Follow-Up): Deliver Roster Security + Self-Funding ROI pitch ($80-$200 per event invoice, showing how 6-8 events pay for the software).
2. SAFETY & PRECISION:
   - Never dispatch emails blindly if the user asks a question or asks to review outreach. Always show a clear preview or confirmation summary first.
   - Verify every lead against suppression lists (zero duplicate email guarantee).
3. EXECUTIONAL VOICE:
   - Speak with executive clarity, extreme professionalism, conciseness, and high confidence, exactly like Mayank's trusted co-founder & CMO.`;
```

### 7.2 Action Command Matching Matrix
- **`send test templates to outlook`**: Sends Email 1 & Email 2 test sequence to `saxenamayank92@outlook.com`.
- **`target next 20 clubs`**: Pulls 20 uncontacted leads from D1, checks suppression list, and dispatches via MailerSend.
- **`dispatch follow-ups`**: Identifies leads with `clicks_count > 0` or `status = 'link_clicked'` and dispatches Email 2.
- **`audit suppression`**: Returns full report of contacted records and active anti-spam locks.

---

## 8. Frontend UI Components

### 8.1 `AIAgentConsole.jsx` (Terminal UI & Hunter AI Console)
Provides an interactive command interface with quick-action chips:
- `🚀 Dispatch Next 20`
- `📋 Audit Contacted`
- `🧪 Test Templates`
- `🎯 Next Targets`

### 8.2 `LeadDashboard.jsx` (CRM Pipeline & Lead Sourcing)
Provides real-time pipeline metrics:
- **Total Pipeline Leads**
- **Outreach Sent Count**
- **Interactive Preview Clicks & CTR%**
- **Converted Workspaces**
- Niche filters (Country, Yacht, Tennis, Motor, Ski, University)
- 1-Click interactive preview links (`/preview/${code}`)
- Direct lead email composer modal with live HTML preview rendering.

---

## 9. Migration Checklist for Recreating on `xtide.io`

1. **Cloudflare D1 Setup**:
   ```bash
   npx wrangler d1 create xtide_db
   npx wrangler d1 execute xtide_db --file=./schema.sql
   ```
2. **Environment Bindings (`wrangler.json` / `wrangler.toml`)**:
   ```toml
   [vars]
   FOUNDER_NAME = "Mayank Saxena"
   FOUNDER_EMAIL = "mayank.saxena@xtide.io"
   APP_ORIGIN = "https://xtide.io"
   MAILERSEND_API_TOKEN = "your_mailersend_token"
   GEMINI_API_KEY = "your_gemini_api_key"
   ```
3. **Copy Code Artifacts**:
   - `worker/src/index.js` -> Serverless Worker backend API.
   - `src/components/AIAgentConsole.jsx` -> AI Agent UI component.
   - `src/components/LeadDashboard.jsx` -> Lead & CRM Dashboard component.
   - `src/components/ClubPreviewPage.jsx` -> Dynamic lead preview landing page handler.

---
*Created by Antigravity AI Co-Pilot for Mayank Saxena / xTide Apps*
