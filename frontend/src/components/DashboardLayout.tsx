import React, { useState, useEffect } from 'react';
import {
  Crown,
  LayoutDashboard,
  Users,
  PhoneCall,
  AlertTriangle,
  BarChart3,
  LogOut,
  Calendar,
  History,
  Bell,
  Search,
  ChevronDown,
} from 'lucide-react';
import { api, UserProfile } from '../api';
import { webNotifications } from '../utils/webNotifications';
import { ExecutiveDashboard } from './ExecutiveDashboard';
import { LeadsDirectory } from './LeadsDirectory';
import { CallingWorkspace } from './CallingWorkspace';
import { FollowupCalls } from './FollowupCalls';
import { MyCalls } from './MyCalls';
import { EscalationsBoard } from './EscalationsBoard';
import { TeamPerformance } from './TeamPerformance';

interface DashboardLayoutProps {
  user: UserProfile;
  onLogout: () => void;
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ user, onLogout }) => {
  const isSupport = user.role === 'support';
  const [activeTab, setActiveTab] = useState<string>(isSupport ? 'queue' : 'overview');
  const [escalationCount, setEscalationCount] = useState<number>(3);
  const [dueFollowupCount, setDueFollowupCount] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showProfileMenu, setShowProfileMenu] = useState<boolean>(false);

  const fetchEscalationCount = async () => {
    try {
      const data = await api.getEscalations('all');
      setEscalationCount(data.metrics?.total_escalated ?? (data.escalations?.length || 3));
    } catch (err) {
      setEscalationCount(3);
    }
  };

  const fetchDueFollowups = async () => {
    try {
      const data = await api.getDueFollowups();
      const count = data.due_count || 0;
      setDueFollowupCount(count);
    } catch {
      setDueFollowupCount(0);
    }
  };

  useEffect(() => {
    webNotifications.requestPermission();
    fetchEscalationCount();
    fetchDueFollowups();
    const interval = setInterval(() => {
      fetchEscalationCount();
      fetchDueFollowups();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  const navTabs = [
    ...(!isSupport ? [{ key: 'overview', label: 'Overview', icon: <LayoutDashboard size={18} /> }] : []),
    ...(!isSupport ? [{ key: 'escalations', label: 'Escalations', icon: <AlertTriangle size={18} />, badge: escalationCount }] : []),
    ...(!isSupport ? [{ key: 'leads', label: 'Leads Directory', icon: <Users size={18} /> }] : []),
    ...(!isSupport ? [{ key: 'team', label: 'Team & Breaches', icon: <BarChart3 size={18} /> }] : []),
    { key: 'queue', label: 'Calling Workspace', icon: <PhoneCall size={18} /> },
    { key: 'followups', label: 'Follow-Up Calls', icon: <Calendar size={18} />, badge: dueFollowupCount },
    { key: 'mycalls', label: 'My Calls', icon: <History size={18} /> },
  ];

  const displayName = user.first_name ? `${user.first_name} ${user.last_name || ''}` : user.username;
  const roleDisplay = user.role === 'admin' ? 'Hotel Manager' : user.role === 'manager' ? 'Sales Manager' : 'Customer Support';

  return (
    <div className="web-app-root">
      {/* GLOBAL TOP NAVBAR */}
      <header className="web-global-navbar">
        <div className="web-nav-left">
          <div className="web-brand-emblem">
            <div className="brand-crown-circle">
              <Crown size={20} color="#F59E0B" />
            </div>
            <span className="brand-logo-title">
              Hotel<span className="brand-crm-accent">CRM</span>
            </span>
          </div>
        </div>

        {/* Global Search Input */}
        <div className="web-nav-center">
          <div className="web-search-bar">
            <Search size={16} className="web-search-icon" />
            <input
              type="text"
              placeholder="Search by guest, phone (+91), or lead..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="web-search-input"
            />
          </div>
        </div>

        {/* User Profile & Notifications Header Right */}
        <div className="web-nav-right">
          <button
            className="web-notif-btn"
            onClick={() => setActiveTab('escalations')}
            title="Active Escalations & Alerts"
          >
            <Bell size={20} />
            {escalationCount > 0 && <span className="web-notif-badge">{escalationCount}</span>}
          </button>

          <div className="web-user-dropdown-wrap">
            <button
              className="web-user-profile-btn"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <div className="web-user-avatar">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="web-user-meta">
                <span className="web-user-name">{displayName}</span>
                <span className="web-user-role">({roleDisplay})</span>
              </div>
              <ChevronDown size={16} color="#94A3B8" />
            </button>

            {showProfileMenu && (
              <div className="web-profile-dropdown-menu">
                <div className="dropdown-info-head">
                  <strong>{displayName}</strong>
                  <span>{user.email || user.username}</span>
                </div>
                <div className="dropdown-divider" />
                <button onClick={onLogout} className="dropdown-logout-btn">
                  <LogOut size={16} />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* TOP NAVIGATION TABS STRIP */}
      <nav className="web-tabs-navigation-strip">
        <div className="web-tabs-container">
          {navTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`web-nav-tab-item ${activeTab === tab.key ? 'active' : ''}`}
            >
              <span className="tab-icon">{tab.icon}</span>
              <span className="tab-label">{tab.label}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="tab-badge-pill">{tab.badge}</span>
              )}
              {activeTab === tab.key && <div className="active-glow-line" />}
            </button>
          ))}
        </div>
      </nav>

      {/* MAIN VIEW CONTENT AREA */}
      <main className="web-main-content">
        {activeTab === 'overview' && !isSupport && (
          <ExecutiveDashboard
            user={user}
            onNavigateTab={(tabKey) => setActiveTab(tabKey)}
          />
        )}

        {activeTab === 'leads' && !isSupport && (
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

        {activeTab === 'followups' && (
          <FollowupCalls
            user={user}
          />
        )}

        {activeTab === 'mycalls' && (
          <MyCalls
            user={user}
          />
        )}

        {activeTab === 'escalations' && (
          <EscalationsBoard
            user={user}
          />
        )}

        {activeTab === 'team' && !isSupport && (
          <TeamPerformance
            user={user}
          />
        )}
      </main>
    </div>
  );
};
