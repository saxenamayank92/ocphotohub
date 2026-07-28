import React from 'react';
import { Image, Upload, User } from 'lucide-react';

export default function MobileBottomNav({ activeTab, setActiveTab }) {
  return (
    <nav className="mobile-bottom-nav">
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

      {/* 2. Upload (center, elevated) */}
      <button
        type="button"
        className={`mobile-nav-item upload-center-item ${activeTab === 'upload' ? 'active' : ''}`}
        onClick={() => setActiveTab('upload')}
        aria-label="Upload Photos"
      >
        <div className="upload-btn-circle">
          <Upload size={22} color="#ffffff" />
        </div>
        <span>Upload</span>
      </button>

      {/* 3. Profile */}
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
