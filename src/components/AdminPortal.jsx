import React, { useState } from 'react';
import {
  Users, Image as ImageIcon, BarChart3,
  Building2, Trash2, Plus, RefreshCw, Upload, FileSpreadsheet, Key, Database, AlertCircle, X, FileText, UserPlus, Edit2, Check, Search, HardDrive, Shield, User, CheckCircle2
} from 'lucide-react';

const normalizeMemberNumber = num => String(num || '').trim();

export default function AdminPortal({
  club,
  members,
  photos,
  onUpdateClub,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  onSetMemberPassword,
  onDeletePhoto,
  onUpdatePhoto,
  firebaseConfig,
  onResetDatabase,
  addToast,
  setActiveTab
}) {
  const [activeSubTab, setActiveSubTab] = useState('clubs'); // 'clubs' | 'dashboard' | 'members' | 'moderation' | 'cloud'

  // Club settings state
  const [clubName, setClubName] = useState(club.name || '');
  const [clubShortName, setClubShortName] = useState(club.shortName || '');
  const [clubLogoUrl, setClubLogoUrl] = useState(club.logoUrl || '');

  // Member & Staff management state
  const [newMemberNum, setNewMemberNum] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('member'); // 'member' | 'admin'
  const [memberRoleFilter, setMemberRoleFilter] = useState('all'); // 'all' | 'admin' | 'member'
  const [csvText, setCsvText] = useState('');

  // Active Member Modal State ('add' | 'csv' | 'excel' | null)
  const [activeModal, setActiveModal] = useState(null);

  // Excel state
  const [workbook, setWorkbook] = useState(null);
  const [workbookName, setWorkbookName] = useState('');
  const [sheetName, setSheetName] = useState('');
  const [sheetHeaders, setSheetHeaders] = useState([]);
  const [sheetRows, setSheetRows] = useState([]);
  const [columnMap, setColumnMap] = useState({ memberNumber: '', lastName: '', firstName: '', email: '' });
  const [excelStatus, setExcelStatus] = useState('');
  const [excelImportSummary, setExcelImportSummary] = useState(null);

  // Moderation filter & editing state
  const [modCategory, setModCategory] = useState('All');
  const [modSearch, setModSearch] = useState('');
  const [editingPhotoId, setEditingPhotoId] = useState(null);
  const [editCaptionText, setEditCaptionText] = useState('');

  // Storage Basket State (Clean photo quota bucket selection for club)
  const [extraStorageGb, setExtraStorageGb] = useState(0);

  const categories = ['All', 'General', 'Tennis', 'Golf', 'Dining', 'Clubhouse', 'Events'];

  const handleClubSetupSubmit = async (e) => {
    e.preventDefault();
    try {
      await onUpdateClub({
        name: clubName.trim() || club.name,
        shortName: clubShortName.trim() || club.shortName,
        logoUrl: clubLogoUrl
      });
      addToast('Club configuration saved successfully!', 'success');
    } catch (err) {
      console.error(err);
      addToast('Failed to save club settings.', 'error');
    }
  };

  const handleClubLogoChange = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    if (file.size > 256 * 1024) {
      addToast('Image size exceeds 256 KB limit.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setClubLogoUrl(event.target.result);
      addToast('New club logo uploaded.', 'info');
    };
    reader.readAsDataURL(file);
  };

  const handleWorkbookChange = async (e) => {
    const file = e.target.files && e.target.files[0];
    setExcelImportSummary(null);
    if (!file) {
      setWorkbook(null);
      setExcelStatus('');
      return;
    }

    try {
      setExcelStatus('Reading Excel file...');
      const { default: readXlsxFile } = await import('read-excel-file/browser');
      const rows = await readXlsxFile(file);

      if (!rows || rows.length === 0) {
        setExcelStatus('This workbook appears to be empty.');
        setWorkbook(null);
        return;
      }

      const sheets = [{ sheet: 'Sheet 1', rows }];
      setWorkbook(sheets);
      setWorkbookName(file.name);
      setSheetName(sheets[0].sheet);
      loadSheetData(sheets[0].rows);
      setExcelStatus('');
    } catch (error) {
      console.error('Failed reading Excel file', error);
      setExcelStatus('We could not read this file. Ensure it is a valid .xlsx spreadsheet.');
      setWorkbook(null);
    }
  };

  const loadSheetData = (rows) => {
    if (!rows || rows.length === 0) {
      setSheetHeaders([]);
      setSheetRows([]);
      return;
    }

    const rawHeaders = rows[0].map((cell, idx) => (cell !== null && cell !== undefined ? String(cell).trim() : `Column ${idx + 1}`));
    const rawData = rows.slice(1);

    setSheetHeaders(rawHeaders);
    setSheetRows(rawData);

    const nextMap = { memberNumber: '', lastName: '', firstName: '', email: '' };
    rawHeaders.forEach(h => {
      const lower = h.toLowerCase();
      if (!nextMap.memberNumber && (lower.includes('number') || lower.includes('id') || lower.includes('member'))) nextMap.memberNumber = h;
      if (!nextMap.lastName && (lower.includes('last') || lower.includes('surname'))) nextMap.lastName = h;
      if (!nextMap.firstName && (lower.includes('first') || lower.includes('given'))) nextMap.firstName = h;
      if (!nextMap.email && (lower.includes('email') || lower.includes('mail'))) nextMap.email = h;
    });
    setColumnMap(nextMap);
  };

  const handleExcelImport = (e) => {
    e.preventDefault();
    if (!workbook || sheetRows.length === 0) return setExcelStatus('Please select an Excel workbook first.');

    const colIdx = {
      memberNumber: sheetHeaders.indexOf(columnMap.memberNumber),
      lastName: sheetHeaders.indexOf(columnMap.lastName),
      firstName: sheetHeaders.indexOf(columnMap.firstName),
      email: sheetHeaders.indexOf(columnMap.email)
    };

    if (colIdx.memberNumber === -1 || colIdx.lastName === -1 || colIdx.firstName === -1 || colIdx.email === -1) {
      return setExcelStatus('Please select a valid column for Member number, Last name, First name, and Email.');
    }

    let addedCount = 0;
    let skippedCount = 0;
    const reasons = {};

    sheetRows.forEach((row) => {
      const numRaw = row[colIdx.memberNumber];
      const lNameRaw = row[colIdx.lastName];
      const fNameRaw = row[colIdx.firstName];
      const emailRaw = row[colIdx.email];

      if (!numRaw || !lNameRaw || !fNameRaw || !emailRaw) {
        skippedCount++;
        reasons['missing required field'] = (reasons['missing required field'] || 0) + 1;
        return;
      }

      const memberNum = normalizeMemberNumber(String(numRaw).trim());
      const emailVal = String(emailRaw).trim().toLowerCase();

      if (!/^\S+@\S+\.\S+$/.test(emailVal)) {
        skippedCount++;
        reasons['invalid email format'] = (reasons['invalid email format'] || 0) + 1;
        return;
      }

      if (members.some(m => normalizeMemberNumber(m.memberNumber) === memberNum)) {
        skippedCount++;
        reasons['member number already exists'] = (reasons['member number already exists'] || 0) + 1;
        return;
      }

      onAddMember({
        memberNumber: memberNum,
        lastName: String(lNameRaw).trim(),
        firstName: String(fNameRaw).trim(),
        email: emailVal,
        role: 'member',
        password: '',
        registeredAt: ''
      });
      addedCount++;
    });

    setExcelImportSummary({ added: addedCount, skipped: skippedCount, reasons });
    if (addedCount > 0) {
      addToast(`Imported ${addedCount} members from Excel!`, 'success');
      setActiveModal(null);
    } else addToast('No valid new members found in spreadsheet.', 'error');
  };

  const totalPhotos = photos.length;
  const totalMembers = members.length;
  const adminCount = members.filter(m => m.role === 'admin').length;
  const registeredCount = members.filter(m => m.registeredAt).length;
  const totalLikes = photos.reduce((acc, p) => acc + (p.hearts || 0), 0);

  const topPhotos = [...photos]
    .filter(p => (p.hearts || 0) > 0)
    .sort((a, b) => (b.hearts || 0) - (a.hearts || 0))
    .slice(0, 3);

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

    if (members.some(m => normalizeMemberNumber(m.memberNumber) === normalizeMemberNumber(newMemberNum))) {
      addToast(`Member number ${newMemberNum} already exists.`, 'error');
      return;
    }

    const newMember = {
      memberNumber: normalizeMemberNumber(newMemberNum),
      lastName: newLastName.trim(),
      firstName: newFirstName.trim(),
      email: newEmail.trim().toLowerCase(),
      role: newRole,
      password: '',
      registeredAt: ''
    };

    onAddMember(newMember);
    addToast(`${newRole === 'admin' ? 'Admin Staff' : 'Member'} ${newFirstName} ${newLastName} added!`, 'success');

    setNewMemberNum('');
    setNewLastName('');
    setNewFirstName('');
    setNewEmail('');
    setNewRole('member');
    setActiveModal(null);
  };

  const handleToggleAdminRole = async (member) => {
    const nextRole = member.role === 'admin' ? 'member' : 'admin';
    try {
      await onUpdateMember(member.memberNumber, { role: nextRole });
      addToast(
        nextRole === 'admin'
          ? `${member.firstName} ${member.lastName} promoted to Staff Admin!`
          : `${member.firstName} ${member.lastName} role set to Member.`,
        'success'
      );
    } catch (err) {
      console.error(err);
      addToast('Could not update member role.', 'error');
    }
  };

  const handleCsvImportSubmit = (e) => {
    e.preventDefault();
    if (!csvText.trim()) {
      addToast('Please paste CSV text first.', 'error');
      return;
    }

    const lines = csvText.split('\n');
    let importCount = 0;

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;
      const parts = trimmed.split(',').map(p => p.replace(/^["']|["']$/g, '').trim());

      if (parts.length >= 4) {
        const memberNum = normalizeMemberNumber(parts[0]);
        const lName = parts[1];
        const fName = parts[2];
        const memberEmail = parts[3].toLowerCase();

        if (memberNum.toLowerCase() === 'membernumber' || memberNum.toLowerCase() === 'number') return;
        if (!/^\S+@\S+\.\S+$/.test(memberEmail) || members.some(m => normalizeMemberNumber(m.memberNumber) === memberNum)) return;

        onAddMember({
          memberNumber: memberNum,
          lastName: lName,
          firstName: fName,
          email: memberEmail,
          role: 'member',
          password: '',
          registeredAt: ''
        });
        importCount++;
      }
    });

    if (importCount > 0) {
      addToast(`Successfully imported ${importCount} members!`, 'success');
      setCsvText('');
      setActiveModal(null);
    } else {
      addToast('No valid new members found in CSV.', 'error');
    }
  };

  const handleStartEditCaption = (photo) => {
    setEditingPhotoId(photo.id);
    setEditCaptionText(photo.caption || '');
  };

  const handleSaveEditedCaption = async (photoId) => {
    if (!editCaptionText.trim()) return;
    try {
      await onUpdatePhoto(photoId, { caption: editCaptionText.trim() });
      addToast('Photo caption updated!', 'success');
      setEditingPhotoId(null);
    } catch (e) {
      console.error(e);
      addToast('Could not update photo caption.', 'error');
    }
  };

  const handleResetDatabaseClick = async () => {
    if (window.confirm('Are you sure you want to reset the database? All custom photos and uploaded roster members will be cleared.')) {
      await onResetDatabase();
      addToast('Hub database reset to seed data.', 'info');
    }
  };

  // Moderation filtering
  const filteredModPhotos = photos.filter(photo => {
    const matchesCategory = modCategory === 'All' || photo.category === modCategory;
    const query = modSearch.trim().toLowerCase();
    const matchesSearch = !query ||
      photo.caption?.toLowerCase().includes(query) ||
      photo.uploaderName?.toLowerCase().includes(query) ||
      photo.category?.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  // Member Directory filtering
  const filteredMembers = members.filter(m => {
    if (memberRoleFilter === 'admin') return m.role === 'admin';
    if (memberRoleFilter === 'member') return m.role !== 'admin';
    return true;
  });

  // Clean Storage Bucket Metrics for Club
  const baseGb = 25;
  const totalGb = baseGb + extraStorageGb;
  const approxUsedGb = ((totalPhotos * 2.5) / 1024).toFixed(2); // Avg 2.5MB per photo

  return (
    <div className="admin-portal-layout animate-fade-in">
      
      {/* Sidebar Navigation */}
      <div className="admin-sidebar">
        <div className="admin-sidebar-header">
          <div className="sidebar-logo-box">
            {club.logoUrl ? (
              <img src={club.logoUrl} alt={club.name} className="admin-sidebar-logo" />
            ) : (
              <div className="admin-sidebar-logo-fallback">{(club.name || 'C').charAt(0)}</div>
            )}
          </div>
          <div className="admin-sidebar-club-info">
            <span className="admin-sidebar-club-name">{club.name}</span>
            <span className="admin-sidebar-badge">Club Admin</span>
          </div>
        </div>

        <button className={`admin-menu-btn ${activeSubTab === 'clubs' ? 'active' : ''}`} onClick={() => setActiveSubTab('clubs')}>
          <Building2 size={16} /> Club Setup
        </button>
        <button className={`admin-menu-btn ${activeSubTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveSubTab('dashboard')}>
          <BarChart3 size={16} /> Overview
        </button>
        <button className={`admin-menu-btn ${activeSubTab === 'members' ? 'active' : ''}`} onClick={() => setActiveSubTab('members')}>
          <Users size={16} /> Member & Staff Directory
        </button>
        <button className={`admin-menu-btn ${activeSubTab === 'moderation' ? 'active' : ''}`} onClick={() => setActiveSubTab('moderation')}>
          <ImageIcon size={16} /> Moderate Photos
        </button>
        <button className={`admin-menu-btn ${activeSubTab === 'cloud' ? 'active' : ''}`} onClick={() => setActiveSubTab('cloud')}>
          <Database size={16} /> Cloud Storage
        </button>

        <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
          <button className="btn-danger" style={{ width: '100%', justifyContent: 'center', backgroundColor: '#8B5CF6' }} onClick={handleResetDatabaseClick}>
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
                <div className="stat-val">{adminCount}</div>
                <div className="stat-label">Staff Admins</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">{totalLikes}</div>
                <div className="stat-label">Heart Reactions</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginTop: '24px' }}>
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

              {topPhotos.length > 0 && (
                <div style={{ background: 'var(--club-gray-light)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--club-gray)' }}>
                  <h3 style={{ marginBottom: '16px', fontSize: '18px' }}>🏆 Top Most Liked Photos</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {topPhotos.map((photo, index) => (
                      <div key={photo.id} style={{ display: 'flex', gap: '12px', alignItems: 'center', background: 'var(--club-white)', padding: '10px', borderRadius: 'var(--radius-md)', border: '1px solid var(--club-gray)' }}>
                        <span style={{ fontSize: '18px', fontWeight: '700', width: '24px' }}>{index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}</span>
                        <div style={{ width: '48px', height: '48px', borderRadius: '4px', overflow: 'hidden', flexShrink: 0 }}>
                          <img src={photo.url} alt={photo.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--club-green-dark)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>"{photo.caption}"</p>
                          <span style={{ fontSize: '11px', color: 'var(--club-gray-dark)' }}>By: {photo.uploaderName}</span>
                        </div>
                        <span style={{ fontSize: '12px', color: 'var(--club-danger)', fontWeight: '700' }}>❤️ {photo.hearts}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- 2. REORGANIZED CLUB SETUP --- */}
        {activeSubTab === 'clubs' && (
          <div className="club-setup-panel">
            <div className="admin-section-header">
              <div>
                <h2 className="admin-section-title">Club Configuration & Branding</h2>
                <p style={{ fontSize: '13px', color: 'var(--club-gray-dark)', margin: '4px 0 0' }}>
                  Manage public club name, short abbreviation, and member logo crest.
                </p>
              </div>
            </div>

            <form className="club-setup-clean-card" onSubmit={handleClubSetupSubmit}>
              <div className="club-setup-fields-grid">
                <div className="form-group">
                  <label htmlFor="clubName">Club Name</label>
                  <input
                    id="clubName"
                    type="text"
                    className="input-field"
                    value={clubName}
                    onChange={e => setClubName(e.target.value)}
                    placeholder="e.g. Oakville Club"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="clubShortName">Short Abbreviation</label>
                  <input
                    id="clubShortName"
                    type="text"
                    className="input-field"
                    value={clubShortName}
                    onChange={e => setClubShortName(e.target.value)}
                    placeholder="e.g. OC"
                  />
                </div>
              </div>

              <div className="club-setup-logo-box">
                <div className="logo-preview-wrapper">
                  {clubLogoUrl ? (
                    <img src={clubLogoUrl} alt="Club Crest" className="club-setup-logo-preview" />
                  ) : (
                    <div className="logo-placeholder-avatar">{(clubName || 'C').charAt(0)}</div>
                  )}
                </div>

                <div className="logo-upload-controls">
                  <label htmlFor="clubLogoFile" className="logo-upload-label">
                    <Upload size={14} /> Upload Club Crest
                  </label>
                  <input
                    id="clubLogoFile"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleClubLogoChange}
                    style={{ display: 'none' }}
                  />
                  <span className="logo-upload-hint">Select a transparent PNG, JPG, or WebP logo file (Max 256 KB)</span>
                </div>
              </div>

              <div className="club-setup-footer">
                <button type="submit" className="btn-primary" style={{ padding: '10px 24px' }}>
                  Save Club Settings
                </button>
              </div>
            </form>
          </div>
        )}

        {/* --- 3. MEMBER & STAFF DIRECTORY WITH ADMIN PROMOTION --- */}
        {activeSubTab === 'members' && (
          <div>
            <div className="admin-section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 className="admin-section-title">Member & Staff Directory</h2>
                <span style={{ fontSize: '13px', color: 'var(--club-gray-dark)', fontWeight: '600' }}>
                  {totalMembers} total enrolled • {adminCount} staff admins • {registeredCount} registered
                </span>
              </div>

              <div className="admin-actions-bar">
                <button type="button" className="btn-primary" onClick={() => setActiveModal('add')}>
                  <UserPlus size={15} /> Add Member / Staff
                </button>
                <button type="button" className="btn-secondary" onClick={() => setActiveModal('csv')}>
                  <FileText size={15} /> Import CSV
                </button>
                <button type="button" className="btn-secondary" onClick={() => setActiveModal('excel')}>
                  <FileSpreadsheet size={15} /> Import Excel
                </button>
              </div>
            </div>

            {/* Role Filter Tabs */}
            <div className="role-filter-bar" style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button
                type="button"
                className={`filter-pill ${memberRoleFilter === 'all' ? 'active' : ''}`}
                onClick={() => setMemberRoleFilter('all')}
              >
                All Roster ({members.length})
              </button>
              <button
                type="button"
                className={`filter-pill ${memberRoleFilter === 'admin' ? 'active' : ''}`}
                onClick={() => setMemberRoleFilter('admin')}
              >
                <Shield size={12} /> Staff Admins ({adminCount})
              </button>
              <button
                type="button"
                className={`filter-pill ${memberRoleFilter === 'member' ? 'active' : ''}`}
                onClick={() => setMemberRoleFilter('member')}
              >
                <User size={12} /> Club Members ({members.length - adminCount})
              </button>
            </div>

            <div className="table-wrapper member-directory-table" style={{ marginTop: '16px' }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Member Number</th>
                    <th>Name</th>
                    <th>Roster Email</th>
                    <th>Access Role</th>
                    <th>Hub Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...filteredMembers].sort((a, b) => a.lastName.localeCompare(b.lastName)).map(member => {
                    const isAdminStaff = member.role === 'admin';
                    return (
                      <tr key={member.memberNumber}>
                        <td style={{ fontWeight: '700' }}>#{member.memberNumber}</td>
                        <td style={{ fontWeight: '600' }}>{member.firstName} {member.lastName}</td>
                        <td>{member.email}</td>
                        <td>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '3px 8px',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: '700',
                              backgroundColor: isAdminStaff ? 'rgba(139, 92, 246, 0.12)' : 'rgba(30, 58, 138, 0.08)',
                              color: isAdminStaff ? '#6D28D9' : 'var(--club-navy)'
                            }}
                          >
                            {isAdminStaff ? <Shield size={12} /> : <User size={12} />}
                            {isAdminStaff ? 'Staff Admin' : 'Member'}
                          </span>
                        </td>
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
                            {member.registeredAt ? 'Registered' : 'Password Pending'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            className="btn-text"
                            style={{ color: isAdminStaff ? '#6D28D9' : 'var(--club-green)', padding: '4px', marginRight: '6px', fontWeight: '600' }}
                            onClick={() => handleToggleAdminRole(member)}
                            title={isAdminStaff ? 'Revoke Admin Access' : 'Grant Admin Privileges'}
                          >
                            <Shield size={13} /> {isAdminStaff ? 'Make Member' : 'Make Admin'}
                          </button>

                          <button
                            className="btn-text"
                            style={{ color: 'var(--club-gold-dark)', padding: '4px', marginRight: '6px' }}
                            onClick={async () => {
                              const pwd = window.prompt(`Set password for ${member.firstName} ${member.lastName}:`);
                              if (!pwd) return;
                              await onSetMemberPassword(member.memberNumber, pwd);
                              addToast('Password set!', 'success');
                            }}
                          >
                            <Key size={13} /> Password
                          </button>

                          <button
                            className="btn-text"
                            style={{ color: 'var(--club-danger)', padding: '4px' }}
                            onClick={async () => {
                              if (window.confirm(`Delete ${member.firstName} ${member.lastName}?`)) {
                                await onDeleteMember(member.memberNumber);
                                addToast('Member removed from roster.', 'info');
                              }
                            }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --- MODAL DRAWER FOR ADD MEMBER / STAFF ADMIN --- */}
        {activeModal === 'add' && (
          <div className="admin-modal-backdrop" onClick={() => setActiveModal(null)}>
            <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3><UserPlus size={18} /> Add Roster Member or Staff Admin</h3>
                <button type="button" className="admin-modal-close" onClick={() => setActiveModal(null)}><X size={18} /></button>
              </div>
              <form className="admin-modal-body" onSubmit={handleAddMemberSubmit}>
                <div className="form-group">
                  <label htmlFor="newRoleSelect">Access Role & Privileges</label>
                  <select
                    id="newRoleSelect"
                    className="select-field"
                    value={newRole}
                    onChange={e => setNewRole(e.target.value)}
                  >
                    <option value="member">Club Member (Standard Gallery Access)</option>
                    <option value="admin">Staff Admin (Full Club Management & Moderation)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="newMemNum">Member / Staff Number</label>
                  <input id="newMemNum" type="text" className="input-field" placeholder="e.g. 1006" value={newMemberNum} onChange={e => setNewMemberNum(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="newMemEmail">Email Address</label>
                  <input id="newMemEmail" type="email" className="input-field" placeholder="e.g. staff@example.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="newLastName">Last Name</label>
                  <input id="newLastName" type="text" className="input-field" placeholder="e.g. Smith" value={newLastName} onChange={e => setNewLastName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label htmlFor="newFirstName">First Name</label>
                  <input id="newFirstName" type="text" className="input-field" placeholder="e.g. Jane" value={newFirstName} onChange={e => setNewFirstName(e.target.value)} required />
                </div>
                <div className="admin-modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                  <button type="submit" className="btn-primary">Save to Roster</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- MODAL DRAWER FOR CSV IMPORT --- */}
        {activeModal === 'csv' && (
          <div className="admin-modal-backdrop" onClick={() => setActiveModal(null)}>
            <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3><FileText size={18} /> Bulk Import CSV Roster</h3>
                <button type="button" className="admin-modal-close" onClick={() => setActiveModal(null)}><X size={18} /></button>
              </div>
              <form className="admin-modal-body" onSubmit={handleCsvImportSubmit}>
                <p style={{ fontSize: '13px', color: 'var(--club-gray-dark)', margin: 0 }}>
                  Paste CSV lines in format: <strong>MemberNumber, LastName, FirstName, Email</strong>
                </p>
                <textarea
                  className="textarea-field"
                  rows={6}
                  placeholder="1006, Doe, Jane, jane@example.com&#10;1007, Simpson, Bart, bart@example.com"
                  value={csvText}
                  onChange={e => setCsvText(e.target.value)}
                ></textarea>
                <div className="admin-modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                  <button type="submit" className="btn-primary"><Upload size={14} /> Parse & Import</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- MODAL DRAWER FOR EXCEL IMPORT --- */}
        {activeModal === 'excel' && (
          <div className="admin-modal-backdrop" onClick={() => setActiveModal(null)}>
            <div className="admin-modal-card" style={{ maxWidth: '640px' }} onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3><FileSpreadsheet size={18} /> Import Roster from Excel (.xlsx)</h3>
                <button type="button" className="admin-modal-close" onClick={() => setActiveModal(null)}><X size={18} /></button>
              </div>
              <form className="admin-modal-body" onSubmit={handleExcelImport}>
                <p style={{ fontSize: '12px', color: 'var(--club-gray-dark)' }}>Upload an `.xlsx` workbook to auto-map columns and import member rows.</p>
                <input type="file" accept=".xlsx" onChange={handleWorkbookChange} />
                {excelStatus && <p style={{ fontSize: '12px', color: '#9c2c2c', margin: 0 }}>{excelStatus}</p>}
                {workbook && (
                  <>
                    <strong style={{ fontSize: '13px' }}>{workbookName}</strong>
                    <div className="excel-column-map">
                      <strong>Map Columns</strong>
                      {[['memberNumber', 'Member number'], ['lastName', 'Last name'], ['firstName', 'First name'], ['email', 'Roster email']].map(([key, label]) => (
                        <label key={key}><span>{label}</span><select value={columnMap[key]} onChange={event => setColumnMap(previous => ({ ...previous, [key]: event.target.value }))}><option value="">Choose column…</option>{sheetHeaders.map(header => <option key={`${key}-${header}`} value={header}>{header}</option>)}</select></label>
                      ))}
                    </div>
                  </>
                )}
                <div className="admin-modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={!workbook}><Upload size={14} /> Map & Import Roster</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* --- 4. PHOTO MODERATION GALLERY VIEW --- */}
        {activeSubTab === 'moderation' && (
          <div>
            <div className="admin-section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 className="admin-section-title">Photo Moderation Gallery</h2>
                <p style={{ fontSize: '13px', color: 'var(--club-gray-dark)', margin: '4px 0 0' }}>
                  {filteredModPhotos.length} photos found. Edit captions or remove images from the club gallery.
                </p>
              </div>

              {setActiveTab && (
                <button type="button" className="btn-primary" onClick={() => setActiveTab('upload')}>
                  <Upload size={15} /> Upload New Photos
                </button>
              )}
            </div>

            <div className="gallery-toolbar" style={{ marginTop: '16px' }}>
              <div className="gallery-search-group">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  className="gallery-search-input"
                  placeholder="Filter moderation photos..."
                  value={modSearch}
                  onChange={(e) => setModSearch(e.target.value)}
                />
                {modSearch && (
                  <button type="button" className="search-clear-btn" onClick={() => setModSearch('')}>
                    <X size={14} />
                  </button>
                )}
              </div>

              <div className="category-filter-pills">
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={`filter-pill ${modCategory === cat ? 'active' : ''}`}
                    onClick={() => setModCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {filteredModPhotos.length > 0 ? (
              <div className="gallery-grid photo-gallery-grid" style={{ marginTop: '16px' }}>
                {filteredModPhotos.map(photo => (
                  <div key={photo.id} className="photo-card gallery-grid-card mod-photo-card">
                    <span className="photo-card-img-wrapper">
                      <img src={photo.url} alt={photo.caption} className="photo-card-img" />
                      <span className="photo-card-category">{photo.category}</span>
                    </span>

                    <div className="photo-card-details" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span className="photo-card-uploader" style={{ fontWeight: '700', color: 'var(--club-navy)' }}>
                        By: {photo.uploaderName || 'Club Member'}
                      </span>

                      {editingPhotoId === photo.id ? (
                        <div className="mod-edit-caption-row" style={{ display: 'flex', gap: '6px' }}>
                          <input
                            type="text"
                            className="input-field"
                            style={{ padding: '4px 8px', fontSize: '12px', flex: 1 }}
                            value={editCaptionText}
                            onChange={(e) => setEditCaptionText(e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn-gold"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => handleSaveEditedCaption(photo.id)}
                          >
                            <Check size={12} />
                          </button>
                          <button
                            type="button"
                            className="btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '11px' }}
                            onClick={() => setEditingPhotoId(null)}
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <p className="photo-card-caption" style={{ margin: 0 }}>{photo.caption}</p>
                      )}

                      <div className="mod-card-actions" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '8px', borderTop: '1px solid var(--club-gray-light)' }}>
                        <button
                          type="button"
                          className="btn-text"
                          style={{ color: 'var(--club-gold-dark)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
                          onClick={() => handleStartEditCaption(photo)}
                        >
                          <Edit2 size={12} /> Edit Caption
                        </button>

                        <button
                          type="button"
                          className="btn-text"
                          style={{ color: 'var(--club-danger)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: '600' }}
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this photo from the gallery?')) {
                              onDeletePhoto(photo.id);
                              addToast('Photo deleted.', 'info');
                            }
                          }}
                        >
                          <Trash2 size={13} /> Delete
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="gallery-empty">
                <ImageIcon size={48} />
                <p className="gallery-empty-text">No photos found in moderation view</p>
              </div>
            )}
          </div>
        )}

        {/* --- 5. CLEAN CLUB PHOTO STORAGE QUOTA --- */}
        {activeSubTab === 'cloud' && (
          <div>
            <div className="admin-section-header">
              <div>
                <h2 className="admin-section-title">Club Photo Storage Quota</h2>
                <p style={{ fontSize: '13px', color: 'var(--club-gray-dark)', margin: '4px 0 0' }}>
                  Manage storage capacity and order additional photo bucket expansion packs for your club.
                </p>
              </div>
            </div>

            {/* Storage Quota Usage Meter */}
            <div className="storage-meter-card">
              <div className="storage-meter-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <HardDrive size={20} style={{ color: 'var(--club-navy)' }} />
                  <span style={{ fontWeight: '700', fontSize: '15px' }}>Hub Storage Usage</span>
                </div>
                <span className="storage-badge-pill">
                  {approxUsedGb} GB used of {totalGb} GB Total Quota
                </span>
              </div>

              <div className="storage-progress-bar-bg">
                <div
                  className="storage-progress-fill"
                  style={{ width: `${Math.min(100, Math.max(2, (parseFloat(approxUsedGb) / totalGb) * 100))}%` }}
                ></div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--club-navy)', fontWeight: '600', marginTop: '10px' }}>
                <span>{totalPhotos} photos stored</span>
                <span>{((parseFloat(approxUsedGb) / totalGb) * 100).toFixed(1)}% Capacity Used</span>
              </div>
            </div>

            {/* Storage Bucket Expansion Packs */}
            <div className="storage-calculator-box">
              <h3 className="storage-calc-title">
                <HardDrive size={18} /> Storage Bucket Expansion Packs
              </h3>
              <p style={{ fontSize: '13px', color: 'var(--club-navy)', fontWeight: '500', marginBottom: '16px' }}>
                Your plan includes <strong>25 GB</strong> storage quota. Select an expansion pack to increase capacity for high-res photos:
              </p>

              <div className="storage-tiers-grid">
                {[
                  { gb: 0, label: 'Standard Quota', totalGb: 25, desc: 'Included in Club Plan' },
                  { gb: 25, label: '+25 GB Pack', totalGb: 50, desc: '50 GB Total Storage' },
                  { gb: 50, label: '+50 GB Pack', totalGb: 75, desc: '75 GB Total Storage' },
                  { gb: 100, label: '+100 GB Pro', totalGb: 125, desc: '125 GB Total Storage' },
                  { gb: 250, label: '+250 GB Enterprise', totalGb: 275, desc: '275 GB Total Storage' }
                ].map(tier => (
                  <button
                    key={tier.gb}
                    type="button"
                    className={`storage-tier-card ${extraStorageGb === tier.gb ? 'selected' : ''}`}
                    onClick={() => setExtraStorageGb(tier.gb)}
                  >
                    <span className="tier-gb">{tier.totalGb} GB</span>
                    <span className="tier-label">{tier.label}</span>
                    <small className="tier-desc">{tier.desc}</small>
                  </button>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button
                  type="button"
                  className="btn-primary"
                  style={{ padding: '10px 20px', fontSize: '13px' }}
                  onClick={() => addToast(`Requested ${totalGb} GB Storage Bucket expansion for ${club.name}!`, 'success')}
                >
                  <CheckCircle2 size={15} /> Save Storage Quota Selection ({totalGb} GB)
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
