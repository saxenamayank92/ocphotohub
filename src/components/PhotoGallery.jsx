import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Heart, Trash2, X, Image as ImageIcon,
  Download
} from 'lucide-react';
import { photoDownloadName } from '../brand';

export default function PhotoGallery({ photos, currentUser, isAdmin, onHeartPhoto, onDeletePhoto }) {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showOnlyMine, setShowOnlyMine] = useState(false);

  // Lightbox index tracking
  const [activeLightboxIndex, setActiveLightboxIndex] = useState(null);
  const modalFeedRef = useRef(null);

  // Zoom & Pan State
  const [zoomScale, setZoomScale] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);

  // Refs for tracking mouse and touch coordinates
  const panStartRef = useRef({ x: 0, y: 0 });
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const touchStartOffset = useRef({ x: 0, y: 0 });
  const lastTouchDistance = useRef(null);
  const lastTapTime = useRef(0);

  const categories = ['All', 'General', 'Tennis', 'Golf', 'Dining', 'Clubhouse', 'Events'];

  // Filter photos based on category and ownership
  const filteredPhotos = photos.filter(photo => {
    const matchesCategory = selectedCategory === 'All' || photo.category === selectedCategory;
    const matchesUser = !showOnlyMine || photo.uploaderId === currentUser?.memberNumber;
    return matchesCategory && matchesUser;
  });

  // Sort photos: newest first
  const sortedPhotos = [...filteredPhotos].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  const activeLightboxPhoto = activeLightboxIndex !== null ? sortedPhotos[activeLightboxIndex] : null;

  useEffect(() => {
    if (activeLightboxIndex === null) return;
    const target = modalFeedRef.current?.querySelector(`[data-photo-index="${activeLightboxIndex}"]`);
    target?.scrollIntoView({ block: 'start' });
  }, [activeLightboxIndex]);

  // Zoom management
  const resetZoom = () => {
    setZoomScale(1);
    setPanOffset({ x: 0, y: 0 });
    setIsPanning(false);
  };

  const toggleZoom = () => {
    if (zoomScale > 1) {
      resetZoom();
    } else {
      setZoomScale(2);
    }
  };

  const touchDistance = (touches) => {
    const [first, second] = touches;
    return Math.hypot(second.clientX - first.clientX, second.clientY - first.clientY);
  };

  // Navigations
  const handleNext = () => {
    if (sortedPhotos.length <= 1) return;
    setActiveLightboxIndex(prev => (prev + 1) % sortedPhotos.length);
    resetZoom();
  };

  const handlePrev = () => {
    if (sortedPhotos.length <= 1) return;
    setActiveLightboxIndex(prev => (prev - 1 + sortedPhotos.length) % sortedPhotos.length);
    resetZoom();
  };

  // Bind keyboard listeners
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (activeLightboxIndex === null) return;
      if (e.key === 'Escape') {
        handleCloseLightbox();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeLightboxIndex, sortedPhotos.length]);

  const handleHeartClick = (e, photoId) => {
    e.stopPropagation(); // Prevent opening lightbox
    if (currentUser?.memberNumber === 'admin') return;
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

  const hasLiked = (photo) => {
    return photo.heartUsers?.includes(currentUser?.memberNumber);
  };

  // --- MOUSE DRAG / PANNING ---
  const handleMouseDown = (e) => {
    if (zoomScale === 1) return;
    e.preventDefault(); // prevent native image dragging ghost
    setIsPanning(true);
    panStartRef.current = {
      x: e.clientX - panOffset.x,
      y: e.clientY - panOffset.y
    };
  };

  const handleMouseMove = (e) => {
    if (!isPanning || zoomScale === 1) return;
    setPanOffset({
      x: e.clientX - panStartRef.current.x,
      y: e.clientY - panStartRef.current.y
    });
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  // --- MOBILE TOUCH SWIPE & PANNING ---
  const handleTouchStart = (e) => {
    if (e.touches.length > 1) {
      lastTouchDistance.current = touchDistance(e.touches);
      setIsPanning(false);
      return;
    }

    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;

    if (zoomScale > 1) {
      setIsPanning(true);
      touchStartOffset.current = { ...panOffset };
    }
  };

  const handleTouchMove = (e) => {
    if (e.touches.length > 1) {
      e.preventDefault();
      const distance = touchDistance(e.touches);
      if (lastTouchDistance.current) {
        setZoomScale(current => Math.min(4, Math.max(1, current * (distance / lastTouchDistance.current))));
      }
      lastTouchDistance.current = distance;
      return;
    }

    const touch = e.touches[0];

    if (zoomScale > 1 && isPanning) {
      // Prevent screen scroll when panning zoomed image
      e.preventDefault();
      const deltaX = touch.clientX - touchStartX.current;
      const deltaY = touch.clientY - touchStartY.current;
      setPanOffset({
        x: touchStartOffset.current.x + deltaX,
        y: touchStartOffset.current.y + deltaY
      });
    }
  };

  const handleTouchEnd = (e) => {
    if (e.touches.length > 0) return;

    if (lastTouchDistance.current) {
      lastTouchDistance.current = null;
      setIsPanning(false);
      return;
    }

    const touch = e.changedTouches[0];
    const diffX = touch.clientX - touchStartX.current;
    const diffY = touch.clientY - touchStartY.current;
    const now = Date.now();
    const isDoubleTap = now - lastTapTime.current < 280 && Math.abs(diffX) < 20 && Math.abs(diffY) < 20;
    lastTapTime.current = now;

    if (isDoubleTap) {
      toggleZoom();
      return;
    }

    if (zoomScale > 1) {
      setIsPanning(false);
    } else {
      // Swipe gesture detection (only if scale is 1)
      // Swipe horizontally if delta X is prominent and delta Y is minor.
      if (Math.abs(diffX) > 60 && Math.abs(diffY) < 80) {
        if (diffX < 0) {
          handleNext();
        } else {
          handlePrev();
        }
      }
    }
  };

  return (
    <div className="animate-fade-in">
      {/* Filters Bar */}
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

      {/* Gallery grid; open a photo for the full scrollable feed */}
      {sortedPhotos.length > 0 ? (
        <div className="gallery-grid photo-gallery-grid">
          {sortedPhotos.map(photo => {
            return <button key={photo.id} type="button" className="photo-card gallery-grid-card" onClick={() => handleCardClick(photo)} aria-label={`Open photo from ${photo.uploaderName || 'club member'}`}>
              <span className="photo-card-img-wrapper">
                <img src={photo.url} alt={photo.caption} className="photo-card-img" loading="lazy" />
                <span className="photo-card-category">{photo.category}</span>
                <span className="photo-card-hearts"><Heart size={13} fill="currentColor" /> {photo.hearts || 0}</span>
              </span>
              <span className="photo-card-details">
                <span className="photo-card-caption"><strong>{photo.uploaderName || 'Club Member'}</strong> {photo.caption}</span>
                <span className="photo-card-footer"><span className="photo-card-uploader">{photo.uploaderName || 'Club Member'}</span><span className="photo-card-date">{new Date(photo.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span></span>
              </span>
            </button>;
          })}
        </div>
      ) : (
        <div className="gallery-empty">
          <ImageIcon size={48} />
          <p className="gallery-empty-text">No photos found</p>
          <p style={{ color: 'var(--club-gray-dark)', fontSize: '14px' }}>
            {showOnlyMine ? "You haven't uploaded any photos to this category yet." : "Be the first to upload a photo to this category!"}
          </p>
        </div>
      )}

      {/* Instagram-style scrollable photo view */}
      {activeLightboxPhoto && createPortal(
        <div className="lightbox-backdrop" onClick={handleCloseLightbox}>
          <div className="instagram-lightbox" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={handleCloseLightbox} title="Close photo view (Esc)"><X size={20} /></button>
            <div className="instagram-feed-scroll" ref={modalFeedRef}>
              {sortedPhotos.map((photo, index) => {
                const isOwner = currentUser && photo.uploaderId === currentUser.memberNumber;
                const canDelete = isAdmin || isOwner;
                const userLiked = hasLiked(photo);
                return <article key={photo.id} data-photo-index={index} className="photo-post instagram-photo-post">
                  <header className="photo-post-header">
                    <div className="photo-post-avatar" aria-hidden="true">{(photo.uploaderName || 'C').trim().charAt(0).toUpperCase()}</div>
                    <div className="photo-post-author"><strong>{photo.uploaderName || 'Club Member'}</strong><span>{new Date(photo.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>
                    <span className="photo-post-category">{photo.category}</span>
                  </header>
                  <div className="instagram-photo-image-wrap" onMouseDown={index === activeLightboxIndex ? handleMouseDown : undefined} onMouseMove={index === activeLightboxIndex ? handleMouseMove : undefined} onMouseUp={index === activeLightboxIndex ? handleMouseUp : undefined} onMouseLeave={index === activeLightboxIndex ? handleMouseUp : undefined} onTouchStart={index === activeLightboxIndex ? handleTouchStart : undefined} onTouchMove={index === activeLightboxIndex ? handleTouchMove : undefined} onTouchEnd={index === activeLightboxIndex ? handleTouchEnd : undefined} style={{ touchAction: index === activeLightboxIndex && zoomScale > 1 ? 'none' : 'pan-y' }}><img src={photo.url} alt={photo.caption} className="photo-post-image" loading={index === activeLightboxIndex ? 'eager' : 'lazy'} style={index === activeLightboxIndex ? { transform: `scale(${zoomScale}) translate(${panOffset.x / zoomScale}px, ${panOffset.y / zoomScale}px)`, transition: isPanning ? 'none' : 'transform 0.25s ease', cursor: zoomScale > 1 ? (isPanning ? 'grabbing' : 'grab') : 'zoom-in' } : undefined} onDoubleClick={index === activeLightboxIndex ? toggleZoom : undefined} /></div>
                  <div className="photo-post-body">
                    <div className="photo-post-actions">
                      <button type="button" className={`feed-action ${userLiked ? 'liked' : ''}`} onClick={e => handleHeartClick(e, photo.id)} disabled={isAdmin} aria-label={userLiked ? 'Unlike photo' : 'Like photo'}><Heart size={22} fill={userLiked ? 'currentColor' : 'none'} /><span>{photo.hearts || 0}</span></button>
                      <a href={photo.downloadUrl || photo.url} download={photo.fileName || photoDownloadName(photo.category)} className="feed-action" aria-label="Download photo"><Download size={22} /></a>
                      {canDelete && <button type="button" className="feed-action feed-delete" onClick={e => handleDeleteClick(e, photo.id)} aria-label="Delete photo"><Trash2 size={21} /></button>}
                    </div>
                    <p className="photo-post-caption"><strong>{photo.uploaderName || 'Club Member'}</strong> {photo.caption}</p>
                  </div>
                </article>;
              })}
            </div>
          </div>
        </div>, document.body
      )}
    </div>
  );
}
