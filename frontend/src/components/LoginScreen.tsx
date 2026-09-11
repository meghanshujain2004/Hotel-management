import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, AlertCircle, LogOut, ChevronRight, Crown } from 'lucide-react';
import { api, UserProfile } from '../api';

interface LoginScreenProps {
  onLoginSuccess?: (user: UserProfile) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return api.getSavedUser() as UserProfile | null;
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError('Please enter both your work email/username and password.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { profile } = await api.login(username, password);
      setCurrentUser(profile);
      if (onLoginSuccess) {
        onLoginSuccess(profile);
      }
    } catch (err: any) {
      setError(err.message || 'Invalid email or password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    api.clearAuth();
    setCurrentUser(null);
    setUsername('');
    setPassword('');
  };

  return (
    <div className="login-page-container">
      {/* LEFT PANEL: High-res Luxury Hotel Lobby with Bottom Overlay */}
      <div className="login-hero-panel">
        <div
          className="login-hero-bg"
          style={{ backgroundImage: `url('/luxury_hotel_hero.jpg')` }}
        />
        <div className="login-hero-overlay" />

        <div className="hero-bottom-content">
          <h1 className="hero-main-heading">
            Manage Your Hotel<br />Leads Smarter
          </h1>
          <p className="hero-tags">Efficiency • Analytics • Guest Experience</p>
        </div>
      </div>

      {/* RIGHT PANEL: Dark Background with Minimalist Frosted Glass Login Card */}
      <div className="login-form-panel">
        <div className="login-glass-card animate-fade-in">
          {currentUser ? (
            /* Authenticated Session View */
            <div className="authenticated-card">
              <div className="user-avatar-large">
                {currentUser.username.charAt(0).toUpperCase()}
              </div>

              <h2 className="card-title">Welcome, {currentUser.username}</h2>
              <div className={`role-badge-pill role-badge-${currentUser.role}`}>
                <Crown size={14} />
                <span>{currentUser.role} Role</span>
              </div>

              <p className="card-subtitle" style={{ marginBottom: '24px' }}>
                You are securely authenticated in the HotelCRM system.
              </p>

              <div className="portal-nav-grid">
                <div className="portal-nav-btn">
                  <span>Executive Dashboard</span>
                  <ChevronRight size={18} />
                </div>
                <div className="portal-nav-btn">
                  <span>Calling Workspace & Queue</span>
                  <ChevronRight size={18} />
                </div>
                <div className="portal-nav-btn">
                  <span>SLA Escalation Monitoring</span>
                  <ChevronRight size={18} />
                </div>
              </div>

              <button onClick={handleLogout} className="btn-signout">
                <LogOut size={16} />
                <span>Sign Out of Session</span>
              </button>
            </div>
          ) : (
            /* Login Form */
            <>
              {/* Crown Icon */}
              <div className="card-crown-header">
                <svg width="76" height="54" viewBox="0 0 54 38" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M8 32H46" stroke="#E5C378" strokeWidth="3" strokeLinecap="round" />
                  <path d="M9 26L13 11L27 20L41 11L45 26H9Z" stroke="#E5C378" strokeWidth="2.8" strokeLinejoin="round" fill="none" />
                  <path d="M13 11L27 5L41 11" stroke="#E5C378" strokeWidth="2.8" strokeLinejoin="round" strokeLinecap="round" />
                </svg>
              </div>

              <h2 className="login-card-title">Crm-Login</h2>

              {error && (
                <div className="alert-error">
                  <AlertCircle size={22} />
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="login-form">
                {/* Work Email / Username Input */}
                <div className="input-group">
                  <label className="input-label" htmlFor="username">
                    Email-Address
                  </label>
                  <div className="input-underline-wrapper">
                    <Mail size={24} className="input-icon" />
                    <input
                      id="username"
                      type="text"
                      className="underline-input"
                      placeholder="name@workemail.com"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div className="input-group">
                  <label className="input-label" htmlFor="password">
                    Password
                  </label>
                  <div className="input-underline-wrapper">
                    <Lock size={24} className="input-icon" />
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      className="underline-input"
                      placeholder="••••••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle-btn"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                    </button>
                  </div>
                </div>

                {/* Blue-to-Purple Pill CTA */}
                <button
                  type="submit"
                  className="btn-pill-gradient"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing In...' : 'Sign In to Dashboard'}
                </button>

                {/* Forgot Password Link */}
                <div className="forgot-password-container">
                  <a
                    href="#forgot"
                    className="forgot-password-link"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Please contact your Hotel Administrator to reset your credentials.');
                    }}
                  >
                    Forgot Password?
                  </a>
                </div>
              </form>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="login-page-footer">
          Powered by HotelCRM System 2026 | Privacy Policy | Terms of Service
        </div>
      </div>
    </div>
  );
};
