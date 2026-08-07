import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { ShieldCheck, AlertCircle, Info, ArrowRight, Sparkles } from 'lucide-react';
import { getAllPhotos, savePhoto, deletePhoto as localDeletePhoto, clearAllPhotos } from './db';
import { demoAdminUser, demoClub, demoMembers, demoPhotos, demoUser, seedMembers, seedPhotos } from './seedData';
import Login from './components/Login';
import Header from './components/Header';
import PhotoGallery from './components/PhotoGallery';
import ClubOnboarding from './components/ClubOnboarding';
import AccountSettings from './components/AccountSettings';
import MemberProfile from './components/MemberProfile';
import MobileBottomNav from './components/MobileBottomNav';
import {
  addCloudMember, addCloudMembers, cloudApiEnabled, cloudLogin, cloudLogout, cloudSession,
  deleteCloudMember, deleteCloudPhoto, updateCloudPhoto, loadCloudData, resetCloudData,
  saveCloudPassword, toggleCloudHeart, uploadCloudPhoto, cloudRegister,
  requestCloudPasswordReset, completeCloudPasswordReset, checkCloudMember,
  searchCloudClubs, resolveCloudClub, requestRegistrationCode, updateCloudMember, startClubOnboarding,
  completeClubOnboarding, updateCurrentClub, requestAdminPasswordReset,
  completeAdminPasswordReset, deleteCloudAccount, deleteCloudOrganization, registerCloudPushToken, resolveApiUrl
} from './api';
import { clubBrand } from './brand';
import { initializeNativeApp, registerPushNotifications, setNativeStatusBarForApp } from './services/pushNotifications';
import './App.css';

const PhotoUpload = lazy(() => import('./components/PhotoUpload'));
const AdminPortal = lazy(() => import('./components/AdminPortal'));

