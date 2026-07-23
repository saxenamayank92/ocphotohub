import React, { lazy, Suspense, useEffect, useState } from 'react';
import { ShieldCheck, AlertCircle, Info } from 'lucide-react';
import { getAllPhotos, savePhoto, deletePhoto as localDeletePhoto, clearAllPhotos } from './db';
import { demoClub, demoMembers, demoPhotos, demoUser, seedMembers, seedPhotos } from './seedData';
import Login from './components/Login';
import Header from './components/Header';
import PhotoGallery from './components/PhotoGallery';
import ClubOnboarding from './components/ClubOnboarding';
import AccountSettings from './components/AccountSettings';
import {
  addCloudMember, cloudApiEnabled, cloudLogin, cloudLogout, cloudSession,
  deleteCloudMember, deleteCloudPhoto, updateCloudPhoto, loadCloudData, resetCloudData,
  saveCloudPassword, toggleCloudHeart, uploadCloudPhoto, cloudRegister,
  requestCloudPasswordReset, completeCloudPasswordReset, checkCloudMember,
  listCloudClubs, requestRegistrationCode, updateCloudMember, startClubOnboarding,
  completeClubOnboarding, updateCurrentClub, requestAdminPasswordReset,
  completeAdminPasswordReset, deleteCloudAccount, deleteCloudOrganization
} from './api';
import { clubBrand } from './brand';
import './App.css';

const PhotoUpload = lazy(() => import('./components/PhotoUpload'));
const AdminPortal = lazy(() => import('./components/AdminPortal'));

