import React from 'react';
import { User, Shield, Crown, Building2, LogOut, Image, Heart } from 'lucide-react';
import { platformBrand } from '../brand';

export default function MemberProfile({ user, club, photos = [], onLogout }) {
  const userPhotos = photos.filter(p => p.uploaderId === user?.memberNumber || p.uploaderName?.toLowerCase() === `${user?.firstName} ${user?.lastName}`.toLowerCase());
  const totalHearts = userPhotos.reduce((sum, p) => sum + (p.hearts || 0), 0);

  return (
    <div className="member-profile-container" style={{ maxWidth: '600px', margin: '0 auto', padding: '16px' }}>
      <div className="profile-card" style={{ background: '#ffffff', borderRadius: '16px', padding: '24px', boxShadow: '0 4px 20px rgba(23, 34, 56, 0.08)', border: '1px solid var(--club-gray)' }}>
        
        {/* Avatar & Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--club-navy), #243552)', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: '800', boxShadow: '0 4px 12px rgba(23, 34, 56, 0.2)' }}>
            {user?.firstName?.[0] || 'M'}{user?.lastName?.[0] || ''}
          </div>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: '800', color: 'var(--club-navy)' }}>
              {user?.firstName} {user?.lastName}
            </h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '13px', fontWeight: '700', color: 'var(--club-gold-dark)', background: '#FEF3C7', padding: '2px 8px', borderRadius: '6px' }}>
                Member #{user?.memberNumber}
              </span>
              <span style={{ fontSize: '12px', color: 'var(--club-gray-dark)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {user?.role === 'owner' ? <Crown size={14} color="#D97706" /> : user?.role === 'admin' ? <Shield size={14} color="#8B5CF6" /> : <User size={14} />}
                {user?.role === 'owner' ? 'Club Owner' : user?.role === 'admin' ? 'Staff Admin' : 'Club Member'}
              </span>
            </div>
          </div>
        </div>

        {/* Club Details */}
        <div style={{ background: '#F8FAFC', borderRadius: '12px', padding: '14px 16px', marginBottom: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Building2 size={18} color="var(--club-navy)" />
            <div>
              <span style={{ fontSize: '11px', color: 'var(--club-gray-dark)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: '700' }}>Your Club</span>
              <strong style={{ fontSize: '14px', color: 'var(--club-navy)' }}>{club?.name || platformBrand.name}</strong>
            </div>
          </div>
          <span style={{ fontSize: '11px', background: '#E2E8F0', color: '#475569', padding: '4px 8px', borderRadius: '12px', fontWeight: '700' }}>
            Active Member
          </span>
        </div>

        {/* Member Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div style={{ background: 'rgba(23, 34, 56, 0.04)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
            <Image size={20} color="var(--club-navy)" style={{ marginBottom: '4px' }} />
            <div style={{ fontSize: '20px', fontWeight: '800', color: 'var(--club-navy)' }}>{userPhotos.length}</div>
            <div style={{ fontSize: '11px', color: 'var(--club-gray-dark)', fontWeight: '600' }}>Photos Uploaded</div>
          </div>

          <div style={{ background: 'rgba(239, 68, 68, 0.05)', borderRadius: '12px', padding: '14px', textAlign: 'center' }}>
            <Heart size={20} color="#EF4444" style={{ marginBottom: '4px' }} />
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#DC2626' }}>{totalHearts}</div>
            <div style={{ fontSize: '11px', color: 'var(--club-gray-dark)', fontWeight: '600' }}>Hearts Received</div>
          </div>
        </div>

        {/* App Info & Sign Out */}
        <div style={{ borderTop: '1px solid var(--club-gray)', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '12px', color: 'var(--club-gray-dark)', textAlign: 'center' }}>
            {platformBrand.name} Native Mobile App · v1.0.0
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={onLogout}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', fontWeight: '700', color: 'var(--club-danger)', border: '1.5px solid rgba(239, 68, 68, 0.3)', background: 'rgba(239, 68, 68, 0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
          >
            <LogOut size={16} /> Sign Out of App
          </button>
        </div>

      </div>
    </div>
  );
}
