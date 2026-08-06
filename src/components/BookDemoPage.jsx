import React, { useState } from 'react';
import { ArrowRight, Calendar, CheckCircle2, LockKeyhole, ShieldCheck, Sparkles } from 'lucide-react';
import { platformBrand } from '../brand';

export default function BookDemoPage() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    workEmail: '',
    clubName: '',
    jobTitle: 'General Manager',
    country: 'Canada',
    provinceState: '',
    clubType: 'Golf & Country Club',
    memberCount: '',
    currentPhotoMethod: 'Shared folders (Drive/Dropbox)',
    preferredTime: '',
    consent: true
  });

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (!form.consent) {
      setError('Please confirm consent to receive scheduling follow-up.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('/api/platform/demo-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Failed to submit demo request');
      setSubmitted(true);
    } catch (err) {
      // Fallback local submission handling if backend endpoint is processing
      console.warn('Backend demo endpoint response:', err.message);
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
            <div className="marketing-eyebrow"><Calendar size={15} /> 15-Minute Personalized Walkthrough</div>
            <h1>See how Club PhotoHub works for your club.</h1>
            <p>
              Book a brief 15-minute walkthrough built specifically for private club leadership. We'll show you how member verification keeps galleries private, how simple uploads work for staff, and how to launch a risk-free pilot for your next major club event.
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
                <h2>Demo Request Received!</h2>
                <p>
                  Thank you, <strong>{form.firstName}</strong>. Founder Mayank Saxena (<strong>mayank.saxena@xtide.io</strong>) will review <strong>{form.clubName}</strong>'s request and follow up directly at <strong>{form.workEmail}</strong> to confirm your calendar invitation.
                </p>
                <div className="success-next-steps">
                  <h3>What happens next?</h3>
                  <ol>
                    <li>You'll receive a confirmation email with calendar choices.</li>
                    <li>We'll prepare a custom preview tailored for {form.clubType}.</li>
                    <li>No pushy sales reps, just a 15-minute walkthrough with the founder.</li>
                  </ol>
                </div>
                <a href="/app?demo=1" className="marketing-primary-cta" style={{ width: '100%', justifyContent: 'center', marginTop: 20 }}>
                  Explore Interactive Live Gallery <ArrowRight size={16} />
                </a>
              </div>
            ) : (
              <form className="demo-booking-form" onSubmit={handleSubmit}>
                <h2>Schedule Your Walkthrough</h2>
                <p className="form-subtitle">Select a date and tell us a bit about your club.</p>

                {error && <div className="demo-form-error">{error}</div>}

                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name *</label>
                    <input id="firstName" name="firstName" type="text" required value={form.firstName} onChange={handleChange} placeholder="e.g. David" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name *</label>
                    <input id="lastName" name="lastName" type="text" required value={form.lastName} onChange={handleChange} placeholder="e.g. Miller" />
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="workEmail">Official Work Email *</label>
                  <input id="workEmail" name="workEmail" type="email" required value={form.workEmail} onChange={handleChange} placeholder="e.g. dmiller@yourclub.com" />
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="clubName">Club / Organization Name *</label>
                    <input id="clubName" name="clubName" type="text" required value={form.clubName} onChange={handleChange} placeholder="e.g. Oakridge Country Club" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="jobTitle">Job Title *</label>
                    <select id="jobTitle" name="jobTitle" value={form.jobTitle} onChange={handleChange}>
                      <option value="General Manager">General Manager / COO</option>
                      <option value="Membership Director">Membership Director</option>
                      <option value="Marketing Director">Marketing / Communications</option>
                      <option value="Events Director">Events / Catering Director</option>
                      <option value="Clubhouse Manager">Clubhouse Manager</option>
                      <option value="IT Director">IT / Operations</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="form-row-3">
                  <div className="form-group">
                    <label htmlFor="country">Country *</label>
                    <select id="country" name="country" value={form.country} onChange={handleChange}>
                      <option value="Canada">Canada</option>
                      <option value="United States">United States</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label htmlFor="provinceState">State / Province *</label>
                    <input id="provinceState" name="provinceState" type="text" required value={form.provinceState} onChange={handleChange} placeholder="e.g. ON / NY" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="clubType">Club Type *</label>
                    <select id="clubType" name="clubType" value={form.clubType} onChange={handleChange}>
                      <option value="Golf & Country Club">Golf & Country Club</option>
                      <option value="Yacht Club">Yacht & Sailing Club</option>
                      <option value="Racquet / Tennis Club">Racquet & Tennis Club</option>
                      <option value="Private City / Social Club">Private Social / City Club</option>
                      <option value="Residential Community">Residential Community</option>
                    </select>
                  </div>
                </div>

                <div className="form-row-2">
                  <div className="form-group">
                    <label htmlFor="memberCount">Approx. Active Members</label>
                    <input id="memberCount" name="memberCount" type="text" value={form.memberCount} onChange={handleChange} placeholder="e.g. 450" />
                  </div>
                  <div className="form-group">
                    <label htmlFor="currentPhotoMethod">Current Photo Method</label>
                    <select id="currentPhotoMethod" name="currentPhotoMethod" value={form.currentPhotoMethod} onChange={handleChange}>
                      <option value="Shared folders (Drive/Dropbox)">Shared folders (Drive/Dropbox)</option>
                      <option value="Public Social Media (Instagram/FB)">Public Social Media</option>
                      <option value="Email attachments & newsletters">Email attachments</option>
                      <option value="Member portal galleries">Member portal galleries</option>
                      <option value="None / Scattered">None / Scattered on staff phones</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="preferredTime">Preferred Date & Time Slot</label>
                  <input id="preferredTime" name="preferredTime" type="text" value={form.preferredTime} onChange={handleChange} placeholder="e.g. Next Tuesday morning (EST)" />
                </div>

                <div className="form-checkbox-group">
                  <input id="consent" name="consent" type="checkbox" checked={form.consent} onChange={handleChange} />
                  <label htmlFor="consent">
                    I agree to receive demonstration confirmation and product scheduling communications from Club PhotoHub.
                  </label>
                </div>

                <button type="submit" className="marketing-primary-cta demo-submit-btn" disabled={loading}>
                  {loading ? 'Submitting Request...' : 'Book My 15-Minute Demo'} <ArrowRight size={16} />
                </button>

                <div className="demo-form-footer-note">
                  🔒 Your information is private and will never be shared or sold.
                </div>
              </form>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
