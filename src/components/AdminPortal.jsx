import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Users, Image as ImageIcon, Plus, Trash2,
  Upload, Database, CloudLightning, FileSpreadsheet, RefreshCw, BarChart3, X, Download, Building2
} from 'lucide-react';
import { photoDownloadName } from '../brand';

export default function AdminPortal({
  club, members, photos, onUpdateClub, onAddMember, onUpdateMember, onDeleteMember, onSetMemberPassword, onDeletePhoto,
  firebaseConfig, onResetDatabase, addToast
}) {
  const [activeSubTab, setActiveSubTab] = useState(members.length === 0 ? 'clubs' : 'dashboard');
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  // Member Form State
  const [newMemberNum, setNewMemberNum] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [clubName, setClubName] = useState(club.name);
  const [clubShortName, setClubShortName] = useState(club.shortName);
  const [clubLogoUrl, setClubLogoUrl] = useState(club.logoUrl || '');

  // CSV Import State
  const [csvText, setCsvText] = useState('');

  // Statistics calculations
  const totalPhotos = photos.length;
  const totalMembers = members.length;
  const registeredCount = members.filter(m => m.registeredAt).length;
  const totalLikes = photos.reduce((acc, p) => acc + (p.hearts || 0), 0);

  const topPhotos = [...photos]
    .filter(p => (p.hearts || 0) > 0)
    .sort((a, b) => (b.hearts || 0) - (a.hearts || 0))
    .slice(0, 3);

  // Category counts
  const categoryCounts = photos.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  const handleAddMemberSubmit = (e) => {
    e.preventDefault();
    if (!newMemberNum || !newLastName || !newFirstName || !/^\S+@\S+\.\S+$/.test(newEmail)) {
      addToast('Please fill out all member fields.', 'error');
      return;
    }

    // Check if member number already exists
    if (members.some(m => m.memberNumber.trim() === newMemberNum.trim())) {
      addToast(`Member number ${newMemberNum} already exists.`, 'error');
      return;
    }

    const newMember = {
      memberNumber: newMemberNum.trim(),
      lastName: newLastName.trim(),
      firstName: newFirstName.trim(),
      email: newEmail.trim().toLowerCase(),
      password: '',
      registeredAt: ''
    };

    onAddMember(newMember);
    addToast(`Member ${newFirstName} ${newLastName} added!`, 'success');

    // Clear inputs
    setNewMemberNum('');
    setNewLastName('');
    setNewFirstName('');
    setNewEmail('');
  };

  const handleCsvImportSubmit = (e) => {
    e.preventDefault();
    if (!csvText.trim()) {
      addToast('Please paste CSV text first.', 'error');
      return;
    }

    const lines = csvText.split('\n');
    let importCount = 0;
    let errorCount = 0;
    const newMembersList = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return; // Skip empty lines

      // Parse commas. Support quotes if needed, but a simple split works for standard lists
      const parts = trimmed.split(',').map(p => p.replace(/^["']|["']$/g, '').trim());

      // Expected: MemberNumber, LastName, FirstName, Email
      if (parts.length >= 4) {
        const memberNum = parts[0];
        const lName = parts[1];
        const fName = parts[2];
        const memberEmail = parts[3].toLowerCase();

        // Skip header if present
        if (memberNum.toLowerCase() === 'membernumber' || memberNum.toLowerCase() === 'number' || memberNum.toLowerCase() === 'id') {
          return;
        }

        // Validate duplicates
        if (!/^\S+@\S+\.\S+$/.test(memberEmail) ||
          members.some(m => m.memberNumber === memberNum) ||
          newMembersList.some(m => m.memberNumber === memberNum)
        ) {
          errorCount++;
          return;
        }

        newMembersList.push({
          memberNumber: memberNum,
          lastName: lName,
          firstName: fName,
          email: memberEmail,
          password: '',
          registeredAt: ''
        });
        importCount++;
      } else {
        errorCount++;
      }
    });

    if (newMembersList.length > 0) {
      newMembersList.forEach(m => onAddMember(m));
      addToast(`Roster imported! Added ${importCount} members. Skipped ${errorCount} duplicates/errors.`, 'success');
      setCsvText('');
    } else {
      addToast('No new valid members found in the pasted data. Check formatting.', 'error');
    }
  };

  const handleResetDatabaseClick = () => {
    if (window.confirm('WARNING: This will delete all custom members and photos and restore the original seed data. Do you want to continue?')) {
      onResetDatabase();
      addToast('Database reset to initial club seed data.', 'info');
    }
  };

  const handleClubSetupSubmit = async event => {
    event.preventDefault();
    if (clubName.trim().length < 2) return addToast('Enter a club name.', 'error');
    try {
      await onUpdateClub({ name: clubName.trim(), shortName: clubShortName.trim() || clubName.trim(), logoUrl: clubLogoUrl.trim() });
      addToast('Club branding updated.', 'success');
    } catch (error) { addToast(error.message || 'Could not update the club.', 'error'); }
  };

  return (
    <div className="admin-grid animate-fade-in">
      {/* Sidebar Panel */}
      <div className="admin-sidebar">
        <button
          className={`admin-menu-btn ${activeSubTab === 'clubs' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('clubs')}
        >
          <Building2 size={16} /> Club Setup
        </button>
        <button
          className={`admin-menu-btn ${activeSubTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('dashboard')}
        >
          <BarChart3 size={16} /> Overview
        </button>
        <button
          className={`admin-menu-btn ${activeSubTab === 'members' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('members')}
        >
          <Users size={16} /> Member Directory
        </button>
        <button
          className={`admin-menu-btn ${activeSubTab === 'moderation' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('moderation')}
        >
          <ImageIcon size={16} /> Moderate Photos
        </button>
        <button
          className={`admin-menu-btn ${activeSubTab === 'cloud' ? 'active' : ''}`}
          onClick={() => setActiveSubTab('cloud')}
        >
          <Database size={16} /> Cloud Storage (Sync)
        </button>

        <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <button
            className="btn-danger"
            style={{ width: '100%', justifyContent: 'center', backgroundColor: '#8B5CF6' }}
            onClick={handleResetDatabaseClick}
          >
            <RefreshCw size={14} /> Reset Hub Data
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="admin-card">

        {/* --- 1. OVERVIEW / ANALYTICS --- */}
        {activeSubTab === 'dashboard' && (
          <div>
            <div className="admin-section-header">
              <h2 className="admin-section-title">{club.name} Hub Metrics</h2>
            </div>

            <div className="admin-stats-row">
              <div className="stat-card">
                <div className="stat-val">{totalPhotos}</div>
                <div className="stat-label">Total Photos</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">{totalMembers}</div>
                <div className="stat-label">Club Roster</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">{registeredCount}</div>
                <div className="stat-label">Registered Members</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">{totalLikes}</div>
                <div className="stat-label">Total Heart Reactions</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '24px' }}>
              {/* Category distribution */}
              <div style={{ background: 'var(--club-gray-light)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--club-gray)' }}>
                <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>Category Distribution</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {['General', 'Tennis', 'Golf', 'Dining', 'Clubhouse', 'Events'].map(cat => {
                    const count = categoryCounts[cat] || 0;
                    const pct = totalPhotos > 0 ? (count / totalPhotos) * 100 : 0;
                    return (
                      <div key={cat} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                        <span style={{ fontSize: '14px', fontWeight: '500', width: '90px' }}>{cat}</span>
                        <div style={{ flex: 1, height: '8px', background: 'var(--club-gray)', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: 'var(--club-gold)', borderRadius: '4px' }}></div>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: '600', width: '30px', textAlign: 'right' }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Spotlight: Top 3 liked photos */}
              {topPhotos.length > 0 && (
                <div style={{ background: 'var(--club-gray-light)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--club-gray)', display: 'flex', flexDirection: 'column' }}>
                  <h3 style={{ marginBottom: '16px', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    🏆 Top 3 Most Liked Photos
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {topPhotos.map((photo, index) => {
                      const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
                      return (
                        <div
                          key={photo.id}
                          className="top-photo-row"
                          style={{
                            display: 'flex',
                            gap: '12px',
                            alignItems: 'center',
                            background: 'var(--club-white)',
                            padding: '10px',
                            borderRadius: 'var(--radius-md)',
                            border: '1px solid var(--club-gray)',
                            cursor: 'pointer',
                            transition: 'var(--transition-fast)'
                          }}
                          onClick={() => setSelectedPhoto(photo)}
                          title="Click to view photo"
                        >
                          <span style={{ fontSize: '20px', fontWeight: '700', width: '24px', textAlign: 'center' }}>{medal}</span>
                          <div style={{ width: '50px', height: '50px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0, border: '1px solid var(--club-gray)' }}>
                            <img src={photo.url} alt={photo.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <span style={{ fontSize: '9px', textTransform: 'uppercase', color: 'var(--club-gold-dark)', fontWeight: '700', letterSpacing: '0.05em' }}>
                              {photo.category}
                            </span>
                            <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--club-green-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', margin: 0, lineHeight: '1.2' }}>
                              "{photo.caption}"
                            </p>
                            <span style={{ fontSize: '11px', color: 'var(--club-gray-dark)' }}>
                              By: {photo.uploaderName}
                            </span>
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--club-danger)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', whiteSpace: 'nowrap' }}>
                            ❤️ {photo.hearts}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- 2. MEMBER DIRECTORY --- */}
        {activeSubTab === 'clubs' && (
          <div>
            <div className="admin-section-header"><h2 className="admin-section-title">Set up {club.name}</h2><span>Private club workspace</span></div>
            <div className="setup-checklist">
              <div className="complete"><span>1</span><p><strong>Administrator verified</strong><small>Your club account owns this workspace.</small></p></div>
              <div className={club.logoUrl ? 'complete' : ''}><span>2</span><p><strong>Add club branding</strong><small>Set the member-facing name and crest.</small></p></div>
              <div className={members.length > 0 ? 'complete' : ''}><span>3</span><p><strong>Load the member roster</strong><small>Add members with their registered email addresses.</small></p></div>
            </div>
            <p className="admin-help-copy">Only administrators verified for this club can change these settings or access its member directory.</p>
            <form className="club-add-form" onSubmit={handleClubSetupSubmit}>
              <div className="form-group"><label htmlFor="clubName">Club name</label><input id="clubName" className="input-field" value={clubName} onChange={event => setClubName(event.target.value)} required /></div>
              <div className="form-group"><label htmlFor="clubShortName">Short name</label><input id="clubShortName" className="input-field" value={clubShortName} onChange={event => setClubShortName(event.target.value)} /></div>
              <div className="form-group"><label htmlFor="clubLogoUrl">Logo URL (optional)</label><input id="clubLogoUrl" className="input-field" type="url" placeholder="https://…" value={clubLogoUrl} onChange={event => setClubLogoUrl(event.target.value)} /></div>
              <button className="btn-primary">Save club settings</button>
            </form>
            {members.length === 0 && <button className="btn-secondary setup-roster-cta" onClick={() => setActiveSubTab('members')}><Users size={16} /> Add your first members</button>}
          </div>
        )}

        {/* --- 3. MEMBER DIRECTORY --- */}
        {activeSubTab === 'members' && (
          <div>
            <div className="admin-section-header">
              <h2 className="admin-section-title">Club Member Registry</h2>
              <span style={{ fontSize: '14px', color: 'var(--club-gray-dark)', fontWeight: '600' }}>
                {totalMembers} total members loaded
              </span>
            </div>

            {/* Individual Add Form */}
            <h3 style={{ fontSize: '16px', marginBottom: '8px' }}>Add Individual Member</h3>
            <form className="member-add-form" onSubmit={handleAddMemberSubmit}>
              <div className="form-group">
                <input
                  type="text"
                  className="input-field"
                  placeholder="Member Number (e.g. 1006)"
                  value={newMemberNum}
                  onChange={(e) => setNewMemberNum(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="email"
                  className="input-field"
                  placeholder="Roster Email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  className="input-field"
                  placeholder="Last Name (e.g. Doe)"
                  value={newLastName}
                  onChange={(e) => setNewLastName(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <input
                  type="text"
                  className="input-field"
                  placeholder="First Name (e.g. Jane)"
                  value={newFirstName}
                  onChange={(e) => setNewFirstName(e.target.value)}
                  required
                />
              </div>
              <button type="submit" className="btn-primary" style={{ height: '46px' }}>
                <Plus size={16} /> Add Member
              </button>
            </form>

            {/* CSV Roster Bulk Import */}
            <h3 style={{ fontSize: '16px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <FileSpreadsheet size={16} style={{ color: 'var(--club-gold-dark)' }} /> Bulk Import Club Roster (CSV)
            </h3>
            <form onSubmit={handleCsvImportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px', background: 'var(--club-gray-light)', padding: '16px', borderRadius: 'var(--radius-md)', border: '1px solid var(--club-gray)' }}>
              <p style={{ fontSize: '12px', color: 'var(--club-gray-dark)' }}>
                Paste lines in format: <strong>MemberNumber, LastName, FirstName, Email</strong>. The roster email is required for secure first-time verification.
              </p>
              <textarea
                className="textarea-field"
                placeholder="1006, Doe, Jane, jane@example.com&#10;1007, Simpson, Bart, bart@example.com"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
              ></textarea>
              <button type="submit" className="btn-secondary" style={{ alignSelf: 'flex-start' }}>
                <Upload size={14} /> Parse & Add Roster
              </button>
            </form>

            {/* Members Directory Table */}
            <h3 style={{ fontSize: '16px', marginBottom: '12px' }}>Active Member List</h3>
            <div className="table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Member Number</th>
                    <th>Last Name</th>
                    <th>First Name</th>
                    <th>Roster Email</th>
                    <th>Hub Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...members].sort((a, b) => a.lastName.localeCompare(b.lastName)).map(member => (
                    <tr key={member.memberNumber}>
                      <td style={{ fontWeight: '600' }}>#{member.memberNumber}</td>
                      <td>{member.lastName}</td>
                      <td>{member.firstName}</td>
                      <td>{member.email}</td>
                      <td>
                        <span
                          style={{
                            display: 'inline-block',
                            padding: '3px 8px',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            backgroundColor: member.registeredAt ? 'rgba(30, 107, 63, 0.1)' : 'rgba(197, 160, 89, 0.15)',
                            color: member.registeredAt ? 'var(--club-success)' : 'var(--club-gold-dark)'
                          }}
                        >
                          {member.registeredAt ? 'Registered' : 'Password not set'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn-text"
                          style={{ color: 'var(--club-green)', padding: '4px', marginRight: '6px' }}
                          onClick={async () => {
                            const nextEmail = window.prompt(`Roster email for ${member.firstName} ${member.lastName}:`, member.email || '');
                            if (nextEmail === null) return;
                            if (!/^\S+@\S+\.\S+$/.test(nextEmail.trim())) return addToast('Enter a valid email address.', 'error');
                            try { await onUpdateMember(member.memberNumber, { email: nextEmail.trim().toLowerCase() }); addToast('Roster email updated.', 'success'); }
                            catch (error) { addToast(error.message || 'Could not update roster email.', 'error'); }
                          }}
                        >
                          Edit email
                        </button>
                        <button
                          className="btn-text"
                          style={{ color: 'var(--club-green)', padding: '4px', marginRight: '6px' }}
                          onClick={async () => {
                            const newPassword = window.prompt(`Set a password for ${member.firstName} ${member.lastName} (minimum 10 characters):`);
                            if (!newPassword) return;
                            try {
                              await onSetMemberPassword(member.memberNumber, newPassword);
                              addToast('Member password updated.', 'success');
                            } catch (error) {
                              addToast(error.message || 'Could not update member password.', 'error');
                            }
                          }}
                        >
                          Set password
                        </button>
                        <button
                          className="btn-text"
                          style={{ color: 'var(--club-danger)', padding: '4px' }}
                          onClick={() => {
                            if (window.confirm(`Remove member ${member.firstName} ${member.lastName} (#${member.memberNumber})?`)) {
                              onDeleteMember(member.memberNumber);
                              addToast('Member removed from roster.', 'info');
                            }
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- 3. PHOTO MODERATION --- */}
        {activeSubTab === 'moderation' && (
          <div>
            <div className="admin-section-header">
              <h2 className="admin-section-title">Photo Moderation</h2>
              <span style={{ fontSize: '14px', color: 'var(--club-gray-dark)', fontWeight: '600' }}>
                {totalPhotos} total photos submitted
              </span>
            </div>

            {photos.length > 0 ? (
              <div className="moderation-grid">
                {photos.map(photo => (
                  <div key={photo.id} className="mod-photo-card">
                    <div className="mod-img-wrapper">
                      <img src={photo.url} alt={photo.caption} className="mod-img" />
                    </div>
                    <div style={{ padding: '8px', fontSize: '12px' }}>
                      <p style={{ fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{photo.uploaderName}</p>
                      <p style={{ color: 'var(--club-gray-dark)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{photo.caption}</p>
                    </div>
                    <div className="mod-actions">
                      <button
                        className="btn-danger"
                        style={{ padding: '6px', fontSize: '11px', flex: '1', justifyContent: 'center' }}
                        onClick={() => {
                          if (window.confirm('Delete this photo permanently?')) {
                            onDeletePhoto(photo.id);
                            addToast('Photo deleted by moderator.', 'info');
                          }
                        }}
                      >
                        <Trash2 size={12} /> Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '40px' }}>
                <ImageIcon size={32} style={{ color: 'var(--club-gold)', marginBottom: '8px' }} />
                <p style={{ fontWeight: '600' }}>No photos uploaded yet.</p>
              </div>
            )}
          </div>
        )}

        {/* --- 4. CLOUD CONFIGURATION --- */}
        {activeSubTab === 'cloud' && (
          <div>
            <div className="admin-section-header">
              <h2 className="admin-section-title">Live Cloud Database Sync</h2>
            </div>

            <div className="db-config-grid">
              <div>
                {firebaseConfig ? (
                  <div className="db-badge-cloud">
                    <CloudLightning size={14} /> Cloud Active (Cloudflare R2 + D1)
                  </div>
                ) : (
                  <div className="db-badge-local">
                    <Database size={14} /> Local Offline (Saving in browser IndexedDB database)
                  </div>
                )}
              </div>

              <div style={{ lineHeight: '1.5', fontSize: '14px', color: 'var(--club-charcoal)' }}>
                {firebaseConfig ? <>
                  <p style={{ marginBottom: '10px' }}><strong>Cloud uploads are live.</strong> Photos uploaded by members are stored in Cloudflare R2, while member records, captions, likes and activity are stored in Cloudflare D1.</p>
                  <p>Members can upload from their own phones and computers, and the gallery is shared across the organization.</p>
                </> : <>
                  <p style={{ marginBottom: '10px' }}>This browser is currently in local offline mode. Photos are stored in browser IndexedDB and will not be shared with members on other devices.</p>
                  <p>Connect the deployed Cloudflare Worker through <code>VITE_API_BASE_URL</code> to enable shared member uploads.</p>
                </>}
              </div>
              <div className="login-info" style={{ marginTop: '12px' }}>
                Cloud configuration is deployed through environment variables and the Cloudflare Worker. It is not editable from the browser.
              </div>
            </div>
          </div>
        )}

      </div>
      {/* Lightbox modal overlay for admin dashboard spotlight */}
      {selectedPhoto && createPortal(
        <div className="lightbox-backdrop" onClick={() => setSelectedPhoto(null)}>
          <div className="lightbox-container animate-fade-in" onClick={e => e.stopPropagation()}>
            <button className="lightbox-close" onClick={() => setSelectedPhoto(null)}>
              <X size={20} />
            </button>
            <div className="lightbox-image-pane">
              <img src={selectedPhoto.url} alt={selectedPhoto.caption} className="lightbox-img" />
            </div>
            <div className="lightbox-info-pane" style={{ padding: '24px' }}>
              <div className="lightbox-meta" style={{ marginBottom: '10px' }}>
                <div>
                  <span style={{ fontWeight: '700', fontSize: '15px', color: 'var(--club-green-dark)' }}>{selectedPhoto.uploaderName}</span>
                  <div style={{ fontSize: '11px', color: 'var(--club-gray-dark)' }}>{new Date(selectedPhoto.createdAt).toLocaleDateString()}</div>
                </div>
                <span className="lightbox-category-badge">{selectedPhoto.category}</span>
              </div>
              <p style={{ fontStyle: 'italic', fontSize: '15px', color: 'var(--club-charcoal)', marginBottom: '12px' }}>"{selectedPhoto.caption}"</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px', borderTop: '1px solid var(--club-gray-light)', paddingTop: '12px' }}>
                <span style={{ color: 'var(--club-danger)', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px' }}>
                  ❤️ {selectedPhoto.hearts} likes
                </span>

                <a
                  href={selectedPhoto.downloadUrl || selectedPhoto.url}
                  download={selectedPhoto.fileName || photoDownloadName(selectedPhoto.category)}
                  className="btn-secondary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '6px 12px',
                    textDecoration: 'none',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: '600',
                    fontSize: '12px',
                    border: '1px solid var(--club-gray)',
                    backgroundColor: 'var(--club-white)',
                    color: 'var(--club-charcoal)',
                    cursor: 'pointer',
                    transition: 'var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--club-gray-light)';
                    e.currentTarget.style.borderColor = 'var(--club-gold)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'var(--club-white)';
                    e.currentTarget.style.borderColor = 'var(--club-gray)';
                  }}
                >
                  <Download size={14} />
                  <span>Download</span>
                </a>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
