import React, { useState, useMemo } from 'react';
import { X, Calendar, CreditCard, DollarSign, CheckCircle2, ShieldCheck, Lock, Building, ArrowRight, AlertCircle, Sparkles } from 'lucide-react';
import { tenantApi } from '../../services/api';
import { useToast } from '../../context/ToastContext';

export const AdvancePaymentModal = ({
  isOpen,
  onClose,
  tenant,
  unit,
  lease,
  payments = [],
  onRequestExtension,
  onPaymentSuccess = () => {},
}) => {
  const toast = useToast();
  const [selectedMonths, setSelectedMonths] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [note, setNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [successResult, setSuccessResult] = useState(null);

  const rentAmount = Number(lease?.monthlyRent || unit?.monthlyRent || tenant?.monthlyRent || 2400);
  const hasParking = Boolean(tenant?.hasParking ?? unit?.hasParking ?? false);
  const parkingFee = hasParking ? Number(tenant?.parkingFee ?? unit?.parkingFee ?? 0) : 0;
  const utilityFee = Number(tenant?.utilityFee ?? unit?.utilityFee ?? 45);
  const monthlyTotal = rentAmount + parkingFee + utilityFee;

  // Resolve lease end date
  const leaseEndDate = useMemo(() => {
    if (lease?.leaseEnd) return new Date(lease.leaseEnd);
    if (unit?.leaseEnd) return new Date(unit.leaseEnd);
    return null;
  }, [lease?.leaseEnd, unit?.leaseEnd]);

  // Compute available months ahead within the active lease
  const availableMonths = useMemo(() => {
    if (!leaseEndDate) return [];

    // Find latest paid date
    let startFrom = new Date();
    if (Array.isArray(payments) && payments.length > 0) {
      const paidDates = payments
        .filter((p) => p.status === 'paid' && p.dueDate)
        .map((p) => new Date(p.dueDate).getTime());
      if (paidDates.length > 0) {
        const latestTime = Math.max(...paidDates);
        startFrom = new Date(latestTime);
      }
    }

    // Move to 1st of month
    startFrom.setDate(1);
    startFrom.setHours(0, 0, 0, 0);

    const list = [];
    const cursor = new Date(startFrom);
    cursor.setMonth(cursor.getMonth() + 1);

    // Limit to 12 months or lease end
    let loopLimit = 0;
    while (cursor <= leaseEndDate && loopLimit < 12) {
      loopLimit++;
      const currentDue = new Date(cursor);
      const monthLabel = currentDue.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      // Check if already paid in payments
      const alreadyPaid = payments.some((p) => {
        if (p.status !== 'paid' || !p.dueDate) return false;
        const d = new Date(p.dueDate);
        return d.getFullYear() === currentDue.getFullYear() && d.getMonth() === currentDue.getMonth();
      });

      if (!alreadyPaid) {
        list.push({
          dueDate: currentDue,
          label: monthLabel,
        });
      }

      cursor.setMonth(cursor.getMonth() + 1);
    }

    return list;
  }, [leaseEndDate, payments]);

  // Ensure selected count does not exceed available
  const safeSelectedCount = Math.max(1, Math.min(selectedMonths, availableMonths.length || 1));
  const processingFee = paymentMethod === 'card' ? 45.0 : 0.0;
  const totalAmount = monthlyTotal * safeSelectedCount + processingFee;

  if (!isOpen) return null;

  const handlePay = async (e) => {
    e.preventDefault();
    if (availableMonths.length === 0) return;

    setIsProcessing(true);
    setError('');

    try {
      const payload = {
        monthsAhead: safeSelectedCount,
        methodId: paymentMethod === 'card' ? 'pm_card_default' : 'pm_ach_default',
        note: note.trim(),
      };

      const res = await tenantApi.payInAdvance(payload);
      const data = res.data?.data;

      setSuccessResult({
        payments: data?.payments || [],
        total: totalAmount,
        monthsCount: safeSelectedCount,
        paidAt: new Date().toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      });

      toast.success(
        `Advance payment of $${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} for ${safeSelectedCount} month(s) confirmed!`
      );
      onPaymentSuccess(data);
    } catch (err) {
      console.error('Advance payment failed:', err);
      setError(err.response?.data?.message || err.message || 'Payment failed. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFinish = () => {
    setSuccessResult(null);
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity animate-in fade-in duration-200"
        onClick={isProcessing ? undefined : handleFinish}
      />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-white dark:bg-[#10131F] border border-slate-200 dark:border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl z-10 my-8 top-shade modal-enter modal-enter-active apple-glass">
        {/* Close Button */}
        {!isProcessing && (
          <button
            onClick={handleFinish}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-900 text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center border border-slate-200 dark:border-slate-800 btn-press"
            aria-label="Close dialog"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        {successResult ? (
          /* SUCCESS STATE */
          <div className="text-center py-4 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div>
              <h2 className="text-2xl font-bold font-grotesk text-slate-900 dark:text-white">
                Advance Payment Confirmed!
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Successfully prepaid {successResult.monthsCount} month(s) rent. Receipts issued.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#080B14] border border-slate-200/80 dark:border-slate-800/60 text-xs font-mono text-left space-y-2.5">
              <div className="flex justify-between">
                <span className="text-slate-500">Months Covered:</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {successResult.monthsCount} Month(s) Ahead
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Paid:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  ${successResult.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Timestamp:</span>
                <span className="text-slate-400">{successResult.paidAt}</span>
              </div>
              {successResult.payments.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                  <span className="text-slate-500 block text-[11px]">Covered Periods:</span>
                  {successResult.payments.map((p, i) => (
                    <div key={i} className="flex justify-between text-[11px] text-slate-700 dark:text-slate-300">
                      <span>• {p.period || `Advance Month ${i + 1}`}</span>
                      <span className="font-semibold">${(p.amount || monthlyTotal).toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-grotesk btn-press shadow-lg shadow-indigo-600/20 text-xs"
            >
              Done & Return to Ledger
            </button>
          </div>
        ) : (
          /* FORM STATE */
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold font-grotesk text-slate-900 dark:text-white">
                  Pay Rent in Advance
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {unit?.label || 'Unit'} &bull; {tenant?.propertyName || 'Your Property'}
                </p>
              </div>
            </div>

            {/* Lease Status & Guard Pill */}
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#080B14] border border-slate-200/80 dark:border-slate-800/60 font-mono text-xs flex justify-between items-center mb-4">
              <div>
                <span className="text-slate-500 block text-[11px]">Lease Expiration</span>
                <strong className="text-slate-900 dark:text-white font-semibold">
                  {leaseEndDate ? leaseEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'No active lease'}
                </strong>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                availableMonths.length > 0
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                  : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
              }`}>
                {availableMonths.length} month(s) available
              </span>
            </div>

            {error && (
              <div className="p-3 mb-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {availableMonths.length === 0 ? (
              /* NO MONTHS AVAILABLE WITHIN LEASE */
              <div className="py-6 text-center space-y-3">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center border border-amber-500/20">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold font-grotesk text-slate-900 dark:text-white">
                  All Lease Months Are Fully Paid!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                  You are fully paid through the end of your current lease ({leaseEndDate?.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}). To pay further in advance, please request a lease extension first.
                </p>
                {onRequestExtension && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onRequestExtension();
                    }}
                    className="mt-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-grotesk font-semibold text-xs inline-flex items-center gap-2 btn-press shadow-md"
                  >
                    <span>Request Lease Extension</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ) : (
              <form onSubmit={handlePay} className="space-y-4 text-xs">
                {/* Month count selector */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    How many months would you like to pay ahead?
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {availableMonths.slice(0, 4).map((m, idx) => {
                      const count = idx + 1;
                      return (
                        <button
                          type="button"
                          key={count}
                          onClick={() => setSelectedMonths(count)}
                          className={`p-2.5 rounded-xl border text-xs font-semibold btn-press text-center transition-all ${
                            safeSelectedCount === count
                              ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                              : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {count} {count === 1 ? 'Month' : 'Months'}
                        </button>
                      );
                    })}
                  </div>
                  {availableMonths.length > 4 && (
                    <div className="grid grid-cols-4 gap-2 mt-2">
                      {availableMonths.slice(4, 8).map((m, idx) => {
                        const count = idx + 5;
                        return (
                          <button
                            type="button"
                            key={count}
                            onClick={() => setSelectedMonths(count)}
                            className={`p-2.5 rounded-xl border text-xs font-semibold btn-press text-center transition-all ${
                              safeSelectedCount === count
                                ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                            }`}
                          >
                            {count} Months
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-400 mt-1.5">
                    * Dynamically locked to your remaining lease period ({availableMonths.length} month(s) available).
                  </p>
                </div>

                {/* Selected Months Breakdown */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#080B14] border border-slate-200/80 dark:border-slate-800/60 font-mono space-y-1.5">
                  <span className="text-slate-500 block text-[11px]">Months Selected for Payment:</span>
                  {availableMonths.slice(0, safeSelectedCount).map((m, idx) => (
                    <div key={idx} className="flex justify-between text-slate-700 dark:text-slate-300">
                      <span>• {m.label}</span>
                      <span className="font-semibold">${monthlyTotal.toLocaleString()}</span>
                    </div>
                  ))}
                  {processingFee > 0 && (
                    <div className="flex justify-between text-slate-500 text-[11px] pt-1 border-t border-slate-200 dark:border-slate-800">
                      <span>Card Processing Fee</span>
                      <span>${processingFee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex justify-between font-bold text-sm text-slate-900 dark:text-white">
                    <span>Total Advance Rent</span>
                    <span className="text-emerald-600 dark:text-emerald-400">
                      ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>

                {/* Payment Method Selector */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Payment Method
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('card')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 btn-press transition-all ${
                        paymentMethod === 'card'
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>Card (•••• 4242)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('ach')}
                      className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 btn-press transition-all ${
                        paymentMethod === 'ach'
                          ? 'border-indigo-500 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400'
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      <Building className="w-4 h-4" />
                      <span>Direct ACH (0% Fee)</span>
                    </button>
                  </div>
                </div>

                {/* Optional Note */}
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Memo / Note <span className="text-slate-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="e.g. Prepayment for upcoming travel abroad"
                    className="w-full bg-slate-50 dark:bg-[#080B14] border border-slate-300 dark:border-slate-800 rounded-xl px-3 py-2 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Security Guarantee */}
                <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>256-bit encrypted bank checkout. Locked strictly within lease period.</span>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={isProcessing}
                    onClick={handleFinish}
                    className="px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-800 btn-press text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessing}
                    className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold font-grotesk btn-press shadow-md shadow-indigo-600/20 flex items-center gap-2 text-xs disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <span>Processing Payment...</span>
                    ) : (
                      <>
                        <span>Pay ${totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })} ({safeSelectedCount} Mo)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
