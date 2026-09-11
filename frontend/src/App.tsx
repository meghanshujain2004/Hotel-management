import React, { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { DashboardLayout } from './components/DashboardLayout';
import { api, UserProfile } from './api';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return api.getSavedUser() as UserProfile | null;
  });

  const handleLogout = () => {
    api.clearAuth();
    setCurrentUser(null);
  };

  return (
    <div className="app-root">
      {currentUser ? (
        <DashboardLayout user={currentUser} onLogout={handleLogout} />
      ) : (
        <LoginScreen onLoginSuccess={(loggedInUser) => setCurrentUser(loggedInUser)} />
      )}
    </div>
  );
};

export default App;
