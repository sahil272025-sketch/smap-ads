import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Campaign, Payment } from '../../types';
import { api } from '../../lib/api';
import { AddFundsModal } from './AddFundsModal';
import {
  Plus,
  ArrowRight,
  ShieldCheck,
  Layers,
  Play,
  Clock,
  CheckCircle2,
  Wallet,
  BarChart3,
  ChevronRight,
  ChevronDown,
  Crown,
  Send,
  Rocket,
  Briefcase,
  Gem,
  Check,
  ExternalLink,
  Box,
} from 'lucide-react';

interface CustomerDashboardProps {
  onNavigate: (tab: string) => void;
  onOpenCampaign: (campaignId: string) => void;
  onSelectPackage?: (pkgId: string) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({
  onNavigate,
  onOpenCampaign,
  onSelectPackage,
}) => {
  const { user, metaConnection } = useAuth();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [showAddFundsModal, setShowAddFundsModal] = useState(false);
  const [selectedQuickAmount, setSelectedQuickAmount] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [analyticsPeriod, setAnalyticsPeriod] = useState<'7d' | '30d' | 'all'>('7d');

  useEffect(() => {
    Promise.all([api.getCampaigns(), api.getPayments(), api.getWalletBalance()])
      .then(([cmpRes, payRes, walRes]) => {
        setCampaigns(cmpRes.campaigns || []);
        setPayments(payRes.payments || []);
        setWalletBalance(walRes.balance || 0);
      })
      .catch((err) => console.error('Dashboard load error', err))
      .finally(() => setLoading(false));
  }, []);

  const totalCampaigns = campaigns.length;
  const activeCampaigns = campaigns.filter((c) => c.status === 'ACTIVE').length;
  const pendingCampaigns = campaigns.filter((c) =>
    ['DRAFT', 'PAYMENT_PENDING', 'PAYMENT_CONFIRMED', 'SUBMITTING', 'UNDER_REVIEW'].includes(c.status)
  ).length;
  const completedCampaigns = campaigns.filter((c) => c.status === 'COMPLETED').length;

  const totalSpent = payments
    .filter((p) => p.status === 'PAID')
    .reduce((sum, p) => sum + p.amount, 0);

  const displayName = user?.name || 'Sahil Gupta';

  const packages = [
    {
      id: 'starter_sprint',
      name: 'Starter Sprint',
      price: 200,
      duration: '5 Days Active Run',
      icon: <Send className="h-4 w-4" />,
      popular: false,
      features: [
        'Facebook + Instagram ads',
        'Target audience setup',
        'Campaign management',
        'Live status tracking',
        'Instant UPI checkout',
      ],
    },
    {
      id: 'growth_accelerate',
      name: 'Growth Accelerate',
      price: 399,
      duration: '10 Days Active Run',
      icon: <Rocket className="h-4 w-4 text-purple-400" />,
      popular: true,
      features: [
        'Facebook + Instagram ads',
        'Target audience setup',
        'Campaign management',
        'Live status tracking',
        'Instant UPI checkout',
      ],
    },
    {
      id: 'business_pro',
      name: 'Business Pro',
      price: 549,
      duration: '14 Days Active Run',
      icon: <Briefcase className="h-4 w-4" />,
      popular: false,
      features: [
        'Facebook + Instagram ads',
        'Target audience setup',
        'Campaign management',
        'Live status tracking',
        'Instant UPI checkout',
      ],
    },
    {
      id: 'enterprise_scale',
      name: 'Enterprise Scale',
      price: 749,
      duration: '30 Days Active Run',
      icon: <Gem className="h-4 w-4" />,
      popular: false,
      features: [
        'Facebook + Instagram ads',
        'Target audience setup',
        'Campaign management',
        'Live status tracking',
        'Instant UPI checkout',
      ],
    },
  ];

  const handleChoosePackage = (pkgId: string) => {
    if (onSelectPackage) {
      onSelectPackage(pkgId);
    }
    onNavigate('create-ad');
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* 1. Welcome Section with FB & IG Glassy Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pt-2">
        <div className="space-y-1.5 max-w-xl">
          <p className="text-xs sm:text-sm font-medium text-slate-500 dark:text-slate-400">
            Welcome back,
          </p>
          <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>{displayName}</span>
            <span className="text-2xl sm:text-3xl">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Manage your Facebook & Instagram advertising campaigns with SMAP. Reach the right audience and grow your business.
          </p>
        </div>

        {/* 3D Glassy Facebook & Instagram Showcase Badges */}
        <div className="flex items-center gap-3 self-start md:self-center">
          <div className="relative group">
            <div className="absolute -inset-1 rounded-2xl bg-purple-600/30 blur-lg group-hover:bg-purple-600/50 transition-all opacity-70"></div>
            <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0D121F]/90 shadow-xl backdrop-blur-md">
              <svg className="h-7 w-7 sm:h-8 sm:w-8 text-slate-900 dark:text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
            </div>
          </div>

          <div className="relative group">
            <div className="absolute -inset-1 rounded-2xl bg-pink-600/30 blur-lg group-hover:bg-pink-600/50 transition-all opacity-70"></div>
            <div className="relative flex h-14 w-14 sm:h-16 sm:w-16 items-center justify-center rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-[#0D121F]/90 shadow-xl backdrop-blur-md">
              <svg className="h-7 w-7 sm:h-8 sm:w-8 text-slate-900 dark:text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Create New Ad Campaign Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] p-4 sm:p-6 shadow-sm hover:border-purple-500/40 transition-all">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white">
              <Plus className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Create New Ad Campaign
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                Launch your Facebook & Instagram ad campaign in minutes
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('create-ad')}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold text-white shadow-lg shadow-purple-600/25 hover:bg-purple-500 active:scale-95 transition-all whitespace-nowrap self-start sm:self-center"
          >
            <span>Create New Ad</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Prominent Available Fund Balance Box (Requirements 1, 2, 7) */}
      <div className="relative overflow-hidden rounded-3xl border border-purple-500/30 bg-gradient-to-br from-[#120D26] via-[#0E1324] to-[#0A0D18] p-5 sm:p-7 shadow-xl shadow-purple-950/20">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-56 h-56 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 -mb-12 w-40 h-40 bg-pink-600/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600/20 text-purple-400 border border-purple-500/30">
                <Wallet className="h-4 w-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-purple-300">
                Available Fund Balance
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-400 border border-emerald-500/20">
                <ShieldCheck className="h-3 w-3" />
                Live Wallet
              </span>
            </div>

            <div className="flex items-baseline gap-2.5">
              <span className="text-3xl sm:text-5xl font-black tracking-tight text-white tabular-nums">
                ₹{walletBalance.toFixed(2)}
              </span>
              <span className="text-xs font-bold text-purple-300 uppercase tracking-widest">
                INR
              </span>
            </div>

            <p className="text-xs text-slate-400 max-w-lg leading-relaxed">
              Add funds anytime before creating or launching advertising campaigns. Your balance is instantly available for campaign checkouts.
            </p>

            {/* Quick top-up chips */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <span className="text-[11px] font-semibold text-slate-400">Quick Add:</span>
              {[1, 10, 100, 200, 500, 1000].map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => {
                    setSelectedQuickAmount(amt);
                    setShowAddFundsModal(true);
                  }}
                  className="px-2.5 py-1 rounded-lg text-xs font-bold bg-white/10 hover:bg-purple-600 text-white border border-white/10 hover:border-purple-500 transition-all active:scale-95"
                >
                  +₹{amt}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col gap-3 shrink-0">
            <button
              onClick={() => {
                setSelectedQuickAmount(undefined);
                setShowAddFundsModal(true);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-purple-600 px-6 py-3.5 text-xs sm:text-sm font-extrabold text-white shadow-xl shadow-purple-600/35 hover:bg-purple-500 active:scale-95 transition-all whitespace-nowrap"
            >
              <Plus className="h-4 w-4" />
              <span>Add Funds</span>
            </button>

            <button
              onClick={() => onNavigate('wallet')}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              <Clock className="h-3.5 w-3.5 text-purple-400" />
              <span>Wallet History</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Meta Advertising Account Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-white">
              {/* Meta Loop Icon */}
              <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"/>
              </svg>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                  Meta Advertising Account
                </h3>
                {metaConnection?.connected ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
                    Connected
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-full bg-red-500/10 dark:bg-red-950/40 px-2.5 py-0.5 text-[10px] font-bold text-red-600 dark:text-red-400 border border-red-500/20">
                    Not Connected
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-2xl leading-relaxed">
                Connect your Meta account to run Facebook & Instagram ads directly from SMAP. It's secure and only you can access your account.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 pt-1">
                <ShieldCheck className="h-3.5 w-3.5 text-slate-400" />
                <span>Your data is safe & secure</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('profile')}
            className="inline-flex items-center justify-center rounded-xl bg-purple-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-purple-600/25 hover:bg-purple-500 active:scale-95 transition-all whitespace-nowrap self-start sm:self-center"
          >
            {metaConnection?.connected ? 'Manage Account' : 'Connect Meta Account'}
          </button>
        </div>
      </div>

      {/* 4. Four Metric Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Campaigns */}
        <div
          onClick={() => onNavigate('my-campaigns')}
          className="group cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] p-5 shadow-sm hover:border-purple-500/40 transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
              <Layers className="h-4 w-4" />
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Campaigns
          </p>
          <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            {totalCampaigns}
          </div>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            All registered drafts
          </p>
        </div>

        {/* Active Campaigns */}
        <div
          onClick={() => onNavigate('my-campaigns')}
          className="group cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] p-5 shadow-sm hover:border-purple-500/40 transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
              <Play className="h-4 w-4" />
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            Active Campaigns
          </p>
          <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {activeCampaigns}
          </div>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            Running on Meta
          </p>
        </div>

        {/* Pending Review */}
        <div
          onClick={() => onNavigate('my-campaigns')}
          className="group cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] p-5 shadow-sm hover:border-purple-500/40 transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
              <Clock className="h-4 w-4" />
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            Pending Review
          </p>
          <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-amber-500 dark:text-amber-400 tabular-nums">
            {pendingCampaigns}
          </div>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            Awaiting approval
          </p>
        </div>

        {/* Completed */}
        <div
          onClick={() => onNavigate('my-campaigns')}
          className="group cursor-pointer rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] p-5 shadow-sm hover:border-purple-500/40 transition-all"
        >
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
              <CheckCircle2 className="h-4 w-4" />
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
          </div>
          <p className="mt-4 text-xs font-medium text-slate-500 dark:text-slate-400">
            Completed
          </p>
          <div className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
            {completedCampaigns}
          </div>
          <p className="mt-1 text-[11px] text-slate-400 dark:text-slate-500">
            Successfully finished
          </p>
        </div>
      </div>

      {/* 5. Analytics Row (Total Spent + Campaign Performance) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Total Spent Trend */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                  <Wallet className="h-4 w-4" />
                </div>
                <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                  Total Spent
                </span>
              </div>
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60">
                <span>Last 7 days</span>
                <ChevronDown className="h-3 w-3" />
              </div>
            </div>

            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                ₹{totalSpent.toLocaleString('en-IN')}
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">
                Verified UPI payments
              </p>
            </div>
          </div>

          {/* Glowing Purple Area Chart SVG */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/60">
            <svg className="w-full h-24 overflow-visible" viewBox="0 0 400 90" preserveAspectRatio="none">
              <defs>
                <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.0" />
                </linearGradient>
              </defs>
              <path
                d="M 0,80 Q 70,75 140,55 T 280,45 T 400,20 L 400,90 L 0,90 Z"
                fill="url(#spendGradient)"
              />
              <path
                d="M 0,80 Q 70,75 140,55 T 280,45 T 400,20"
                fill="none"
                stroke="#8B5CF6"
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              {/* Dots matching the reference */}
              <circle cx="70" cy="75" r="3.5" fill="#8B5CF6" className="dark:filter dark:drop-shadow-[0_0_6px_#8B5CF6]" />
              <circle cx="140" cy="55" r="3.5" fill="#8B5CF6" className="dark:filter dark:drop-shadow-[0_0_6px_#8B5CF6]" />
              <circle cx="210" cy="52" r="3.5" fill="#8B5CF6" className="dark:filter dark:drop-shadow-[0_0_6px_#8B5CF6]" />
              <circle cx="280" cy="45" r="3.5" fill="#8B5CF6" className="dark:filter dark:drop-shadow-[0_0_6px_#8B5CF6]" />
              <circle cx="340" cy="35" r="3.5" fill="#8B5CF6" className="dark:filter dark:drop-shadow-[0_0_6px_#8B5CF6]" />
              <circle cx="400" cy="20" r="4.5" fill="#FFFFFF" stroke="#8B5CF6" strokeWidth="2.5" />
            </svg>
          </div>
        </div>

        {/* Campaign Performance Bar Chart */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] p-5 sm:p-6 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
                <BarChart3 className="h-4 w-4" />
              </div>
              <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">
                Campaign Performance
              </span>
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-800 text-[11px] text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60">
              <span>Last 7 days</span>
              <ChevronDown className="h-3 w-3" />
            </div>
          </div>

          {/* Performance Bars matching reference */}
          <div className="mt-8 flex items-end justify-between gap-3 h-28 px-2">
            {[
              { height: '35%', label: 'Mon' },
              { height: '55%', label: 'Tue' },
              { height: '40%', label: 'Wed' },
              { height: '70%', label: 'Thu' },
              { height: '90%', label: 'Fri' },
              { height: '65%', label: 'Sat' },
              { height: '80%', label: 'Sun' },
            ].map((bar, i) => (
              <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                <div className="w-full bg-slate-100 dark:bg-slate-900/80 rounded-t-lg h-24 flex items-end justify-center p-1">
                  <div
                    style={{ height: bar.height }}
                    className="w-full rounded-t-md bg-gradient-to-t from-purple-700 to-purple-400 group-hover:brightness-125 transition-all shadow-sm shadow-purple-600/30"
                  />
                </div>
                <span className="text-[10px] text-slate-400 font-medium">{bar.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 6. Choose Your Plan Section (Pricing Cards) */}
      <div id="pricing-plans" className="space-y-4 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="text-amber-500">
              <Crown className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
                Choose Your Plan
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select a plan that fits your business needs. More campaigns, more growth.
              </p>
            </div>
          </div>
          <span className="self-start sm:self-center px-3 py-1 rounded-full text-[11px] font-semibold bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/50">
            Most Popular Plan
          </span>
        </div>

        {/* 4 Pricing Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative rounded-2xl flex flex-col justify-between p-5 transition-all ${
                pkg.popular
                  ? 'border-2 border-purple-500 bg-white dark:bg-[#0D121F] shadow-xl shadow-purple-600/10'
                  : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-purple-600 px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md shadow-purple-600/30">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center gap-2">
                  <div className={`p-1.5 rounded-lg ${pkg.popular ? 'bg-purple-100 dark:bg-purple-950/80 text-purple-600 dark:text-purple-400' : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400'}`}>
                    {pkg.icon}
                  </div>
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                    {pkg.name}
                  </h4>
                </div>

                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
                    ₹{pkg.price}
                  </span>
                  <span className="text-xs text-slate-400 font-medium">/package</span>
                </div>

                <div className="mt-1 text-xs font-semibold text-purple-600 dark:text-purple-400">
                  {pkg.duration}
                </div>

                <div className="mt-5 space-y-2.5 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  {pkg.features.map((feat, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                      <Check className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-2">
                <button
                  onClick={() => handleChoosePackage(pkg.id)}
                  className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all active:scale-95 ${
                    pkg.popular
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500'
                      : 'border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <span>Choose Plan</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. Recent Advertising Campaigns Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                Recent Advertising Campaigns
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track status, review progress, and manage your campaigns.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('my-campaigns')}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
          >
            <span>View All</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>

        {campaigns.length === 0 ? (
          /* Empty State matching reference */
          <div className="py-12 sm:py-16 text-center space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 dark:bg-slate-900/80 text-slate-400">
              <Box className="h-7 w-7" />
            </div>
            <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              No campaigns created yet
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Launch your first Facebook & Instagram campaign using our streamlined builder.
            </p>
            <div className="pt-2">
              <button
                onClick={() => onNavigate('create-ad')}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white shadow-md shadow-purple-600/25 hover:bg-purple-500 active:scale-95 transition-all"
              >
                <span>Create Your First Campaign</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Campaigns List Table */
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  <th className="pb-3 font-medium">Campaign</th>
                  <th className="pb-3 font-medium">Package</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Duration</th>
                  <th className="pb-3 text-right font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40">
                {campaigns.slice(0, 5).map((cmp) => (
                  <tr key={cmp.id} className="hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors">
                    <td className="py-3 font-medium text-slate-900 dark:text-white">
                      {cmp.headline || cmp.business_name || 'Ad Campaign'}
                    </td>
                    <td className="py-3 text-slate-600 dark:text-slate-300 capitalize">
                      {cmp.package_id.replace('pkg_', '').replace('_', ' ')}
                    </td>
                    <td className="py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                        cmp.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                          : cmp.status === 'COMPLETED'
                          ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                      }`}>
                        {cmp.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 text-slate-500 dark:text-slate-400">
                      {cmp.package_id.includes('sprint') ? '5 Days' : cmp.package_id.includes('growth') ? '10 Days' : cmp.package_id.includes('business') ? '14 Days' : '30 Days'}
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => onOpenCampaign(cmp.id)}
                        className="text-purple-600 dark:text-purple-400 font-semibold hover:underline"
                      >
                        Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Funds Modal */}
      <AddFundsModal
        isOpen={showAddFundsModal}
        onClose={() => setShowAddFundsModal(false)}
        currentBalance={walletBalance}
        recommendedAmount={selectedQuickAmount}
        onSuccess={(newBal) => setWalletBalance(newBal)}
      />

    </div>
  );
};

export const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  switch (status) {
    case 'ACTIVE':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">Active</span>;
    case 'COMPLETED':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">Completed</span>;
    case 'PAUSED':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">Paused</span>;
    case 'UNDER_REVIEW':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Under Review</span>;
    case 'PAYMENT_PENDING':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">Payment Pending</span>;
    case 'PAYMENT_CONFIRMED':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">Payment Confirmed</span>;
    case 'FAILED':
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">Failed</span>;
    default:
      return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-500">{status}</span>;
  }
};
