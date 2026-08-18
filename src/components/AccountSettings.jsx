import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, Trash2, UserRound, CreditCard, CheckCircle2, ExternalLink } from 'lucide-react';

export default function AccountSettings({
  user,
  club,
  isAdmin,
  demoMode,
  subscriptionStatus = 'active',
  onDeleteAccount,
  onDeleteOrganization,
  addToast
}) {
  const [working, setWorking] = useState(false);

  const isActive = subscriptionStatus === 'active';

  const deleteAccount = async () => {
    if (demoMode) return addToast('Account settings are disabled in the public demo.', 'info');
    const phrase = window.prompt('This permanently deletes your account and the photos you uploaded. Type DELETE to continue.');
    if (phrase !== 'DELETE') return;
    setWorking(true);
    try { await onDeleteAccount(); } catch (error) { addToast(error.message, 'error'); setWorking(false); }
  };

  const deleteOrganization = async () => {
    if (demoMode) return addToast('Organization settings are disabled in the public demo.', 'info');
    const name = window.prompt(`This permanently deletes ${club.name}, its member directory, and every photo. Type the exact organization name to continue.`);
    if (name !== club.name) return name && addToast('The organization name did not match.', 'error');
    setWorking(true);
    try { await onDeleteOrganization(name); } catch (error) { addToast(error.message, 'error'); setWorking(false); }
  };

  return (
    <section className="account-settings animate-fade-in">
      <div className="account-heading">
        <span>Account & Subscription</span>
        <h1>Your Club PhotoHub Account</h1>
        <p>Manage your account identity, subscription status, and billing preferences.</p>
      </div>

      <div className="account-identity">
        <div><UserRound size={24} /></div>
        <span>
          <strong>{user.firstName} {user.lastName}</strong>
          <small>{isAdmin ? 'Organization administrator' : `Member ${user.memberNumber}`} · {club?.name || 'The Oakville Club'}</small>
        </span>
      </div>

      {/* Subscription & Billing Section */}
      <article className="account-card subscription-card" style={{ background: '#ffffff', border: '1px solid rgba(200, 167, 107, 0.4)', borderRadius: 'var(--radius-lg)', padding: '24px', marginBottom: '24px', boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: '#16a34a', width: '42px', height: '42px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <CreditCard size={22} />
            </div>
            <div>
              <h2 style={{ fontSize: '18px', margin: 0, color: 'var(--club-green-dark)', fontFamily: 'var(--font-serif)' }}>
                Subscription & Billing Management
              </h2>
              <span style={{ fontSize: '12px', color: 'var(--club-gray-dark)' }}>
                {club?.name || 'The Oakville Club'} Workspace Plan
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{
              fontSize: '11px',
              fontWeight: '800',
              letterSpacing: '0.05em',
              padding: '5px 12px',
              borderRadius: '20px',
              background: '#dcfce7',
              color: '#15803d',
              border: '1px solid #bbf7d0',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px'
            }}>
              <CheckCircle2 size={13} />
              ACTIVE SUBSCRIPTION
            </span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', padding: '16px', background: 'var(--club-cream)', borderRadius: 'var(--radius-md)', marginBottom: '20px' }}>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--club-gray-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', fontWeight: '700' }}>Current Plan</span>
            <strong style={{ fontSize: '15px', color: 'var(--club-green-dark)' }}>Club PhotoHub Base (Monthly)</strong>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--club-gray-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', fontWeight: '700' }}>Status</span>
            <strong style={{ fontSize: '15px', color: '#16a34a' }}>
              Active
            </strong>
          </div>
          <div>
            <span style={{ fontSize: '11px', color: 'var(--club-gray-dark)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', fontWeight: '700' }}>Next Renewal Date</span>
            <strong style={{ fontSize: '15px', color: 'var(--club-navy)' }}>September 17, 2026</strong>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ fontSize: '13px', color: 'var(--club-gray-dark)' }}>
            Your monthly subscription is active.
          </div>
          <div>
            <button
              type="button"
              className="btn-gold"
              onClick={() => {
                window.open('https://billing.stripe.com/p/login/5kQ4gz3FFbTH76IgC15Vu08', '_blank');
              }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 18px', fontSize: '13px', fontWeight: '700' }}
            >
              <ExternalLink size={14} /> Customer Billing Portal
            </button>
          </div>
        </div>
      </article>

      <article className="account-security">
        <ShieldCheck size={21} />
        <div>
          <h2>Protected account</h2>
          <p>Your session is private to this browser. Sign out on shared devices and never share email verification codes.</p>
        </div>
      </article>

      <article className="danger-zone">
        <div>
          <AlertTriangle size={21} />
          <span>
            <h2>{isAdmin ? 'Delete administrator account' : 'Delete my account'}</h2>
            <p>{isAdmin ? 'This is available when another active owner or administrator can retain the workspace.' : 'This removes your member account, likes, and every photo you uploaded.'}</p>
          </span>
        </div>
        <button disabled={working} onClick={deleteAccount}><Trash2 size={16} /> Delete account</button>
      </article>

      {isAdmin && (
        <article className="danger-zone organization-delete">
          <div>
            <AlertTriangle size={21} />
            <span>
              <h2>Delete organization workspace</h2>
              <p>Permanently removes the directory, administrators, photos, captions and activity. This cannot be undone.</p>
            </span>
          </div>
          <button disabled={working} onClick={deleteOrganization}><Trash2 size={16} /> Delete organization</button>
        </article>
      )}
    </section>
  );
}
