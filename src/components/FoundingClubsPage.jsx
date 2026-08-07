import React, { useState } from 'react';
import { ArrowRight, CheckCircle2, Award, ShieldCheck, Sparkles, Tag, Users } from 'lucide-react';
import { platformBrand } from '../brand';

export default function FoundingClubsPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    clubName: '',
    applicantName: '',
    email: '',
    role: 'General Manager',
    upcomingEvent: '',
    notes: ''
  });

  const handleSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    try {
      await fetch('/api/platform/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          program: 'Founding Club Pilot',
          jobTitle: form.role,
          workEmail: form.email,
          firstName: form.applicantName.split(' ')[0] || form.applicantName,
          lastName: form.applicantName.split(' ').slice(1).join(' ') || ''
        })
      });
    } catch {
      // Fallback
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <div className="marketing-page founding-page-container">
      <header className="marketing-nav">
        <a className="marketing-brand" href="/" aria-label="Club PhotoHub home">
          <img src={platformBrand.mark} alt="" width="32" height="32" />
          <span>{platformBrand.name}</span>
        </a>
        <nav className="marketing-nav-links" aria-label="Main navigation">
          <a href="/#features">Features</a>
          <a href="/book-demo">Book Demo</a>
          <a href="/pricing">Pricing</a>
          <a className="active" href="/founding-clubs">Founding Pilot</a>
          <a href="/security">Security</a>
        </nav>
        <a className="marketing-nav-cta" href="/app">Member sign in <ArrowRight size={16} /></a>
      </header>

      <main className="founding-page-main">
        <section className="founding-hero">
          <span className="pricing-eyebrow"><Award size={15} /> Exclusive Sales-Led Pilot Program</span>
          <h1>The Founding Club Partner Program</h1>
          <p>
            An assisted 60-day pilot for select Canadian and U.S. private clubs. We work directly with your leadership team to configure your workspace, import your member directory, and launch a branded photo hub for your next major event.
          </p>

          <div className="founding-scarcity-pill">
            <Tag size={16} />
            <span><strong>Program Scarcity:</strong> Currently accepting applications for the next <strong>5 qualified clubs</strong>.</span>
          </div>
        </section>

        <section className="founding-features-grid">
          <div className="founding-card">
            <div className="founding-card-icon"><Sparkles size={24} /></div>
            <h3>Assisted 60-Day Pilot</h3>
            <p>Double the standard 30-day trial window with dedicated onboarding support from founder Mayank Saxena.</p>
          </div>
          <div className="founding-card">
            <div className="founding-card-icon"><Users size={24} /></div>
            <h3>Roster & Branding Setup</h3>
            <p>We handle logo crest styling, category setup, and secure import of your approved member roster.</p>
          </div>
          <div className="founding-card">
            <div className="founding-card-icon"><ShieldCheck size={24} /></div>
            <h3>Launch Event Support</h3>
            <p>We create dedicated categories and member guides for your upcoming tournament, gala, or regatta.</p>
          </div>
          <div className="founding-card">
            <div className="founding-card-icon"><Tag size={24} /></div>
            <h3>Founding Partner Pricing</h3>
            <p>Lock in 20% off your base workspace for the first 12 months using code <strong>FOUNDING20</strong>.</p>
          </div>
        </section>

        <section className="founding-application-section" id="apply">
          <div className="founding-app-wrapper">
            <div className="founding-app-copy">
              <h2>Apply for an Assisted Founding Pilot</h2>
              <p>Tell us about your club and upcoming event schedule. No credit card required to apply or begin.</p>
              
              <div className="founding-checklist">
                <div className="checklist-item"><CheckCircle2 size={18} /> 60 days of full workspace access</div>
                <div className="checklist-item"><CheckCircle2 size={18} /> Assisted directory & logo setup</div>
                <div className="checklist-item"><CheckCircle2 size={18} /> Staff administrator orientation</div>
                <div className="checklist-item"><CheckCircle2 size={18} /> 20% discount code <code>FOUNDING20</code></div>
              </div>
            </div>

            <div className="founding-app-form">
              {submitted ? (
                <div className="demo-success-card">
                  <CheckCircle2 size={48} className="success-icon" />
                  <h3>Application Submitted!</h3>
                  <p>Thank you for applying for <strong>{form.clubName}</strong>. Mayank Saxena will review your application details and contact you within 24 hours.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label>Club / Organization Name *</label>
                    <input type="text" required value={form.clubName} onChange={e => setForm({ ...form, clubName: e.target.value })} placeholder="e.g. Royal Canadian Yacht Club" />
                  </div>
                  <div className="form-group">
                    <label>Applicant Name *</label>
                    <input type="text" required value={form.applicantName} onChange={e => setForm({ ...form, applicantName: e.target.value })} placeholder="e.g. Mayank Saxena" />
                  </div>
                  <div className="form-group">
                    <label>Work Email *</label>
                    <input type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="e.g. gm@rcyc.ca" />
                  </div>
                  <div className="form-group">
                    <label>Your Role *</label>
                    <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                      <option value="General Manager">General Manager / COO</option>
                      <option value="Membership Director">Membership Director</option>
                      <option value="Marketing Director">Marketing / Communications</option>
                      <option value="Events Director">Events Director</option>
                      <option value="Clubhouse Manager">Clubhouse Manager</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Target Launch Event (Optional)</label>
                    <input type="text" value={form.upcomingEvent} onChange={e => setForm({ ...form, upcomingEvent: e.target.value })} placeholder="e.g. Annual Member-Guest Tournament (Sept)" />
                  </div>
                  <button type="submit" className="marketing-primary-cta" style={{ width: '100%', justifyContent: 'center', marginTop: 14 }} disabled={loading}>
                    {loading ? 'Submitting Application...' : 'Apply for Founding Pilot'} <ArrowRight size={16} />
                  </button>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>

      <footer className="marketing-footer">
        <div className="marketing-footer-container">
          <div className="marketing-brand">
            <img src={platformBrand.mark} alt="" width="28" height="28" />
            <span>{platformBrand.name}</span>
          </div>
          <div className="footer-links">
            <a href="/features">Features</a>
            <a href="/pricing">Pricing</a>
            <a href="/security">Security</a>
            <a href="/founding-clubs">Founding Pilot</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </div>
          <span>© {new Date().getFullYear()} xTide Apps</span>
        </div>
      </footer>
    </div>
  );
}
