import React, { useState, useEffect } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  Calendar,
  DollarSign,
  Clock,
  MessageSquare,
  Flame,
  Send,
  Sparkles,
  PhoneCall,
  CheckCircle,
} from 'lucide-react';
import { api } from '../api';

interface LeadDetailModalProps {
  leadId: number | null;
  onClose: () => void;
  onLeadUpdated?: () => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({ leadId, onClose, onLeadUpdated }) => {
  const [lead, setLead] = useState<any | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [noteText, setNoteText] = useState<string>('');
  const [isSubmittingNote, setIsSubmittingNote] = useState<boolean>(false);

  const fetchLeadData = async () => {
    if (!leadId) return;
    setIsLoading(true);
    try {
      const [leadData, timelineData] = await Promise.all([
        api.getLead(leadId),
        api.getLeadTimeline(leadId),
      ]);
      setLead(leadData);
      setActivities(timelineData.activities || []);
    } catch (err) {
      console.error('Failed to load lead details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLeadData();
  }, [leadId]);

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!leadId || !noteText.trim()) return;

    setIsSubmittingNote(true);
    try {
      await api.addLeadActivity(leadId, {
        activity_type: 'note',
        notes: noteText.trim(),
      });
      setNoteText('');
      fetchLeadData();
      if (onLeadUpdated) onLeadUpdated();
    } catch (err) {
      console.error('Failed to add note:', err);
    } finally {
      setIsSubmittingNote(false);
    }
  };

  if (!leadId) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card lead-detail-modal-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <div className="modal-icon-crown">
              <User size={20} />
            </div>
            <div>
              <h3>{isLoading ? 'Loading Guest Profile...' : lead?.guest_name}</h3>
              <p>Lead ID: #{leadId} &bull; Channel: {lead?.source?.toUpperCase()}</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="lead-modal-loading">
            <div className="loading-spinner-gold" />
            <span>Retrieving guest details & activity history...</span>
          </div>
        ) : (
          <div className="lead-detail-body">
            {/* Left Column: Guest Information */}
            <div className="lead-profile-sidebar">
              <div className="profile-status-badge-wrap">
                <span className={`status-pill status-${lead?.status}`}>
                  {lead?.status?.replace('_', ' ').toUpperCase()}
                </span>
                <span className={`priority-pill priority-${lead?.priority}`}>
                  {lead?.priority?.toUpperCase()} PRIORITY
                </span>
              </div>

              {lead?.is_escalated && (
                <div className="escalation-alert-card">
                  <Flame size={18} color="#EF4444" />
                  <div>
                    <div className="escalation-title">SLA Breach Active</div>
                    <div className="escalation-sub">
                      {lead?.escalation_level === 'level2_admin' ? 'Level 2 Admin Escalation' : 'Level 1 Support Inaction'}
                    </div>
                  </div>
                </div>
              )}

              <div className="profile-info-section">
                <h4>Contact Details</h4>
                <div className="info-item">
                  <Phone size={15} color="#94A3B8" />
                  <span>{lead?.phone}</span>
                </div>
                {lead?.email && (
                  <div className="info-item">
                    <Mail size={15} color="#94A3B8" />
                    <span>{lead?.email}</span>
                  </div>
                )}
              </div>

              <div className="profile-info-section">
                <h4>Reservation Requirements</h4>
                {lead?.stay_dates && (
                  <div className="info-item">
                    <Calendar size={15} color="#94A3B8" />
                    <span>Dates: {lead?.stay_dates}</span>
                  </div>
                )}
                {lead?.room_type_preference && (
                  <div className="info-item">
                    <Sparkles size={15} color="#94A3B8" />
                    <span>Room: {lead?.room_type_preference}</span>
                  </div>
                )}
                {lead?.budget && (
                  <div className="info-item">
                    <DollarSign size={15} color="#94A3B8" />
                    <span>Budget: ₹{Number(lead?.budget).toLocaleString()}</span>
                  </div>
                )}
              </div>

              <div className="profile-info-section">
                <h4>Staff Assignment</h4>
                <div className="info-item">
                  <User size={15} color="#94A3B8" />
                  <span>Support: {lead?.assigned_to_name || 'Unassigned'}</span>
                </div>
                {lead?.assigned_manager_name && (
                  <div className="info-item">
                    <User size={15} color="#94A3B8" />
                    <span>Manager: {lead?.assigned_manager_name}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Activity Timeline & Notes */}
            <div className="lead-timeline-area">
              <h4 className="timeline-heading">Activity & Engagement History</h4>

              <div className="timeline-items-scroll">
                {activities.length > 0 ? (
                  activities.map((act) => (
                    <div key={act.id} className="timeline-item-card">
                      <div className="timeline-item-icon">
                        {act.activity_type === 'call' && <PhoneCall size={16} color="#60A5FA" />}
                        {act.activity_type === 'whatsapp_dispatched' && <MessageSquare size={16} color="#10B981" />}
                        {act.activity_type === 'escalated' && <Flame size={16} color="#EF4444" />}
                        {act.activity_type === 'status_change' && <CheckCircle size={16} color="#F59E0B" />}
                        {act.activity_type === 'note' && <User size={16} color="#A78BFA" />}
                      </div>
                      <div className="timeline-item-content">
                        <div className="timeline-item-header">
                          <span className="timeline-act-type">{act.activity_type_display}</span>
                          <span className="timeline-act-time">
                            {new Date(act.created_at).toLocaleString()}
                          </span>
                        </div>
                        <p className="timeline-item-notes">{act.notes}</p>
                        <div className="timeline-item-author">Logged by: {act.user_name}</div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="empty-timeline-state">
                    No timeline records logged for this lead yet.
                  </div>
                )}
              </div>

              {/* Add Note Input Form */}
              <form onSubmit={handleAddNote} className="timeline-add-note-form">
                <input
                  type="text"
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder="Type an internal note or update..."
                  className="add-note-input"
                />
                <button
                  type="submit"
                  disabled={isSubmittingNote || !noteText.trim()}
                  className="btn-submit-note"
                >
                  <Send size={15} />
                  <span>{isSubmittingNote ? 'Saving...' : 'Add Note'}</span>
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
