import React, { useState, useEffect, useRef } from 'react';
import {
  Activity, Radio, Search, Filter, RefreshCw, Clock, User, Globe,
  ShieldCheck, CheckCircle2, LogOut, AlertTriangle, ArrowUpRight
} from 'lucide-react';
import { getSessionLogs, subscribeToSessionStream } from '../services/superadminApi';

export const SessionMonitorTab = () => {
  const [sessions, setSessions] = useState([]);
  const [activeCount, setActiveCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(25);
  const [loading, setLoading] = useState(true);

  // Filters
  const [roleFilter, setRoleFilter] = useState('');
  const [search, setSearch] = useState('');

  // Live SSE Stream state
  const [streamConnected, setStreamConnected] = useState(false);
  const [liveEvents, setLiveEvents] = useState([]);
  const liveFeedContainerRef = useRef(null);

  const fetchSessions = async () => {
    try {
      setLoading(true);
      const data = await getSessionLogs({
        page,
        limit,
        role: roleFilter,
        search,
      });
      setSessions(data.sessions || []);
      setActiveCount(data.activeCount || 0);
      setTotalCount(data.total || 0);
    } catch (err) {
      console.error('Failed to load session logs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [page, roleFilter, search]);

  // Connect to SSE Stream
  useEffect(() => {
    const unsubscribe = subscribeToSessionStream(
      (event) => {
        if (event.type === 'CONNECTED') {
          setStreamConnected(true);
        } else if (event.type === 'LOGIN') {
          setStreamConnected(true);
          setLiveEvents((prev) => [
            {
              id: `${Date.now()}-${Math.random()}`,
              type: 'LOGIN',
              session: event.session,
              receivedAt: new Date().toLocaleTimeString(),
            },
            ...prev.slice(0, 19), // Keep top 20
          ]);

          // Update active count & refresh sessions list
          setActiveCount((prev) => prev + 1);
          fetchSessions();
        } else if (event.type === 'LOGOUT') {
          setStreamConnected(true);
          setLiveEvents((prev) => [
            {
              id: `${Date.now()}-${Math.random()}`,
              type: 'LOGOUT',
              session: event.session,
              receivedAt: new Date().toLocaleTimeString(),
            },
            ...prev.slice(0, 19),
          ]);
          setActiveCount((prev) => Math.max(0, prev - 1));
          fetchSessions();
        }
      },
      (err) => {
        setStreamConnected(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, []);

  const getRoleBadge = (role) => {
    switch (role) {
      case 'superadmin':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">Superadmin</span>;
      case 'landlord':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">Landlord</span>;
      case 'tenant':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Tenant</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-400">{role}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0D111D] border border-slate-800 rounded-3xl p-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Activity className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold font-grotesk text-white">Live Session & Login Monitor</h2>
          </div>
          <p className="text-xs text-slate-400 font-sans">
            Real-time telemetry of user logins, authentication events, IP addresses, and active platform sessions.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#070A12] border border-slate-800 text-xs font-mono">
            <span className={`w-2.5 h-2.5 rounded-full ${streamConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
            <span className={streamConnected ? 'text-emerald-400 font-bold' : 'text-amber-400'}>
              {streamConnected ? 'SSE Live Stream Active' : 'Connecting to Stream...'}
            </span>
          </div>

          <button
            onClick={fetchSessions}
            className="p-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition btn-press cursor-pointer"
            title="Refresh History"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 font-mono text-xs">
        <div className="p-5 rounded-2xl bg-[#0D111D] border border-slate-800 space-y-1.5">
          <span className="text-slate-400 text-[10px] uppercase">Currently Active Sessions</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-3xl font-extrabold font-grotesk text-emerald-400">{activeCount}</strong>
            <span className="text-[10px] text-emerald-500 font-bold flex items-center">
              <Radio className="w-3 h-3 mr-1 animate-pulse" /> Live
            </span>
          </div>
          <span className="text-slate-500 text-[10px] block">Users actively authenticated</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D111D] border border-slate-800 space-y-1.5">
          <span className="text-slate-400 text-[10px] uppercase">Total Historical Logins</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-3xl font-extrabold font-grotesk text-indigo-400">{totalCount}</strong>
          </div>
          <span className="text-slate-500 text-[10px] block">Recorded session logs</span>
        </div>

        <div className="p-5 rounded-2xl bg-[#0D111D] border border-slate-800 space-y-1.5">
          <span className="text-slate-400 text-[10px] uppercase">Real-Time Event Stream</span>
          <div className="flex items-baseline gap-2">
            <strong className="text-3xl font-extrabold font-grotesk text-purple-400">{liveEvents.length}</strong>
            <span className="text-[10px] text-purple-400">recent events captured</span>
          </div>
          <span className="text-slate-500 text-[10px] block">Server-Sent Events active</span>
        </div>
      </div>

      {/* Live Stream Ticker / Recent Activity Card */}
      {liveEvents.length > 0 && (
        <div className="bg-[#0D111D] border border-indigo-500/30 rounded-3xl p-6 shadow-xl space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold font-grotesk text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-emerald-400 animate-pulse" />
              <span>Real-Time Broadcast Ticker</span>
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Push Notifications via SSE</span>
          </div>

          <div
            ref={liveFeedContainerRef}
            className="max-h-48 overflow-y-auto space-y-2 font-mono text-xs pr-2"
          >
            {liveEvents.map((evt) => (
              <div
                key={evt.id}
                className={`p-3 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-all ${
                  evt.type === 'LOGIN'
                    ? 'bg-emerald-500/5 border-emerald-500/30'
                    : 'bg-slate-800/40 border-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      evt.type === 'LOGIN'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-700 text-slate-300'
                    }`}
                  >
                    {evt.type === 'LOGIN' ? 'NEW LOGIN' : 'LOGOUT'}
                  </span>
                  <strong className="text-white font-grotesk">{evt.session?.email}</strong>
                  {getRoleBadge(evt.session?.role)}
                </div>

                <div className="flex items-center gap-4 text-[11px] text-slate-400">
                  {evt.session?.ip && <span>IP: {evt.session.ip}</span>}
                  <span className="text-indigo-400 font-semibold">{evt.receivedAt}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search & Role Filter */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-[#0D111D] border border-slate-800 rounded-2xl p-4">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search session logs by email or IP address..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#070A12] border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-2 rounded-xl bg-[#070A12] border border-slate-800 text-xs text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Roles</option>
            <option value="superadmin">Superadmin</option>
            <option value="landlord">Landlord</option>
            <option value="tenant">Tenant</option>
          </select>
        </div>
      </div>

      {/* Sessions History Table */}
      <div className="bg-[#0D111D] border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-[#070A12] border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3.5 px-5">User</th>
                <th className="py-3.5 px-5">Role</th>
                <th className="py-3.5 px-5">Login Timestamp</th>
                <th className="py-3.5 px-5">IP Address</th>
                <th className="py-3.5 px-5">Client User-Agent</th>
                <th className="py-3.5 px-5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {loading && sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-indigo-400" />
                    <span>Loading session logs...</span>
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    No login sessions recorded yet.
                  </td>
                </tr>
              ) : (
                sessions.map((sess) => (
                  <tr key={sess._id} className="hover:bg-slate-900/40 transition">
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center font-bold text-[11px]">
                          {sess.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong className="text-white font-grotesk block">{sess.email}</strong>
                          {sess.userId?.firstName && (
                            <span className="text-[10px] text-slate-500">
                              {sess.userId.firstName} {sess.userId.lastName}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      {getRoleBadge(sess.role)}
                    </td>
                    <td className="py-3.5 px-5 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{new Date(sess.loginAt).toLocaleString()}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Globe className="w-3.5 h-3.5 text-slate-500" />
                        <span>{sess.ip || '127.0.0.1'}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-5 text-slate-400 max-w-xs truncate" title={sess.userAgent}>
                      {sess.userAgent ? sess.userAgent.substring(0, 45) + '…' : 'Standard Web Browser'}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      {sess.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400">
                          Logged Out
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalCount > limit && (
          <div className="flex items-center justify-between p-4 bg-[#070A12] border-t border-slate-800 text-xs font-mono">
            <span className="text-slate-400">
              Page {page} of {Math.ceil(totalCount / limit)} ({totalCount} total sessions)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 cursor-pointer"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * limit >= totalCount}
                className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 disabled:opacity-40 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default SessionMonitorTab;
