import React, { lazy, Suspense, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { ShieldCheck, AlertCircle, Info, ArrowRight, Sparkles } from 'lucide-react';
import { getAllPhotos, savePhoto, deletePhoto as localDeletePhoto, clearAllPhotos } from './db';
import { demoAdminUser, demoClub, demoMembers, demoPhotos, demoUser, seedMembers, seedPhotos, defaultEvents, defaultVenues, defaultAlbums } from './seedData';
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
  completeAdminPasswordReset, deleteCloudAccount, deleteCloudOrganization, registerCloudPushToken, resolveApiUrl,
  reportCloudPhoto, blockCloudMember
} from './api';
import { clubBrand, platformBrand } from './brand';
import { initializeNativeApp, registerPushNotifications, setNativeStatusBarForApp } from './services/pushNotifications';
import './App.css';

const PhotoUpload = lazy(() => import('./components/PhotoUpload'));
const AdminPortal = lazy(() => import('./components/AdminPortal'));
const EventSchedule = lazy(() => import('./components/EventSchedule'));

export default function App() {
  // Only a top-level club slug should lock member access to one club. `/app`
  // is the shared entry point, not a club called "app".
  const pathSlugCandidate = window.location.pathname.match(/^\/([a-z0-9][a-z0-9-]{0,59})\/?$/i)?.[1]?.toLowerCase() || null;
  const directPathSlug = pathSlugCandidate === 'app' ? null : pathSlugCandidate;
  const directClubId = directPathSlug;
  // Dynamic Club Preview Matching
  const previewMatch = typeof window !== 'undefined' && window.location.pathname.match(/^\/preview\/([a-z0-9-]+)\/?$/i);
  const previewClubCode = previewMatch ? previewMatch[1] : null;
  const isPreviewMode = Boolean(previewClubCode);

  const formatClubNameFromSlug = (slug) => {
    if (!slug) return 'Your Private Club';
    return slug
      .split('-')
      .map(word => {
        if (word === 's') return "'s";
        return word.charAt(0).toUpperCase() + word.slice(1);
      })
      .join(' ')
      .replace(/\s+'s/g, "'s")
      .replace(/\b(And|&)\b/gi, '&');
  };

  const queryParams = new URLSearchParams(window.location.search);
  const demoMode = queryParams.get('demo') === '1';
  const initialDemoAdmin = (demoMode || isPreviewMode) && queryParams.get('demoView') !== 'member';
  const [demoAdminView, setDemoAdminView] = useState(initialDemoAdmin);
  const [currentUser, setCurrentUser] = useState((demoMode || isPreviewMode) ? (initialDemoAdmin ? demoAdminUser : demoUser) : null);
  const [isAdmin, setIsAdmin] = useState(initialDemoAdmin);
  const [activeTab, setActiveTab] = useState(initialDemoAdmin ? 'admin' : 'gallery');
  const [members, setMembers] = useState((demoMode || isPreviewMode) ? demoMembers : []);
  const [photos, setPhotos] = useState((demoMode || isPreviewMode) ? demoPhotos : []);
  const [albums, setAlbums] = useState(() => {
    try {
      const saved = localStorage.getItem('oakville_albums');
      return saved ? JSON.parse(saved) : defaultAlbums;
    } catch {
      return defaultAlbums;
    }
  });
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    try {
      localStorage.setItem('oakville_albums', JSON.stringify(albums));
    } catch (err) {
      console.warn('Failed to save albums to local storage', err);
    }
  }, [albums]);

  const handleAddAlbum = (newAlbumData) => {
    const newAlbum = {
      id: `album-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      name: newAlbumData.name.trim(),
      description: newAlbumData.description?.trim() || '',
      coverUrl: newAlbumData.coverUrl || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop',
      createdAt: new Date().toISOString(),
      createdBy: currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName}` : (currentUser?.name || 'Club Moderator')
    };
    setAlbums(prev => [newAlbum, ...prev]);
    addToast(`Album "${newAlbum.name}" created!`, 'success');
    return newAlbum;
  };

  const handleMovePhotosToAlbum = (photoIds, targetAlbumId) => {
    setPhotos(prev => prev.map(p => {
      if (photoIds.includes(p.id)) {
        return { ...p, albumId: targetAlbumId || null };
      }
      return p;
    }));
    const targetAlbum = albums.find(a => a.id === targetAlbumId);
    const albumName = targetAlbum ? targetAlbum.name : 'Unassigned';
    addToast(`Moved ${photoIds.length} photo(s) to "${albumName}"`, 'success');
  };

  const handleUpdateAlbum = (albumId, updatedData) => {
    setAlbums(prev => prev.map(a => a.id === albumId ? { ...a, ...updatedData } : a));
    addToast('Album updated successfully!', 'success');
  };

  const handleDeleteAlbum = (albumId) => {
    const target = albums.find(a => a.id === albumId);
    setAlbums(prev => prev.filter(a => a.id !== albumId));
    setPhotos(prev => prev.map(p => p.albumId === albumId ? { ...p, albumId: null } : p));
    addToast(`Album "${target?.name || 'Item'}" deleted`, 'info');
  };

  // Dynamic Event Schedule & Venues Management State
  const [events, setEvents] = useState(() => {
    try {
      const saved = localStorage.getItem('oakville_events');
      return saved ? JSON.parse(saved) : defaultEvents;
    } catch {
      return defaultEvents;
    }
  });

  const [venues, setVenues] = useState(() => {
    try {
      const saved = localStorage.getItem('oakville_venues');
      return saved ? JSON.parse(saved) : defaultVenues;
    } catch {
      return defaultVenues;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('oakville_events', JSON.stringify(events));
    } catch (err) {
      console.warn('Failed to save events to local storage', err);
    }
  }, [events]);

  useEffect(() => {
    try {
      localStorage.setItem('oakville_venues', JSON.stringify(venues));
    } catch (err) {
      console.warn('Failed to save venues to local storage', err);
    }
  }, [venues]);

  const handleAddEvent = (newEvent) => {
    setEvents(prev => [newEvent, ...prev]);
    addToast(`Event "${newEvent.name}" created!`, 'success');
  };

  const handleUpdateEvent = (eventId, updatedData) => {
    setEvents(prev => prev.map(evt => evt.id === eventId ? { ...evt, ...updatedData } : evt));
    addToast('Event updated successfully!', 'success');
  };

  const handleDeleteEvent = (eventId) => {
    const target = events.find(e => e.id === eventId);
    setEvents(prev => prev.filter(evt => evt.id !== eventId));
    addToast(`Event "${target?.name || 'Item'}" removed`, 'info');
  };

  const handleAddVenue = (newVenueName) => {
    const trimmed = newVenueName.trim();
    if (!trimmed) return;
    if (!venues.includes(trimmed)) {
      setVenues(prev => [...prev, trimmed]);
      addToast(`New space "${trimmed}" added!`, 'success');
    }
  };

  const handleResetEvents = () => {
    setEvents(defaultEvents);
    setVenues(defaultVenues);
    try {
      localStorage.setItem('oakville_events', JSON.stringify(defaultEvents));
      localStorage.setItem('oakville_venues', JSON.stringify(defaultVenues));
    } catch (err) {
      console.warn(err);
    }
    addToast('Event schedule reset to initial 14 events!', 'success');
  };

  const [cloudActive, setCloudActive] = useState(false);
  const [clubs, setClubs] = useState(cloudApiEnabled ? [] : [clubBrand]);
  const [currentClub, setCurrentClub] = useState(() => {
    if (isPreviewMode) {
      const defaultName = formatClubNameFromSlug(previewClubCode);
      return {
        id: previewClubCode,
        name: defaultName,
        subtitle: `${defaultName.toUpperCase()} - PRIVATE GALLERY`,
        logo: '/club-photo-hub-mark.svg',
        organizationType: 'Private Club'
      };
    }
    if (demoMode) return demoClub;
    return null;
  });
  const [startupError, setStartupError] = useState('');
  const [cameraFiles, setCameraFiles] = useState(null);
  const [showClubOnboarding, setShowClubOnboarding] = useState(() => new URLSearchParams(window.location.search).get('onboard') === 'club');
  const [claimModalOpen, setClaimModalOpen] = useState(false);
  const [claimSubmitted, setClaimSubmitted] = useState(false);
  const [claimForm, setClaimForm] = useState({ name: '', email: '', phone: '' });

  useEffect(() => {
    if (!previewClubCode) return;
    const fetchLeadDetails = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'https://pictide-api.summer-wind-c5c6.workers.dev';
        const res = await fetch(`${apiUrl}/api/leads/preview?code=${encodeURIComponent(previewClubCode)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.lead) {
            const rawClubName = data.lead.club_name ? data.lead.club_name.split('(')[0].trim() : formatClubNameFromSlug(previewClubCode);
            const leadDomain = data.lead.contact_email ? data.lead.contact_email.split('@')[1] : null;
            setCurrentClub({
              id: data.lead.lead_code || previewClubCode,
              name: rawClubName,
              subtitle: `${rawClubName.toUpperCase()} - PRIVATE GALLERY`,
              logo: leadDomain ? `https://logo.clearbit.com/${leadDomain}` : '/club-photo-hub-mark.svg',
              organizationType: data.lead.organization_type || 'Private Club'
            });
            if (data.lead.contact_first_name && data.lead.contact_first_name !== 'General') {
              setClaimForm(prev => ({
                ...prev,
                name: `${data.lead.contact_first_name} ${data.lead.contact_last_name || ''}`.trim(),
                email: data.lead.contact_email || ''
              }));
            }
          }
        }
      } catch (err) {
        console.warn('Failed to load lead preview:', err);
      }
    };
    fetchLeadDetails();
  }, [previewClubCode]);
  const [subscriptionStatus, setSubscriptionStatus] = useState(() => {
    try {
      return localStorage.getItem('oakville_plan_status') || 'active';
    } catch {
      return 'active';
    }
  });

  const trialDaysLeft = subscriptionStatus !== 'active' && currentClub?.planStatus === 'trialing' && currentClub.trialEndsAt
    ? Math.max(0, Math.ceil((Date.parse(currentClub.trialEndsAt) - Date.now()) / (24 * 60 * 60 * 1000)))
    : null;

  const handleUpdateSubscription = (newStatus) => {
    setSubscriptionStatus(newStatus);
    try {
      localStorage.setItem('oakville_plan_status', newStatus);
    } catch (e) {}
    setCurrentClub(prev => prev ? { ...prev, planStatus: newStatus } : prev);
    if (newStatus === 'active') {
      addToast('Subscription status set to Active! Trial banner cleared.', 'success');
    } else {
      addToast(`Subscription status updated to ${newStatus}`, 'info');
    }
  };

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
    if (demoMode || isPreviewMode) return;
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
  }, [demoMode, isPreviewMode, directClubId]);

  useEffect(() => {
    if (demoMode || isPreviewMode) return;
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
    if (!demoMode && !isPreviewMode) return;
    const admin = view === 'admin';
    setDemoAdminView(admin);
    setCurrentUser(admin ? demoAdminUser : demoUser);
    setIsAdmin(admin);
    setActiveTab(admin ? 'admin' : 'gallery');

    // Keep the preview link shareable without causing a navigation or reload.
    const nextUrl = new URL(window.location.href);
    if (admin) nextUrl.searchParams.set('demoView', 'admin');
    else nextUrl.searchParams.set('demoView', 'member');
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
    const userNum = currentUser?.memberNumber || (isAdmin ? 'admin' : null);
    if (!userNum) return;
    const photo = photos.find(item => item.id === photoId);
    if (!photo) return;
    if (demoMode || !cloudActive) {
      const heartUsers = photo.heartUsers || [];
      const hasLiked = heartUsers.includes(userNum);
      const nextUsers = hasLiked ? heartUsers.filter(user => user !== userNum) : [...heartUsers, userNum];
      setPhotos(previous => previous.map(item => item.id === photoId ? { ...item, hearts: nextUsers.length, heartUsers: nextUsers } : item));
      if (!cloudActive) await savePhoto({ ...photo, hearts: nextUsers.length, heartUsers: nextUsers });
    } else if (cloudActive) {
      const result = await toggleCloudHeart(photoId, userNum);
      setPhotos(prev => prev.map(item => item.id === photoId ? { ...item, ...result } : item));
    }
  };

  const handleReportPhoto = async (photoId, reason) => {
    if (demoMode || isPreviewMode || !cloudActive) {
      addToast('Report submitted. Club PhotoHub and your organization administrator have been notified.', 'success');
      return;
    }
    await reportCloudPhoto(photoId, reason);
    addToast('Report submitted. Club PhotoHub and your organization administrator have been notified.', 'success');
  };

  const handleBlockMember = async (memberNumber, photoId, reason) => {
    if (!memberNumber || memberNumber === currentUser?.memberNumber) return;
    const previousPhotos = photos;
    setPhotos(items => items.filter(photo => photo.uploaderId !== memberNumber));
    try {
      if (!demoMode && !isPreviewMode && cloudActive) await blockCloudMember(memberNumber, photoId, reason);
      addToast('Member blocked. Their content was removed from your feed and Club PhotoHub was notified.', 'success');
    } catch (error) {
      setPhotos(previousPhotos);
      throw error;
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
      {isPreviewMode ? (
        <div className="preview-top-bar">
          <div className="preview-bar-left">
            <img src={platformBrand.mark} alt="Club PhotoHub" className="preview-bar-logo" />
            <span className="preview-bar-title">{currentClub?.name || 'Club'}</span>
          </div>
          <div className="preview-view-toggle" role="tablist" aria-label="Preview View Toggle">
            <button
              type="button"
              role="tab"
              aria-selected={!demoAdminView}
              className={!demoAdminView ? 'active' : ''}
              onClick={() => handleDemoViewChange('member')}
            >
              Member view
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={demoAdminView}
              className={demoAdminView ? 'active' : ''}
              onClick={() => handleDemoViewChange('admin')}
            >
              Admin view
            </button>
          </div>
          <div className="preview-bar-right">
            <button type="button" className="preview-claim-cta" onClick={() => setClaimModalOpen(true)}>
              Claim Workspace <span className="desktop-only-inline">for {currentClub?.name}</span> →
            </button>
          </div>
        </div>
      ) : (
        <>
          <Header user={currentUser} club={currentClub || clubBrand} isAdmin={isAdmin} activeTab={activeTab} setActiveTab={setActiveTab} onLogout={handleLogout} />
          {demoMode && (
            <div className="demo-mode-banner">
              <div className="demo-banner-copy">
                <span><Sparkles size={14} /> Exploring the interactive Demo Club</span>
                <a href="/book-demo">See this for your club →</a>
              </div>
              <div className="demo-view-switcher" role="tablist" aria-label="Demo view">
                <button type="button" role="tab" aria-selected={!demoAdminView} className={!demoAdminView ? 'active' : ''} onClick={() => handleDemoViewChange('member')}>Member view</button>
                <button type="button" role="tab" aria-selected={demoAdminView} className={demoAdminView ? 'active' : ''} onClick={() => handleDemoViewChange('admin')}>Admin view</button>
              </div>
            </div>
          )}
        </>
      )}
      {!demoMode && trialDaysLeft !== null && currentUser?.role === 'owner' && <div className={`trial-status-banner ${trialDaysLeft === 0 ? 'expired' : ''}`}><span>{trialDaysLeft > 0 ? `${trialDaysLeft} days left in your free trial` : 'Your trial has ended. This workspace is now read-only.'}</span>{Capacitor.isNativePlatform() ? <span>Billing is managed outside the iOS app.</span> : <a href="/pricing#pricing-links">Choose a plan</a>}</div>}
      <main className="content-wrapper">
        <Suspense fallback={<div className="panel-loading" role="status"><div className="spinner" /><span>Loading…</span></div>}>
          {activeTab === 'gallery' && <PhotoGallery photos={photos} albums={albums} currentUser={currentUser} isAdmin={isAdmin} onHeartPhoto={handleHeartPhoto} onDeletePhoto={handleDeletePhoto} onReportPhoto={handleReportPhoto} onBlockMember={handleBlockMember} onAddAlbum={handleAddAlbum} onUpdateAlbum={handleUpdateAlbum} onDeleteAlbum={handleDeleteAlbum} onMovePhotosToAlbum={handleMovePhotosToAlbum} onSelectTab={setActiveTab} addToast={addToast} />}
          {activeTab === 'upload' && <PhotoUpload user={currentUser} albums={albums} initialFiles={cameraFiles} onInitialFilesConsumed={() => setCameraFiles(null)} onUploadSuccess={handleUploadPhoto} addToast={addToast} />}
          {activeTab === 'profile' && <MemberProfile user={currentUser} club={currentClub || clubBrand} photos={photos} onLogout={handleLogout} />}
          {activeTab === 'admin' && isAdmin && <AdminPortal user={currentUser} club={currentClub || clubBrand} members={members} photos={photos} events={events} venues={venues} onAddEvent={handleAddEvent} onUpdateEvent={handleUpdateEvent} onDeleteEvent={handleDeleteEvent} onAddVenue={handleAddVenue} onResetEvents={handleResetEvents} onUpdateClub={handleUpdateClub} onAddMember={handleAddMember} onAddMembers={handleAddMembers} onUpdateMember={handleUpdateMember} onDeleteMember={handleDeleteMember} onSetMemberPassword={handleSetMemberPassword} onDeletePhoto={handleDeletePhoto} onUpdatePhoto={handleUpdatePhoto} onHeartPhoto={handleHeartPhoto} firebaseConfig={cloudActive ? { provider: 'managed' } : null} onResetDatabase={handleResetDatabase} demoMode={demoMode || isPreviewMode} addToast={addToast} />}
          {activeTab === 'account' && <AccountSettings user={currentUser} club={currentClub || clubBrand} isAdmin={isAdmin} demoMode={demoMode} subscriptionStatus={subscriptionStatus} onUpdateSubscription={handleUpdateSubscription} onDeleteAccount={handleDeleteAccount} onDeleteOrganization={handleDeleteOrganization} addToast={addToast} />}
        </Suspense>
      </main>
      {activeTab !== 'admin' && <MobileBottomNav activeTab={activeTab} setActiveTab={setActiveTab} />}
      <div className="toast-container">
        {toasts.map(toast => <div key={toast.id} className={`toast ${toast.type}`}>
          {toast.type === 'success' && <ShieldCheck size={16} />}
          {toast.type === 'error' && <AlertCircle size={16} />}
          {toast.type === 'info' && <Info size={16} />}
          <span>{toast.message}</span>
        </div>)}
      </div>

      {claimModalOpen && (
        <div className="preview-claim-modal-overlay" onClick={() => setClaimModalOpen(false)}>
          <div className="preview-claim-modal" onClick={e => e.stopPropagation()}>
            <button type="button" className="preview-modal-close" onClick={() => setClaimModalOpen(false)}>✕</button>
            {claimSubmitted ? (
              <div className="preview-claim-success">
                <ShieldCheck size={48} style={{ color: '#10b981', margin: '0 auto 16px auto' }} />
                <h2 style={{ fontSize: '1.4rem', color: '#0f172a', marginBottom: 8 }}>Workspace Claimed!</h2>
                <p style={{ color: '#64748b', fontSize: '0.92rem', marginBottom: 24, lineHeight: 1.5 }}>
                  Thank you! Mayank Saxena will reach out directly to set up your custom workspace domain for {currentClub?.name}.
                </p>
                <button type="button" className="btn-primary" onClick={() => setClaimModalOpen(false)} style={{ width: '100%', padding: '12px 20px', borderRadius: 99, background: '#0f172a', color: '#fff', border: 'none', fontWeight: 700, cursor: 'pointer' }}>
                  Explore Gallery
                </button>
              </div>
            ) : (
              <form onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const apiUrl = import.meta.env.VITE_API_URL || 'https://pictide-api.summer-wind-c5c6.workers.dev';
                  await fetch(`${apiUrl}/api/leads/claim`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      clubName: currentClub?.name || 'Granite Club',
                      name: claimForm.name,
                      email: claimForm.email,
                      phone: claimForm.phone,
                      leadCode: currentClub?.slug || 'granite-club'
                    })
                  });
                } catch (err) {
                  console.warn('Claim submission error:', err);
                }
                setClaimSubmitted(true);
                addToast(`Claim request sent for ${currentClub?.name || 'your club'}! We'll contact you shortly.`, 'success');
              }}>
                <h2 style={{ fontSize: '1.4rem', color: '#0f172a', marginBottom: 6, fontWeight: 800 }}>Activate {currentClub?.name} Workspace</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: 20 }}>
                  Start your 30-day trial for {currentClub?.name} members, staff & board of directors.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'left' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Your Full Name</label>
                    <input type="text" required value={claimForm.name} onChange={e => setClaimForm({ ...claimForm, name: e.target.value })} placeholder="John Smith" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Executive / Business Email</label>
                    <input type="email" required value={claimForm.email} onChange={e => setClaimForm({ ...claimForm, email: e.target.value })} placeholder="gm@graniteclub.com" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: '#334155', marginBottom: 4 }}>Phone (Optional)</label>
                    <input type="tel" value={claimForm.phone} onChange={e => setClaimForm({ ...claimForm, phone: e.target.value })} placeholder="(416) 555-0199" style={{ width: '100%', padding: '10px 14px', borderRadius: 8, border: '1px solid #cbd5e1', fontSize: '0.95rem' }} />
                  </div>
                  <button type="submit" style={{ width: '100%', marginTop: 8, padding: '12px 20px', borderRadius: 99, background: '#0f172a', color: '#fbbf24', border: 'none', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer' }}>
                    Activate 30-Day Free Trial →
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
