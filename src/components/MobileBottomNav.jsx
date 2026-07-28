import React, { useRef } from 'react';
import { Image, Upload, Camera, User } from 'lucide-react';

export default function MobileBottomNav({ activeTab, setActiveTab, onDirectCameraCapture }) {
  const cameraInputRef = useRef(null);

  const handleCameraClick = () => {
    if (onDirectCameraCapture) {
      onDirectCameraCapture();
    } else if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  return (
    <nav className="mobile-bottom-nav">
      {/* Hidden camera input for direct native device camera capture */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/heic,image/heif,image/webp"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            if (onDirectCameraCapture) onDirectCameraCapture(e.target.files);
          }
        }}
      />

      {/* 1. Gallery */}
      <button
        type="button"
        className={`mobile-nav-item ${activeTab === 'gallery' ? 'active' : ''}`}
        onClick={() => setActiveTab('gallery')}
        aria-label="Gallery Feed"
      >
        <Image size={22} />
        <span>Gallery</span>
        {activeTab === 'gallery' && <div className="active-dot" />}
      </button>

      {/* 2. Upload */}
      <button
        type="button"
        className={`mobile-nav-item ${activeTab === 'upload' ? 'active' : ''}`}
        onClick={() => setActiveTab('upload')}
        aria-label="Upload Photos"
      >
        <Upload size={22} />
        <span>Upload</span>
        {activeTab === 'upload' && <div className="active-dot" />}
      </button>

      {/* 3. Camera (Direct Photo Capture) */}
      <button
        type="button"
        className="mobile-nav-item camera-action-item"
        onClick={handleCameraClick}
        aria-label="Take Photo"
      >
        <div className="camera-btn-circle">
          <Camera size={22} color="#ffffff" />
        </div>
        <span>Camera</span>
      </button>

      {/* 4. Profile */}
      <button
        type="button"
        className={`mobile-nav-item ${activeTab === 'profile' ? 'active' : ''}`}
        onClick={() => setActiveTab('profile')}
        aria-label="Member Profile"
      >
        <User size={22} />
        <span>Profile</span>
        {activeTab === 'profile' && <div className="active-dot" />}
      </button>
    </nav>
  );
}
