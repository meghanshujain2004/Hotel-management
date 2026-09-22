import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  Clock,
  User,
  PhoneCall,
  Search,
  AlertCircle,
  Sparkles,
  FileText,
  UserCheck,
  X,
  History,
  Send,
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
}

interface FollowupCallsProps {
  user: UserProfile;
}

const FILTER_CHIPS = [
  { key: 'all', label: 'All Scheduled' },
  { key: 'today', label: '📅 Today' },
  { key: 'tomorrow', label: '⏩ Tomorrow' },
  { key: 'overdue', label: '🚨 Overdue' },
];

const formatFollowupDate = (iso?: string | null) => {
  if (!iso) return { label: 'Not Scheduled', type: 'none' };
  const d = new Date(iso);
  const now = new Date();
  const diffHours = Math.round((d.getTime() - now.getTime()) / (1000 * 3600));

  const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const dateStr = d.toLocaleDateString([], { day: '2-digit', month: 'short' });

  if (diffHours < 0) {
    return { label: `🚨 Overdue (${dateStr} at ${timeStr})`, type: 'overdue' };
  } else if (d.toDateString() === now.toDateString()) {
    return { label: `📅 Today at ${timeStr}`, type: 'today' };
  } else {
    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    if (d.toDateString() === tomorrow.toDateString()) {
      return { label: `⏩ Tomorrow at ${timeStr}`, type: 'tomorrow' };
    }
  }
  return { label: `📅 ${dateStr} at ${timeStr}`, type: 'upcoming' };
};

