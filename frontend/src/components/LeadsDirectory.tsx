import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Filter,
  Phone,
  Mail,
  Plus,
  ArrowRight,
  Flame,
  MessageSquare,
  Globe,
  Share2,
  FileText,
  UserCheck,
  Camera,
  RefreshCw,
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
  const [sourceFilter, setSourceFilter] = useState<string>('all');

  const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);

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
      if (sourceFilter !== 'all') params.source = sourceFilter;

      const data = await api.getLeads(params);
      setLeads(Array.isArray(data) ? data : data.results || []);
    } catch (err) {
      console.error('Failed to fetch leads:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  useEffect(() => {
    fetchLeads();
  }, [statusFilter, staffFilter, sourceFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLeads();
  };

  // Quick statistics calculated from active list
  const totalCount = leads.length;
  const interestedCount = leads.filter((l) => l.status === 'interested').length;
  const registeredCount = leads.filter((l) => l.status === 'registered').length;
  const awaitingCount = leads.filter((l) => l.status === 'awaiting_followup').length;
  const escalatedCount = leads.filter((l) => l.is_escalated).length;

  const getSourceIcon = (src: string) => {
    switch (src) {
      case 'instagram':
        return <Camera size={14} color="#EC4899" />;
      case 'whatsapp':
        return <MessageSquare size={14} color="#10B981" />;
      case 'facebook':
        return <Share2 size={14} color="#3B82F6" />;
      case 'website':
        return <Globe size={14} color="#F59E0B" />;
      default:
        return <FileText size={14} color="#94A3B8" />;
    }
  };

  return (
    <div className="dashboard-content-wrapper animate-fade-in">
      {/* Top Header */}
      <div className="dashboard-top-bar">
        <div>
          <h1 className="dashboard-page-title">Master Leads Directory</h1>
          <p className="dashboard-page-sub">
            Comprehensive multi-channel guest inquiries, assignment matrix, and follow-up tracking
          </p>
        </div>

        <div className="top-bar-actions-right">
          <button onClick={() => fetchLeads()} className="btn-icon-refresh" title="Refresh list">
            <RefreshCw size={17} />
          </button>
          <button onClick={() => setIsAddModalOpen(true)} className="btn-quick-action btn-gold-action">
            <Plus size={18} />
            <span>Add New Lead</span>
          </button>
        </div>
      </div>

      {/* Staff & Filter Bar */}
      <div className="leads-filter-container">
        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="leads-search-form">
          <Search size={18} className="search-input-icon" />
          <input
            type="text"
            placeholder="Search by Guest Name, Phone (+91), Email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="leads-search-input"
          />
          <button type="submit" className="btn-search-go">Search</button>
        </form>

        {/* Staff Grouping Filter */}
        <div className="filter-select-group">
          <Filter size={15} color="#94A3B8" />
          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="filter-select-input"
          >
            <option value="all">All Assigned Staff</option>
            {staffList.map((s) => (
              <option key={s.id} value={s.id}>
                {s.username} ({s.role.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Channel Source Filter */}
        <div className="filter-select-group">
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="filter-select-input"
          >
            <option value="all">All Sources</option>
            <option value="instagram">Instagram DM</option>
            <option value="whatsapp">WhatsApp Direct</option>
            <option value="facebook">Facebook Ad</option>
            <option value="website">Website Booking Inquiry</option>
            <option value="manual">Manual Walk-In/Phone</option>
          </select>
        </div>
      </div>

      {/* Multi-Status Filter Chips */}
      <div className="status-filter-chips-row">
        {[
          { key: 'all', label: 'All Leads' },
          { key: 'interested', label: 'Interested' },
          { key: 'awaiting_followup', label: 'Awaiting Follow-up' },
          { key: 'completed_followup', label: 'Completed Follow-up' },
          { key: 'registered', label: 'Registered / Confirmed' },
          { key: 'not_interested', label: 'Not Interested' },
          { key: 'lost', label: 'Lost' },
        ].map((chip) => (
          <button
            key={chip.key}
            onClick={() => setStatusFilter(chip.key)}
            className={`status-chip-btn ${statusFilter === chip.key ? 'active' : ''}`}
          >
            {chip.label}
          </button>
        ))}
      </div>

      {/* Staff Summary Banner */}
      <div className="staff-summary-metrics-bar">
        <div className="summary-metric-item">
          <span className="summary-metric-label">Total Leads Shown</span>
          <span className="summary-metric-val">{totalCount}</span>
        </div>
        <div className="summary-metric-divider" />
        <div className="summary-metric-item">
          <span className="summary-metric-label">Interested</span>
          <span className="summary-metric-val text-gold">{interestedCount}</span>
        </div>
        <div className="summary-metric-divider" />
        <div className="summary-metric-item">
          <span className="summary-metric-label">Awaiting Follow-up</span>
          <span className="summary-metric-val text-blue">{awaitingCount}</span>
        </div>
        <div className="summary-metric-divider" />
        <div className="summary-metric-item">
          <span className="summary-metric-label">Confirmed Bookings</span>
          <span className="summary-metric-val text-green">{registeredCount}</span>
        </div>
        {escalatedCount > 0 && (
          <>
            <div className="summary-metric-divider" />
            <div className="summary-metric-item">
              <span className="summary-metric-label">SLA Overdue</span>
              <span className="summary-metric-val text-red">⚠️ {escalatedCount}</span>
            </div>
          </>
        )}
      </div>

      {/* Leads Table Card */}
      <div className="dashboard-panel-card leads-table-card">
        {isLoading ? (
          <div className="lead-modal-loading">
            <div className="loading-spinner-gold" />
            <span>Loading Leads Directory...</span>
          </div>
        ) : leads.length > 0 ? (
          <div className="leads-table-wrapper">
            <table className="leads-data-table">
              <thead>
                <tr>
                  <th>Guest Name & ID</th>
                  <th>Contact Info</th>
                  <th>Source</th>
                  <th>Status</th>
                  <th>Assigned Agent</th>
                  <th>Priority</th>
                  <th>Last Contact</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => (
                  <tr key={lead.id} className={lead.is_escalated ? 'row-escalated' : ''}>
                    <td>
                      <div className="lead-name-cell">
                        <span className="lead-guest-name">{lead.guest_name}</span>
                        <span className="lead-id-tag">#{lead.id}</span>
                        {lead.is_escalated && (
                          <span className="badge-flame-mini" title="SLA Breach">
                            <Flame size={12} color="#EF4444" /> Overdue
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="contact-cell">
                        <div className="contact-line">
                          <Phone size={13} color="#94A3B8" />
                          <span>{lead.phone}</span>
                        </div>
                        {lead.email && (
                          <div className="contact-line">
                            <Mail size={13} color="#64748B" />
                            <span className="email-truncate">{lead.email}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="source-tag-badge">
                        {getSourceIcon(lead.source)}
                        <span>{lead.source_display || lead.source}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill status-${lead.status}`}>
                        {lead.status_display || lead.status?.replace('_', ' ')}
                      </span>
                    </td>
                    <td>
                      <div className="assigned-agent-cell">
                        <UserCheck size={14} color="#A5B4FC" />
                        <span>{lead.assigned_to_name || 'Unassigned'}</span>
                      </div>
                    </td>
                    <td>
                      <span className={`priority-pill priority-${lead.priority}`}>
                        {lead.priority?.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className="time-sub-text">
                        {lead.last_contacted_at
                          ? new Date(lead.last_contacted_at).toLocaleDateString()
                          : 'Never'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions-cell">
                        <button
                          onClick={() => setSelectedLeadId(lead.id)}
                          className="btn-view-lead"
                          title="View Profile Timeline"
                        >
                          Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty-activities-text" style={{ padding: '60px 0' }}>
            No leads match your current search and filter criteria.
          </div>
        )}
      </div>

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