export default function App() {
  const directClubId = window.location.hostname === 'ocphotohub.xtide.io' ? 'oakville' : null;
  const demoMode = new URLSearchParams(window.location.search).get('demo') === '1';
  const [currentUser, setCurrentUser] = useState(demoMode ? demoUser : null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('gallery');
  const [members, setMembers] = useState(demoMode ? demoMembers : []);
  const [photos, setPhotos] = useState(demoMode ? demoPhotos : []);
  const [toasts, setToasts] = useState([]);
  const [cloudActive, setCloudActive] = useState(false);
  const [clubs, setClubs] = useState([clubBrand]);
  const [currentClub, setCurrentClub] = useState(demoMode ? demoClub : null);
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
  }, [demoMode]);

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
        const clubData = await listCloudClubs();
        if (!cancelled) setClubs(clubData.clubs || []);
        const session = await cloudSession();
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
        setPhotos(data.photos || []);
        setCloudActive(true);
      } catch (error) {
        console.error('Cloud API unavailable; using local mode:', error);
        if (!cancelled) {
          setCloudActive(false);
          await loadLocal();
          addToast('Cloud API unavailable. Using local demo mode.', 'info');
        }
      }
    };

    if (cloudApiEnabled) loadCloud();
    else loadLocal();
    return () => { cancelled = true; };
  }, [demoMode]);

  const handleRegisterPassword = async (memberNumber, password) => {
    const registeredAt = new Date().toISOString();
    const updatedMembers = members.map(member => member.memberNumber === memberNumber ? { ...member, password, registeredAt } : member);
    setMembers(updatedMembers);
    if (cloudActive) await saveCloudPassword(memberNumber, password);
    else localStorage.setItem('oakville_members', JSON.stringify(updatedMembers));
    addToast('Your password was successfully created!', 'success');
  };

  const handleLoginSuccess = (user, admin) => {
    setCurrentUser(user);
    setIsAdmin(admin);
    setActiveTab(admin ? 'admin' : 'gallery');
    sessionStorage.setItem('oakville_user', JSON.stringify(user));
    sessionStorage.setItem('oakville_is_admin', String(admin));
    addToast(`Signed in as ${admin ? 'Club Admin' : `${user.firstName} ${user.lastName}`}`, 'success');
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

  const handleAddMember = async (member) => {
    if (cloudActive) await addCloudMember(member);
    setMembers(previous => {
      const updatedMembers = [...previous, member];
      if (!cloudActive) localStorage.setItem('oakville_members', JSON.stringify(updatedMembers));
      return updatedMembers;
    });
  };

  const handleCompleteClubOnboarding = async details => {
    const result = await completeClubOnboarding(details);
    setCloudActive(true);
    setCurrentClub(result.club);
    setClubs(previous => [...previous.filter(club => club.id !== result.club.id), result.club].sort((left, right) => left.name.localeCompare(right.name)));
    setMembers([]); setPhotos([]); setShowClubOnboarding(false);
    window.history.replaceState({}, '', '/app');
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

  if (!currentUser) {
    if (showClubOnboarding) return <ClubOnboarding onStart={startClubOnboarding} onComplete={handleCompleteClubOnboarding} onCancel={() => { setShowClubOnboarding(false); window.history.replaceState({}, '', '/app'); }} />;
    return <Login clubs={clubs} directClubId={directClubId} members={members} onLoginSuccess={handleLoginSuccess} onCloudLogin={handleCloudLogin} onCloudCheckMember={checkCloudMember} onCloudRequestRegistrationCode={requestRegistrationCode} onCloudRegister={handleCloudRegister} onRequestPasswordReset={requestCloudPasswordReset} onCompletePasswordReset={completeCloudPasswordReset} onRequestAdminPasswordReset={requestAdminPasswordReset} onCompleteAdminPasswordReset={completeAdminPasswordReset} onRegisterPassword={handleRegisterPassword} onCreateClub={() => { setShowClubOnboarding(true); window.history.replaceState({}, '', '/app?onboard=club'); }} firebaseEnabled={cloudApiEnabled} />;
  }

  return (
    <div className="app-container">
      <Header user={currentUser} club={currentClub || clubBrand} isAdmin={isAdmin} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      {demoMode && <div className="demo-mode-banner"><span><ShieldCheck size={15} /> Exploring the read-only Your Club demo</span><a href="/app?onboard=club">Create your workspace</a></div>}
      {!demoMode && trialDaysLeft !== null && <div className={`trial-status-banner ${trialDaysLeft === 0 ? 'expired' : ''}`}><span>{trialDaysLeft > 0 ? `${trialDaysLeft} days left in your free trial` : 'Your trial has ended. This workspace is now read-only.'}</span>{isAdmin && <a href="mailto:support@xtide.io?subject=Activate%20Club%20PhotoHub">Activate plan</a>}</div>}
      <main className="content-wrapper">
        <Suspense fallback={<div className="panel-loading" role="status"><div className="spinner" /><span>Loading…</span></div>}>
          {activeTab === 'gallery' && <PhotoGallery photos={photos} currentUser={currentUser} isAdmin={isAdmin} onHeartPhoto={handleHeartPhoto} onDeletePhoto={handleDeletePhoto} />}
          {activeTab === 'upload' && !isAdmin && <PhotoUpload user={currentUser} onUploadSuccess={handleUploadPhoto} addToast={addToast} />}
          {activeTab === 'admin' && isAdmin && <AdminPortal club={currentClub || clubBrand} members={members} photos={photos} onUpdateClub={handleUpdateClub} onAddMember={handleAddMember} onUpdateMember={handleUpdateMember} onDeleteMember={handleDeleteMember} onSetMemberPassword={handleSetMemberPassword} onDeletePhoto={handleDeletePhoto} onUpdatePhoto={handleUpdatePhoto} firebaseConfig={cloudActive ? { provider: 'Cloudflare R2 + D1' } : null} onResetDatabase={handleResetDatabase} addToast={addToast} />}
          {activeTab === 'account' && <AccountSettings user={currentUser} club={currentClub || clubBrand} isAdmin={isAdmin} demoMode={demoMode} onDeleteAccount={handleDeleteAccount} onDeleteOrganization={handleDeleteOrganization} addToast={addToast} />}
        </Suspense>
      </main>
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
