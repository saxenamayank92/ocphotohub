import React, { useState } from 'react';
import { ArrowRight, Check, HardDrive, ShieldCheck, Sparkles, Tag } from 'lucide-react';
import { platformBrand } from '../brand';
import './PricingPage.css';

const monthlyLink = import.meta.env.VITE_STRIPE_MONTHLY_LINK || '';
const annualLink = import.meta.env.VITE_STRIPE_ANNUAL_LINK || '';
const storageLinks = {
  25: import.meta.env.VITE_STRIPE_STORAGE_25_MONTHLY_LINK || '',
  50: import.meta.env.VITE_STRIPE_STORAGE_50_MONTHLY_LINK || '',
  100: import.meta.env.VITE_STRIPE_STORAGE_100_MONTHLY_LINK || ''
};

const storageOptions = [
  { gb: 25, price: '$10', copy: '50 GB total storage (~25,000 photos)' },
  { gb: 50, price: '$18', copy: '75 GB total storage (~37,500 photos)' },
  { gb: 100, price: '$30', copy: '125 GB total storage (~62,500 photos)' }
];

function CheckoutButton({ href, children, secondary = false }) {
  return (
    <a className={`pricing-checkout-button ${secondary ? 'secondary' : ''}`} href={href || '#pricing-links'}>
      {children} <ArrowRight size={16} />
    </a>
  );
}

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState('monthly');
  const isAnnual = billingInterval === 'annual';

  return (
    <div className="pricing-page">
      <header className="marketing-nav pricing-marketing-nav">
        <a className="marketing-brand" href="/" aria-label="Club PhotoHub home">
          <img src={platformBrand.mark} alt="" width="32" height="32" />
          <span>{platformBrand.name}</span>
        </a>
        <nav className="marketing-nav-links" aria-label="Main navigation">
          <a href="/#features">Features</a>
          <a href="/#solutions">Solutions</a>
          <a href="/#comparison">Compare</a>
          <a className="active" href="/pricing" aria-current="page">Pricing</a>
          <a href="/faq">FAQ</a>
        </nav>
        <a className="marketing-nav-cta" href="/app">Member sign in <ArrowRight size={16} /></a>
      </header>

      <main>
        <section className="pricing-hero">
          <span className="pricing-eyebrow"><Sparkles size={15} /> Simple pricing for private communities</span>
          <h1>Give your club a home for its moments.</h1>
          <p>Start with the complete Club PhotoHub experience for 30 days. No credit card required, no public social profile, and no surprise member fees.</p>

          <div className="pricing-founding-callout">
            <Tag size={16} />
            <span>Founding Club Offer: Save 20% on monthly or annual base plans with promo code <strong className="promo-code">FOUNDING20</strong></span>
          </div>
        </section>

        <section className="pricing-plan-grid" id="pricing-links">
          <article className="pricing-plan-card featured">
            <div className="pricing-plan-label">Launch plan</div>
            <h2>Club PhotoHub Base</h2>
            <div className="pricing-billing-toggle" role="group" aria-label="Billing interval">
              <button type="button" className={!isAnnual ? 'active' : ''} onClick={() => setBillingInterval('monthly')}>Monthly</button>
              <button type="button" className={isAnnual ? 'active' : ''} onClick={() => setBillingInterval('annual')}>Annual <span>save 2 months</span></button>
            </div>
            <p className="pricing-plan-price">
              <strong>{isAnnual ? '$600' : '$60'}</strong> CAD <span>{isAnnual ? '/ year' : '/ month'}</span>
            </p>
            <p className="pricing-plan-annual">{isAnnual ? 'One annual payment. No credit card required during the trial.' : 'Or $600 CAD billed annually and save $120.'}</p>
            <ul>
              {[
                '25 GB photo storage (~12,500 high-res photos)',
                'Unlimited members during launch',
                'Branded organization workspace',
                'Roster verification and email signup',
                'Moderation, likes and downloads',
                '20% Founding Club discount with FOUNDING20'
              ].map(item => <li key={item}><Check size={16} /> {item}</li>)}
            </ul>
            <a className="pricing-checkout-button" href="/app?onboard=club">Start 30-day free trial <ArrowRight size={16} /></a>
            <small>No credit card required. Choose a paid plan when the trial ends.</small>
            {(monthlyLink || annualLink) && <CheckoutButton href={isAnnual ? annualLink : monthlyLink} secondary>{isAnnual ? 'Activate annual plan' : 'Activate monthly plan'}</CheckoutButton>}
          </article>

          <article className="pricing-plan-card pricing-storage-card">
            <div className="pricing-plan-label"><HardDrive size={15} /> Storage add-ons</div>
            <h2>Room for more memories</h2>
            <p>Keep your base plan simple and add storage only when your club needs it. Storage add-ons are billed monthly, regardless of base plan billing interval.</p>
            <div className="storage-option-list">
              {storageOptions.map(option => (
                <div className="storage-option" key={option.gb}>
                  <div><strong>+{option.gb} GB</strong><span>{option.copy}</span></div>
                  <div className="storage-option-price"><strong>{option.price}</strong><span>/ month</span><small>monthly add-on</small></div>
                  <CheckoutButton href={storageLinks[option.gb]} secondary>Add storage</CheckoutButton>
                </div>
              ))}
            </div>
            <small>Storage upgrades are organization-owner controls. Existing photos remain available if a trial ends.</small>
          </article>
        </section>


        <section className="pricing-reassurance">
          <div><ShieldCheck size={22} /><span><strong>Private by design</strong><small>Every organization gets its own member gate and gallery.</small></span></div>
          <div><Check size={22} /><span><strong>Predictable CAD pricing</strong><small>Annual billing saves two months compared with monthly billing.</small></span></div>
          <div><HardDrive size={22} /><span><strong>Fair-use storage</strong><small>25 GB is included before any optional expansion.</small></span></div>
        </section>

        <p className="pricing-support-note">Questions about a club plan? <a href="mailto:support@xtide.io">Contact support@xtide.io</a> or check our <a href="/faq">FAQ</a>.</p>
      </main>
    </div>
  );
}
