import React, { useState } from 'react';
import { AlertCircle, Building2, KeyRound, Lock, Mail, ShieldCheck, User } from 'lucide-react';
import { platformBrand } from '../brand';

function LoginBrand({ compact = false }) {
  return <div className={`login-brand-lockup ${compact ? 'compact' : ''}`}>
    <img src={platformBrand.mark} alt="" className="login-brand-mark" />
    <div><h1 className="login-brand-name">{platformBrand.name}</h1><p className="login-brand-tagline">{platformBrand.tagline}</p></div>
  </div>;
}

function ClubPicker({ clubs, clubId, setClubId, disabled = false }) {
  return <div className="form-group">
    <label htmlFor="clubId">Your club</label>
    <div className="input-with-icon">
      <select id="clubId" className="input-field" value={clubId} onChange={event => setClubId(event.target.value)} disabled={disabled} required>
        <option value="">Choose your club</option>
        {clubs.map(club => <option key={club.id} value={club.id}>{club.name}</option>)}
      </select>
      <Building2 size={18} />
    </div>
  </div>;
}

function Field({ id, label, icon: Icon, ...props }) {
  return <div className="form-group">
    <label htmlFor={id}>{label}</label>
    <div className="input-with-icon"><input id={id} className="input-field" {...props} />{Icon && <Icon size={18} />}</div>
  </div>;
}

