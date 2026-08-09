import React, { useEffect, useState } from 'react';
import {
  Users, Image as ImageIcon, BarChart3, Heart, Sparkles, PartyPopper, QrCode, Calendar, DollarSign,
  Building2, Trash2, RefreshCw, Upload, FileSpreadsheet, Key, X, FileText, UserPlus, Edit2, Search, HardDrive, Shield, CheckCircle2, ShieldAlert, Crown, Lock, Menu, ChevronDown
} from 'lucide-react';
import PhotoGallery from './PhotoGallery';
import { resolveApiUrl } from '../api';

const normalizeMemberNumber = num => String(num || '').trim();

export default function AdminPortal({
  user,
  club,
  members,
  photos,
  onUpdateClub,
  onAddMember,
  onAddMembers,
  onUpdateMember,
  onDeleteMember,
  onSetMemberPassword,
  onDeletePhoto,
  onUpdatePhoto,
  onHeartPhoto,
  onResetDatabase,
  demoMode,
  addToast
}) {
  const [activeSubTab, setActiveSubTab] = useState('gallery'); // 'gallery' | 'clubs' | 'dashboard' | 'members' | 'moderation' | 'cloud'
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const subTabs = [
    { id: 'gallery', label: 'Member Gallery Feed', icon: ImageIcon },
    { id: 'clubs', label: 'Club Setup & Branding', icon: Building2 },
    { id: 'dashboard', label: 'Overview & Analytics', icon: BarChart3 },
    { id: 'members', label: 'Member & Staff Directory', icon: Users },
    { id: 'moderation', label: 'Moderate Photos', icon: Shield },
    { id: 'cloud', label: 'Storage Usage', icon: HardDrive },
    { id: 'events', label: '🎉 Private Event Vaults (Coming Soon)', icon: PartyPopper },
  ];

  const currentTabObj = subTabs.find(t => t.id === activeSubTab) || subTabs[0];
  const ActiveTabIcon = currentTabObj.icon;

  // Club settings state
  const [clubName, setClubName] = useState(club.name || '');
  const [clubShortName, setClubShortName] = useState(club.shortName || '');
  const [clubLogoUrl, setClubLogoUrl] = useState(club.logoUrl || '');

  // Member & Staff management state
  const [newMemberNum, setNewMemberNum] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('member'); // 'member' | 'admin' | 'owner'
  const [memberSearch, setMemberSearch] = useState('');
  const [memberPage, setMemberPage] = useState(1);
  const [csvText, setCsvText] = useState('');

  // Active Member Modal State ('add' | 'csv' | 'excel' | null)
  const [activeModal, setActiveModal] = useState(null);

  // Excel state
  const [workbook, setWorkbook] = useState(null);
  const [workbookName, setWorkbookName] = useState('');
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

  // Storage Basket State
  const [extraStorageGb, setExtraStorageGb] = useState(0);

  const categories = ['All', 'General', 'Tennis', 'Golf', 'Dining', 'Clubhouse', 'Events'];

  const isOwner = user?.role === 'owner';

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
    if (file.size > 512 * 1024) {
      addToast('Logo image must be under 512 KB.', 'error');
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

    const findIndex = (headers, candidates) => {
      return headers.findIndex(h => {
        const clean = String(h).toLowerCase().replace(/[^a-z0-9]/g, '');
        return candidates.some(c => clean.includes(c));
      });
    };

    const idxMem = findIndex(rawHeaders, ['membernum', 'memberno', 'memberid', 'number', 'id', 'member']);
    const idxLast = findIndex(rawHeaders, ['lastname', 'surname', 'familyname', 'last']);
    const idxFirst = findIndex(rawHeaders, ['firstname', 'givenname', 'first']);
    const idxEmail = findIndex(rawHeaders, ['email', 'emailaddress', 'mail']);

    const nextMap = {
      memberNumber: idxMem !== -1 ? rawHeaders[idxMem] : rawHeaders[0] || '',
      lastName: idxLast !== -1 ? rawHeaders[idxLast] : rawHeaders[1] || '',
      firstName: idxFirst !== -1 ? rawHeaders[idxFirst] : rawHeaders[2] || '',
      email: idxEmail !== -1 ? rawHeaders[idxEmail] : rawHeaders[3] || ''
    };

    setColumnMap(nextMap);
  };

  const handleExcelImport = async (e) => {
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

    let skippedCount = 0;
    const reasons = {};
    const candidateMembers = [];
    const existingNumbers = new Set(members.map(member => normalizeMemberNumber(member.memberNumber)));
    const importNumbers = new Set();

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

      if (existingNumbers.has(memberNum) || importNumbers.has(memberNum)) {
        skippedCount++;
        reasons[existingNumbers.has(memberNum) ? 'member number already exists' : 'duplicate in spreadsheet'] = (reasons[existingNumbers.has(memberNum) ? 'member number already exists' : 'duplicate in spreadsheet'] || 0) + 1;
        return;
      }
      importNumbers.add(memberNum);
      candidateMembers.push({
        memberNumber: memberNum,
        lastName: String(lNameRaw).trim(),
        firstName: String(fNameRaw).trim(),
        email: emailVal,
        role: 'member',
        password: '',
        registeredAt: ''
      });
    });

    if (candidateMembers.length === 0) {
      setExcelImportSummary({ addedCount: 0, skippedCount, reasons });
      return setExcelStatus('No new valid members were found in this workbook.');
    }

    setExcelStatus(`Importing ${candidateMembers.length.toLocaleString()} members…`);
    try {
      const result = await (onAddMembers ? onAddMembers(candidateMembers) : Promise.all(candidateMembers.map(onAddMember)).then(() => ({ addedCount: candidateMembers.length, skippedCount: 0, reasons: {} })));
      const summary = {
        addedCount: Number(result?.addedCount ?? candidateMembers.length),
        skippedCount: skippedCount + Number(result?.skippedCount || 0),
        reasons: { ...reasons, ...(result?.reasons || {}) }
      };
      setExcelImportSummary(summary);
      setExcelStatus(`Import complete: ${summary.addedCount.toLocaleString()} added, ${summary.skippedCount.toLocaleString()} skipped.`);
      addToast(`Imported ${summary.addedCount.toLocaleString()} member(s) from Excel.`, 'success');
    } catch (error) {
      console.error('Roster import failed', error);
      setExcelStatus(error.message || 'The roster could not be imported. No changes were confirmed.');
      addToast('Roster import failed. Please try again.', 'error');
    }
  };

  // Tiered Member Categorization
  const totalMembers = members.length;
  const accountOwner = user?.role === 'owner' ? { ...user, role: 'owner' } : null;
  const rosterOwners = members.filter(m => m.role === 'owner');
  const owners = accountOwner
    ? [accountOwner, ...rosterOwners.filter(owner => owner.memberNumber !== accountOwner.memberNumber)]
    : rosterOwners;
  const staffAdmins = members.filter(m => m.role === 'admin');
  const regularMembers = members.filter(m => m.role !== 'admin' && m.role !== 'owner');


  const topPhotos = [...photos]
    .filter(p => (p.hearts || 0) > 0)
    .sort((a, b) => (b.hearts || 0) - (a.hearts || 0))
    .slice(0, 3);

  const categoryCounts = photos.reduce((acc, p) => {
    acc[p.category] = (acc[p.category] || 0) + 1;
    return acc;
  }, {});

  const handleAddMemberSubmit = async (e) => {
    e.preventDefault();
    if (!newMemberNum || !newLastName || !newFirstName || !/^\S+@\S+\.\S+$/.test(newEmail)) {
      addToast('Please fill out all member fields.', 'error');
      return;
    }

    if (newRole === 'owner' && owners.length >= 3) {
      addToast('Maximum of 3 Club Owners allowed per workspace.', 'error');
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

    try {
      await onAddMember(newMember);
      addToast(`${newRole === 'owner' ? 'Club Owner' : newRole === 'admin' ? 'Staff Admin' : 'Member'} ${newFirstName} ${newLastName} added!`, 'success');
    } catch (error) {
      addToast(error.message || 'Could not add this person to the roster.', 'error');
      return;
    }

    setNewMemberNum('');
    setNewLastName('');
    setNewFirstName('');
    setNewEmail('');
    setNewRole('member');
    setActiveModal(null);
  };

  const handleToggleOwnerRole = async (member) => {
    if (member.role === 'owner') {
      if (owners.length <= 1) {
        addToast('At least one Club Owner is required per workspace.', 'error');
        return;
      }
      await onUpdateMember(member.memberNumber, { role: 'admin' });
      addToast(`Revoked Owner privileges for ${member.firstName} ${member.lastName}. Assigned as Staff Admin.`, 'info');
    } else {
      if (owners.length >= 3) {
        addToast('Maximum of 3 Club Owners allowed per club workspace.', 'error');
        return;
      }
      await onUpdateMember(member.memberNumber, { role: 'owner' });
      addToast(`Granted Club Owner & Billing access to ${member.firstName} ${member.lastName}!`, 'success');
    }
  };

  const handleToggleAdminRole = async (member) => {
    const nextRole = member.role === 'admin' ? 'member' : 'admin';
    try {
      await onUpdateMember(member.memberNumber, { role: nextRole });
      addToast(
        nextRole === 'admin'
          ? `${member.firstName} ${member.lastName} is now a Staff Admin. They can sign in with their member number and password.`
          : `${member.firstName} ${member.lastName} admin privileges revoked. Returned to member roster.`,
        'success'
      );
    } catch (err) {
      console.error(err);
      addToast('Failed updating admin privileges.', 'error');
    }
  };

  const handleCsvImportSubmit = async (e) => {
    e.preventDefault();
    if (!csvText.trim()) return addToast('Please enter CSV data to import.', 'error');

    const lines = csvText.split('\n').map(l => l.trim()).filter(Boolean);
    const importMembers = [];
    const existingNumbers = new Set(members.map(member => normalizeMemberNumber(member.memberNumber)));
    const importNumbers = new Set();

    lines.forEach(line => {
      const parts = line.split(',').map(p => p.trim());
      if (parts.length >= 4) {
        const [memNum, lName, fName, emailVal] = parts;
        const memberNum = normalizeMemberNumber(memNum);
        if (memberNum && lName && fName && /^\S+@\S+\.\S+$/.test(emailVal)) {
          if (!existingNumbers.has(memberNum) && !importNumbers.has(memberNum)) {
            importNumbers.add(memberNum);
            importMembers.push({
              memberNumber: memberNum,
              lastName: lName,
              firstName: fName,
              email: emailVal.toLowerCase(),
              role: 'member',
              password: '',
              registeredAt: ''
            });
          }
        }
      }
    });

    if (importMembers.length > 0) {
      try {
        const result = await (onAddMembers ? onAddMembers(importMembers) : Promise.all(importMembers.map(onAddMember)).then(() => ({ addedCount: importMembers.length })));
        addToast(`Successfully imported ${Number(result?.addedCount ?? importMembers.length).toLocaleString()} members!`, 'success');
      } catch (error) {
        console.error('CSV roster import failed', error);
        return addToast('CSV import failed. Please check the file and try again.', 'error');
      }
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
    if (window.confirm('Are you sure you want to reset the hub? All uploaded photos and roster members will be removed.')) {
      await onResetDatabase();
      addToast('Hub content has been reset.', 'info');
    }
  };

  // Moderation filtering
  const totalPhotos = photos.length;
  const filteredModPhotos = photos.filter(photo => {
    const matchesCategory = modCategory === 'All' || photo.category === modCategory;
    const query = modSearch.trim().toLowerCase();
    const matchesSearch = !query ||
      photo.caption?.toLowerCase().includes(query) ||
      photo.uploaderName?.toLowerCase().includes(query) ||
      photo.category?.toLowerCase().includes(query);

    return matchesCategory && matchesSearch;
  });

  // Regular Member Search Filtering
  const filteredRegularMembers = regularMembers.filter(m => {
    const query = memberSearch.trim().toLowerCase();
    if (!query) return true;
    return (
      m.firstName?.toLowerCase().includes(query) ||
      m.lastName?.toLowerCase().includes(query) ||
      m.email?.toLowerCase().includes(query) ||
      m.memberNumber?.toLowerCase().includes(query)
    );
  });
  const sortedRegularMembers = [...filteredRegularMembers].sort((a, b) => a.lastName.localeCompare(b.lastName));
  const memberPageSize = 50;
  const memberPageCount = Math.max(1, Math.ceil(sortedRegularMembers.length / memberPageSize));
  const visibleRegularMembers = sortedRegularMembers.slice((memberPage - 1) * memberPageSize, memberPage * memberPageSize);

  useEffect(() => {
    setMemberPage(1);
  }, [memberSearch, regularMembers.length]);

  // Clean Storage Bucket Metrics
  const baseGb = 25;
  const totalGb = baseGb + extraStorageGb;
  const approxUsedGb = ((totalPhotos * 2.5) / 1024).toFixed(2);

  return (
    <div className="admin-portal-layout animate-fade-in">
      
      {/* Mobile Hamburger Admin Bar */}
      <div className="admin-mobile-header-bar">
        <div className="admin-mobile-active-info">
          <ActiveTabIcon size={16} className="admin-mobile-active-icon" />
          <span className="admin-mobile-active-title">{currentTabObj.label}</span>
        </div>
        <button
          type="button"
          className="admin-mobile-hamburger-btn"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle Admin Navigation Menu"
        >
          {mobileMenuOpen ? <X size={15} /> : <Menu size={15} />}
          <span>Admin Menu</span>
          <ChevronDown size={13} className={`admin-mobile-chevron ${mobileMenuOpen ? 'open' : ''}`} />
        </button>

        {/* Inline Mobile Top Popover Menu */}
        {mobileMenuOpen && (
          <div className="admin-mobile-popover-menu animate-fade-in">
            <div className="admin-mobile-popover-list">
              {subTabs.map(tab => {
                const IconComp = tab.icon;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={`admin-mobile-popover-item ${activeSubTab === tab.id ? 'active' : ''}`}
                    onClick={() => {
                      setActiveSubTab(tab.id);
                      setMobileMenuOpen(false);
                    }}
                  >
                    <IconComp size={16} />
                    <span>{tab.label}</span>
                    {activeSubTab === tab.id && <CheckCircle2 size={15} className="active-check" />}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {mobileMenuOpen && (
        <div className="admin-mobile-popover-backdrop" onClick={() => setMobileMenuOpen(false)} />
      )}

      {/* Desktop Sidebar Navigation */}
      <div className="admin-sidebar desktop-only-sidebar">
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
            <span className="admin-sidebar-badge">
              {isOwner ? '👑 Club Owner' : 'Club Admin'}
            </span>
          </div>
        </div>

        <div className="admin-sidebar-nav-list">
          {subTabs.map(tab => {
            const IconComp = tab.icon;
            return (
              <button
                key={tab.id}
                className={`admin-menu-btn ${activeSubTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveSubTab(tab.id)}
              >
                <IconComp size={16} /> {tab.label}
              </button>
            );
          })}
        </div>

        {!demoMode && (
          <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
            <button className="btn-danger" style={{ width: '100%', justifyContent: 'center', backgroundColor: '#8B5CF6' }} onClick={handleResetDatabaseClick}>
              <RefreshCw size={14} /> Reset Hub Content
            </button>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="admin-card">

        {/* --- 0. MEMBER GALLERY FEED --- */}
        {activeSubTab === 'gallery' && (
          <div>
            <div className="admin-section-header" style={{ marginBottom: '16px' }}>
              <div>
                <h2 className="admin-section-title">Live Member Gallery & Engagement</h2>
                <p style={{ fontSize: '13px', color: 'var(--club-gray-dark)', margin: '4px 0 0' }}>
                  Preview how members experience photos, likes, and social engagement inside {club.name}'s private portal.
                </p>
              </div>
            </div>
            <PhotoGallery 
              photos={photos} 
              currentUser={user} 
              isAdmin={true} 
              onHeartPhoto={onHeartPhoto} 
              onDeletePhoto={onDeletePhoto} 
              addToast={addToast} 
            />
          </div>
        )}

        {/* --- PRIVATE EVENT VAULTS (COMING SOON) --- */}
        {activeSubTab === 'events' && (
          <div className="animate-fade-in" style={{ padding: '8px 4px' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '5px 12px', background: 'rgba(251, 191, 36, 0.15)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '999px', fontSize: '11.5px', fontWeight: '800', color: '#b45309', marginBottom: '14px' }}>
              <Sparkles size={14} /> UPCOMING FEATURE • 100% OFFLINE BILLING FOR CLUBS
            </div>

            <h2 className="admin-section-title" style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 6px' }}>
              🎉 Private Event Photo Vaults (Weddings, Galas & Tournaments)
            </h2>
            <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.6', maxWidth: '720px', margin: '0 0 24px' }}>
              Offer members an exclusive 30-day digital photo vault for private weddings, 50th anniversaries, and golf tournaments hosted at <strong>{club.name}</strong>.
            </p>

            {/* Offline Billing Banner Card */}
            <div style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', borderRadius: '18px', padding: '24px', color: '#ffffff', marginBottom: '28px', boxShadow: '0 12px 30px rgba(15, 23, 42, 0.15)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <DollarSign size={22} style={{ color: '#fbbf24' }} />
                <h3 style={{ margin: 0, fontSize: '17px', fontWeight: '800', color: '#fbbf24' }}>
                  Flexible Pricing — 100% Dependent on Your Club's Strategy
                </h3>
              </div>
              <p style={{ margin: '0 0 16px', fontSize: '13.5px', color: '#cbd5e1', lineHeight: '1.6' }}>
                You have complete freedom over event pricing. While standalone consumer event platforms typically charge <strong>$250 to $600+ per single wedding</strong>, your club can bundle Private Event Vaults into catering packages or bill <strong>$350 – $750+</strong> directly on the member's monthly banquet invoice.
                <br /><br />
                <strong>Club PhotoHub charges $0 per-event transaction fees</strong> and handles zero billing. 100% of the event revenue stays directly with your club.
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontSize: '12.5px', color: '#94a3b8', borderTop: '1px solid rgba(255, 255, 255, 0.1)', paddingTop: '14px' }}>
                <span>✓ <strong>Industry Benchmark:</strong> External vendors charge $250–$600/event</span>
                <span>✓ <strong>Offline Billing:</strong> Direct on club account or banquet invoice</span>
                <span>✓ <strong>$0 Transaction Fee:</strong> Keep 100% of event margin</span>
              </div>
            </div>

            {/* Feature Highlights Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '28px' }}>
              
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#2563eb', fontWeight: '800', fontSize: '15px' }}>
                  <Shield size={18} /> 100% Privacy Isolation
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                  Event photos are sealed inside an isolated vault. Zero leakage into general club feeds or other member galleries.
                </p>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#d97706', fontWeight: '800', fontSize: '15px' }}>
                  <QrCode size={18} /> QR Table Tents
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                  Print 1-click QR codes for reception tables. Guests scan with their phone camera and upload instantly — zero app download required.
                </p>
              </div>

              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '18px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', color: '#059669', fontWeight: '800', fontSize: '15px' }}>
                  <Calendar size={18} /> 30-Day Auto-Archiving
                </div>
                <p style={{ fontSize: '13px', color: '#64748b', margin: 0, lineHeight: '1.5' }}>
                  The event vault auto-expires on Day 30. The host receives a 1-click HD ZIP file of all guest photos directly to their email.
                </p>
              </div>

            </div>

            {/* Early Access Action */}
            <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '16px', padding: '20px', textAlign: 'center' }}>
              <h4 style={{ margin: '0 0 6px', fontSize: '15px', fontWeight: '800', color: '#0f172a' }}>
                Want to offer Event Vaults to {club.name}'s members?
              </h4>
              <p style={{ margin: '0 0 14px', fontSize: '13px', color: '#64748b' }}>
                We are granting early access beta keys to select private country & golf clubs.
              </p>
              <button
                type="button"
                className="btn-primary"
                style={{ padding: '10px 20px', borderRadius: '999px', fontSize: '13px', fontWeight: '800' }}
                onClick={() => addToast && addToast('🎉 Request submitted! Our team will contact your club leadership for early access.', 'success')}
              >
                <Sparkles size={16} /> Request Early Access Beta Key
              </button>
            </div>
          </div>
        )}

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
                <div className="stat-val">{owners.length}</div>
                <div className="stat-label">Club Owners (Max 3)</div>
              </div>
              <div className="stat-card">
                <div className="stat-val">{staffAdmins.length}</div>
                <div className="stat-label">Authorized Staff Admins</div>
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
                          <img src={resolveApiUrl(photo.url)} alt={photo.caption} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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

        {/* --- 3. THREE-TIERED MEMBER DIRECTORY: OWNERS -> STAFF ADMINS -> MEMBERS --- */}
        {activeSubTab === 'members' && (
          <div>
            <div className="admin-section-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h2 className="admin-section-title">Member & Staff Directory</h2>
                <span style={{ fontSize: '13px', color: 'var(--club-gray-dark)', fontWeight: '600' }}>
                  {totalMembers} total roster • {owners.length} Club Owners (Max 3) • {staffAdmins.length} Staff Admins • {regularMembers.length} Members
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

            {/* SEGREGATED TIER 1: CLUB OWNERS (MAX 3) */}
            <div className="segregated-owner-card" style={{ marginTop: '20px', background: 'rgba(217, 119, 6, 0.05)', border: '1.5px solid rgba(217, 119, 6, 0.4)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'linear-gradient(135deg, #F59E0B, #D97706)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)' }}>
                    <Crown size={20} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#92400E', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      Club Owners ({owners.length} / 3 Max)
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--club-gray-dark)' }}>
                      Primary club owners with full billing, subscription, and administrative authority (Strict Maximum: 3 Owners).
                    </p>
                  </div>
                </div>

                <span style={{ fontSize: '11px', fontWeight: '800', padding: '4px 10px', borderRadius: '12px', background: '#D97706', color: '#fff' }}>
                  👑 Billing & Workspace Authority
                </span>
              </div>

              {owners.length > 0 ? (
                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr style={{ background: 'rgba(217, 119, 6, 0.1)' }}>
                        <th>Owner Access</th>
                        <th>Owner Name</th>
                        <th>Email</th>
                        <th>Privileges</th>
                        <th style={{ textAlign: 'right' }}>Owner Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {owners.map(owner => (
                        <tr key={owner.memberNumber} style={{ background: '#fff' }}>
                          <td style={{ fontWeight: '800', color: '#B45309' }}>
                            {owner.memberNumber === user?.memberNumber ? 'Primary owner' : 'Club owner'}
                          </td>
                          <td style={{ fontWeight: '700', color: 'var(--club-navy)' }}>
                            {owner.firstName} {owner.lastName}
                            {owner.memberNumber === user?.memberNumber && <span style={{ marginLeft: '6px', fontSize: '10px', background: '#FEF3C7', color: '#B45309', padding: '2px 6px', borderRadius: '4px', fontWeight: '800' }}>You</span>}
                          </td>
                          <td>{owner.email}</td>
                          <td>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '800', backgroundColor: '#FEF3C7', color: '#B45309' }}>
                              <Crown size={12} /> Club Owner & Billing
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn-text"
                              style={{ color: 'var(--club-danger)', fontWeight: '700', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => handleToggleOwnerRole(owner)}
                              disabled={owner.memberNumber === user?.memberNumber || owners.length <= 1}
                              title={owner.memberNumber === user?.memberNumber ? "Your owner access is required" : owners.length <= 1 ? "At least one owner required" : "Revoke owner privileges"}
                            >
                              <ShieldAlert size={14} /> {owner.memberNumber === user?.memberNumber ? 'Current Owner' : 'Revoke Owner Status'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '16px', background: '#fff', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--club-gray-dark)', fontSize: '13px' }}>
                  No Club Owner assigned.
                </div>
              )}
            </div>

            {/* SEGREGATED TIER 2: AUTHORIZED STAFF ADMINS TABLE */}
            <div className="segregated-admin-card" style={{ marginTop: '24px', background: 'rgba(139, 92, 246, 0.04)', border: '1.5px solid rgba(139, 92, 246, 0.3)', borderRadius: 'var(--radius-lg)', padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#8B5CF6', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Shield size={18} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#5B21B6' }}>
                      Authorized Staff Admins ({staffAdmins.length})
                    </h3>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--club-gray-dark)' }}>
                      Segregated list of employees with administrative portal access and photo moderation privileges.
                    </p>
                  </div>
                </div>

                <span style={{ fontSize: '11px', fontWeight: '700', padding: '4px 10px', borderRadius: '12px', background: '#8B5CF6', color: '#fff' }}>
                  Staff Moderation Access
                </span>
              </div>

              {staffAdmins.length > 0 ? (
                <div className="table-wrapper">
                  <table className="admin-table">
                    <thead>
                      <tr style={{ background: 'rgba(139, 92, 246, 0.08)' }}>
                        <th>Staff / Member #</th>
                        <th>Admin Name</th>
                        <th>Roster Email</th>
                        <th>Privileges</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {staffAdmins.map(admin => (
                        <tr key={admin.memberNumber} style={{ background: '#fff' }}>
                          <td style={{ fontWeight: '800', color: '#6D28D9' }}>#{admin.memberNumber}</td>
                          <td style={{ fontWeight: '700', color: 'var(--club-navy)' }}>{admin.firstName} {admin.lastName}</td>
                          <td>{admin.email}</td>
                          <td>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '3px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', backgroundColor: 'rgba(139, 92, 246, 0.15)', color: '#6D28D9' }}>
                              <Shield size={12} /> Staff Admin
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              type="button"
                              className="btn-text"
                              style={{ color: '#D97706', padding: '4px 8px', marginRight: '6px', fontWeight: '700', fontSize: '12px' }}
                              onClick={() => handleToggleOwnerRole(admin)}
                              disabled={owners.length >= 3}
                              title={owners.length >= 3 ? "Maximum of 3 Club Owners reached" : "Make Club Owner"}
                            >
                              <Crown size={13} /> {owners.length >= 3 ? 'Max Owners' : 'Make Owner'}
                            </button>
                            <button
                              type="button"
                              className="btn-text"
                              style={{ color: 'var(--club-danger)', fontWeight: '700', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => handleToggleAdminRole(admin)}
                            >
                              <ShieldAlert size={14} /> Revoke Admin Access
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div style={{ padding: '16px', background: '#fff', borderRadius: 'var(--radius-md)', textAlign: 'center', color: 'var(--club-gray-dark)', fontSize: '13px' }}>
                  No extra staff admins assigned yet. Click "Promote to Admin" on any member in the table below to promote them.
                </div>
              )}
            </div>

            {/* SEGREGATED TIER 3: CLUB MEMBERS ROSTER TABLE */}
            <div style={{ marginTop: '28px' }}>
              <div className="member-directory-heading" style={{ marginBottom: '14px' }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: 'var(--club-navy)' }}>
                    Club Members Roster ({regularMembers.length})
                  </h3>
                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--club-gray-dark)' }}>
                    General club membership roster with standard photo gallery access.
                  </p>
                </div>

                <div className="gallery-search-box member-directory-search" style={{ maxWidth: '280px' }}>
                  <Search size={14} className="gallery-search-icon" />
                  <input
                    type="text"
                    className="gallery-search-input"
                    placeholder="Search roster members..."
                    value={memberSearch}
                    onChange={(e) => { setMemberSearch(e.target.value); setMemberPage(1); }}
                  />
                  {memberSearch && (
                    <button type="button" className="search-clear-btn" onClick={() => setMemberSearch('')}>
                      <X size={14} />
                    </button>
                  )}
                </div>
              </div>

              <div className="table-wrapper member-directory-table">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Member Number</th>
                      <th>Name</th>
                      <th>Roster Email</th>
                      <th>Hub Status</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visibleRegularMembers.map(member => (
                      <tr key={member.memberNumber}>
                        <td style={{ fontWeight: '700' }}>#{member.memberNumber}</td>
                        <td style={{ fontWeight: '600' }}>{member.firstName} {member.lastName}</td>
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
                            style={{ color: '#D97706', padding: '4px', marginRight: '6px', fontWeight: '700', fontSize: '12px' }}
                            onClick={() => handleToggleOwnerRole(member)}
                            disabled={owners.length >= 3}
                            title={owners.length >= 3 ? "Maximum of 3 Club Owners reached" : "Make Owner"}
                          >
                            <Crown size={13} /> {owners.length >= 3 ? 'Max Owners' : 'Make Owner'}
                          </button>

                          <button
                            className="btn-text"
                            style={{ color: '#6D28D9', padding: '4px', marginRight: '6px', fontWeight: '700', fontSize: '12px' }}
                            onClick={() => handleToggleAdminRole(member)}
                            title="Promote member to Staff Admin"
                          >
                            <Shield size={13} /> Promote to Admin
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
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="directory-pagination" aria-label="Member directory pages">
                <span>Showing {sortedRegularMembers.length === 0 ? 0 : (memberPage - 1) * memberPageSize + 1}–{Math.min(memberPage * memberPageSize, sortedRegularMembers.length)} of {sortedRegularMembers.length}</span>
                <div>
                  <button type="button" className="btn-secondary" disabled={memberPage <= 1} onClick={() => setMemberPage(page => Math.max(1, page - 1))}>Previous</button>
                  <span>Page {memberPage} of {memberPageCount}</span>
                  <button type="button" className="btn-secondary" disabled={memberPage >= memberPageCount} onClick={() => setMemberPage(page => Math.min(memberPageCount, page + 1))}>Next</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- 4. MODERATE PHOTOS TAB --- */}
        {activeSubTab === 'moderation' && (
          <div>
            <div className="admin-section-header">
              <div>
                <h2 className="admin-section-title">Photo Moderation Gallery</h2>
                <p style={{ fontSize: '13px', color: 'var(--club-gray-dark)', margin: '4px 0 0' }}>
                  Review gallery submissions, update image captions, and manage photo content.
                </p>
              </div>
            </div>

            {/* Sub-toolbar */}
            <div className="mod-toolbar" style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
              <div className="category-filter-pills">
                {categories.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`filter-pill ${modCategory === cat ? 'active' : ''}`}
                    onClick={() => setModCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              <div className="gallery-search-box" style={{ maxWidth: '280px', flex: 1 }}>
                <Search size={14} className="gallery-search-icon" />
                <input
                  type="text"
                  className="gallery-search-input"
                  placeholder="Search caption or uploader..."
                  value={modSearch}
                  onChange={(e) => setModSearch(e.target.value)}
                />
                {modSearch && (
                  <button type="button" className="search-clear-btn" onClick={() => setModSearch('')}>
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Moderation Photo Grid - Matching Gallery Grid Cards */}
            {filteredModPhotos.length > 0 ? (
              <div className="gallery-grid photo-gallery-grid">
                {filteredModPhotos.map(photo => (
                  <div key={photo.id} className="photo-card gallery-grid-card">
                    <span className="photo-card-img-wrapper">
                      <img src={resolveApiUrl(photo.url)} alt={photo.caption} className="photo-card-img" loading="lazy" />
                      <span className="photo-card-category">{photo.category}</span>
                      <span className="photo-card-hearts"><Heart size={13} fill="currentColor" /> {photo.hearts || 0}</span>
                    </span>

                    <div className="photo-card-details" style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                      <div>
                        {editingPhotoId === photo.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
                            <input
                              type="text"
                              className="input-field"
                              style={{ fontSize: '13px', padding: '6px 10px' }}
                              value={editCaptionText}
                              onChange={(e) => setEditCaptionText(e.target.value)}
                              autoFocus
                            />
                            <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                              <button type="button" className="btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => setEditingPhotoId(null)}>Cancel</button>
                              <button type="button" className="btn-gold" style={{ padding: '4px 10px', fontSize: '11px' }} onClick={() => handleSaveEditedCaption(photo.id)}>Save Caption</button>
                            </div>
                          </div>
                        ) : (
                          <p className="photo-card-caption" style={{ margin: '0 0 6px', fontSize: '14px', lineHeight: '1.4' }}>
                            <strong>{photo.uploaderName || 'Club Member'}</strong> "{photo.caption}"
                          </p>
                        )}
                        <span className="photo-card-date" style={{ fontSize: '12px', color: 'var(--club-gray-dark)', display: 'block' }}>
                          Uploaded {new Date(photo.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '14px', paddingTop: '10px', borderTop: '1px solid var(--club-gray-light)' }}>
                        <button
                          type="button"
                          className="btn-text"
                          style={{ color: 'var(--club-navy)', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: '700' }}
                          onClick={() => handleStartEditCaption(photo)}
                        >
                          <Edit2 size={14} /> Edit Caption
                        </button>

                        <button
                          type="button"
                          className="btn-text"
                          style={{ color: 'var(--club-danger)', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: '700' }}
                          onClick={() => {
                            if (window.confirm('Are you sure you want to delete this photo from the gallery?')) {
                              onDeletePhoto(photo.id);
                              addToast('Photo deleted.', 'info');
                            }
                          }}
                        >
                          <Trash2 size={14} /> Delete
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

        {/* --- 5. CLUB PHOTO STORAGE QUOTA & PRICING (RESTRICTED TO OWNER) --- */}
        {activeSubTab === 'cloud' && (
          <div>
            <div className="admin-section-header">
              <div>
                <h2 className="admin-section-title">Club Photo Storage Quota</h2>
                <p style={{ fontSize: '13px', color: 'var(--club-gray-dark)', margin: '4px 0 0' }}>
                  Monitor club photo storage capacity and manage storage bucket expansion options.
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

            {/* Storage Bucket Expansion Packs - OWNER ONLY */}
            {isOwner ? (
              <div className="storage-calculator-box">
                <h3 className="storage-calc-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Crown size={18} style={{ color: '#D97706' }} /> Storage Bucket Expansion Packs & Subscription
                </h3>
                <p style={{ fontSize: '13px', color: 'var(--club-navy)', fontWeight: '500', marginBottom: '16px' }}>
                  Your base plan includes <strong>25 GB</strong> storage quota. As a <strong>Club Owner</strong>, you can select an expansion pack to upgrade capacity:
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
            ) : (
              <div style={{ background: 'var(--club-gray-light)', padding: '20px', borderRadius: 'var(--radius-md)', border: '1px solid var(--club-gray)', marginTop: '20px' }}>
                <h4 style={{ margin: '0 0 8px', color: 'var(--club-navy)', fontSize: '14px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Lock size={16} style={{ color: '#D97706' }} /> Owner-Only Subscription & Billing Controls
                </h4>
                <p style={{ margin: 0, fontSize: '13px', color: 'var(--club-gray-dark)' }}>
                  Storage bucket expansion packs, plan pricing, and billing subscription options are accessible exclusively to designated <strong>Club Owners (Max 3)</strong>.
                </p>
              </div>
            )}
          </div>
        )}

        {/* --- MODAL DRAWER FOR ADD MEMBER / STAFF ADMIN / OWNER --- */}
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
                    <option value="admin">Staff Admin (Photo Moderation & Roster Access)</option>
                    <option value="owner" disabled={owners.length >= 3}>
                      Club Owner {owners.length >= 3 ? '(Max 3 Reached)' : '(Full Billing & Workspace Authority)'}
                    </option>
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
                    <p style={{ fontSize: '12px', color: 'var(--club-gray-dark)' }}>Map columns:</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '700' }}>Member Number</label>
                        <select className="select-field" value={columnMap.memberNumber} onChange={e => setColumnMap({ ...columnMap, memberNumber: e.target.value })}>
                          {sheetHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '700' }}>Last Name</label>
                        <select className="select-field" value={columnMap.lastName} onChange={e => setColumnMap({ ...columnMap, lastName: e.target.value })}>
                          {sheetHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '700' }}>First Name</label>
                        <select className="select-field" value={columnMap.firstName} onChange={e => setColumnMap({ ...columnMap, firstName: e.target.value })}>
                          {sheetHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: '700' }}>Email</label>
                        <select className="select-field" value={columnMap.email} onChange={e => setColumnMap({ ...columnMap, email: e.target.value })}>
                          {sheetHeaders.map(h => <option key={h} value={h}>{h}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="excel-preview" style={{ marginTop: '12px' }}>
                      <strong>Preview ({Math.min(sheetRows.length, 10)} of {sheetRows.length.toLocaleString()} rows)</strong>
                      <div className="table-wrapper">
                        <table className="admin-table">
                          <thead><tr>{sheetHeaders.map(header => <th key={header}>{header}</th>)}</tr></thead>
                          <tbody>{sheetRows.slice(0, 10).map((row, rowIndex) => <tr key={rowIndex}>{sheetHeaders.map((header, cellIndex) => <td key={`${rowIndex}-${header}`}>{String(row[cellIndex] ?? '')}</td>)}</tr>)}</tbody>
                        </table>
                      </div>
                    </div>
                  </>
                )}
                {excelImportSummary && (
                  <div className="excel-import-summary">
                    <strong>Import complete</strong>
                    <span>Imported {excelImportSummary.addedCount.toLocaleString()} rows, skipped {excelImportSummary.skippedCount.toLocaleString()}.</span>
                    {Object.entries(excelImportSummary.reasons || {}).map(([reason, count]) => <span key={reason}>{reason}: {count}</span>)}
                  </div>
                )}
                <div className="admin-modal-footer">
                  <button type="button" className="btn-secondary" onClick={() => setActiveModal(null)}>Cancel</button>
                  <button type="submit" className="btn-primary" disabled={!workbook}>Import Excel Rows</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
