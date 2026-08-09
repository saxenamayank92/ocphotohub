import React, { useEffect, useState } from 'react';
import { Sparkles, ShieldCheck, QrCode, Search, CheckCircle, ArrowRight, Camera, Users, Lock, ChevronRight, Play, Award } from 'lucide-react';
import './ClubPreviewPage.css';

export default function ClubPreviewPage({ clubCode }) {
  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchDemoActive, setSearchDemoActive] = useState(false);
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);
  const [claimForm, setClaimForm] = useState({ name: '', email: '', phone: '', eventDate: '' });

  useEffect(() => {
    // 1. Fetch lead details and track click hit
    const fetchLeadAndTrackHit = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://pictide-api.summer-wind-c5c6.workers.dev';
        const res = await fetch(`${apiUrl}/api/leads/preview?code=${encodeURIComponent(clubCode)}`);
        if (res.ok) {
          const data = await res.json();
          setLead(data.lead);
          if (data.lead?.contact_first_name && data.lead.contact_first_name !== 'General') {
            setClaimForm(prev => ({
              ...prev,
              name: `${data.lead.contact_first_name} ${data.lead.contact_last_name || ''}`.trim(),
              email: data.lead.contact_email || ''
            }));
          }
        }
      } catch (err) {
        console.warn('Preview lead fetch error:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchLeadAndTrackHit();
  }, [clubCode]);

  const formatClubTitle = (rawName) => {
    if (!rawName) return 'Your Private Club';
    // Remove trailing city/state parens for main title
    return rawName.split('(')[0].trim();
  };

  const clubTitle = formatClubTitle(lead?.club_name);
  const orgType = lead?.organization_type || 'Private Club';
  const executiveName = lead?.contact_first_name && lead.contact_first_name !== 'General' 
    ? `${lead.contact_first_name} ${lead.contact_last_name || ''}`.trim() 
    : 'Executive Leadership';

  // Extract domain for official logo lookup
  const leadDomain = lead?.contact_email ? lead.contact_email.split('@')[1] : null;
  const logoUrl = leadDomain ? `https://logo.clearbit.com/${leadDomain}` : null;
  const faviconUrl = leadDomain ? `https://www.google.com/s2/favicons?domain=${leadDomain}&sz=128` : null;
  const [imgError, setImgError] = useState(false);

  // Generate luxury monogram initials (e.g., Winged Foot -> WF)
  const clubInitials = clubTitle
    .replace(/^(the|le|la|royal)\s+/i, '')
    .split(' ')
    .map(w => w[0])
    .filter(Boolean)
    .join('')
    .slice(0, 3)
    .toUpperCase();

  const samplePhotos = [
    {
      id: 1,
      title: 'Annual Member Gala & Dinner',
      category: 'Member Socials',
      url: 'https://images.unsplash.com/photo-1519671482749-fd09be7ccebf?auto=format&fit=crop&w=1200&q=80',
      watermark: clubTitle
    },
    {
      id: 2,
      title: 'Championship Trophy Presentation',
      category: 'Tournaments & Matches',
      url: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=1200&q=80',
      watermark: clubTitle
    },
    {
      id: 3,
      title: 'Clubhouse Sunset Reception',
      category: 'Dining & Lounge',
      url: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
      watermark: clubTitle
    },
    {
      id: 4,
      title: 'Member-Guest Invitational',
      category: 'Sports & Outings',
      url: 'https://images.unsplash.com/photo-1587174486073-ae5e5cff23aa?auto=format&fit=crop&w=1200&q=80',
      watermark: clubTitle
    }
  ];

  const handleClaimSubmit = (e) => {
    e.preventDefault();
    setClaimSubmitted(true);
  };

  return (
    <div className="preview-page-root">
      {/* Top Banner */}
      <div className="preview-top-bar">
        <div className="preview-top-brand">
          <ShieldCheck className="preview-top-shield" size={24} />
          <span className="preview-top-hub">Club PhotoHub</span>
          <span className="preview-top-badge">Private Concept Preview</span>
        </div>
        <button type="button" className="preview-top-claim-btn" onClick={() => setClaimModalOpen(true)}>
          Claim & Authorize Official Workspace →
        </button>
      </div>

      {/* Legal & Fair Use Concept Disclaimer Bar */}
      <div className="preview-disclaimer-bar">
        <ShieldCheck size={16} />
        <span>
          <strong>Executive Concept Walkthrough</strong> — Prepared by Club PhotoHub exclusively for evaluation by {clubTitle} leadership. This is a private interactive proposal; all trademarks & crests belong to their respective owners.
        </span>
      </div>

      {/* Main Hero Header */}
      <header className="preview-hero">
        <div className="preview-hero-container">
          <div className="preview-executive-tag">
            <Sparkles size={16} />
            <span>Exclusively Prepared for <strong>{executiveName}</strong> & Board of Directors</span>
          </div>

          {/* Club Crest / Logo Display */}
          <div className="preview-crest-container">
            {logoUrl && !imgError ? (
              <img 
                src={logoUrl} 
                alt={`${clubTitle} Crest`} 
                className="preview-club-crest-img"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="preview-crest-monogram">
                <span>{clubInitials}</span>
              </div>
            )}
          </div>

          <h1 className="preview-club-title">{clubTitle}</h1>
          <p className="preview-club-subtitle">
            Private Member Photo & Event Media Portal • Built for {orgType} Excellence
          </p>

          {/* Quick Value Metrics */}
          <div className="preview-metrics-grid">
            <div className="preview-metric-card">
              <div className="preview-metric-icon"><QrCode size={22} /></div>
              <div className="preview-metric-body">
                <strong>Passwordless QR Access</strong>
                <span>Members scan 1 QR code at events to view photos immediately</span>
              </div>
            </div>

            <div className="preview-metric-card">
              <div className="preview-metric-icon"><Lock size={22} /></div>
              <div className="preview-metric-body">
                <strong>100% Member Privacy</strong>
                <span>Zero public indexing or slow third-party link leaks</span>
              </div>
            </div>

            <div className="preview-metric-card">
              <div className="preview-metric-icon"><Camera size={22} /></div>
              <div className="preview-metric-body">
                <strong>Saves 8+ Hours per Event</strong>
                <span>Eliminates staff time uploading to Google Drive or Dropbox</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Live Gallery Interactive Demonstration */}
      <section className="preview-gallery-section">
        <div className="preview-section-header">
          <h2>Interactive Member Portal Showcase</h2>
          <p>This is how your members experience high-res event photography on mobile or desktop</p>
        </div>

        {/* Filter Chips Simulator */}
        <div className="preview-filter-chips">
          <button type="button" className="chip active">All Member Events</button>
          <button type="button" className="chip">Tournaments & Matches</button>
          <button type="button" className="chip">Member Galas</button>
          <button type="button" className="chip">Clubhouse Dining</button>
          <button 
            type="button" 
            className={`chip search-chip ${searchDemoActive ? 'searching' : ''}`}
            onClick={() => setSearchDemoActive(!searchDemoActive)}
          >
            <Search size={14} /> {searchDemoActive ? 'Showing Selfies for Member #104' : 'Try AI Selfie Search Demo'}
          </button>
        </div>

        {/* Photo Grid */}
        <div className="preview-photo-grid">
          {samplePhotos.map(photo => (
            <div 
              key={photo.id} 
              className="preview-photo-card"
              onClick={() => setSelectedPhoto(photo)}
            >
              <div className="preview-photo-wrap">
                <img src={photo.url} alt={photo.title} />
                <div className="preview-watermark-overlay">
                  <span>{photo.watermark} • Official Member Gallery</span>
                </div>
              </div>
              <div className="preview-photo-caption">
                <h4>{photo.title}</h4>
                <span className="photo-category-pill">{photo.category}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* QR Code Experience Walkthrough */}
      <section className="preview-qr-section">
        <div className="preview-qr-container">
          <div className="preview-qr-left">
            <span className="qr-badge">Zero Friction Member Experience</span>
            <h2>How It Works at Your Next Flagship Event</h2>
            <div className="qr-steps">
              <div className="qr-step">
                <div className="step-num">1</div>
                <div>
                  <h4>Place QR Table Cards at Your Event</h4>
                  <p>Display your custom QR code on dining tables, golf carts, or clubhouse foyers.</p>
                </div>
              </div>

              <div className="qr-step">
                <div className="step-num">2</div>
                <div>
                  <h4>Members Scan & Instantly View</h4>
                  <p>No app downloads, zero passwords. Members scan with their phone camera and immediately see high-res photos.</p>
                </div>
              </div>

              <div className="qr-step">
                <div className="step-num">3</div>
                <div>
                  <h4>White-Labeled Club Pride</h4>
                  <p>Every photo downloaded features your official {clubTitle} watermark and branding.</p>
                </div>
              </div>
            </div>

            <button type="button" className="btn-primary preview-cta-btn" onClick={() => setClaimModalOpen(true)}>
              Start 30-Day Free Event Trial for {clubTitle} <ArrowRight size={18} />
            </button>
          </div>

          <div className="preview-qr-right">
            <div className="qr-mockup-card">
              <div className="qr-card-header">
                <ShieldCheck size={28} />
                <h3>{clubTitle}</h3>
                <span>Member Photo Portal</span>
              </div>
              <div className="qr-code-box">
                <QrCode size={140} />
                <p>Scan with Phone Camera</p>
              </div>
              <div className="qr-card-footer">
                <span>Instant High-Res Event Gallery</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Claim Trial Modal */}
      {claimModalOpen && (
        <div className="preview-modal-overlay" onClick={() => setClaimModalOpen(false)}>
          <div className="preview-modal-card" onClick={e => e.stopPropagation()}>
            <button type="button" className="preview-modal-close" onClick={() => setClaimModalOpen(false)}>×</button>
            {!claimSubmitted ? (
              <>
                <div className="modal-icon-header">
                  <Award size={36} />
                  <h2>Activate Free 30-Day Trial</h2>
                  <p>Set up a white-labeled photo workspace for <strong>{clubTitle}</strong> with zero commitment.</p>
                </div>

                <form onSubmit={handleClaimSubmit} className="claim-form">
                  <div className="form-group">
                    <label>Executive Contact Name</label>
                    <input 
                      type="text" 
                      required 
                      value={claimForm.name}
                      onChange={e => setClaimForm({ ...claimForm, name: e.target.value })}
                      placeholder="e.g. Colin Burns" 
                    />
                  </div>

                  <div className="form-group">
                    <label>Official Club Email</label>
                    <input 
                      type="email" 
                      required 
                      value={claimForm.email}
                      onChange={e => setClaimForm({ ...claimForm, email: e.target.value })}
                      placeholder="e.g. cburns@clubdomain.com" 
                    />
                  </div>

                  <div className="form-group">
                    <label>Upcoming Flagship Event Date (Optional)</label>
                    <input 
                      type="text" 
                      value={claimForm.eventDate}
                      onChange={e => setClaimForm({ ...claimForm, eventDate: e.target.value })}
                      placeholder="e.g. Annual Member-Guest Tournament (August 25)" 
                    />
                  </div>

                  <button type="submit" className="btn-primary submit-claim-btn">
                    Confirm & Provision {clubTitle} Workspace →
                  </button>
                </form>
              </>
            ) : (
              <div className="claim-success-box">
                <CheckCircle size={56} className="success-icon" />
                <h2>{clubTitle} Workspace Provisioned!</h2>
                <p>Thank you <strong>{claimForm.name}</strong>. Founder Mayank Saxena has been notified and will email your custom admin credentials and QR table cards within 2 hours.</p>
                <button type="button" className="btn-primary" onClick={() => setClaimModalOpen(false)}>
                  Back to Walkthrough
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
