import React, { useState } from 'react';
import { Calendar, PartyPopper, MapPin, Search, Plus, Building2, RefreshCw, Edit2, Trash2, X, Check, ShieldAlert } from 'lucide-react';

export default function EventSchedule({
  user,
  club,
  isAdmin = false,
  events = [],
  venues = ['Dining Room'],
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onAddVenue,
  onResetEvents,
  addToast
}) {
  const [eventSearch, setEventSearch] = useState('');
  const [eventVenueFilter, setEventVenueFilter] = useState('All');
  const [eventModalOpen, setEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    name: '',
    date: '',
    displayDate: '',
    venues: ['Dining Room'],
    status: 'Scheduled'
  });
  const [newSpaceName, setNewSpaceName] = useState('');
  const [showAddSpaceInput, setShowAddSpaceInput] = useState(false);
  const [deleteEventTarget, setDeleteEventTarget] = useState(null);

  const filteredEvents = events.filter(evt => {
    const query = eventSearch.trim().toLowerCase();
    const matchesSearch = !query ||
      evt.name?.toLowerCase().includes(query) ||
      (evt.displayDate || '').toLowerCase().includes(query) ||
      (Array.isArray(evt.venues) ? evt.venues.join(' ') : (evt.location || '')).toLowerCase().includes(query);

    const matchesVenue = eventVenueFilter === 'All' ||
      (Array.isArray(evt.venues) ? evt.venues.includes(eventVenueFilter) : evt.location === eventVenueFilter);

    return matchesSearch && matchesVenue;
  });

  const handleSaveEvent = (e) => {
    e.preventDefault();
    if (!eventForm.name.trim()) {
      if (addToast) addToast('Event name is required.', 'error');
      return;
    }
    const selectedVenues = eventForm.venues && eventForm.venues.length > 0 ? eventForm.venues : ['Dining Room'];

    let formattedDisplay = eventForm.displayDate;
    if (!formattedDisplay && eventForm.date) {
      try {
        const parts = eventForm.date.split('-');
        if (parts.length === 3) {
          const d = new Date(parts[0], parts[1] - 1, parts[2]);
          formattedDisplay = d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
        }
      } catch {
        formattedDisplay = eventForm.date;
      }
    }

    if (editingEvent) {
      if (onUpdateEvent) {
        onUpdateEvent(editingEvent.id, {
          name: eventForm.name.trim(),
          date: eventForm.date,
          displayDate: formattedDisplay || eventForm.date,
          venues: selectedVenues,
          status: eventForm.status
        });
      }
    } else {
      if (onAddEvent) {
        onAddEvent({
          id: `evt-${Date.now()}`,
          name: eventForm.name.trim(),
          date: eventForm.date,
          displayDate: formattedDisplay || eventForm.date,
          venues: selectedVenues,
          status: eventForm.status
        });
      }
    }
    setEventModalOpen(false);
  };

  return (
    <div className="event-schedule-container animate-fade-in" style={{ padding: '8px 4px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Banner */}
      <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 6px', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '10px' }}>
            📅 {club?.name || 'Club'} Event Schedule & Venues
          </h2>
          <p style={{ fontSize: '13.5px', color: '#475569', margin: 0, lineHeight: '1.5' }}>
            {isAdmin ? 'Manage your upcoming club schedule, assign multiple venue locations to events, and easily edit or delete events.' : 'Browse upcoming club celebrations, dinners, and events across all venue spaces.'}
          </p>
        </div>

        {isAdmin && (
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="btn-primary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 18px', borderRadius: '10px', fontSize: '13.5px', fontWeight: '700' }}
              onClick={() => {
                setEditingEvent(null);
                setEventForm({
                  name: '',
                  date: new Date().toISOString().split('T')[0],
                  displayDate: '',
                  venues: ['Dining Room'],
                  status: 'Scheduled'
                });
                setEventModalOpen(true);
              }}
            >
              <Plus size={16} /> Add New Event
            </button>

            <button
              type="button"
              className="btn-secondary"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '10px', fontSize: '13.5px', fontWeight: '600' }}
              onClick={() => setShowAddSpaceInput(prev => !prev)}
            >
              <Building2 size={16} /> Add Venue Space
            </button>

            <button
              type="button"
              className="btn-ghost"
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '10px 14px', borderRadius: '10px', fontSize: '13px', color: '#64748b' }}
              onClick={() => {
                if (window.confirm('Reset event schedule to initial 14 events? Custom edits will be restored.')) {
                  if (onResetEvents) onResetEvents();
                }
              }}
              title="Reset to default 14 events schedule"
            >
              <RefreshCw size={14} /> Reset Schedule
            </button>
          </div>
        )}
      </div>

      {/* Quick Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '22px' }}>
        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px 20px', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Events</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#0f172a', marginTop: '4px' }}>{events.length}</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px 20px', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Active Venues</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#2563eb', marginTop: '4px' }}>{venues.length}</div>
        </div>

        <div style={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px 20px', boxShadow: '0 2px 6px rgba(0, 0, 0, 0.02)' }}>
          <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Filtered Results</span>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#059669', marginTop: '4px' }}>{filteredEvents.length}</div>
        </div>
      </div>

      {/* Inline Add New Space Box (if toggled) */}
      {isAdmin && showAddSpaceInput && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newSpaceName.trim()) return;
            if (onAddVenue) onAddVenue(newSpaceName.trim());
            setNewSpaceName('');
            setShowAddSpaceInput(false);
          }}
          style={{ background: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '14px', padding: '16px 20px', marginBottom: '22px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}
        >
          <Building2 size={18} style={{ color: '#2563eb' }} />
          <span style={{ fontWeight: '700', fontSize: '13.5px', color: '#0f172a' }}>Add New Club Venue Space:</span>
          <input
            type="text"
            placeholder="e.g. Poolside Terrace, Grand Ballroom, Wine Cellar"
            value={newSpaceName}
            onChange={(e) => setNewSpaceName(e.target.value)}
            style={{ flex: 1, minWidth: '220px', padding: '8px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
            autoFocus
          />
          <button type="submit" className="btn-primary" style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}>
            Add Space
          </button>
          <button type="button" className="btn-secondary" style={{ padding: '8px 14px', borderRadius: '8px', fontSize: '13px' }} onClick={() => setShowAddSpaceInput(false)}>
            Cancel
          </button>
        </form>
      )}

      {/* Search & Venue Filter Bar */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', alignItems: 'center', marginBottom: '20px', background: '#ffffff', padding: '14px 18px', borderRadius: '14px', border: '1px solid #e2e8f0' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search events by name, date, or venue..."
            value={eventSearch}
            onChange={(e) => setEventSearch(e.target.value)}
            style={{ width: '100%', padding: '9px 12px 9px 36px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <MapPin size={15} style={{ color: '#64748b' }} />
          <span style={{ fontSize: '13px', fontWeight: '600', color: '#475569' }}>Filter Venue:</span>
          <select
            value={eventVenueFilter}
            onChange={(e) => setEventVenueFilter(e.target.value)}
            style={{ padding: '9px 14px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: '#ffffff', fontWeight: '600', color: '#0f172a' }}
          >
            <option value="All">All Venues ({venues.length})</option>
            {venues.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Event Table */}
      <div style={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#475569', fontWeight: '700', fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <th style={{ padding: '14px 18px' }}>Date</th>
                <th style={{ padding: '14px 18px' }}>Event Name</th>
                <th style={{ padding: '14px 18px' }}>Venues / Locations</th>
                <th style={{ padding: '14px 18px' }}>Status</th>
                {isAdmin && <th style={{ padding: '14px 18px', textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((evt, idx) => {
                const venueList = Array.isArray(evt.venues) && evt.venues.length > 0
                  ? evt.venues
                  : (evt.location ? [evt.location] : ['Dining Room']);

                return (
                  <tr key={evt.id || idx} style={{ borderBottom: '1px solid #f1f5f9', background: idx % 2 === 0 ? '#ffffff' : '#fcfcfd' }}>
                    
                    {/* Date Column */}
                    <td style={{ padding: '14px 18px', color: '#0f172a', fontWeight: '600', whiteSpace: 'nowrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Calendar size={15} style={{ color: '#2563eb', flexShrink: 0 }} />
                        <span>{evt.displayDate || evt.date}</span>
                      </div>
                    </td>

                    {/* Event Name Column */}
                    <td style={{ padding: '14px 18px', color: '#0f172a', fontWeight: '700' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <PartyPopper size={16} style={{ color: '#d97706', flexShrink: 0 }} />
                        <span>{evt.name}</span>
                      </div>
                    </td>

                    {/* Venues Multi-Select Badges Column */}
                    <td style={{ padding: '14px 18px' }}>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {venueList.map(v => (
                          <span
                            key={v}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '4px 10px',
                              borderRadius: '999px',
                              fontSize: '12px',
                              fontWeight: '700',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                              border: '1px solid #bfdbfe'
                            }}
                          >
                            <MapPin size={11} /> {v}
                          </span>
                        ))}
                      </div>
                    </td>

                    {/* Status Column */}
                    <td style={{ padding: '14px 18px' }}>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '3px 10px',
                          borderRadius: '999px',
                          fontSize: '11.5px',
                          fontWeight: '700',
                          background: evt.status === 'Completed' ? '#f1f5f9' : '#ecfdf5',
                          color: evt.status === 'Completed' ? '#64748b' : '#047857',
                          border: `1px solid ${evt.status === 'Completed' ? '#cbd5e1' : '#a7f3d0'}`
                        }}
                      >
                        {evt.status || 'Scheduled'}
                      </span>
                    </td>

                    {/* Actions Column (Admin Only) */}
                    {isAdmin && (
                      <td style={{ padding: '14px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingEvent(evt);
                              setEventForm({
                                name: evt.name || '',
                                date: evt.date || '',
                                displayDate: evt.displayDate || '',
                                venues: Array.isArray(evt.venues) && evt.venues.length > 0 ? [...evt.venues] : [evt.location || 'Dining Room'],
                                status: evt.status || 'Scheduled'
                              });
                              setEventModalOpen(true);
                            }}
                            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', background: '#ffffff', color: '#0f172a', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Edit event details or venues"
                          >
                            <Edit2 size={13} /> Edit
                          </button>

                          <button
                            type="button"
                            onClick={() => setDeleteEventTarget(evt)}
                            style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #fca5a5', background: '#fff5f5', color: '#dc2626', fontSize: '12.5px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            title="Delete event"
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    )}

                  </tr>
                );
              })}

              {filteredEvents.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 5 : 4} style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                    <Calendar size={36} style={{ color: '#cbd5e1', margin: '0 auto 12px' }} />
                    <div style={{ fontWeight: '700', fontSize: '15px', color: '#0f172a' }}>No events found</div>
                    <p style={{ margin: '4px 0 16px', fontSize: '13px' }}>Try adjusting your search query or venue filter.</p>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => { setEventSearch(''); setEventVenueFilter('All'); }}
                      style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}
                    >
                      Clear Filters
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- ADD / EDIT EVENT MODAL --- */}
      {isAdmin && eventModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setEventModalOpen(false)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              width: '100%',
              maxWidth: '560px',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
              padding: '28px'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #f1f5f9', paddingBottom: '14px' }}>
              <h3 style={{ margin: 0, fontSize: '19px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <PartyPopper size={20} style={{ color: '#2563eb' }} />
                {editingEvent ? 'Edit Club Event' : 'Add New Club Event'}
              </h3>
              <button
                type="button"
                onClick={() => setEventModalOpen(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#64748b', padding: '4px' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveEvent}>
              {/* Event Name */}
              <div style={{ marginBottom: '18px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Event Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Gala Dinner, Wine Tasting"
                  value={eventForm.name}
                  onChange={(e) => setEventForm(prev => ({ ...prev, name: e.target.value }))}
                  style={{ width: '100%', padding: '10px 14px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '14px', fontWeight: '600' }}
                />
              </div>

              {/* Event Date Fields */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Event Date
                  </label>
                  <input
                    type="date"
                    value={eventForm.date}
                    onChange={(e) => setEventForm(prev => ({ ...prev, date: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                    Display Date Format
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Saturday, Sept 26, 2026"
                    value={eventForm.displayDate}
                    onChange={(e) => setEventForm(prev => ({ ...prev, displayDate: e.target.value }))}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px' }}
                  />
                </div>
              </div>

              {/* --- MULTI-SELECT VENUES SELECTION --- */}
              <div style={{ marginBottom: '22px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '14px', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ fontSize: '13.5px', fontWeight: '800', color: '#0f172a', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={16} style={{ color: '#2563eb' }} />
                    Venues / Locations (Select Multiple)
                  </label>
                  <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>
                    {eventForm.venues?.length || 0} selected
                  </span>
                </div>

                <p style={{ fontSize: '12.5px', color: '#64748b', margin: '0 0 12px', lineHeight: '1.4' }}>
                  Click to select all venue spaces where this event takes place:
                </p>

                {/* Venue Toggle Chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                  {venues.map(venueName => {
                    const isSelected = eventForm.venues?.includes(venueName);
                    return (
                      <button
                        key={venueName}
                        type="button"
                        onClick={() => {
                          setEventForm(prev => {
                            const current = prev.venues || [];
                            const exists = current.includes(venueName);
                            const updated = exists ? current.filter(v => v !== venueName) : [...current, venueName];
                            return { ...prev, venues: updated };
                          });
                        }}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '6px 14px',
                          borderRadius: '999px',
                          fontSize: '13px',
                          fontWeight: '700',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          background: isSelected ? '#2563eb' : '#ffffff',
                          color: isSelected ? '#ffffff' : '#475569',
                          border: isSelected ? '1px solid #2563eb' : '1px solid #cbd5e1',
                          boxShadow: isSelected ? '0 2px 8px rgba(37, 99, 235, 0.25)' : 'none'
                        }}
                      >
                        {isSelected && <Check size={14} />}
                        {venueName}
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom Space Input inside Modal */}
                <div style={{ display: 'flex', gap: '8px', paddingTop: '10px', borderTop: '1px solid #e2e8f0' }}>
                  <input
                    type="text"
                    placeholder="+ Add new custom space name..."
                    value={newSpaceName}
                    onChange={(e) => setNewSpaceName(e.target.value)}
                    style={{ flex: 1, padding: '7px 12px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!newSpaceName.trim()) return;
                        const added = newSpaceName.trim();
                        if (onAddVenue) onAddVenue(added);
                        setEventForm(prev => ({
                          ...prev,
                          venues: [...(prev.venues || []), added]
                        }));
                        setNewSpaceName('');
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn-secondary"
                    style={{ padding: '7px 14px', borderRadius: '8px', fontSize: '12.5px', fontWeight: '700' }}
                    onClick={() => {
                      if (!newSpaceName.trim()) return;
                      const added = newSpaceName.trim();
                      if (onAddVenue) onAddVenue(added);
                      setEventForm(prev => ({
                        ...prev,
                        venues: [...(prev.venues || []), added]
                      }));
                      setNewSpaceName('');
                    }}
                  >
                    Add Space
                  </button>
                </div>
              </div>

              {/* Status selection */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: '#334155', marginBottom: '6px' }}>
                  Event Status
                </label>
                <select
                  value={eventForm.status}
                  onChange={(e) => setEventForm(prev => ({ ...prev, status: e.target.value }))}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid #cbd5e1', fontSize: '13.5px', background: '#ffffff' }}
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="Active">Active / In Progress</option>
                  <option value="Completed">Completed / Archived</option>
                </select>
              </div>

              {/* Modal Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', borderTop: '1px solid #f1f5f9', paddingTop: '18px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ padding: '10px 20px', borderRadius: '10px', fontSize: '13.5px' }}
                  onClick={() => setEventModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  style={{ padding: '10px 24px', borderRadius: '10px', fontSize: '13.5px', fontWeight: '700' }}
                >
                  {editingEvent ? 'Save Changes' : 'Create Event'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION MODAL --- */}
      {isAdmin && deleteEventTarget && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(4px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px'
          }}
          onClick={() => setDeleteEventTarget(null)}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: '18px',
              width: '100%',
              maxWidth: '440px',
              padding: '24px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px', color: '#dc2626' }}>
              <ShieldAlert size={24} />
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0f172a' }}>
                Delete Event?
              </h3>
            </div>

            <p style={{ fontSize: '14px', color: '#475569', lineHeight: '1.5', margin: '0 0 20px' }}>
              Are you sure you want to remove <strong>"{deleteEventTarget.name}"</strong>? You can restore the initial schedule at any time using "Reset Schedule".
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                className="btn-secondary"
                style={{ padding: '8px 16px', borderRadius: '8px', fontSize: '13px' }}
                onClick={() => setDeleteEventTarget(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                style={{ padding: '8px 18px', borderRadius: '8px', fontSize: '13px', fontWeight: '700', background: '#dc2626', color: '#ffffff', border: 'none', cursor: 'pointer' }}
                onClick={() => {
                  if (onDeleteEvent) onDeleteEvent(deleteEventTarget.id);
                  setDeleteEventTarget(null);
                }}
              >
                Delete Event
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
