import React, { useState, useEffect } from 'react';
import { SuperadminLoginPage } from './pages/SuperadminLoginPage';
import { SuperadminPortalPage } from './pages/SuperadminPortalPage';
import { clearAuthSession, logoutSuperadmin } from './services/superadminApi';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('jptl_superadmin_auth') === 'true';
  });

  useEffect(() => {
    const handleUnauthorized = () => {
      setIsAuthenticated(false);
    };

    window.addEventListener('superadmin-unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('superadmin-unauthorized', handleUnauthorized);
    };
  }, []);

  if (!isAuthenticated) {
    return (
      <SuperadminLoginPage
        onLoginSuccess={() => setIsAuthenticated(true)}
      />
    );
  }

  return (
    <SuperadminPortalPage
      onLogout={async () => {
        await logoutSuperadmin();
        setIsAuthenticated(false);
      }}
    />
  );
}

export default App;
