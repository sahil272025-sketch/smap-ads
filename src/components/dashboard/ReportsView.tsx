import React, { useState, useEffect, useCallback, useRef } from 'react';
import { api } from '../../lib/api';
import { PerformanceReportsData, PerformanceCampaignItem } from '../../types';
import { CampaignDetailsModal } from './CampaignDetailsModal';
import {
  BarChart3,
  TrendingUp,
  Users,
  Target,
  Clock,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Eye,
  MousePointerClick,
  IndianRupee,
  Activity,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const [data, setData] = useState<PerformanceReportsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const cooldownTimerRef = useRef<NodeJS.Timeout | null>(null);

  const fetchReports = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    }
    setError(null);

    try {
      const result = await api.getPerformanceReports(isManualRefresh);
      setData(result);
      setLastRefreshedAt(new Date());

      if (isManualRefresh) {
        // Start 15s cooldown to prevent API rate-limit exhaustion
        setCooldownRemaining(15);
        if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
        cooldownTimerRef.current = setInterval(() => {
          setCooldownRemaining((prev) => {
            if (prev <= 1) {
              clearInterval(cooldownTimerRef.current!);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (err: any) {
      console.error('Failed to load performance reports:', err);
      setError(err?.message || 'Unable to retrieve live Meta performance data.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchReports(false);
  }, [fetchReports]);

  // Periodic background refresh every 60 seconds (only if document is visible)
  useEffect(() => {
    const interval = setInterval(() => {
      if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
        fetchReports(false);
      }
    }, 60000);

    return () => clearInterval(interval);
  }, [fetchReports]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) clearInterval(cooldownTimerRef.current);
    };
  }, []);

  const handleManualRefresh = () => {
    if (cooldownRemaining > 0 || refreshing) return;
    fetchReports(true);
  };

  const filteredCampaigns = (data?.campaigns || []).filter((c) => {
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'ACTIVE') return c.status === 'ACTIVE';
    if (statusFilter === 'UNDER_REVIEW') return c.status === 'UNDER_REVIEW' || c.status === 'PENDING_REVIEW';
    if (statusFilter === 'QUEUED') return c.status === 'QUEUED' || c.queueStatus === 'QUEUED' || c.status === 'SUBMITTING';
    if (statusFilter === 'COMPLETED') return c.status === 'COMPLETED';
    if (statusFilter === 'FAILED') return c.status === 'FAILED';
    return true;
  });

  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined) return '—';
    return num.toLocaleString('en-IN');
  };

  const formatCurrency = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined) return '—';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header and Live Sync Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Advertising Reports & Performance
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Meta Live Sync
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
            Real performance telemetry directly from Meta Marketing API (Facebook & Instagram). No simulations or inflated projections.
          </p>
        </div>

        {/* Sync Controls */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="text-right">
            <div className="text-[11px] text-slate-400 dark:text-slate-500 flex items-center gap-1 justify-end">
              <Clock className="w-3 h-3 text-slate-400" />
              <span>Last Synced:</span>
            </div>
            <div className="text-xs font-medium text-slate-700 dark:text-slate-300">
              {lastRefreshedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </div>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={refreshing || cooldownRemaining > 0}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold shadow-sm transition-all border ${
              cooldownRemaining > 0
                ? 'bg-slate-100 dark:bg-slate-800/60 text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-800 cursor-not-allowed'
                : 'bg-white dark:bg-[#0D121F] text-slate-700 dark:text-slate-200 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/80 active:scale-95'
            }`}
            title={cooldownRemaining > 0 ? `Rate-limit cooldown: wait ${cooldownRemaining}s before refreshing again` : 'Fetch latest data from Meta Marketing API'}
          >
            <RefreshCw className={`w-3.5 h-3.5 text-purple-600 dark:text-purple-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>
              {refreshing ? 'Syncing...' : cooldownRemaining > 0 ? `Wait ${cooldownRemaining}s` : 'Refresh Metrics'}
            </span>
          </button>
        </div>
      </div>

      {/* Error alert banner if any */}
      {error && (
        <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-4 text-xs text-red-700 dark:text-red-300 flex items-start gap-3">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold">Notice from Meta Marketing API</div>
            <div>{error}</div>
          </div>
        </div>
      )}

      {/* Primary KPI Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Impressions */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 font-medium">
              <Eye className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
              Total Impressions
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Meta Graph API
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {loading ? (
              <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            ) : (
              formatNumber(data?.summary.totalImpressions ?? 0)
            )}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1 flex items-center justify-between">
            <span>Ad views rendered on screen</span>
            {data?.summary.hasLiveMetrics && (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Verified</span>
            )}
          </div>
        </div>

        {/* Unique Reach */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 font-medium">
              <Users className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Audience Reach
            </span>
            <span className="text-[11px] font-semibold text-indigo-600 dark:text-indigo-400">
              Unique People
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {loading ? (
              <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            ) : (
              formatNumber(data?.summary.totalReach ?? 0)
            )}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Distinct user accounts reached
          </div>
        </div>

        {/* Link Clicks */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 font-medium">
              <MousePointerClick className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              Link Clicks
            </span>
            <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
              CTR: {data?.summary.averageCtr !== null && data?.summary.averageCtr !== undefined ? `${data.summary.averageCtr}%` : '—'}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {loading ? (
              <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            ) : (
              formatNumber(data?.summary.totalClicks ?? 0)
            )}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Website & WhatsApp destination visits
          </div>
        </div>

        {/* Ad Spend */}
        <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] p-5 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
            <span className="flex items-center gap-1.5 font-medium">
              <IndianRupee className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Meta Media Spend
            </span>
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
              Avg CPC: {data?.summary.averageCpc !== null && data?.summary.averageCpc !== undefined ? `₹${data.summary.averageCpc}` : '—'}
            </span>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tabular-nums tracking-tight">
            {loading ? (
              <div className="h-8 w-24 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            ) : (
              formatCurrency(data?.summary.totalSpend ?? 0)
            )}
          </div>
          <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
            Meta ad auction media delivered
          </div>
        </div>
      </div>

      {/* Meta Disclosures & Delivery Notice Card */}
      <div className="rounded-2xl border border-purple-200/70 dark:border-purple-900/40 bg-purple-50/50 dark:bg-purple-950/20 p-5 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-purple-900 dark:text-purple-300">
          <Info className="w-4 h-4 text-purple-600 dark:text-purple-400 shrink-0" />
          <span>Understanding Meta Advertising Metrics & Timelines</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 dark:text-slate-300 pt-1">
          <div className="space-y-1">
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
              <span>Impressions vs. Reach</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Impressions count every time your ad appears on screen (which can include repeat views by the same person). Reach counts distinct, unique individual people.
            </p>
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
              <span>15–60 Minute Reporting Lag</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Meta Marketing API computes delivery and click telemetry in batched intervals. Real-time impressions and clicks may lag behind live customer activity by up to an hour.
            </p>
          </div>
          <div className="space-y-1">
            <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
              <span>Standard 24–48h Meta Review</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">
              Submitted campaigns undergo automated and human ad policy verification by Meta before live bidding begins. Metrics show 0 until ad approval and initial delivery occur.
            </p>
          </div>
        </div>
      </div>

      {/* Individual Campaign Performance Table */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] shadow-sm overflow-hidden">
        {/* Table Header & Status Filter Bar */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Campaign Breakdown & Real-Time Sync Status
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Live status, Meta campaign IDs, and telemetry across your Facebook & Instagram campaigns.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            {(['ALL', 'ACTIVE', 'UNDER_REVIEW', 'QUEUED', 'COMPLETED', 'FAILED'] as const).map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg font-medium whitespace-nowrap transition-colors ${
                  statusFilter === st
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {st === 'ALL' ? 'All' : st === 'ACTIVE' ? 'Delivering' : st === 'UNDER_REVIEW' ? 'In Review' : st === 'QUEUED' ? 'Queued' : st === 'COMPLETED' ? 'Completed' : 'Failed'}
              </button>
            ))}
          </div>
        </div>

        {/* Content list / Table */}
        {loading ? (
          <div className="p-8 text-center space-y-3">
            <RefreshCw className="w-6 h-6 text-purple-600 dark:text-purple-400 animate-spin mx-auto" />
            <div className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Connecting to Meta Marketing API & reconciling delivery status...
            </div>
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800/60 flex items-center justify-center mx-auto text-slate-400">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div className="text-sm font-semibold text-slate-900 dark:text-white">
              {statusFilter === 'ALL' ? 'No campaigns created yet' : `No campaigns matching filter "${statusFilter}"`}
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              Once you checkout and submit an ad, real-time impression, click, and reach telemetry from Meta will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 dark:bg-slate-850/40 text-slate-500 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-4">Campaign & Creative</th>
                  <th className="py-3 px-4">Delivery Status</th>
                  <th className="py-3 px-4">Meta Status</th>
                  <th className="py-3 px-4 text-right">Impressions</th>
                  <th className="py-3 px-4 text-right">Reach</th>
                  <th className="py-3 px-4 text-right">Clicks</th>
                  <th className="py-3 px-4 text-right">Spend</th>
                  <th className="py-3 px-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {filteredCampaigns.map((c) => {
                  const ins = c.insights;
                  const isDelivering = c.status === 'ACTIVE';
                  const isReview = c.status === 'UNDER_REVIEW' || c.status === 'PENDING_REVIEW';
                  const isQueued = c.status === 'QUEUED' || c.queueStatus === 'QUEUED' || c.status === 'SUBMITTING';
                  const isFailed = c.status === 'FAILED';

                  return (
                    <tr
                      key={c.id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* Campaign & Creative */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          {c.creativeUrl ? (
                            <img
                              src={c.creativeUrl}
                              alt={c.businessName}
                              className="w-10 h-10 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 text-slate-400">
                              <Layers className="w-4 h-4" />
                            </div>
                          )}
                          <div className="space-y-0.5 min-w-0 max-w-[200px]">
                            <div className="font-bold text-slate-900 dark:text-white truncate">
                              {c.businessName}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                              {c.headline || c.packageName}
                            </div>
                            <div className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">
                              {c.packageName} (₹{c.packagePrice})
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Delivery Status Badge */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isDelivering ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Delivering
                          </span>
                        ) : isReview ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                            <Clock className="w-3 h-3 text-amber-500" />
                            In Meta Review
                          </span>
                        ) : isQueued ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                            <RefreshCw className="w-3 h-3 text-blue-500 animate-spin" />
                            Queued for Meta
                          </span>
                        ) : isFailed ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-800">
                            <AlertCircle className="w-3 h-3 text-red-500" />
                            Action Required
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {c.status}
                          </span>
                        )}
                      </td>

                      {/* Meta Status & Sync */}
                      <td className="py-3.5 px-4 min-w-[180px] max-w-[260px]">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1 text-[11px] font-medium">
                            {c.metaCampaignId ? (
                              <span className="text-purple-600 dark:text-purple-400 font-mono text-[10px]">
                                {c.metaCampaignId}
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">No Meta ID assigned</span>
                            )}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-2 leading-tight">
                            {c.rejectionReason || c.metaStatusMessage || ins.notice}
                          </div>
                        </div>
                      </td>

                      {/* Impressions */}
                      <td className="py-3.5 px-4 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                        {formatNumber(ins.impressions)}
                      </td>

                      {/* Reach */}
                      <td className="py-3.5 px-4 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                        {formatNumber(ins.reach)}
                      </td>

                      {/* Clicks */}
                      <td className="py-3.5 px-4 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                        {formatNumber(ins.clicks)}
                      </td>

                      {/* Spend */}
                      <td className="py-3.5 px-4 text-right font-semibold tabular-nums text-slate-900 dark:text-white">
                        {formatCurrency(ins.spend)}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedCampaignId(c.id)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 transition-colors"
                        >
                          View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Campaign Details Modal if user clicked "View Details" */}
      {selectedCampaignId && (
        <CampaignDetailsModal
          campaignId={selectedCampaignId}
          onClose={() => setSelectedCampaignId(null)}
          onRefreshList={() => fetchReports(false)}
        />
      )}
    </div>
  );
};
