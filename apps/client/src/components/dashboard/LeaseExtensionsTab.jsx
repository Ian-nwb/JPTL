import React, { useState, useEffect, useCallback } from 'react';
import { landlordApi } from '../../services/api';
import { CalendarClock, CheckCircle, XCircle, Clock, ChevronDown, RefreshCw, ArrowRight } from 'lucide-react';

const STATUS_COLORS = {
  pending: { bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-700', badge: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  approved: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', border: 'border-emerald-200 dark:border-emerald-700', badge: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300' },
  rejected: { bg: 'bg-rose-50 dark:bg-rose-900/20', border: 'border-rose-200 dark:border-rose-700', badge: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300' },
};

const STATUS_ICONS = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
};

function fmt(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function ReviewModal({ ext, leaseEntry, onClose, onSubmit }) {
  const [action, setAction] = useState('approve');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setLoading(true);
    setError('');
    try {
      const leaseId = leaseEntry.leaseId || leaseEntry._id;
      const extId = ext.id || ext._id;
      await onSubmit(leaseId, extId, { action, landlordNotes: notes });
      onClose();
    } catch (err) {
      setError(err?.data?.message || err.message || 'Failed to submit review.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-600 to-violet-600 px-6 py-4">
          <h3 className="text-white font-semibold text-lg">Review Extension Request</h3>
          <p className="text-indigo-100 text-sm mt-0.5">{leaseEntry.tenant?.name} · {leaseEntry.unit?.label}</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 text-sm space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Term</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{ext.termMonths} months</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500 dark:text-slate-400">New end date</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                {fmt(leaseEntry.leaseEnd)} <ArrowRight size={12} className="text-indigo-500" /> {fmt(ext.proposedEndDate)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500 dark:text-slate-400">Monthly rent</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">${ext.monthlyRent?.toLocaleString()}/mo</span>
            </div>
            {ext.tenantNotes && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 block text-xs mb-1">Tenant notes</span>
                <p className="text-slate-700 dark:text-slate-300 italic">"{ext.tenantNotes}"</p>
              </div>
            )}
          </div>

          {/* Action selector */}
          <div className="flex gap-2">
            <button
              onClick={() => setAction('approve')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                action === 'approve'
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-emerald-400'
              }`}
            >
              ✓ Approve
            </button>
            <button
              onClick={() => setAction('reject')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                action === 'reject'
                  ? 'bg-rose-500 text-white border-rose-500'
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-600 hover:border-rose-400'
              }`}
            >
              ✕ Reject
            </button>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-500 dark:text-slate-400 mb-1.5">
              Notes for tenant <span className="text-slate-400">(optional)</span>
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={action === 'approve' ? 'e.g. Looking forward to another term!' : 'e.g. Unit is being renovated...'}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </div>

          {error && <p className="text-rose-500 text-sm">{error}</p>}
        </div>

        <div className="flex gap-3 px-6 pb-6">
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl border border-slate-200 dark:border-slate-600 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl text-sm font-semibold text-white transition-all disabled:opacity-50 ${
              action === 'approve' ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-rose-500 hover:bg-rose-600'
            }`}
          >
            {loading ? 'Submitting...' : action === 'approve' ? 'Confirm Approval' : 'Confirm Rejection'}
          </button>
        </div>
      </div>
    </div>
  );
}

export function LeaseExtensionsTab() {
  const [data, setData] = useState({ total: 0, extensions: [] });
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reviewTarget, setReviewTarget] = useState(null); // { leaseEntry, ext }
  const [toast, setToast] = useState('');

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError('');
    try {
      const res = await landlordApi.getLeaseExtensions(filter);
      const payload = res?.data || res;
      setData(payload?.extensions ? payload : { total: 0, extensions: [] });
    } catch (err) {
      setError(err?.data?.message || err.message || 'Failed to load lease extensions.');
    } finally {
      if (!silent) setLoading(false);
    }
  }, [filter]);

  useEffect(() => { load(); }, [load]);

  async function handleReview(leaseId, extensionId, payload) {
    setError('');

    // Instant optimistic update so UI changes immediately without requiring refresh
    setData((prev) => {
      const updatedExtensions = prev.extensions.map((entry) => {
        const isTargetLease = String(entry.leaseId) === String(leaseId) || String(entry._id) === String(leaseId);
        if (!isTargetLease) return entry;

        return {
          ...entry,
          leaseStatus: payload.action === 'approve' ? 'active' : 'renewal_rejected',
          leaseEnd: payload.action === 'approve'
            ? (entry.extensionRequests.find((r) => String(r.id || r._id) === String(extensionId))?.proposedEndDate || entry.leaseEnd)
            : entry.leaseEnd,
          extensionRequests: entry.extensionRequests.map((req) => {
            const isTargetExt = String(req.id || req._id) === String(extensionId);
            if (!isTargetExt) return req;
            return {
              ...req,
              status: payload.action === 'approve' ? 'approved' : 'rejected',
              reviewedAt: new Date().toISOString(),
              landlordNotes: payload.landlordNotes || req.landlordNotes,
            };
          }),
        };
      });

      return {
        ...prev,
        extensions: updatedExtensions,
      };
    });

    try {
      const res = await landlordApi.reviewLeaseExtension(leaseId, extensionId, payload);
      setToast(res?.message || (payload.action === 'approve' ? 'Extension approved successfully.' : 'Extension rejected.'));
      setTimeout(() => setToast(''), 4000);
      await load(true);
    } catch (err) {
      console.error('Review extension error:', err);
      await load(true);
      setError(err?.data?.message || err.message || 'Failed to submit review.');
    }
  }

  const pendingCount = data.extensions.reduce(
    (acc, e) => acc + e.extensionRequests.filter((r) => r.status === 'pending').length,
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <CalendarClock className="text-indigo-500" size={24} />
            Lease Extensions
            {pendingCount > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs font-bold bg-amber-500 text-white rounded-full">
                {pendingCount} pending
              </span>
            )}
          </h2>
          <p className="text-slate-500 dark:text-slate-400 text-sm mt-0.5">
            Review and manage tenant lease extension requests
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Filter */}
          <div className="relative">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            >
              <option value="all">All Requests</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          <button
            onClick={load}
            className="p-2 rounded-xl border border-slate-200 dark:border-slate-600 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl text-sm font-medium animate-in slide-in-from-bottom-2">
          ✅ {toast}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-700 rounded-xl p-4 text-rose-600 dark:text-rose-400 text-sm">
          {error}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 animate-pulse">
              <div className="flex justify-between mb-4">
                <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-48" />
                <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded-full w-20" />
              </div>
              <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-64 mb-2" />
              <div className="h-3 bg-slate-100 dark:bg-slate-700 rounded w-40" />
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && data.extensions.length === 0 && (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4">
            <CalendarClock size={28} className="text-slate-400 dark:text-slate-500" />
          </div>
          <h3 className="text-slate-700 dark:text-slate-300 font-semibold mb-1">No extension requests</h3>
          <p className="text-slate-400 dark:text-slate-500 text-sm max-w-xs">
            {filter === 'all' ? 'Tenants can request lease extensions from their portal.' : `No ${filter} requests found.`}
          </p>
        </div>
      )}

      {/* Extension cards */}
      {!loading && data.extensions.map((leaseEntry) =>
        leaseEntry.extensionRequests.map((ext) => {
          const StatusIcon = STATUS_ICONS[ext.status] || Clock;
          const colors = STATUS_COLORS[ext.status] || STATUS_COLORS.pending;

          return (
            <div
              key={`${leaseEntry.leaseId}-${ext.id}`}
              className={`rounded-2xl border p-5 ${colors.bg} ${colors.border} transition-all`}
            >
              <div className="flex flex-wrap items-start justify-between gap-4">
                {/* Left: tenant + property info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${colors.badge}`}>
                      <StatusIcon size={12} />
                      {ext.status.toUpperCase()}
                    </span>
                    <span className="text-slate-600 dark:text-slate-300 font-semibold text-sm">
                      {leaseEntry.tenant?.name || 'Unknown Tenant'}
                    </span>
                    {leaseEntry.unit && (
                      <span className="text-slate-400 text-xs">· {leaseEntry.unit.label}</span>
                    )}
                    {leaseEntry.property && (
                      <span className="text-slate-400 text-xs">· {leaseEntry.property.name}</span>
                    )}
                  </div>

                  {/* Lease dates */}
                  <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300 mt-2 flex-wrap">
                    <span className="font-mono text-xs bg-white/60 dark:bg-slate-700/60 px-2 py-0.5 rounded-lg">
                      Current end: {fmt(leaseEntry.leaseEnd)}
                    </span>
                    <ArrowRight size={14} className="text-indigo-400 shrink-0" />
                    <span className="font-mono text-xs bg-indigo-100/70 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-lg font-semibold">
                      Proposed: {fmt(ext.proposedEndDate)}
                    </span>
                    <span className="text-slate-400 text-xs">({ext.termMonths} months)</span>
                  </div>

                  {/* Details row */}
                  <div className="flex gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                    <span>Rent: <strong className="text-slate-700 dark:text-slate-300">${ext.monthlyRent?.toLocaleString()}/mo</strong></span>
                    <span>Requested: <strong className="text-slate-700 dark:text-slate-300">{fmt(ext.requestedAt)}</strong></span>
                    {ext.reviewedAt && (
                      <span>Reviewed: <strong className="text-slate-700 dark:text-slate-300">{fmt(ext.reviewedAt)}</strong></span>
                    )}
                  </div>

                  {/* Tenant notes */}
                  {ext.tenantNotes && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400 italic">
                      "{ext.tenantNotes}"
                    </p>
                  )}

                  {/* Landlord notes (after review) */}
                  {ext.landlordNotes && (
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                      Your note: "{ext.landlordNotes}"
                    </p>
                  )}
                </div>

                {/* Right: action buttons (only for pending) */}
                {ext.status === 'pending' && (
                  <button
                    onClick={() => setReviewTarget({ leaseEntry, ext })}
                    className="shrink-0 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm"
                  >
                    Review
                  </button>
                )}
              </div>
            </div>
          );
        })
      )}

      {/* Review Modal */}
      {reviewTarget && (
        <ReviewModal
          ext={reviewTarget.ext}
          leaseEntry={reviewTarget.leaseEntry}
          onClose={() => setReviewTarget(null)}
          onSubmit={handleReview}
        />
      )}
    </div>
  );
}
