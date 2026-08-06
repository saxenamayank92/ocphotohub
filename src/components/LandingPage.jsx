import React from 'react';
import {
  ArrowRight, Check, CheckCircle2, Download, Heart, Images, LockKeyhole,
  Menu, Palette, ShieldCheck, Smartphone, Sparkles, Tag, UploadCloud, UserRound, Users, X
} from 'lucide-react';
import { platformBrand } from '../brand';
import VerticalShowcase from './VerticalShowcase';
import './LandingPage.css';

const features = [
  [Images, 'A familiar photo feed', 'Members scroll through club moments in a mobile-first gallery with captions, likes, downloads and touch zoom.'],
  [UploadCloud, 'Effortless group uploads', 'Add multiple photos from a phone or computer, choose categories and caption every moment before publishing.'],
  [LockKeyhole, 'Roster-verified access', 'Organization, member number, last name and verified roster email work together to protect first-time signup.'],
  [Palette, 'Your organization, your space', 'Add your name, crest and categories without forcing members into a public social network.'],
  [Users, 'Member directory built in', 'Administrators manage membership records, account status and who belongs in each isolated workspace.'],
  [ShieldCheck, 'Practical moderation', 'Members control their uploads while administrators can remove content and keep the gallery appropriate.']
];

const audiences = ['Country clubs', 'Golf & racquet clubs', 'Yacht clubs', 'Residential communities', 'Alumni groups', 'Hospitality teams'];

const comparison = [
  ['Organization roster verification', true, false, false],
  ['No public social profile required', true, true, false],
  ['Purpose-built scrolling photo feed', true, false, true],
  ['Club branding and categories', true, false, false],
  ['Member uploads, likes and downloads', true, 'Partial', 'Partial'],
  ['Administrator photo moderation', true, 'Files', true]
];

function Mark({ value }) {
  if (value === true) return <CheckCircle2 className="comparison-yes" size={18} aria-label="Included" />;
  if (value === false) return <X className="comparison-no" size={17} aria-label="Not purpose-built" />;
  return <span>{value}</span>;
}

function DemoPost({ image, initials, name, category, caption, likes }) {
  return (
    <article className="landing-demo-post">
      <header className="demo-post-header">
        <span className="demo-post-avatar">{initials}</span>
        <div className="demo-post-user-info">
          <strong>{name}</strong>
          <small>Heritage Oaks · This week</small>
        </div>
        <span className="demo-post-badge">{category}</span>
      </header>
      <div className="demo-post-img-wrapper">
        <img src={image} alt={`${category} moment shared in the Heritage Oaks demo`} loading="lazy" decoding="async" />
      </div>
      <div className="landing-demo-actions">
        <div className="demo-action-left">
          <Heart size={18} fill="#e11d48" color="#e11d48" />
          <strong>{likes} likes</strong>
        </div>
        <button className="demo-download-btn" type="button" title="Download High Res">
          <Download size={16} />
        </button>
      </div>
      <p className="demo-post-caption">
        <strong>{name}</strong> {caption}
      </p>
    </article>
  );
}

