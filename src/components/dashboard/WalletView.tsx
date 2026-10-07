import React, { useState, useEffect } from 'react';
import { WalletTransaction, Payment } from '../../types';
import { api } from '../../lib/api';
import { AddFundsModal } from './AddFundsModal';
import {
  Wallet,
  Plus,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  RotateCcw,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  ShieldCheck,
  TrendingUp,
  Receipt,
} from 'lucide-react';

export const WalletView: React.FC = () => {
  const [balance, setBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [selectedTopupAmount, setSelectedTopupAmount] = useState<number>(500);
  const [filterType, setFilterType] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [topupPayments, setTopupPayments] = useState<Payment[]>([]);

  const loadWalletData = async () => {
    setLoading(true);
    try {
      const [data, paymentsRes] = await Promise.all([
        api.getWallet(),
        api.getPayments().catch(() => ({ payments: [] as Payment[] })),
      ]);
      setBalance(data.balance || 0);
      setTransactions(data.transactions || []);
      const userTopups = (paymentsRes.payments || []).filter(
        (p) => p.campaign_id === 'WALLET_TOPUP' || p.package_id === 'wallet_topup'
      );
      setTopupPayments(userTopups);
    } catch (err) {
      console.error('Failed to load wallet data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWalletData();
    try {
      const params = new URLSearchParams(window.location.search);
      const addFundsParam = params.get('add_funds');
      if (addFundsParam) {
        const amt = Number(addFundsParam);
        if (!isNaN(amt) && amt > 0) {
          setSelectedTopupAmount(amt);
          setShowAddFundsModal(true);
        }
      }
    } catch {
      // ignore
    }
  }, []);

  const handleOpenAddFunds = (amt = 500) => {
    setSelectedTopupAmount(amt);
    setShowAddFundsModal(true);
  };

  const handleResetTestBalance = async () => {
    if (!window.confirm('Are you sure you want to reset your unverified/test balance to ₹0.00? This cannot be undone.')) {
      return;
    }
    setResetting(true);
    setResetMessage(null);
    try {
      const res = await api.resetTestBalance();
      setResetMessage(res.message);
      await loadWalletData();
    } catch (err: any) {
      alert(err.message || 'Failed to reset balance');
    } finally {
      setResetting(false);
    }
  };

  const handleFundsAdded = (newBal: number) => {
    setBalance(newBal);
    loadWalletData();
  };

  // Filter and search transactions
  const filteredTransactions = transactions.filter((tx) => {
    if (filterType !== 'ALL' && tx.type !== filterType) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDesc = tx.description.toLowerCase().includes(q);
      const matchId = tx.id.toLowerCase().includes(q);
      const matchPayId = (tx.payment_id || '').toLowerCase().includes(q);
      const matchGateway = (tx.gateway_payment_id || '').toLowerCase().includes(q);
      return matchDesc || matchId || matchPayId || matchGateway;
    }
    return true;
  });

  const totalAdded = transactions
    .filter((tx) => tx.type === 'ADD_FUNDS' && tx.status === 'SUCCESS')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const totalSpent = transactions
    .filter((tx) => tx.type === 'CAMPAIGN_PAYMENT' && tx.status === 'SUCCESS')
    .reduce((sum, tx) => sum + tx.amount, 0);

  const getTransactionTypeBadge = (type: WalletTransaction['type'], status: WalletTransaction['status']) => {
    if (status === 'FAILED' || type === 'FAILED_PAYMENT') {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 text-[10px] font-bold text-red-500">
          <AlertTriangle className="h-3 w-3" />
          Failed Payment
        </span>
      );
    }
    switch (type) {
      case 'ADD_FUNDS':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-500">
            <ArrowDownRight className="h-3 w-3" />
            Add Funds
          </span>
        );
      case 'CAMPAIGN_PAYMENT':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[10px] font-bold text-purple-400">
            <ArrowUpRight className="h-3 w-3" />
            Campaign Payment
          </span>
        );
      case 'REFUND':
        return (
          <span className="inline-flex items-center gap-1 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-blue-400">
            <RotateCcw className="h-3 w-3" />
            Refund
          </span>
        );
      default:
        return (
          <span className="rounded-full border border-slate-500/30 bg-slate-500/10 px-2.5 py-0.5 text-[10px] font-bold text-slate-400">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <span>SMAP Wallet</span>
            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              <ShieldCheck className="h-3 w-3" />
              Verified Balance
            </span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Pre-fund your advertising budget via UPI and launch campaigns instantly.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={loadWalletData}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 shadow-sm transition-colors"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={() => setShowAddFundsModal(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span>Add Funds</span>
          </button>
        </div>
      </div>

      {/* Prominent Balance Showcase Card */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-[#120E24] via-[#0E1324] to-[#0A0D18] p-6 sm:p-8 text-white shadow-xl shadow-purple-950/20">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-16 w-48 h-48 bg-pink-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-300">
              <Wallet className="h-4 w-4 text-purple-400" />
              <span>Available Fund Balance</span>
            </div>

            <div className="flex items-baseline gap-2">
              <span className="text-3xl sm:text-5xl font-black tracking-tight text-white tabular-nums">
                ₹{balance.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-purple-300 uppercase tracking-widest">
                INR
              </span>
            </div>

            <p className="text-xs text-slate-400 max-w-md">
              Your available balance is stored safely in your SMAP account. You can use it anytime to pay for advertising campaigns without entering card details again.
            </p>

            {/* Quick Add Funds presets */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-xs text-slate-400">Quick top-up:</span>
              {[100, 200, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  onClick={() => handleOpenAddFunds(amt)}
                  className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white/10 hover:bg-purple-600 text-white border border-white/10 transition-colors"
                >
                  +₹{amt}
                </button>
              ))}

              {balance > 0 && (
                <button
                  onClick={handleResetTestBalance}
                  disabled={resetting}
                  className="ml-auto text-[11px] text-amber-400 hover:text-amber-300 underline font-medium"
                >
                  {resetting ? 'Resetting...' : 'Reset Test Balance (₹0)'}
                </button>
              )}
            </div>

            {resetMessage && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs">
                {resetMessage}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <button
              onClick={() => handleOpenAddFunds(500)}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-xl shadow-purple-600/40 hover:bg-purple-500 active:scale-95 transition-all"
            >
              <Plus className="h-4 w-4" />
              <span>Add Funds Now</span>
            </button>
            <div className="flex items-center gap-4 text-xs text-slate-400 pt-1">
              <div>
                <span className="block text-[10px] uppercase text-slate-500">Total Added</span>
                <span className="font-bold text-emerald-400 tabular-nums">₹{totalAdded.toFixed(2)}</span>
              </div>
              <div className="border-l border-white/10 pl-4">
                <span className="block text-[10px] uppercase text-slate-500">Total Used</span>
                <span className="font-bold text-purple-300 tabular-nums">₹{totalSpent.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Active UPI Top-Up Requests */}
      {topupPayments.filter((p) => p.status === 'VERIFICATION_PENDING' || p.status === 'PENDING').length > 0 && (
        <div className="rounded-2xl border border-amber-500/30 bg-amber-50/50 dark:bg-amber-950/20 p-4 sm:p-5 space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-700 dark:text-amber-400">
            <Clock className="h-4 w-4" />
            <span>Active UPI Top-Up Requests</span>
          </div>
          <div className="grid gap-2.5">
            {topupPayments
              .filter((p) => p.status === 'VERIFICATION_PENDING' || p.status === 'PENDING')
              .map((p) => (
                <div
                  key={p.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl bg-white dark:bg-[#0B101E] border border-amber-500/20 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white tabular-nums">
                        ₹{p.amount.toFixed(2)}
                      </span>
                      {p.status === 'VERIFICATION_PENDING' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                          <Clock className="h-3 w-3" />
                          Verification Pending
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30">
                          <Clock className="h-3 w-3" />
                          Processing
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      {p.transaction_reference
                        ? `Reference: ${p.transaction_reference} • Auto-verifying with payment gateway`
                        : 'Awaiting automated gateway webhook or payment confirmation.'}
                    </p>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {new Date(p.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Transaction History Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
              Wallet Transaction History
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Detailed chronological record of fund additions, campaign payments, and refunds.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Filter pills */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs font-semibold">
              {[
                { id: 'ALL', label: 'All' },
                { id: 'ADD_FUNDS', label: 'Add Funds' },
                { id: 'CAMPAIGN_PAYMENT', label: 'Campaigns' },
                { id: 'FAILED_PAYMENT', label: 'Failed' },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setFilterType(pill.id)}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    filterType === pill.id
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {pill.label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search transactions..."
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] py-1.5 pl-8 pr-3 text-xs text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Transactions Table */}
        <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] shadow-sm">
          {filteredTransactions.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-500">
                <Receipt className="h-6 w-6" />
              </div>
              <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
                No wallet transactions found
              </p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                {filterType !== 'ALL' || searchQuery
                  ? 'No records match your selected filter or search query.'
                  : 'You have not added any funds to your wallet yet. Click "Add Funds" above to get started.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 font-semibold text-slate-500 dark:text-slate-400">
                  <tr>
                    <th className="py-3.5 pl-6 pr-4">Type & Details</th>
                    <th className="py-3.5 px-4">Transaction / Payment ID</th>
                    <th className="py-3.5 px-4">Date & Time</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 pl-4 pr-6 text-right">Balance After</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300">
                  {filteredTransactions.map((tx) => {
                    const isCredit = tx.type === 'ADD_FUNDS' || tx.type === 'REFUND';
                    const isFailed = tx.status === 'FAILED' || tx.type === 'FAILED_PAYMENT';
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-4 pl-6 pr-4">
                          <div className="space-y-1">
                            <div>{getTransactionTypeBadge(tx.type, tx.status)}</div>
                            <p className="font-semibold text-slate-900 dark:text-white line-clamp-1">
                              {tx.description}
                            </p>
                          </div>
                        </td>

                        <td className="py-4 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                          <div>{tx.id}</div>
                          {tx.gateway_payment_id && (
                            <div className="text-[10px] text-purple-400">{tx.gateway_payment_id}</div>
                          )}
                        </td>

                        <td className="py-4 px-4 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                          {new Date(tx.created_at).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                          <span className="block text-[10px] text-slate-400">
                            {new Date(tx.created_at).toLocaleTimeString('en-IN', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </td>

                        <td className="py-4 px-4 text-right font-extrabold tabular-nums whitespace-nowrap">
                          {isFailed ? (
                            <span className="text-slate-400">₹{tx.amount.toFixed(2)}</span>
                          ) : isCredit ? (
                            <span className="text-emerald-500">+₹{tx.amount.toFixed(2)}</span>
                          ) : (
                            <span className="text-purple-400">-₹{tx.amount.toFixed(2)}</span>
                          )}
                        </td>

                        <td className="py-4 pl-4 pr-6 text-right font-bold text-slate-900 dark:text-white tabular-nums whitespace-nowrap">
                          ₹{tx.balance_after.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Funds Modal */}
      <AddFundsModal
        isOpen={showAddFundsModal}
        onClose={() => setShowAddFundsModal(false)}
        currentBalance={balance}
        recommendedAmount={selectedTopupAmount}
        onSuccess={handleFundsAdded}
      />
    </div>
  );
};
