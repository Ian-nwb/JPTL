import React, { useState, useEffect, useCallback, Component } from 'react';
import { LandingPage } from './pages/LandingPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TenantPortalPage } from './pages/TenantPortalPage';
import { AuthProvider, useAuth } from './context/AuthContext';
import { notificationApi, systemApi } from './services/api';

/* ─────────────────────────────────────────────
   Service Worker + Push Notification Registration
───────────────────────────────────────────── */
async function registerPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  try {
    // Register the service worker and check for updates immediately
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    try { await registration.update(); } catch (_) {}

    // Request permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return;

    // Get VAPID public key from server
    const keyRes = await notificationApi.getVapidKey();
    const vapidPublicKey = keyRes?.publicKey;
    if (!vapidPublicKey) return;

    // Convert VAPID key to Uint8Array
    const urlB64ToUint8Array = (base64String) => {
      const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
      const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      const rawData = window.atob(base64);
      return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
    };

    // Subscribe to push
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlB64ToUint8Array(vapidPublicKey),
    });

    // Send subscription to backend
    await notificationApi.subscribePush(subscription.toJSON());
  } catch (err) {
    // Non-fatal — push is optional enhancement
    console.warn('Push notification registration failed:', err.message);
  }
}

/* ─────────────────────────────────────────────
   Error Boundary
───────────────────────────────────────────── */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App ErrorBoundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white p-8 flex flex-col items-center justify-center space-y-4">
          <div className="p-6 max-w-xl w-full bg-slate-900 border border-rose-500/30 rounded-2xl space-y-3">
            <h2 className="text-xl font-bold text-rose-400 font-mono">⚠️ Runtime UI Error Detected</h2>
            <p className="text-xs text-slate-300 font-mono leading-relaxed">
              {this.state.error?.toString()}
            </p>
            <pre className="p-3 rounded-xl bg-black text-[10px] text-rose-300 font-mono overflow-x-auto max-h-48">
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.href = '/dashboard';
              }}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-mono text-xs"
            >
              Reload Dashboard View
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ─────────────────────────────────────────────
   Auth loading spinner
   Shown while AuthContext validates the saved
   sessionStorage token with GET /auth/me.
───────────────────────────────────────────── */
function AuthLoadingScreen() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-full border-4 border-indigo-600 border-t-transparent animate-spin" />
        <p className="text-slate-400 text-xs font-mono tracking-widest uppercase">Restoring session…</p>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────
   Main router — auth-aware, role-aware
───────────────────────────────────────────── */
function AppRouter() {
  const { user, loading, isAuthenticated } = useAuth();
  const [currentPath, setCurrentPath] = useState(window.location.pathname);
  const [maintenanceState, setMaintenanceState] = useState(null);

  const navigate = useCallback((path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Check system status on mount & listen to maintenance events
  useEffect(() => {
    systemApi.getStatus()
      .then((data) => {
        if (data?.maintenance) {
          setMaintenanceState(data.message || 'Platform is currently undergoing scheduled maintenance.');
        }
      })
      .catch(() => {});

    const handleMaintenance = (e) => {
      setMaintenanceState(e.detail?.message || 'Platform is currently undergoing scheduled maintenance.');
    };
    window.addEventListener('jptl-maintenance-active', handleMaintenance);
    return () => window.removeEventListener('jptl-maintenance-active', handleMaintenance);
  }, []);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Register push notifications once when user is authenticated
  useEffect(() => {
    if (isAuthenticated && user) {
      registerPushNotifications();
    }
  }, [isAuthenticated, user?.id]);

  // If maintenance mode is active, display lockdown screen regardless of cached session
  if (maintenanceState) {
    return (
      <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none font-sans">
        <div className="p-8 max-w-md w-full bg-[#0D111D] border border-amber-500/30 rounded-3xl space-y-5 shadow-2xl shadow-amber-500/10 backdrop-blur-xl">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/20">
            <svg className="w-8 h-8 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
              System Lockdown
            </span>
            <h1 className="text-xl font-extrabold font-grotesk tracking-tight text-white">
              Platform Maintenance Active
            </h1>
          </div>
          <p className="text-xs text-slate-400 font-mono leading-relaxed">
            {maintenanceState}
          </p>
          <div className="pt-2">
            <button
              onClick={() => window.location.reload()}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-mono text-xs font-bold transition btn-press cursor-pointer"
            >
              Check Again / Retry Connection
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Safe route guards in useEffect
  useEffect(() => {
    if (loading) return;
    const role = user?.role;

    if (!isAuthenticated) {
      if (currentPath !== '/login' && currentPath !== '/' && currentPath !== '/register') {
        window.history.replaceState({}, '', '/login');
        setCurrentPath('/login');
      }
      return;
    }

    // Authenticated
    if (currentPath === '/login' || currentPath === '/') {
      const target = role === 'tenant' ? '/tenant' : '/dashboard';
      window.history.replaceState({}, '', target);
      setCurrentPath(target);
      return;
    }

    if (role === 'tenant' && currentPath.startsWith('/dashboard')) {
      window.history.replaceState({}, '', '/tenant');
      setCurrentPath('/tenant');
      return;
    }

    if ((role === 'landlord' || role === 'superadmin') && currentPath.startsWith('/tenant')) {
      window.history.replaceState({}, '', '/dashboard');
      setCurrentPath('/dashboard');
    }
  }, [loading, isAuthenticated, user?.role, currentPath]);

  // 1. Validating session
  if (loading) return <AuthLoadingScreen />;

  // 2. Authenticated user transitioning away from /login or /
  if (isAuthenticated && (currentPath === '/login' || currentPath === '/')) {
    return <AuthLoadingScreen />;
  }

  // 3. Unauthenticated user on protected route
  if (!isAuthenticated && currentPath !== '/' && currentPath !== '/register') {
    return <LoginPage onNavigate={navigate} />;
  }

  // 4. Render matched route
  if (currentPath === '/register') return <RegisterPage onNavigate={navigate} />;
  if (currentPath === '/onboarding' || currentPath.startsWith('/onboarding')) return <OnboardingPage onNavigate={navigate} />;
  if (currentPath === '/login') return <LoginPage onNavigate={navigate} />;
  if (currentPath.startsWith('/tenant')) return <TenantPortalPage onNavigate={navigate} />;
  if (currentPath.startsWith('/dashboard')) return <DashboardPage onNavigate={navigate} />;

  return <LandingPage onNavigate={navigate} />;
}

/* ─────────────────────────────────────────────
   Root
───────────────────────────────────────────── */
function App() {
  return (
    <AuthProvider>
      <ErrorBoundary>
        <AppRouter />
      </ErrorBoundary>
    </AuthProvider>
  );
}

export default App;
