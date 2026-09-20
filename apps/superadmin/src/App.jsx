import React, { useState, useEffect, lazy, Suspense } from 'react';
import { clearAuthSession, logoutSuperadmin } from './services/superadminApi';
import { DashboardSkeleton } from './components/ui/SkeletonLoader';

const SuperadminLoginPage = lazy(() => import('./pages/SuperadminLoginPage').then(m => ({ default: m.SuperadminLoginPage })));
const SuperadminPortalPage = lazy(() => import('./pages/SuperadminPortalPage').then(m => ({ default: m.SuperadminPortalPage })));

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

  return (
    <Suspense fallback={<div className="p-8 min-h-screen bg-[#050811] text-slate-100"><DashboardSkeleton /></div>}>
      {!isAuthenticated ? (
        <SuperadminLoginPage
          onLoginSuccess={() => setIsAuthenticated(true)}
        />
      ) : (
        <SuperadminPortalPage
          onLogout={async () => {
            await logoutSuperadmin();
            setIsAuthenticated(false);
          }}
        />
      )}
    </Suspense>
  );
}

export default App;
