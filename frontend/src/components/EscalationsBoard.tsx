import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Flame,
  UserCheck,
  Zap,
  Clock,
  ArrowRight,
  RefreshCw,
  Phone,
  Calendar,
  X,
  Send,
} from 'lucide-react';
import { api, UserProfile } from '../api';
import { LeadDetailModal } from './LeadDetailModal';

interface EscalationsBoardProps {
  user: UserProfile;
}

export const EscalationsBoard: React.FC<EscalationsBoardProps> = ({ user }) => {
  const [escalations, setEscalations] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any | null>(null);
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCheckingSLA, setIsCheckingSLA] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const [staffList, setStaffList] = useState<any[]>([]);
  const [reassignModalLead, setReassignModalLead] = useState<any | null>(null);
  const [targetUserId, setTargetUserId] = useState<string>('');
  const [reassignNotes, setReassignNotes] = useState<string>('');
  const [isReassigning, setIsReassigning] = useState<boolean>(false);

  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

  const fetchEscalations = async () => {
    setIsLoading(true);
    try {
      const data = await api.getEscalations(levelFilter);
      setEscalations(data.escalations || []);
      setMetrics(data.metrics || null);
    } catch (err) {
      console.error('Failed to load escalations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const data = await api.getStaffUsers();
      setStaffList(data);
    } catch (err) {
      console.error('Failed to load staff:', err);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    fetchEscalations();
  }, [levelFilter]);

  const handleRunSLACheck = async () => {
    setIsCheckingSLA(true);
    try {
      const res = await api.triggerSLACheck();
      setStatusMessage(`SLA check finished: ${res.result?.escalated_count || 0} escalated, ${res.result?.reminded_count || 0} reminders sent.`);
      fetchEscalations();
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      setStatusMessage(err.message || 'SLA evaluation completed.');
      setTimeout(() => setStatusMessage(null), 4000);
    } finally {
      setIsCheckingSLA(false);
    }
  };

  const handleReassignSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reassignModalLead || !targetUserId) return;

    setIsReassigning(true);
    try {
      const res = await api.reassignLead(
        reassignModalLead.id,
        Number(targetUserId),
        reassignNotes.trim() || 'Escalation reassignment triggered by management.'
      );
      setStatusMessage(res.message || 'Lead successfully reassigned.');
      setReassignModalLead(null);
      setTargetUserId('');
      setReassignNotes('');
      fetchEscalations();
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      alert(err.message || 'Failed to reassign lead');
    } finally {
      setIsReassigning(false);
    }
  };

  return (
    <div className="dashboard-content-wrapper animate-fade-in">
      {/* Top Header */}
      <div className="dashboard-top-bar">
        <div>
          <h1 className="dashboard-page-title">Escalation & SLA Monitoring</h1>
          <p className="dashboard-page-sub">
            4-Day SLA Inactivity Governance Feed & Role-Based Reassignment Board
          </p>
        </div>

        <div className="top-bar-actions-right">
          <button onClick={() => fetchEscalations()} className="btn-icon-refresh" title="Refresh Feed">
            <RefreshCw size={17} />
          </button>
          {(user.role === 'admin' || user.role === 'manager') && (
            <button
              onClick={handleRunSLACheck}
              disabled={isCheckingSLA}
              className="btn-quick-action btn-purple-action"
            >
              <Zap size={18} />
              <span>{isCheckingSLA ? 'Evaluating 4-Day SLA...' : 'Run SLA Evaluation'}</span>
            </button>
          )}
        </div>
      </div>

      {statusMessage && (
        <div className="sla-toast-banner animate-fade-in">
          <Zap size={18} />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* KPI Overdue Summary Cards */}
      <div className="kpi-cards-grid">
        <div className="kpi-hero-card kpi-card-red">
          <div className="kpi-card-header">
            <span className="kpi-label">Total Escalated Leads</span>
            <div className="kpi-icon-pill">
              <Flame size={18} />
            </div>
          </div>
          <div className="kpi-number">{metrics?.total_escalated ?? escalations.length}</div>
          <div className="kpi-footer-metric">
            <Clock size={15} />
            <span>Overdue past SLA engagement threshold</span>
          </div>
        </div>

        <div className="kpi-hero-card kpi-card-purple">
          <div className="kpi-card-header">
            <span className="kpi-label">Level 1 (Support Inaction)</span>
            <div className="kpi-icon-pill">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-number">{metrics?.level1_support_inaction ?? 0}</div>
          <div className="kpi-footer-metric">
            <span>Escalated to Manager review</span>
          </div>
        </div>

        <div className="kpi-hero-card kpi-card-gold">
          <div className="kpi-card-header">
            <span className="kpi-label">Level 2 (Admin Critical)</span>
            <div className="kpi-icon-pill">
              <Flame size={18} />
            </div>
          </div>
          <div className="kpi-number">{metrics?.level2_admin_critical ?? 0}</div>
          <div className="kpi-footer-metric">
            <span>Escalated to General Manager/Admin</span>
          </div>
        </div>
      </div>

      {/* Level Filters */}
      <div className="status-filter-chips-row">
        {[
          { key: 'all', label: 'All Escalated Leads' },
          { key: 'level1', label: 'Level 1: Support Inaction' },
          { key: 'level2', label: 'Level 2: Admin Critical Breaches' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setLevelFilter(tab.key)}
            className={`status-chip-btn ${levelFilter === tab.key ? 'active' : ''}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Escalated Leads Feed */}
      <div className="dashboard-panel-card">
        <div className="panel-card-header">
          <h3>Active Escalations Feed</h3>
          <span className="panel-tag">{escalations.length} Action Required</span>
        </div>

        {isLoading ? (
          <div className="lead-modal-loading">
            <div className="loading-spinner-gold" />
            <span>Scanning for SLA breaches...</span>
          </div>
        ) : escalations.length > 0 ? (
          <div className="escalation-feed-list">
            {escalations.map((lead) => (
              <div
                key={lead.id}
                className={`escalation-lead-card ${
                  lead.escalation_level === 'level2_admin' ? 'level-2-critical' : 'level-1-manager'
                }`}
              >
                <div className="escalation-lead-left">
                  <div className="escalation-flame-icon">
                    <Flame size={24} />
                  </div>
                  <div className="escalation-lead-info">
                    <div className="esc-name-row">
                      <h4>{lead.guest_name}</h4>
                      <span className="lead-id-tag">#{lead.id}</span>
                      <span
                        className={`escalation-pill ${
                          lead.escalation_level === 'level2_admin' ? 'pill-level2' : 'pill-level1'
                        }`}
                      >
                        {lead.escalation_level === 'level2_admin'
                          ? '🔥 Level 2 Admin Critical'
                          : '⚠️ Level 1 Support Inaction'}
                      </span>
                    </div>
                    <div className="esc-meta-row">
                      <span>
                        <Phone size={13} /> {lead.phone}
                      </span>
                      <span>
                        <UserCheck size={13} /> Assigned: {lead.assigned_to_name || 'Unassigned'}
                      </span>
                      <span>
                        <Calendar size={13} /> Created:{' '}
                        {new Date(lead.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="esc-reason-box">
                      <strong>Breach Reason:</strong> No customer engagement recorded within the SLA window.
                    </div>
                  </div>
                </div>

                <div className="escalation-lead-actions">
                  <button
                    onClick={() => setSelectedLeadId(lead.id)}
                    className="btn-view-lead"
                  >
                    View Timeline
                  </button>
                  {(user.role === 'admin' || user.role === 'manager') && (
                    <button
                      onClick={() => {
                        setReassignModalLead(lead);
                        setTargetUserId(staffList[0]?.id?.toString() || '');
                      }}
                      className="btn-quick-action btn-gold-action"
                    >
                      <UserCheck size={16} />
                      <span>Reassign Lead</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-activities-text" style={{ padding: '60px 0' }}>
            🎉 No active SLA breaches! All leads have been contacted within their governance windows.
          </div>
        )}
      </div>

      {/* REASSIGNMENT MODAL */}
      {reassignModalLead && (
        <div className="modal-backdrop">
          <div className="modal-card animate-fade-in" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <div className="modal-title-wrapper">
                <div className="modal-icon-crown">
                  <UserCheck size={20} />
                </div>
                <div>
                  <h3>Reassign Lead #{reassignModalLead.id}</h3>
                  <p>Guest: {reassignModalLead.guest_name}</p>
                </div>
              </div>
              <button onClick={() => setReassignModalLead(null)} className="modal-close-btn">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReassignSubmit} className="modal-body-form">
              <div className="form-field">
                <label>Select New Assignee:</label>
                <select
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  className="field-select"
                  required
                >
                  <option value="" disabled>Choose staff member...</option>
                  {staffList.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.username} ({s.role.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Reassignment Reason / Directives:</label>
                <textarea
                  rows={3}
                  value={reassignNotes}
                  onChange={(e) => setReassignNotes(e.target.value)}
                  placeholder="Reason for reassignment, specific customer priority instructions..."
                  className="field-textarea"
                />
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  onClick={() => setReassignModalLead(null)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReassigning}
                  className="btn-submit-lead"
                >
                  <Send size={15} />
                  <span>{isReassigning ? 'Reassigning...' : 'Confirm Reassignment'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Lead Detail Modal */}
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
