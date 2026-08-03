import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Check, HardDrive, ShieldCheck, Sparkles } from 'lucide-react';
import { platformBrand } from '../brand';
import './PricingPage.css';

const monthlyLink = import.meta.env.VITE_STRIPE_MONTHLY_LINK || '';
const annualLink = import.meta.env.VITE_STRIPE_ANNUAL_LINK || '';
const storageLinks = {
  monthly: {
    25: import.meta.env.VITE_STRIPE_STORAGE_25_MONTHLY_LINK || '',
    50: import.meta.env.VITE_STRIPE_STORAGE_50_MONTHLY_LINK || '',
    100: import.meta.env.VITE_STRIPE_STORAGE_100_MONTHLY_LINK || ''
  },
  annual: {
    25: import.meta.env.VITE_STRIPE_STORAGE_25_ANNUAL_LINK || '',
    50: import.meta.env.VITE_STRIPE_STORAGE_50_ANNUAL_LINK || '',
    100: import.meta.env.VITE_STRIPE_STORAGE_100_ANNUAL_LINK || ''
  }
};

const storageOptions = [
  { gb: 25, price: '$10', annual: '$100', copy: '50 GB total storage' },
  { gb: 50, price: '$18', annual: '$180', copy: '75 GB total storage' },
  { gb: 100, price: '$30', annual: '$300', copy: '125 GB total storage' }
];

function CheckoutButton({ href, children, secondary = false }) {
  return <a className={`pricing-checkout-button ${secondary ? 'secondary' : ''}`} href={href || '#pricing-links'}>
    {children} <ArrowRight size={16} />
  </a>;
}

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState('monthly');
  const isAnnual = billingInterval === 'annual';

  return <div className="pricing-page">
    <header className="pricing-nav">
      <a className="marketing-brand" href="/" aria-label="Club PhotoHub home"><img src={platformBrand.mark} alt="" /><span>{platformBrand.name}</span></a>
      <a href="/"><ArrowLeft size={16} /> Back to home</a>
    </header>

    <main>
      <section className="pricing-hero">
        <span className="pricing-eyebrow"><Sparkles size={15} /> Simple pricing for private communities</span>
        <h1>Give your club a home for its moments.</h1>
        <p>Start with the complete Club PhotoHub experience for 30 days. No credit card required, no public social profile and no surprise member fees.</p>
      </section>

      <section className="pricing-plan-grid" id="pricing-links">
        <article className="pricing-plan-card featured">
          <div className="pricing-plan-label">Launch plan</div>
          <h2>Club PhotoHub</h2>
          <div className="pricing-billing-toggle" role="group" aria-label="Billing interval">
            <button type="button" className={!isAnnual ? 'active' : ''} onClick={() => setBillingInterval('monthly')}>Monthly</button>
            <button type="button" className={isAnnual ? 'active' : ''} onClick={() => setBillingInterval('annual')}>Annual <span>save 2 months</span></button>
          </div>
          <p className="pricing-plan-price"><strong>{isAnnual ? '$600' : '$60'}</strong> CAD <span>{isAnnual ? '/ year' : '/ month'}</span></p>
          <p className="pricing-plan-annual">{isAnnual ? 'One annual payment. No credit card required during the trial.' : 'Or $600 CAD billed annually and save $120.'}</p>
          <ul>{['25 GB photo storage', 'Unlimited members during launch', 'Branded club workspace', 'Roster verification and email signup', 'Moderation, likes and downloads'].map(item => <li key={item}><Check size={16} /> {item}</li>)}</ul>
          <CheckoutButton href={isAnnual ? annualLink : monthlyLink}>{isAnnual ? 'Choose annual' : 'Choose monthly'}</CheckoutButton>
          <small>30-day free trial. No credit card required.</small>
        </article>

        <article className="pricing-plan-card pricing-storage-card">
          <div className="pricing-plan-label"><HardDrive size={15} /> Storage add-ons</div>
          <h2>Room for more memories</h2>
          <p>Keep your base plan simple and add storage only when your club needs it. Add-ons renew with your subscription.</p>
          <div className="storage-option-list">
            {storageOptions.map(option => <div className="storage-option" key={option.gb}>
              <div><strong>+{option.gb} GB</strong><span>{option.copy}</span></div>
              <div className="storage-option-price"><strong>{isAnnual ? option.annual : option.price}</strong><span>/ {isAnnual ? 'year' : 'month'}</span><small>{isAnnual ? 'annual billing' : `${option.annual}/ year`}</small></div>
              <CheckoutButton href={storageLinks[billingInterval][option.gb]} secondary>Add storage</CheckoutButton>
            </div>)}
          </div>
          <small>Storage upgrades are organization-owner controls. Existing photos remain available if a trial ends.</small>
        </article>
      </section>

      <section className="pricing-reassurance">
        <div><ShieldCheck size={22} /><span><strong>Private by design</strong><small>Every organization gets its own member gate and gallery.</small></span></div>
        <div><Check size={22} /><span><strong>Predictable CAD pricing</strong><small>Annual billing saves two months compared with monthly billing.</small></span></div>
        <div><HardDrive size={22} /><span><strong>Fair-use storage</strong><small>25 GB is included before any optional expansion.</small></span></div>
      </section>

      <p className="pricing-support-note">Questions about a club plan? <a href="mailto:support@xtide.io">Contact support@xtide.io</a>.</p>
    </main>
  </div>;
}
