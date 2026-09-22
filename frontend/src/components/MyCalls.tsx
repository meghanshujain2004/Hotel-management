import React, { useState, useEffect, useCallback } from 'react';
import {
  PhoneCall,
  Search,
  User,
  History,
  X,
  Send,
  CheckCircle2,
} from 'lucide-react';
import { api, UserProfile } from '../api';

interface Lead {
  id: number;
  guest_name: string;
  phone: string;
  email?: string;
  source: string;
  source_display: string;
  status: string;
  status_display: string;
  priority: string;
  stay_dates?: string;
  inquiry_details?: string;
  followup_date_time?: string | null;
  assigned_to?: number;
  assigned_to_name?: string;
  created_at: string;
  updated_at?: string;
}

interface MyCallsProps {
  user: UserProfile;
}

const DATE_FILTERS = [
  { key: 'all', label: 'All Logged Calls' },
  { key: 'today', label: '📅 Today' },
  { key: 'yesterday', label: '⏪ Yesterday' },
  { key: 'this_week', label: '🗓️ This Week' },
];

export const MyCalls: React.FC<MyCallsProps> = ({ user }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [activeDateFilter, setActiveDateFilter] = useState<string>('all');
  const [timelineLead, setTimelineLead] = useState<Lead | null>(null);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [isTimelineLoading, setIsTimelineLoading] = useState<boolean>(false);
  const [newNote, setNewNote] = useState<string>('');

  const fetchMyCalls = useCallback(async () => {
    setIsLoading(true);
    try {
      // Support staff gets their assigned leads, Admin/Manager gets all
      const params: Record<string, string> = {};
      if (user.role === 'support') {
        params.assigned_to = String(user.id);
      }
      const data = await api.getLeads(params);
      const list: Lead[] = Array.isArray(data) ? data : data.results || [];
      
      // Filter leads that have been contacted or disposed
      const calledList = list.filter((l) => l.status !== 'new');

      // Sort by latest updated / contacted first
      calledList.sort((a, b) => {
        const timeA = a.updated_at ? new Date(a.updated_at).getTime() : new Date(a.created_at).getTime();
        const timeB = b.updated_at ? new Date(b.updated_at).getTime() : new Date(b.created_at).getTime();
        return timeB - timeA;
      });

      setLeads(calledList);
    } catch (err) {
      console.error('Failed to load my call history:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchMyCalls();
  }, [fetchMyCalls]);

  const handleOpenTimeline = async (lead: Lead) => {
    setTimelineLead(lead);
    setIsTimelineLoading(true);
    try {
      const res = await api.getLeadTimeline(lead.id);
      setTimelineData(res.timeline || []);
    } catch (err) {
      console.error('Failed to fetch timeline:', err);
    } finally {
      setIsTimelineLoading(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!timelineLead || !newNote.trim()) return;
    try {
      await api.addLeadActivity(timelineLead.id, { activity_type: 'note', notes: newNote.trim() });
      setNewNote('');
      handleOpenTimeline(timelineLead);
    } catch (err: any) {
      alert(err.message || 'Failed to add note');
    }
  };

  const handleStartCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  // Filter logic
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.guest_name.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone.includes(search);

    if (!matchesSearch) return false;

    if (activeDateFilter === 'all') return true;

    const leadDate = new Date(lead.updated_at || lead.created_at);
    const now = new Date();

    if (activeDateFilter === 'today') {
      return leadDate.toDateString() === now.toDateString();
    }
    if (activeDateFilter === 'yesterday') {
      const yesterday = new Date();
      yesterday.setDate(now.getDate() - 1);
      return leadDate.toDateString() === yesterday.toDateString();
    }
    if (activeDateFilter === 'this_week') {
      const weekAgo = new Date();
      weekAgo.setDate(now.getDate() - 7);
      return leadDate >= weekAgo;
    }

    return true;
  });

  return (
    <div className="dashboard-content-wrapper animate-fade-in">
      {/* Header */}
      <div className="dashboard-top-bar">
        <div>
          <h1 className="dashboard-page-title">My Call History & Logged Interactions</h1>
          <p className="dashboard-page-sub">
            History of leads contacted with recorded dispositions and call activity
          </p>
        </div>

        <div className="queue-counter-badge">
          <span>Calls Logged:</span>
          <strong>{filteredLeads.length} Leads</strong>
        </div>
      </div>

      {/* Controls */}
      <div className="followup-controls-bar">
        <div className="followup-search-box">
          <Search size={18} color="#A78BFA" className="followup-search-icon" />
          <input
            type="text"
            className="followup-search-input"
            placeholder="Search by guest name or phone number (+91)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button onClick={() => setSearch('')} className="search-clear-btn" title="Clear search">
              <X size={15} />
            </button>
          )}
        </div>

        <div className="followup-filter-chips">
          {DATE_FILTERS.map((chip) => (
            <button
              key={chip.key}
              onClick={() => setActiveDateFilter(chip.key)}
              className={`followup-chip-btn chip-${chip.key} ${activeDateFilter === chip.key ? 'active' : ''}`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="lead-modal-loading" style={{ minHeight: '350px' }}>
          <div className="loading-spinner-gold" />
          <span>Loading call history...</span>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="dashboard-panel-card empty-queue-card">
          <CheckCircle2 size={48} color="#10B981" />
          <h2>No Call History Found</h2>
          <p>
            {search || activeDateFilter !== 'all'
              ? 'No logged calls match your search or date filter criteria.'
              : 'You have not logged any completed call dispositions yet.'}
          </p>
        </div>
      ) : (
        <div className="leads-directory-grid">
          {filteredLeads.map((lead) => (
            <div key={lead.id} className="lead-directory-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="lead-card-header">
                <div className="guest-info-avatar">
                  <User size={20} color="#FFE58F" />
                </div>
                <div>
                  <h3 className="guest-card-name">{lead.guest_name}</h3>
                  <div className="guest-card-phone">{lead.phone}</div>
                </div>
              </div>

              <div className="lead-card-badges">
                <span className={`priority-pill priority-${lead.priority}`}>
                  {lead.priority?.toUpperCase()}
                </span>
                <span className={`status-pill-card status-${lead.status}`}>
                  {lead.status_display || lead.status?.toUpperCase()}
                </span>
              </div>

              <div style={{ flex: 1, marginTop: '12px', fontSize: '13px', color: '#94A3B8' }}>
                <div style={{ marginBottom: '6px' }}>
                  <strong style={{ color: '#E2E8F0' }}>Source:</strong> {lead.source_display || lead.source}
                </div>
                <div style={{ marginBottom: '6px' }}>
                  <strong style={{ color: '#E2E8F0' }}>Last Contact:</strong>{' '}
                  {new Date(lead.updated_at || lead.created_at).toLocaleString()}
                </div>
                {lead.followup_date_time && (
                  <div style={{ marginBottom: '6px', color: '#818CF8' }}>
                    <strong>Scheduled F/U:</strong> {new Date(lead.followup_date_time).toLocaleString()}
                  </div>
                )}
                {lead.inquiry_details && (
                  <div style={{ marginTop: '8px', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px', fontStyle: 'italic', borderLeft: '2px solid #E5C378' }}>
                    "{lead.inquiry_details}"
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                <button
                  onClick={() => handleStartCall(lead.phone)}
                  className="btn-quick-action btn-gold-action"
                  style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }}
                >
                  <PhoneCall size={14} />
                  <span>Call Again</span>
                </button>
                <button
                  onClick={() => handleOpenTimeline(lead)}
                  className="btn-quick-action"
                  style={{ padding: '8px 12px', fontSize: '12px', background: 'rgba(255,255,255,0.06)' }}
                >
                  <History size={14} />
                  <span>Timeline</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TIMELINE MODAL */}
      {timelineLead && (
        <div className="modal-backdrop">
          <div className="modal-card animate-fade-in" style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <div className="modal-title-wrapper">
                <div className="modal-icon-crown">
                  <History size={20} />
                </div>
                <div>
                  <h3>Activity Timeline & Audit Trail</h3>
                  <p>Guest: {timelineLead.guest_name} ({timelineLead.phone})</p>
                </div>
              </div>
              <button onClick={() => setTimelineLead(null)} className="btn-close-modal">
                <X size={18} />
              </button>
            </div>

            <div className="modal-body-form" style={{ padding: '16px 20px' }}>
              {isTimelineLoading ? (
                <div className="lead-modal-loading" style={{ minHeight: '180px' }}>
                  <div className="loading-spinner-gold" />
                  <span>Loading timeline history...</span>
                </div>
              ) : (
                <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '16px', paddingRight: '4px' }}>
                  {timelineData.length === 0 ? (
                    <p style={{ color: '#94A3B8', textAlign: 'center', padding: '24px 0' }}>
                      No activity logs recorded yet for this lead.
                    </p>
                  ) : (
                    timelineData.map((act, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '12px', marginBottom: '14px', borderLeft: '2px solid #E5C378', paddingLeft: '12px' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '13px', color: '#E2E8F0' }}>
                            {act.activity_type_display || act.activity_type} &bull; <span style={{ color: '#94A3B8', fontWeight: 400 }}>{act.user_name || 'System'}</span>
                          </div>
                          <div style={{ fontSize: '12px', color: '#CBD5E1', marginTop: '2px' }}>{act.notes}</div>
                          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                            {new Date(act.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Add Note Form */}
              <form onSubmit={handleAddNote} style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '14px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#E2E8F0', marginBottom: '6px', display: 'block' }}>
                  Add Note / Interaction Summary:
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="Enter discussion notes..."
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    className="field-select"
                    style={{ flex: 1 }}
                  />
                  <button type="submit" className="btn-submit-lead" style={{ width: 'auto', padding: '0 16px' }}>
                    <Send size={14} />
                    <span>Add</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
