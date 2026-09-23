import React, { useState, useEffect } from 'react';
import { X, UserPlus, Phone, Mail, User, Layers, AlertCircle, Check, FileSpreadsheet, UploadCloud, FileText, CheckCircle } from 'lucide-react';
import { api } from '../api';

interface AddLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLeadCreated: () => void;
}

export const AddLeadModal: React.FC<AddLeadModalProps> = ({ isOpen, onClose, onLeadCreated }) => {
  const [activeTab, setActiveTab] = useState<'manual' | 'excel'>('manual');
  
  // Manual Form States
  const [guestName, setGuestName] = useState('');
  const [phone, setPhone] = useState('+91');
  const [email, setEmail] = useState('');
  const [source, setSource] = useState('instagram');
  const [priority, setPriority] = useState('medium');
  const [inquiryDetails, setInquiryDetails] = useState('');
  const [assignedTo, setAssignedTo] = useState('');
  const [staffList, setStaffList] = useState<any[]>([]);
  
  // Excel Upload States
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploadResult, setUploadResult] = useState<{ message: string; imported_count: number; skipped_errors: string[] } | null>(null);

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

  const handleManualSubmit = async (e: React.FormEvent) => {
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

  const handleExcelUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select an Excel or CSV file to upload.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setUploadResult(null);

    try {
      const res = await api.uploadLeadExcel(selectedFile);
      setUploadResult(res);
      onLeadCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to upload Excel file.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setError(null);
      setUploadResult(null);
    }
  };

  return (
    <div className="add-lead-modal-overlay animate-fade-in">
      <div className="add-lead-modal-card" style={{ maxWidth: '620px', width: '92%' }}>
        {/* Header */}
        <div className="modal-header">
          <div className="modal-title-wrapper">
            <div className="modal-icon-crown">
              {activeTab === 'manual' ? <UserPlus size={20} /> : <FileSpreadsheet size={20} />}
            </div>
            <div>
              <h3>Add New Hotel Leads</h3>
              <p>Ingest guest inquiries via Manual Form or Excel / CSV Upload</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
            <X size={20} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div style={{ display: 'flex', gap: '10px', padding: '16px 24px 0 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <button
            type="button"
            onClick={() => { setActiveTab('manual'); setError(null); }}
            style={{
              padding: '10px 16px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: activeTab === 'manual' ? 'rgba(139, 92, 246, 0.2)' : 'transparent',
              borderBottom: activeTab === 'manual' ? '2px solid #8B5CF6' : '2px solid transparent',
              color: activeTab === 'manual' ? '#A78BFA' : '#94A3B8',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <UserPlus size={16} />
            <span>Single Entry Form</span>
          </button>

          <button
            type="button"
            onClick={() => { setActiveTab('excel'); setError(null); }}
            style={{
              padding: '10px 16px',
              borderRadius: '8px 8px 0 0',
              border: 'none',
              background: activeTab === 'excel' ? 'rgba(245, 158, 11, 0.2)' : 'transparent',
              borderBottom: activeTab === 'excel' ? '2px solid #F59E0B' : '2px solid transparent',
              color: activeTab === 'excel' ? '#FBBF24' : '#94A3B8',
              fontWeight: 600,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <FileSpreadsheet size={16} />
            <span>Bulk Upload Excel / CSV</span>
          </button>
        </div>

        {error && (
          <div className="alert-error" style={{ margin: '16px 24px 0 24px' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* TAB 1: MANUAL SINGLE ENTRY FORM */}
        {activeTab === 'manual' ? (
          <form onSubmit={handleManualSubmit} className="modal-body-form">
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
        ) : (
          /* TAB 2: BULK EXCEL / CSV UPLOAD */
          <form onSubmit={handleExcelUpload} style={{ padding: '24px' }}>
            <div
              style={{
                border: '2px dashed rgba(245, 158, 11, 0.4)',
                background: 'rgba(245, 158, 11, 0.05)',
                borderRadius: '12px',
                padding: '30px',
                textAlign: 'center',
                cursor: 'pointer',
                position: 'relative',
              }}
            >
              <input
                type="file"
                accept=".xlsx, .xls, .xlsm, .csv"
                onChange={handleFileChange}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'pointer',
                }}
              />
              <UploadCloud size={44} color="#FBBF24" style={{ marginBottom: '12px' }} />
              <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 600, color: '#FCD34D' }}>
                {selectedFile ? selectedFile.name : 'Drag & drop Excel or CSV file here'}
              </h4>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.85rem', color: '#9CA3AF' }}>
                {selectedFile
                  ? `Selected: ${(selectedFile.size / 1024).toFixed(1)} KB`
                  : 'Supports .xlsx, .xls, .xlsm, or .csv files'}
              </p>
            </div>

            {/* Template Column Instructions */}
            <div
              style={{
                margin: '16px 0',
                padding: '12px 16px',
                background: 'rgba(255, 255, 255, 0.03)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.08)',
              }}
            >
              <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '4px' }}>
                💡 Excel Column Header Format:
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94A3B8', fontFamily: 'monospace' }}>
                Guest Name | Phone | Email | Source | Priority | Inquiry Details
              </div>
            </div>

            {/* Upload Result Notification */}
            {uploadResult && (
              <div
                style={{
                  background: 'rgba(16, 185, 129, 0.15)',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  color: '#6EE7B7',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 700 }}>
                  <CheckCircle size={18} />
                  <span>{uploadResult.message}</span>
                </div>
                {uploadResult.skipped_errors && uploadResult.skipped_errors.length > 0 && (
                  <div style={{ marginTop: '8px', fontSize: '0.8rem', color: '#F87171' }}>
                    <strong>Skipped Rows ({uploadResult.skipped_errors.length}):</strong>
                    <ul style={{ margin: '4px 0 0 16px', padding: 0 }}>
                      {uploadResult.skipped_errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="modal-footer-actions" style={{ marginTop: '20px' }}>
              <button type="button" onClick={onClose} className="btn-cancel">
                Close
              </button>
              <button
                type="submit"
                disabled={isLoading || !selectedFile}
                className="btn-submit-lead"
                style={{
                  background: 'linear-gradient(135deg, #F59E0B, #D4AF37)',
                  color: '#000',
                  fontWeight: 700,
                  opacity: selectedFile ? 1 : 0.5,
                }}
              >
                {isLoading ? 'Importing Leads...' : 'Upload & Ingest Excel Leads'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
