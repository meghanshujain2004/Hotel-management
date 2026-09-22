import React, { useState, useEffect } from 'react';
import {
  BarChart3,
  Award,
  Users,
  Download,
  PhoneCall,
  Clock,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Crown,
  X,
  Calendar,
  FileText,
  User,
  CheckCircle,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { api, UserProfile } from '../api';
import { AddStaffModal } from './AddStaffModal';

interface TeamPerformanceProps {
  user: UserProfile;
}

export const TeamPerformance: React.FC<TeamPerformanceProps> = ({ user }) => {
  const [teamData, setTeamData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'support' | 'managers'>('support');
  const [selectedStaff, setSelectedStaff] = useState<any | null>(null);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState<boolean>(false);

  const fetchTeamStats = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTeamPerformance();
      setTeamData(data || { support_leaderboard: [], manager_leaderboard: [] });
    } catch (err) {
      console.error('Failed to load team performance:', err);
      setTeamData({ support_leaderboard: [], manager_leaderboard: [] });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteStaff = async (staffId: number, staffName: string) => {
    if (!window.confirm(`Are you sure you want to remove staff member "${staffName}"?`)) {
      return;
    }
    try {
      await api.deleteStaff(staffId);
      alert(`Staff member "${staffName}" removed successfully.`);
      if (selectedStaff && (selectedStaff.user_id === staffId || selectedStaff.id === staffId)) {
        setSelectedStaff(null);
      }
      fetchTeamStats();
    } catch (err: any) {
      alert(err.message || 'Failed to remove staff member.');
    }
  };

  useEffect(() => {
    fetchTeamStats();
  }, []);

  const supportLeaderboard = teamData?.support_leaderboard || teamData?.support_agents || [];
  const managerLeaderboard = teamData?.manager_leaderboard || teamData?.managers || [];

  return (
    <div className="dashboard-content-wrapper animate-fade-in">
      {/* Top Bar */}
      <div className="dashboard-top-bar">
        <div>
          <h1 className="dashboard-page-title">Team Performance & Analytics</h1>
          <p className="dashboard-page-sub">
            Role-separated sales velocity leaderboards, conversion benchmarks, and SLA compliance
          </p>
        </div>

        <div className="top-bar-actions-right">
          <button onClick={() => fetchTeamStats()} className="btn-icon-refresh" title="Refresh metrics">
            <RefreshCw size={17} />
          </button>
          <button
            onClick={() => api.exportCSV('staff')}
            className="btn-quick-action btn-gold-action"
          >
            <Download size={18} />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* Role Leaderboard Toggle Chips */}
      <div className="status-filter-chips-row">
        <button
          onClick={() => setActiveTab('support')}
          className={`status-chip-btn ${activeTab === 'support' ? 'active' : ''}`}
        >
          🎧 Customer Support Team ({supportLeaderboard.length})
        </button>
        <button
          onClick={() => setActiveTab('managers')}
          className={`status-chip-btn ${activeTab === 'managers' ? 'active' : ''}`}
        >
          👔 Reservation Managers ({managerLeaderboard.length})
        </button>
      </div>

      {/* Leaderboard Table Card */}
      <div className="dashboard-panel-card leads-table-card">
        <div className="panel-card-header">
          <h3>
            {activeTab === 'support'
              ? 'Customer Support Sales Velocity Leaderboard'
              : 'Reservation Managers Performance Overview'}
          </h3>
          <span className="panel-tag">Click any staff member or assigned leads to view details</span>
        </div>

        {isLoading ? (
          <div className="lead-modal-loading">
            <div className="loading-spinner-gold" />
            <span>Calculating team analytics & KPIs...</span>
          </div>
        ) : activeTab === 'support' ? (
          <div className="leads-table-wrapper">
            <table className="leads-data-table">
              <thead>
                <tr>
                  <th>Rank & Staff Member</th>
                  <th>Leads Assigned</th>
                  <th>Calls Completed</th>
                  <th>Bookings Registered</th>
                  <th>Conversion Rate</th>
                  <th>SLA Breaches</th>
                  <th>Avg Duration</th>
                  {(user.role === 'admin' || user.role === 'manager') && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {supportLeaderboard.map((agent: any, idx: number) => {
                  const staffId = agent.id || agent.user_id;
                  const assignedCount = agent.leads_assigned ?? agent.assigned_leads_count ?? agent.assigned_leads?.length ?? 0;
                  const callsLogged = agent.calls_logged ?? agent.calls_completed ?? 0;
                  const convRate = agent.conversion_rate_percentage ?? agent.conversion_rate ?? 0;
                  const breaches = agent.support_breach_count ?? agent.sla_breach_count ?? 0;
                  const avgDurationStr = agent.avg_call_duration_display || (agent.avg_call_duration_seconds ? `${Math.floor(agent.avg_call_duration_seconds / 60)}m ${agent.avg_call_duration_seconds % 60}s` : '0m 0s');

                  return (
                    <tr key={staffId || idx}>
                      <td>
                        <div
                          className="staff-rank-cell clickable-staff"
                          onClick={() => setSelectedStaff(agent)}
                          style={{ cursor: 'pointer' }}
                          title="Click to view full staff details & assigned leads"
                        >
                          <span className={`rank-badge rank-${idx + 1}`}>
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                          </span>
                          <div className="staff-meta-text">
                            <strong style={{ color: '#A78BFA', textDecoration: 'underline' }}>
                              {agent.full_name || agent.username}
                            </strong>
                            <span>{agent.email || 'Customer Support'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <button
                          className="table-metric-bold btn-assigned-leads-chip"
                          onClick={() => setSelectedStaff(agent)}
                          style={{
                            background: 'rgba(139, 92, 246, 0.15)',
                            border: '1px solid rgba(139, 92, 246, 0.4)',
                            color: '#C4B5FD',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          {assignedCount} Leads ➔
                        </button>
                      </td>
                      <td>
                        <div className="metric-with-icon">
                          <PhoneCall size={13} color="#60A5FA" />
                          <span>{callsLogged}</span>
                        </div>
                      </td>
                      <td>
                        <span className="table-metric-bold text-green">{agent.registered_count || 0}</span>
                      </td>
                      <td>
                        <div className="conversion-rate-badge">
                          <TrendingUp size={13} />
                          <span>{convRate}%</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`breach-count-pill ${
                            breaches > 0 ? 'has-breaches' : ''
                          }`}
                        >
                          {breaches > 0 ? `⚠️ ${breaches}` : '0'}
                        </span>
                      </td>
                      <td>
                        <span className="time-sub-text">
                          {avgDurationStr}
                        </span>
                      </td>
                      {(user.role === 'admin' || user.role === 'manager') && (
                        <td>
                          <button
                            onClick={() => handleDeleteStaff(staffId, agent.username || agent.full_name)}
                            title="Remove staff member"
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              color: '#F87171',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.8rem',
                            }}
                          >
                            <Trash2 size={14} />
                            <span>Remove</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="leads-table-wrapper">
            <table className="leads-data-table">
              <thead>
                <tr>
                  <th>Manager</th>
                  <th>Total Supervised Leads</th>
                  <th>Overdue Level 1 Inactions</th>
                  <th>Confirmed Bookings</th>
                  <th>Team Conversion</th>
                  {user.role === 'admin' && <th>Action</th>}
                </tr>
              </thead>
              <tbody>
                {managerLeaderboard.map((mgr: any, idx: number) => {
                  const staffId = mgr.id || mgr.user_id;
                  const supervisedLeads = mgr.leads_overseeing ?? mgr.total_supervised_leads ?? 0;
                  const overdueCount = mgr.manager_critical_breaches ?? mgr.level1_overdue_count ?? 0;
                  const registeredCount = mgr.team_registered_count ?? mgr.registered_leads_count ?? 0;
                  const convRate = mgr.team_conversion_percentage ?? mgr.team_conversion_rate ?? 0;

                  return (
                    <tr key={staffId || idx}>
                      <td>
                        <div
                          className="staff-rank-cell clickable-staff"
                          onClick={() => setSelectedStaff(mgr)}
                          style={{ cursor: 'pointer' }}
                        >
                          <Crown size={18} color="#D4AF37" />
                          <div className="staff-meta-text">
                            <strong style={{ color: '#F59E0B', textDecoration: 'underline' }}>
                              {mgr.full_name || mgr.username}
                            </strong>
                            <span>{mgr.email || 'Reservation Manager'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <button
                          className="table-metric-bold btn-assigned-leads-chip"
                          onClick={() => setSelectedStaff(mgr)}
                          style={{
                            background: 'rgba(245, 158, 11, 0.15)',
                            border: '1px solid rgba(245, 158, 11, 0.4)',
                            color: '#FCD34D',
                            padding: '4px 10px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            fontWeight: 600,
                          }}
                        >
                          {supervisedLeads} Leads ➔
                        </button>
                      </td>
                      <td>
                        <span
                          className={`breach-count-pill ${
                            overdueCount > 0 ? 'has-breaches' : ''
                          }`}
                        >
                          {overdueCount > 0 ? `⚠️ ${overdueCount}` : '0'}
                        </span>
                      </td>
                      <td>
                        <span className="table-metric-bold text-green">{registeredCount}</span>
                      </td>
                      <td>
                        <div className="conversion-rate-badge">
                          <TrendingUp size={13} />
                          <span>{convRate}%</span>
                        </div>
                      </td>
                      {user.role === 'admin' && (
                        <td>
                          <button
                            onClick={() => handleDeleteStaff(staffId, mgr.username || mgr.full_name)}
                            title="Remove manager"
                            style={{
                              background: 'rgba(239, 68, 68, 0.15)',
                              border: '1px solid rgba(239, 68, 68, 0.4)',
                              color: '#F87171',
                              padding: '6px 10px',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                              fontSize: '0.8rem',
                            }}
                          >
                            <Trash2 size={14} />
                            <span>Remove</span>
                          </button>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* STAFF DETAILS & ASSIGNED LEADS MODAL */}
      {selectedStaff && (
        <div className="lead-detail-modal-overlay" onClick={() => setSelectedStaff(null)}>
          <div
            className="lead-detail-modal-container animate-scale-up"
            style={{ maxWidth: '900px', width: '95%' }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="modal-header-bar">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: '18px',
                    color: '#fff',
                  }}
                >
                  {selectedStaff.username.charAt(0)}
                </div>
                <div>
                  <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>
                    {selectedStaff.username}
                  </h2>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#9CA3AF' }}>
                    {selectedStaff.role === 'support' ? 'Customer Support Agent' : 'Reservation Manager'} • {selectedStaff.email}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                {(user.role === 'admin' || (user.role === 'manager' && selectedStaff.role === 'support')) && (
                  <button
                    onClick={() => handleDeleteStaff(selectedStaff.id || selectedStaff.user_id, selectedStaff.username)}
                    style={{
                      background: 'rgba(239, 68, 68, 0.2)',
                      border: '1px solid rgba(239, 68, 68, 0.5)',
                      color: '#EF4444',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      fontSize: '0.85rem',
                      fontWeight: 600,
                    }}
                  >
                    <Trash2 size={16} />
                    <span>Remove Staff</span>
                  </button>
                )}
                <button onClick={() => setSelectedStaff(null)} className="modal-close-btn">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="modal-body-grid" style={{ padding: '20px', gap: '20px' }}>
              {/* Quick Staff KPI Strip */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
                  gap: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '14px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                }}
              >
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Total Assigned</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#A78BFA' }}>
                    {selectedStaff.assigned_leads_count ?? selectedStaff.leads_assigned ?? selectedStaff.total_supervised_leads ?? 0} Leads
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Calls Completed</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#60A5FA' }}>
                    {selectedStaff.calls_completed ?? selectedStaff.calls_logged ?? 0} Calls
                  </div>
                </div>
                <div>
                  <span style={{ fontSize: '0.75rem', color: '#9CA3AF' }}>Conversion Velocity</span>
                  <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#10B981' }}>
                    {selectedStaff.conversion_rate ?? selectedStaff.team_conversion_percentage ?? selectedStaff.team_conversion_rate ?? 0}%
                  </div>
                </div>
              </div>

              {/* Assigned Leads Table & Call Notes */}
              <div>
                <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '12px', color: '#E2E8F0' }}>
                  📋 Assigned Leads & Call History Notes
                </h3>
                <div className="leads-table-wrapper" style={{ maxHeight: '350px', overflowY: 'auto' }}>
                  <table className="leads-data-table">
                    <thead>
                      <tr>
                        <th>Guest Name & Phone</th>
                        <th>Source</th>
                        <th>Call Duration</th>
                        <th>Follow-up Date / Time</th>
                        <th>Last Call Notes & Conversation Summary</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedStaff.assigned_leads || []).length === 0 ? (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8' }}>
                            No assigned leads found for this staff member.
                          </td>
                        </tr>
                      ) : (
                        (selectedStaff.assigned_leads || []).map((lead: any, i: number) => (
                          <tr key={lead.id || i}>
                            <td>
                              <div style={{ fontWeight: 600, color: '#F1F5F9' }}>{lead.guest_name || 'Guest'}</div>
                              <div style={{ fontSize: '0.8rem', color: '#94A3B8' }}>{lead.phone || lead.guest_phone || '-'}</div>
                            </td>
                            <td>
                              <span className="source-tag-chip">{lead.lead_source || 'Direct'}</span>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#60A5FA' }}>
                                <Clock size={13} />
                                <span>{lead.call_duration || lead.duration || '-'}</span>
                              </div>
                            </td>
                            <td>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#F59E0B' }}>
                                <Calendar size={13} />
                                <span style={{ fontSize: '0.85rem' }}>{lead.followup_date || lead.follow_up_time || lead.created_at || '-'}</span>
                              </div>
                            </td>
                            <td style={{ maxWidth: '280px' }}>
                              <p style={{ margin: 0, fontSize: '0.82rem', color: '#CBD5E1', lineHeight: '1.4' }}>
                                {lead.notes || lead.remarks || 'No notes available'}
                              </p>
                            </td>
                            <td>
                              <span
                                className={`lead-status-badge badge-${(lead.status || 'Interested')
                                  .toLowerCase()
                                  .replace(/[^a-z]/g, '')}`}
                              >
                                {lead.status || 'New'}
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
