import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Capacitor } from '@capacitor/core';
import { Directory, Filesystem } from '@capacitor/filesystem';
import {
  Heart, Trash2, X, ChevronLeft, Image as ImageIcon,
  Download, Search, LayoutGrid, ListFilter, Play, Flag, UserX,
  Folder, FolderPlus, CheckSquare, Square, MoveRight, Plus, ArrowLeft, CheckCircle2, Edit3
} from 'lucide-react';
import { photoDownloadName } from '../brand';
import { fetchAuthenticatedPhoto, fetchAuthenticatedPhotoBlob, resolveApiUrl } from '../api';
import StoryShowcase from './StoryShowcase';

export default function PhotoGallery({
  photos,
  albums = [],
  currentUser,
  isAdmin,
  onHeartPhoto,
  onDeletePhoto,
  onReportPhoto,
  onBlockMember,
  onAddAlbum,
  onUpdateAlbum,
  onDeleteAlbum,
  onMovePhotosToAlbum,
  addToast
}) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'popular' | 'oldest'
  const [layoutMode, setLayoutMode] = useState('grid'); // 'grid' | 'feed' | 'albums'
  const [activeAlbumId, setActiveAlbumId] = useState(null);
  const [showCreateAlbumModal, setShowCreateAlbumModal] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState('');
  const [newAlbumDesc, setNewAlbumDesc] = useState('');

  // Edit Album Modal State
  const [editingAlbum, setEditingAlbum] = useState(null);
  const [editAlbumName, setEditAlbumName] = useState('');
  const [editAlbumDesc, setEditAlbumDesc] = useState('');

  // Moderator Multi-Select & Batch Move State
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedPhotoIds, setSelectedPhotoIds] = useState([]);
  const [batchMoveTargetAlbumId, setBatchMoveTargetAlbumId] = useState('');

  const [showStoryShowcase, setShowStoryShowcase] = useState(false);
  const [downloadingPhotoId, setDownloadingPhotoId] = useState(null);

  const isModerator = isAdmin || currentUser?.role === 'owner' || currentUser?.role === 'admin' || currentUser?.memberNumber === 'admin';

  const photoUrls = React.useMemo(() => {
    const map = {};
    for (const photo of photos) {
      map[photo.id] = resolveApiUrl(photo.url) || photo.url || '';
    }
    return map;
  }, [photos]);

  // Lightbox & Feed tracking
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(null);
  const [activeZoomId, setActiveZoomId] = useState(null);
  const modalFeedRef = useRef(null);

  // Reactions map (photoId -> { '❤️': count, '🔥': count, '👏': count })
  const [, setReactionsMap] = useState({});

  // Zoom & Pan State
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const panStartRef = useRef({ x: 0, y: 0 });
  const touchStartDistRef = useRef(null);
  const initialTouchScaleRef = useRef(1);
  const activeImageWrapRef = useRef(null);
  const lastTapRef = useRef(0);

  // Native iOS WebKit Pinch Gesture & Non-passive Touch listeners
  useEffect(() => {
    const el = activeImageWrapRef.current;
    if (!el) return;
    let baseScale = 1;
    let startDist = 0;
    let initialScale = 1;

    const getNativeDist = (e) => {
      if (e.touches.length < 2) return 0;
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      return Math.hypot(dx, dy);
    };

    const onGestureStart = (e) => {
      if (e.cancelable) e.preventDefault();
      baseScale = zoomScale;
    };

    const onGestureChange = (e) => {
      if (e.cancelable) e.preventDefault();
      const newScale = Math.min(Math.max(baseScale * e.scale, 1), 3.5);
      setZoomScale(newScale);
      if (newScale === 1) setPanOffset({ x: 0, y: 0 });
    };

    const onGestureEnd = (e) => {
      if (e.cancelable) e.preventDefault();
    };

    const onNativeTouchStart = (e) => {
      if (e.touches.length === 2) {
        if (e.cancelable) e.preventDefault();
        startDist = getNativeDist(e);
        initialScale = zoomScale;
      }
    };

    const onNativeTouchMove = (e) => {
      if (e.touches.length === 2 && startDist > 0) {
        if (e.cancelable) e.preventDefault();
        const currentDist = getNativeDist(e);
        if (currentDist > 0) {
          const ratio = currentDist / startDist;
          const newScale = Math.min(Math.max(initialScale * ratio, 1), 3.5);
          setZoomScale(newScale);
          if (newScale === 1) setPanOffset({ x: 0, y: 0 });
        }
      } else if (e.touches.length === 1 && zoomScale > 1) {
        if (e.cancelable) e.preventDefault();
      }
    };

    el.addEventListener('gesturestart', onGestureStart, { passive: false });
    el.addEventListener('gesturechange', onGestureChange, { passive: false });
    el.addEventListener('gestureend', onGestureEnd, { passive: false });
    el.addEventListener('touchstart', onNativeTouchStart, { passive: false });
    el.addEventListener('touchmove', onNativeTouchMove, { passive: false });

    return () => {
      el.removeEventListener('gesturestart', onGestureStart);
      el.removeEventListener('gesturechange', onGestureChange);
      el.removeEventListener('gestureend', onGestureEnd);
      el.removeEventListener('touchstart', onNativeTouchStart);
      el.removeEventListener('touchmove', onNativeTouchMove);
    };
  }, [activeLightboxIndex, activeZoomId, zoomScale]);

  const getTouchDistance = (e) => {
    if (e.touches.length < 2) return 0;
    const dx = e.touches[0].clientX - e.touches[1].clientX;
    const dy = e.touches[0].clientY - e.touches[1].clientY;
    return Math.hypot(dx, dy);
  };

  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      touchStartDistRef.current = getTouchDistance(e);
      initialTouchScaleRef.current = zoomScale;
    } else if (e.touches.length === 1 && zoomScale > 1) {
      setIsPanning(true);
      panStartRef.current = {
        x: e.touches[0].clientX - panOffset.x,
        y: e.touches[0].clientY - panOffset.y
      };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && touchStartDistRef.current) {
      if (e.cancelable) e.preventDefault();
      const currentDist = getTouchDistance(e);
      if (currentDist > 0) {
        const ratio = currentDist / touchStartDistRef.current;
        const newScale = Math.min(Math.max(initialTouchScaleRef.current * ratio, 1), 3.5);
        setZoomScale(newScale);
        if (newScale === 1) setPanOffset({ x: 0, y: 0 });
      }
    } else if (e.touches.length === 1 && isPanning && zoomScale > 1) {
      if (e.cancelable) e.preventDefault();
      setPanOffset({
        x: e.touches[0].clientX - panStartRef.current.x,
        y: e.touches[0].clientY - panStartRef.current.y
      });
    }
  };

  const handleTouchEnd = (e) => {
    const now = Date.now();
    if (now - lastTapRef.current < 300) {
      // Double tap to zoom in / reset
      toggleZoom();
    }
    lastTapRef.current = now;

    if (e.touches.length < 2) {
      touchStartDistRef.current = null;
    }
    if (e.touches.length === 0) {
      setIsPanning(false);
      if (activeZoomId && activeLightboxIndex === null) {
        resetZoom();
        setActiveZoomId(null);
      }
    }
  };

  const handleToggleSelectPhoto = (photoId, e) => {
    if (e) e.stopPropagation();
    setSelectedPhotoIds(prev =>
      prev.includes(photoId) ? prev.filter(id => id !== photoId) : [...prev, photoId]
    );
  };

  const handleSelectAll = () => {
    setSelectedPhotoIds(filteredPhotos.map(p => p.id));
  };

  const handleClearSelection = () => {
    setSelectedPhotoIds([]);
    setIsSelectMode(false);
  };

  const handleExecuteBatchMove = () => {
    if (selectedPhotoIds.length === 0) return;
    onMovePhotosToAlbum(selectedPhotoIds, batchMoveTargetAlbumId || null);
    setSelectedPhotoIds([]);
    setIsSelectMode(false);
  };

  const handleExecuteBatchDelete = () => {
    if (selectedPhotoIds.length === 0) return;
    if (window.confirm(`Permanently delete ${selectedPhotoIds.length} selected photo(s)?`)) {
      selectedPhotoIds.forEach(id => onDeletePhoto(id));
      setSelectedPhotoIds([]);
      setIsSelectMode(false);
      addToast(`Deleted ${selectedPhotoIds.length} photo(s).`, 'info');
    }
  };

  const handleCreateAlbumSubmit = (e) => {
    e.preventDefault();
    if (!newAlbumName.trim()) return;
    onAddAlbum({
      name: newAlbumName,
      description: newAlbumDesc
    });
    setNewAlbumName('');
    setNewAlbumDesc('');
    setShowCreateAlbumModal(false);
  };

  const handleOpenEditAlbum = (album, e) => {
    if (e) e.stopPropagation();
    setEditingAlbum(album);
    setEditAlbumName(album.name || '');
    setEditAlbumDesc(album.description || '');
  };

  const handleEditAlbumSubmit = (e) => {
    e.preventDefault();
    if (!editingAlbum || !editAlbumName.trim()) return;
    onUpdateAlbum?.(editingAlbum.id, {
      name: editAlbumName.trim(),
      description: editAlbumDesc.trim()
    });
    setEditingAlbum(null);
  };

  const handleDeleteAlbumClick = (albumId, e) => {
    if (e) e.stopPropagation();
    const album = albums.find(a => a.id === albumId);
    if (window.confirm(`Are you sure you want to delete the album "${album?.name || 'this album'}"? Photos in this album will remain in your club gallery as unassigned.`)) {
      if (activeAlbumId === albumId) {
        setActiveAlbumId(null);
        setLayoutMode('albums');
      }
      onDeleteAlbum?.(albumId);
    }
  };

  const categories = ['All', 'General', 'Tennis', 'Golf', 'Dining', 'Clubhouse', 'Events'];

  // Filter photos based on search query, category, album, and ownership
  const filteredPhotos = photos.filter(photo => {
    const matchesCategory = selectedCategory === 'All' || photo.category === selectedCategory;
    const matchesUser = !showOnlyMine || photo.uploaderId === currentUser?.memberNumber;
    const matchesAlbum = !activeAlbumId || photo.albumId === activeAlbumId;

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || 
      photo.caption?.toLowerCase().includes(query) ||
      photo.uploaderName?.toLowerCase().includes(query) ||
      photo.category?.toLowerCase().includes(query);

    return matchesCategory && matchesUser && matchesAlbum && matchesSearch;
  });

  // Sort photos
  const sortedPhotos = [...filteredPhotos].sort((a, b) => {
    if (sortBy === 'popular') {
      return (b.hearts || 0) - (a.hearts || 0);
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt) - new Date(b.createdAt);
    }
    return new Date(b.createdAt) - new Date(a.createdAt); // newest first
  });

  const activeLightboxPhoto = activeLightboxIndex !== null ? sortedPhotos[activeLightboxIndex] : null;

  useEffect(() => {
    if (activeLightboxIndex === null) return;
    const target = modalFeedRef.current?.querySelector(`[data-photo-index="${activeLightboxIndex}"]`);
    target?.scrollIntoView({ block: 'start' });
  }, [activeLightboxIndex]);

  const resetZoom = () => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
    setIsPanning(false);
  };

  const toggleZoom = () => {
    if (zoomScale > 1) resetZoom();
    else setZoomScale(2);
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeLightboxIndex === null) return;
      if (e.key === 'Escape') handleCloseLightbox();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxIndex, sortedPhotos.length]);

  const handleHeartClick = (e, photoId) => {
    if (e) e.stopPropagation();
    if (currentUser?.memberNumber === 'admin') return;
    onHeartPhoto(photoId);
  };

  const handleAddEmojiReaction = (photoId, emoji) => {
    if (currentUser?.memberNumber === 'admin') return;
    setReactionsMap(prev => {
      const current = prev[photoId] || {};
      const count = current[emoji] || 0;
      return {
        ...prev,
        [photoId]: { ...current, [emoji]: count + 1 }
      };
    });
    onHeartPhoto(photoId);
  };

  const handleCardClick = (photo) => {
    const index = sortedPhotos.findIndex(p => p.id === photo.id);
    if (index !== -1) {
      setActiveLightboxIndex(index);
      resetZoom();
    }
  };

  const handleCloseLightbox = () => {
    setActiveLightboxIndex(null);
    resetZoom();
  };

  const handleDeleteClick = (e, photoId) => {
    if (e) e.stopPropagation();
    if (window.confirm('Are you sure you want to permanently delete this photo?')) {
      onDeletePhoto(photoId);
      if (activeLightboxPhoto && activeLightboxPhoto.id === photoId) {
        handleCloseLightbox();
      }
    }
  };

  const handleReportClick = async (event, photo) => {
    event?.stopPropagation();
    const reason = window.prompt('Why are you reporting this photo?', 'Objectionable or abusive content');
    if (!reason?.trim()) return;
    try { await onReportPhoto(photo.id, reason.trim()); }
    catch (error) { addToast(error.message || 'Could not submit the report.', 'error'); }
  };

  const handleBlockClick = async (event, photo) => {
    event?.stopPropagation();
    if (!window.confirm(`Block ${photo.uploaderName || 'this member'}? Their content will be removed from your feed immediately and Club PhotoHub will be notified.`)) return;
    try { await onBlockMember(photo.uploaderId, photo.id, 'Abusive user blocked from photo'); }
    catch (error) { addToast(error.message || 'Could not block this member.', 'error'); }
  };

  const hasLiked = (photo) => photo.heartUsers?.includes(currentUser?.memberNumber);

  const blobToBase64 = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] || '');
    reader.onerror = () => reject(new Error('Could not prepare the photo for download.'));
    reader.readAsDataURL(blob);
  });

  const handleDownload = async (event, photo) => {
    event?.preventDefault();
    event?.stopPropagation();
    if (downloadingPhotoId === photo.id) return;

    setDownloadingPhotoId(photo.id);
    try {
      const blob = await fetchAuthenticatedPhotoBlob(photo.downloadUrl || photo.url);
      const requestedName = photo.fileName?.split('/').pop() || photoDownloadName(photo.category);
      const fileName = requestedName.replace(/[^a-zA-Z0-9._-]/g, '_');

      if (Capacitor.isNativePlatform()) {
        await Filesystem.writeFile({
          path: fileName,
          data: await blobToBase64(blob),
          directory: Directory.Documents,
          recursive: true
        });
        addToast?.('Photo saved to your device.', 'success');
      } else {
        const objectUrl = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = fileName;
        document.body.appendChild(anchor);
        anchor.click();
        anchor.remove();
        setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
      }
    } catch (error) {
      addToast?.(error.message || 'Download failed.', 'error');
    } finally {
      setDownloadingPhotoId(null);
    }
  };

  // Mouse & Touch Pan events
  const handleMouseDown = (e) => {
    if (zoomScale === 1) return;
    e.preventDefault();
    setIsPanning(true);
    panStartRef.current = { x: e.clientX - panOffset.x, y: e.clientY - panOffset.y };
  };

  const handleMouseMove = (e) => {
    if (!isPanning || zoomScale === 1) return;
    setPanOffset({ x: e.clientX - panStartRef.current.x, y: e.clientY - panStartRef.current.y });
  };

  const handleMouseUp = () => setIsPanning(false);

  return (
    <div className="animate-fade-in">
      
      {/* Enhanced Top Controls & Search Bar */}
      <div className="gallery-toolbar">
        <div className="gallery-search-group">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            className="gallery-search-input"
            placeholder="Search by caption, member, category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button type="button" className="search-clear-btn" onClick={() => setSearchQuery('')}>
              <X size={14} />
            </button>
          )}
        </div>

        <div className="gallery-toolbar-actions">
          {/* Sort Selector */}
          <select 
            className="select-field gallery-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="newest">Newest First</option>
            <option value="popular">Most Popular</option>
            <option value="oldest">Oldest First</option>
          </select>

          {/* Layout Toggle: Grid vs Feed vs Albums */}
          <div className="gallery-layout-toggle">
            <button 
              type="button" 
              className={`layout-btn ${layoutMode === 'grid' ? 'active' : ''}`}
              onClick={() => { setLayoutMode('grid'); }}
              title="Grid View"
            >
              <LayoutGrid size={16} /> Grid
            </button>
            <button 
              type="button" 
              className={`layout-btn ${layoutMode === 'feed' ? 'active' : ''}`}
              onClick={() => { setLayoutMode('feed'); }}
              title="Scroll Feed View"
            >
              <ListFilter size={16} /> Feed
            </button>
            <button 
              type="button" 
              className={`layout-btn ${layoutMode === 'albums' ? 'active' : ''}`}
              onClick={() => { setLayoutMode('albums'); setActiveAlbumId(null); }}
              title="Albums View"
            >
              <Folder size={16} /> Albums ({albums.length})
            </button>
          </div>

          {/* Moderator Multi-Select Toggle */}
          {isModerator && (
            <button
              type="button"
              className={`select-mode-btn ${isSelectMode ? 'active' : ''}`}
              onClick={() => {
                if (isSelectMode) handleClearSelection();
                else setIsSelectMode(true);
              }}
              title="Batch Select & Move Photos"
            >
              <CheckSquare size={14} /> {isSelectMode ? 'Cancel Select' : 'Select Photos'}
            </button>
          )}

          {/* Moderator Create Album Trigger */}
          {isModerator && (
            <button
              type="button"
              className="btn-gold-sm"
              onClick={() => setShowCreateAlbumModal(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 14px', borderRadius: 'var(--radius-md)', fontSize: '13px', fontWeight: '700' }}
            >
              <FolderPlus size={15} /> Create Album
            </button>
          )}

          {/* Story Showcase Trigger */}
          <button 
            type="button" 
            className="story-trigger-btn"
            onClick={() => setShowStoryShowcase(true)}
          >
            <Play size={14} fill="currentColor" /> Story Mode
          </button>
        </div>
      </div>

      {/* Active Album Banner */}
      {activeAlbumId && (
        <div className="album-detail-banner" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid rgba(200, 167, 107, 0.4)', marginBottom: '20px', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <button type="button" className="btn-secondary" onClick={() => { setActiveAlbumId(null); setLayoutMode('albums'); }} style={{ padding: '8px 14px', fontSize: '13px' }}>
              <ArrowLeft size={16} /> Back to Albums
            </button>
            <div className="album-detail-info">
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--club-green-dark)', margin: 0 }}>
                📁 {albums.find(a => a.id === activeAlbumId)?.name || 'Album'}
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--club-gray-dark)', margin: '2px 0 0' }}>
                {albums.find(a => a.id === activeAlbumId)?.description || ''} • ({filteredPhotos.length} photo{filteredPhotos.length === 1 ? '' : 's'})
              </p>
            </div>
          </div>

          {isModerator && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                onClick={(e) => handleOpenEditAlbum(albums.find(a => a.id === activeAlbumId), e)}
              >
                <Edit3 size={14} /> Edit Album
              </button>
              <button
                type="button"
                style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                onClick={(e) => handleDeleteAlbumClick(activeAlbumId, e)}
              >
                <Trash2 size={14} /> Delete Album
              </button>
            </div>
          )}
        </div>
      )}

      {/* Category Pills & Ownership Filter */}
      {layoutMode !== 'albums' && (
        <div className="gallery-controls">
          <div className="category-filter-pills">
            {categories.map(cat => (
              <button
                key={cat}
                className={`filter-pill ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>

          {!isAdmin && currentUser && (
            <div className="gallery-view-toggle">
              <button
                className={`gallery-view-btn ${!showOnlyMine ? 'active' : ''}`}
                onClick={() => setShowOnlyMine(false)}
              >
                All Photos
              </button>
              <button
                className={`gallery-view-btn ${showOnlyMine ? 'active' : ''}`}
                onClick={() => setShowOnlyMine(true)}
              >
                My Uploads
              </button>
            </div>
          )}
        </div>
      )}

      {/* Gallery Content: Albums Mode vs Grid Mode vs Feed Mode */}
      {layoutMode === 'albums' && !activeAlbumId ? (
        <div className="albums-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {albums.map(album => {
            const albumPhotos = photos.filter(p => p.albumId === album.id);
            const albumPhotoCount = albumPhotos.length;
            const coverPhoto = photoUrls[albumPhotos[0]?.id] || albumPhotos[0]?.url || album.coverUrl || 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?q=80&w=1200&auto=format&fit=crop';

            return (
              <div
                key={album.id}
                className="album-card"
                onClick={() => { setActiveAlbumId(album.id); setLayoutMode('grid'); }}
                style={{ background: '#ffffff', border: '1px solid rgba(220, 226, 224, 0.8)', borderRadius: 'var(--radius-lg)', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)', transition: 'all 0.2s ease' }}
              >
                <div className="album-card-cover" style={{ height: '180px', position: 'relative', overflow: 'hidden' }}>
                  <img src={coverPhoto} alt={album.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <span className="album-card-badge" style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'rgba(23, 34, 56, 0.85)', color: '#ffffff', padding: '4px 10px', borderRadius: '12px', fontSize: '11px', fontWeight: '700' }}>
                    {albumPhotoCount} photo{albumPhotoCount === 1 ? '' : 's'}
                  </span>
                </div>
                <div className="album-card-body" style={{ padding: '16px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px', marginBottom: '6px' }}>
                    <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--club-green-dark)', margin: 0 }}>📁 {album.name}</h3>
                    {isModerator && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={(e) => handleOpenEditAlbum(album, e)}
                          title="Edit album name/description"
                          style={{ background: 'rgba(0,0,0,0.05)', border: 'none', borderRadius: '4px', padding: '4px 6px', cursor: 'pointer', color: 'var(--club-green-dark)' }}
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteAlbumClick(album.id, e)}
                          title="Delete album"
                          style={{ background: 'rgba(239,68,68,0.1)', border: 'none', borderRadius: '4px', padding: '4px 6px', cursor: 'pointer', color: '#dc2626' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    )}
                  </div>
                  {album.description && <p style={{ fontSize: '13px', color: 'var(--club-gray-dark)', margin: '0 0 10px', lineHeight: '1.4' }}>{album.description}</p>}
                  <span className="album-card-meta" style={{ fontSize: '11px', color: 'var(--club-gold-dark)', fontWeight: '600' }}>Created by {album.createdBy || 'Moderator'}</span>
                </div>
              </div>
            );
          })}
        </div>
      ) : sortedPhotos.length > 0 ? (
        layoutMode === 'grid' ? (
          /* Grid View Mode */
          <div className="gallery-grid photo-gallery-grid">
            {sortedPhotos.map(photo => {
              const isSelected = selectedPhotoIds.includes(photo.id);

              return (
                <button 
                  key={photo.id} 
                  type="button" 
                  className={`photo-card gallery-grid-card ${isSelectMode && isSelected ? 'selected-card' : ''}`}
                  onClick={(e) => isSelectMode ? handleToggleSelectPhoto(photo.id, e) : handleCardClick(photo)} 
                  aria-label={`Open photo from ${photo.uploaderName || 'club member'}`}
                  style={isSelectMode && isSelected ? { outline: '3px solid var(--club-gold)', outlineOffset: '-3px' } : undefined}
                >
                  <span className="photo-card-img-wrapper" style={{ position: 'relative' }}>
                    <img src={photoUrls[photo.id] || resolveApiUrl(photo.url) || photo.url || undefined} alt={photo.caption} className="photo-card-img" loading="eager" decoding="async" />
                    {isSelectMode && (
                      <span className="photo-select-checkbox" style={{ position: 'absolute', top: '8px', left: '8px', zIndex: 5 }}>
                        {isSelected ? <CheckCircle2 size={24} color="#C8A76B" fill="#172238" /> : <Square size={22} color="#ffffff" />}
                      </span>
                    )}
                    <span className="photo-card-category">{photo.category}</span>
                    <span className="photo-card-hearts"><Heart size={13} fill="currentColor" /> {photo.hearts || 0}</span>
                  </span>
                  <span className="photo-card-details">
                    <span className="photo-card-caption"><strong>{photo.uploaderName || 'Club Member'}</strong> {photo.caption}</span>
                    <span className="photo-card-footer">
                      <span className="photo-card-uploader">{photo.uploaderName || 'Club Member'}</span>
                      <span className="photo-card-date">{new Date(photo.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        ) : (
          /* Scroll Feed View Mode */
          <div className="gallery-feed-container">
            {sortedPhotos.map(photo => {
              const isOwner = currentUser && photo.uploaderId === currentUser.memberNumber;
              const canDelete = isAdmin || isOwner;
              const userLiked = hasLiked(photo);
              const isSelected = selectedPhotoIds.includes(photo.id);

              return (
                <article key={photo.id} className={`feed-card-item ${isSelectMode && isSelected ? 'selected-card' : ''}`} style={isSelectMode && isSelected ? { outline: '3px solid var(--club-gold)' } : undefined}>
                  <header className="feed-card-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {isSelectMode && (
                        <button type="button" onClick={(e) => handleToggleSelectPhoto(photo.id, e)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                          {isSelected ? <CheckCircle2 size={24} color="#C8A76B" fill="#172238" /> : <Square size={22} color="#61706c" />}
                        </button>
                      )}
                      <div className="photo-post-avatar">{(photo.uploaderName || 'C').charAt(0).toUpperCase()}</div>
                      <div className="photo-post-author">
                        <strong>{photo.uploaderName || 'Club Member'}</strong>
                        <span>{new Date(photo.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                    </div>
                    <span className="photo-post-category">{photo.category}</span>
                  </header>

                  <div 
                    className="feed-card-image-wrap" 
                    ref={photo.id === activeZoomId ? activeImageWrapRef : null}
                    onClick={() => { if (zoomScale === 1) handleCardClick(photo); }}
                    onTouchStart={(e) => { setActiveZoomId(photo.id); handleTouchStart(e); }}
                    onTouchMove={photo.id === activeZoomId ? handleTouchMove : undefined}
                    onTouchEnd={photo.id === activeZoomId ? handleTouchEnd : undefined}
                    style={{ zIndex: photo.id === activeZoomId && zoomScale > 1 ? 10 : 1, position: 'relative' }}
                  >
                    <img 
                      src={photoUrls[photo.id] || resolveApiUrl(photo.url) || photo.url || undefined} 
                      alt={photo.caption} 
                      className="feed-card-img" 
                      loading="eager" 
                      decoding="async" 
                      style={photo.id === activeZoomId && zoomScale > 1 ? { transform: `scale(${zoomScale}) translate(${panOffset.x / zoomScale}px, ${panOffset.y / zoomScale}px)`, transition: isPanning ? 'none' : 'transform 0.25s ease', transformOrigin: 'center' } : undefined}
                    />
                  </div>

                  <div className="feed-card-body">
                    <div className="photo-post-actions-wrapper">
                      <div className="photo-post-actions">
                        <button 
                          type="button" 
                          className={`feed-action ${userLiked ? 'liked' : ''}`} 
                          onClick={(e) => handleHeartClick(e, photo.id)} 
                          disabled={isAdmin}
                        >
                          <Heart size={22} fill={userLiked ? 'currentColor' : 'none'} />
                          <span>{photo.hearts || 0}</span>
                        </button>
                        <button type="button" className="feed-action" onClick={e => handleDownload(e, photo)} title="Download photo" disabled={downloadingPhotoId === photo.id} aria-label="Download photo">
                          <Download size={22} />
                        </button>
                        {!isOwner && <>
                          <button type="button" className="feed-action" onClick={e => handleReportClick(e, photo)} title="Report objectionable content" aria-label="Report photo"><Flag size={20} /></button>
                          <button type="button" className="feed-action" onClick={e => handleBlockClick(e, photo)} title="Block abusive user" aria-label={`Block ${photo.uploaderName || 'member'}`}><UserX size={20} /></button>
                        </>}
                        {canDelete && (
                          <button type="button" className="feed-action feed-delete" onClick={(e) => handleDeleteClick(e, photo.id)} title="Delete photo">
                            <Trash2 size={21} />
                          </button>
                        )}
                      </div>

                      <div className="emoji-reaction-bar">
                        {['🔥', '👏', '🎾', '🥂', '⭐'].map(emoji => (
                          <button key={emoji} type="button" className="emoji-chip" onClick={() => handleAddEmojiReaction(photo.id, emoji)}>
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <p className="photo-post-caption"><strong>{photo.uploaderName || 'Club Member'}</strong> {photo.caption}</p>
                  </div>
                </article>
              );
            })}
          </div>
        )
      ) : (
        <div className="gallery-empty">
          <ImageIcon size={48} />
          <p className="gallery-empty-text">No photos match your filter</p>
          <p style={{ color: 'var(--club-gray-dark)', fontSize: '14px' }}>
            {searchQuery ? `No results for "${searchQuery}". Try clearing your search query.` : (showOnlyMine ? "You haven't uploaded any photos to this category yet." : "Be the first to upload a photo to this category!")}
          </p>
        </div>
      )}

      {/* Story Showcase Presentation Overlay */}
      {showStoryShowcase && (
        <StoryShowcase
          photos={sortedPhotos}
          initialIndex={0}
          onClose={() => setShowStoryShowcase(false)}
          onHeartPhoto={onHeartPhoto}
          currentUser={currentUser}
        />
      )}

      {/* Lightbox Modal View */}
      {activeLightboxPhoto && createPortal(
        <div className="lightbox-backdrop" onClick={handleCloseLightbox}>
          <div className="instagram-lightbox" onClick={e => e.stopPropagation()}>
            <div className="lightbox-mobile-topbar">
              <button type="button" className="lightbox-back-btn" onClick={handleCloseLightbox}>
                <ChevronLeft size={22} />
                <span>Back to gallery</span>
              </button>
              <button type="button" className="lightbox-close-icon-btn" onClick={handleCloseLightbox} aria-label="Close modal">
                <X size={22} />
              </button>
            </div>
            <button className="lightbox-close" onClick={handleCloseLightbox} title="Close photo view (Esc)"><X size={20} /></button>
            <div className="instagram-feed-scroll" ref={modalFeedRef}>
              {sortedPhotos.map((photo, index) => {
                const isOwner = currentUser && photo.uploaderId === currentUser.memberNumber;
                const canDelete = isAdmin || isOwner;
                const userLiked = hasLiked(photo);

                return (
                  <article key={photo.id} data-photo-index={index} className="photo-post instagram-photo-post">
                    <header className="photo-post-header">
                      <div className="photo-post-avatar" aria-hidden="true">{(photo.uploaderName || 'C').trim().charAt(0).toUpperCase()}</div>
                      <div className="photo-post-author">
                        <strong>{photo.uploaderName || 'Club Member'}</strong>
                        <span>{new Date(photo.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                      </div>
                      <span className="photo-post-category">{photo.category}</span>
                    </header>

                    <div 
                      ref={index === activeLightboxIndex ? activeImageWrapRef : null}
                      className="instagram-photo-image-wrap" 
                      onMouseDown={index === activeLightboxIndex ? handleMouseDown : undefined} 
                      onMouseMove={index === activeLightboxIndex ? handleMouseMove : undefined} 
                      onMouseUp={index === activeLightboxIndex ? handleMouseUp : undefined} 
                      onMouseLeave={index === activeLightboxIndex ? handleMouseUp : undefined}
                      onTouchStart={index === activeLightboxIndex ? handleTouchStart : undefined}
                      onTouchMove={index === activeLightboxIndex ? handleTouchMove : undefined}
                      onTouchEnd={index === activeLightboxIndex ? handleTouchEnd : undefined}
                      style={{ touchAction: 'none' }}
                    >
                      <img 
                        src={photoUrls[photo.id] || resolveApiUrl(photo.url) || photo.url || undefined}
                        alt={photo.caption} 
                        className="photo-post-image" 
                        loading={index === activeLightboxIndex ? 'eager' : 'lazy'} 
                        style={index === activeLightboxIndex ? { transform: `scale(${zoomScale}) translate(${panOffset.x / zoomScale}px, ${panOffset.y / zoomScale}px)`, transition: isPanning ? 'none' : 'transform 0.25s ease', cursor: zoomScale > 1 ? (isPanning ? 'grabbing' : 'grab') : 'zoom-in' } : undefined} 
                        onDoubleClick={index === activeLightboxIndex ? toggleZoom : undefined} 
                      />
                    </div>

                    <div className="photo-post-body">
                      {/* Action buttons & Emoji Bar */}
                      <div className="photo-post-actions-wrapper">
                        <div className="photo-post-actions">
                          <button type="button" className={`feed-action ${userLiked ? 'liked' : ''}`} onClick={e => handleHeartClick(e, photo.id)} disabled={isAdmin} aria-label="Like photo">
                            <Heart size={22} fill={userLiked ? 'currentColor' : 'none'} />
                            <span>{photo.hearts || 0}</span>
                          </button>
                          <button type="button" className="feed-action" onClick={e => handleDownload(e, photo)} aria-label="Download photo" disabled={downloadingPhotoId === photo.id}>
                            <Download size={22} />
                          </button>
                          {!isOwner && <>
                            <button type="button" className="feed-action" onClick={e => handleReportClick(e, photo)} aria-label="Report photo"><Flag size={20} /></button>
                            <button type="button" className="feed-action" onClick={e => handleBlockClick(e, photo)} aria-label={`Block ${photo.uploaderName || 'member'}`}><UserX size={20} /></button>
                          </>}
                          {canDelete && (
                            <button type="button" className="feed-action feed-delete" onClick={e => handleDeleteClick(e, photo.id)} aria-label="Delete photo">
                              <Trash2 size={21} />
                            </button>
                          )}
                        </div>

                        {/* Quick Emoji Reactions */}
                        <div className="emoji-reaction-bar">
                          {['🔥', '👏', '🎾', '🥂', '⭐'].map(emoji => (
                            <button key={emoji} type="button" className="emoji-chip" onClick={() => handleAddEmojiReaction(photo.id, emoji)}>
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>

                      <p className="photo-post-caption"><strong>{photo.uploaderName || 'Club Member'}</strong> {photo.caption}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>,
        document.body
      )}
      {/* Moderator Floating Batch Action Bar */}
      {isSelectMode && (
        <div className="batch-action-floating-bar" style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', zIndex: 999, background: '#172238', color: '#ffffff', padding: '14px 24px', borderRadius: '16px', boxShadow: '0 12px 36px rgba(0, 0, 0, 0.3)', display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap', border: '1px solid rgba(200, 167, 107, 0.4)' }}>
          <div className="batch-bar-left" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--club-gold-light)' }}>
              <CheckSquare size={16} style={{ display: 'inline', verticalAlign: 'text-bottom', marginRight: '4px' }} /> {selectedPhotoIds.length} photo(s) selected
            </span>
            <button type="button" className="btn-text" style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '12px', fontWeight: '600' }} onClick={handleSelectAll}>Select All ({filteredPhotos.length})</button>
          </div>

          <div className="batch-bar-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <select
                className="select-field"
                style={{ padding: '6px 12px', fontSize: '12px', background: '#263a5c', color: '#ffffff', border: '1px solid rgba(255, 255, 255, 0.3)' }}
                value={batchMoveTargetAlbumId}
                onChange={e => setBatchMoveTargetAlbumId(e.target.value)}
              >
                <option value="">Select Target Album...</option>
                <option value="">Unassigned (General Feed)</option>
                {albums.map(a => (
                  <option key={a.id} value={a.id}>📁 {a.name}</option>
                ))}
              </select>
              <button
                type="button"
                className="btn-gold-sm"
                onClick={handleExecuteBatchMove}
                disabled={selectedPhotoIds.length === 0}
                style={{ padding: '6px 14px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                <MoveRight size={14} /> Move Photos
              </button>
            </div>

            <button
              type="button"
              style={{ padding: '6px 12px', fontSize: '12px', background: 'rgba(239, 68, 68, 0.2)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.4)', borderRadius: 'var(--radius-md)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              onClick={handleExecuteBatchDelete}
              disabled={selectedPhotoIds.length === 0}
            >
              <Trash2 size={14} /> Delete
            </button>

            <button type="button" onClick={handleClearSelection} style={{ background: 'none', border: 'none', color: 'rgba(255, 255, 255, 0.6)', cursor: 'pointer', padding: '4px' }}>
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Create Album Modal */}
      {showCreateAlbumModal && (
        <div className="studio-modal-backdrop" onClick={() => setShowCreateAlbumModal(false)}>
          <div className="studio-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="studio-modal-header">
              <h3><FolderPlus size={18} /> Create New Album</h3>
              <button type="button" className="studio-close-btn" onClick={() => setShowCreateAlbumModal(false)}><X size={18} /></button>
            </div>
            <form onSubmit={handleCreateAlbumSubmit}>
              <div className="studio-modal-body" style={{ gap: '14px', padding: '20px' }}>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ fontWeight: '700', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Album Name</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Tennis Gala 2026, Regatta Highlights..."
                    value={newAlbumName}
                    onChange={e => setNewAlbumName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: '700', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Description (Optional)</label>
                  <textarea
                    className="input-field"
                    placeholder="Brief summary of event photos..."
                    value={newAlbumDesc}
                    onChange={e => setNewAlbumDesc(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <div className="studio-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowCreateAlbumModal(false)}>Cancel</button>
                <button type="submit" className="btn-gold"><FolderPlus size={16} /> Create Album</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Album Modal */}
      {editingAlbum && (
        <div className="studio-modal-backdrop" onClick={() => setEditingAlbum(null)}>
          <div className="studio-modal-card" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <div className="studio-modal-header">
              <h3><Edit3 size={18} /> Edit Album Details</h3>
              <button type="button" className="studio-close-btn" onClick={() => setEditingAlbum(null)}><X size={18} /></button>
            </div>
            <form onSubmit={handleEditAlbumSubmit}>
              <div className="studio-modal-body" style={{ gap: '14px', padding: '20px' }}>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label style={{ fontWeight: '700', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Album Name</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. Tennis Gala 2026"
                    value={editAlbumName}
                    onChange={e => setEditAlbumName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label style={{ fontWeight: '700', fontSize: '13px', display: 'block', marginBottom: '4px' }}>Description</label>
                  <textarea
                    className="input-field"
                    placeholder="Album description..."
                    value={editAlbumDesc}
                    onChange={e => setEditAlbumDesc(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <div className="studio-modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setEditingAlbum(null)}>Cancel</button>
                <button type="submit" className="btn-gold"><Edit3 size={16} /> Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