export default function LandingPage() {
  return (
    <div className="marketing-page">
      {/* Founding Club Banner */}
      <div className="founding-club-banner" role="region" aria-label="Special offer">
        <div className="banner-content">
          <Tag size={15} />
          <span><strong>Founding Club Invitation:</strong> Get 20% off your first 12 months with code <code className="promo-code">FOUNDING20</code></span>
        </div>
        <a href="/app?onboard=club" className="banner-cta">Claim 30-Day Trial <ArrowRight size={14} /></a>
      </div>

      <header className="marketing-nav">
        <a className="marketing-brand" href="/" aria-label="Club PhotoHub home">
          <img src={platformBrand.mark} alt="" width="32" height="32" />
          <span>{platformBrand.name}</span>
        </a>
        <nav className="marketing-nav-links" aria-label="Main navigation">
          <a href="#features">Features</a>
          <a href="/book-demo">Book Demo</a>
          <a href="/founding-clubs">Founding Pilot</a>
          <a href="/pricing">Pricing</a>
          <a href="/security">Security</a>
        </nav>
        <a className="marketing-nav-cta" href="/app">Member sign in <ArrowRight size={16} /></a>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="marketing-hero">
          <div className="marketing-hero-copy">
            <div className="marketing-eyebrow"><ShieldCheck size={15} /> PRIVATE PHOTO SHARING FOR MEMBER CLUBS</div>
            <h1>Your club’s private home for member photos.</h1>
            <p>Give members and staff one beautifully branded place to collect, organize and enjoy club moments—without public social media, scattered email attachments or messy shared folders.</p>
            <div className="marketing-hero-actions">
              <a className="marketing-primary-cta" href="/book-demo">Book a 15-minute club demo <ArrowRight size={18} /></a>
              <a className="marketing-secondary-cta" href="/app?demo=1">Explore live gallery</a>
            </div>
            <div className="marketing-trust-row">
              <span><Check size={15} /> Built by a private-club operator</span>
              <span><Check size={15} /> Roster-verified access</span>
              <span><Check size={15} /> Club-owned workspace</span>
              <span><Check size={15} /> No public member profiles</span>
            </div>
            <div className="store-badges" aria-label="Mobile apps coming soon">
              <span className="store-badges-label">Coming soon</span>
              <div className="store-badges-row">
                <span className="store-badge"><img src="./app-store-mark.svg" alt="" width="18" height="18" /><strong>App Store</strong></span>
                <span className="store-badge"><img src="./google-play-mark.svg" alt="" width="18" height="18" /><strong>Google Play</strong></span>
              </div>
            </div>
          </div>

          <div className="hero-device-stack" aria-label="Club PhotoHub Your Club demo preview">
            {/* Floating Glassmorphism Badges */}
            <div className="hero-floating-badge top-left">
              <Sparkles size={14} className="badge-sparkle-icon" />
              <div>
                <strong>14 New Photos Today</strong>
                <span>Heritage Oaks Country Club</span>
              </div>
            </div>

            <div className="hero-desktop">
              <div className="marketing-window-bar">
                <div className="window-dots">
                  <span className="dot red" /><span className="dot yellow" /><span className="dot green" />
                </div>
                <div className="browser-address-bar">
                  <LockKeyhole size={11} className="lock-icon" />
                  <span>clubphotohub.com/heritage-oaks/feed</span>
                </div>
                <div className="hero-desktop-live-tag">
                  <span className="live-pulse" />
                  <strong>LIVE GALLERY</strong>
                </div>
              </div>
              <img className="hero-product-screenshot" src="./demo/product-feed.png" alt="Club PhotoHub member gallery demo screen" fetchPriority="high" decoding="async" />
            </div>

            <div className="hero-phone" aria-label="Club PhotoHub mobile gallery mockup">
              <div className="hero-phone-notch" />
              <div className="hero-phone-status"><span>9:41</span><span>● ● ▮</span></div>
              <div className="hero-phone-header"><img src={platformBrand.mark} alt="" width="20" height="20" /><strong>Your Club</strong><Menu size={15} /></div>
              <div className="hero-phone-tabs"><span className="active">Member Gallery</span><span>Upload</span></div>
              <div className="hero-phone-chips"><span className="active">All</span><span>Golf</span><span>Dining</span></div>
              <div className="hero-phone-post-header"><span><UserRound size={11} /></span><div><strong>Jordan Lee</strong><small>This week · GOLF</small></div></div>
              <img src="./demo/golf-morning.jpg" alt="Golf morning in the Your Club mobile gallery" loading="lazy" decoding="async" />
              <div className="hero-phone-actions"><Heart size={15} fill="var(--club-gold)" color="var(--club-gold)" /><strong>34</strong><Download size={15} /><span /></div>
              <p><strong>Jordan Lee</strong> Championship weekend begins.</p>
            </div>

            <div className="hero-floating-badge bottom-right">
              <ShieldCheck size={15} className="badge-shield-icon" />
              <div>
                <strong>Roster-Verified Access</strong>
                <span>100% Private & Organization Owned</span>
              </div>
            </div>
          </div>
        </section>

        {/* AUDIENCES / VERTICAL SOLUTIONS */}
        <section className="marketing-club-types">
          <p>Built specifically for private communities that value belonging</p>
          <div>{audiences.map(item => <span key={item}>{item}</span>)}</div>
        </section>

        {/* INTERACTIVE VERTICAL SHOWCASE */}
        <section className="marketing-section" id="solutions">
          <div className="marketing-section-heading">
            <span>Tailored for your organization type</span>
            <h2>Designed for every private member community.</h2>
            <p>Select your organization type below to see how Club PhotoHub protects member privacy and simplifies photo sharing for your events.</p>
          </div>
          <VerticalShowcase />
        </section>

        {/* FEATURES GRID */}
        <section className="marketing-section" id="features">
          <div className="marketing-section-heading">
            <span>Everything in one focused product</span>
            <h2>Sharing memories should feel effortless and organized.</h2>
            <p>Club PhotoHub combines the simplicity members expect with the identity and controls organizations need.</p>
          </div>
          <div className="marketing-feature-grid">
            {features.map(([Icon, title, copy]) => (
              <article className="marketing-feature-card" key={title}>
                <div className="marketing-feature-icon"><Icon size={22} /></div>
                <h3>{title}</h3>
                <p>{copy}</p>
              </article>
            ))}
          </div>
        </section>

        {/* LIVE DEMO SHOWCASE */}
        <section className="product-showcase">
          <div className="product-showcase-container">
            <div className="product-showcase-copy">
              <span>Meet Your Club</span>
              <h2>A real demo, filled with moments, not placeholders.</h2>
              <p>Explore the same private feed your members will use. Browse categories, open photos, pinch to zoom, like a moment and try the mobile layout.</p>
              <a href="/app?demo=1">Open the interactive demo <ArrowRight size={17} /></a>
            </div>
            <div className="showcase-feed">
              <DemoPost image="./demo/tennis-social.jpg" initials="TC" name="Taylor Chen" category="TENNIS" likes="34" caption="A close match and the best kind of Saturday afternoon." />
              <DemoPost image="./demo/garden-dinner.jpg" initials="CT" name="Club Team" category="DINING" likes="46" caption="The annual garden dinner brought everyone together." />
            </div>
          </div>
        </section>

        {/* HOW IT WORKS */}
        <section className="marketing-how" id="how-it-works">
          <div className="marketing-how-container">
            <div className="marketing-how-intro">
              <span>From signup to active gallery</span>
              <h2>Set up once. Members take it from there.</h2>
              <p>A guided onboarding flow with an organization-owned membership gate.</p>
            </div>
            <div className="marketing-steps">
              <article><strong>01</strong><h3>Create the workspace</h3><p>Choose your organization type, verify the primary administrator and start a separate 30-day trial.</p></article>
              <article><strong>02</strong><h3>Add the directory</h3><p>Enter member names, numbers and registered emails so only recognized people can create accounts.</p></article>
              <article><strong>03</strong><h3>Share the moments</h3><p>Members verify themselves, choose their password and begin uploading, browsing, liking and downloading.</p></article>
            </div>
          </div>
        </section>

        {/* FOUNDER STORY SECTION */}
        <section className="marketing-section founder-story-section">
          <div className="founder-story-card">
            <div className="founder-avatar-box">
              <div className="founder-avatar-placeholder">MS</div>
            </div>
            <div className="founder-story-copy">
              <span>FOUNDER STORY</span>
              <h2>Built from inside the private-club industry.</h2>
              <p>
                Club PhotoHub was created by <strong>Mayank Saxena</strong>, a Canadian private-club operator who saw valuable member and event photos repeatedly disappear into staff phones, email threads, shared folders, and public social platforms.
              </p>
              <p>
                He built a focused alternative that feels familiar to members while giving the club complete data ownership, privacy, and administrative control. Operates under <strong>xTide Apps</strong>.
              </p>
              <div className="founder-contact-meta">
                <span><strong>Mayank Saxena</strong> · Founder, Club PhotoHub</span>
                <a href="mailto:mayank.saxena@xtide.io" className="founder-email-link">mayank.saxena@xtide.io</a>
              </div>
            </div>
          </div>
        </section>

        {/* EXISTING SYSTEMS POSITIONING */}
        <section className="marketing-section systems-positioning-section">
          <div className="marketing-section-heading">
            <span>Seamless Complement</span>
            <h2>Works alongside the systems your club already uses.</h2>
            <p>
              Club PhotoHub is not intended to replace your club-management platform, member portal, or website. It provides a dedicated, member-verified photo experience that links cleanly from your existing digital channels.
            </p>
          </div>
          <div className="systems-features-grid">
            <div className="system-feature-item">
              <ShieldCheck size={20} className="system-icon" />
              <h3>No Core System Replacement</h3>
              <p>Keep your existing accounting, tee-sheet, and roster software untouched.</p>
            </div>
            <div className="system-feature-item">
              <LockKeyhole size={20} className="system-icon" />
              <h3>Member Portal Linkage</h3>
              <p>Link directly from your member portal or mobile app with seamless single sign-on or roster verification.</p>
            </div>
            <div className="system-feature-item">
              <UploadCloud size={20} className="system-icon" />
              <h3>Assisted Roster Import</h3>
              <p>Easily import approved member roster CSVs without complex IT migrations.</p>
            </div>
          </div>
        </section>

        {/* COMPARISON TABLE */}
        <section className="marketing-section comparison-section" id="comparison">
          <div className="marketing-section-heading">
            <span>The right tool for the job</span>
            <h2>More than a folder. More private than social media.</h2>
            <p>Shared drives and social groups are generic products. Club PhotoHub is focused specifically on organization-owned identity and member photo sharing.</p>
          </div>
          <div className="comparison-wrap">
            <table>
              <thead>
                <tr>
                  <th>Capability</th>
                  <th>Club PhotoHub</th>
                  <th>Shared Drive</th>
                  <th>Private Facebook group</th>
                </tr>
              </thead>
              <tbody>
                {comparison.map(([label, ...values]) => (
                  <tr key={label}>
                    <th>{label}</th>
                    {values.map((value, index) => (
                      <td key={`${label}-${index}`}><Mark value={value} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="comparison-note">Comparison describes purpose-built product workflows, not a claim that other services are inherently insecure. Their exact capabilities depend on administrator settings.</p>
        </section>

        {/* PRIVACY & MOBILE CARD */}
        <section className="marketing-privacy marketing-section">
          <div className="marketing-privacy-copy">
            <span>Private by design</span>
            <h2>The organization decides who belongs.</h2>
            <p>Controlled membership replaces public discovery and follower-building.</p>
            <ul>
              <li><ShieldCheck size={18} /> A private photo hub for each club</li>
              <li><ShieldCheck size={18} /> New members confirm the email held by their club</li>
              <li><ShieldCheck size={18} /> Photos are shared only with approved members</li>
              <li><ShieldCheck size={18} /> Club information stays private and out of public searches</li>
            </ul>
          </div>
          <div className="marketing-phone-card">
            <div className="marketing-phone-top"><Smartphone size={18} /> Works on your phone today. iPhone and Android apps next.</div>
            <img className="marketing-real-phone-photo" src="./demo/lakeside-social.jpg" alt="Your Club members sharing a lakeside social" loading="lazy" decoding="async" />
            <div className="marketing-phone-caption">
              <strong>Every club moment, in your pocket</strong>
              <span>Dedicated iPhone and Android apps are also being developed.</span>
            </div>
          </div>
        </section>

        {/* PRICING PREVIEW */}
        <section className="pricing-section" id="pricing">
          <div className="pricing-container">
            <div className="pricing-copy">
              <span>Simple launch pricing</span>
              <h2>One plan. Every core feature.</h2>
              <p>Try the complete product for 30 days. No credit card and no cut-down trial.</p>
            </div>
            <div className="pricing-card">
              <div>
                <span>Club PhotoHub</span>
                <p><strong>$60</strong> / month</p>
                <small>or $600 billed annually, save $120</small>
              </div>
              <ul>
                <li><Check size={16} /> Unlimited members during launch</li>
                <li><Check size={16} /> 25 GB fair-use photo storage (~12,500 photos)</li>
                <li><Check size={16} /> Branded organization workspace</li>
                <li><Check size={16} /> Member verification and moderation</li>
                <li><Check size={16} /> Use promo code <code className="promo-code inline">FOUNDING20</code> for 20% off</li>
              </ul>
              <a href="/pricing">See plans and storage options <ArrowRight size={17} /></a>
              <small>30-day trial. No credit card required.</small>
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="marketing-final-cta">
          <div>
            <span>Start your organization trial</span>
            <h2>Give every moment a place to belong.</h2>
            <p>Create your workspace in minutes, or explore Your Club before you decide.</p>
          </div>
          <div className="final-actions">
            <a href="/app?onboard=club">Create workspace <ArrowRight size={18} /></a>
            <a href="/app?demo=1">View demo</a>
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
            <a href="/help/admin">Admin guide</a>
            <a href="/help/members">Member guide</a>
            <a href="/faq">FAQ</a>
            <a href="/privacy">Privacy</a>
            <a href="/terms">Terms</a>
          </div>
          <span>© {new Date().getFullYear()} xTide Apps</span>
        </div>
      </footer>
    </div>
  );
}
