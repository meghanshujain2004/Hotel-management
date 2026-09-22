import React, { useState, useEffect } from 'react';
import { X, UserPlus, Phone, Mail, User, Layers, AlertCircle, Check } from 'lucide-react';
import { api } from '../api';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated: () => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose, onLeadCreated }) => {
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('+91');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState('instagram');
  const [priority, setPriority] = useState('medium');
  const [inquiryDetails, setInquiryDetails] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [staffList, setStaffList] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      api.getStaffUsers().then((users) => {
        setStaffList(users.filter((u: any) => u.role === 'support'));
      }).catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !phone.trim()) {
      setError('Please provide guest name and phone number.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await api.createLead({
        guest_name: guestName,
        phone,
        email: email || null,
        source,
        priority,
        inquiry_details: inquiryDetails,
        assigned_to: assignedTo ? parseInt(assignedTo) : null,
      });

      onLeadCreated();
      onClose();
      // Reset form
      setGuestName('');
      setPhone('+91');
      setEmail('');
      setInquiryDetails('');
      setAssignedTo('');
    } catch (err: any) {
      setError(err.message || 'Failed to create lead.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="add-lead-modal-overlay animate-fade-in">
      <div className="add-lead-modal-card">
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <div className="modal-icon-crown">
              <UserPlus size={20} />
            </div>
            <div>
              <h3>Add New Hotel Lead</h3>
              <p>Ingest a new guest inquiry into the sales pipeline</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="alert-error" style={{ margin: '16px 24px 0 24px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-body-form">
          <div className="form-grid-2">
            <div className="form-field">
              <label>Guest Full Name *</label>
              <div className="field-input-box">
                <User size={16} className="field-icon" />
                <input
                  type="text"
                  placeholder="e.g. Aarav Mehta"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label>Mobile Number (+91) *</label>
              <div className="field-input-box">
                <Phone size={16} className="field-icon" />
                <input
                  type="tel"
                  placeholder="+91 98765 43210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </div>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label>Work / Personal Email</label>
              <div className="field-input-box">
                <Mail size={16} className="field-icon" />
                <input
                  type="email"
                  placeholder="guest@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="form-field">
              <label>Lead Source</label>
              <select value={source} onChange={(e) => setSource(e.target.value)} className="field-select">
                <option value="instagram">Instagram Lead Ads</option>
                <option value="whatsapp">WhatsApp Business</option>
                <option value="facebook">Facebook Ads</option>
                <option value="website">Website Form</option>
                <option value="manual">Manual Entry</option>
              </select>
            </div>
          </div>

          <div className="form-grid-2">
            <div className="form-field">
              <label>Priority Level</label>
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="field-select">
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent (VIP Lead)</option>
              </select>
            </div>

            <div className="form-field">
              <label>Assign Support Agent</label>
              <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="field-select">
                <option value="">-- Auto Sequential Queue --</option>
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    🎧 {s.username} ({s.email || 'Support'})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-field">
            <label>Stay & Inquiry Details</label>
            <textarea
              rows={3}
              className="field-textarea"
              placeholder="e.g. Presidential Suite 4 Nights, Anniversary celebration, budget ₹2,50,000"
              value={inquiryDetails}
              onChange={(e) => setInquiryDetails(e.target.value)}
            />
          </div>

          <div className="modal-footer-actions">
            <button type="button" onClick={onClose} className="btn-cancel">
              Cancel
            </button>
            <button type="submit" className="btn-submit-lead" disabled={isLoading}>
              {isLoading ? 'Creating Lead...' : 'Add Lead to Pipeline'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
