import React, { useState, useEffect } from 'react';
import { 
  Bell, CheckCircle2, Clock, AlertTriangle, ShieldAlert, X, Check, 
  Sparkles, Loader2, Trash2, Megaphone, Wrench, ArrowRight, ExternalLink 
} from 'lucide-react';
import { notificationApi } from '../../services/api';
import { useAuth } from '../../context/AuthContext';

export const RightNotificationSidebar = ({
  isOpen,
  onClose,
  onNavigate,
}) => {
  const { user } = useAuth();
  const isTenant = user?.role === 'tenant';

  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all'); // 'all' | 'announcement' | 'maintenance' | 'unread'

  const fetchNotifs = async () => {
    try {
      setLoading(true);
      const res = await notificationApi.getNotifications();
      const rawList = res.data || res.notifications || [];
      const formatted = rawList.map((n) => ({
        id: n._id || n.id,
        title: n.title,
        body: n.body,
        type: n.type || 'system',
        refModel: n.refModel,
        refId: n.refId,
        unread: n.unread !== undefined ? n.unread : !n.read,
        time: n.createdAt
          ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : n.time || 'Recent',
      }));
      setNotifs(formatted);
    } catch (e) {
      console.warn('Could not fetch notifications from server:', e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifs();
    }
  }, [isOpen]);

  const unreadCount = notifs.filter((n) => n.unread).length;
  const announcementCount = notifs.filter((n) => n.type === 'announcement').length;
  const maintenanceCount = notifs.filter((n) => n.type === 'maintenance').length;

  const navigateTo = (path) => {
    onClose?.();
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.history.pushState({}, '', path);
      window.dispatchEvent(new PopStateEvent('popstate'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const markAllRead = async () => {
    try {
      await notificationApi.markAllAsRead();
    } catch (e) {
      console.warn('Failed to mark all as read:', e.message);
    }
    setNotifs((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const markSingleRead = async (id) => {
    try {
      await notificationApi.markAsRead(id);
    } catch (e) {
      console.warn('Failed to mark notification as read:', e.message);
    }
    setNotifs((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  const clearAll = async () => {
    try {
      await notificationApi.clearAll();
    } catch (e) {
      console.warn('Failed to clear notifications:', e.message);
    }
    setNotifs([]);
  };

  const handleNotificationClick = (n) => {
    if (n.unread) {
      markSingleRead(n.id);
    }
    // Navigate user directly to related section
    if (n.type === 'announcement') {
      navigateTo(isTenant ? '/tenant-announcements' : '/dashboard-announcements');
    } else if (n.type === 'maintenance') {
      navigateTo(isTenant ? '/tenant-maintenance' : '/dashboard-tickets');
    } else if (n.type === 'payment') {
      navigateTo(isTenant ? '/tenant-payments' : '/dashboard-payments');
    }
  };

  const filtered = notifs.filter((n) => {
    if (filter === 'unread') return n.unread;
    if (filter === 'announcement') return n.type === 'announcement';
    if (filter === 'maintenance') return n.type === 'maintenance';
    return true;
  });

  if (!isOpen) return null;

  const announcementsRoute = isTenant ? '/tenant-announcements' : '/dashboard-announcements';
  const maintenanceRoute = isTenant ? '/tenant-maintenance' : '/dashboard-tickets';

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Sliding Drawer */}
      <aside className="relative w-full max-w-sm h-full bg-white/95 dark:bg-[#0A0D18]/95 apple-glass border-l border-slate-200 dark:border-slate-800/80 shadow-2xl z-10 flex flex-col drawer-slide-in top-shade">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Bell className="w-4 h-4 text-indigo-500" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              )}
            </div>
            <h3 className="text-xs font-bold font-grotesk tracking-wide text-slate-900 dark:text-white uppercase">
              Notifications ({unreadCount > 0 ? unreadCount : notifs.length})
            </h3>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-400 hover:text-slate-900 dark:hover:text-white border border-slate-200 dark:border-slate-800 btn-press cursor-pointer"
            aria-label="Close notifications"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-4 space-y-3.5 overflow-y-auto">
          
          {/* Quick Module Shortcuts: Where to find Announcements & Maintenance */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold block">
              Quick Portals & Live Updates
            </span>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => navigateTo(announcementsRoute)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 hover:border-indigo-500/50 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/20 transition-all flex items-center gap-2 text-left group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-indigo-500/10 text-indigo-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Megaphone className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">Announcements</div>
                  <div className="text-[9px] font-mono text-indigo-500 dark:text-indigo-400 flex items-center gap-0.5">
                    View Board <ArrowRight className="w-2.5 h-2.5" />
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => navigateTo(maintenanceRoute)}
                className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 hover:border-amber-500/50 hover:bg-amber-50/50 dark:hover:bg-amber-950/20 transition-all flex items-center gap-2 text-left group cursor-pointer"
              >
                <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                  <Wrench className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 truncate">Maintenance</div>
                  <div className="text-[9px] font-mono text-amber-500 dark:text-amber-400 flex items-center gap-0.5">
                    View Tickets <ArrowRight className="w-2.5 h-2.5" />
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Category Filters: All | Announcements | Maintenance | Unread */}
          <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-slate-800/60">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-slate-500 font-semibold">
                Filter Stream
              </span>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllRead}
                    className="text-[11px] text-indigo-500 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Check className="w-3 h-3" /> Mark read
                  </button>
                )}
                {notifs.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-[11px] text-rose-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Trash2 className="w-3 h-3" /> Clear all
                  </button>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-1 bg-slate-100 dark:bg-slate-900/90 p-1 rounded-xl border border-slate-200 dark:border-slate-800 text-[11px] font-mono">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${filter === 'all' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
              >
                All ({notifs.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('announcement')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${filter === 'announcement' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
              >
                📢 Announcements {announcementCount > 0 ? `(${announcementCount})` : ''}
              </button>
              <button
                type="button"
                onClick={() => setFilter('maintenance')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${filter === 'maintenance' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
              >
                🔧 Maintenance {maintenanceCount > 0 ? `(${maintenanceCount})` : ''}
              </button>
              <button
                type="button"
                onClick={() => setFilter('unread')}
                className={`px-2 py-1 rounded-lg transition-all cursor-pointer ${filter === 'unread' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'}`}
              >
                Unread {unreadCount > 0 ? `(${unreadCount})` : ''}
              </button>
            </div>
          </div>

          {/* Notifications Feed */}
          <div className="space-y-2 pt-1">
            {loading ? (
              <div className="p-8 text-center text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                <span>Loading notifications...</span>
              </div>
            ) : filtered.length === 0 ? (
              <div className="p-6 text-center rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800/80 space-y-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 mx-auto flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold font-grotesk text-slate-800 dark:text-slate-200">All caught up!</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed font-sans mt-0.5">
                    {filter !== 'all' 
                      ? `No ${filter} notifications found.`
                      : 'You have cleared all alerts. Jump directly to live modules:'}
                  </p>
                </div>
                <div className="pt-1 flex flex-col gap-2">
                  <button
                    type="button"
                    onClick={() => navigateTo(announcementsRoute)}
                    className="w-full py-2 px-3 rounded-xl bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Megaphone className="w-3.5 h-3.5" /> Go to Announcements Board
                  </button>
                  <button
                    type="button"
                    onClick={() => navigateTo(maintenanceRoute)}
                    className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Wrench className="w-3.5 h-3.5" /> Go to Maintenance Queue
                  </button>
                </div>
              </div>
            ) : (
              filtered.map((n) => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 rounded-2xl apple-glass top-shade border transition-all space-y-1.5 relative cursor-pointer group ${
                    n.unread
                      ? 'border-indigo-500/40 bg-indigo-500/5 hover:border-indigo-500/60 shadow-sm'
                      : 'border-slate-200 dark:border-slate-800/80 opacity-80 hover:opacity-100 hover:border-slate-300 dark:hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded-md ${
                      n.type === 'announcement'
                        ? 'bg-blue-500/10 text-blue-500'
                        : n.type === 'maintenance'
                        ? 'bg-amber-500/10 text-amber-500'
                        : 'bg-indigo-500/10 text-indigo-400'
                    }`}>
                      {n.type === 'announcement' ? '📢 Announcement' : n.type === 'maintenance' ? '🔧 Maintenance' : n.type}
                    </span>
                    <span className="text-slate-400 text-[10px]">{n.time}</span>
                  </div>

                  <h5 className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between gap-1.5">
                    <span className="flex items-center gap-1.5 min-w-0">
                      {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0" />}
                      <span className="truncate">{n.title}</span>
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                  </h5>

                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal line-clamp-2">
                    {n.body}
                  </p>

                  <div className="pt-1 text-[10px] font-mono text-indigo-500 flex items-center gap-1 opacity-80 group-hover:opacity-100">
                    Click to view details &rarr;
                  </div>
                </div>
              ))
            )}
          </div>

        </div>

      </aside>
    </div>
  );
};
