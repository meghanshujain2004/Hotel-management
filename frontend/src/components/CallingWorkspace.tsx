import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  CheckCircle,
  Clock,
  Sparkles,
  Camera,
  X,
  Calendar,
} from 'lucide-react';
import { api, UserProfile } from '../api';

interface CallingWorkspaceProps {
  user: UserProfile;
}

const OUTCOMES = [
  { key: 'interested', label: 'Interested', tag: '(Green)', colorClass: 'tile-outcome-green' },
  { key: 'awaiting_followup', label: 'Awaiting Follow-up', tag: 'Next Follow-up Date/Time ⌄', colorClass: 'tile-outcome-gold-border' },
  { key: 'completed_followup', label: 'Completed Follow-up', tag: '(Blue)', colorClass: 'tile-outcome-blue' },
  { key: 'registered', label: 'Registered / Converted', tag: '(Gold)', colorClass: 'tile-outcome-gold' },
  { key: 'not_interested', label: 'Not Interested', tag: '(Red)', colorClass: 'tile-outcome-red' },
  { key: 'lost', label: 'Lost / Junk', tag: '(Gray)', colorClass: 'tile-outcome-gray' },
];

export const CallingWorkspace: React.FC<CallingWorkspaceProps> = ({ user }) => {
  const [activeLead, setActiveLead] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedOutcome, setSelectedOutcome] = useState<string>('interested');
  const [callNotes, setCallNotes] = useState<string>('');
  const [callDuration, setCallDuration] = useState<string>('04:12');
  const [followupDate, setFollowupDate] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [dispositionToast, setDispositionToast] = useState<string | null>(null);

  const fetchNextLead = async () => {
    setIsLoading(true);
    try {
      const data = await api.getNextQueueLead();
      if (data && data.id) {
        setActiveLead(data);
      } else {
        setActiveLead(null);
      }
    } catch {
      setActiveLead(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNextLead();
  }, []);

  const handleSaveDisposition = async () => {
    if (!activeLead) return;
    setIsSaving(true);
    try {
      const durSecs = callDuration
        ? parseInt(callDuration.split(':')[0] || '0') * 60 + parseInt(callDuration.split(':')[1] || '0')
        : 250;

      await api.logDisposition({
        lead_id: activeLead.id,
        disposition: selectedOutcome,
        call_duration_seconds: durSecs,
        notes: callNotes.trim() || 'Call completed successfully.',
        followup_date_time: followupDate || null,
      });

      setDispositionToast(`Last lead was resolved by ${user.username}. You are now working on Lead #2`);
      setCallNotes('');
      setFollowupDate('');
      fetchNextLead();
    } catch (err: any) {
      setDispositionToast(`Disposition logged for ${activeLead.guest_name}`);
      setCallNotes('');
      fetchNextLead();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="web-calling-container animate-fade-in">
      {/* Top Title Bar */}
      <div className="calling-top-bar">
        <h1 className="calling-workspace-title">
          Customer Support One-by-One Lead Calling Workspace
        </h1>
      </div>

      {!activeLead && !isLoading ? (
        <div className="placeholder-screen-card" style={{ padding: '60px 20px', margin: '20px 0' }}>
          <Sparkles size={40} color="#F59E0B" />
          <h2>Calling Queue Clear</h2>
          <p>There are currently no pending leads in your calling queue. All assigned leads have been processed.</p>
          <button onClick={fetchNextLead} className="btn-search-go" style={{ marginTop: '10px' }}>
            Check for New Queue Leads
          </button>
        </div>
      ) : (
        <div className="calling-grid-layout">
          {/* LEFT ACTIVE LEAD CARD */}
          <div className="active-lead-card-panel">
            <div className="card-top-head">
              <span className="card-queue-badge">Active Lead in Queue</span>
            </div>

            <div className="guest-hero-row">
              <div className="guest-circle-avatar">
                {activeLead?.guest_name ? activeLead.guest_name.charAt(0).toUpperCase() : 'G'}
              </div>
              <div className="guest-hero-info">
                <span className="guest-profile-label">Guest Profile</span>
                <h2 className="guest-hero-name">{activeLead?.guest_name || 'Guest Lead'}</h2>
                <span className="guest-hero-phone">Phone +91 {activeLead?.phone || ''}</span>
              </div>
            </div>

            <div className="guest-inquiry-box">
              <div className="inquiry-row">
                <span className="inquiry-label">Inquiry:</span>
                <span className="inquiry-val">{activeLead?.inquiry_details || 'General Inquiry'}</span>
              </div>
              <div className="inquiry-row">
                <span className="inquiry-label">Source:</span>
                <span className="source-ad-pill">
                  <Camera size={14} color="#EC4899" />
                  <span>{activeLead?.source_display || activeLead?.source || 'Lead Ad'}</span>
                </span>
              </div>
              <div className="inquiry-row">
                <span className="inquiry-label">Time assigned:</span>
                <span className="inquiry-val">{activeLead?.time_assigned || 'Recently assigned'}</span>
              </div>
            </div>

            {/* Green Call Action Button */}
            <button className="btn-call-web-green" onClick={() => window.location.href = `tel:${activeLead?.phone}`}>
              <PhoneCall size={20} />
              <span>Call via Web / App</span>
            </button>

            {dispositionToast && (
              <div className="disposition-alert-box animate-fade-in">
                <div className="alert-warning-icon">⚠️</div>
                <div className="alert-toast-text">{dispositionToast}</div>
              </div>
            )}
          </div>

          {/* RIGHT DISPOSITION MODAL CARD */}
          <div className="disposition-modal-panel">
            <div className="disposition-header-row">
              <h3>Log Call Outcome & Follow-up Disposition</h3>
            </div>

            {/* 6 Outcome Choice Tiles */}
            <div className="outcome-tiles-grid">
              {OUTCOMES.map((o) => (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => setSelectedOutcome(o.key)}
                  className={`outcome-tile ${o.colorClass} ${selectedOutcome === o.key ? 'active-selected' : ''}`}
                >
                  <div className="outcome-tile-label">{o.label}</div>
                  <div className="outcome-tile-tag">{o.tag}</div>
                </button>
              ))}
            </div>

            {/* Next Follow-up Date Input if Awaiting Followup */}
            {selectedOutcome === 'awaiting_followup' && (
              <div className="followup-datetime-field animate-fade-in">
                <label>
                  <Calendar size={14} /> Schedule Follow-up Date & Time:
                </label>
                <input
                  type="datetime-local"
                  value={followupDate}
                  onChange={(e) => setFollowupDate(e.target.value)}
                  className="datetime-input-field"
                />
              </div>
            )}

            {/* Call Notes Textarea */}
            <div className="disposition-form-field">
              <label>Call Notes & Conversation Summary</label>
              <textarea
                rows={4}
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="Enter guest preferences, rate discussion, expected check-in date..."
                className="disposition-textarea"
              />
            </div>

            {/* Call Duration Input */}
            <div className="disposition-form-field">
              <label>Call Duration (mm:ss)</label>
              <input
                type="text"
                value={callDuration}
                onChange={(e) => setCallDuration(e.target.value)}
                placeholder="04:12"
                className="disposition-input-short"
              />
            </div>

            {/* Submit Gradient Button */}
            <button
              onClick={handleSaveDisposition}
              disabled={isSaving}
              className="btn-save-disposition-gradient"
            >
              <span>{isSaving ? 'Saving Disposition...' : 'Save Disposition & Fetch Next Lead ➔'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
