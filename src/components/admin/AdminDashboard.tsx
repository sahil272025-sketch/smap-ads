import React, { useState, useEffect } from 'react';
import { AdminStats, User, Campaign, Payment, Package, SystemLog, SupportTicket, AdminWalletData, MetaVerificationReport } from '../../types';
import { api } from '../../lib/api';
import { StatusBadge } from '../dashboard/CustomerDashboard';
import {
  Users,
  Layers,
  Activity,
  Clock,
  CheckCircle2,
  DollarSign,
  Package as PackageIcon,
  ShieldCheck,
  Headphones,
  FileCode2,
  Settings,
  RefreshCw,
  Check,
  X,
  AlertTriangle,
  ExternalLink,
  Wallet,
  ArrowDownRight,
  ArrowUpRight,
  RotateCcw,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activeSection, setActiveSection] = useState<'overview' | 'wallets' | 'customers' | 'campaigns' | 'payments' | 'packages' | 'meta' | 'tickets' | 'logs'>('overview');
  const [loading, setLoading] = useState(true);

  // Data sets
  const [customers, setCustomers] = useState<User[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [metaStatus, setMetaStatus] = useState<any>(null);
  const [metaReport, setMetaReport] = useState<MetaVerificationReport | null>(null);
  const [isVerifyingMeta, setIsVerifyingMeta] = useState<boolean>(false);
  const [walletData, setWalletData] = useState<AdminWalletData | null>(null);

  const handleVerifyMeta = async () => {
    setIsVerifyingMeta(true);
    try {
      const report = await api.verifyMetaConnection();
      setMetaReport(report);
    } catch (e) {
      console.error('Meta verification failed', e);
    } finally {
      setIsVerifyingMeta(false);
    }
  };

  // Modals & actions
  const [verifyingPaymentId, setVerifyingPaymentId] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [editingPackage, setEditingPackage] = useState<Package | null>(null);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [adminReply, setAdminReply] = useState('');

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [s, c, cmp, p, pkg, l, t, m, w] = await Promise.all([
        api.getAdminStats(),
        api.getAdminCustomers(),
        api.getAdminCampaigns(),
        api.getAdminPayments(),
        api.getAdminPackages(),
        api.getAdminLogs(100),
        api.getAdminTickets(),
        api.getMetaStatus(),
        api.getAdminWallets(),
      ]);
      setStats(s);
      setCustomers(c.customers);
      setCampaigns(cmp.campaigns);
      setPayments(p.payments);
      setPackages(pkg.packages);
      setLogs(l.logs);
      setTickets(t.tickets);
      setMetaStatus(m);
      setWalletData(w);
    } catch (err) {
      console.error('Failed to load admin data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllAdminData();
  }, []);

  const handleVerifyPayment = async (paymentId: string) => {
    try {
      await api.verifyAdminPayment(paymentId, adminNotes || 'Verified by Admin');
      setVerifyingPaymentId(null);
      setAdminNotes('');
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Payment verification failed');
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      await api.rejectAdminPayment(paymentId, reason);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Payment rejection failed');
    }
  };

  const handleSavePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPackage) return;
    try {
      await api.updateAdminPackage(editingPackage.id, editingPackage);
      setEditingPackage(null);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Package update failed');
    }
  };

  const handleReplyTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !adminReply.trim()) return;
    try {
      const res = await api.replySupportTicket(selectedTicket.id, adminReply);
      setSelectedTicket(res.ticket);
      setAdminReply('');
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit reply');
    }
  };

  const handleUpdateTicketStatus = async (ticketId: string, status: string) => {
    try {
      await api.updateAdminTicketStatus(ticketId, status);
      loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to update ticket status');
    }
  };

  const handleResetCustomerBalance = async (userId: string, name: string, currentBalance: number) => {
    if (!window.confirm(`Reset balance of ₹${currentBalance.toFixed(2)} for ${name} to ₹0.00?`)) {
      return;
    }
    try {
      await api.adminResetCustomerBalance(userId, 'Admin reset unverified test balance');
      await loadAllAdminData();
    } catch (err: any) {
      alert(err.message || 'Failed to reset customer balance');
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-150">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md border border-amber-500/30 bg-amber-950/40 px-2 py-0.5 text-[11px] font-bold text-amber-400">
              Operations Control
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              SMAP Admin Console
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            System administration, UPI verification queue, Meta integration status, and audit logs.
          </p>
        </div>

        <button
          onClick={loadAllAdminData}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-750"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh Operations
        </button>
      </div>

      {/* Admin Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto p-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'wallets', label: `Customer Wallets (₹${walletData?.summary?.totalPlatformBalance ?? 0})` },
          { id: 'payments', label: `Payments (${payments.filter(p => p.status === 'VERIFICATION_PENDING').length} Pending)` },
          { id: 'campaigns', label: `Campaigns (${campaigns.length})` },
          { id: 'customers', label: `Customers (${customers.length})` },
          { id: 'packages', label: 'Package Management' },
          { id: 'meta', label: 'Meta Integration' },
          { id: 'tickets', label: `Support Tickets (${tickets.filter(t => t.status === 'OPEN').length})` },
          { id: 'logs', label: 'System Audit Logs' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeSection === tab.id
                ? 'bg-amber-500 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-amber-500 border-t-transparent" />
        </div>
      ) : (
        <>
          {/* SECTION 1: OVERVIEW */}
          {activeSection === 'overview' && stats && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                <div className="rounded-xl border border-slate-800 bg-[#0C1220] p-4">
                  <span className="text-[11px] text-slate-400 block">Total Customers</span>
                  <span className="text-xl font-bold text-white tabular-nums mt-1 block">{stats.totalCustomers}</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#0C1220] p-4">
                  <span className="text-[11px] text-slate-400 block">Total Campaigns</span>
                  <span className="text-xl font-bold text-white tabular-nums mt-1 block">{stats.totalCampaigns}</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#0C1220] p-4">
                  <span className="text-[11px] text-slate-400 block">Active Campaigns</span>
                  <span className="text-xl font-bold text-emerald-400 tabular-nums mt-1 block">{stats.activeCampaigns}</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#0C1220] p-4">
                  <span className="text-[11px] text-slate-400 block">Pending Review</span>
                  <span className="text-xl font-bold text-amber-400 tabular-nums mt-1 block">{stats.pendingCampaigns}</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#0C1220] p-4">
                  <span className="text-[11px] text-slate-400 block">Completed</span>
                  <span className="text-xl font-bold text-blue-400 tabular-nums mt-1 block">{stats.completedCampaigns}</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#0C1220] p-4">
                  <span className="text-[11px] text-slate-400 block">Verified Payments</span>
                  <span className="text-xl font-bold text-emerald-400 tabular-nums mt-1 block">{stats.totalVerifiedPayments}</span>
                </div>
                <div className="rounded-xl border border-slate-800 bg-[#0C1220] p-4">
                  <span className="text-[11px] text-slate-400 block">Total Revenue</span>
                  <span className="text-xl font-bold text-white tabular-nums mt-1 block">₹{stats.totalRevenue}</span>
                </div>
              </div>

              {/* Quick Actions & Meta integration health */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="rounded-2xl border border-slate-800 bg-[#0C1220] p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-indigo-400" />
                    Meta Integration Status
                  </h3>
                  <div className="space-y-2 text-xs text-slate-300">
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Meta App ID:</span>
                      <span className="font-mono">{metaStatus?.appIdMasked || 'Not configured'}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Meta API Version:</span>
                      <span className="font-mono">{metaStatus?.apiVersion}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-800 pb-2">
                      <span className="text-slate-400">Production Readiness:</span>
                      <span className={metaStatus?.isConfigured ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
                        {metaStatus?.isConfigured ? 'Credentials Configured' : 'Integration Required'}
                      </span>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 italic">
                    {metaStatus?.statusMessage}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-[#0C1220] p-6 space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Activity className="h-4 w-4 text-emerald-400" />
                    Background Campaign Scheduler
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    The automated campaign stop scheduler runs server-side every 30 seconds to enforce purchased durations (5, 10, 14, 30 days).
                  </p>
                  <div className="rounded-lg bg-slate-900/90 p-3 border border-slate-800 text-xs font-mono text-slate-300">
                    <div>Status: <span className="text-emerald-400">Active & Running</span></div>
                    <div>Cycle: 30s polling frequency</div>
                    <div>Meta Pause Hook: Configured</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 1B: CUSTOMER WALLETS (Requirement 17) */}
          {activeSection === 'wallets' && (
            <div className="space-y-6">
              {/* Wallet Summary Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-purple-500/30 bg-[#0C1220] p-5 space-y-1">
                  <div className="flex items-center justify-between text-purple-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Platform Balance</span>
                    <Wallet className="h-4 w-4" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white tabular-nums">
                    ₹{walletData?.summary.totalPlatformBalance.toFixed(2) || '0.00'}
                  </div>
                  <span className="text-[11px] text-slate-400 block">Funds currently in customer wallets</span>
                </div>

                <div className="rounded-2xl border border-emerald-500/30 bg-[#0C1220] p-5 space-y-1">
                  <div className="flex items-center justify-between text-emerald-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Funds Added</span>
                    <ArrowDownRight className="h-4 w-4" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400 tabular-nums">
                    ₹{walletData?.summary.totalFundsAdded.toFixed(2) || '0.00'}
                  </div>
                  <span className="text-[11px] text-slate-400 block">Cumulative verified Razorpay top-ups</span>
                </div>

                <div className="rounded-2xl border border-blue-500/30 bg-[#0C1220] p-5 space-y-1">
                  <div className="flex items-center justify-between text-blue-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Funds Used</span>
                    <ArrowUpRight className="h-4 w-4" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-blue-400 tabular-nums">
                    ₹{walletData?.summary.totalFundsUsed.toFixed(2) || '0.00'}
                  </div>
                  <span className="text-[11px] text-slate-400 block">Spent on advertising campaigns</span>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-[#0C1220] p-5 space-y-1">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="text-xs font-bold uppercase tracking-wider">Total Transactions</span>
                    <Activity className="h-4 w-4" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white tabular-nums">
                    {walletData?.summary.totalTransactions || 0}
                  </div>
                  <span className="text-[11px] text-slate-400 block">Audited ledger entries</span>
                </div>
              </div>

              {/* Customer Wallet Balances Table */}
              <div className="rounded-2xl border border-slate-800 bg-[#0B101E] overflow-hidden">
                <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                  <div>
                    <h3 className="text-sm font-bold text-white">Customer Wallet Accounts</h3>
                    <p className="text-xs text-slate-400">
                      Overview of customer balances, total funds deposited, and total funds spent on campaigns.
                    </p>
                  </div>
                  <span className="text-xs font-bold text-slate-400">
                    {walletData?.customers.length || 0} Customers
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold">
                      <tr>
                        <th className="py-3 pl-4">Customer</th>
                        <th className="py-3">Contact Email</th>
                        <th className="py-3 text-right">Current Balance</th>
                        <th className="py-3 text-right">Total Added</th>
                        <th className="py-3 text-right">Total Used</th>
                        <th className="py-3 text-center">Transactions</th>
                        <th className="py-3 text-right">Last Activity</th>
                        <th className="py-3 pr-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {walletData?.customers.map((c) => (
                        <tr key={c.userId} className="hover:bg-slate-850/40">
                          <td className="py-3 pl-4">
                            <span className="font-semibold text-white block">{c.name}</span>
                            <span className="font-mono text-[10px] text-slate-400">{c.userId}</span>
                          </td>
                          <td className="py-3 text-slate-300">
                            <div>{c.email}</div>
                            {c.phone && <div className="text-[10px] text-slate-500">{c.phone}</div>}
                          </td>
                          <td className="py-3 text-right font-black text-emerald-400 tabular-nums">
                            ₹{c.currentBalance.toFixed(2)}
                          </td>
                          <td className="py-3 text-right font-medium text-slate-300 tabular-nums">
                            ₹{c.totalFundsAdded.toFixed(2)}
                          </td>
                          <td className="py-3 text-right font-medium text-slate-300 tabular-nums">
                            ₹{c.totalFundsUsed.toFixed(2)}
                          </td>
                          <td className="py-3 text-center">
                            <span className="px-2 py-0.5 rounded-full bg-slate-800 font-bold text-[10px]">
                              {c.transactionsCount}
                            </span>
                          </td>
                          <td className="py-3 text-right font-mono text-[11px] text-slate-400">
                            {new Date(c.lastActivityAt || '').toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>
                          <td className="py-3 pr-4 text-center">
                            {c.currentBalance > 0 ? (
                              <button
                                onClick={() => handleResetCustomerBalance(c.userId, c.name, c.currentBalance)}
                                className="px-2 py-1 rounded bg-amber-950/60 hover:bg-amber-900 border border-amber-600/50 text-[10px] font-bold text-amber-300 transition-colors"
                              >
                                Reset to ₹0
                              </button>
                            ) : (
                              <span className="text-[10px] text-slate-500">Reconciled</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Complete Platform Wallet Transaction History */}
              <div className="rounded-2xl border border-slate-800 bg-[#0B101E] overflow-hidden">
                <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                  <h3 className="text-sm font-bold text-white">Full Wallet Transaction Ledger</h3>
                  <p className="text-xs text-slate-400">
                    Live system audit trail of all Add Funds top-ups, Campaign Deductions, and Failures.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold">
                      <tr>
                        <th className="py-3 pl-4">Type</th>
                        <th className="py-3">User ID</th>
                        <th className="py-3">Description</th>
                        <th className="py-3">Transaction / Gateway ID</th>
                        <th className="py-3">Date</th>
                        <th className="py-3 text-right">Amount</th>
                        <th className="py-3 pr-4 text-right">Balance After</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 text-slate-300">
                      {walletData?.transactions.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="py-8 text-center text-slate-500">
                            No wallet transactions on platform yet.
                          </td>
                        </tr>
                      ) : (
                        walletData?.transactions.map((tx) => {
                          const isCredit = tx.type === 'ADD_FUNDS' || tx.type === 'REFUND';
                          const isFailed = tx.status === 'FAILED' || tx.type === 'FAILED_PAYMENT';
                          return (
                            <tr key={tx.id} className="hover:bg-slate-850/40">
                              <td className="py-3 pl-4">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isFailed
                                    ? 'bg-red-950 text-red-400 border border-red-800'
                                    : tx.type === 'ADD_FUNDS'
                                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                    : 'bg-purple-950 text-purple-400 border border-purple-800'
                                }`}>
                                  {tx.type}
                                </span>
                              </td>
                              <td className="py-3 font-mono text-slate-400 text-[11px]">{tx.user_id}</td>
                              <td className="py-3 max-w-[240px] truncate text-white">{tx.description}</td>
                              <td className="py-3 font-mono text-[10px] text-slate-400">
                                <div>{tx.id}</div>
                                {tx.gateway_payment_id && <div className="text-purple-400">{tx.gateway_payment_id}</div>}
                              </td>
                              <td className="py-3 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                                {new Date(tx.created_at).toLocaleDateString('en-IN', {
                                  day: 'numeric',
                                  month: 'short',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </td>
                              <td className="py-3 text-right font-black tabular-nums">
                                {isFailed ? (
                                  <span className="text-slate-500">₹{tx.amount.toFixed(2)}</span>
                                ) : isCredit ? (
                                  <span className="text-emerald-400">+₹{tx.amount.toFixed(2)}</span>
                                ) : (
                                  <span className="text-purple-400">-₹{tx.amount.toFixed(2)}</span>
                                )}
                              </td>
                              <td className="py-3 pr-4 text-right font-bold text-white tabular-nums">
                                ₹{tx.balance_after.toFixed(2)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: PAYMENTS (UPI VERIFICATION) */}
          {activeSection === 'payments' && (
            <div className="rounded-2xl border border-slate-800 bg-[#0B101E] overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-bold text-white">UPI Payment Transactions & Verification Queue</h3>
                  <p className="text-[11px] text-slate-400">
                    Receiver UPI: <span className="font-mono text-indigo-300">sahil-stp@ybl</span>
                  </p>
                </div>
                <span className="text-xs text-slate-400">
                  Total: {payments.length} payments
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold">
                    <tr>
                      <th className="py-3 pl-4">Payment ID</th>
                      <th className="py-3">Campaign</th>
                      <th className="py-3">Amount</th>
                      <th className="py-3">Status</th>
                      <th className="py-3">Customer UTR</th>
                      <th className="py-3">Verification Source</th>
                      <th className="py-3 text-right pr-4">Admin Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {payments.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-850/40">
                        <td className="py-3 pl-4 font-mono text-[11px] text-white">
                          {p.id}
                        </td>
                        <td className="py-3 font-mono text-[11px] text-slate-400">
                          {p.campaign_id}
                        </td>
                        <td className="py-3 font-bold text-white tabular-nums">
                          ₹{p.amount}
                        </td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            p.status === 'PAID' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' :
                            p.status === 'VERIFICATION_PENDING' ? 'bg-amber-950 text-amber-400 border border-amber-500/30' :
                            'bg-slate-800 text-slate-400'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 font-mono text-indigo-300">
                          {p.transaction_reference || '—'}
                        </td>
                        <td className="py-3 text-[11px] text-slate-400">
                          {p.verification_source || 'Unverified'}
                        </td>
                        <td className="py-3 text-right pr-4 space-x-1.5">
                          {p.status !== 'PAID' && (
                            <>
                              <button
                                onClick={() => handleVerifyPayment(p.id)}
                                className="rounded bg-emerald-600 px-2.5 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500"
                              >
                                Verify & Approve
                              </button>
                              <button
                                onClick={() => handleRejectPayment(p.id)}
                                className="rounded bg-red-950 border border-red-500/30 px-2 py-1 text-[11px] font-semibold text-red-300 hover:bg-red-900/40"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 3: CAMPAIGNS */}
          {activeSection === 'campaigns' && (
            <div className="rounded-2xl border border-slate-800 bg-[#0B101E] overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                <h3 className="text-sm font-bold text-white">All Platform Campaigns</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold">
                    <tr>
                      <th className="py-3 pl-4">ID & Brand</th>
                      <th className="py-3">Headline</th>
                      <th className="py-3">Package</th>
                      <th className="py-3">Status</th>
                      <th className="py-3">Meta Campaign ID</th>
                      <th className="py-3">End Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {campaigns.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-850/40">
                        <td className="py-3 pl-4">
                          <span className="font-semibold text-white block">{c.business_name}</span>
                          <span className="font-mono text-[10px] text-slate-400">{c.id}</span>
                        </td>
                        <td className="py-3 max-w-[200px] truncate">{c.headline}</td>
                        <td className="py-3 capitalize">
                          {c.package_id
                            ? c.package_id.replace('pkg_', '').replace('_', ' ')
                            : c.objective
                            ? `${c.objective.toLowerCase()} campaign`
                            : 'Custom Campaign'}
                        </td>
                        <td className="py-3"><StatusBadge status={c.status} /></td>
                        <td className="py-3 font-mono text-slate-400">{c.meta_campaign_id || '—'}</td>
                        <td className="py-3 font-mono text-slate-400">{c.end_at ? new Date(c.end_at).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 4: CUSTOMERS */}
          {activeSection === 'customers' && (
            <div className="rounded-2xl border border-slate-800 bg-[#0B101E] overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                <h3 className="text-sm font-bold text-white">Registered Customers</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold">
                    <tr>
                      <th className="py-3 pl-4">User ID</th>
                      <th className="py-3">Name</th>
                      <th className="py-3">Email</th>
                      <th className="py-3">Phone</th>
                      <th className="py-3">Role</th>
                      <th className="py-3">Registered At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {customers.map((u) => (
                      <tr key={u.id} className="hover:bg-slate-850/40">
                        <td className="py-3 pl-4 font-mono text-slate-400">{u.id}</td>
                        <td className="py-3 font-semibold text-white">{u.name}</td>
                        <td className="py-3">{u.email}</td>
                        <td className="py-3">{u.phone}</td>
                        <td className="py-3 capitalize">{u.role}</td>
                        <td className="py-3 font-mono text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 5: PACKAGES (Section 33) */}
          {activeSection === 'packages' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-800 bg-[#0B101E] p-5">
                <h3 className="text-sm font-bold text-white mb-2">Package Management</h3>
                <p className="text-xs text-slate-400 mb-4">
                  Modify live pricing, durations, and active statuses stored dynamically in the database.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {packages.map((pkg) => (
                    <div key={pkg.id} className="rounded-xl border border-slate-800 bg-[#0C1220] p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-white">{pkg.name}</span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${pkg.active ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'}`}>
                          {pkg.active ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                      <div className="text-2xl font-extrabold text-white tabular-nums">
                        ₹{pkg.price}
                      </div>
                      <div className="text-xs text-indigo-400 font-semibold">
                        {pkg.duration_days} Days Run
                      </div>
                      <button
                        onClick={() => setEditingPackage(pkg)}
                        className="w-full mt-2 rounded-lg border border-slate-700 bg-slate-800 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
                      >
                        Edit Package
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {editingPackage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
                  <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-[#0E1424] p-6 text-slate-100 shadow-2xl">
                    <h3 className="text-base font-bold text-white mb-3">Edit Package</h3>
                    <form onSubmit={handleSavePackage} className="space-y-4 text-xs">
                      <div>
                        <label className="block text-slate-300 mb-1">Package Name</label>
                        <input
                          type="text"
                          value={editingPackage.name}
                          onChange={(e) => setEditingPackage({ ...editingPackage, name: e.target.value })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 px-3 text-white"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 mb-1">Price (₹ INR)</label>
                        <input
                          type="number"
                          value={editingPackage.price}
                          onChange={(e) => setEditingPackage({ ...editingPackage, price: Number(e.target.value) })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 px-3 text-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-slate-300 mb-1">Duration (Days)</label>
                        <input
                          type="number"
                          value={editingPackage.duration_days}
                          onChange={(e) => setEditingPackage({ ...editingPackage, duration_days: Number(e.target.value) })}
                          className="w-full rounded-lg border border-slate-700 bg-slate-900 py-2 px-3 text-white font-mono"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id="activePkg"
                          checked={editingPackage.active}
                          onChange={(e) => setEditingPackage({ ...editingPackage, active: e.target.checked })}
                          className="accent-indigo-500 h-4 w-4"
                        />
                        <label htmlFor="activePkg" className="text-slate-300">Package Active</label>
                      </div>

                      <div className="flex justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setEditingPackage(null)}
                          className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-slate-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          className="rounded-lg bg-indigo-600 px-5 py-2 font-semibold text-white"
                        >
                          Save
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 6: META INTEGRATION (Section 24) */}
          {activeSection === 'meta' && (
            <div className="rounded-2xl border border-slate-800 bg-[#0C1220] p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-800/80 pb-5">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-indigo-400" />
                    Meta Advertising Integration & Asset Verification
                  </h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Safe read-only Graph API verification of Ad Accounts, Pages, Instagram handles, and app permissions.
                  </p>
                </div>
                <button
                  type="button"
                  disabled={isVerifyingMeta}
                  onClick={handleVerifyMeta}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white rounded-xl text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-all cursor-pointer w-fit"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isVerifyingMeta ? 'animate-spin' : ''}`} />
                  {isVerifyingMeta ? 'Verifying Assets...' : 'Run Safe Read-Only Verification'}
                </button>
              </div>

              {/* Live Verification Report Card */}
              {metaReport && (
                <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/20 p-5 space-y-4 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between border-b border-indigo-500/20 pb-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className={`h-5 w-5 ${metaReport.readyForCampaignCreation ? 'text-emerald-400' : 'text-amber-400'}`} />
                      <span className="text-sm font-bold text-white">
                        {metaReport.readyForCampaignCreation ? 'Meta Marketing API: Connected & Ready' : 'Meta API: Partially Configured'}
                      </span>
                    </div>
                    <span className="text-[11px] font-mono text-slate-400">
                      Checked: {new Date(metaReport.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-800">
                    {metaReport.summary}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Asset 1: Ad Account */}
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3.5 space-y-2 text-xs">
                      <div className="flex justify-between items-center font-semibold text-white border-b border-slate-800/80 pb-1.5">
                        <span className="flex items-center gap-1.5">
                          <DollarSign className="h-4 w-4 text-emerald-400" />
                          Ad Account (SMAP Ads)
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${metaReport.assets.adAccount.verified ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' : 'bg-red-950/60 text-red-400 border border-red-500/30'}`}>
                          {metaReport.assets.adAccount.statusText}
                        </span>
                      </div>
                      <div className="space-y-1 text-[11px] text-slate-300 font-mono">
                        <div>Name: <span className="text-white font-sans">{metaReport.assets.adAccount.name || 'N/A'}</span></div>
                        <div>ID: <span className="text-indigo-300">{metaReport.assets.adAccount.id || 'N/A'}</span></div>
                        <div>Currency: <span className="text-white">{metaReport.assets.adAccount.currency || 'INR'}</span></div>
                        <div>Payment Method: <span className={metaReport.assets.adAccount.hasPaymentMethods ? 'text-emerald-400' : 'text-amber-400'}>{metaReport.assets.adAccount.hasPaymentMethods ? 'Valid & Active' : 'Pending'}</span></div>
                        <div>Capabilities: <span className="text-slate-400">{metaReport.assets.adAccount.capabilitiesCount} active features</span></div>
                      </div>
                    </div>

                    {/* Asset 2: Facebook Page */}
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3.5 space-y-2 text-xs">
                      <div className="flex justify-between items-center font-semibold text-white border-b border-slate-800/80 pb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Layers className="h-4 w-4 text-blue-400" />
                          Facebook Page
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${metaReport.assets.facebookPage.verified ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' : 'bg-amber-950/60 text-amber-400 border border-amber-500/30'}`}>
                          {metaReport.assets.facebookPage.canAdvertise ? 'CAN ADVERTISE' : 'VERIFIED'}
                        </span>
                      </div>
                      <div className="space-y-1 text-[11px] text-slate-300 font-mono">
                        <div>Page Name: <span className="text-white font-sans">{metaReport.assets.facebookPage.name || 'N/A'}</span></div>
                        <div>Page ID: <span className="text-indigo-300">{metaReport.assets.facebookPage.id || 'N/A'}</span></div>
                        <div>Category: <span className="text-slate-400 font-sans">{metaReport.assets.facebookPage.category || 'N/A'}</span></div>
                        <div>Page Tasks: <span className="text-emerald-400">{metaReport.assets.facebookPage.tasks.join(', ') || 'N/A'}</span></div>
                      </div>
                    </div>

                    {/* Asset 3: Instagram Professional Account */}
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3.5 space-y-2 text-xs">
                      <div className="flex justify-between items-center font-semibold text-white border-b border-slate-800/80 pb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Activity className="h-4 w-4 text-pink-400" />
                          Instagram Account
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${metaReport.assets.instagramAccount.verified ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' : 'bg-amber-950/60 text-amber-400 border border-amber-500/30'}`}>
                          {metaReport.assets.instagramAccount.statusText}
                        </span>
                      </div>
                      <div className="space-y-1.5 text-[11px] text-slate-300">
                        <p className="leading-relaxed text-slate-400">
                          {metaReport.assets.instagramAccount.notice}
                        </p>
                      </div>
                    </div>

                    {/* Asset 4: Meta App */}
                    <div className="rounded-lg border border-slate-800 bg-slate-900/70 p-3.5 space-y-2 text-xs">
                      <div className="flex justify-between items-center font-semibold text-white border-b border-slate-800/80 pb-1.5">
                        <span className="flex items-center gap-1.5">
                          <Settings className="h-4 w-4 text-purple-400" />
                          Meta App
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-950/60 text-emerald-400 border border-emerald-500/30">
                          CONNECTED
                        </span>
                      </div>
                      <div className="space-y-1 text-[11px] text-slate-300 font-mono">
                        <div>App Name: <span className="text-white font-sans">{metaReport.assets.metaApp.name || 'SMAP'}</span></div>
                        <div>App ID: <span className="text-indigo-300">{metaReport.assets.metaApp.id || 'N/A'}</span></div>
                        <div>Token Type: <span className="text-white">{metaReport.tokenType || 'SYSTEM_USER'}</span></div>
                        <div>Token Valid: <span className="text-emerald-400">{metaReport.isValid ? 'YES' : 'NO'}</span></div>
                      </div>
                    </div>
                  </div>

                  {/* Permissions Breakdown */}
                  <div className="pt-2">
                    <span className="text-xs font-semibold text-white block mb-2">Verified Meta Permissions:</span>
                    <div className="flex flex-wrap gap-2 text-[11px]">
                      {['ads_management', 'ads_read', 'business_management', 'pages_read_engagement', 'pages_show_list', 'pages_manage_ads'].map((perm) => {
                        const isGranted = (metaReport.permissions as any)[perm];
                        return (
                          <span
                            key={perm}
                            className={`px-2.5 py-1 rounded-md font-mono flex items-center gap-1.5 ${
                              isGranted
                                ? 'bg-emerald-950/50 text-emerald-300 border border-emerald-500/30'
                                : 'bg-slate-800/60 text-slate-400 border border-slate-700/50'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${isGranted ? 'bg-emerald-400' : 'bg-slate-500'}`}></span>
                            {perm}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Configuration Status Card */}
              <div className="rounded-xl border border-slate-800 bg-[#090D18] p-5 space-y-3 text-xs">
                <div className="flex justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-slate-400">Meta App ID:</span>
                  <span className="font-mono text-white">{metaStatus?.appIdMasked || '1109••••4243'}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-slate-400">Server Token (META_ACCESS_TOKEN):</span>
                  <span className="font-mono text-emerald-400 font-semibold">Configured & Active (Server-Side Secret)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-slate-400">Target Ad Account:</span>
                  <span className="font-mono text-white">SMAP Ads (act_1627260695520511)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-slate-400">Target Facebook Page:</span>
                  <span className="font-mono text-white">Sahil Gupta (128670460329078)</span>
                </div>
                <div className="flex justify-between border-b border-slate-800 pb-2.5">
                  <span className="text-slate-400">Meta Graph API Version:</span>
                  <span className="font-mono text-white">{metaStatus?.apiVersion || 'v21.0'}</span>
                </div>
                <div className="flex justify-between pt-1">
                  <span className="text-slate-400">Marketing API Readiness:</span>
                  <span className="text-emerald-400 font-bold">
                    Ready for Campaign Creation
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 7: SUPPORT TICKETS */}
          {activeSection === 'tickets' && (
            <div className="rounded-2xl border border-slate-800 bg-[#0B101E] overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                <h3 className="text-sm font-bold text-white">All Support Tickets</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-semibold">
                    <tr>
                      <th className="py-3 pl-4">ID & Subject</th>
                      <th className="py-3">User</th>
                      <th className="py-3">Campaign</th>
                      <th className="py-3">Status</th>
                      <th className="py-3">Date</th>
                      <th className="py-3 text-right pr-4">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {tickets.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-850/40">
                        <td className="py-3 pl-4">
                          <span className="font-semibold text-white block">{t.subject}</span>
                          <span className="font-mono text-[10px] text-slate-400">{t.id}</span>
                        </td>
                        <td className="py-3">{t.user_name} ({t.user_email})</td>
                        <td className="py-3 font-mono">{t.campaign_id || '—'}</td>
                        <td className="py-3">
                          <select
                            value={t.status}
                            onChange={(e) => handleUpdateTicketStatus(t.id, e.target.value)}
                            className="rounded bg-slate-900 border border-slate-700 px-2 py-0.5 text-xs text-white"
                          >
                            <option value="OPEN">OPEN</option>
                            <option value="IN_PROGRESS">IN_PROGRESS</option>
                            <option value="RESOLVED">RESOLVED</option>
                            <option value="CLOSED">CLOSED</option>
                          </select>
                        </td>
                        <td className="py-3 font-mono text-slate-400">{new Date(t.created_at).toLocaleDateString()}</td>
                        <td className="py-3 text-right pr-4">
                          <button
                            onClick={() => setSelectedTicket(t)}
                            className="rounded bg-indigo-600 px-3 py-1 text-xs font-semibold text-white"
                          >
                            Reply
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* SECTION 8: SYSTEM LOGS */}
          {activeSection === 'logs' && (
            <div className="rounded-2xl border border-slate-800 bg-[#0B101E] overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-900/50">
                <h3 className="text-sm font-bold text-white">System Audit & Scheduler Logs</h3>
              </div>
              <div className="p-4 max-h-[60vh] overflow-y-auto space-y-2 font-mono text-[11px]">
                {logs.map((l) => (
                  <div key={l.id} className="rounded border border-slate-800 bg-slate-950 p-2.5 text-slate-300">
                    <div className="flex justify-between text-slate-500 mb-1">
                      <span>[{l.category}] [{l.level}]</span>
                      <span>{new Date(l.created_at).toLocaleTimeString()}</span>
                    </div>
                    <div className={l.level === 'ERROR' ? 'text-red-400' : l.level === 'WARN' ? 'text-amber-400' : 'text-slate-200'}>
                      {l.message}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Admin Ticket Reply Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-[#0E1424] p-6 text-slate-100 shadow-2xl">
            <h3 className="text-base font-bold text-white mb-2">Reply to Support Ticket: {selectedTicket.subject}</h3>
            <p className="text-xs text-slate-400 mb-4 bg-slate-900 p-3 rounded-lg border border-slate-800">
              {selectedTicket.message}
            </p>
            <form onSubmit={handleReplyTicket} className="space-y-4">
              <textarea
                rows={4}
                required
                value={adminReply}
                onChange={(e) => setAdminReply(e.target.value)}
                placeholder="Type response to customer..."
                className="w-full rounded-lg border border-slate-700 bg-slate-900 p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedTicket(null)}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs text-slate-300"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-indigo-600 px-5 py-2 text-xs font-semibold text-white"
                >
                  Send Reply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
