import React from 'react';
import { ArrowRight, CheckCircle2, Download, HardDrive, Lock, ShieldCheck, Server } from 'lucide-react';
import { platformBrand } from '../brand';

const securityControls = [
  {
    icon: Server,
    title: 'Cloud Infrastructure & Hosting',
    items: [
      'Hosted on Cloudflare Workers edge network across 275+ global data centers.',
      'Strict TLS 1.3 encryption in transit for all browser and API requests.',
      'DDoS mitigation and web application firewall (WAF) enabled by default.'
    ]
  },
  {
    icon: HardDrive,
    title: 'Data Storage & Encryption',
    items: [
      'Database: Cloudflare D1 distributed SQL with encrypted data stores.',
      'Photo Storage: Cloudflare R2 Object Storage with AES-256 encryption at rest.',
      'Passwords hashed with unique cryptographic salts (SHA-256 / PBKDF2).'
    ]
  },
  {
    icon: Lock,
    title: 'Tenant Isolation & Privacy',
    items: [
      'Complete workspace isolation: photos and rosters cannot cross club boundaries.',
      'No public member profiles or search engine indexing (`noindex, nofollow`).',
      'Roster-verified signup: Only recognized emails in your club directory can join.'
    ]
  },
  {
    icon: ShieldCheck,
    title: 'Administrative Controls',
    items: [
      'Role-based access: Separate permissions for Club Owners, Staff Admins, and Members.',
      'Photo moderation panel allowing instant deletion or caption updates by staff.',
      'Full data export and complete workspace deletion controls upon cancellation.'
    ]
  }
];

export default function SecurityPage() {
  return (
    <div className="marketing-page security-page-container">
      <header className="marketing-nav">
        <a className="marketing-brand" href="/" aria-label="Club PhotoHub home">
          <img src={platformBrand.mark} alt="" width="32" height="32" />
          <span>{platformBrand.name}</span>
        </a>
        <nav className="marketing-nav-links" aria-label="Main navigation">
          <a href="/#features">Features</a>
          <a href="/book-demo">Book Demo</a>
          <a href="/pricing">Pricing</a>
          <a href="/founding-clubs">Founding Pilot</a>
          <a className="active" href="/security">Security</a>
        </nav>
        <a className="marketing-nav-cta" href="/app">Member sign in <ArrowRight size={16} /></a>
      </header>

      <main className="security-page-main">
        <section className="security-hero">
          <span className="pricing-eyebrow"><ShieldCheck size={15} /> Verified Infrastructure Controls</span>
          <h1>Trust, Security & Data Protection</h1>
          <p>
            Private club photography requires strict member privacy and organization ownership. Here is how Club PhotoHub protects your club's memories and member information.
          </p>
        </section>

        <section className="security-grid">
          {securityControls.map(({ icon: Icon, title, items }) => (
            <div className="security-card" key={title}>
              <div className="security-card-header">
                <div className="security-card-icon"><Icon size={22} /></div>
                <h2>{title}</h2>
              </div>
              <ul>
                {items.map((item, idx) => (
                  <li key={idx}>
                    <CheckCircle2 size={16} className="security-check" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>

        <section className="security-download-section">
          <div className="security-download-card">
            <div>
              <h3>Need a Security Overview for your Board or IT Reviewer?</h3>
              <p>Download our technical architecture overview covering subprocessors, encryption, and data retention rules.</p>
            </div>
            <a className="marketing-primary-cta" href="/help/admin" style={{ flexShrink: 0 }}>
              <Download size={16} /> Read Admin Guide & Security Overview
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
