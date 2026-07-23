import React, { useState } from 'react';
import {
  Users, Image as ImageIcon, BarChart3,
  Building2, Trash2, Plus, RefreshCw, Upload, FileSpreadsheet, Key, Database, AlertCircle, X, FileText, UserPlus
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
  addToast
}) {
  const [activeSubTab, setActiveSubTab] = useState('clubs'); // 'clubs' | 'dashboard' | 'members' | 'moderation' | 'cloud'

  // Club settings state
  const [clubName, setClubName] = useState(club.name || '');
  const [clubShortName, setClubShortName] = useState(club.shortName || '');
  const [clubLogoUrl, setClubLogoUrl] = useState(club.logoUrl || '');

  // Member management state
  const [newMemberNum, setNewMemberNum] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newEmail, setNewEmail] = useState('');
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

  // Moderation filter state
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [editCaption, setEditCaption] = useState('');

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

      sheets = [{ sheet: 'Sheet 1', rows }];
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

    // Auto-map header names if matching
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
      password: '',
      registeredAt: ''
    };

    onAddMember(newMember);
    addToast(`Member ${newFirstName} ${newLastName} added!`, 'success');

    setNewMemberNum('');
    setNewLastName('');
    setNewFirstName('');
    setNewEmail('');
    setActiveModal(null);
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

  const handleResetDatabaseClick = async () => {
    if (window.confirm('Are you sure you want to reset the database? All custom photos and uploaded roster members will be cleared.')) {
      await onResetDatabase();
      addToast('Hub database reset to seed data.', 'info');
    }
  };

  return (
    <div className="admin-portal-layout animate-fade-in">
      
      {/* Sidebar Navigation */}
      <div className="admin-sidebar">
        <div className="admin-sidebar-header">
          {club.logoUrl ? (
            <img src={club.logoUrl} alt={club.name} className="admin-sidebar-logo" />
          ) : (
            <div className="admin-sidebar-logo-fallback">{(club.name || 'C').charAt(0)}</div>
          )}
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
          <Users size={16} /> Member Directory
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
                <div className="stat-val">{registeredCount}</div>
                <div className="stat-label">Registered Members</div>
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
                    <Upload size={14} /> Choose Club Crest Logo
                  </label>
                  <input
                    id="clubLogoFile"
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={handleClubLogoChange}
                    style={{ display: 'none' }}
                  />
                  <span className="logo-upload-hint">Upload a transparent PNG, JPG, or WebP (Max size 256 KB)</span>
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

        {/* --- 3. REORGANIZED MEMBER DIRECTORY --- */}
        {activeSubTab === 'members' && (
          <div>
            <div className="admin-section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 className="admin-section-title">Club Member Roster</h2>
                <span style={{ fontSize: '13px', color: 'var(--club-gray-dark)', fontWeight: '600' }}>
                  {totalMembers} total members enrolled • {registeredCount} registered
                </span>
              </div>

              {/* Top Action Buttons to open import modals */}
              <div className="admin-actions-bar">
                <button type="button" className="btn-primary" onClick={() => setActiveModal('add')}>
                  <UserPlus size={15} /> Add Member
                </button>
                <button type="button" className="btn-secondary" onClick={() => setActiveModal('csv')}>
                  <FileText size={15} /> Import CSV
                </button>
                <button type="button" className="btn-secondary" onClick={() => setActiveModal('excel')}>
                  <FileSpreadsheet size={15} /> Import Excel
                </button>
              </div>
            </div>

            {/* Main Focus: Member Directory Table */}
            <div className="table-wrapper member-directory-table" style={{ marginTop: '16px' }}>
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
                      <td style={{ fontWeight: '700' }}>#{member.memberNumber}</td>
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
                          {member.registeredAt ? 'Registered' : 'Password Pending'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn-text"
                          style={{ color: 'var(--club-green)', padding: '4px', marginRight: '6px' }}
                          onClick={async () => {
                            const nextEmail = window.prompt(`Update roster email for ${member.firstName} ${member.lastName}:`, member.email || '');
                            if (nextEmail === null) return;
                            await onUpdateMember(member.memberNumber, { email: nextEmail.trim().toLowerCase() });
                            addToast('Member email updated.', 'success');
                          }}
                        >
                          Edit
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
                          <Key size={14} /> Password
                        </button>

                        <button
                          className="btn-text"
                          style={{ color: 'var(--club-danger)', padding: '4px' }}
                          onClick={async () => {
                            if (window.confirm(`Delete member ${member.firstName} ${member.lastName}?`)) {
                              await onDeleteMember(member.memberNumber);
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

        {/* --- MODAL DRAWER FOR ADD MEMBER --- */}
        {activeModal === 'add' && (
          <div className="admin-modal-backdrop" onClick={() => setActiveModal(null)}>
            <div className="admin-modal-card" onClick={e => e.stopPropagation()}>
              <div className="admin-modal-header">
                <h3><UserPlus size={18} /> Add Individual Member</h3>
                <button type="button" className="admin-modal-close" onClick={() => setActiveModal(null)}><X size={18} /></button>
              </div>
              <form className="admin-modal-body" onSubmit={handleAddMemberSubmit}>
                <div className="form-group">
                  <label>Member Number</label>
                  <input type="text" className="input-field" placeholder="e.g. 1006" value={newMemberNum} onChange={e => setNewMemberNum(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Roster Email</label>
                  <input type="email" className="input-field" placeholder="e.g. member@example.com" value={newEmail} onChange={e => setNewEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input type="text" className="input-field" placeholder="e.g. Smith" value={newLastName} onChange={e => setNewLastName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>First Name</label>
                  <input type="text" className="input-field" placeholder="e.g. Jane" value={newFirstName} onChange={e => setNewFirstName(e.target.value)} required />
                </div>
                <div className="admin-modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                  <button type="submit" className="btn-primary">Save Member</button>
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

        {/* --- 4. PHOTO MODERATION --- */}
        {activeSubTab === 'moderation' && (
          <div>
            <div className="admin-section-header">
              <h2 className="admin-section-title">Photo Moderation</h2>
            </div>
            <div className="gallery-grid photo-gallery-grid">
              {photos.map(photo => (
                <div key={photo.id} className="photo-card">
                  <img src={photo.url} alt={photo.caption} className="photo-card-img" />
                  <div className="photo-card-details">
                    <p className="photo-card-caption"><strong>{photo.uploaderName}</strong>: {photo.caption}</p>
                    <button className="btn-danger" style={{ marginTop: '8px', padding: '6px 12px', fontSize: '12px' }} onClick={() => onDeletePhoto(photo.id)}>
                      <Trash2 size={13} /> Delete Photo
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --- 5. CLOUD STORAGE --- */}
        {activeSubTab === 'cloud' && (
          <div>
            <div className="admin-section-header">
              <h2 className="admin-section-title">Cloud Storage & API Status</h2>
            </div>
            <div style={{ background: 'var(--club-gray-light)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--club-gray)' }}>
              <p><strong>Cloud Storage:</strong> {firebaseConfig ? 'Cloudflare Worker & R2 Bucket Active' : 'Local IndexedDB Mode (Offline)'}</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
