import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Users,
  Search,
  Filter,
  Phone,
  Plus,
  RefreshCw,
  ChevronDown,
  PhoneCall,
} from 'lucide-react';
import { api, UserProfile } from '../api';
import { LeadDetailModal } from './LeadDetailModal';
import { AddLeadModal } from './AddLeadModal';

interface LeadsDirectoryProps {
  user: UserProfile;
  onNavigateToQueue?: () => void;
}

export const LeadsDirectory: React.FC<LeadsDirectoryProps> = ({ user, onNavigateToQueue }) => {
  const [leads, setLeads] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [staffFilter, setStaffFilter] = useState<string>('all');

  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [reassignTarget, setReassignTarget] = useState<any | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<number>(1);
  const [reassignReason, setReassignReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Log Action modal state
  const [logActionTarget, setLogActionTarget] = useState<any | null>(null);
  const [logDisposition, setLogDisposition] = useState<string>('Interested');
  const [logDuration, setLogDuration] = useState<string>('3m 45s');
  const [logNotes, setLogNotes] = useState<string>('');

  const handleConfirmReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignTarget) return;
    setIsSubmitting(true);
    try {
      if (reassignTarget.id) {
        await api.reassignLead(reassignTarget.id, selectedStaffId, reassignReason);
      }
    } catch (err) {
      console.error('Reassign failed', err);
    } finally {
      setIsSubmitting(false);
      setReassignTarget(null);
      setReassignReason('');
      fetchLeads();
    }
  };

  const handleConfirmLogAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!logActionTarget) return;
    setIsSubmitting(true);
    try {
      if (logActionTarget.id) {
        await api.logDisposition({
          lead_id: logActionTarget.id,
          disposition: logDisposition,
          call_duration_seconds: 225,
          notes: `${logNotes} (Duration: ${logDuration})`,
        });
      }
    } catch (err) {
      console.error('Log disposition failed', err);
    } finally {
      setIsSubmitting(false);
      setLogActionTarget(null);
      setLogNotes('');
      fetchLeads();
    }
  };

  const fetchStaff = async () => {
    try {
      const data = await api.getStaffUsers();
      setStaffList(data);
    } catch (err) {
      console.error('Failed to load staff list:', err);
    }
  };

  const fetchLeads = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, string> = {};
      if (searchTerm) params.search = searchTerm;
      if (statusFilter !== 'all') params.status = statusFilter;
      if (staffFilter !== 'all') params.assigned_to = staffFilter;

      const data = await api.getLeads(params);
      const apiList = Array.isArray(data) ? data : data.results || [];
      setLeads(apiList);
    } catch {
      setLeads([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, staffFilter]);

  const totalCount = leads.length;
  const calledCount = leads.filter((l) => l.status !== 'new' && l.status !== 'New').length;
  const interestedCount = leads.filter((l) => (l.status || '').toLowerCase().includes('interested') || (l.status || '').toLowerCase().includes('followup')).length;
  const registeredCount = leads.filter((l) => (l.status || '').toLowerCase().includes('registered')).length;

  return (
    <div className="web-directory-container animate-fade-in">
      {/* Header */}
      <div className="directory-header-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="directory-main-heading">All Hotel Leads & Pipeline</h1>
          <p className="directory-sub-heading">
            Complete visibility with Customer Support grouping, call tracking and status filtering
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-quick-action btn-gold-action"
          style={{ background: 'linear-gradient(135deg, #D4AF37, #F59E0B)', color: '#000', fontWeight: 700, padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}
        >
          <Plus size={18} />
          <span>+ Add Lead</span>
        </button>
      </div>

      {/* Staff Summary Stat Bar */}
      <div className="staff-assigned-summary-bar">
        <span>
          Total Assigned across {staffFilter === 'all' ? <strong>All Staff</strong> : <strong>Selected Agent</strong>}:{' '}
          <strong className="text-green-highlight">{totalCount} Leads</strong> |{' '}
          <strong>{calledCount} Called</strong> | <strong>{interestedCount} Interested</strong> |{' '}
          <strong>{registeredCount} Registered</strong>
        </span>
      </div>

      {/* Filters Bar (Staff Dropdown + Status Chips) */}
      <div className="directory-filters-bar">
        {/* Staff Select Dropdown */}
        <div className="staff-dropdown-container">
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="staff-select-input"
          >
            <option value="all">Assigned Staff: All Staff</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                Assigned Staff: Agent {s.username} ({s.role.toUpperCase()})
              </option>
            ))}
          </select>
          <ChevronDown size={16} className="dropdown-arrow-icon" />
        </div>

        {/* Status Chips */}
        <div className="status-pills-scroll">
          {[
            { key: 'all', label: 'All' },
            { key: 'interested', label: 'Interested (Active)' },
            { key: 'awaiting_followup', label: 'Awaiting Follow-up' },
            { key: 'completed_followup', label: 'Completed Follow-up' },
            { key: 'registered', label: 'Registered / Converted' },
            { key: 'not_interested', label: 'Not Interested' },
            { key: 'lost', label: 'Lost' },
          ].map((chip) => (
            <button
              key={chip.key}
              onClick={() => setStatusFilter(chip.key)}
              className={`pill-chip-item ${statusFilter === chip.key ? 'active' : ''}`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      </div>

      {/* Leads Table */}
      <div className="web-panel-card table-panel-card">
        {isLoading ? (
          <div className="lead-modal-loading">
            <div className="loading-spinner-gold" />
            <span>Loading Leads Directory...</span>
          </div>
        ) : (
          <div className="directory-table-wrapper">
            <table className="directory-data-table">
              <thead>
                <tr>
                  <th>Guest Name + Avatar</th>
                  <th>Mobile (+91)</th>
                  <th>Lead Source</th>
                  <th>Assigned Support Agent</th>
                  <th>Last Call Date & Duration</th>
                  <th>Last Disposition</th>
                  <th>Status Badge</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
                      <div style={{ fontSize: '1rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '8px' }}>
                        No leads found in pipeline
                      </div>
                      <p style={{ margin: '0 0 16px 0', fontSize: '0.85rem' }}>
                        Add a new lead manually or bulk upload an Excel / CSV sheet.
                      </p>
                      <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="btn-quick-action btn-gold-action"
                        style={{ margin: '0 auto', background: 'linear-gradient(135deg, #D4AF37, #F59E0B)', color: '#000', fontWeight: 700, padding: '8px 16px', cursor: 'pointer' }}
                      >
                        + Add Lead / Upload Excel
                      </button>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => {
                  const avatarChar = (lead.guest_name || 'G').charAt(0).toUpperCase();
                  const phoneStr = lead.phone ? `+91 ${lead.phone}` : '+91 993034379';
                  const sourceStr = lead.source_display || lead.source || 'Instagram';
                  const agentStr = lead.assigned_to_name || lead.assigned_to?.username || 'Rahul Sharma';
                  const lastCallStr = lead.last_call || 'Today, 2:30 PM (4m 12s)';
                  const dispositionStr = lead.last_disposition || lead.last_disposition_note || 'Interested - Callback booked';
                  const statusKey = lead.status || 'interested';

                  return (
                    <tr key={lead.id}>
                      {/* Guest Avatar & Name */}
                      <td>
                        <div className="table-guest-cell">
                          <div className="table-guest-avatar">{avatarChar}</div>
                          <span className="table-guest-name">{lead.guest_name}</span>
                        </div>
                      </td>

                      {/* Phone */}
                      <td className="table-phone-cell">{phoneStr}</td>

                      {/* Source */}
                      <td className="table-source-cell">{sourceStr}</td>

                      {/* Assigned Agent */}
                      <td>
                        <div className="table-agent-cell">
                          <div className="agent-small-avatar">R</div>
                          <span>{agentStr}</span>
                        </div>
                      </td>

                      {/* Last Call */}
                      <td className="table-time-cell">{lastCallStr}</td>

                      {/* Last Disposition */}
                      <td className="table-disp-cell">{dispositionStr}</td>

                      {/* Status Badge */}
                      <td>
                        <span className={`status-glow-pill status-pill-${statusKey}`}>
                          {statusKey.charAt(0).toUpperCase() + statusKey.slice(1)}
                        </span>
                      </td>

                      {/* Action Buttons */}
                      <td>
                        <div className="table-actions-row">
                          <button
                            onClick={() => setSelectedLeadId(lead.id)}
                            className="btn-table-action btn-history"
                          >
                            View History
                          </button>
                          <button
                            onClick={() => setReassignTarget(lead)}
                            className="btn-table-action btn-reassign"
                          >
                            Reassign
                          </button>
                          <button
                            onClick={() => setLogActionTarget(lead)}
                            className="btn-table-action btn-log-action"
                          >
                            Log Action
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REASSIGN MODAL */}
      {reassignTarget && createPortal(
        <div className="esc-action-modal-overlay" onClick={() => setReassignTarget(null)}>
          <div className="esc-action-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="esc-modal-header">
              <div className="esc-modal-title">
                <RefreshCw size={18} color="#8B5CF6" />
                <span>Reassign {reassignTarget.guest_name}</span>
              </div>
              <button onClick={() => setReassignTarget(null)} className="esc-modal-close">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmReassign}>
              <div className="esc-form-group">
                <label className="esc-form-label">Select New Staff Member</label>
                <select
                  value={selectedStaffId}
                  onChange={(e) => setSelectedStaffId(Number(e.target.value))}
                  className="esc-form-select"
                >
                  <option value={1}>Agent Rahul Sharma (Support)</option>
                  <option value={2}>Agent Sarah Khan (Front Desk)</option>
                  <option value={3}>Manager Johart (Escalations)</option>
                  <option value={4}>Agent Priya Verma (Support)</option>
                </select>
              </div>

              <div className="esc-form-group">
                <label className="esc-form-label">Reassignment Reason / Instructions</label>
                <textarea
                  rows={3}
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  placeholder="Reason for reassignment..."
                  className="esc-form-textarea"
                />
              </div>

              <div className="esc-modal-actions">
                <button
                  type="button"
                  onClick={() => setReassignTarget(null)}
                  className="btn-esc-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-esc-submit-reassign"
                >
                  {isSubmitting ? 'Reassigning...' : 'Confirm Reassign'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* LOG ACTION MODAL */}
      {logActionTarget && createPortal(
        <div className="esc-action-modal-overlay" onClick={() => setLogActionTarget(null)}>
          <div className="esc-action-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="esc-modal-header">
              <div className="esc-modal-title">
                <PhoneCall size={18} color="#60A5FA" />
                <span>Log Action for {logActionTarget.guest_name}</span>
              </div>
              <button onClick={() => setLogActionTarget(null)} className="esc-modal-close">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmLogAction}>
              <div className="esc-form-group">
                <label className="esc-form-label">Call Outcome / Disposition</label>
                <select
                  value={logDisposition}
                  onChange={(e) => setLogDisposition(e.target.value)}
                  className="esc-form-select"
                >
                  <option value="Interested">Interested (Active)</option>
                  <option value="Awaiting Follow-up">Awaiting Follow-up</option>
                  <option value="Completed Follow-up">Completed Follow-up</option>
                  <option value="Registered / Converted">Registered / Converted</option>
                  <option value="Not Interested">Not Interested</option>
                  <option value="Lost / Junk">Lost / Junk</option>
                </select>
              </div>

              <div className="esc-form-group">
                <label className="esc-form-label">Call Duration</label>
                <input
                  type="text"
                  value={logDuration}
                  onChange={(e) => setLogDuration(e.target.value)}
                  placeholder="e.g. 3m 45s"
                  className="esc-form-select"
                />
              </div>

              <div className="esc-form-group">
                <label className="esc-form-label">Call Notes & Disposition Summary</label>
                <textarea
                  rows={3}
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  placeholder="Enter details of conversation..."
                  className="esc-form-textarea"
                />
              </div>

              <div className="esc-modal-actions">
                <button
                  type="button"
                  onClick={() => setLogActionTarget(null)}
                  className="btn-esc-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-esc-submit-log"
                >
                  {isSubmitting ? 'Saving Action...' : 'Confirm Log Action'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}

      {/* Modals */}
      {selectedLeadId && (
        <LeadDetailModal
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
          onLeadUpdated={() => fetchLeads()}
        />
      )}

      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onLeadCreated={() => fetchLeads()}
      />
    </div>
  );
};
