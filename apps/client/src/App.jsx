import React, { useState, useEffect, useCallback, Component } from 'react';
import { LandingPage } from './pages/LandingPage';
import { RegisterPage } from './pages/RegisterPage';
import { OnboardingPage } from './pages/OnboardingPage';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { TenantPortalPage } from './pages/TenantPortalPage';
import { AuthProvider, useAuth } from './context/AuthContext';

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

  const navigate = useCallback((path) => {
    window.history.pushState({}, '', path);
    setCurrentPath(path);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const handlePopState = () => setCurrentPath(window.location.pathname);
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
