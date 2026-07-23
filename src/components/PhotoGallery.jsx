import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Heart, Trash2, X, Image as ImageIcon,
  Download, Search, LayoutGrid, Layers, Play
} from 'lucide-react';
import { photoDownloadName } from '../brand';
import StoryShowcase from './StoryShowcase';

export default function PhotoGallery({ photos, currentUser, isAdmin, onHeartPhoto, onDeletePhoto }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'popular' | 'oldest'
  const [layoutMode, setLayoutMode] = useState('grid'); // 'grid' | 'masonry'
  const [showStoryShowcase, setShowStoryShowcase] = useState(false);

  // Lightbox & Feed tracking
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(null);
  const modalFeedRef = useRef(null);

  // Reactions map (photoId -> { '❤️': count, '🔥': count, '👏': count })
  const [reactionsMap, setReactionsMap] = useState({});

  // Zoom & Pan State
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  const panStartRef = useRef({ x: 0, y: 0 });

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
    e.stopPropagation();
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
    e.stopPropagation();
    if (window.confirm('Are you sure you want to permanently delete this photo?')) {
      onDeletePhoto(photoId);
      if (activeLightboxPhoto && activeLightboxPhoto.id === photoId) {
        handleCloseLightbox();
      }
    }
  };

  const hasLiked = (photo) => photo.heartUsers?.includes(currentUser?.memberNumber);

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

          {/* Layout Toggle */}
          <div className="gallery-layout-toggle">
            <button 
              type="button" 
              className={`layout-btn ${layoutMode === 'grid' ? 'active' : ''}`}
              onClick={() => setLayoutMode('grid')}
              title="Grid View"
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              type="button" 
              className={`layout-btn ${layoutMode === 'masonry' ? 'active' : ''}`}
              onClick={() => setLayoutMode('masonry')}
              title="Masonry View"
            >
              <Layers size={16} />
            </button>
          </div>

          {/* Story Showcase Trigger */}
          <button 
            type="button" 
            className="story-trigger-btn"
            onClick={() => setShowStoryShowcase(true)}
          >
            <Play size={14} fill="currentColor" /> Club Story Mode
          </button>
        </div>
      </div>

      {/* Category Pills & Ownership Filter */}
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

      {/* Gallery Grid or Masonry */}
      {sortedPhotos.length > 0 ? (
        <div className={layoutMode === 'masonry' ? 'gallery-masonry' : 'gallery-grid photo-gallery-grid'}>
          {sortedPhotos.map(photo => {
            return (
              <button 
                key={photo.id} 
                type="button" 
                className={`photo-card gallery-grid-card ${layoutMode === 'masonry' ? 'masonry-card' : ''}`} 
                onClick={() => handleCardClick(photo)} 
                aria-label={`Open photo from ${photo.uploaderName || 'club member'}`}
              >
                <span className="photo-card-img-wrapper">
                  <img src={photo.url} alt={photo.caption} className="photo-card-img" loading="lazy" />
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
                      style={{ touchAction: index === activeLightboxIndex && zoomScale > 1 ? 'none' : 'pan-y' }}
                    >
                      <img 
                        src={photo.url} 
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
                          <a href={photo.downloadUrl || photo.url} download={photo.fileName || photoDownloadName(photo.category)} className="feed-action" aria-label="Download photo">
                            <Download size={22} />
                          </a>
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
    </div>
  );
}