export const FollowupCalls: React.FC<FollowupCallsProps> = ({ user }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [timelineLead, setTimelineLead] = useState<Lead | null>(null);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [isTimelineLoading, setIsTimelineLoading] = useState<boolean>(false);
  const [newNote, setNewNote] = useState<string>('');

  const [reassignLead, setReassignLead] = useState<Lead | null>(null);
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [reassignNote, setReassignNote] = useState<string>('');
  const [isReassigning, setIsReassigning] = useState<boolean>(false);

  const canReassign = user.role === 'admin' || user.role === 'manager';

  const fetchFollowupLeads = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getLeads({
        has_followup: 'true',
        ordering: 'followup_date_time', // Nearest dates first
      });
      const list: Lead[] = Array.isArray(data) ? data : data.results || [];
      
      // Sort client-side to guarantee nearest dates are first
      list.sort((a, b) => {
        const timeA = a.followup_date_time ? new Date(a.followup_date_time).getTime() : Infinity;
        const timeB = b.followup_date_time ? new Date(b.followup_date_time).getTime() : Infinity;
        return timeA - timeB;
      });

      setLeads(list);
    } catch (err) {
      console.error('Failed to load follow-up calls:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFollowupLeads();
    if (canReassign) {
      api.getStaffUsers().then((res) => setStaffUsers(res)).catch(() => {});
    }
  }, [fetchFollowupLeads, canReassign]);

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

  const handleOpenReassign = (lead: Lead) => {
    setReassignLead(lead);
    setSelectedStaffId(lead.assigned_to ? String(lead.assigned_to) : '');
    setReassignNote('');
  };

  const handleSubmitReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignLead || !selectedStaffId) return;
    setIsReassigning(true);
    try {
      await api.reassignLead(reassignLead.id, Number(selectedStaffId), reassignNote.trim());
      setReassignLead(null);
      fetchFollowupLeads();
    } catch (err: any) {
      alert(err.message || 'Failed to reassign lead');
    } finally {
      setIsReassigning(false);
    }
  };

  const handleStartCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  // Filtering
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.guest_name.toLowerCase().includes(search.toLowerCase()) ||
      lead.phone.includes(search);

    if (!matchesSearch) return false;

    if (!lead.followup_date_time) return false;
    const d = new Date(lead.followup_date_time);
    const now = new Date();

    if (activeFilter === 'today') {
      return d.toDateString() === now.toDateString();
    }
    if (activeFilter === 'tomorrow') {
      const tomorrow = new Date();
      tomorrow.setDate(now.getDate() + 1);
      return d.toDateString() === tomorrow.toDateString();
    }
    if (activeFilter === 'overdue') {
      return d.getTime() < now.getTime() && d.toDateString() !== now.toDateString();
    }
    return true; // 'all'
  });

  return (
    <div className="dashboard-content-wrapper animate-fade-in">
      {/* Page Header */}
      <div className="dashboard-top-bar">
        <div>
          <h1 className="dashboard-page-title">Scheduled Follow-Up Calls</h1>
          <p className="dashboard-page-sub">
            Leads with scheduled follow-ups sorted by nearest upcoming date & time first
          </p>
        </div>

        <div className="queue-counter-badge">
          <span>Scheduled Follow-ups:</span>
          <strong>{filteredLeads.length} Leads</strong>
        </div>
      </div>

      {/* Search & Filter Bar */}
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
          {FILTER_CHIPS.map((chip) => (
            <button
              key={chip.key}
              onClick={() => setActiveFilter(chip.key)}
              className={`followup-chip-btn chip-${chip.key} ${activeFilter === chip.key ? 'active' : ''}`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid / List */}
      {isLoading ? (
        <div className="lead-modal-loading" style={{ minHeight: '350px' }}>
          <div className="loading-spinner-gold" />
          <span>Loading scheduled follow-up calls...</span>
        </div>
      ) : filteredLeads.length === 0 ? (
        <div className="dashboard-panel-card empty-queue-card">
          <Calendar size={48} color="#E5C378" />
          <h2>No Scheduled Follow-Up Calls Found</h2>
          <p>
            {search || activeFilter !== 'all'
              ? 'No scheduled follow-up calls match your search or active filter criteria.'
              : 'There are currently no guest leads with scheduled follow-ups in the system.'}
          </p>
        </div>
      ) : (
        <div className="leads-directory-grid">
          {filteredLeads.map((lead) => {
            const scheduleInfo = formatFollowupDate(lead.followup_date_time);
            return (
              <div key={lead.id} className="lead-directory-card animate-fade-in" style={{ display: 'flex', flexDirection: 'column' }}>
                {/* Schedule Banner on Top */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    marginBottom: '12px',
                    fontSize: '13px',
                    fontWeight: 700,
                    backgroundColor:
                      scheduleInfo.type === 'overdue'
                        ? 'rgba(239, 68, 68, 0.15)'
                        : scheduleInfo.type === 'today'
                        ? 'rgba(245, 158, 11, 0.15)'
                        : 'rgba(99, 102, 241, 0.15)',
                    color:
                      scheduleInfo.type === 'overdue'
                        ? '#F87171'
                        : scheduleInfo.type === 'today'
                        ? '#FBBF24'
                        : '#818CF8',
                    border: `1px solid ${
                      scheduleInfo.type === 'overdue'
                        ? 'rgba(239, 68, 68, 0.3)'
                        : scheduleInfo.type === 'today'
                        ? 'rgba(245, 158, 11, 0.3)'
                        : 'rgba(99, 102, 241, 0.3)'
                    }`,
                  }}
                >
                  <Clock size={16} />
                  <span>{scheduleInfo.label}</span>
                </div>

                {/* Lead Header */}
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
                    {lead.priority?.toUpperCase()} PRIORITY
                  </span>
                  <span className={`status-pill-card status-${lead.status}`}>
                    {lead.status_display || lead.status?.toUpperCase()}
                  </span>
                </div>

                {/* Lead Details */}
                <div style={{ flex: 1, marginTop: '12px', fontSize: '13px', color: '#94A3B8' }}>
                  <div style={{ marginBottom: '6px' }}>
                    <strong style={{ color: '#E2E8F0' }}>Source:</strong> {lead.source_display || lead.source}
                  </div>
                  {lead.stay_dates && (
                    <div style={{ marginBottom: '6px' }}>
                      <strong style={{ color: '#E2E8F0' }}>Stay Dates:</strong> {lead.stay_dates}
                    </div>
                  )}
                  {lead.assigned_to_name && (
                    <div style={{ marginBottom: '6px' }}>
                      <strong style={{ color: '#E2E8F0' }}>Assigned Agent:</strong> {lead.assigned_to_name}
                    </div>
                  )}
                  {lead.inquiry_details && (
                    <div style={{ marginTop: '8px', background: 'rgba(255,255,255,0.03)', padding: '8px', borderRadius: '6px', fontStyle: 'italic', borderLeft: '2px solid #E5C378' }}>
                      "{lead.inquiry_details}"
                    </div>
                  )}
                </div>

                {/* Bottom Action CTAs */}
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <button
                    onClick={() => handleStartCall(lead.phone)}
                    className="btn-quick-action btn-gold-action"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '12px' }}
                  >
                    <PhoneCall size={14} />
                    <span>Call Guest</span>
                  </button>
                  <button
                    onClick={() => handleOpenTimeline(lead)}
                    className="btn-quick-action"
                    style={{ padding: '8px 10px', fontSize: '12px', background: 'rgba(255,255,255,0.06)' }}
                    title="View Activity Timeline"
                  >
                    <History size={14} />
                  </button>
                  {canReassign && (
                    <button
                      onClick={() => handleOpenReassign(lead)}
                      className="btn-quick-action"
                      style={{ padding: '8px 10px', fontSize: '12px', background: 'rgba(255,255,255,0.06)' }}
                      title="Reassign Staff"
                    >
                      <UserCheck size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
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

      {/* REASSIGN MODAL */}
      {reassignLead && (
        <div className="modal-backdrop">
          <div className="modal-card animate-fade-in" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <div className="modal-title-wrapper">
                <div className="modal-icon-crown">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3>Reassign Support Agent</h3>
                  <p>Guest: {reassignLead.guest_name}</p>
                </div>
              </div>
              <button onClick={() => setReassignLead(null)} className="btn-close-modal">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmitReassign} className="modal-body-form">
              <div className="form-field">
                <label>Select Target Support Agent:</label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(e.target.value)}
                  className="field-select"
                  required
                >
                  <option value="">-- Choose Agent --</option>
                  {staffUsers.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.username} ({st.role.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Reassignment Reason / Notes:</label>
                <textarea
                  rows={3}
                  value={reassignNote}
                  onChange={(e) => setReassignNote(e.target.value)}
                  placeholder="Reason for reassigning lead..."
                  className="field-textarea"
                />
              </div>

              <div className="modal-footer-actions">
                <button type="button" onClick={() => setReassignLead(null)} className="btn-cancel">
                  Cancel
                </button>
                <button type="submit" disabled={isReassigning} className="btn-submit-lead">
                  <span>{isReassigning ? 'Reassigning...' : 'Confirm Reassign'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
