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
} from 'lucide-react';
import { api, UserProfile } from '../api';

interface TeamPerformanceProps {
  user: UserProfile;
}

export const TeamPerformance: React.FC<TeamPerformanceProps> = ({ user }) => {
  const [teamData, setTeamData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'support' | 'managers'>('support');

  const fetchTeamStats = async () => {
    setIsLoading(true);
    try {
      const data = await api.getTeamPerformance();
      setTeamData(data);
    } catch (err) {
      console.error('Failed to load team performance:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTeamStats();
  }, []);

  const supportLeaderboard = teamData?.support_leaderboard || [];
  const managerLeaderboard = teamData?.manager_leaderboard || [];

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
          <span className="panel-tag">Ranked by Conversion Velocity</span>
        </div>

        {isLoading ? (
          <div className="lead-modal-loading">
            <div className="loading-spinner-gold" />
            <span>Calculating team analytics & KPIs...</span>
          </div>
        ) : activeTab === 'support' ? (
          supportLeaderboard.length > 0 ? (
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
                  </tr>
                </thead>
                <tbody>
                  {supportLeaderboard.map((agent: any, idx: number) => (
                    <tr key={agent.id}>
                      <td>
                        <div className="staff-rank-cell">
                          <span className={`rank-badge rank-${idx + 1}`}>
                            {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${idx + 1}`}
                          </span>
                          <div className="staff-meta-text">
                            <strong>{agent.username}</strong>
                            <span>{agent.email || 'Support Agent'}</span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="table-metric-bold">{agent.assigned_leads_count}</span>
                      </td>
                      <td>
                        <div className="metric-with-icon">
                          <PhoneCall size={13} color="#60A5FA" />
                          <span>{agent.calls_completed}</span>
                        </div>
                      </td>
                      <td>
                        <span className="table-metric-bold text-green">{agent.registered_count}</span>
                      </td>
                      <td>
                        <div className="conversion-rate-badge">
                          <TrendingUp size={13} />
                          <span>{agent.conversion_rate}%</span>
                        </div>
                      </td>
                      <td>
                        <span
                          className={`breach-count-pill ${
                            agent.sla_breach_count > 0 ? 'has-breaches' : ''
                          }`}
                        >
                          {agent.sla_breach_count > 0 ? `⚠️ ${agent.sla_breach_count}` : '0'}
                        </span>
                      </td>
                      <td>
                        <span className="time-sub-text">
                          {agent.avg_call_duration_seconds
                            ? `${Math.floor(agent.avg_call_duration_seconds / 60)}m ${agent.avg_call_duration_seconds % 60}s`
                            : 'N/A'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-activities-text">No support staff data found.</div>
          )
        ) : managerLeaderboard.length > 0 ? (
          <div className="leads-table-wrapper">
            <table className="leads-data-table">
              <thead>
                <tr>
                  <th>Manager</th>
                  <th>Total Supervised Leads</th>
                  <th>Overdue Level 1 Inactions</th>
                  <th>Confirmed Bookings</th>
                  <th>Team Conversion</th>
                </tr>
              </thead>
              <tbody>
                {managerLeaderboard.map((mgr: any) => (
                  <tr key={mgr.id}>
                    <td>
                      <div className="staff-rank-cell">
                        <Crown size={18} color="#D4AF37" />
                        <div className="staff-meta-text">
                          <strong>{mgr.username}</strong>
                          <span>{mgr.email || 'Reservation Manager'}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="table-metric-bold">{mgr.total_supervised_leads}</span>
                    </td>
                    <td>
                      <span
                        className={`breach-count-pill ${
                          mgr.level1_overdue_count > 0 ? 'has-breaches' : ''
                        }`}
                      >
                        {mgr.level1_overdue_count > 0 ? `⚠️ ${mgr.level1_overdue_count}` : '0'}
                      </span>
                    </td>
                    <td>
                      <span className="table-metric-bold text-green">{mgr.registered_leads_count}</span>
                    </td>
                    <td>
                      <div className="conversion-rate-badge">
                        <TrendingUp size={13} />
                        <span>{mgr.team_conversion_rate}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-activities-text">No managers found.</div>
        )}
      </div>
    </div>
  );
};
