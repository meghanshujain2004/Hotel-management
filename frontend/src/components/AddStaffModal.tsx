import React, { useState } from 'react';
import { X, UserPlus, Shield, Mail, Phone, Lock, User } from 'lucide-react';
import { api, UserProfile } from '../api';

interface AddStaffModalProps {
  isOpen: boolean;
  userRole: 'admin' | 'manager' | 'support';
  onClose: () => void;
  onStaffAdded: () => void;
}

export const AddStaffModal: React.FC<AddStaffModalProps> = ({
  isOpen,
  userRole,
  onClose,
  onStaffAdded,
}) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'support' | 'manager'>('support');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!username.trim() || !password.trim()) {
      setErrorMessage('Username and Password are required.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createStaff({
        username: username.trim(),
        email: email.trim(),
        phone: phone.trim(),
        role: userRole === 'manager' ? 'support' : role,
        password: password.trim(),
      });
      alert(`Staff member "${username}" added successfully!`);
      // Reset form
      setUsername('');
      setEmail('');
      setPhone('');
      setPassword('');
      setRole('support');
      onStaffAdded();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to add staff member.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="lead-detail-modal-overlay" onClick={onClose}>
      <div
        className="lead-detail-modal-container animate-scale-up"
        style={{ maxWidth: '520px', width: '92%' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="modal-header-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #D4AF37, #F59E0B)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000',
              }}
            >
              <UserPlus size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: '#FFF' }}>
                Add New Team Member
              </h2>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#9CA3AF' }}>
                Create credentials for Customer Support or Manager accounts
              </p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn">
            <X size={20} />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          {errorMessage && (
            <div
              style={{
                background: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.4)',
                color: '#F87171',
                padding: '10px 14px',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '16px',
              }}
            >
              ⚠️ {errorMessage}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Username */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                Username *
              </label>
              <div className="search-input-wrapper">
                <User size={16} color="#94A3B8" style={{ marginLeft: '12px' }} />
                <input
                  type="text"
                  placeholder="e.g. rahul_support"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="global-search-input"
                  style={{ width: '100%', paddingLeft: '38px' }}
                  required
                />
              </div>
            </div>

            {/* Role Selection */}
            {userRole === 'admin' ? (
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                  Role & Access Level *
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setRole('support')}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: role === 'support' ? '2px solid #8B5CF6' : '1px solid rgba(255,255,255,0.1)',
                      background: role === 'support' ? 'rgba(139, 92, 246, 0.2)' : 'rgba(255,255,255,0.03)',
                      color: role === 'support' ? '#A78BFA' : '#94A3B8',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                    }}
                  >
                    🎧 Support Agent
                  </button>

                  <button
                    type="button"
                    onClick={() => setRole('manager')}
                    style={{
                      padding: '10px',
                      borderRadius: '8px',
                      border: role === 'manager' ? '2px solid #F59E0B' : '1px solid rgba(255,255,255,0.1)',
                      background: role === 'manager' ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255,255,255,0.03)',
                      color: role === 'manager' ? '#FBBF24' : '#94A3B8',
                      cursor: 'pointer',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                    }}
                  >
                    👔 Manager
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                  Role
                </label>
                <div
                  style={{
                    padding: '10px 14px',
                    borderRadius: '8px',
                    background: 'rgba(139, 92, 246, 0.15)',
                    border: '1px solid rgba(139, 92, 246, 0.3)',
                    color: '#C4B5FD',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  🎧 Customer Support Agent
                </div>
              </div>
            )}

            {/* Email */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                Work Email (Optional)
              </label>
              <div className="search-input-wrapper">
                <Mail size={16} color="#94A3B8" style={{ marginLeft: '12px' }} />
                <input
                  type="email"
                  placeholder="e.g. rahul@hotel.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="global-search-input"
                  style={{ width: '100%', paddingLeft: '38px' }}
                />
              </div>
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                Phone Number (Optional)
              </label>
              <div className="search-input-wrapper">
                <Phone size={16} color="#94A3B8" style={{ marginLeft: '12px' }} />
                <input
                  type="text"
                  placeholder="+919800000000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="global-search-input"
                  style={{ width: '100%', paddingLeft: '38px' }}
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: '#CBD5E1', marginBottom: '6px' }}>
                Password *
              </label>
              <div className="search-input-wrapper">
                <Lock size={16} color="#94A3B8" style={{ marginLeft: '12px' }} />
                <input
                  type="password"
                  placeholder="Enter initial password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="global-search-input"
                  style={{ width: '100%', paddingLeft: '38px' }}
                  required
                />
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn-quick-action"
              style={{ background: 'rgba(255, 255, 255, 0.08)', color: '#CBD5E1' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-quick-action btn-gold-action"
              style={{ padding: '10px 20px' }}
            >
              {isSubmitting ? 'Creating User...' : '+ Create Team Member'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
