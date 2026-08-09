import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, BarChart3, Bot, Building2, Check, Clock, Copy, Edit3, ExternalLink, Lock, Mail, MousePointerClick, Plus, RefreshCw, Search, Send, Sparkles, Trash2, Users, X, Zap } from 'lucide-react';
import { completePlatformLogin, createOutreachLead, deleteOutreachLead, getLeadDashboard, getPlatformSession, requestPlatformLogin, sendOutreachEmail, updateOutreachLead } from '../api';
import AIAgentConsole from './AIAgentConsole';
import './LeadDashboard.css';
import './LeadDashboardLogin.css';

const labels = {
  site_view: 'Site visitors',
  email_link_clicked: 'Email link clicks',
  demo_opened: 'Demo explorers',
  create_workspace_click: 'Create clicks',
  onboarding_started: 'Signups started',
  workspace_created: 'Workspaces created'
};
const order = Object.keys(labels);

const statusLabels = {
  outreach_sent: 'Outreach Sent',
  link_clicked: 'Link Clicked',
  demo_opened: 'Demo Opened',
  verification_started: 'Verification Started',
  workspace_created: 'Workspace Created'
};

const formatDate = value => value ? new Intl.DateTimeFormat('en', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value)) : 'Not yet';
const formatTimeAgo = value => {
  if (!value) return 'Never';
  const diffMs = Date.now() - new Date(value).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

export default function LeadDashboard() {
  const [state, setState] = useState({ loading: true, error: '', session: null, data: null });
  const [credentials, setCredentials] = useState({ email: 'mayank.saxena@xtide.io', code: '' });
  const [codeSent, setCodeSent] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  // Outreach lead state
  const [showAddModal, setShowAddModal] = useState(false);
  const [newLead, setNewLead] = useState({
    clubName: '',
    firstName: '',
    lastName: '',
    email: '',
    organizationType: 'Golf & Country Club',
    leadCode: '',
    notes: '',
    sendEmailNow: true
  });
  const [submitting, setSubmitting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('engagement');
  const [mobileTab, setMobileTab] = useState('leads');
  const [copiedId, setCopiedId] = useState('');
  const [activeLeadActivity, setActiveLeadActivity] = useState(null);
  const [editingNotesLeadId, setEditingNotesLeadId] = useState('');
  const [notesInput, setNotesInput] = useState('');

  // Email Preview Modal state
  const [previewLead, setPreviewLead] = useState(null);
  const [followupLead, setFollowupLead] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  // Bulk AI Outreach state
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkInput, setBulkInput] = useState('');
  const [bulkProgress, setBulkProgress] = useState(null);

  const load = useCallback(async () => {
    setState(previous => ({ ...previous, loading: true, error: '' }));
    try {
      const session = await getPlatformSession();
      if (!session.authenticated) {
        setState({ loading: false, error: '', session, data: null });
        return;
      }
      const data = await getLeadDashboard();
      setState({ loading: false, error: '', session, data });
    } catch (error) {
      setState(previous => ({ ...previous, loading: false, error: error.message || 'Could not load lead activity.' }));
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const metrics = useMemo(() => Object.fromEntries((state.data?.metrics || []).map(item => [item.eventType, item])), [state.data]);
  const max = Math.max(1, ...order.map(key => metrics[key]?.visitors || 0));
  const visitors = metrics.site_view?.visitors || 0;
  const workspaces = metrics.workspace_created?.visitors || 0;
  const conversion = visitors ? ((workspaces / visitors) * 100).toFixed(1) : '0.0';

  const leads = useMemo(() => state.data?.leads || [], [state.data]);
  const recentEvents = useMemo(() => state.data?.recentEvents || [], [state.data]);

  const calculateEngagementScore = useCallback(lead => {
    let score = (lead.clicksCount || 0) * 15;
    if (lead.status === 'workspace_created') score += 100;
    else if (lead.status === 'verification_started') score += 80;
    else if (lead.status === 'demo_opened') score += 50;
    else if (lead.status === 'link_clicked') score += 30;
    return score;
  }, []);

  const filteredLeads = useMemo(() => {
    let list = leads;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      list = leads.filter(l =>
        l.clubName?.toLowerCase().includes(query) ||
        l.email?.toLowerCase().includes(query) ||
        l.firstName?.toLowerCase().includes(query) ||
        l.lastName?.toLowerCase().includes(query) ||
        l.organizationType?.toLowerCase().includes(query) ||
        l.leadCode?.toLowerCase().includes(query) ||
        l.status?.toLowerCase().includes(query)
      );
    }

    return [...list].sort((a, b) => {
      if (sortBy === 'engagement') {
        const scoreDiff = calculateEngagementScore(b) - calculateEngagementScore(a);
        if (scoreDiff !== 0) return scoreDiff;
        return (b.clicksCount || 0) - (a.clicksCount || 0);
      }
      if (sortBy === 'clicks') return (b.clicksCount || 0) - (a.clicksCount || 0);
      if (sortBy === 'activity') return new Date(b.lastClickedAt || b.lastSeenAt || 0) - new Date(a.lastClickedAt || a.lastSeenAt || 0);
      if (sortBy === 'name') return (a.clubName || '').localeCompare(b.clubName || '');
      return 0;
    });
  }, [leads, searchQuery, sortBy, calculateEngagementScore]);

  const handlePlatformLogin = async event => {
    event.preventDefault();
    setSigningIn(true);
    setState(previous => ({ ...previous, error: '' }));
    try {
      if (!codeSent) {
        const result = await requestPlatformLogin({ email: credentials.email });
        setCodeSent(true);
        setState(previous => ({ ...previous, error: '', message: result.message }));
      } else {
        await completePlatformLogin(credentials);
        await load();
      }
    } catch (error) {
      setState(previous => ({ ...previous, error: error.message || 'Could not verify platform access.' }));
    } finally {
      setSigningIn(false);
    }
  };

  const handleCreateLead = async event => {
    event.preventDefault();
    if (!newLead.clubName.trim()) return;
    setSubmitting(true);
    try {
      const created = await createOutreachLead(newLead);
      if (newLead.sendEmailNow && newLead.email) {
        try {
          await sendOutreachEmail({
            leadId: created.lead?.id,
            clubName: newLead.clubName,
            firstName: newLead.firstName,
            email: newLead.email,
            organizationType: newLead.organizationType,
            leadCode: newLead.leadCode || created.lead?.leadCode
          });
        } catch (err) {
          console.warn('Direct outreach send error:', err);
        }
      }
      setShowAddModal(false);
      setNewLead({ clubName: '', firstName: '', lastName: '', email: '', organizationType: 'Golf & Country Club', leadCode: '', notes: '', sendEmailNow: true });
      await load();
    } catch (error) {
      alert(error.message || 'Could not create lead.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendSingleEmail = async (lead) => {
    setSendingEmail(true);
    try {
      await sendOutreachEmail({
        leadId: lead.id,
        clubName: lead.clubName,
        firstName: lead.firstName,
        email: lead.email,
        organizationType: lead.organizationType,
        leadCode: lead.leadCode || lead.id
      });
      alert(`Outreach email successfully sent to ${lead.email}!`);
      setPreviewLead(null);
      await load();
    } catch (error) {
      alert(error.message || 'Could not send outreach email. Please verify MailerSend setup.');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleSendFollowupEmail = async (lead) => {
    setSendingEmail(true);
    try {
      await sendOutreachEmail({
        leadId: lead.id,
        clubName: lead.clubName,
        firstName: lead.firstName,
        email: lead.email,
        organizationType: lead.organizationType,
        leadCode: lead.leadCode || lead.id,
        templateType: 'followup'
      });
      alert(`Follow-up email successfully sent to ${lead.email}!`);
      setFollowupLead(null);
      await load();
    } catch (error) {
      alert(error.message || 'Could not send follow-up via server. Opening pre-filled Gmail draft...');
      const first = (lead.firstName && lead.firstName.trim() && lead.firstName !== 'General Manager') ? lead.firstName.trim() : 'there';
      const encodedClub = encodeURIComponent(lead.clubName);
      const subject = `Follow-up: Custom preview for ${lead.clubName}`;
      const body = `Hi ${first},\n\nFollowing up on my note earlier regarding private member photo sharing.\n\nWe just introduced custom sample previews where we set up a private workspace using ${lead.clubName}'s branding and event categories so you can see exactly how your members would experience it. Zero setup required for your staff.\n\nYou can request a private sample preview in 10 seconds here:\n👉 https://clubphotohub.com/book-demo?club=${encodedClub}\n\nOr simply reply to this email with "yes" and I'll build out a preview for ${lead.clubName}.\n\nMayank Saxena\nmayank.saxena@xtide.io\nhttps://clubphotohub.com\n\n--\nxTide Apps / Club PhotoHub\nActon, ON L7J 1H3, Canada\nReply unsubscribe to opt out.`;
      const gmailUrl = `https://mail.google.com/mail/u/0/?view=cm&fs=1&tf=1&to=${encodeURIComponent(lead.email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.open(gmailUrl, '_blank');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleRunBulkOutreach = async () => {
    if (!bulkInput.trim()) return;
    const lines = bulkInput.split('\n').map(l => l.trim()).filter(Boolean);
    if (!lines.length) return;

    setSubmitting(true);
    setBulkProgress({ total: lines.length, current: 0, currentName: '' });

    for (let idx = 0; idx < lines.length; idx += 1) {
      const line = lines[idx];
      // Format: Club Name, Contact Name, Email, Org Type
      const parts = line.split(',').map(p => p.trim());
      const clubName = parts[0] || 'Private Club';
      const firstName = parts[1] || '';
      const email = parts[2] || '';
      const organizationType = parts[3] || 'Golf & Country Club';
      const leadCode = clubName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30);

      setBulkProgress({ total: lines.length, current: idx + 1, currentName: clubName });

      try {
        const res = await createOutreachLead({ clubName, firstName, email, organizationType, leadCode });
        if (email) {
          await sendOutreachEmail({
            leadId: res.lead?.id,
            clubName,
            firstName,
            email,
            organizationType,
            leadCode
          });
        }
      } catch (err) {
        console.error('Bulk lead error for line:', line, err);
      }
    }

    setSubmitting(false);
    setShowBulkModal(false);
    setBulkProgress(null);
    setBulkInput('');
    await load();
  };

  const handleDeleteLead = async (leadId, clubName) => {
    if (!window.confirm(`Delete lead entry for "${clubName}"?`)) return;
    try {
      await deleteOutreachLead(leadId);
      await load();
    } catch (error) {
      alert(error.message || 'Could not delete lead.');
    }
  };

  const handleSaveNotes = async (leadId) => {
    try {
      await updateOutreachLead(leadId, { notes: notesInput });
      setEditingNotesLeadId('');
      await load();
    } catch (error) {
      alert(error.message || 'Could not save notes.');
    }
  };

  const copyToClipboard = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopiedId(key);
    setTimeout(() => setCopiedId(''), 2000);
  };

  const getLeadEvents = (lead) => {
    return recentEvents.filter(e =>
      (lead.visitorId && e.visitorId === lead.visitorId) ||
      (lead.leadCode && e.path?.includes(lead.leadCode)) ||
      (lead.workspaceClubId && e.clubId === lead.workspaceClubId)
    );
  };

  if (state.loading) return <main className="lead-admin centered"><div className="lead-loading"><RefreshCw className="spin" /> Loading lead activity…</div></main>;
  if (!state.session?.authenticated) return <main className="lead-admin centered"><section className="lead-access lead-owner-login"><BarChart3 /><h1>Platform owner</h1><p>Use a one-time email code to view Club PhotoHub leads across every workspace. No club password or selection is required.</p>{state.error && <div className="lead-login-error" role="alert">{state.error}</div>}{state.message && <div className="lead-login-message">{state.message}</div>}<form onSubmit={handlePlatformLogin}><label htmlFor="platformEmail">Owner email</label><div><Mail size={17} /><input id="platformEmail" type="email" autoComplete="email" value={credentials.email} onChange={event => { setCredentials(previous => ({ ...previous, email: event.target.value })); setCodeSent(false); }} disabled={codeSent} required /></div>{codeSent && <><label htmlFor="platformCode">6-digit access code</label><div><Lock size={17} /><input id="platformCode" inputMode="numeric" pattern="[0-9]{6}" maxLength="6" autoComplete="one-time-code" value={credentials.code} onChange={event => setCredentials(previous => ({ ...previous, code: event.target.value.replace(/\D/g, '') }))} required /></div></>}<button disabled={signingIn}>{signingIn ? 'Please wait…' : codeSent ? 'Open lead dashboard' : 'Email me an access code'}</button></form>{codeSent && <button className="lead-code-back" type="button" onClick={() => { setCodeSent(false); setCredentials(previous => ({ ...previous, code: '' })); }}>Use a different email</button>}<a className="lead-home-link" href="/">Return to Club PhotoHub</a></section></main>;

  return <main className="lead-admin">
    <header className="lead-header">
      <div>
        <a href="/"><ArrowLeft size={16} /> Club PhotoHub</a>
        <span>Private platform admin</span>
        <h1>Lead Tracker & AI Outreach</h1>
        <p>Track email outreach engagement, generate tracked links, and dispatch automated cold emails.</p>
      </div>
      <div className="lead-header-actions">
        <button className="lead-ai-bulk-btn" onClick={() => setShowBulkModal(true)}>
          <Zap size={16} /> Bulk AI Outreach
        </button>
        <button className="lead-add-btn" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Add Lead
        </button>
        <button onClick={load} className="lead-refresh-btn">
          <RefreshCw size={16} /> Refresh
        </button>
      </div>
    </header>

    {/* Mobile View Switcher Bar (App-like navigation for mobile screens) */}
    <div className="mobile-view-tabs-bar">
      <button
        className={`mobile-tab-btn ${mobileTab === 'leads' ? 'active' : ''}`}
        onClick={() => setMobileTab('leads')}
      >
        <Building2 size={16} />
        <span>Hot Leads ({filteredLeads.length})</span>
      </button>
      <button
        className={`mobile-tab-btn ${mobileTab === 'agent' ? 'active' : ''}`}
        onClick={() => setMobileTab('agent')}
      >
        <Bot size={16} />
        <span>Hunter AI Co-Pilot</span>
      </button>
      <button
        className={`mobile-tab-btn ${mobileTab === 'feed' ? 'active' : ''}`}
        onClick={() => setMobileTab('feed')}
      >
        <Zap size={16} />
        <span>Signals ({recentEvents.length})</span>
      </button>
    </div>

    <div className={`lead-dashboard-split-layout mobile-tab-${mobileTab}`}>
      {/* LEFT COLUMN (70% AREA) */}
      <div className="lead-dashboard-main-col">
        <section className="lead-cards">
      {order.map(key => <article key={key}>
        <span>{labels[key]}</span>
        <strong>{metrics[key]?.visitors || 0}</strong>
        <small>{metrics[key]?.events || 0} total actions</small>
      </article>)}
      <article className="conversion">
        <span>Visitor to workspace</span>
        <strong>{conversion}%</strong>
        <small>Last 30 days</small>
      </article>
    </section>

    <section className="lead-panel">
      <div className="panel-title">
        <div>
          <BarChart3 />
          <span>
            <strong>Conversion funnel</strong>
            <small>Unique visitors and engagement steps over the last 30 days</small>
          </span>
        </div>
      </div>
      <div className="lead-funnel">
        {order.map(key => <div key={key}>
          <span>{labels[key]}</span>
          <div><i style={{ width: `${Math.max(3, ((metrics[key]?.visitors || 0) / max) * 100)}%` }} /></div>
          <strong>{metrics[key]?.visitors || 0}</strong>
        </div>)}
      </div>
    </section>

    {/* Live Activity Stream & Notifications Feed */}
    {recentEvents.length > 0 && (
      <div className="lead-activity-feed-card">
        <div className="feed-header">
          <div className="feed-title">
            <span className="feed-pulse" />
            <strong>🔔 Live Activity Stream & Hot Signals</strong>
          </div>
          <small>{recentEvents.length} recent prospect signals recorded</small>
        </div>
        <div className="feed-items-wrap">
          {recentEvents.slice(0, 4).map((ev, idx) => (
            <div key={ev.id || idx} className="feed-item">
              <span className={`feed-badge ${ev.eventType}`}>
                {ev.eventType === 'demo_opened' ? '🚀 Demo Opened' : ev.eventType === 'email_link_clicked' ? '👁️ Link Clicked' : ev.eventType === 'workspace_created' ? '🎉 Workspace Created' : '⚡ Action'}
              </span>
              <span className="feed-text"><strong>{ev.clubName || 'Target Club'}</strong> {ev.email ? `(${ev.email})` : ''}</span>
              <small className="feed-time">{formatTimeAgo(ev.createdAt)}</small>
            </div>
          ))}
        </div>
      </div>
    )}

    <section className="lead-panel">
      <div className="panel-title flex-wrap">
        <div>
          <Users />
          <span>
            <strong>Club Leads & Outreach Campaign</strong>
            <small>Send cold outreach emails with tracked links and monitor engagement live</small>
          </span>
        </div>
        <div className="panel-toolbar">
          <div className="sort-by-wrap">
            <span className="sort-label">Sort:</span>
            <select value={sortBy} onChange={e => setSortBy(e.target.value)} className="sort-by-select">
              <option value="engagement">🔥 Highest Engagement (Hot First)</option>
              <option value="clicks">⚡ Most Clicks</option>
              <option value="activity">🕒 Last Activity</option>
              <option value="name">🔤 Club Name (A-Z)</option>
            </select>
          </div>
          <div className="lead-search">
            <Search size={15} />
            <input
              type="text"
              placeholder="Search leads, clubs, emails..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && <button onClick={() => setSearchQuery('')}><X size={14} /></button>}
          </div>
          <span className="lead-count-badge">{filteredLeads.length} leads</span>
        </div>
      </div>

      <div className="lead-table-wrap">
        <table>
          <thead>
            <tr>
              <th>Club & Contact</th>
              <th>Status</th>
              <th>Clicks</th>
              <th>Tracked Email Links</th>
              <th>Last Engaged</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredLeads.map(lead => {
              const code = lead.leadCode || lead.id;
              const mainLink = `https://clubphotohub.com/?lead=${encodeURIComponent(code)}`;
              const demoLink = `https://clubphotohub.com/?demo=1&lead=${encodeURIComponent(code)}`;
              const events = getLeadEvents(lead);
              const isEditingNotes = editingNotesLeadId === lead.id;

              return <tr key={lead.id} className={lead.clicksCount > 0 ? 'lead-row-engaged' : ''}>
                <td>
                  <strong>
                    <Building2 size={15} /> {lead.clubName}
                    {calculateEngagementScore(lead) >= 50 && (
                      <span className="badge-hot-lead" title="High Engagement Intent: Priority Target">🔥 HOT LEAD</span>
                    )}
                  </strong>
                  <small>{lead.organizationType}</small>
                  {lead.firstName || lead.lastName || lead.email ? (
                    <div className="lead-contact-sub">
                      <span>{lead.firstName} {lead.lastName}</span>
                      {lead.email && <a href={`mailto:${lead.email}`} className="lead-email-link">{lead.email}</a>}
                    </div>
                  ) : null}
                  {lead.notes && !isEditingNotes && (
                    <div className="lead-notes-preview" title="Click edit to modify notes">
                      📝 {lead.notes}
                    </div>
                  )}
                  {isEditingNotes && (
                    <div className="lead-notes-edit">
                      <input
                        type="text"
                        value={notesInput}
                        onChange={e => setNotesInput(e.target.value)}
                        placeholder="Add notes..."
                      />
                      <button onClick={() => handleSaveNotes(lead.id)} className="btn-save-sm">Save</button>
                      <button onClick={() => setEditingNotesLeadId('')} className="btn-cancel-sm">Cancel</button>
                    </div>
                  )}
                </td>
                <td>
                  <span className={`lead-status ${lead.status}`}>
                    {lead.status === 'outreach_sent' && '✉️ Outreach Sent'}
                    {lead.status === 'link_clicked' && '👁️ Link Clicked'}
                    {lead.status === 'demo_opened' && '🚀 Demo Opened'}
                    {lead.status === 'verification_started' && '⏳ Verification Started'}
                    {lead.status === 'workspace_created' && '🎉 Workspace Created'}
                    {!statusLabels[lead.status] && (lead.status || 'Outreach Sent')}
                  </span>
                </td>
                <td>
                  <div className="lead-clicks-pill">
                    <MousePointerClick size={14} />
                    <strong>{lead.clicksCount || 0}</strong>
                  </div>
                </td>
                <td>
                  <div className="lead-link-buttons">
                    <button
                      className="lead-copy-link-btn"
                      onClick={() => copyToClipboard(mainLink, `${lead.id}-main`)}
                      title={`Copy landing link: ${mainLink}`}
                    >
                      {copiedId === `${lead.id}-main` ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                      {copiedId === `${lead.id}-main` ? 'Copied Landing Link!' : 'Copy Landing Link'}
                    </button>
                    <button
                      className="lead-copy-demo-btn"
                      onClick={() => copyToClipboard(demoLink, `${lead.id}-demo`)}
                      title={`Copy demo link: ${demoLink}`}
                    >
                      {copiedId === `${lead.id}-demo` ? <Check size={13} className="text-success" /> : <Sparkles size={13} />}
                      {copiedId === `${lead.id}-demo` ? 'Copied Demo Link!' : 'Copy Demo Link'}
                    </button>
                  </div>
                </td>
                <td>
                  <div className="lead-time-wrap">
                    <span>{formatTimeAgo(lead.lastClickedAt || lead.lastSeenAt)}</span>
                    <small>{formatDate(lead.lastClickedAt || lead.lastSeenAt)}</small>
                  </div>
                </td>
                <td>
                  <div className="lead-actions-cell">
                    {lead.email && (
                      <button
                        className="btn-send-email-action"
                        onClick={() => setPreviewLead(lead)}
                        title="Preview & Send Cold Outreach Email"
                      >
                        <Send size={12} /> Send Email
                      </button>
                    )}
                    {lead.email && (lead.status === 'demo_opened' || lead.status === 'link_clicked' || (lead.clicksCount && lead.clicksCount > 0)) && (
                      <button
                        className="btn-send-followup-action"
                        onClick={() => setFollowupLead(lead)}
                        title="Send Branded Preview Follow-Up Email"
                      >
                        <Sparkles size={12} /> 🔥 Send Follow-Up
                      </button>
                    )}
                    {lead.workspaceClubId ? (
                      <a href={`/${lead.workspaceClubId}`} target="_blank" rel="noreferrer" className="btn-workspace-open">
                        Open Workspace <ExternalLink size={12} />
                      </a>
                    ) : (
                      <button
                        className="btn-activity-log"
                        onClick={() => setActiveLeadActivity({ lead, events })}
                        title="View activity log"
                      >
                        <Clock size={13} /> {events.length}
                      </button>
                    )}
                    <button
                      className="btn-icon-subtle"
                      onClick={() => { setEditingNotesLeadId(lead.id); setNotesInput(lead.notes || ''); }}
                      title="Edit notes"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      className="btn-icon-danger"
                      onClick={() => handleDeleteLead(lead.id, lead.clubName)}
                      title="Delete lead"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>;
            })}
            {!filteredLeads.length && (
              <tr>
                <td colSpan="6" className="lead-empty">
                  {searchQuery ? 'No leads matched your search query.' : 'No outreach leads created yet. Click "Add Lead" or "Bulk AI Outreach" to start your outreach campaign!'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Lead Cards List (App-like touch cards for mobile screens) */}
      <div className="lead-mobile-cards-list">
        {filteredLeads.map(lead => {
          const code = lead.leadCode || lead.id;
          const mainLink = `https://clubphotohub.com/?lead=${encodeURIComponent(code)}`;
          const demoLink = `https://clubphotohub.com/?demo=1&lead=${encodeURIComponent(code)}`;
          const isHot = calculateEngagementScore(lead) >= 50;
          const isEngaged = lead.status === 'demo_opened' || lead.status === 'link_clicked' || (lead.clicksCount && lead.clicksCount > 0);

          return (
            <div key={`mob-${lead.id}`} className={`mobile-lead-card ${isHot ? 'hot-card' : ''}`}>
              <div className="mob-card-header">
                <div>
                  <strong className="mob-club-name"><Building2 size={15} style={{ verticalAlign: 'middle', marginRight: 4 }} /> {lead.clubName}</strong>
                  <span className="mob-org-type">{lead.organizationType}</span>
                </div>
                {isHot && <span className="badge-hot-lead">🔥 HOT LEAD</span>}
              </div>

              <div className="mob-card-contact">
                {lead.firstName || lead.lastName ? (
                  <div className="mob-contact-name">👤 {lead.firstName} {lead.lastName}</div>
                ) : null}
                {lead.email && (
                  <a href={`mailto:${lead.email}`} className="mob-contact-email">✉️ {lead.email}</a>
                )}
              </div>

              <div className="mob-card-stats-row">
                <span className={`lead-status ${lead.status}`}>
                  {lead.status === 'outreach_sent' && '✉️ Sent'}
                  {lead.status === 'link_clicked' && '👁️ Clicked'}
                  {lead.status === 'demo_opened' && '🚀 Demo Opened'}
                  {lead.status === 'verification_started' && '⏳ Verification'}
                  {lead.status === 'workspace_created' && '🎉 Workspace Created'}
                  {!statusLabels[lead.status] && (lead.status || 'Outreach Sent')}
                </span>

                <div className="mob-clicks-pill">
                  <MousePointerClick size={13} />
                  <strong>{lead.clicksCount || 0} clicks</strong>
                </div>
                <small className="mob-time-ago">{formatTimeAgo(lead.lastClickedAt || lead.lastSeenAt)}</small>
              </div>

              <div className="mob-card-primary-action">
                {lead.email && isEngaged ? (
                  <button
                    className="btn-send-followup-action mob-primary-btn"
                    onClick={() => setFollowupLead(lead)}
                  >
                    <Sparkles size={14} /> 🔥 Send Follow-Up Preview
                  </button>
                ) : lead.email ? (
                  <button
                    className="btn-send-email-action mob-primary-btn"
                    onClick={() => setPreviewLead(lead)}
                  >
                    <Send size={14} /> Send Outreach Email
                  </button>
                ) : null}
              </div>

              <div className="mob-card-secondary-links">
                <button
                  className="lead-copy-link-btn"
                  onClick={() => copyToClipboard(mainLink, `${lead.id}-mob-main`)}
                >
                  {copiedId === `${lead.id}-mob-main` ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                  {copiedId === `${lead.id}-mob-main` ? 'Copied Link!' : 'Copy Landing Link'}
                </button>
                <button
                  className="lead-copy-demo-btn"
                  onClick={() => copyToClipboard(demoLink, `${lead.id}-mob-demo`)}
                >
                  {copiedId === `${lead.id}-mob-demo` ? <Check size={13} className="text-success" /> : <Sparkles size={13} />}
                  {copiedId === `${lead.id}-mob-demo` ? 'Copied Demo!' : 'Copy Demo Link'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  </div>

  {/* RIGHT COLUMN (30% AREA) */}
  <aside className="lead-dashboard-agent-col">
    <AIAgentConsole onRefreshLeads={load} leads={leads} />
  </aside>
</div>

    {/* Add Outreach Lead Modal */}
    {showAddModal && (
      <div className="lead-modal-backdrop" onClick={() => setShowAddModal(false)}>
        <div className="lead-modal-content" onClick={e => e.stopPropagation()}>
          <div className="lead-modal-header">
            <div>
              <h3>Add Outreach Lead</h3>
              <p>Generate a unique tracking link & send personalized outreach</p>
            </div>
            <button onClick={() => setShowAddModal(false)} className="btn-close-modal"><X size={18} /></button>
          </div>
          <form onSubmit={handleCreateLead} className="lead-add-form">
            <label>
              <span>Club / Organization Name *</span>
              <input
                type="text"
                placeholder="e.g. Heritage Oaks Golf Club"
                value={newLead.clubName}
                onChange={e => {
                  const val = e.target.value;
                  setNewLead(prev => ({
                    ...prev,
                    clubName: val,
                    leadCode: prev.leadCode ? prev.leadCode : val.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').slice(0, 30)
                  }));
                }}
                required
              />
            </label>

            <div className="form-row-2">
              <label>
                <span>Contact First Name</span>
                <input
                  type="text"
                  placeholder="e.g. Greg"
                  value={newLead.firstName}
                  onChange={e => setNewLead(prev => ({ ...prev, firstName: e.target.value }))}
                />
              </label>
              <label>
                <span>Contact Email</span>
                <input
                  type="email"
                  placeholder="e.g. gm@heritageoaks.com"
                  value={newLead.email}
                  onChange={e => setNewLead(prev => ({ ...prev, email: e.target.value }))}
                />
              </label>
            </div>

            <div className="form-row-2">
              <label>
                <span>Organization Type</span>
                <select
                  value={newLead.organizationType}
                  onChange={e => setNewLead(prev => ({ ...prev, organizationType: e.target.value }))}
                >
                  <option value="Golf & Country Club">Golf & Country Club</option>
                  <option value="Yacht Club">Yacht Club</option>
                  <option value="Curling Club">Curling Club</option>
                  <option value="Tennis & Racquet Club">Tennis & Racquet Club</option>
                  <option value="Private Club">Private Club</option>
                  <option value="Resort & Hospitality">Resort & Hospitality</option>
                </select>
              </label>
              <label>
                <span>Custom Link Slug</span>
                <input
                  type="text"
                  placeholder="e.g. heritage-oaks"
                  value={newLead.leadCode}
                  onChange={e => setNewLead(prev => ({ ...prev, leadCode: e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-') }))}
                />
              </label>
            </div>

            {newLead.email && (
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={newLead.sendEmailNow}
                  onChange={e => setNewLead(prev => ({ ...prev, sendEmailNow: e.target.checked }))}
                />
                <span>Automatically send personalized email outreach immediately</span>
              </label>
            )}

            <div className="modal-actions">
              <button type="button" onClick={() => setShowAddModal(false)} className="btn-cancel">Cancel</button>
              <button type="submit" disabled={submitting} className="btn-submit">
                {submitting ? 'Processing...' : 'Create Lead'}
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {/* Email Preview & Dispatch Modal */}
    {previewLead && (
      <div className="lead-modal-backdrop" onClick={() => setPreviewLead(null)}>
        <div className="lead-modal-content modal-lg" onClick={e => e.stopPropagation()}>
          <div className="lead-modal-header">
            <div>
              <h3><Send size={18} /> Cold Outreach Email Preview</h3>
              <p>Recipient: <strong>{previewLead.email}</strong> ({previewLead.clubName})</p>
            </div>
            <button onClick={() => setPreviewLead(null)} className="btn-close-modal"><X size={18} /></button>
          </div>

          <div className="email-preview-box">
            <div className="email-preview-header">
              <img src="https://clubphotohub.com/club-photo-hub-icon-192.png" width="36" height="36" alt="Icon" />
              <div>
                <span className="eyebrow">CLUB PHOTOHUB</span>
                <h4>A private photo hub for {previewLead.clubName} members</h4>
              </div>
            </div>
            <div className="email-preview-body">
              <p>Hi {previewLead.firstName || 'General Manager'},</p>
              <p>{previewLead.clubName}'s mix of member activities creates a wide range of member moments that would be valuable to preserve and share privately.</p>
              <p>After working in private clubs, I saw how important these photos are to members and how difficult it is to give them one simple, private place to enjoy them. That is why I started Club PhotoHub.</p>
              <p><strong>Club PhotoHub gives {previewLead.clubName} its own branded, roster-verified photo gallery:</strong></p>
              <ul>
                <li><strong>Private member access:</strong> Members confirm identity using club email & member number.</li>
                <li><strong>Club branded:</strong> Custom logo, colors, and event categories.</li>
                <li><strong>Easy on any device:</strong> Browse, upload, caption, like, and download on phone, tablet, or PC.</li>
                <li><strong>Simple for staff:</strong> Full administrator moderation and roster control.</li>
              </ul>
              <div className="offer-preview">
                <strong>Founding partner offer:</strong> 20% off for 12 months using code <strong>FOUNDING20</strong>
              </div>
              <div className="cta-preview-btn">
                [Explore Club PhotoHub] ➔ <code>https://clubphotohub.com/?demo=1&lead={previewLead.leadCode || previewLead.id}</code>
              </div>
              <p>Best regards,<br /><strong>Mayank Saxena</strong><br />Founder, Club PhotoHub</p>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={() => setPreviewLead(null)} className="btn-cancel">Cancel</button>
            <button
              type="button"
              disabled={sendingEmail}
              onClick={() => handleSendSingleEmail(previewLead)}
              className="btn-submit btn-send-now"
            >
              {sendingEmail ? 'Sending Email...' : `Send Email to ${previewLead.email}`}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Follow-Up Preview Modal */}
    {followupLead && (
      <div className="lead-modal-backdrop" onClick={() => setFollowupLead(null)}>
        <div className="lead-modal-content modal-lg" onClick={e => e.stopPropagation()}>
          <div className="lead-modal-header">
            <div>
              <h3><Sparkles size={18} /> 🔥 Send Branded Preview Follow-Up</h3>
              <p>Personalized follow-up for <strong>{followupLead.clubName}</strong> ({followupLead.email})</p>
            </div>
            <button onClick={() => setFollowupLead(null)} className="btn-close-modal"><X size={18} /></button>
          </div>

            <div className="email-preview-box">
              <div className="email-preview-header">
                <img src="https://clubphotohub.com/club-photo-hub-icon-192.png" width="36" height="36" alt="Icon" />
                <div>
                  <span className="eyebrow" style={{ color: '#f59e0b', fontSize: 11, fontWeight: 800 }}>EMAIL SUBJECT LINE</span>
                  <h4 style={{ color: '#ffffff', margin: '2px 0 0', fontSize: 15, fontWeight: 700 }}>Subject: Follow-up: Custom preview for {followupLead.clubName}</h4>
                </div>
              </div>
            <div className="email-preview-body">
              {(() => {
                const targetFirst = (followupLead.firstName && followupLead.firstName.trim() && followupLead.firstName !== 'General Manager') ? followupLead.firstName.trim() : 'there';
                const bodyText = `Hi ${targetFirst},\n\nFollowing up on my note earlier regarding private member photo sharing.\n\nWe just introduced custom sample previews where we set up a private workspace using ${followupLead.clubName}'s branding and event categories so you can see exactly how your members would experience it. Zero setup required for your staff.\n\nYou can request a private sample preview in 10 seconds here:\n👉 https://clubphotohub.com/book-demo?club=${encodeURIComponent(followupLead.clubName)}\n\nOr simply reply to this email with "yes" and I'll build out a preview for ${followupLead.clubName}.\n\nMayank Saxena\nmayank.saxena@xtide.io\nhttps://clubphotohub.com\n\n--\nxTide Apps / Club PhotoHub\nActon, ON L7J 1H3, Canada\nReply unsubscribe to opt out.`;
                const gmailLink = `https://mail.google.com/mail/u/0/?view=cm&fs=1&tf=1&to=${encodeURIComponent(followupLead.email)}&su=${encodeURIComponent(`Follow-up: Custom preview for ${followupLead.clubName}`)}&body=${encodeURIComponent(bodyText)}`;

                return <>
                  <p>Hi {targetFirst},</p>
                  <p>Following up on my note earlier regarding private member photo sharing.</p>
                  <p>We just introduced custom sample previews where we set up a private workspace using <strong>{followupLead.clubName}</strong>'s branding and event categories so you can see exactly how your members would experience it. Zero setup required for your staff.</p>
                  <div className="cta-preview-btn" style={{ background: '#0f1828', color: '#fff', padding: '12px 18px', borderRadius: 8, margin: '14px 0' }}>
                    👉 Request Sample Preview: <code>https://clubphotohub.com/book-demo?club={encodeURIComponent(followupLead.clubName)}</code>
                  </div>
                  <p>Or simply reply to this email with "yes" and I'll build out a preview for {followupLead.clubName}.</p>
                  <p>Best regards,<br /><strong>Mayank Saxena</strong><br />Founder, Club PhotoHub</p>

                  <div className="modal-actions" style={{ gap: 10, marginTop: 20 }}>
                    <button type="button" onClick={() => setFollowupLead(null)} className="btn-cancel">Cancel</button>
                    <a
                      href={gmailLink}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-submit"
                      style={{ background: '#0f1828', color: '#fff', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      ✉️ Open in Gmail Compose
                    </a>
                    <button
                      type="button"
                      disabled={sendingEmail}
                      onClick={() => handleSendFollowupEmail(followupLead)}
                      className="btn-submit btn-send-now"
                      style={{ background: '#d97706', color: '#fff' }}
                    >
                      {sendingEmail ? 'Sending Follow-Up...' : `⚡ Send Server Follow-Up`}
                    </button>
                  </div>
                </>;
              })()}
            </div>
          </div>
        </div>
      </div>
    )}

    {/* Bulk AI Outreach Modal */}
    {showBulkModal && (
      <div className="lead-modal-backdrop" onClick={() => setShowBulkModal(false)}>
        <div className="lead-modal-content modal-lg" onClick={e => e.stopPropagation()}>
          <div className="lead-modal-header">
            <div>
              <h3><Zap size={18} /> Bulk AI Outreach Campaign</h3>
              <p>Paste target clubs to automatically create tracking links & send personalized emails</p>
            </div>
            <button onClick={() => setShowBulkModal(false)} className="btn-close-modal"><X size={18} /></button>
          </div>

          <div className="bulk-modal-body">
            <p className="bulk-instruction">Enter one club per line in format: <code>Club Name, Contact Name, Email, Organization Type</code></p>
            <textarea
              rows="6"
              placeholder={`St. George's Golf & Country Club, Ian, ian@stgeorgesgolf.com, Golf & Country Club\nGranite Club, John, john@graniteclub.com, Athletic & Social`}
              value={bulkInput}
              onChange={e => setBulkInput(e.target.value)}
              disabled={Boolean(bulkProgress)}
            />

            {bulkProgress && (
              <div className="bulk-progress-bar">
                <div className="progress-fill" style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }} />
                <span>Sending email {bulkProgress.current} of {bulkProgress.total}: <strong>{bulkProgress.currentName}</strong></span>
              </div>
            )}
          </div>

          <div className="modal-actions">
            <button type="button" onClick={() => setShowBulkModal(false)} className="btn-cancel" disabled={Boolean(bulkProgress)}>Cancel</button>
            <button
              type="button"
              disabled={submitting || !bulkInput.trim()}
              onClick={handleRunBulkOutreach}
              className="btn-submit btn-ai-run"
            >
              {submitting ? 'Running Outreach Campaign...' : '⚡ Run Outreach Campaign'}
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Lead Activity Timeline Drawer */}
    {activeLeadActivity && (
      <div className="lead-modal-backdrop" onClick={() => setActiveLeadActivity(null)}>
        <div className="lead-drawer-content" onClick={e => e.stopPropagation()}>
          <div className="lead-drawer-header">
            <div>
              <h3><Building2 size={18} /> {activeLeadActivity.lead.clubName}</h3>
              <p>Activity timeline and visitor engagement history</p>
            </div>
            <button onClick={() => setActiveLeadActivity(null)} className="btn-close-modal"><X size={18} /></button>
          </div>

          <div className="lead-drawer-body">
            <div className="drawer-summary-card">
              <div><span>Status:</span> <strong>{statusLabels[activeLeadActivity.lead.status] || activeLeadActivity.lead.status}</strong></div>
              <div><span>Total Clicks:</span> <strong>{activeLeadActivity.lead.clicksCount || 0}</strong></div>
              <div><span>Contact:</span> <strong>{activeLeadActivity.lead.email || 'None'}</strong></div>
            </div>

            <h4>Timeline Events ({activeLeadActivity.events.length})</h4>
            <div className="lead-timeline">
              {activeLeadActivity.events.map((ev, idx) => (
                <div key={ev.id || idx} className="timeline-item">
                  <div className="timeline-icon"><Clock size={14} /></div>
                  <div className="timeline-content">
                    <strong>{labels[ev.eventType] || ev.eventType}</strong>
                    <small>{formatDate(ev.createdAt)}</small>
                    {ev.path && <code>Path: {ev.path}</code>}
                  </div>
                </div>
              ))}
              {!activeLeadActivity.events.length && (
                <p className="lead-empty">No tracked actions recorded yet for this lead.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    )}
  </main>;
}
