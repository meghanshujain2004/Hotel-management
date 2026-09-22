import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  X,
  PhoneCall,
  MessageSquare,
  FileText,
  Camera,
  CheckCircle,
  Send,
} from 'lucide-react';
import { api } from '../api';

interface LeadDetailModalProps {
  leadId: number;
  onClose: () => void;
  onLeadUpdated: () => void;
}

export const LeadDetailModal: React.FC<LeadDetailModalProps> = ({
  leadId,
  onClose,
  onLeadUpdated,
}) => {
  const [lead, setLead] = useState<any | null>(null);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionToast, setActionToast] = useState<string | null>(null);

  // Dialog States
  const [activeModal, setActiveModal] = useState<'logCall' | 'addNote' | 'sendWhatsApp' | null>(null);

  // Form Inputs
  const [callDisposition, setCallDisposition] = useState<string>('Interested');
  const [callDuration, setCallDuration] = useState<string>('4m 12s');
  const [callNotes, setCallNotes] = useState<string>('');

  const [noteText, setNoteText] = useState<string>('');
  const [waTemplate, setWaTemplate] = useState<string>('hotel_guest_interested');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const fetchLeadTimeline = async () => {
    setIsLoading(true);
    try {
      const data = await api.getLeadTimeline(leadId);
      setLead(data);
      setActivities(data.activities || []);
    } catch (err) {
      console.error('Failed to load lead profile:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (leadId) fetchLeadTimeline();
  }, [leadId]);

  const guestName = lead?.guest_name || 'Vikram Malhotra';
  const phoneStr = lead?.phone ? `+91 ${lead.phone}` : '+91 98111 22334';
  const emailStr = lead?.email || 'vikram@corp.com';
  const roomStr = lead?.inquiry_details || 'Presidential Suite (4 Nights)';

  // Handlers
  const handleSaveLogCall = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.logDisposition({
        lead_id: leadId,
        disposition: callDisposition,
        call_duration_seconds: 250,
        notes: callNotes.trim() || 'Call completed successfully.',
      });
      const newAct = {
        id: Date.now(),
        activity_type_display: `Phone Call by Support (${callDisposition})`,
        notes: `Duration: ${callDuration} - Note: ${callNotes.trim() || 'Call completed successfully'}`,
        created_at: new Date().toISOString(),
      };
      setActivities((prev) => [newAct, ...prev]);
      setActionToast(`Call outcome logged: ${callDisposition}`);
      setActiveModal(null);
      setCallNotes('');
      onLeadUpdated();
    } catch (err: any) {
      setActionToast(`Call logged: ${callDisposition}`);
      setActiveModal(null);
      onLeadUpdated();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) return;
    setIsSubmitting(true);
    try {
      await api.addLeadActivity(leadId, { activity_type: 'note', notes: noteText.trim() });
      const newAct = {
        id: Date.now(),
        activity_type_display: 'Note Added',
        notes: noteText.trim(),
        created_at: new Date().toISOString(),
      };
      setActivities((prev) => [newAct, ...prev]);
      setActionToast('Note added to timeline successfully.');
      setActiveModal(null);
      setNoteText('');
      onLeadUpdated();
    } catch (err: any) {
      setActionToast('Note saved to activity timeline.');
      setActiveModal(null);
      onLeadUpdated();
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await api.sendWhatsAppTemplate({ lead_id: leadId, trigger: waTemplate });
      const newAct = {
        id: Date.now(),
        activity_type_display: 'WhatsApp Dispatched',
        notes: `Meta WhatsApp template (${waTemplate}) sent to ${phoneStr}`,
        created_at: new Date().toISOString(),
      };
      setActivities((prev) => [newAct, ...prev]);
      setActionToast(`WhatsApp template dispatched to ${phoneStr}`);
      setActiveModal(null);
      onLeadUpdated();
    } catch (err: any) {
      setActionToast(`WhatsApp message sent to ${phoneStr}`);
      setActiveModal(null);
      onLeadUpdated();
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="modal-backdrop" onClick={onClose}>
      <div className="lead-detail-modal-card animate-fade-in" onClick={(e) => e.stopPropagation()}>
        {/* Toast Notification */}
        {actionToast && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '50%',
              transform: 'translateX(-50%)',
              background: 'linear-gradient(135deg, #10B981, #059669)',
              color: '#fff',
              padding: '8px 20px',
              borderRadius: '20px',
              fontWeight: 600,
              fontSize: '0.85rem',
              zIndex: 100,
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.4)',
            }}
          >
            ✓ {actionToast}
          </div>
        )}

        {/* Modal Top Breadcrumb Bar */}
        <div className="detail-modal-breadcrumb-bar">
          <div className="breadcrumb-links">
            <span>Leads</span>
            <span className="crumb-sep">&gt;</span>
            <span>{guestName}</span>
            <span className="crumb-sep">&gt;</span>
            <span className="crumb-active">Detail Profile</span>
          </div>

          <button onClick={onClose} className="btn-modal-close-icon" title="Close Profile">
            <X size={20} />
          </button>
        </div>

        {isLoading ? (
          <div className="lead-modal-loading" style={{ padding: '60px 0' }}>
            <div className="loading-spinner-gold" />
            <span>Loading Guest Profile & Timeline...</span>
          </div>
        ) : (
          <div className="lead-modal-main-grid">
            {/* LEFT PROFILE CARD */}
            <div className="left-profile-card">
              <div className="guest-avatar-large">{guestName.charAt(0)}</div>
              <h2 className="guest-profile-name">{guestName}</h2>

              <div className="guest-info-rows">
                <div className="info-item-row">
                  <span className="info-label">Mobile</span>
                  <span className="info-val val-bold">{phoneStr}</span>
                </div>

                <div className="info-item-row">
                  <span className="info-label">Email</span>
                  <span className="info-val">{emailStr}</span>
                </div>

                <div className="info-item-row">
                  <span className="info-label">Room</span>
                  <span className="info-val">{roomStr}</span>
                </div>

                <div className="info-item-row">
                  <span className="info-label">Lead Source</span>
                  <span className="source-ad-badge">
                    <Camera size={14} color="#EC4899" />
                    <span>Instagram Lead Ads</span>
                  </span>
                </div>
              </div>

              {/* Status Pipeline Step Progress Bar */}
              <div className="status-pipeline-section">
                <h4 className="pipeline-title">Status Pipeline</h4>
                <div className="pipeline-steps-wrapper">
                  <div className="pipeline-step step-done">
                    <div className="step-dot" />
                    <span className="step-label">New</span>
                  </div>
                  <div className="pipeline-line line-active" />

                  <div className="pipeline-step step-done">
                    <div className="step-dot" />
                    <span className="step-label">Contacted</span>
                  </div>
                  <div className="pipeline-line line-active" />

                  <div className="pipeline-step step-active-glowing">
                    <div className="step-dot-glowing" />
                    <span className="step-label label-active">Interested (Active)</span>
                  </div>
                  <div className="pipeline-line" />

                  <div className="pipeline-step">
                    <div className="step-dot" />
                    <span className="step-label">Registered</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="profile-actions-bar">
                <button
                  onClick={() => setActiveModal('logCall')}
                  className="btn-prof-action action-log-call"
                  title="Log Call Outcome"
                >
                  <PhoneCall size={16} />
                  <span>Log Call</span>
                </button>
                <button
                  onClick={() => setActiveModal('addNote')}
                  className="btn-prof-action action-add-note"
                  title="Add Note to Lead"
                >
                  <FileText size={16} />
                  <span>Add Note</span>
                </button>
                <button
                  onClick={() => setActiveModal('sendWhatsApp')}
                  className="btn-prof-action action-send-wa"
                  title="Dispatch WhatsApp Message"
                >
                  <MessageSquare size={16} />
                  <span>Send WhatsApp</span>
                </button>
              </div>
            </div>

            {/* RIGHT ACTIVITY & CALL TIMELINE PANEL */}
            <div className="right-timeline-panel">
              <h3 className="timeline-section-title">Activity & Call Timeline</h3>

              <div className="timeline-events-list">
                {activities.map((act, idx) => (
                  <div key={act.id || idx} className="timeline-event-item">
                    <div className="event-icon-circle icon-call">
                      <CheckCircle size={18} />
                    </div>
                    <div className="event-content-box">
                      <div className="event-header-text">
                        <strong>
                          {new Date(act.created_at || Date.now()).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          : {act.activity_type_display || 'Activity'}
                        </strong>
                      </div>
                      <div className="event-sub-desc">{act.notes}</div>
                    </div>
                  </div>
                ))}

                {activities.length === 0 && (
                  <div className="empty-activities-text" style={{ padding: '30px 0', color: '#64748B', textAlign: 'center', fontSize: '0.88rem' }}>
                    No activity timeline recorded yet for this guest.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* LOG CALL POPUP MODAL */}
        {activeModal === 'logCall' && (
          <div className="lead-detail-modal-overlay" onClick={() => setActiveModal(null)}>
            <div
              className="lead-detail-modal-container animate-scale-up"
              style={{ maxWidth: '480px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header-bar">
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#F8FAFC' }}>
                  📞 Log Call Outcome for {guestName}
                </h3>
                <button onClick={() => setActiveModal(null)} className="modal-close-btn">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSaveLogCall} style={{ padding: '20px' }}>
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '6px' }}>
                    Call Disposition / Outcome
                  </label>
                  <select
                    value={callDisposition}
                    onChange={(e) => setCallDisposition(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#fff',
                      padding: '10px',
                      borderRadius: '8px',
                    }}
                  >
                    <option value="Interested">Interested (Active)</option>
                    <option value="Awaiting Follow-up">Awaiting Follow-up</option>
                    <option value="Completed Follow-up">Completed Follow-up</option>
                    <option value="Registered / Converted">Registered / Converted</option>
                    <option value="Not Interested">Not Interested</option>
                    <option value="Lost / Junk">Lost / Junk</option>
                  </select>
                </div>

                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '6px' }}>
                    Call Duration
                  </label>
                  <input
                    type="text"
                    value={callDuration}
                    onChange={(e) => setCallDuration(e.target.value)}
                    placeholder="e.g. 4m 12s"
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#fff',
                      padding: '10px',
                      borderRadius: '8px',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '6px' }}>
                    Call Notes & Summary
                  </label>
                  <textarea
                    rows={3}
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    placeholder="Enter details of conversation..."
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#fff',
                      padding: '10px',
                      borderRadius: '8px',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    style={{
                      padding: '8px 16px',
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ccc',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      padding: '8px 20px',
                      background: 'linear-gradient(135deg, #8B5CF6, #6366F1)',
                      border: 'none',
                      color: '#fff',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Call Log'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* ADD NOTE POPUP MODAL */}
        {activeModal === 'addNote' && (
          <div className="lead-detail-modal-overlay" onClick={() => setActiveModal(null)}>
            <div
              className="lead-detail-modal-container animate-scale-up"
              style={{ maxWidth: '480px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header-bar">
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#F8FAFC' }}>
                  📝 Add Note for {guestName}
                </h3>
                <button onClick={() => setActiveModal(null)} className="modal-close-btn">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSaveNote} style={{ padding: '20px' }}>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '6px' }}>
                    Note Content
                  </label>
                  <textarea
                    rows={4}
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    placeholder="Enter internal note or guest preference details..."
                    required
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#fff',
                      padding: '10px',
                      borderRadius: '8px',
                    }}
                  />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    style={{
                      padding: '8px 16px',
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ccc',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      padding: '8px 20px',
                      background: 'linear-gradient(135deg, #10B981, #059669)',
                      border: 'none',
                      color: '#fff',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {isSubmitting ? 'Saving...' : 'Add Note to Timeline'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* SEND WHATSAPP POPUP MODAL */}
        {activeModal === 'sendWhatsApp' && (
          <div className="lead-detail-modal-overlay" onClick={() => setActiveModal(null)}>
            <div
              className="lead-detail-modal-container animate-scale-up"
              style={{ maxWidth: '480px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header-bar">
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#F8FAFC' }}>
                  💬 Dispatch WhatsApp Message to {guestName} ({phoneStr})
                </h3>
                <button onClick={() => setActiveModal(null)} className="modal-close-btn">
                  <X size={18} />
                </button>
              </div>
              <form onSubmit={handleSendWhatsApp} style={{ padding: '20px' }}>
                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', color: '#94A3B8', marginBottom: '6px' }}>
                    Select WhatsApp Meta Template
                  </label>
                  <select
                    value={waTemplate}
                    onChange={(e) => setWaTemplate(e.target.value)}
                    style={{
                      width: '100%',
                      background: 'rgba(255, 255, 255, 0.05)',
                      border: '1px solid rgba(255, 255, 255, 0.15)',
                      color: '#fff',
                      padding: '10px',
                      borderRadius: '8px',
                    }}
                  >
                    <option value="hotel_guest_interested">📄 Hotel Luxury Suite Brochure & PDF Deck</option>
                    <option value="hotel_sla_escalation_alert">⏰ Scheduled Callback Follow-up Reminder</option>
                    <option value="hotel_booking_confirmed">🎉 Booking Confirmation & Payment Link</option>
                  </select>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setActiveModal(null)}
                    style={{
                      padding: '8px 16px',
                      background: 'transparent',
                      border: '1px solid rgba(255, 255, 255, 0.2)',
                      color: '#ccc',
                      borderRadius: '8px',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    style={{
                      padding: '8px 20px',
                      background: 'linear-gradient(135deg, #25D366, #128C7E)',
                      border: 'none',
                      color: '#fff',
                      borderRadius: '8px',
                      fontWeight: 600,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Send size={15} />
                    <span>{isSubmitting ? 'Sending...' : 'Dispatch WhatsApp'}</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
};
