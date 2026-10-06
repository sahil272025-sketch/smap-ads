import React, { useState, useEffect } from 'react';
import { Payment } from '../../types';
import { api } from '../../lib/api';
import { AddFundsModal } from './AddFundsModal';
import { CreditCard, Smartphone, CheckCircle2, Clock, AlertCircle, RefreshCw, Wallet, Plus, ShieldCheck } from 'lucide-react';

export const PaymentsView: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [showAddFunds, setShowAddFunds] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [utrInput, setUtrInput] = useState('');
  const [submittingUtr, setSubmittingUtr] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const loadPayments = () => {
    setLoading(true);
    Promise.all([api.getPayments(), api.getWalletBalance()])
      .then(([payRes, walRes]) => {
        setPayments(payRes.payments || []);
        setWalletBalance(walRes.balance || 0);
      })
      .catch((err) => console.error('Failed to load payments', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleUtrSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPayment || !utrInput.trim()) return;

    setSubmittingUtr(true);
    setMessage(null);
    setErrorMessage(null);
    try {
      const res = await api.submitPaymentReference(selectedPayment.id, utrInput);
      setMessage(res.message);
      setSelectedPayment(null);
      setUtrInput('');
      loadPayments();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to submit UTR');
    } finally {
      setSubmittingUtr(false);
    }
  };

  const getStatusBadge = (status: Payment['status']) => {
    switch (status) {
      case 'PAID':
        return <span className="rounded-full border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">Paid</span>;
      case 'VERIFICATION_PENDING':
        return <span className="rounded-full border border-amber-500/30 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 text-[10px] font-bold text-amber-600 dark:text-amber-400">Verification Pending</span>;
      case 'PENDING':
        return <span className="rounded-full border border-yellow-500/30 bg-yellow-50 dark:bg-yellow-950/40 px-2.5 py-0.5 text-[10px] font-bold text-yellow-600 dark:text-yellow-400">Pending</span>;
      case 'FAILED':
        return <span className="rounded-full border border-red-500/30 bg-red-50 dark:bg-red-950/40 px-2.5 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400">Failed</span>;
      case 'CANCELLED':
        return <span className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-500">Cancelled</span>;
      default:
        return <span className="rounded-full border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 px-2.5 py-0.5 text-[10px] font-bold text-slate-500">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            UPI Payment History
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track your verified UPI payments, invoices, and payment references.
          </p>
        </div>

        <button
          onClick={loadPayments}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm self-start sm:self-center transition-colors"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Wallet Balance Card */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-purple-500/25 bg-gradient-to-r from-purple-950/30 via-slate-900/40 to-slate-900/40 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 text-white shadow-md shadow-purple-600/30">
            <Wallet className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-[11px] font-bold uppercase text-purple-400">
              SMAP Wallet Available Balance
            </span>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tabular-nums">
                ₹{walletBalance.toFixed(2)}
              </span>
              <span className="text-xs text-slate-400 font-semibold">INR</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowAddFunds(true)}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-purple-600/30 hover:bg-purple-500 active:scale-95 transition-all self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          <span>Add Funds</span>
        </button>
      </div>

      {message && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 p-4 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          <span>{message}</span>
        </div>
      )}

      {errorMessage && (
        <div className="rounded-2xl border border-red-500/30 bg-red-50 dark:bg-red-950/40 p-4 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Payments Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] p-5 sm:p-6 shadow-sm">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
          </div>
        ) : payments.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900 text-slate-400">
              <CreditCard className="h-6 w-6" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">
              No payments recorded yet
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Payments are generated automatically when you create a new ad campaign.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-medium">Payment ID</th>
                  <th className="pb-3 font-medium">Gateway Order ID</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Method</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Reference / UTR</th>
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-3.5 font-mono text-slate-900 dark:text-white font-medium">
                      {p.id}
                    </td>
                    <td className="py-3.5 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                      {p.gateway_order_id || '—'}
                    </td>
                    <td className="py-3.5 font-extrabold text-slate-900 dark:text-white tabular-nums">
                      ₹{p.amount}
                    </td>
                    <td className="py-3.5 text-slate-600 dark:text-slate-300 font-semibold text-[11px]">
                      UPI ({p.payment_method})
                    </td>
                    <td className="py-3.5">
                      {getStatusBadge(p.status)}
                    </td>
                    <td className="py-3.5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                      {p.transaction_reference || p.gateway_payment_id || '—'}
                    </td>
                    <td className="py-3.5 text-slate-500 dark:text-slate-400">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3.5 text-right">
                      {p.status === 'PENDING' && (
                        <button
                          onClick={() => setSelectedPayment(p)}
                          className="text-violet-600 dark:text-violet-400 font-semibold hover:underline"
                        >
                          Record UTR
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* UTR Input Modal */}
      {selectedPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Submit Payment Reference (UTR)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Enter the 12-digit UPI Transaction Reference (UTR) from your banking or UPI app (PhonePe, Google Pay, Paytm, BHIM) for payment <strong className="font-mono text-slate-800 dark:text-slate-200">{selectedPayment.id}</strong> (₹{selectedPayment.amount}).
            </p>

            <form onSubmit={handleUtrSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  12-Digit UTR Number
                </label>
                <input
                  type="text"
                  required
                  pattern="[0-9]{12}"
                  maxLength={12}
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="e.g. 428901238910"
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 px-3 py-2 text-sm font-mono text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedPayment(null)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingUtr || utrInput.length !== 12}
                  className="rounded-xl bg-purple-600 px-5 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/25 hover:bg-purple-500 disabled:opacity-50"
                >
                  {submittingUtr ? 'Verifying...' : 'Submit Verification'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Funds Modal */}
      <AddFundsModal
        isOpen={showAddFunds}
        onClose={() => setShowAddFunds(false)}
        currentBalance={walletBalance}
        onSuccess={(newBal) => {
          setWalletBalance(newBal);
          loadPayments();
        }}
      />

    </div>
  );
};
