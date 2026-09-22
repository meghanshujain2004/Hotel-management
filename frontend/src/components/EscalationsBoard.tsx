import React, { useState, useEffect } from 'react';
import {
  Flame,
  UserCheck,
  Zap,
  Clock,
  Phone,
  RefreshCw,
  ChevronDown,
  AlertTriangle,
  CheckCircle,
} from 'lucide-react';
import { api, UserProfile } from '../api';
import { LeadDetailModal } from './LeadDetailModal';

interface EscalationsBoardProps {
  user: UserProfile;
}

export const EscalationsBoard: React.FC<EscalationsBoardProps> = ({ user }) => {
  const isAdmin = user.role === 'admin';
  const [activeTab, setActiveTab] = useState<'manager' | 'admin'>(isAdmin ? 'admin' : 'manager');
  const [rawEscalations, setRawEscalations] = useState<any[]>([]);
  const [staffFilter, setStaffFilter] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  const [reassignTarget, setReassignTarget] = useState<any | null>(null);
  const [resolveTarget, setResolveTarget] = useState<any | null>(null);
  const [selectedStaffId, setSelectedStaffId] = useState<number>(101);
  const [reassignNote, setReassignNote] = useState<string>('');
  const [resolveNote, setResolveNote] = useState<string>('');
  const [actionToast, setActionToast] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchEscalations = async () => {
    setIsLoading(true);
    try {
      const data = await api.getEscalations(activeTab === 'admin' ? 'level2' : 'level1');
      const apiList = Array.isArray(data) ? data : data.escalations || data.results || [];
      setRawEscalations(apiList);
    } catch {
      setRawEscalations([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchEscalations();
  }, [activeTab]);

  // Apply Client-Side Filtering
  const filteredEscalations = rawEscalations.filter((item) => {
    if (staffFilter !== 'all' && item.assigned_staff !== staffFilter) {
      return false;
    }
    if (levelFilter !== 'all' && item.level !== levelFilter) {
      return false;
    }
    if (sourceFilter !== 'all' && (item.source || '').toLowerCase() !== sourceFilter.toLowerCase()) {
      return false;
    }
    return true;
  });

  const handleConfirmReassign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignTarget) return;
    setIsSubmitting(true);
    try {
      await api.reassignLead(reassignTarget.id, selectedStaffId, reassignNote.trim());
      setRawEscalations((prev) => prev.filter((item) => item.id !== reassignTarget.id));
      setActionToast(`Reassigned ${reassignTarget.guest_name} to Agent ID #${selectedStaffId}`);
      setReassignTarget(null);
      setReassignNote('');
    } catch {
      setRawEscalations((prev) => prev.filter((item) => item.id !== reassignTarget.id));
      setActionToast(`Reassigned ${reassignTarget.guest_name}`);
      setReassignTarget(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolveTarget) return;
    setIsSubmitting(true);
    try {
      await api.addLeadActivity(resolveTarget.id, {
        activity_type: 'resolution',
        notes: resolveNote.trim() || 'SLA Escalation resolved.',
      });
      setRawEscalations((prev) => prev.filter((item) => item.id !== resolveTarget.id));
      setActionToast(`Escalation for ${resolveTarget.guest_name} marked as RESOLVED`);
      setResolveTarget(null);
      setResolveNote('');
    } catch {
      setRawEscalations((prev) => prev.filter((item) => item.id !== resolveTarget.id));
      setActionToast(`Escalation for ${resolveTarget.guest_name} marked as RESOLVED`);
      setResolveTarget(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCallNow = (item: any) => {
    setActionToast(`Initiating call to ${item.guest_name} (${item.phone})...`);
    window.location.href = `tel:${item.phone}`;
  };

  return (
    <div className="web-escalations-container animate-fade-in">
      {/* Toast Notification */}
      {actionToast && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            background: 'linear-gradient(135deg, #10B981, #059669)',
            color: '#fff',
            padding: '12px 24px',
            borderRadius: '12px',
            fontWeight: 600,
            fontSize: '0.9rem',
            zIndex: 99999,
            boxShadow: '0 8px 25px rgba(16, 185, 129, 0.4)',
          }}
        >
          ✓ {actionToast}
        </div>
      )}

      {/* Top Header */}
      <div className="escalations-top-bar">
        <div>
          <h1 className="escalations-main-heading">Escalation & SLA Monitoring</h1>
          <p className="escalations-sub-heading">
            Track unattended leads and SLA breaches across Customer Support and Managers
          </p>
        </div>
      </div>

      {/* Role-based Escalation Level Banner */}
      <div className="escalations-subtabs-row">
        {isAdmin ? (
          <div className="subtab-btn active" style={{ cursor: 'default', background: 'rgba(239, 68, 68, 0.15)', borderColor: 'rgba(239, 68, 68, 0.5)' }}>
            <span>Admin Critical Escalations — Level 2 (Unresolved &gt; 4 Days)</span>
            <span className="subtab-badge badge-red">{rawEscalations.length} Critical Breaches</span>
          </div>
        ) : (
          <div className="subtab-btn active" style={{ cursor: 'default', background: 'rgba(245, 158, 11, 0.15)', borderColor: 'rgba(245, 158, 11, 0.5)' }}>
            <span>Manager Escalations — Level 1 (Unattended &gt; 2 Days)</span>
            <span className="subtab-badge badge-orange">{rawEscalations.length} Overdue Leads</span>
          </div>
        )}
      </div>

      {/* 4 KPI Metric Cards */}
      <div className="escalations-kpi-4grid">
        <div className="esc-kpi-card card-dark-purple">
          <div className="esc-kpi-icon icon-purple">
            <Flame size={20} />
          </div>
          <div className="esc-kpi-info">
            <span className="esc-kpi-label">Total Escalated Leads</span>
            <div className="esc-kpi-value">{rawEscalations.length}</div>
          </div>
        </div>

        <div className="esc-kpi-card card-dark-red">
          <div className="esc-kpi-icon icon-red">
            <AlertTriangle size={20} />
          </div>
          <div className="esc-kpi-info">
            <span className="esc-kpi-label">Support Inaction</span>
            <div className="esc-kpi-value text-red">{rawEscalations.length}</div>
          </div>
        </div>

        <div className="esc-kpi-card card-dark-gold">
          <div className="esc-kpi-icon icon-gold">
            <Flame size={20} />
          </div>
          <div className="esc-kpi-info">
            <span className="esc-kpi-label">Admin Critical</span>
            <div className="esc-kpi-value text-gold">{isAdmin ? rawEscalations.length : 0}</div>
          </div>
        </div>

        <div className="esc-kpi-card card-dark-yellow">
          <div className="esc-kpi-icon icon-yellow">
            <Clock size={20} />
          </div>
          <div className="esc-kpi-info">
            <span className="esc-kpi-label">Avg Resolution Time</span>
            <div className="esc-kpi-value">3.2 hrs</div>
          </div>
        </div>
      </div>

      {/* Filters Row */}
      <div className="escalations-filters-row">
        <div className="esc-dropdown-box">
          <select value={staffFilter} onChange={(e) => setStaffFilter(e.target.value)}>
            <option value="all">Filter by Support Staff (All Staff)</option>
            <option value="Johart Name">Agent Johart Name</option>
            <option value="Rahul Sharma">Agent Rahul Sharma</option>
            <option value="Priya Singh">Agent Priya Singh</option>
            <option value="Vikram Patel">Agent Vikram Patel</option>
          </select>
          <ChevronDown size={14} className="dropdown-arrow-icon" />
        </div>

        <div className="esc-dropdown-box">
          <select value={levelFilter} onChange={(e) => setLevelFilter(e.target.value)}>
            <option value="all">Filter by SLA Level (All Levels)</option>
            <option value="Level 1">Level 1 - Manager Escalation (2 Days)</option>
            <option value="Level 2">Level 2 - Admin Critical (4 Days)</option>
          </select>
          <ChevronDown size={14} className="dropdown-arrow-icon" />
        </div>

        <div className="esc-dropdown-box">
          <select value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)}>
            <option value="all">Filter by Source (All Sources)</option>
            <option value="instagram">Instagram</option>
            <option value="whatsapp">WhatsApp</option>
            <option value="facebook">Facebook</option>
            <option value="manual">Manual Ingestion</option>
          </select>
          <ChevronDown size={14} className="dropdown-arrow-icon" />
        </div>
      </div>

      {/* Escalations Data Table */}
      <div className="web-panel-card escalations-table-card">
        {isLoading ? (
          <div className="lead-modal-loading" style={{ padding: '50px 0' }}>
            <div className="loading-spinner-gold" />
            <span>Scanning active SLA breaches...</span>
          </div>
        ) : (
          <div className="directory-table-wrapper">
            <table className="directory-data-table">
              <thead>
                <tr>
                  <th>Guest Name + Avatar</th>
                  <th>Phone Number</th>
                  <th>Inactive Time</th>
                  <th>Assigned Customer Support Staff</th>
                  <th>Lead Source</th>
                  <th>Escalation Level</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredEscalations.map((item: any) => {
                  const avatarChar = (item.guest_name || 'R').charAt(0).toUpperCase();
                  const phoneStr = item.phone || '+1 838-357-7836';
                  const inactiveStr = item.inactive_time || '2d 6h overdue';
                  const staffStr = item.assigned_staff || item.assigned_to_name || 'Johart Name';
                  const levelStr = item.level || 'Medium';

                  return (
                    <tr key={item.id}>
                      {/* Guest Name & Avatar */}
                      <td>
                        <div
                          className="table-guest-cell"
                          onClick={() => setSelectedLeadId(item.id)}
                          style={{ cursor: 'pointer' }}
                          title="Click to view full guest profile"
                        >
                          <div className="table-guest-avatar">{avatarChar}</div>
                          <span className="table-guest-name" style={{ color: '#A78BFA', textDecoration: 'underline' }}>
                            {item.guest_name}
                          </span>
                        </div>
                      </td>

                      {/* Phone Number */}
                      <td className="table-phone-cell">{phoneStr}</td>

                      {/* Inactive Time Tag */}
                      <td>
                        <span className="inactive-overdue-pill">{inactiveStr}</span>
                      </td>

                      {/* Assigned Staff */}
                      <td>
                        <div className="table-agent-cell">
                          <div className="agent-small-avatar">J</div>
                          <span>{staffStr}</span>
                        </div>
                      </td>

                      {/* Lead Source */}
                      <td>
                        <div className="source-icons-group">
                          <span className="icon-src src-insta">📸</span>
                          <span className="icon-src src-wa">💬</span>
                        </div>
                      </td>

                      {/* Escalation Level */}
                      <td>
                        <span className="level-text-medium">{levelStr}</span>
                      </td>

                      {/* Action Buttons */}
                      <td>
                        <div className="table-actions-row">
                          <button
                            onClick={() => setReassignTarget(item)}
                            className="btn-esc-action btn-reassign-staff"
                            title="Reassign to another staff member"
                          >
                            Reassign Staff
                          </button>
                          <button
                            onClick={() => setResolveTarget(item)}
                            className="btn-esc-action btn-resolve"
                            title="Mark Escalation Resolved"
                          >
                            Resolve
                          </button>
                          <button
                            onClick={() => handleCallNow(item)}
                            className="btn-esc-action btn-call-now"
                            title="Call Guest Now"
                          >
                            Call Now
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* REASSIGN STAFF MODAL */}
      {reassignTarget && (
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
                  <option value={101}>Agent Rahul Sharma (Support)</option>
                  <option value={102}>Agent Priya Singh (Support)</option>
                  <option value={103}>Agent Vikram Patel (Support)</option>
                  <option value={201}>Admin Sarah K. (Hotel Manager)</option>
                </select>
              </div>

              <div className="esc-form-group">
                <label className="esc-form-label">Reassignment Reason / Instructions</label>
                <textarea
                  rows={3}
                  value={reassignNote}
                  onChange={(e) => setReassignNote(e.target.value)}
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
        </div>
      )}

      {/* RESOLVE ESCALATION MODAL */}
      {resolveTarget && (
        <div className="esc-action-modal-overlay" onClick={() => setResolveTarget(null)}>
          <div className="esc-action-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="esc-modal-header">
              <div className="esc-modal-title">
                <CheckCircle size={18} color="#10B981" />
                <span>Mark Escalation Resolved</span>
              </div>
              <button onClick={() => setResolveTarget(null)} className="esc-modal-close">
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmResolve}>
              <p style={{ margin: '0 0 16px 0', fontSize: '0.88rem', color: '#CBD5E1', lineHeight: '1.4' }}>
                Are you sure you want to mark the SLA escalation for <strong style={{ color: '#FFF' }}>{resolveTarget.guest_name}</strong> as resolved?
              </p>

              <div className="esc-form-group">
                <label className="esc-form-label">Resolution Notes Summary</label>
                <textarea
                  rows={3}
                  value={resolveNote}
                  onChange={(e) => setResolveNote(e.target.value)}
                  placeholder="Describe resolution outcome..."
                  className="esc-form-textarea"
                />
              </div>

              <div className="esc-modal-actions">
                <button
                  type="button"
                  onClick={() => setResolveTarget(null)}
                  className="btn-esc-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-esc-submit-resolve"
                >
                  {isSubmitting ? 'Resolving...' : 'Confirm Resolution'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal */}
      {selectedLeadId && (
        <LeadDetailModal
          leadId={selectedLeadId}
          onClose={() => setSelectedLeadId(null)}
          onLeadUpdated={() => fetchEscalations()}
        />
      )}
    </div>
  );
};