export default function Login({
  clubs = [], members, onLoginSuccess, onCloudLogin, onCloudCheckMember,
  onCloudRequestRegistrationCode, onCloudRegister, onRequestPasswordReset,
  onCompletePasswordReset, onRequestAdminPasswordReset, onCompleteAdminPasswordReset,
  onRegisterPassword, onCreateClub, firebaseEnabled, directClubId = null
}) {
  const [clubId, setClubId] = useState(directClubId || '');
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [lastName, setLastName] = useState('');
  const [memberNumber, setMemberNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registeredMember, setRegisteredMember] = useState(null);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [adminResetMode, setAdminResetMode] = useState(() => Boolean(new URLSearchParams(window.location.search).get('adminReset')));
  const [resetMode, setResetMode] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return Boolean(params.get('reset') || params.get('adminReset'));
  });
  const [resetMessage, setResetMessage] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const selectedClub = clubs.find(club => club.id === clubId);
  const resetParams = new URLSearchParams(window.location.search);
  const resetToken = resetParams.get(adminResetMode ? 'adminReset' : 'reset');

  const clearMessages = () => { setError(''); setInfoMessage(''); };
  const resetMemberFlow = () => {
    setShowPassword(false); setIsRegistering(false); setRegisteredMember(null);
    setPassword(''); setEmail(''); setCode(''); setCodeSent(false); setNewPassword(''); setConfirmPassword(''); clearMessages();
  };

  const handleMemberSubmit = async event => {
    event.preventDefault(); clearMessages();
    if (!clubId || !lastName || !memberNumber) return setError('Choose your club, then enter your last name and member number.');
    if (firebaseEnabled) {
      if (!showPassword) {
        try {
          const result = await onCloudCheckMember({ clubId, lastName: lastName.trim(), memberNumber: memberNumber.trim() });
          if (result.registered) { setShowPassword(true); setInfoMessage('Membership verified. Enter your password.'); }
          else { setRegisteredMember({ lastName: lastName.trim(), memberNumber: memberNumber.trim() }); setIsRegistering(true); setInfoMessage('Membership verified. Now confirm the email address held by your club.'); }
        } catch (cloudError) { setError(cloudError.message || 'Invalid membership details.'); }
        return;
      }
      if (!password) return setError('Enter your password.');
      try { await onCloudLogin({ mode: 'member', clubId, lastName: lastName.trim(), memberNumber: memberNumber.trim(), password }); }
      catch (cloudError) {
        if (cloudError.code === 'NEEDS_REGISTRATION') { setRegisteredMember({ lastName: lastName.trim(), memberNumber: memberNumber.trim() }); setIsRegistering(true); return; }
        setError(cloudError.message || 'Invalid credentials.');
      }
      return;
    }
    const member = members.find(item => item.memberNumber.trim() === memberNumber.trim());
    if (!member || member.lastName.toLowerCase().trim() !== lastName.toLowerCase().trim()) return setError('Membership details do not match.');
    if (!member.password) { setRegisteredMember(member); setIsRegistering(true); return; }
    if (!showPassword) { setShowPassword(true); return; }
    if (member.password !== password) return setError('Incorrect password.');
    onLoginSuccess(member, false);
  };

  const handleSendCode = async () => {
    clearMessages();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError('Enter the email address registered with your club.');
    try {
      const result = await onCloudRequestRegistrationCode({ clubId, lastName, memberNumber, email });
      setCodeSent(true); setInfoMessage(result.message);
    } catch (cloudError) { setError(cloudError.message || 'We could not verify that roster email.'); }
  };

  const handleRegisterSubmit = async event => {
    event.preventDefault(); clearMessages();
    if (newPassword.length < (firebaseEnabled ? 10 : 6)) return setError(`Password must be at least ${firebaseEnabled ? 10 : 6} characters.`);
    if (newPassword !== confirmPassword) return setError('Passwords do not match.');
    if (firebaseEnabled) {
      if (!codeSent || !/^\d{6}$/.test(code)) return setError('Enter the 6-digit code sent to your roster email.');
      try {
        const result = await onCloudRegister({ clubId, lastName, memberNumber, email, code, password: newPassword });
        onLoginSuccess(result.user, result.role === 'admin');
      } catch (cloudError) { setError(cloudError.message || 'Registration could not be completed.'); }
      return;
    }
    onRegisterPassword(registeredMember.memberNumber, newPassword);
    onLoginSuccess({ ...registeredMember, password: newPassword }, false);
  };

  const handleAdminSubmit = async event => {
    event.preventDefault(); clearMessages();
    if (!clubId || !adminEmail || !adminPassword) return setError('Choose a club and enter both admin credentials.');
    if (firebaseEnabled) {
      try { await onCloudLogin({ mode: 'admin', clubId, email: adminEmail.trim(), password: adminPassword }); }
      catch (cloudError) { setError(cloudError.message || 'Invalid credentials.'); }
    } else if ((adminEmail === 'admin' || adminEmail === 'admin@example.com') && adminPassword === '1907') {
      onLoginSuccess({ firstName: 'Club', lastName: 'Management', memberNumber: 'admin' }, true);
    } else setError('Invalid offline admin credentials.');
  };

  const handleResetRequest = async event => {
    event.preventDefault(); setError('');
    if (!clubId) return setError('Choose your club.');
    try {
      const result = adminResetMode
        ? await onRequestAdminPasswordReset({ clubId, email: adminEmail })
        : await onRequestPasswordReset({ clubId, lastName, memberNumber });
      setResetMessage(result.message);
    }
    catch (resetError) { setResetMessage(resetError.message || 'If your details are registered, a reset email will be sent.'); }
  };

  const handleResetComplete = async event => {
    event.preventDefault(); setError('');
    if (newPassword.length < 10 || newPassword !== confirmPassword) return setError('Use a matching password of at least 10 characters.');
    try {
      if (adminResetMode) await onCompleteAdminPasswordReset({ token: resetToken, password: newPassword });
      else await onCompletePasswordReset({ token: resetToken, password: newPassword });
      window.history.replaceState({}, '', window.location.pathname); setResetMode(false); setAdminResetMode(false); setResetMessage('Password reset successfully. You can now sign in.'); setNewPassword(''); setConfirmPassword('');
    } catch (resetError) { setError(resetError.message || 'This reset link is invalid or expired.'); }
  };

  if (resetMode) return <div className="login-screen"><div className="login-card">
    <LoginBrand compact /><h2 className="login-section-title">Reset your {adminResetMode ? 'administrator ' : ''}password</h2>
    {error && <div className="login-error" role="alert"><AlertCircle size={16} /><span>{error}</span></div>}
    {resetMessage && <div className="login-info"><ShieldCheck size={16} /><span>{resetMessage}</span></div>}
    {resetToken ? <form className="login-form" onSubmit={handleResetComplete}>
      <Field id="resetPassword" label="New password" type="password" value={newPassword} onChange={event => setNewPassword(event.target.value)} minLength={10} required />
      <Field id="resetConfirmPassword" label="Confirm password" type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} minLength={10} required />
      <button className="btn-primary login-btn">Set new password</button>
    </form> : <form className="login-form" onSubmit={handleResetRequest}>
      <ClubPicker clubs={clubs} clubId={clubId} setClubId={setClubId} disabled={Boolean(directClubId)} />
      {adminResetMode
        ? <Field id="resetAdminEmail" label="Administrator email" type="email" icon={Mail} value={adminEmail} onChange={event => setAdminEmail(event.target.value)} required />
        : <><Field id="resetMemberNumber" label="Member number" value={memberNumber} onChange={event => setMemberNumber(event.target.value)} required /><Field id="resetLastName" label="Last name" value={lastName} onChange={event => setLastName(event.target.value)} required /></>}
      <button className="btn-primary login-btn">Email reset link</button><button type="button" className="btn-text" onClick={() => { setResetMode(false); setAdminResetMode(false); }}>Back to sign in</button>
    </form>}
  </div></div>;

  return <div className="login-screen"><div className="login-card">
    <LoginBrand />
    {selectedClub && <div className="tenant-brand-card">
      {selectedClub.logoUrl ? <img src={selectedClub.logoUrl} alt="" className="tenant-brand-logo" /> : <div className="tenant-brand-fallback"><Building2 size={22} /></div>}
      <div><span>Private gallery for</span><strong>{selectedClub.name}</strong></div>
    </div>}
    <p className="login-context-label">{isAdminMode ? 'Club administration' : isRegistering ? 'Secure first-time setup' : 'Member access'}</p>
    {error && <div className="login-error" role="alert"><AlertCircle size={16} /><span>{error}</span></div>}
    {infoMessage && <div className="login-info"><ShieldCheck size={16} /><span>{infoMessage}</span></div>}

    {!isAdminMode && isRegistering ? <form className="login-form" onSubmit={handleRegisterSubmit}>
      <ClubPicker clubs={clubs} clubId={clubId} setClubId={setClubId} disabled />
      <div className="verified-member-summary"><ShieldCheck size={18} /><span>Member #{registeredMember?.memberNumber} · {registeredMember?.lastName}</span></div>
      {firebaseEnabled && <>
        <Field id="registrationEmail" label="Email registered with your club" icon={Mail} type="email" placeholder="you@example.com" value={email} onChange={event => { setEmail(event.target.value); setCodeSent(false); }} disabled={codeSent} required />
        {!codeSent && <button type="button" className="btn-secondary login-btn" onClick={handleSendCode}>Send verification code</button>}
        {codeSent && <Field id="verificationCode" label="6-digit verification code" icon={ShieldCheck} inputMode="numeric" pattern="[0-9]{6}" maxLength={6} placeholder="000000" value={code} onChange={event => setCode(event.target.value.replace(/\D/g, ''))} required />}
      </>}
      {(!firebaseEnabled || codeSent) && <>
        <Field id="newPassword" label="Create password" icon={KeyRound} type="password" placeholder="At least 10 characters" value={newPassword} onChange={event => setNewPassword(event.target.value)} required />
        <Field id="confirmPassword" label="Confirm password" icon={KeyRound} type="password" placeholder="Repeat your password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required />
        <button className="btn-gold login-btn">Create account & sign in</button>
      </>}
      <button type="button" className="btn-text" onClick={resetMemberFlow}>Back to sign in</button>
    </form> : !isAdminMode ? <form className="login-form" onSubmit={handleMemberSubmit}>
      <ClubPicker clubs={clubs} clubId={clubId} setClubId={value => { setClubId(value); resetMemberFlow(); }} disabled={showPassword || Boolean(directClubId)} />
      <Field id="memberNumber" label="Member number" icon={User} placeholder="e.g. 1001" value={memberNumber} onChange={event => { setMemberNumber(event.target.value); setShowPassword(false); }} disabled={showPassword} required />
      <Field id="lastName" label="Last name" icon={User} placeholder="e.g. Smith" value={lastName} onChange={event => { setLastName(event.target.value); setShowPassword(false); }} disabled={showPassword} required />
      {showPassword && <Field id="password" label="Password" icon={Lock} type="password" placeholder="Enter your password" value={password} onChange={event => setPassword(event.target.value)} autoFocus required />}
      <button className="btn-primary login-btn">{showPassword ? 'Sign in' : 'Continue'}</button>
      {showPassword && <><button type="button" className="btn-text" onClick={() => { setAdminResetMode(false); setResetMode(true); }}>Forgot password?</button><button type="button" className="btn-text" onClick={resetMemberFlow}>Use different details</button></>}
    </form> : <form className="login-form" onSubmit={handleAdminSubmit}>
      <ClubPicker clubs={clubs} clubId={clubId} setClubId={setClubId} disabled={Boolean(directClubId)} />
      <Field id="adminEmail" label="Admin email" icon={User} type="email" placeholder="admin@yourclub.com" value={adminEmail} onChange={event => setAdminEmail(event.target.value)} required />
      <Field id="adminPassword" label="Password" icon={Lock} type="password" value={adminPassword} onChange={event => setAdminPassword(event.target.value)} required />
      <button className="btn-gold login-btn">Open admin portal</button>
      {firebaseEnabled && <button type="button" className="btn-text" onClick={() => { setAdminResetMode(true); setResetMode(true); setError(''); }}>Forgot administrator password?</button>}
    </form>}
    <div className="admin-toggle-link"><button onClick={() => { setIsAdminMode(value => !value); resetMemberFlow(); }}>{isAdminMode ? '← Back to member access' : 'Access admin portal →'}</button></div>
    {firebaseEnabled && !directClubId && <div className="club-signup-link"><span>Represent a club or organization?</span><button type="button" onClick={onCreateClub}>Create your workspace</button></div>}
  </div></div>;
}
