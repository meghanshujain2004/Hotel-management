import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle,
  AlertTriangle,
  Flame,
  Plus,
  Zap,
  Download,
  PhoneCall,
  MessageSquare,
  ArrowUpRight,
  TrendingUp,
  Clock,
  Globe,
  Share2,
  FileText,
  Sparkles,
  Camera,
} from 'lucide-react';
import { api, DashboardMetrics, UserProfile } from '../api';
import { AddLeadModal } from './AddLeadModal';

interface ExecutiveDashboardProps {
  user: UserProfile;
  onNavigateTab: (tabKey: string) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ user, onNavigateTab }) => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [period, setPeriod] = useState<string>('all');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [slaMessage, setSlaMessage] = useState<string | null>(null);
  const [isCheckingSLA, setIsCheckingSLA] = useState<boolean>(false);

  const fetchMetrics = async (selectedPeriod: string = period) => {
    setIsLoading(true);
    try {
      const data = await api.getDashboardOverview(selectedPeriod);
      setMetrics(data);
    } catch (err) {
      console.error('Failed to load metrics:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics(period);
  }, [period]);

  const handleTriggerSLA = async () => {
    setIsCheckingSLA(true);
    try {
      const res = await api.triggerSLACheck();
      setSlaMessage(`SLA check finished: ${res.result?.escalated_count || 0} leads escalated, ${res.result?.reminded_count || 0} reminders sent.`);
      fetchMetrics();
      setTimeout(() => setSlaMessage(null), 5000);
    } catch (err: any) {
      setSlaMessage(err.message || 'SLA evaluation completed.');
      setTimeout(() => setSlaMessage(null), 4000);
    } finally {
      setIsCheckingSLA(false);
    }
  };

  const getSourceIcon = (src: string) => {
    switch (src) {
      case 'instagram':
        return <Camera size={16} color="#EC4899" />;
      case 'whatsapp':
        return <MessageSquare size={16} color="#10B981" />;
      case 'facebook':
        return <Share2 size={16} color="#3B82F6" />;
      case 'website':
        return <Globe size={16} color="#F59E0B" />;
      default:
        return <FileText size={16} color="#94A3B8" />;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'call':
        return <PhoneCall size={16} color="#60A5FA" />;
      case 'whatsapp_dispatched':
        return <MessageSquare size={16} color="#34D399" />;
      case 'escalated':
        return <Flame size={16} color="#F87171" />;
      default:
        return <Clock size={16} color="#D4AF37" />;
    }
  };

  return (
    <div className="dashboard-content-wrapper animate-fade-in">
      {/* Top Header Controls */}
      <div className="dashboard-top-bar">
        <div>
          <h1 className="dashboard-page-title">Executive Pipeline Overview</h1>
          <p className="dashboard-page-sub">
            Real-time hotel inquiry velocity, conversion metrics, and SLA governance
          </p>
        </div>

        {/* Period Filter Pills */}
        <div className="period-pills-group">
          {[
            { key: 'all', label: 'All Time' },
            { key: 'today', label: 'Today' },
            { key: 'this_week', label: 'This Week' },
            { key: 'this_month', label: 'This Month' },
          ].map((p) => (
            <button
              key={p.key}
              onClick={() => setPeriod(p.key)}
              className={`period-pill-btn ${period === p.key ? 'active' : ''}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {slaMessage && (
        <div className="sla-toast-banner animate-fade-in">
          <Zap size={18} />
          <span>{slaMessage}</span>
        </div>
      )}

      {/* SLA Alert Banner (If overdue leads exist) */}
      {metrics && metrics.kpi_cards.active_escalations > 0 && (
        <div className="sla-alert-banner">
          <div className="sla-alert-left">
            <div className="sla-alert-flame">
              <Flame size={24} />
            </div>
            <div>
              <h4>
                {metrics.kpi_cards.active_escalations} Critical Overdue Leads Need Attention
              </h4>
              <p>
                {metrics.kpi_cards.level1_support_inaction} Level 1 Support Inaction &bull;{' '}
                {metrics.kpi_cards.level2_admin_critical} Level 2 Admin Critical Breaches
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('escalations')}
            className="btn-review-escalations"
          >
            <span>Review Escalation Board</span>
            <ArrowUpRight size={18} />
          </button>
        </div>
      )}

      {/* 3 HERO KPI CARDS */}
      <div className="kpi-cards-grid">
        {/* Card 1: Total Leads */}
        <div className="kpi-hero-card kpi-card-purple">
          <div className="kpi-card-header">
            <span className="kpi-label">Total Hotel Leads</span>
            <div className="kpi-icon-pill">
              <Users size={18} />
            </div>
          </div>
          <div className="kpi-number">{metrics?.kpi_cards.total_leads ?? 0}</div>
          <div className="kpi-footer-metric">
            <TrendingUp size={15} />
            <span>Active inquiry pipeline volume</span>
          </div>
        </div>

        {/* Card 2: Today / Month Converted */}
        <div className="kpi-hero-card kpi-card-gold">
          <div className="kpi-card-header">
            <span className="kpi-label">Confirmed Bookings</span>
            <div className="kpi-icon-pill">
              <CheckCircle size={18} />
            </div>
          </div>
          <div className="kpi-number">{metrics?.kpi_cards.total_registered ?? 0}</div>
          <div className="kpi-footer-metric">
            <Sparkles size={15} />
            <span>
              {metrics?.kpi_cards.conversion_rate_percentage ?? 0}% Overall Conversion Rate
            </span>
          </div>
        </div>

        {/* Card 3: SLA Breaches */}
        <div className="kpi-hero-card kpi-card-red">
          <div className="kpi-card-header">
            <span className="kpi-label">SLA Inactivity Breaches</span>
            <div className="kpi-icon-pill">
              <AlertTriangle size={18} />
            </div>
          </div>
          <div className="kpi-number">{metrics?.kpi_cards.total_sla_breaches ?? 0}</div>
          <div className="kpi-footer-metric">
            <Flame size={15} />
            <span>
              {metrics?.kpi_cards.level2_admin_critical ?? 0} Breached to GM/Admin level
            </span>
          </div>
        </div>
      </div>

      {/* QUICK ACTIONS BAR */}
      <div className="quick-actions-bar">
        <div className="quick-actions-title">Quick Operational Actions:</div>
        <div className="quick-actions-btns">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="btn-quick-action btn-gold-action"
          >
            <Plus size={18} />
            <span>Add New Lead</span>
          </button>

          {(user.role === 'admin' || user.role === 'manager') && (
            <button
              onClick={handleTriggerSLA}
              disabled={isCheckingSLA}
              className="btn-quick-action btn-purple-action"
            >
              <Zap size={18} />
              <span>{isCheckingSLA ? 'Evaluating SLA...' : 'Run SLA Evaluation'}</span>
            </button>
          )}

          <button
            onClick={() => api.exportCSV('all')}
            className="btn-quick-action btn-outline-action"
          >
            <Download size={18} />
            <span>Export CSV Report</span>
          </button>
        </div>
      </div>

      {/* 2-COLUMN SECTION: Lead Sources & Pipeline Funnel */}
      <div className="dashboard-grid-2col">
        {/* Column 1: Multi-Channel Lead Sources */}
        <div className="dashboard-panel-card">
          <div className="panel-card-header">
            <h3>Multi-Channel Ingestion Distribution</h3>
            <span className="panel-tag">Source Attribution</span>
          </div>

          <div className="source-distribution-list">
            {metrics?.sources_breakdown.map((src) => (
              <div key={src.source} className="source-row-item">
                <div className="source-row-info">
                  <div className="source-icon-badge">{getSourceIcon(src.source)}</div>
                  <div>
                    <div className="source-title">{src.source_display}</div>
                    <div className="source-sub-count">{src.count} inquiries</div>
                  </div>
                </div>
                <div className="source-progress-wrapper">
                  <div className="source-percentage">{src.percentage}%</div>
                  <div className="source-progress-bar">
                    <div
                      className="source-progress-fill"
                      style={{ width: `${Math.max(src.percentage, 4)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Column 2: Pipeline Funnel */}
        <div className="dashboard-panel-card">
          <div className="panel-card-header">
            <h3>Pipeline Funnel Stages</h3>
            <span className="panel-tag">Lead Progression</span>
          </div>

          <div className="funnel-stages-list">
            {metrics?.funnel.map((f, idx) => {
              const total = metrics.kpi_cards.total_leads || 1;
              const pct = Math.round((f.count / total) * 100);
              return (
                <div key={f.status} className="funnel-row">
                  <div className="funnel-row-label">
                    <span className="funnel-step-num">0{idx + 1}</span>
                    <span className="funnel-status-name">{f.status_display}</span>
                  </div>
                  <div className="funnel-bar-container">
                    <div
                      className="funnel-bar-fill"
                      style={{ width: `${Math.max(pct, f.count > 0 ? 6 : 0)}%` }}
                    />
                    <span className="funnel-count-badge">{f.count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* RECENT ACTIVITY STREAM */}
      <div className="dashboard-panel-card" style={{ marginTop: '24px' }}>
        <div className="panel-card-header">
          <h3>Live Activity & Engagement Stream</h3>
          <span className="panel-tag">Real-Time Audit</span>
        </div>

        <div className="activities-stream-list">
          {metrics && metrics.recent_activities.length > 0 ? (
            metrics.recent_activities.map((act) => (
              <div key={act.id} className="activity-stream-item">
                <div className="activity-icon-container">
                  {getActivityIcon(act.activity_type)}
                </div>
                <div className="activity-details">
                  <div className="activity-lead-title">
                    <strong>{act.guest_name}</strong> &bull; {act.activity_type_display}
                  </div>
                  <div className="activity-notes-text">{act.notes}</div>
                </div>
                <div className="activity-meta">
                  <span className="activity-agent-pill">👤 {act.user_name}</span>
                  <span className="activity-time-stamp">
                    {new Date(act.created_at).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-activities-text">
              No recent activities logged yet. Ingest leads or make calls to see the stream!
            </div>
          )}
        </div>
      </div>

      {/* Add Lead Modal */}
      <AddLeadModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onLeadCreated={() => fetchMetrics()}
      />
    </div>
  );
};
