import React, { useState, useEffect, useRef } from 'react';
import {
  PhoneCall,
  PhoneOff,
  User,
  Phone,
  Mail,
  Calendar,
  Sparkles,
  DollarSign,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
  Clock,
  Send,
  Zap,
} from 'lucide-react';
import { api, UserProfile } from '../api';

interface CallingWorkspaceProps {
  user: UserProfile;
}

export const CallingWorkspace: React.FC<CallingWorkspaceProps> = ({ user }) => {
  const [queueData, setQueueData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isCallActive, setIsCallActive] = useState<boolean>(false);
  const [callSeconds, setCallSeconds] = useState<number>(0);
  const [isDispositionModalOpen, setIsDispositionModalOpen] = useState<boolean>(false);
  const [selectedOutcome, setSelectedOutcome] = useState<string>('interested');
  const [notes, setNotes] = useState<string>('');
  const [followupDateTime, setFollowupDateTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [lastDispatchedMessage, setLastDispatchedMessage] = useState<string | null>(null);

  const timerRef = useRef<any>(null);

  const fetchActiveQueue = async () => {
    setIsLoading(true);
    try {
      const data = await api.getActiveQueue();
      setQueueData(data);
    } catch (err) {
      console.error('Failed to load calling queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveQueue();
  }, []);

  // Timer for active call
  useEffect(() => {
    if (isCallActive) {
      timerRef.current = setInterval(() => {
        setCallSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isCallActive]);

  const handleStartCall = () => {
    setIsCallActive(true);
    setCallSeconds(0);
  };

  const handleEndCall = () => {
    setIsCallActive(false);
    setIsDispositionModalOpen(true);
  };

  const formatTimer = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, '0')}:${remainder.toString().padStart(2, '0')}`;
  };

  const handleSubmitDisposition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!queueData?.active_lead?.id) return;

    setIsSubmitting(true);
    try {
      const res = await api.submitDisposition({
        lead_id: queueData.active_lead.id,
        disposition: selectedOutcome,
        call_duration_seconds: Math.max(callSeconds, 15),
        notes: notes.trim() || 'Call disposition recorded.',
        followup_date_time: selectedOutcome === 'awaiting_followup' && followupDateTime ? followupDateTime : null,
      });

      if (res.whatsapp_dispatched) {
        setLastDispatchedMessage(`WhatsApp automated template dispatched to ${queueData.active_lead.phone}`);
        setTimeout(() => setLastDispatchedMessage(null), 5000);
      }

      setIsDispositionModalOpen(false);
      setNotes('');
      setFollowupDateTime('');
      setCallSeconds(0);

      // Immediately set next lead
      if (res.next_lead) {
        setQueueData({
          active_lead: res.next_lead,
          total_in_queue: res.remaining_in_queue,
        });
      } else {
        fetchActiveQueue();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to submit disposition');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeLead = queueData?.active_lead;

  return (
    <div className="dashboard-content-wrapper animate-fade-in">
      {/* Top Bar */}
      <div className="dashboard-top-bar">
        <div>
          <h1 className="dashboard-page-title">Calling Workspace & Queue</h1>
          <p className="dashboard-page-sub">
            One-by-one sequential lead engagement pipeline with automated WhatsApp trigger
          </p>
        </div>

        <div className="queue-counter-badge">
          <span>Pending in Calling Queue:</span>
          <strong>{queueData?.total_in_queue ?? 0} Leads</strong>
        </div>
      </div>

      {lastDispatchedMessage && (
        <div className="sla-toast-banner animate-fade-in" style={{ borderColor: 'rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.15)', color: '#6EE7B7' }}>
          <Zap size={18} />
          <span>{lastDispatchedMessage}</span>
        </div>
      )}

      {queueData?.reassigned_notice && (
        <div className="reassigned-alert-notice animate-fade-in">
          <AlertCircle size={20} color="#FBBF24" />
          <div>
            <strong>Reassigned Lead Notice:</strong>
            <p>{queueData.reassigned_notice}</p>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="lead-modal-loading" style={{ minHeight: '350px' }}>
          <div className="loading-spinner-gold" />
          <span>Loading sequential calling queue...</span>
        </div>
      ) : activeLead ? (
        <div className="calling-workspace-layout">
          {/* Main Active Lead Profile Card */}
          <div className="calling-lead-main-card">
            <div className="calling-card-top">
              <div className="guest-hero-avatar">
                <User size={36} color="#FFE58F" />
              </div>
              <div className="guest-hero-meta">
                <div className="guest-hero-name-row">
                  <h2>{activeLead.guest_name}</h2>
                  <span className={`priority-pill priority-${activeLead.priority}`}>
                    {activeLead.priority?.toUpperCase()} PRIORITY
                  </span>
                </div>
                <div className="guest-hero-phone">{activeLead.phone}</div>
                <div className="guest-channel-source">
                  Acquired via <strong>{activeLead.source?.toUpperCase()}</strong> &bull; Lead #{activeLead.id}
                </div>
              </div>
            </div>

            {/* Stay Details Grid */}
            <div className="calling-details-grid">
              <div className="calling-detail-item">
                <div className="calling-detail-label">
                  <Calendar size={14} /> <span>Stay / Travel Dates</span>
                </div>
                <div className="calling-detail-val">{activeLead.stay_dates || 'Dates not specified'}</div>
              </div>

              <div className="calling-detail-item">
                <div className="calling-detail-label">
                  <Sparkles size={14} /> <span>Room Preference</span>
                </div>
                <div className="calling-detail-val">{activeLead.room_type_preference || 'Standard Luxury Suite'}</div>
              </div>

              <div className="calling-detail-item">
                <div className="calling-detail-label">
                  <DollarSign size={14} /> <span>Budget Indication</span>
                </div>
                <div className="calling-detail-val">
                  {activeLead.budget ? `₹${Number(activeLead.budget).toLocaleString()}` : 'Flexible / Quoted'}
                </div>
              </div>

              <div className="calling-detail-item">
                <div className="calling-detail-label">
                  <Clock size={14} /> <span>Assigned Support Agent</span>
                </div>
                <div className="calling-detail-val">{activeLead.assigned_to_name || user.username}</div>
              </div>
            </div>

            {/* Inquiry Details / Notes */}
            {activeLead.inquiry_details && (
              <div className="calling-inquiry-box">
                <div className="calling-inquiry-title">Inquiry Details & Guest Preferences:</div>
                <p>{activeLead.inquiry_details}</p>
              </div>
            )}

            {/* Live Call Control Panel */}
            <div className="calling-call-control-panel">
              <div className="live-call-timer-box">
                <div className={`call-pulsing-dot ${isCallActive ? 'pulsing' : ''}`} />
                <span className="timer-text">{formatTimer(callSeconds)}</span>
                <span className="timer-status-text">
                  {isCallActive ? 'Call in progress...' : 'Ready to place call'}
                </span>
              </div>

              <div className="calling-action-buttons">
                {!isCallActive ? (
                  <button onClick={handleStartCall} className="btn-start-call">
                    <PhoneCall size={20} />
                    <span>Start Call with Guest</span>
                  </button>
                ) : (
                  <button onClick={handleEndCall} className="btn-end-call">
                    <PhoneOff size={20} />
                    <span>End Call & Log Disposition</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="dashboard-panel-card empty-queue-card">
          <CheckCircle2 size={54} color="#10B981" />
          <h2>All Caught Up!</h2>
          <p>There are no more leads pending in your sequential calling queue right now.</p>
          <button onClick={() => fetchActiveQueue()} className="btn-quick-action btn-gold-action" style={{ marginTop: '16px' }}>
            Check for New Inquiries
          </button>
        </div>
      )}

      {/* 6-OUTCOME POST-CALL DISPOSITION MODAL */}
      {isDispositionModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card disposition-modal-card animate-fade-in">
            <div className="modal-header">
              <div className="modal-title-wrapper">
                <div className="modal-icon-crown">
                  <PhoneCall size={20} />
                </div>
                <div>
                  <h3>Post-Call Disposition & WhatsApp Dispatch</h3>
                  <p>Guest: {activeLead?.guest_name} &bull; Call Duration: {formatTimer(callSeconds)}</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitDisposition} className="modal-body-form">
              <div className="form-field">
                <label>Select Call Outcome (6-Stage Disposition):</label>
                <div className="disposition-outcomes-grid">
                  {[
                    { key: 'interested', label: '1. Interested', icon: '🌟', sub: 'Sends Booking Proposal' },
                    { key: 'awaiting_followup', label: '2. Awaiting Follow-up', icon: '📅', sub: 'Sends Scheduled Reminder' },
                    { key: 'completed_followup', label: '3. Completed Follow-up', icon: '✅', sub: 'Sends Follow-up Done' },
                    { key: 'registered', label: '4. Registered / Confirmed', icon: '👑', sub: 'Sends Confirmation' },
                    { key: 'not_interested', label: '5. Not Interested', icon: '✋', sub: 'Sends Polite Ack' },
                    { key: 'lost', label: '6. Lost', icon: '❌', sub: 'Archives lead' },
                  ].map((item) => (
                    <button
                      type="button"
                      key={item.key}
                      onClick={() => setSelectedOutcome(item.key)}
                      className={`disposition-btn ${selectedOutcome === item.key ? 'selected' : ''}`}
                    >
                      <div className="disp-top">
                        <span className="disp-emoji">{item.icon}</span>
                        <span className="disp-label">{item.label}</span>
                      </div>
                      <span className="disp-sub">{item.sub}</span>
                    </button>
                  ))}
                </div>
              </div>

              {selectedOutcome === 'awaiting_followup' && (
                <div className="form-field animate-fade-in">
                  <label>Scheduled Follow-up Date & Time:</label>
                  <input
                    type="datetime-local"
                    value={followupDateTime}
                    onChange={(e) => setFollowupDateTime(e.target.value)}
                    className="field-select"
                    required
                  />
                </div>
              )}

              <div className="form-field">
                <label>Call Notes & Discussion Summary:</label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Key discussion points, specific guest requirements, special rates promised..."
                  className="field-textarea"
                />
              </div>

              <div className="whatsapp-auto-badge">
                <MessageSquare size={16} color="#10B981" />
                <span>
                  Outcome template will automatically be dispatched via WhatsApp to <strong>{activeLead?.phone}</strong>
                </span>
              </div>

              <div className="modal-footer-actions">
                <button
                  type="button"
                  onClick={() => setIsDispositionModalOpen(false)}
                  className="btn-cancel"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-submit-lead"
                >
                  <Send size={15} />
                  <span>{isSubmitting ? 'Submitting & Dispatching...' : 'Submit & Next Lead'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
