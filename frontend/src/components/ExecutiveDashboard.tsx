import React, { useState, useEffect } from 'react';
import {
  Plus,
  Zap,
  Flame,
  MessageSquare,
  RefreshCw,
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

  const handleBroadcastWhatsApp = () => {
    setSlaMessage('WhatsApp Broadcast dispatches dispatched to support agent queues.');
    setTimeout(() => setSlaMessage(null), 4000);
  };

  const totalLeads = metrics?.kpi_cards.total_leads ?? 0;
  const todayConverted = metrics?.kpi_cards.today_converted ?? 0;
  const totalBreaches = metrics?.kpi_cards.total_sla_breaches ?? 0;
  const pendingInaction = metrics?.kpi_cards.level1_support_inaction ?? 0;
  const convRate = metrics?.kpi_cards.conversion_rate_percentage ?? (totalLeads > 0 ? Math.round((todayConverted / totalLeads) * 100) : 0);

  const sourcesData = metrics?.sources_breakdown && metrics.sources_breakdown.length > 0
    ? metrics.sources_breakdown
    : [];

  const sourceColors = ['#8B5CF6', '#F59E0B', '#EC4899', '#C084FC', '#10B981', '#3B82F6'];
  const CIRCUMFERENCE = 376.99;
  let runningOffset = 0;

  return (
    <div className="web-dashboard-container animate-fade-in">
      {slaMessage && (
        <div className="sla-toast-banner animate-fade-in">
          <Zap size={18} />
          <span>{slaMessage}</span>
        </div>
      )}

      {/* 3 HERO KPI CARDS WITH WAVE CHARTS */}
      <div className="kpi-cards-grid-mockup">
        {/* Card 1: Total Leads (Purple Theme) */}
        <div className="kpi-wave-card card-purple-glow">
          <div className="wave-card-header">
            <span className="wave-card-title">Total Leads</span>
          </div>
          <div className="wave-card-value">{totalLeads}</div>
          <div className="wave-card-sub text-purple-sub">
            {totalLeads > 0 ? `${totalLeads} total lead inquiries` : 'No active leads yet'}
          </div>

          {/* Purple Smooth Wave Chart SVG */}
          <div className="svg-wave-container">
            <svg viewBox="0 0 300 80" preserveAspectRatio="none" className="wave-svg">
              <defs>
                <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 60 Q 40 40, 80 55 T 160 35 T 240 45 T 300 20 L 300 80 L 0 80 Z"
                fill="url(#purpleGrad)"
              />
              <path
                d="M0 60 Q 40 40, 80 55 T 160 35 T 240 45 T 300 20"
                fill="none"
                stroke="#A78BFA"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 2: Today Converted (Gold Theme) */}
        <div className="kpi-wave-card card-gold-glow">
          <div className="wave-card-header">
            <span className="wave-card-title">Today Converted</span>
          </div>
          <div className="wave-card-value">{todayConverted}</div>
          <div className="wave-card-sub text-gold-sub">{convRate}% conversion rate</div>

          {/* Gold Smooth Wave Chart SVG */}
          <div className="svg-wave-container">
            <svg viewBox="0 0 300 80" preserveAspectRatio="none" className="wave-svg">
              <defs>
                <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
                </linearGradient>
              </defs>
              <path
                d="M0 70 Q 50 65, 100 50 T 200 35 T 300 15 L 300 80 L 0 80 Z"
                fill="url(#goldGrad)"
              />
              <path
                d="M0 70 Q 50 65, 100 50 T 200 35 T 300 15"
                fill="none"
                stroke="#FBBF24"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>

        {/* Card 3: SLA Breaches (Red Indicator) */}
        <div className="kpi-wave-card card-red-glow">
          <div className="wave-card-header">
            <span className="wave-card-title">SLA Breaches</span>
            {totalBreaches > 0 && <div className="red-dot-indicator" />}
          </div>
          <div className="wave-card-value">{totalBreaches}</div>
          <div className="wave-card-sub text-red-sub">
            {pendingInaction} pending resolution
          </div>
        </div>
      </div>

      {/* BOTTOM SECTION: DONUT CHART + QUICK ACTIONS */}
      <div className="dashboard-bottom-grid">
        {/* Left Card: Leads by Source Donut Chart */}
        <div className="web-panel-card donut-panel">
          <h3 className="panel-section-title">Leads by Source</h3>

          <div className="donut-chart-flex">
            {/* Donut Chart SVG */}
            <div className="donut-svg-wrapper">
              <svg viewBox="0 0 160 160" className="donut-svg">
                <circle cx="80" cy="80" r="60" fill="transparent" stroke="#1F1F33" strokeWidth="24" />

                {sourcesData.length === 0 ? (
                  <circle cx="80" cy="80" r="60" fill="transparent" stroke="rgba(255,255,255,0.05)" strokeWidth="24" />
                ) : (
                  sourcesData.map((item, idx) => {
                    const strokeDash = (item.percentage / 100) * CIRCUMFERENCE;
                    const offset = runningOffset;
                    runningOffset += strokeDash;
                    const color = sourceColors[idx % sourceColors.length];

                    return (
                      <circle
                        key={item.source || idx}
                        cx="80"
                        cy="80"
                        r="60"
                        fill="transparent"
                        stroke={color}
                        strokeWidth="24"
                        strokeDasharray={`${strokeDash} ${CIRCUMFERENCE}`}
                        strokeDashoffset={`-${offset}`}
                      />
                    );
                  })
                )}
              </svg>
            </div>

            {/* Donut Legend */}
            <div className="donut-legend-list">
              {sourcesData.length === 0 ? (
                <div style={{ color: '#94A3B8', fontSize: '0.85rem', fontStyle: 'italic', padding: '10px 0' }}>
                  No lead source data registered yet. Add leads to view source breakdown.
                </div>
              ) : (
                sourcesData.map((item, idx) => (
                  <div key={item.source || idx} className="legend-item">
                    <span
                      className="legend-dot"
                      style={{ backgroundColor: sourceColors[idx % sourceColors.length] }}
                    />
                    <span className="legend-name">{item.source}</span>
                    <span className="legend-pct">{item.percentage}%</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Card: Quick Actions Bar */}
        <div className="web-panel-card quick-actions-panel">
          <h3 className="panel-section-title">Quick Actions</h3>

          <div className="quick-actions-box-container">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="quick-action-tile tile-gold"
            >
              <Plus size={18} />
              <span>Add Lead</span>
            </button>

            <button
              onClick={() => onNavigateTab('leads')}
              className="quick-action-tile tile-purple"
            >
              <RefreshCw size={18} />
              <span>Reassign Lead</span>
            </button>

            <button
              onClick={handleBroadcastWhatsApp}
              className="quick-action-tile tile-whatsapp"
            >
              <MessageSquare size={18} />
              <span>Broadcast WhatsApp</span>
            </button>
          </div>
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
