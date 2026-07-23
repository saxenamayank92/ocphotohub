import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Play, Pause, ChevronLeft, ChevronRight, Heart, Sparkles, Volume2, VolumeX } from 'lucide-react';

export default function StoryShowcase({ photos, initialIndex = 0, onClose, onHeartPhoto, currentUser }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPlaying, setIsPlaying] = useState(true);
  const [progress, setProgress] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef(null);

  const currentPhoto = photos[currentIndex] || photos[0];
  const DURATION_MS = 5000; // 5 seconds per slide

  // Auto-advance timer logic
  useEffect(() => {
    if (!isPlaying || photos.length === 0) return;

    const interval = 50; // Update progress every 50ms
    const step = (interval / DURATION_MS) * 100;

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          setCurrentIndex((idx) => (idx + 1) % photos.length);
          return 0;
        }
        return prev + step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, photos.length, currentIndex]);

  // Reset progress when index changes manually
  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
    setProgress(0);
  };

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    setProgress(0);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') goToNext();
      if (e.key === 'ArrowLeft') goToPrev();
      if (e.key === ' ') {
        e.preventDefault();
        setIsPlaying((p) => !p);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [photos.length]);

  if (!currentPhoto) return null;

  const hasLiked = currentPhoto.heartUsers?.includes(currentUser?.memberNumber);

  return createPortal(
    <div className="story-showcase-overlay" onClick={onClose}>
      <div className="story-showcase-container" onClick={(e) => e.stopPropagation()}>
        
        {/* Dynamic Ambient Glow Background */}
        <div 
          className="story-ambient-backdrop" 
          style={{ backgroundImage: `url(${currentPhoto.url})` }}
        />

        {/* Top Header Controls & Multi-Progress Bars */}
        <div className="story-header-bar">
          <div className="story-progress-container">
            {photos.map((photo, idx) => {
              let fillWidth = '0%';
              if (idx < currentIndex) fillWidth = '100%';
              else if (idx === currentIndex) fillWidth = `${progress}%`;

              return (
                <div key={photo.id || idx} className="story-progress-track">
                  <div 
                    className="story-progress-fill" 
                    style={{ width: fillWidth, transition: idx === currentIndex ? 'width 0.05s linear' : 'none' }} 
                  />
                </div>
              );
            })}
          </div>

          <div className="story-user-row">
            <div className="story-author-info">
              <div className="story-avatar">
                {(currentPhoto.uploaderName || 'C').charAt(0).toUpperCase()}
              </div>
              <div className="story-author-details">
                <span className="story-author-name">{currentPhoto.uploaderName || 'Club Member'}</span>
                <span className="story-meta">{currentPhoto.category} • {new Date(currentPhoto.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
              </div>
            </div>

            <div className="story-actions">
              <button 
                type="button" 
                className="story-icon-btn" 
                onClick={() => setIsPlaying((p) => !p)} 
                title={isPlaying ? 'Pause Slideshow (Space)' : 'Play Slideshow (Space)'}
              >
                {isPlaying ? <Pause size={18} /> : <Play size={18} />}
              </button>

              <button 
                type="button" 
                className="story-icon-btn" 
                onClick={onClose} 
                title="Close Story Showcase (Esc)"
              >
                <X size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Main Stage & Navigation Hotspots */}
        <div className="story-main-stage">
          <button type="button" className="story-nav-btn prev" onClick={goToPrev} title="Previous photo (Left Arrow)">
            <ChevronLeft size={28} />
          </button>

          <div className="story-image-frame">
            <img 
              key={currentPhoto.id}
              src={currentPhoto.url} 
              alt={currentPhoto.caption} 
              className="story-image animate-pop-in"
            />
          </div>

          <button type="button" className="story-nav-btn next" onClick={goToNext} title="Next photo (Right Arrow)">
            <ChevronRight size={28} />
          </button>
        </div>

        {/* Footer Overlay: Caption & Reaction */}
        <div className="story-footer-bar">
          <div className="story-caption-block">
            <span className="story-badge"><Sparkles size={13} /> {currentPhoto.category}</span>
            <p className="story-caption">{currentPhoto.caption}</p>
          </div>

          <div className="story-like-widget">
            <button
              type="button"
              className={`story-heart-btn ${hasLiked ? 'liked' : ''}`}
              onClick={() => onHeartPhoto(currentPhoto.id)}
              disabled={currentUser?.memberNumber === 'admin'}
            >
              <Heart size={22} fill={hasLiked ? 'currentColor' : 'none'} />
              <span>{currentPhoto.hearts || 0}</span>
            </button>
          </div>
        </div>

      </div>
    </div>,
    document.body
  );
}