export default function App() {
  // Only a top-level club slug should lock member access to one club. `/app`
  // is the shared entry point, not a club called "app".
  const pathSlugCandidate = window.location.pathname.match(/^\/([a-z0-9][a-z0-9-]{0,59})\/?$/i)?.[1]?.toLowerCase() || null;
  const directPathSlug = pathSlugCandidate === 'app' ? null : pathSlugCandidate;
  const directClubId = directPathSlug;
  const queryParams = new URLSearchParams(window.location.search);
  // The bundled sample club is also available in the native shell. This gives
  // prospective clubs and App Review a complete, credential-free walkthrough
  // without changing real club sign-in or data access.
  const demoMode = queryParams.get('demo') === '1';
  const initialDemoAdmin = demoMode && queryParams.get('demoView') === 'admin';
  const [demoAdminView, setDemoAdminView] = useState(initialDemoAdmin);
  const [currentUser, setCurrentUser] = useState(initialDemoAdmin ? demoAdminUser : (demoMode ? demoUser : null));
  const [isAdmin, setIsAdmin] = useState(initialDemoAdmin);
  const [activeTab, setActiveTab] = useState(initialDemoAdmin ? 'admin' : 'gallery');
  const [members, setMembers] = useState(demoMode ? demoMembers : []);
  const [photos, setPhotos] = useState(demoMode ? demoPhotos : []);
  const [toasts, setToasts] = useState([]);
  const [cloudActive, setCloudActive] = useState(false);
  const [clubs, setClubs] = useState(cloudApiEnabled ? [] : [clubBrand]);
  const [currentClub, setCurrentClub] = useState(demoMode ? demoClub : null);
  const [startupError, setStartupError] = useState('');
  const [cameraFiles, setCameraFiles] = useState(null);
  const [showClubOnboarding, setShowClubOnboarding] = useState(() => new URLSearchParams(window.location.search).get('onboard') === 'club');
  const trialDaysLeft = currentClub?.planStatus === 'trialing' && currentClub.trialEndsAt
    ? Math.max(0, Math.ceil((Date.parse(currentClub.trialEndsAt) - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(toast => toast.id !== id)), 4000);
  };

  useEffect(() => {
    initializeNativeApp();
  }, []);

  useEffect(() => {
    setNativeStatusBarForApp(Boolean(currentUser));
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && cloudActive && Capacitor.isNativePlatform()) {
      registerPushNotifications(
        (token) => {
          registerCloudPushToken({ token, platform: Capacitor.getPlatform() }).catch(error => console.warn('Could not register push device:', error.message));
        },
        () => {},
        addToast
      );
    }
  }, [currentUser, cloudActive]);

  useEffect(() => {
    if (demoMode) return;
    const savedUser = sessionStorage.getItem('oakville_user');
    const savedAdmin = sessionStorage.getItem('oakville_is_admin') === 'true';
    if (savedUser && !cloudApiEnabled) {
      try {
        setCurrentUser(JSON.parse(savedUser));
        setIsAdmin(savedAdmin);
        setActiveTab(savedAdmin ? 'admin' : 'gallery');
      } catch {
        sessionStorage.removeItem('oakville_user');
        sessionStorage.removeItem('oakville_is_admin');
      }
    }
  }, [demoMode, directClubId]);

  useEffect(() => {
    if (demoMode) return;
    let cancelled = false;
    const loadLocal = async () => {
      const localMembers = localStorage.getItem('oakville_members');
      setMembers(localMembers ? JSON.parse(localMembers) : seedMembers);
      if (!localMembers) localStorage.setItem('oakville_members', JSON.stringify(seedMembers));
      try {
        const localPhotos = await getAllPhotos();
        if (localPhotos.length === 0) {
          for (const photo of seedPhotos) await savePhoto(photo);
          if (!cancelled) setPhotos(seedPhotos);
        } else if (!cancelled) {
          setPhotos(localPhotos);
        }
      } catch (error) {
        console.error('IndexedDB loading failed:', error);
        if (!cancelled) setPhotos(seedPhotos);
      }
    };

  const loadCloud = async () => {
      try {
        const [directClubData, session] = await Promise.all([
          directClubId ? resolveCloudClub(directClubId) : Promise.resolve({ club: null }),
          cloudSession()
        ]);
        if (directClubId && !directClubData.club) {
          if (!cancelled) setStartupError('This club link is unavailable. Please check the address with your club.');
          return;
        }
        if (!cancelled) setClubs(directClubData.club ? [directClubData.club] : []);
        const sessionMatchesDirectClub = !directClubId
          || !session.authenticated
          || session.club?.id === directClubId
          || session.club?.slug === directClubId;
        if (session.authenticated && !sessionMatchesDirectClub) {
          // A direct club URL must never inherit a session or branding from a
          // different tenant (for example, an Oakville session at /yourclub).
          await cloudLogout().catch(error => console.error('Stale tenant logout failed:', error));
          if (!cancelled) {
            setCurrentUser(null);
            setCurrentClub(null);
            setIsAdmin(false);
            setCloudActive(true);
            setMembers([]);
            setPhotos([]);
            sessionStorage.removeItem('oakville_user');
            sessionStorage.removeItem('oakville_is_admin');
          }
          return;
        }
        if (!session.authenticated) {
          if (!cancelled) {
            setCloudActive(true);
            setMembers([]);
            setPhotos([]);
          }
          return;
        }
        if (!cancelled) {
          setCurrentUser(session.user);
          setCurrentClub(session.club);
          setIsAdmin(session.role === 'admin');
          sessionStorage.setItem('oakville_user', JSON.stringify(session.user));
          sessionStorage.setItem('oakville_is_admin', String(session.role === 'admin'));
        }
        const data = await loadCloudData();
        if (cancelled) return;
        setMembers(data.members || []);
        setPhotos((data.photos || []).map(p => ({ ...p, url: resolveApiUrl(p.url) })));
        setCloudActive(true);
      } catch (error) {
        console.error('Cloud API unavailable, falling back to local storage:', error);
        if (!cancelled) {
          setCloudActive(false);
          loadLocal();
        }
      }
    };

    if (cloudApiEnabled) loadCloud();
    else if (import.meta.env.PROD) setStartupError('This workspace is not configured yet. Please contact support.');
    else loadLocal();
    return () => { cancelled = true; };
  }, [demoMode, directClubId]);

  const handleRegisterPassword = async (memberNumber, password) => {
    const registeredAt = new Date().toISOString();
    const updatedMembers = members.map(member => member.memberNumber === memberNumber ? { ...member, password, registeredAt } : member);
    setMembers(updatedMembers);
    if (cloudActive) await saveCloudPassword(memberNumber, password);
    else localStorage.setItem('oakville_members', JSON.stringify(updatedMembers));
    addToast('Your password was successfully created!', 'success');
  };

  const handleLoginSuccess = (user, admin) => {
    const isUserAdmin = Boolean(admin || user?.role === 'admin' || user?.role === 'owner');
    const isMobileViewport = typeof window !== 'undefined' && window.innerWidth <= 768;
    setCurrentUser(user);
    setIsAdmin(isUserAdmin);
    // Mobile view is for member gallery view only; full Admin Portal is available on desktop
    setActiveTab(isMobileViewport ? 'gallery' : (isUserAdmin ? 'admin' : 'gallery'));
    sessionStorage.setItem('oakville_user', JSON.stringify(user));
    sessionStorage.setItem('oakville_is_admin', String(isUserAdmin));
    const returnTo = new URLSearchParams(window.location.search).get('returnTo');
    if (isUserAdmin && returnTo === '/admin/leads') {
      window.location.assign(returnTo);
      return;
    }
    addToast(`Signed in as ${user?.role === 'owner' ? 'Club Owner' : isUserAdmin ? 'Staff Admin' : `${user.firstName} ${user.lastName}`}`, 'success');
  };

  const handleCloudLogin = async credentials => {
    const result = await cloudLogin(credentials);
    setCloudActive(true);
    setCurrentClub(result.club);
    handleLoginSuccess(result.user, result.role === 'admin');
    const data = await loadCloudData();
    setMembers(data.members || []);
    setPhotos(data.photos || []);
  };

  const handleCloudRegister = async details => {
    const result = await cloudRegister(details);
    setCloudActive(true);
    setCurrentClub(result.club);
    const data = await loadCloudData();
    setMembers(data.members || []);
    setPhotos(data.photos || []);
    return result;
  };

  const handleLogout = () => {
    if (demoMode) {
      window.location.assign('/');
      return;
    }
    if (cloudActive) cloudLogout().catch(error => console.error('Cloud logout failed:', error));
    setCurrentUser(null);
    setCurrentClub(null);
    setIsAdmin(false);
    setActiveTab('gallery');
    sessionStorage.removeItem('oakville_user');
    sessionStorage.removeItem('oakville_is_admin');
    addToast('Signed out successfully.', 'info');
  };

  const handleDemoViewChange = view => {
    if (!demoMode) return;
    const admin = view === 'admin';
    setDemoAdminView(admin);
    setCurrentUser(admin ? demoAdminUser : demoUser);
    setIsAdmin(admin);
    setActiveTab(admin ? 'admin' : 'gallery');

    // Keep the preview link shareable without causing a navigation or reload.
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set('demo', '1');
    if (admin) nextUrl.searchParams.set('demoView', 'admin');
    else nextUrl.searchParams.delete('demoView');
    window.history.replaceState({}, '', `${nextUrl.pathname}${nextUrl.search}${nextUrl.hash}`);
  };

  const handleAddMember = async (member) => {
    const savedMember = cloudActive ? await addCloudMember(member) : member;
    setMembers(previous => {
      const updatedMembers = [...previous, savedMember];
      if (!cloudActive) localStorage.setItem('oakville_members', JSON.stringify(updatedMembers));
      return updatedMembers;
    });
  };

  const handleAddMembers = async (newMembers) => {
    if (cloudActive) {
      const result = await addCloudMembers(newMembers);
      const data = await loadCloudData();
      setMembers(data.members || []);
      return result;
    }
    setMembers(previous => {
      const existing = new Set(previous.map(member => String(member.memberNumber).trim().toUpperCase()));
      const additions = newMembers.filter(member => !existing.has(String(member.memberNumber).trim().toUpperCase()));
      const updatedMembers = [...previous, ...additions];
      localStorage.setItem('oakville_members', JSON.stringify(updatedMembers));
      return updatedMembers;
    });
    return { addedCount: newMembers.length, skippedCount: 0, reasons: {} };
  };

  const handleCompleteClubOnboarding = async details => {
    const result = await completeClubOnboarding(details);
    setCloudActive(true);
    setCurrentClub(result.club);
    setClubs(previous => [...previous.filter(club => club.id !== result.club.id), result.club].sort((left, right) => left.name.localeCompare(right.name)));
    setMembers([]); setPhotos([]); setShowClubOnboarding(false);
    window.history.replaceState({}, '', `/${result.club.slug}`);
    handleLoginSuccess(result.user, true);
  };

  const handleUpdateClub = async changes => {
    const updated = await updateCurrentClub(changes);
    setCurrentClub(updated);
    setClubs(previous => previous.map(club => club.id === updated.id ? updated : club));
    return updated;
  };

  const handleDeleteMember = async (memberNumber) => {
    if (cloudActive) await deleteCloudMember(memberNumber);
    else localStorage.setItem('oakville_members', JSON.stringify(members.filter(member => member.memberNumber !== memberNumber)));
    setMembers(prev => prev.filter(member => member.memberNumber !== memberNumber));
  };

  const handleUpdateMember = async (memberNumber, changes) => {
    const updated = cloudActive ? await updateCloudMember(memberNumber, changes) : { ...members.find(member => member.memberNumber === memberNumber), ...changes };
    setMembers(previous => previous.map(member => member.memberNumber === memberNumber ? { ...member, ...updated } : member));
    if (!cloudActive) localStorage.setItem('oakville_members', JSON.stringify(members.map(member => member.memberNumber === memberNumber ? { ...member, ...changes } : member)));
    return updated;
  };

  const handleSetMemberPassword = async (memberNumber, password) => {
    if (cloudActive) await saveCloudPassword(memberNumber, password);
    else {
      const updatedMembers = members.map(member => member.memberNumber === memberNumber ? { ...member, password, registeredAt: new Date().toISOString() } : member);
      localStorage.setItem('oakville_members', JSON.stringify(updatedMembers));
      setMembers(updatedMembers);
    }
  };

  const handleUploadPhoto = async photo => {
    if (demoMode) return addToast('The public demo is read-only. Create your own organization workspace to begin.', 'info');
    if (cloudActive) {
      await uploadCloudPhoto(photo);
      const data = await loadCloudData();
      setPhotos(data.photos || []);
    } else {
      const url = photo.blob ? await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Could not prepare the local photo.'));
        reader.readAsDataURL(photo.blob);
      }) : photo.url;
      const localPhoto = { ...photo, url };
      delete localPhoto.blob;
      await savePhoto(localPhoto);
      setPhotos(prev => [localPhoto, ...prev]);
    }
  };

  const handleDeletePhoto = async photoId => {
    if (demoMode) return addToast('Demo photos are protected. Your organization controls its own photo moderation.', 'info');
    if (cloudActive) {
      await deleteCloudPhoto(photoId);
      setPhotos(prev => prev.filter(photo => photo.id !== photoId));
    } else {
      await localDeletePhoto(photoId);
      setPhotos(prev => prev.filter(photo => photo.id !== photoId));
    }
    addToast('Photo deleted successfully.', 'success');
  };

  const handleUpdatePhoto = async (photoId, changes) => {
    const photo = photos.find(item => item.id === photoId);
    if (!photo) throw new Error('Photo not found.');
    const updated = cloudActive
      ? await updateCloudPhoto(photoId, changes)
      : { ...photo, ...changes };
    if (!cloudActive) await savePhoto(updated);
    const merged = { ...photo, ...updated, heartUsers: updated.heartUsers || photo.heartUsers, hearts: updated.hearts ?? photo.hearts };
    setPhotos(previous => previous.map(item => item.id === photoId ? merged : item));
    return merged;
  };

  const handleHeartPhoto = async photoId => {
    if (!currentUser) return;
    const photo = photos.find(item => item.id === photoId);
    if (!photo) return;
    if (demoMode) {
      const userNum = currentUser.memberNumber;
      const heartUsers = photo.heartUsers || [];
      const hasLiked = heartUsers.includes(userNum);
      const nextUsers = hasLiked ? heartUsers.filter(user => user !== userNum) : [...heartUsers, userNum];
      setPhotos(previous => previous.map(item => item.id === photoId ? { ...item, hearts: nextUsers.length, heartUsers: nextUsers } : item));
    } else if (cloudActive) {
      const result = await toggleCloudHeart(photoId, currentUser.memberNumber);
      setPhotos(prev => prev.map(item => item.id === photoId ? { ...item, ...result } : item));
    } else {
      const userNum = currentUser.memberNumber;
      const heartUsers = photo.heartUsers || [];
      const hasLiked = heartUsers.includes(userNum);
      const nextUsers = hasLiked ? heartUsers.filter(user => user !== userNum) : [...heartUsers, userNum];
      const updated = { ...photo, hearts: nextUsers.length, heartUsers: nextUsers };
      await savePhoto(updated);
      setPhotos(prev => prev.map(item => item.id === photoId ? updated : item));
    }
  };

  const handleResetDatabase = async () => {
    if (cloudActive) {
      await resetCloudData();
      const data = await loadCloudData();
      setMembers(data.members || []);
      setPhotos(data.photos || []);
    } else {
      await clearAllPhotos();
      for (const photo of seedPhotos) await savePhoto(photo);
      localStorage.setItem('oakville_members', JSON.stringify(seedMembers));
      setMembers(seedMembers);
      setPhotos(seedPhotos);
    }
  };

  const handleDeleteAccount = async () => {
    await deleteCloudAccount();
    sessionStorage.removeItem('oakville_user');
    sessionStorage.removeItem('oakville_is_admin');
    window.location.assign('/');
  };

  const handleDeleteOrganization = async confirmName => {
    await deleteCloudOrganization(confirmName);
    sessionStorage.removeItem('oakville_user');
    sessionStorage.removeItem('oakville_is_admin');
    window.location.assign('/');
  };

  if (startupError) return <div className="login-screen"><div className="login-card startup-error-card" role="alert"><ShieldCheck size={42} /><h1>Club PhotoHub is taking a moment</h1><p>{startupError}</p><button type="button" className="btn-primary login-btn" onClick={() => window.location.reload()}>Try again</button></div></div>;

  if (!currentUser) {
    if (showClubOnboarding) return <ClubOnboarding onStart={startClubOnboarding} onComplete={handleCompleteClubOnboarding} onCancel={() => { setShowClubOnboarding(false); window.history.replaceState({}, '', '/app'); }} />;
    return <Login clubs={clubs} directClubId={directClubId} members={members} onSearchClubs={searchCloudClubs} onLoginSuccess={handleLoginSuccess} onCloudLogin={handleCloudLogin} onCloudCheckMember={checkCloudMember} onCloudRequestRegistrationCode={requestRegistrationCode} onCloudRegister={handleCloudRegister} onRequestPasswordReset={requestCloudPasswordReset} onCompletePasswordReset={completeCloudPasswordReset} onRequestAdminPasswordReset={requestAdminPasswordReset} onCompleteAdminPasswordReset={completeAdminPasswordReset} onRegisterPassword={handleRegisterPassword} onCreateClub={() => { setShowClubOnboarding(true); window.history.replaceState({}, '', '/app?onboard=club'); }} onOpenDemo={() => { const demoUrl = new URL(window.location.href); demoUrl.searchParams.set('demo', '1'); demoUrl.searchParams.delete('demoView'); if (typeof window !== 'undefined' && window.history?.pushState) { window.history.pushState({}, '', `${demoUrl.pathname}${demoUrl.search}`); } setCurrentUser(demoUser); setCurrentClub(demoClub); setIsAdmin(false); setActiveTab('gallery'); setMembers(demoMembers); setPhotos(demoPhotos); }} firebaseEnabled={cloudApiEnabled || import.meta.env.DEV} />;
  }

  return (
    <div className="app-container">
      <Header user={currentUser} club={currentClub || clubBrand} isAdmin={isAdmin} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      {demoMode && <div className="demo-mode-banner">
        <div className="demo-banner-copy">
          <span><Sparkles size={15} /> Exploring the interactive Demo Club</span>
          <a href="/book-demo">See this for your club →</a>
        </div>
        <div className="demo-view-switcher" role="tablist" aria-label="Demo view">
          <button type="button" role="tab" aria-selected={!demoAdminView} className={!demoAdminView ? 'active' : ''} onClick={() => handleDemoViewChange('member')}>Member view</button>
          <button type="button" role="tab" aria-selected={demoAdminView} className={demoAdminView ? 'active' : ''} onClick={() => handleDemoViewChange('admin')}>Admin view</button>
        </div>
      </div>}
      {demoMode && (
        <div className="demo-explorer-conversion-bar">
          <div className="demo-explorer-copy">
            <strong>Imagine this with your club's branding.</strong>
            <span>We'll build a private sample workspace with your club's colors & logo.</span>
          </div>
          <a href="/book-demo" className="demo-explorer-cta">
            Show me my club's version <ArrowRight size={16} />
          </a>
        </div>
      )}
      {!demoMode && trialDaysLeft !== null && currentUser?.role === 'owner' && <div className={`trial-status-banner ${trialDaysLeft === 0 ? 'expired' : ''}`}><span>{trialDaysLeft > 0 ? `${trialDaysLeft} days left in your free trial` : 'Your trial has ended. This workspace is now read-only.'}</span><a href="/pricing#pricing-links">Choose a plan</a></div>}
      <main className="content-wrapper">
        <Suspense fallback={<div className="panel-loading" role="status"><div className="spinner" /><span>Loading…</span></div>}>
          {activeTab === 'gallery' && <PhotoGallery photos={photos} currentUser={currentUser} isAdmin={isAdmin} onHeartPhoto={handleHeartPhoto} onDeletePhoto={handleDeletePhoto} addToast={addToast} />}
          {activeTab === 'upload' && <PhotoUpload user={currentUser} initialFiles={cameraFiles} onInitialFilesConsumed={() => setCameraFiles(null)} onUploadSuccess={handleUploadPhoto} addToast={addToast} />}
          {activeTab === 'profile' && <MemberProfile user={currentUser} club={currentClub || clubBrand} photos={photos} onLogout={handleLogout} />}
          {activeTab === 'admin' && isAdmin && <AdminPortal user={currentUser} club={currentClub || clubBrand} members={members} photos={photos} onUpdateClub={handleUpdateClub} onAddMember={handleAddMember} onAddMembers={handleAddMembers} onUpdateMember={handleUpdateMember} onDeleteMember={handleDeleteMember} onSetMemberPassword={handleSetMemberPassword} onDeletePhoto={handleDeletePhoto} onUpdatePhoto={handleUpdatePhoto} firebaseConfig={cloudActive ? { provider: 'managed' } : null} onResetDatabase={handleResetDatabase} addToast={addToast} />}
          {activeTab === 'account' && <AccountSettings user={currentUser} club={currentClub || clubBrand} isAdmin={isAdmin} demoMode={demoMode} onDeleteAccount={handleDeleteAccount} onDeleteOrganization={handleDeleteOrganization} addToast={addToast} />}
        </Suspense>
      </main>
      <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      <div className="toast-container">
        {toasts.map(toast => <div key={toast.id} className={`toast ${toast.type}`}>
          {toast.type === 'success' && <ShieldCheck size={16} />}
          {toast.type === 'error' && <AlertCircle size={16} />}
          {toast.type === 'info' && <Info size={16} />}
          <span>{toast.message}</span>
        </div>)}
      </div>
    </div>
  );
}
