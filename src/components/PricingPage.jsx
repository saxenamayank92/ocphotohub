import React, { useEffect, useState } from 'react';
import { ArrowRight, Check, HardDrive, ShieldCheck, Sparkles, Tag } from 'lucide-react';
import { platformBrand } from '../brand';
import { createBillingCheckout, getBillingStatus } from '../api';
import './PricingPage.css';

const storageOptions = [
  { gb: 25, price: '$10', copy: '50 GB total storage (~25,000 photos)' },
  { gb: 50, price: '$18', copy: '75 GB total storage (~37,500 photos)' },
  { gb: 100, price: '$30', copy: '125 GB total storage (~62,500 photos)' }
];

function CheckoutButton({ children, secondary = false, disabled = false, onClick }) {
  return (
    <button type="button" className={`pricing-checkout-button ${secondary ? 'secondary' : ''}`} disabled={disabled} onClick={onClick}>
      {children} <ArrowRight size={16} />
    </button>
  );
}

const formatDate = value => value ? new Intl.DateTimeFormat(undefined, { month: 'long', day: 'numeric', year: 'numeric' }).format(new Date(value)) : '';

export default function PricingPage() {
  const [billingInterval, setBillingInterval] = useState('monthly');
  const [billing, setBilling] = useState({ loading: true, authenticated: false, owner: false, planStatus: '' });
  const [checkoutPending, setCheckoutPending] = useState('');
  const [billingError, setBillingError] = useState('');
  const isAnnual = billingInterval === 'annual';
  const activePlan = billing.planStatus === 'active';
  const activeTrial = billing.planStatus === 'trialing' && Date.parse(billing.trialEndsAt) > Date.now();

  useEffect(() => {
    getBillingStatus()
      .then(result => setBilling({ loading: false, ...result }))
      .catch(() => setBilling({ loading: false, authenticated: false, owner: false, planStatus: '' }));
  }, []);

  const beginCheckout = async details => {
    if (!billing.authenticated) {
      window.location.assign('/app');
      return;
    }
    setBillingError('');
    setCheckoutPending(details.type === 'storage' ? `storage-${details.gb}` : 'plan');
    try {
      const result = await createBillingCheckout(details);
      window.location.assign(result.url);
    } catch (error) {
      setBillingError(error.message);
      setCheckoutPending('');
    }
  };

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
              <strong>{isAnnual ? '$600' : '$60'}</strong> <span>{isAnnual ? '/ year' : '/ month'}</span>
            </p>
            <p className="pricing-plan-annual">{isAnnual ? 'One annual payment. No credit card required during the trial.' : 'Or $600 billed annually and save $120.'}</p>
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
            {!billing.authenticated && <a className="pricing-checkout-button" href="/app?onboard=club">Start 30-day free trial <ArrowRight size={16} /></a>}
            {activeTrial && <div className="pricing-account-status"><strong>Your free trial is active.</strong><span>It ends automatically on {formatDate(billing.trialEndsAt)}.</span></div>}
            {activePlan && <div className="pricing-account-status active"><strong>Your base plan is active.</strong><span>Storage add-ons can now be attached to this organization.</span></div>}
            {!billing.authenticated && <small>No credit card required. Choose a paid plan when the trial ends.</small>}
            <CheckoutButton secondary disabled={billing.loading || checkoutPending === 'plan' || activePlan || (billing.authenticated && !billing.owner)} onClick={() => beginCheckout({ type: 'plan', interval: billingInterval })}>
              {activePlan ? 'Current plan active' : checkoutPending === 'plan' ? 'Opening secure checkout…' : `Start ${isAnnual ? 'annual' : 'monthly'} plan`}
            </CheckoutButton>
            {billing.authenticated && !billing.owner && <small>Only an organization owner can start or change a plan.</small>}
            {billingError && <p className="pricing-billing-error" role="alert">{billingError}</p>}
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
                  <CheckoutButton
                    secondary
                    disabled={billing.loading || !billing.owner || !activePlan || Boolean(checkoutPending) || billing.hasStorageSubscription}
                    onClick={() => beginCheckout({ type: 'storage', gb: option.gb })}
                  >
                    {billing.storageAddonGb === option.gb ? 'Current add-on' : checkoutPending === `storage-${option.gb}` ? 'Opening checkout…' : 'Add storage'}
                  </CheckoutButton>
                </div>
              ))}
            </div>
            <small>{billing.hasStorageSubscription
              ? `Your +${billing.storageAddonGb} GB add-on is active and linked to this organization. Contact support to change or cancel it.`
              : activePlan
                ? 'Storage checkout is linked to this signed-in organization.'
                : 'Start a base plan before purchasing a storage add-on. Storage cannot be purchased by itself.'}</small>
          </article>
        </section>


        <section className="pricing-reassurance">
          <div><ShieldCheck size={22} /><span><strong>Private by design</strong><small>Every organization gets its own member gate and gallery.</small></span></div>
          <div><Check size={22} /><span><strong>Predictable pricing</strong><small>Annual billing saves two months compared with monthly billing.</small></span></div>
          <div><HardDrive size={22} /><span><strong>Fair-use storage</strong><small>25 GB is included before any optional expansion.</small></span></div>
        </section>

        <p className="pricing-support-note">Questions about a club plan? <a href="mailto:support@xtide.io">Contact support@xtide.io</a> or check our <a href="/faq">FAQ</a>.</p>
      </main>
    </div>
  );
}
