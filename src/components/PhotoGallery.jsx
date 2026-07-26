import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Heart, Trash2, X, Image as ImageIcon,
  Download, Search, LayoutGrid, ListFilter, Play, Flame, ThumbsUp, Star, ArrowLeft, Maximize2
} from 'lucide-react';
import { photoDownloadName } from '../brand';
import StoryShowcase from './StoryShowcase';

export default function PhotoGallery({ photos, currentUser, isAdmin, onHeartPhoto, onDeletePhoto }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'popular' | 'oldest'
  const [layoutMode, setLayoutMode] = useState('grid'); // 'grid' | 'feed' (Instagram style)
  const [showStoryShowcase, setShowStoryShowcase] = useState(false);

  // Lightbox & Feed tracking
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(null);
  const modalFeedRef = useRef(null);

  // Reactions map (photoId -> { '❤️': count, '🔥': count, '👏': count })
  const [reactionsMap, setReactionsMap] = useState({});

  // Native Pinch & Zoom State
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const panStartRef = useRef({ x: 0, y: 0 });
  const initialPinchDistRef = useRef(null);
  const initialScaleRef = useRef(1);

  const categories = ['All', 'General', 'Tennis', 'Golf', 'Dining', 'Clubhouse', 'Events'];

  // Filter photos based on search query, category, and ownership
  const filteredPhotos = photos.filter(photo => {
    const matchesCategory = selectedCategory === 'All' || photo.category === selectedCategory;
    const matchesUser = !showOnlyMine || photo.uploaderId === currentUser?.memberNumber;

    const query = searchQuery.trim().toLowerCase();
    const matchesSearch = !query || 
      photo.caption?.toLowerCase().includes(query) ||
      photo.uploaderName?.toLowerCase().includes(query) ||
      photo.category?.toLowerCase().includes(query);

    return matchesCategory && matchesUser && matchesSearch;
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
    else setZoomScale(2.5);
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

  // INSTAGRAM FEATURE: Tapping a grid thumbnail transitions directly to the scrollable feed at that photo!
  const handleGridThumbnailClick = (photo) => {
    const index = sortedPhotos.findIndex(p => p.id === photo.id);
    if (index !== -1) {
      setLayoutMode('feed');
      setTimeout(() => {
        const target = document.querySelector(`[data-feed-id="${photo.id}"]`);
        if (target) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 60);
    }
  };

  const handleOpenLightbox = (photo) => {
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

  const hasLiked = (photo) => photo.heartUsers?.includes(currentUser?.memberNumber);

  // Mouse & Touch Pan/Pinch events for Native Zoom
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

  // NATIVE 2-FINGER PINCH-TO-ZOOM GESTURE LISTENERS
  const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
      e.preventDefault(); // Lock page viewport, zoom picture only!
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      initialPinchDistRef.current = dist;
      initialScaleRef.current = zoomScale;
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length === 2 && initialPinchDistRef.current) {
      e.preventDefault(); // Keep container fixed!
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const ratio = dist / initialPinchDistRef.current;
      const newScale = Math.min(Math.max(initialScaleRef.current * ratio, 1.0), 4.0);
      setZoomScale(newScale);
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
      initialPinchDistRef.current = null;
    }
  };

  return (
    <div className="animate-fade-in">
      
      {/* Top Toolbar Controls & Search Bar */}
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

          {/* Instagram View Switcher: Grid vs Feed */}
          <div className="gallery-layout-toggle">
            <button
              type="button"
              className={`layout-btn ${layoutMode === 'grid' ? 'active' : ''}`}
              onClick={() => setLayoutMode('grid')}
              title="Instagram Thumbnail Grid View"
            >
              <LayoutGrid size={16} /> Grid
            </button>
            <button
              type="button"
              className={`layout-btn ${layoutMode === 'feed' ? 'active' : ''}`}
              onClick={() => setLayoutMode('feed')}
              title="Scrollable Feed View"
            >
              <ListFilter size={16} /> Feed
            </button>
          </div>
        </div>
      </div>

      {/* Category Pills & Filters */}
      <div className="category-bar-wrapper">
        <div className="category-pills">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="filter-options">
          {sortedPhotos.length > 0 && (
            <button
              type="button"
              className="btn-story-showcase"
              onClick={() => setShowStoryShowcase(true)}
              title="Watch full-screen animated story slideshow"
            >
              <Play size={13} fill="currentColor" /> Play Stories
            </button>
          )}

          <label className="checkbox-label mine-only-toggle">
            <input
              type="checkbox"
              checked={showOnlyMine}
              onChange={(e) => setShowOnlyMine(e.target.checked)}
            />
            <span>My Uploads</span>
          </label>
        </div>
      </div>

      {/* INSTAGRAM GRID VIEW TO SCROLLABLE FEED PRESENTATION */}
      {sortedPhotos.length > 0 ? (
        layoutMode === 'grid' ? (
          <div className="photo-grid instagram-grid">
            {sortedPhotos.map((photo) => {
              const userLiked = hasLiked(photo);
              return (
                <div
                  key={photo.id}
                  className="photo-card instagram-grid-card"
                  onClick={() => handleGridThumbnailClick(photo)}
                >
                  <div className="photo-card-image-wrapper">
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="photo-card-image"
                      loading="lazy"
                    />
                    <div className="photo-card-overlay">
                      <div className="overlay-meta">
                        <span>❤️ {photo.hearts || 0}</span>
                      </div>
                      <span className="grid-hover-hint">Tap to View Feed</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* INSTAGRAM SCROLLABLE FEED VIEW */
          <div className="photo-feed instagram-feed-list">
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ borderRadius: '20px', padding: '6px 16px', fontSize: '12px', background: '#fff', border: '1px solid var(--club-gold)', color: 'var(--club-navy)', display: 'flex', alignItems: 'center', gap: '6px', fontWeight: '700' }}
                onClick={() => setLayoutMode('grid')}
              >
                <ArrowLeft size={14} /> Back to Thumbnail Grid
              </button>
            </div>

            {sortedPhotos.map((photo, index) => {
              const isOwner = currentUser && photo.uploaderId === currentUser.memberNumber;
              const canDelete = isAdmin || isOwner;
              const userLiked = hasLiked(photo);

              return (
                <article key={photo.id} data-feed-id={photo.id} className="photo-post instagram-photo-post">
                  <header className="photo-post-header">
                    <div className="photo-post-avatar" aria-hidden="true">
                      {(photo.uploaderName || 'C').trim().charAt(0).toUpperCase()}
                    </div>
                    <div className="photo-post-author">
                      <strong>{photo.uploaderName || 'Club Member'}</strong>
                      <span>{new Date(photo.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                    </div>
                    <span className="photo-post-category">{photo.category}</span>
                  </header>

                  <div className="photo-post-image-container" onClick={() => handleOpenLightbox(photo)} title="Tap for Pinch-to-Zoom Lightbox">
                    <img
                      src={photo.url}
                      alt={photo.caption}
                      className="photo-post-image"
                      loading={index < 4 ? 'eager' : 'lazy'}
                    />
                    <button className="zoom-hint-pill" type="button" onClick={(e) => { e.stopPropagation(); handleOpenLightbox(photo); }}>
                      <Maximize2 size={12} /> Pinch & Zoom
                    </button>
                  </div>

                  <div className="photo-post-body">
                    <div className="photo-post-actions-wrapper">
                      <div className="photo-post-actions">
                        <button
                          type="button"
                          className={`feed-action ${userLiked ? 'liked' : ''}`}
                          onClick={(e) => handleHeartClick(e, photo.id)}
                          disabled={isAdmin}
                          aria-label="Like photo"
                        >
                          <Heart size={22} fill={userLiked ? 'currentColor' : 'none'} />
                          <span>{photo.hearts || 0}</span>
                        </button>

                        <a href={photo.downloadUrl || photo.url} download={photo.fileName || photoDownloadName(photo.category)} className="feed-action" title="Download photo">
                          <Download size={22} />
                        </a>

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

      {/* NATIVE PINCH & ZOOM LIGHTBOX MODAL */}
      {activeLightboxPhoto && createPortal(
        <div className="lightbox-backdrop" onClick={handleCloseLightbox}>
          <div className="instagram-lightbox" onClick={e => e.stopPropagation()}>
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
                      className="instagram-photo-image-wrap" 
                      onMouseDown={index === activeLightboxIndex ? handleMouseDown : undefined} 
                      onMouseMove={index === activeLightboxIndex ? handleMouseMove : undefined} 
                      onMouseUp={index === activeLightboxIndex ? handleMouseUp : undefined} 
                      onMouseLeave={index === activeLightboxIndex ? handleMouseUp : undefined} 
                      onTouchStart={index === activeLightboxIndex ? handleTouchStart : undefined}
                      onTouchMove={index === activeLightboxIndex ? handleTouchMove : undefined}
                      onTouchEnd={index === activeLightboxIndex ? handleTouchEnd : undefined}
                      style={{ touchAction: index === activeLightboxIndex && zoomScale > 1 ? 'none' : 'pan-y', position: 'relative', overflow: 'hidden' }}
                    >
                      <img 
                        src={photo.url} 
                        alt={photo.caption} 
                        className="photo-post-image" 
                        loading={index === activeLightboxIndex ? 'eager' : 'lazy'} 
                        style={index === activeLightboxIndex ? { transform: `scale(${zoomScale}) translate(${panOffset.x / zoomScale}px, ${panOffset.y / zoomScale}px)`, transition: isPanning ? 'none' : 'transform 0.2s ease', cursor: zoomScale > 1 ? (isPanning ? 'grabbing' : 'grab') : 'zoom-in', width: '100%', display: 'block' } : undefined} 
                        onDoubleClick={index === activeLightboxIndex ? toggleZoom : undefined} 
                      />
                      {index === activeLightboxIndex && zoomScale > 1 && (
                        <span style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: '11px', fontWeight: '700', padding: '4px 8px', borderRadius: '12px', pointerEvents: 'none' }}>
                          {(zoomScale).toFixed(1)}x Zoom
                        </span>
                      )}
                    </div>

                    <div className="photo-post-body">
                      <div className="photo-post-actions-wrapper">
                        <div className="photo-post-actions">
                          <button type="button" className={`feed-action ${userLiked ? 'liked' : ''}`} onClick={e => handleHeartClick(e, photo.id)} disabled={isAdmin} aria-label="Like photo">
                            <Heart size={22} fill={userLiked ? 'currentColor' : 'none'} />
                            <span>{photo.hearts || 0}</span>
                          </button>
                          <a href={photo.downloadUrl || photo.url} download={photo.fileName || photoDownloadName(photo.category)} className="feed-action" aria-label="Download photo">
                            <Download size={22} />
                          </a>
                          {canDelete && (
                            <button type="button" className="feed-action feed-delete" onClick={e => handleDeleteClick(e, photo.id)} aria-label="Delete photo">
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
          </div>
        </div>, 
        document.body
      )}
    </div>
  );
}
