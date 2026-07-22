import React, { useState } from 'react';
import { AlertCircle, ArrowLeft, Building2, Check, KeyRound, Mail, ShieldCheck, User } from 'lucide-react';
import { platformBrand } from '../brand';

function Field({ id, label, icon: Icon, ...props }) {
  return <div className="form-group">
    <label htmlFor={id}>{label}</label>
    <div className="input-with-icon"><input id={id} className="input-field" {...props} />{Icon && <Icon size={18} />}</div>
  </div>;
}

export default function ClubOnboarding({ onStart, onComplete, onCancel }) {
  const [step, setStep] = useState(1);
  const [signupId, setSignupId] = useState('');
  const [clubName, setClubName] = useState('');
  const [shortName, setShortName] = useState('');
  const [organizationType, setOrganizationType] = useState('Private Club');
  const [logoUrl, setLogoUrl] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [working, setWorking] = useState(false);

  const beginVerification = async event => {
    event.preventDefault(); setError(''); setMessage('');
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter a valid administrator email.');
    setWorking(true);
    try {
      const result = await onStart({ clubName, shortName: shortName || clubName, organizationType, logoUrl, firstName, lastName, email });
      setSignupId(result.signupId); setMessage(result.message); setStep(2);
    } catch (requestError) { setError(requestError.message || 'We could not start club onboarding.'); }
    finally { setWorking(false); }
  };

  const finishOnboarding = async event => {
    event.preventDefault(); setError('');
    if (!/^\d{6}$/.test(code)) return setError('Enter the 6-digit code from your email.');
    if (password.length < 10) return setError('Use a password of at least 10 characters.');
    if (password !== confirmPassword) return setError('Passwords do not match.');
    setWorking(true);
    try { await onComplete({ signupId, code, password }); }
    catch (requestError) { setError(requestError.message || 'We could not create the club account.'); setWorking(false); }
  };

  return <div className="login-screen onboarding-screen"><div className="login-card onboarding-card">
    <div className="login-brand-lockup compact">
      <img src={platformBrand.mark} alt="" className="login-brand-mark" />
      <div><h1 className="login-brand-name">Create your club workspace</h1><p className="login-brand-tagline">A private PhotoHub owned by your club.</p></div>
    </div>

    <div className="onboarding-progress" aria-label={`Step ${step} of 3`}>
      {[['1', 'Club'], ['2', 'Verify'], ['3', 'Roster']].map(([number, label], index) => <div className={step > index ? 'active' : ''} key={number}>
        <span>{step > index + 1 ? <Check size={14} /> : number}</span><small>{label}</small>
      </div>)}
    </div>

    {error && <div className="login-error" role="alert"><AlertCircle size={16} /><span>{error}</span></div>}
    {message && <div className="login-info"><ShieldCheck size={16} /><span>{message}</span></div>}

    {step === 1 ? <form className="login-form onboarding-form" onSubmit={beginVerification}>
      <div className="onboarding-pilot-notice"><ShieldCheck size={18} /><span><strong>Start your 30-day free trial</strong><small>No credit card is required. Verify your administrator email to create your private workspace.</small></span></div>
      <div className="onboarding-section-heading"><span>Club details</span><p>This creates a completely separate workspace for your members and photos.</p></div>
      <div className="onboarding-two-column">
        <Field id="onboardClubName" label="Club name" icon={Building2} placeholder="Harbour Club" value={clubName} onChange={event => setClubName(event.target.value)} maxLength={80} required />
        <Field id="onboardShortName" label="Short name" icon={Building2} placeholder="Harbour" value={shortName} onChange={event => setShortName(event.target.value)} maxLength={40} />
      </div>
      <div className="form-group"><label htmlFor="onboardOrganizationType">Organization type</label><div className="input-with-icon"><select id="onboardOrganizationType" className="input-field" value={organizationType} onChange={event => setOrganizationType(event.target.value)} required><option>Private Club</option><option>Golf Club</option><option>Racquet Club</option><option>Yacht Club</option><option>Residential Community</option><option>Alumni Association</option><option>Hospitality Organization</option><option>Other Private Community</option></select><Building2 size={18} /></div></div>
      <Field id="onboardLogoUrl" label="Club logo URL (optional)" placeholder="https://yourclub.com/logo.png" type="url" value={logoUrl} onChange={event => setLogoUrl(event.target.value)} />
      <div className="onboarding-section-heading"><span>Primary administrator</span><p>This person becomes the verified owner of the club workspace.</p></div>
      <div className="onboarding-two-column">
        <Field id="onboardFirstName" label="First name" icon={User} value={firstName} onChange={event => setFirstName(event.target.value)} maxLength={50} required />
        <Field id="onboardLastName" label="Last name" icon={User} value={lastName} onChange={event => setLastName(event.target.value)} maxLength={50} required />
      </div>
      <Field id="onboardEmail" label="Work email" icon={Mail} type="email" placeholder="admin@yourclub.com" value={email} onChange={event => setEmail(event.target.value)} required />
      <button className="btn-primary login-btn" disabled={working}>{working ? 'Sending code…' : 'Verify administrator email'}</button>
    </form> : <form className="login-form onboarding-form" onSubmit={finishOnboarding}>
      <div className="onboarding-club-summary"><div className="tenant-brand-fallback"><Building2 size={22} /></div><span><strong>{clubName}</strong><small>Administrator: {firstName} {lastName} · {email}</small></span></div>
      <Field id="onboardCode" label="6-digit verification code" icon={ShieldCheck} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="000000" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ''))} required />
      <Field id="onboardPassword" label="Create administrator password" icon={KeyRound} type="password" placeholder="At least 10 characters" value={password} onChange={event => setPassword(event.target.value)} minLength={10} required />
      <Field id="onboardConfirmPassword" label="Confirm password" icon={KeyRound} type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} minLength={10} required />
      <button className="btn-gold login-btn" disabled={working}>{working ? 'Creating workspace…' : 'Start my 30-day free trial'}</button>
      <p className="onboarding-trial-note"><Check size={15} /> No credit card required. Full access for 30 days.</p>
      <button type="button" className="btn-text" onClick={() => { setStep(1); setCode(''); setPassword(''); setConfirmPassword(''); setMessage(''); }}>Change club details</button>
    </form>}

    <button type="button" className="onboarding-back" onClick={onCancel}><ArrowLeft size={16} /> Back to sign in</button>
  </div></div>;
}
