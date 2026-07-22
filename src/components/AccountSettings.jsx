import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, Trash2, UserRound } from 'lucide-react';

export default function AccountSettings({ user, club, isAdmin, demoMode, onDeleteAccount, onDeleteOrganization, addToast }) {
  const [working, setWorking] = useState(false);

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

  return <section className="account-settings animate-fade-in">
    <div className="account-heading"><span>Account & privacy</span><h1>Your Club PhotoHub account</h1><p>Review your identity and control the personal data associated with this account.</p></div>
    <div className="account-identity"><div><UserRound size={24} /></div><span><strong>{user.firstName} {user.lastName}</strong><small>{isAdmin ? 'Organization administrator' : `Member ${user.memberNumber}`} · {club.name}</small></span></div>
    <article className="account-security"><ShieldCheck size={21} /><div><h2>Protected account</h2><p>Your session is private to this browser. Sign out on shared devices and never share email verification codes.</p></div></article>
    <article className="danger-zone"><div><AlertTriangle size={21} /><span><h2>{isAdmin ? 'Delete administrator account' : 'Delete my account'}</h2><p>{isAdmin ? 'This is available when another active owner or administrator can retain the workspace.' : 'This removes your member account, likes, and every photo you uploaded.'}</p></span></div><button disabled={working} onClick={deleteAccount}><Trash2 size={16} /> Delete account</button></article>
    {isAdmin && <article className="danger-zone organization-delete"><div><AlertTriangle size={21} /><span><h2>Delete organization workspace</h2><p>Permanently removes the directory, administrators, photos, captions and activity. This cannot be undone.</p></span></div><button disabled={working} onClick={deleteOrganization}><Trash2 size={16} /> Delete organization</button></article>}
  </section>;
}
