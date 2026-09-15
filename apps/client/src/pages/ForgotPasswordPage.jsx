import React, { useState, useEffect } from 'react';
import {
  Building2, Eye, EyeOff, AlertCircle, Loader2, ArrowRight,
  Sun, Moon, CheckCircle2, KeyRound, Mail, ArrowLeft, ShieldCheck,
} from 'lucide-react';
import { useTheme } from '../hooks/useTheme';
import { authApi } from '../services/api';

/* ──────────────────────────────────────────────
   Forgot Password View
   (step = 'request'): Enter email, receive link
────────────────────────────────────────────── */
function ForgotPasswordForm({ onNavigate, onEmailSent }) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [touched, setTouched] = useState(false);
  const [loading, setLoading] = useState(false);

  const validate = (v) => {
    if (!v.trim()) return 'Email address is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim())) return 'Enter a valid email address';
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setTouched(true);
    const err = validate(email);
    if (err) { setError(err); return; }
    setError('');
    setLoading(true);
    try {
      await authApi.forgotPassword(email.trim());
      onEmailSent(email.trim());
    } catch (err) {
      // Still show success to prevent enumeration
      onEmailSent(email.trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-indigo-400 mb-2">
          Account Recovery
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold font-grotesk text-slate-900 dark:text-white tracking-tight">
          Forgot Your Password?
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
          No worries — enter your registered email and we'll send you a secure reset link valid for 30 minutes.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <div>
          <label htmlFor="forgot-email" className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
            Email address
          </label>
          <div className="relative">
            <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              id="forgot-email"
              type="email"
              required
              disabled={loading}
              value={email}
              onChange={(e) => { setEmail(e.target.value); if (touched) setError(validate(e.target.value)); }}
              onBlur={() => { setTouched(true); setError(validate(email)); }}
              placeholder="name@example.com"
              className={`w-full pl-10 pr-4 py-3 bg-white dark:bg-[#0D111D] border ${
                touched && error
                  ? 'border-rose-500 focus:ring-rose-500'
                  : 'border-slate-300 dark:border-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15'
              } rounded-2xl text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none shadow-sm transition`}
            />
          </div>
          {touched && error && (
            <p className="text-[11px] text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3 h-3 shrink-0" />
              <span>{error}</span>
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-2xl font-grotesk font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.97] disabled:opacity-50 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all duration-150 mt-2 cursor-pointer"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /><span>Sending link...</span></>
          ) : (
            <><span>Send Reset Link</span><ArrowRight className="w-4 h-4" /></>
          )}
        </button>
      </form>

      <div className="pt-4 border-t border-slate-200/80 dark:border-slate-800/80 text-center">
        <button
          type="button"
          onClick={() => onNavigate('/login')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Sign In
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Email Sent Confirmation View
   (step = 'sent'): Show success message
────────────────────────────────────────────── */
function EmailSentView({ email, onNavigate }) {
  return (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
        <Mail className="w-8 h-8" />
      </div>
      <div>
        <h2 className="text-2xl font-bold font-grotesk text-slate-900 dark:text-white tracking-tight">
          Check Your Inbox
        </h2>
        <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
          We've sent a password reset link to{' '}
          <span className="font-semibold text-slate-900 dark:text-white">{email}</span>
          . The link expires in 30 minutes.
        </p>
      </div>
      <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 font-mono text-left">
        💡 Don't see it? Check your spam or junk folder.
      </div>
      <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 text-center">
        <button
          type="button"
          onClick={() => onNavigate('/login')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Return to Sign In
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Reset Password Form
   (step = 'reset'): Set new password with token
────────────────────────────────────────────── */
function ResetPasswordForm({ token, onNavigate }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({});
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validatePassword = (v) => {
    if (!v) return 'New password is required';
    if (v.length < 8) return 'Password must be at least 8 characters';
    if (!/\d/.test(v)) return 'Password must contain at least one number';
    return '';
  };

  const validateConfirm = (v) => {
    if (!v) return 'Please confirm your password';
    if (v !== newPassword) return 'Passwords do not match';
    return '';
  };

  const handleBlur = (field) => {
    setTouched((p) => ({ ...p, [field]: true }));
    if (field === 'newPassword') setErrors((p) => ({ ...p, newPassword: validatePassword(newPassword) }));
    if (field === 'confirm') setErrors((p) => ({ ...p, confirm: validateConfirm(confirm) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    const pwErr = validatePassword(newPassword);
    const cfErr = validateConfirm(confirm);
    if (pwErr || cfErr) {
      setErrors({ newPassword: pwErr, confirm: cfErr });
      setTouched({ newPassword: true, confirm: true });
      return;
    }
    setLoading(true);
    try {
      await authApi.resetPassword(token, newPassword);
      setSuccess(true);
      setTimeout(() => onNavigate('/login'), 3000);
    } catch (err) {
      setApiError(err.message || 'The reset link is invalid or has expired. Please request a new one.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div>
          <h2 className="text-2xl font-bold font-grotesk text-slate-900 dark:text-white tracking-tight">
            Password Reset!
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-2">
            Your password has been updated. Redirecting you to sign in…
          </p>
        </div>
        <div className="h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
          <div className="h-full bg-indigo-600 rounded-full animate-[progress_3s_linear]" style={{ width: '100%', animation: 'progress 3s linear forwards' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-[11px] font-mono font-bold uppercase tracking-widest text-indigo-400 mb-2">
          Set New Password
        </p>
        <h2 className="text-2xl sm:text-3xl font-bold font-grotesk text-slate-900 dark:text-white tracking-tight">
          Choose a New Password
        </h2>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 mt-2">
          Must be at least 8 characters and include at least one number.
        </p>
      </div>

      {apiError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-500" />
          <div>
            <span className="font-bold block">Reset Failed</span>
            <span>{apiError}</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {/* New Password */}
        <div>
          <label htmlFor="reset-new-password" className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
            New Password
          </label>
          <div className="relative">
            <input
              id="reset-new-password"
              type={showNew ? 'text' : 'password'}
              required
              disabled={loading}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (touched.newPassword) setErrors((p) => ({ ...p, newPassword: validatePassword(e.target.value) }));
              }}
              onBlur={() => handleBlur('newPassword')}
              placeholder="Enter new password"
              className={`w-full bg-white dark:bg-[#0D111D] border ${
                touched.newPassword && errors.newPassword
                  ? 'border-rose-500 focus:ring-rose-500'
                  : 'border-slate-300 dark:border-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15'
              } rounded-2xl pl-4 pr-11 py-3 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none shadow-sm transition`}
            />
            <button type="button" onClick={() => setShowNew(!showNew)}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 dark:hover:text-white active:scale-95 transition-all p-0.5">
              {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {touched.newPassword && errors.newPassword && (
            <p className="text-[11px] text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3 h-3 shrink-0" /><span>{errors.newPassword}</span>
            </p>
          )}
        </div>

        {/* Confirm */}
        <div>
          <label htmlFor="reset-confirm-password" className="text-xs font-semibold text-slate-800 dark:text-slate-200 mb-1.5 block">
            Confirm New Password
          </label>
          <div className="relative">
            <input
              id="reset-confirm-password"
              type={showConfirm ? 'text' : 'password'}
              required
              disabled={loading}
              value={confirm}
              onChange={(e) => {
                setConfirm(e.target.value);
                if (touched.confirm) setErrors((p) => ({ ...p, confirm: e.target.value !== newPassword ? 'Passwords do not match' : '' }));
              }}
              onBlur={() => handleBlur('confirm')}
              placeholder="Re-enter new password"
              className={`w-full bg-white dark:bg-[#0D111D] border ${
                touched.confirm && errors.confirm
                  ? 'border-rose-500 focus:ring-rose-500'
                  : 'border-slate-300 dark:border-slate-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/15'
              } rounded-2xl pl-4 pr-11 py-3 text-xs sm:text-sm text-slate-900 dark:text-white focus:outline-none shadow-sm transition`}
            />
            <button type="button" onClick={() => setShowConfirm(!showConfirm)}
              className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-700 dark:hover:text-white active:scale-95 transition-all p-0.5">
              {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {touched.confirm && errors.confirm && (
            <p className="text-[11px] text-rose-500 mt-1.5 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3 h-3 shrink-0" /><span>{errors.confirm}</span>
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3.5 px-4 rounded-2xl font-grotesk font-bold text-sm text-white bg-indigo-600 hover:bg-indigo-500 active:scale-[0.97] disabled:opacity-50 shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all duration-150 mt-2 cursor-pointer"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /><span>Resetting...</span></>
          ) : (
            <><ShieldCheck className="w-4 h-4" /><span>Reset Password</span></>
          )}
        </button>
      </form>

      <div className="pt-2 border-t border-slate-200/80 dark:border-slate-800/80 text-center">
        <button
          type="button"
          onClick={() => onNavigate('/forgot-password')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition font-medium"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Request a new link
        </button>
      </div>
    </div>
  );
}

/* ──────────────────────────────────────────────
   Page Shell
   Routes between request / sent / reset views
────────────────────────────────────────────── */
export const ForgotPasswordPage = ({ onNavigate = () => {} }) => {
  const { theme, toggleTheme } = useTheme();

  // Read ?token= query param to determine which view to show
  const token = new URLSearchParams(window.location.search).get('token');
  const [step, setStep] = useState(token ? 'reset' : 'request');
  const [sentEmail, setSentEmail] = useState('');

  useEffect(() => {
    if (token && step !== 'reset') setStep('reset');
  }, [token]);

  const handleEmailSent = (email) => {
    setSentEmail(email);
    setStep('sent');
  };

  const leftPanel = {
    request: {
      icon: <KeyRound className="w-7 h-7" />,
      title: 'Account Recovery.',
      body: 'Enter your registered email and we\'ll send a secure one-time reset link to your inbox.',
    },
    sent: {
      icon: <Mail className="w-7 h-7" />,
      title: 'Email Sent.',
      body: 'A time-limited password reset link has been dispatched to your email. Check your inbox and spam folder.',
    },
    reset: {
      icon: <ShieldCheck className="w-7 h-7" />,
      title: 'Secure Reset.',
      body: 'You\'re one step away from regaining access. Set a strong new password to protect your account.',
    },
  }[step];

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row bg-slate-50 dark:bg-[#070A12] text-slate-900 dark:text-slate-100 font-sans selection:bg-indigo-600/30 selection:text-indigo-300">

      {/* LEFT PANEL */}
      <div className="w-full md:w-[45%] lg:w-[42%] min-h-[280px] md:min-h-screen bg-gradient-to-br from-indigo-950 via-slate-900 to-indigo-950 dark:from-[#090B18] dark:via-[#0C0F22] dark:to-[#05060E] p-6 sm:p-10 md:p-12 flex flex-col justify-between relative overflow-hidden border-b md:border-b-0 md:border-r border-slate-200/10 dark:border-white/[0.08]">

        <div className="absolute -top-32 -left-32 w-[480px] h-[480px] bg-indigo-600/15 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-[480px] h-[480px] bg-purple-600/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 flex items-center justify-between">
          <a href="/" onClick={(e) => { e.preventDefault(); onNavigate('/'); }}
            className="flex items-center gap-3 group focus:outline-none">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 font-bold group-hover:scale-105 transition-transform duration-200 ease-out">
              <Building2 className="w-5 h-5" />
            </div>
            <span className="font-grotesk font-extrabold text-xl tracking-tight text-white">
              JPTL<span className="text-indigo-400">.SYSTEM</span>
            </span>
          </a>
          <button onClick={toggleTheme} aria-label="Toggle Theme"
            className="p-2.5 rounded-2xl bg-white/10 hover:bg-white/15 active:scale-95 text-white border border-white/15 backdrop-blur-xl transition-all duration-150 ease-out focus:outline-none focus:ring-2 focus:ring-indigo-400 shadow-sm">
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-200" />}
          </button>
        </div>

        <div className="relative z-10 my-10 md:my-auto space-y-6">
          <div className="w-14 h-14 rounded-2xl bg-white/[0.06] text-indigo-300 border border-white/10 flex items-center justify-center backdrop-blur-xl shadow-2xl">
            {leftPanel.icon}
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold font-grotesk text-white leading-[1.08] tracking-[-0.03em]">
            {leftPanel.title}
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-md leading-relaxed font-sans font-normal">
            {leftPanel.body}
          </p>

          <div className="flex items-center gap-3 pt-2">
            {['request', 'sent', 'reset'].map((s) => (
              <div
                key={s}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === s ? 'w-8 bg-indigo-400' : 'w-3 bg-white/20'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="relative z-10 text-xs text-slate-400 font-mono tracking-wide">
          JPTL Unified Portal &bull; Secure Account Recovery
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col justify-center p-6 sm:p-10 md:p-14 lg:p-16 max-w-xl mx-auto w-full">
        {step === 'request' && (
          <ForgotPasswordForm onNavigate={onNavigate} onEmailSent={handleEmailSent} />
        )}
        {step === 'sent' && (
          <EmailSentView email={sentEmail} onNavigate={onNavigate} />
        )}
        {step === 'reset' && (
          <ResetPasswordForm token={token} onNavigate={onNavigate} />
        )}
      </div>

    </div>
  );
};
