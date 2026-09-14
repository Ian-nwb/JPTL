import React, { useState } from 'react';
import { ShieldCheck, Lock, Mail, Sparkles, ArrowRight, ShieldAlert } from 'lucide-react';
import { loginSuperadmin } from '../services/superadminApi';

export const SuperadminLoginPage = ({ onLoginSuccess = () => {} }) => {
  const [email, setEmail] = useState('superadmin@jptl.sys');
  const [password, setPassword] = useState('admin123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please provide email and password.');
      return;
    }

    setLoading(true);

    try {
      await loginSuperadmin({
        email: email.trim(),
        password: password.trim(),
      });
      onLoginSuccess();
    } catch (err) {
      setError(err.message || 'Authentication failed. Please verify your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050811] text-slate-100 font-sans flex items-center justify-center p-4 selection:bg-indigo-600/30 selection:text-indigo-300">
      
      {/* Background Cyber Grid Effects */}
      <div className="fixed inset-0 bg-[radial-gradient(#1E293B_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none" />
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative w-full max-w-md bg-[#0D111D]/90 border border-slate-800 rounded-3xl p-8 shadow-2xl backdrop-blur-xl space-y-6">
        
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 flex items-center justify-center mx-auto shadow-lg shadow-indigo-600/20">
            <ShieldCheck className="w-6 h-6" />
          </div>

          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-mono font-bold uppercase tracking-wider">
            <span>Root System Access</span>
          </div>

          <h1 className="text-2xl font-extrabold font-grotesk tracking-tight text-white">
            JPTL<span className="text-indigo-500">.SUPERADMIN</span>
          </h1>
          <p className="text-xs text-slate-400 font-sans">
            Platform Security & Infrastructure Command Gateway
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-mono flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-4 font-mono text-xs">
          
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 block font-semibold">Superadmin Account Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="superadmin@jptl.sys"
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#070A12] border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 block font-semibold">Master Access Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#070A12] border border-slate-800 text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-grotesk text-xs flex items-center justify-center gap-2 btn-press shadow-lg shadow-indigo-600/30 transition-all mt-2 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span>Authenticating Credentials…</span>
            ) : (
              <>
                <span>Authenticate & Access Command Center</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Quick Credentials Auto-Fill Button */}
        <div className="pt-2 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={() => {
              setEmail('superadmin@jptl.sys');
              setPassword('admin123');
            }}
            className="text-[11px] font-mono text-indigo-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-indigo-400" /> Auto-Fill Default Superadmin Credentials
          </button>
        </div>

        {/* Footer info */}
        <div className="text-center text-[10px] font-mono text-slate-500">
          <span>JPTL System Infrastructure v4.2.0 &bull; TLS 1.3 Strict Access</span>
        </div>

      </div>
    </div>
  );
};
export default SuperadminLoginPage;
