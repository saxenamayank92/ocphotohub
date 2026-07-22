import React from 'react';
import { LogOut, Image, Upload, Shield, User, Settings } from 'lucide-react';
import { platformBrand } from '../brand';

export default function Header({ user, club, isAdmin, activeTab, setActiveTab, onLogout }) {
  return (
    <header className="club-header">
      <div className="header-content">
        <div className="brand-section">
          <img
            src={platformBrand.mark}
            alt=""
            className="brand-logo brand-logo-platform"
          />
          <div className="brand-titles">
            <span className="brand-title">{platformBrand.name}</span>
            <span className="brand-subtitle">{club?.name || 'Private club'} · Private gallery</span>
          </div>
        </div>

        <nav className="header-nav">
          {isAdmin ? (
            <>
              <button
                onClick={() => setActiveTab('admin')}
                className={`tab-btn ${activeTab === 'admin' ? 'active' : ''}`}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Shield size={16} /> Admin Portal
                </span>
              </button>
              <button
                onClick={() => setActiveTab('gallery')}
                className={`tab-btn ${activeTab === 'gallery' ? 'active' : ''}`}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Image size={16} /> View Gallery
                </span>
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setActiveTab('gallery')}
                className={`tab-btn ${activeTab === 'gallery' ? 'active' : ''}`}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Image size={16} /> Member Gallery
                </span>
              </button>
              <button
                onClick={() => setActiveTab('upload')}
                className={`tab-btn ${activeTab === 'upload' ? 'active' : ''}`}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Upload size={16} /> Upload Photo
                </span>
              </button>
            </>
          )}
        </nav>

        <div className="user-controls">
          <button className={`user-badge ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')} aria-label="Account settings">
            {isAdmin ? <Shield size={14} /> : <User size={14} />}
            <span>
              {isAdmin ? 'Management' : `${user.firstName} ${user.lastName}`}
            </span>
            <Settings size={13} />
          </button>

          <button onClick={onLogout} className="btn-secondary header-signout" aria-label="Sign out">
            <LogOut size={14} /> Sign Out
          </button>
        </div>
      </div>
    </header>
  );
}
