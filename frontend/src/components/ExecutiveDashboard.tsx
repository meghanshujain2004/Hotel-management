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
          <div className="wave-card-sub text-purple-sub">+15% vs yesterday</div>

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
          <div className="wave-card-sub text-gold-sub">86% rate</div>

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
            <div className="red-dot-indicator" />
          </div>
          <div className="wave-card-value">{totalBreaches}</div>
          <div className="wave-card-sub text-red-sub">
            {metrics?.kpi_cards.level1_support_inaction ?? 2} pending resolution
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
                {/* Segment 1: Direct 45% (Purple) */}
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  fill="transparent"
                  stroke="#8B5CF6"
                  strokeWidth="24"
                  strokeDasharray="169.6 376.9"
                  strokeDashoffset="0"
                />
                {/* Segment 2: OTAs 30% (Gold) */}
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  fill="transparent"
                  stroke="#F59E0B"
                  strokeWidth="24"
                  strokeDasharray="113.1 376.9"
                  strokeDashoffset="-169.6"
                />
                {/* Segment 3: Walk-in 15% (Pink/Purple) */}
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  fill="transparent"
                  stroke="#EC4899"
                  strokeWidth="24"
                  strokeDasharray="56.5 376.9"
                  strokeDashoffset="-282.7"
                />
                {/* Segment 4: Corp 10% (Light Violet) */}
                <circle
                  cx="80"
                  cy="80"
                  r="60"
                  fill="transparent"
                  stroke="#C084FC"
                  strokeWidth="24"
                  strokeDasharray="37.7 376.9"
                  strokeDashoffset="-339.2"
                />
              </svg>
            </div>

            {/* Donut Legend */}
            <div className="donut-legend-list">
              <div className="legend-item">
                <span className="legend-dot dot-purple" />
                <span className="legend-name">Direct</span>
                <span className="legend-pct">45%</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot dot-gold" />
                <span className="legend-name">OTAs</span>
                <span className="legend-pct">30%</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot dot-pink" />
                <span className="legend-name">Walk-in</span>
                <span className="legend-pct">15%</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot dot-light-purple" />
                <span className="legend-name">Corp</span>
                <span className="legend-pct">10%</span>
              </div>
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
