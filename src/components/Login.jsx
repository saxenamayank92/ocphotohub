import React, { useState } from 'react';
import { Lock, User, KeyRound, ShieldCheck, AlertCircle } from 'lucide-react';

export default function Login({ members, onLoginSuccess, onCloudLogin, onCloudCheckMember, onCloudRegister, onRequestPasswordReset, onCompletePasswordReset, onRegisterPassword, firebaseEnabled }) {
  const [isAdminMode, setIsAdminMode] = useState(false);

  // Member fields
  const [lastName, setLastName] = useState('');
  const [memberNumber, setMemberNumber] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Registration fields (for first-time setup)
  const [isRegistering, setIsRegistering] = useState(false);
  const [registeredMember, setRegisteredMember] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [resetMode, setResetMode] = useState(() => Boolean(new URLSearchParams(window.location.search).get('reset')));
  const [resetMessage, setResetMessage] = useState('');

  // Admin fields
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  const [error, setError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');

  const handleMemberSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfoMessage('');

    if (firebaseEnabled) {
      if (!lastName || !memberNumber) {
        setError('Enter your last name and member number.');
        return;
      }
      if (!showPassword) {
        try {
          const result = await onCloudCheckMember({ lastName: lastName.trim(), memberNumber: memberNumber.trim() });
          if (result.registered) {
            setShowPassword(true);
            setInfoMessage('Membership verified. Enter your password.');
          } else {
            setRegisteredMember({ firstName: '', lastName: lastName.trim(), memberNumber: memberNumber.trim() });
            setIsRegistering(true);
            setInfoMessage('Membership verified. Create your account with an email address and password.');
          }
        } catch (cloudError) {
          setError(cloudError.message || 'Invalid membership details.');
        }
        return;
      }
      if (!password) {
        setError('Enter your password.');
        return;
      }
      try {
        await onCloudLogin({ mode: 'member', lastName: lastName.trim(), memberNumber: memberNumber.trim(), password });
      } catch (cloudError) {
        if (cloudError.code === 'NEEDS_REGISTRATION') {
          setRegisteredMember({ firstName: '', lastName: lastName.trim(), memberNumber: memberNumber.trim() });
          setIsRegistering(true);
          setInfoMessage('Create your account with an email address and password.');
          return;
        }
        setError(cloudError.message || 'Invalid credentials.');
      }
      return;
    }

    if (!lastName || !memberNumber) {
      setError('Please fill in both Last Name and Member Number.');
      return;
    }

    // Find member by number
    const member = members.find(
      m => m.memberNumber.trim() === memberNumber.trim()
    );

    if (!member) {
      setError('No member profile found with that Member Number.');
      return;
    }

    // Check last name matching (case insensitive)
    if (member.lastName.toLowerCase().trim() !== lastName.toLowerCase().trim()) {
      setError('Last name does not match the member profile.');
      return;
    }

    // Check if member password is set
    if (!member.password) {
      // First-time login: show registration interface
      setIsRegistering(true);
      setRegisteredMember(member);
      setInfoMessage('Welcome to the hub! Since this is your first visit, please create a secure password.');
      return;
    }

    // If password is set, verify it
    if (!password) {
      setError('Please enter your password.');
      return;
    }

    if (member.password !== password) {
      setError('Incorrect password. Please try again.');
      return;
    }

    // Success! Log the member in
    onLoginSuccess(member, false);
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (firebaseEnabled && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Enter a valid email address.');
      return;
    }

    if (newPassword.length < (firebaseEnabled ? 10 : 6)) {
      setError(`Password must be at least ${firebaseEnabled ? 10 : 6} characters long.`);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (firebaseEnabled) {
      try {
        const result = await onCloudRegister({ lastName, memberNumber, email, password: newPassword });
        onLoginSuccess(result.user, result.role === 'admin');
      } catch (cloudError) {
        setError(cloudError.message || 'Registration could not be completed.');
      }
      return;
    }

    // Save password
    onRegisterPassword(registeredMember.memberNumber, newPassword);

    // Log in
    const updatedMember = { ...registeredMember, password: newPassword };
    onLoginSuccess(updatedMember, false);
  };

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!adminEmail || !adminPassword) {
      setError('Please enter both email and password.');
      return;
    }

    if (firebaseEnabled) {
      try {
        await onCloudLogin({ mode: 'admin', email: adminEmail.trim(), password: adminPassword });
      } catch (cloudError) {
        setError(cloudError.message || 'Invalid credentials.');
      }
      return;
    }

    // Default local admin configuration
    if (!firebaseEnabled) {
      if (
        (adminEmail === 'admin@oakville.com' || adminEmail === 'admin') &&
        adminPassword === '1907'
      ) {
        onLoginSuccess({ firstName: 'Club', lastName: 'Management', memberNumber: 'admin' }, true);
      } else {
        setError('Invalid admin credentials. Use PIN "1907" for offline testing.');
      }
    }
  };

  const toggleMode = () => {
    setIsAdminMode(!isAdminMode);
    setIsRegistering(false);
    setRegisteredMember(null);
    setLastName('');
    setMemberNumber('');
    setPassword('');
    setAdminEmail('');
    setAdminPassword('');
    setEmail('');
    setShowPassword(false);
    setError('');
    setInfoMessage('');
  };

  const resetToken = new URLSearchParams(window.location.search).get('reset');
  const handleResetRequest = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const result = await onRequestPasswordReset({ lastName, memberNumber });
      setResetMessage(result.message);
    } catch (resetError) {
      setResetMessage(resetError.message || 'If your details are registered, a reset email will be sent.');
    }
  };

  const handleResetComplete = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword.length < 10 || newPassword !== confirmPassword) {
      setError('Use a matching password of at least 10 characters.');
      return;
    }
    try {
      await onCompletePasswordReset({ token: resetToken, password: newPassword });
      window.history.replaceState({}, '', window.location.pathname);
      setResetMode(false);
      setResetMessage('Password reset successfully. You can now sign in.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (resetError) {
      setError(resetError.message || 'This reset link is invalid or expired.');
    }
  };

  if (resetMode) {
    return (
      <div className="login-screen"><div className="login-card">
        <h1 className="login-title">Reset your password</h1>
        {error && <div className="login-error" role="alert"><AlertCircle size={16} /><span>{error}</span></div>}
        {resetMessage && <div className="login-info" role="alert"><ShieldCheck size={16} /><span>{resetMessage}</span></div>}
        {resetToken ? (
          <form className="login-form" onSubmit={handleResetComplete}>
            <label htmlFor="resetPassword">New password</label>
            <input id="resetPassword" type="password" className="input-field" value={newPassword} onChange={e => setNewPassword(e.target.value)} minLength={10} required />
            <label htmlFor="resetConfirmPassword">Confirm password</label>
            <input id="resetConfirmPassword" type="password" className="input-field" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={10} required />
            <button type="submit" className="btn-primary login-btn">Set new password</button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleResetRequest}>
            <label htmlFor="resetMemberNumber">Member number</label>
            <input id="resetMemberNumber" className="input-field" value={memberNumber} onChange={e => setMemberNumber(e.target.value)} required />
            <label htmlFor="resetLastName">Last name</label>
            <input id="resetLastName" className="input-field" value={lastName} onChange={e => setLastName(e.target.value)} required />
            <button type="submit" className="btn-primary login-btn">Email reset link</button>
            <button type="button" className="btn-text" onClick={() => setResetMode(false)}>Back to sign in</button>
          </form>
        )}
      </div></div>
    );
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <img
          src="/oakville-logo.jpg"
          alt="Oakville Club Logo"
          style={{
            width: '140px',
            height: 'auto',
            margin: '0 auto 20px auto',
            display: 'block',
            filter: 'drop-shadow(var(--shadow-sm))'
          }}
        />

        <div className="login-header-text">
          <h1 className="login-title">Oakville Club</h1>
          <p className="login-desc">
            {isAdminMode
              ? 'Management Administration Portal'
              : 'Member Photo Collection Hub'}
          </p>
        </div>

        {error && (
          <div className="login-error" role="alert">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        {infoMessage && (
          <div className="login-info" role="alert">
            <ShieldCheck size={16} style={{ flexShrink: 0 }} />
            <span>{infoMessage}</span>
          </div>
        )}

        {/* First time registration mode */}
        {!isAdminMode && isRegistering ? (
          <form className="login-form" onSubmit={handleRegisterSubmit}>
            <div className="form-group">
              <label>Member Profile</label>
              <div style={{ fontSize: '15px', fontWeight: '500', color: 'var(--club-green)' }}>
                {registeredMember.firstName} {registeredMember.lastName} (#{registeredMember.memberNumber})
              </div>
            </div>

            {firebaseEnabled && <div className="form-group">
              <label htmlFor="registrationEmail">Email address</label>
              <input id="registrationEmail" type="email" className="input-field" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>}

            <div className="form-group">
              <label htmlFor="newPassword">Create Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="newPassword"
                  type="password"
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '40px' }}
                  placeholder="At least 6 characters"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <KeyRound size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--club-gray-dark)' }} />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="confirmPassword"
                  type="password"
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '40px' }}
                  placeholder="Repeat your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <KeyRound size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--club-gray-dark)' }} />
              </div>
            </div>

            <button type="submit" className="btn-gold login-btn">
              Register Password & Login
            </button>

            <button
              type="button"
              className="btn-text"
              style={{ marginTop: '4px' }}
              onClick={() => {
                setIsRegistering(false);
                setRegisteredMember(null);
                setNewPassword('');
                setConfirmPassword('');
                setError('');
                setInfoMessage('');
              }}
            >
              Back to Login
            </button>
          </form>
        ) : !isAdminMode ? (
          /* Normal Member Login Mode */
          <form className="login-form" onSubmit={handleMemberSubmit}>
            <div className="form-group">
              <label htmlFor="memberNumber">Member Number</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="memberNumber"
                  type="text"
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '40px' }}
                  placeholder="e.g. 1001"
                  value={memberNumber}
                  onChange={(e) => setMemberNumber(e.target.value)}
                  required
                />
                <User size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--club-gray-dark)' }} />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="lastName">Last Name</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="lastName"
                  type="text"
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '40px' }}
                  placeholder="e.g. Smith"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
                <User size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--club-gray-dark)' }} />
              </div>
            </div>

            {/* Cloud mode always uses server-side password verification. */}
            {(showPassword || members.some(m => m.memberNumber.trim() === memberNumber.trim() && m.lastName.toLowerCase().trim() === lastName.toLowerCase().trim() && m.password)) && (
              <div className="form-group animate-fade-in">
                <label htmlFor="password">Password</label>
                <div style={{ position: 'relative' }}>
                  <input
                    id="password"
                    type="password"
                    className="input-field"
                    style={{ width: '100%', paddingLeft: '40px' }}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <Lock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--club-gray-dark)' }} />
                </div>
              </div>
            )}

            <button type="submit" className="btn-primary login-btn" style={{ justifyContent: 'center' }}>
              {firebaseEnabled && !showPassword ? 'Continue' : 'Sign In'}
            </button>
            {firebaseEnabled && showPassword && <button type="button" className="btn-text" onClick={() => setResetMode(true)}>Forgot password?</button>}
          </form>
        ) : (
          /* Admin Login Mode */
          <form className="login-form" onSubmit={handleAdminSubmit}>
            <div className="form-group">
              <label htmlFor="adminEmail">Admin Email</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="adminEmail"
                  type="text"
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '40px' }}
                  placeholder="admin@oakville.com"
                  value={adminEmail}
                  onChange={(e) => setAdminEmail(e.target.value)}
                  required
                />
                <User size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--club-gray-dark)' }} />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="adminPassword">PIN / Password</label>
              <div style={{ position: 'relative' }}>
                <input
                  id="adminPassword"
                  type="password"
                  className="input-field"
                  style={{ width: '100%', paddingLeft: '40px' }}
                  placeholder="Enter PIN (offline: 1907)"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  required
                />
                <Lock size={18} style={{ position: 'absolute', left: '12px', top: '14px', color: 'var(--club-gray-dark)' }} />
              </div>
            </div>

            <button type="submit" className="btn-gold login-btn">
              Authenticate Admin
            </button>
          </form>
        )}

        <div className="admin-toggle-link">
          <button onClick={toggleMode}>
            {isAdminMode ? '← Back to Member Hub' : 'Access Admin Portal →'}
          </button>
        </div>
      </div>
    </div>
  );
}
