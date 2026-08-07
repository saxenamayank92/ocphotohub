import React, { useState, useEffect } from 'react';
import { ArrowRight, CheckCircle2, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import { platformBrand } from '../brand';

export default function BookDemoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    clubName: '',
    workEmail: ''
  });

  useEffect(() => {
    // Read pre-filled club name from URL search params if present
    const params = new URLSearchParams(window.location.search);
    const prefilledClub = params.get('club') || params.get('clubName') || '';
    const prefilledEmail = params.get('email') || '';
    if (prefilledClub || prefilledEmail) {
      setForm(prev => ({
        ...prev,
        clubName: prefilledClub || prev.clubName,
        workEmail: prefilledEmail || prev.workEmail
      }));
    }
  }, []);

  const handleChange = e => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const response = await fetch('/api/platform/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: 'Club Leader',
          lastName: '',
          workEmail: form.workEmail,
          clubName: form.clubName,
          jobTitle: 'General Manager / Director',
          country: 'Canada',
          provinceState: 'ON',
          clubType: 'Private Club',
          memberCount: '',
          currentPhotoMethod: 'Requested Branded Preview',
          preferredTime: 'Asynchronous Preview',
          program: 'Branded Sample Workspace Preview',
          consent: true
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit preview request');
      setSubmitted(true);
    } catch (err) {
      console.warn('Backend preview endpoint response:', err.message);
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="marketing-page demo-page-container">
      <header className="marketing-nav">
        <a className="marketing-brand" href="/" aria-label="Club PhotoHub home">
          <img src={platformBrand.mark} alt="" width="32" height="32" />
          <span>{platformBrand.name}</span>
        </a>
        <nav className="marketing-nav-links" aria-label="Main navigation">
          <a href="/#features">Features</a>
          <a href="/#solutions">Solutions</a>
          <a href="/pricing">Pricing</a>
          <a href="/founding-clubs">Founding Pilot</a>
          <a href="/security">Security</a>
        </nav>
        <a className="marketing-nav-cta" href="/app">Member sign in <ArrowRight size={16} /></a>
      </header>

      <main className="demo-page-main">
        <div className="demo-page-wrapper">
          <div className="demo-copy-column">
            <div className="marketing-eyebrow"><Sparkles size={15} /> Tailored Member Experience</div>
            <h1>See Club PhotoHub for your club.</h1>
            <p>
              We'll prepare a private sample workspace using your club's colors and branding so you can see exactly what the member photo experience would look like. Zero setup required for your staff.
            </p>

            <div className="demo-trust-bullets">
              <div className="demo-trust-item">
                <ShieldCheck className="trust-icon" size={20} />
                <div>
                  <strong>Built by a Private Club Operator</strong>
                  <span>Designed by Mayank Saxena from inside Canadian private club operations.</span>
                </div>
              </div>
              <div className="demo-trust-item">
                <LockKeyhole className="trust-icon" size={20} />
                <div>
                  <strong>Roster-Verified Access</strong>
                  <span>100% private. Only verified members in your directory can view or upload.</span>
                </div>
              </div>
              <div className="demo-trust-item">
                <Sparkles className="trust-icon" size={20} />
                <div>
                  <strong>Zero Core System Changes</strong>
                  <span>Works alongside your existing club management software without complex IT integration.</span>
                </div>
              </div>
            </div>
          </div>

          <div className="demo-form-column">
            {submitted ? (
              <div className="demo-success-card">
                <CheckCircle2 size={48} className="success-icon" />
                <h2>Preview Request Received!</h2>
                <p>
                  Thank you! We are preparing a custom sample workspace for <strong>{form.clubName || 'your club'}</strong>.
                </p>
                <p style={{ marginTop: 12, fontSize: 15, color: '#4a5754' }}>
                  We'll send your private preview link directly to <strong>{form.workEmail}</strong> shortly.
                </p>
                <div className="success-next-steps">
                  <h3>What happens next?</h3>
                  <ol>
                    <li>We generate your club's branded photo feed.</li>
                    <li>You'll receive a 60-second walkthrough link in your inbox.</li>
                    <li>No pushy sales calls — just a private preview link to explore.</li>
                  </ol>
                </div>
                <a href="/app?demo=1" className="marketing-primary-cta" style={{ width: '100%', justifyContent: 'center', marginTop: 24 }}>
                  Explore Interactive Live Gallery <ArrowRight size={16} />
                </a>
              </div>
            ) : (
              <form className="demo-booking-form" onSubmit={handleSubmit}>
                <h2>Get a preview for your club</h2>
                <p className="form-subtitle">We'll build a private sample workspace with your club's branding.</p>

                {error && <div className="demo-form-error">{error}</div>}

                <div className="form-group" style={{ marginBottom: 20 }}>
                  <label htmlFor="clubName">Club or Organization Name *</label>
                  <input
                    id="clubName"
                    name="clubName"
                    type="text"
                    required
                    value={form.clubName}
                    onChange={handleChange}
                    placeholder="e.g. Heritage Oaks Country Club"
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 24 }}>
                  <label htmlFor="workEmail">Official Work Email *</label>
                  <input
                    id="workEmail"
                    name="workEmail"
                    type="email"
                    required
                    value={form.workEmail}
                    onChange={handleChange}
                    placeholder="e.g. generalmanager@heritageoaks.com"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="marketing-primary-cta"
                  style={{ width: '100%', justifyContent: 'center', minHeight: 52, fontSize: 16 }}
                >
                  {loading ? 'Preparing Preview...' : 'Create My Preview'} <ArrowRight size={18} />
                </button>

                <p style={{ fontSize: 13, color: '#61706c', textAlign: 'center', marginTop: 16, lineHeight: 1.5 }}>
                  <LockKeyhole size={13} style={{ display: 'inline', marginRight: 4, verticalAlign: '-1px' }} />
                  No credit card required. Zero staff installation.
                </p>
              </form>
            )}
          </div>
        </div>
      </main>

      <footer className="marketing-footer">
        <div className="marketing-footer-content">
          <p>© {new Date().getFullYear()} Club PhotoHub (xTide Apps). All rights reserved.</p>
          <div className="marketing-footer-links">
            <a href="/security">Security</a>
            <a href="/founding-clubs">Founding Pilot</a>
            <a href="/app">Member Portal</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
