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
      <header>
        <span>{initials}</span>
        <div><strong>{name}</strong><small>Your Club · This week</small></div>
        <em>{category}</em>
      </header>
      <img src={image} alt={`${category} moment shared in the Your Club demo`} loading="lazy" decoding="async" />
      <div className="landing-demo-actions">
        <Heart size={21} /><strong>{likes}</strong><Download size={21} />
      </div>
      <p><strong>{name}</strong> {caption}</p>
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
          <a href="#solutions">Solutions</a>
          <a href="#comparison">Compare</a>
          <a href="#pricing">Pricing</a>
          <a href="/faq">FAQ</a>
        </nav>
        <a className="marketing-nav-cta" href="/app">Member sign in <ArrowRight size={16} /></a>
      </header>

      <main>
        {/* HERO SECTION */}
        <section className="marketing-hero">
          <div className="marketing-hero-copy">
            <div className="marketing-eyebrow"><ShieldCheck size={15} /> Private photo sharing for real communities</div>
            <h1>Your members. Your moments. Your PhotoHub.</h1>
            <p>Give every golf, yacht, country club or community a private, beautifully branded place to collect and enjoy member memories — without public social media or messy shared folders.</p>
            <div className="marketing-hero-actions">
              <a className="marketing-primary-cta" href="/app?onboard=club">Create workspace <ArrowRight size={18} /></a>
              <a className="marketing-secondary-cta" href="/app?demo=1">Explore live demo</a>
            </div>
            <div className="marketing-trust-row">
              <span><Check size={15} /> No credit card</span>
              <span><Check size={15} /> 25 GB included</span>
              <span><Check size={15} /> Simple pricing</span>
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
        </section>

        {/* HOW IT WORKS */}
        <section className="marketing-how" id="how-it-works">
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
      </footer>
    </div>
  );
}
