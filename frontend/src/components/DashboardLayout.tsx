import React, { useState, useEffect } from 'react';
import {
  Crown,
  LayoutDashboard,
  Users,
  PhoneCall,
  AlertTriangle,
  BarChart3,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { api, UserProfile } from '../api';
import { ExecutiveDashboard } from './ExecutiveDashboard';
import { LeadsDirectory } from './LeadsDirectory';
import { CallingWorkspace } from './CallingWorkspace';
import { EscalationsBoard } from './EscalationsBoard';
import { TeamPerformance } from './TeamPerformance';

interface DashboardLayoutProps {
  user: UserProfile;
  onLogout: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ user, onLogout }) => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [escalationCount, setEscalationCount] = useState<number>(0);

  const fetchEscalationCount = async () => {
    try {
      const data = await api.getEscalations('all');
      setEscalationCount(data.metrics?.total_escalated ?? (data.escalations?.length || 0));
    } catch (err) {
      // If error or support role, set 0
      setEscalationCount(0);
    }
  };

  useEffect(() => {
    fetchEscalationCount();
    const interval = setInterval(fetchEscalationCount, 20000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const navTabs = [
    { key: 'overview', label: 'Overview', icon: <LayoutDashboard size={20} /> },
    { key: 'leads', label: 'Leads Directory', icon: <Users size={20} /> },
    { key: 'queue', label: 'Calling Workspace', icon: <PhoneCall size={20} /> },
    { key: 'escalations', label: 'Escalations', icon: <AlertTriangle size={20} />, badge: escalationCount },
    { key: 'team', label: 'Team & Performance', icon: <BarChart3 size={20} /> },
  ];

  return (
    <div className="portal-app-shell">
      {/* LEFT SIDEBAR NAVIGATION */}
      <aside className="portal-sidebar">
        {/* Brand Header */}
        <div className="sidebar-brand-box">
          <div className="brand-logo-badge">
            <Crown size={24} />
          </div>
          <div>
            <div className="brand-text-luxury">HOTELCRM</div>
            <div className="hotel-subtitle-text">Grand Luxury Resort & Spa</div>
          </div>
        </div>

        {/* Navigation Tabs List */}
        <div className="sidebar-menu-section">
          <div className="sidebar-section-label">MAIN NAVIGATION</div>
          <nav className="sidebar-nav-list">
            {navTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`sidebar-nav-item ${activeTab === tab.key ? 'active' : ''}`}
              >
                <div className="sidebar-nav-icon">{tab.icon}</div>
                <span className="sidebar-nav-label">{tab.label}</span>
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span className="tab-alert-badge">{tab.badge}</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Live SLA Engine Status Widget */}
        <div className="sidebar-sla-widget">
          <div className="sla-widget-header">
            <Sparkles size={14} color="#D4AF37" />
            <span>4-Day SLA Engine</span>
          </div>
          <p>Continuous WhatsApp breach monitoring active.</p>
        </div>

        {/* Bottom User Profile & Logout */}
        <div className="sidebar-footer-user">
          <div className="user-profile-card">
            <div className="user-avatar-small">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="user-text-meta">
              <div className="user-name-line">{user.username}</div>
              <div className={`user-role-tag role-tag-${user.role}`}>
                👑 {user.role.toUpperCase()}
              </div>
            </div>
          </div>

          <button onClick={onLogout} className="btn-sidebar-logout" title="Sign Out of Session">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* RIGHT MAIN CONTENT AREA */}
      <div className="portal-main-area">
        <main className="portal-main-body">
          {activeTab === 'overview' && (
            <ExecutiveDashboard
              user={user}
              onNavigateTab={(tabKey) => setActiveTab(tabKey)}
            />
          )}

          {activeTab === 'leads' && (
            <LeadsDirectory
              user={user}
              onNavigateToQueue={() => setActiveTab('queue')}
            />
          )}

          {activeTab === 'queue' && (
            <CallingWorkspace
              user={user}
            />
          )}

          {activeTab === 'escalations' && (
            <EscalationsBoard
              user={user}
            />
          )}

          {activeTab === 'team' && (
            <TeamPerformance
              user={user}
            />
          )}
        </main>
      </div>
    </div>
  );
};
