import React, { useEffect, useState } from 'react';
import { ShieldCheck, AlertCircle, Info } from 'lucide-react';
import { getAllPhotos, savePhoto, deletePhoto as localDeletePhoto, clearAllPhotos } from './db';
import { seedMembers, seedPhotos } from './seedData';
import Login from './components/Login';
import Header from './components/Header';
import PhotoUpload from './components/PhotoUpload';
import PhotoGallery from './components/PhotoGallery';
import AdminPortal from './components/AdminPortal';
import {
  addCloudMember, cloudApiEnabled, cloudLogin, cloudLogout, cloudSession,
  deleteCloudMember, deleteCloudPhoto, loadCloudData, resetCloudData,
  saveCloudPassword, toggleCloudHeart, uploadCloudPhoto, cloudRegister,
  requestCloudPasswordReset, completeCloudPasswordReset, checkCloudMember
} from './api';
import './App.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('gallery');
  const [members, setMembers] = useState([]);
  const [photos, setPhotos] = useState([]);
  const [toasts, setToasts] = useState([]);
  const [cloudActive, setCloudActive] = useState(false);

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.filter(toast => toast.id !== id)), 4000);
  };

  useEffect(() => {
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
  }, []);

  useEffect(() => {
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
  }, []);

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
    handleLoginSuccess(result.user, result.role === 'admin');
    const data = await loadCloudData();
    setMembers(data.members || []);
    setPhotos(data.photos || []);
  };

  const handleCloudRegister = async details => {
    const result = await cloudRegister(details);
    setCloudActive(true);
    const data = await loadCloudData();
    setMembers(data.members || []);
    setPhotos(data.photos || []);
    return result;
  };

  const handleLogout = () => {
    if (cloudActive) cloudLogout().catch(error => console.error('Cloud logout failed:', error));
    setCurrentUser(null);
    setIsAdmin(false);
    setActiveTab('gallery');
    sessionStorage.removeItem('oakville_user');
    sessionStorage.removeItem('oakville_is_admin');
    addToast('Signed out successfully.', 'info');
  };

  const handleAddMember = async (member) => {
    const updatedMembers = [...members, member];
    if (cloudActive) await addCloudMember(member);
    else localStorage.setItem('oakville_members', JSON.stringify(updatedMembers));
    setMembers(updatedMembers);
  };

  const handleDeleteMember = async (memberNumber) => {
    if (cloudActive) await deleteCloudMember(memberNumber);
    else localStorage.setItem('oakville_members', JSON.stringify(members.filter(member => member.memberNumber !== memberNumber)));
    setMembers(prev => prev.filter(member => member.memberNumber !== memberNumber));
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
    if (cloudActive) {
      await uploadCloudPhoto(photo);
      const data = await loadCloudData();
      setPhotos(data.photos || []);
    } else {
      await savePhoto(photo);
      setPhotos(prev => [photo, ...prev]);
    }
  };

  const handleDeletePhoto = async photoId => {
    if (cloudActive) {
      await deleteCloudPhoto(photoId);
      setPhotos(prev => prev.filter(photo => photo.id !== photoId));
    } else {
      await localDeletePhoto(photoId);
      setPhotos(prev => prev.filter(photo => photo.id !== photoId));
    }
    addToast('Photo deleted successfully.', 'success');
  };

  const handleHeartPhoto = async photoId => {
    if (!currentUser) return;
    const photo = photos.find(item => item.id === photoId);
    if (!photo) return;
    if (cloudActive) {
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

  if (!currentUser) {
    return <Login members={members} onLoginSuccess={handleLoginSuccess} onCloudLogin={handleCloudLogin} onCloudCheckMember={checkCloudMember} onCloudRegister={handleCloudRegister} onRequestPasswordReset={requestCloudPasswordReset} onCompletePasswordReset={completeCloudPasswordReset} onRegisterPassword={handleRegisterPassword} firebaseEnabled={cloudApiEnabled} />;
  }

  return (
    <div className="app-container">
      <Header user={currentUser} isAdmin={isAdmin} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
      <main className="content-wrapper">
        {activeTab === 'gallery' && <PhotoGallery photos={photos} currentUser={currentUser} isAdmin={isAdmin} onHeartPhoto={handleHeartPhoto} onDeletePhoto={handleDeletePhoto} />}
        {activeTab === 'upload' && !isAdmin && <PhotoUpload user={currentUser} onUploadSuccess={handleUploadPhoto} addToast={addToast} />}
        {activeTab === 'admin' && isAdmin && <AdminPortal members={members} photos={photos} onAddMember={handleAddMember} onDeleteMember={handleDeleteMember} onSetMemberPassword={handleSetMemberPassword} onDeletePhoto={handleDeletePhoto} firebaseConfig={cloudActive ? { provider: 'Cloudflare R2 + D1' } : null} onResetDatabase={handleResetDatabase} addToast={addToast} />}
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
