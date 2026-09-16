import React, { useEffect } from 'react';
import { 
  X, Sun, Moon, LogOut, ChevronRight, User, ShieldCheck, 
  Settings, Megaphone, FileCheck, HelpCircle 
} from 'lucide-react';

export const MobileNavDrawer = ({
  isOpen,
  onClose,
  user,
  roleTitle = 'Resident',
  metaInfo = '',
  items = [],
  activeKey,
  onSelect,
  onLogout,
  theme,
  toggleTheme,
}) => {
  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const displayName = user?.name || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';
  const email = user?.email || '';
  const initials = displayName.split(' ').map((n) => n[0]).join('').slice(0, 2) || 'U';

  return (
    <div className="fixed inset-0 z-50 md:hidden flex flex-col justify-end">
      {/* ─── BACKDROP ─── */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-200"
        aria-hidden="true"
      />

      {/* ─── BOTTOM SHEET CONTAINER ─── */}
      <div
        className="relative z-10 w-full max-h-[85vh] bg-white dark:bg-[#0E121E] border-t border-slate-200 dark:border-slate-800 rounded-t-3xl shadow-2xl overflow-hidden flex flex-col bottom-sheet-enter"
        style={{
          boxShadow: '0 -10px 40px -10px rgba(0,0,0,0.3)',
        }}
      >
        {/* ─── DRAG HANDLE PILL ─── */}
        <div className="pt-3 pb-1 flex justify-center shrink-0">
          <div className="w-12 h-1.5 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* ─── DRAWER HEADER ─── */}
        <div className="px-5 py-3 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center text-sm font-extrabold font-grotesk overflow-hidden shadow-md shadow-indigo-600/30">
              {user?.avatarUrl ? (
                <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="overflow-hidden">
              <h3 className="text-sm font-bold font-grotesk text-slate-900 dark:text-white truncate">
                {displayName}
              </h3>
              <p className="text-[11px] font-mono text-indigo-600 dark:text-indigo-400 truncate">
                {roleTitle} {metaInfo ? `• ${metaInfo}` : ''}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white btn-press shrink-0"
            aria-label="Close sheet"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ─── SCROLLABLE MENU ITEMS ─── */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeKey === item.key;

            return (
              <button
                key={item.key}
                onClick={() => {
                  onSelect(item.key);
                  onClose();
                }}
                className={`
                  w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold
                  transition-all duration-150 active:scale-98 select-none btn-press
                  ${isActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span className="font-grotesk text-sm">{item.label}</span>
                </div>

                <div className="flex items-center gap-2">
                  {item.badge && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold font-mono bg-indigo-500/20 text-indigo-400">
                      {item.badge}
                    </span>
                  )}
                  <ChevronRight className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* ─── FOOTER CONTROLS ─── */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2 bg-slate-50/50 dark:bg-[#0A0D16] pb-[max(env(safe-area-inset-bottom,0px),16px)]">
          {/* Quick Theme Toggle */}
          <div className="flex items-center justify-between px-3.5 py-2.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800">
            <span className="text-xs font-semibold font-grotesk text-slate-700 dark:text-slate-300 flex items-center gap-2">
              {theme === 'dark' ? <Moon className="w-4 h-4 text-indigo-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              Appearance
            </span>
            <button
              onClick={toggleTheme}
              className="px-3 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-mono font-bold text-slate-700 dark:text-slate-200 btn-press"
            >
              {theme === 'dark' ? 'Dark' : 'Light'}
            </button>
          </div>

          {/* Log Out */}
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 font-grotesk font-bold text-xs btn-press transition-all"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default MobileNavDrawer;
