import React, { useEffect, useState } from 'react';
import { Campaign, Package, Payment, MetaInsights } from '../../types';
import { api } from '../../lib/api';
import { StatusBadge } from './CustomerDashboard';
import {
  X,
  Facebook,
  Instagram,
  ExternalLink,
  Calendar,
  Layers,
  MapPin,
  TrendingUp,
  AlertCircle,
  RefreshCw,
  Clock,
  ShieldCheck,
} from 'lucide-react';

interface CampaignDetailsModalProps {
  campaignId: string | null;
  onClose: () => void;
  onRefreshList?: () => void;
}

export const CampaignDetailsModal: React.FC<CampaignDetailsModalProps> = ({ campaignId, onClose, onRefreshList }) => {
  const [data, setData] = useState<{
    campaign: Campaign;
    package: Package;
    payment: Payment | null;
    insights: MetaInsights;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [submittingMeta, setSubmittingMeta] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [adjustingAction, setAdjustingAction] = useState<string | null>(null);
  const [adjustMessage, setAdjustMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = () => {
    if (!campaignId) return;
    setLoading(true);
    api.getCampaignDetails(campaignId)
      .then((res) => setData(res))
      .catch((err) => console.error('Failed to load campaign details', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [campaignId]);

  if (!campaignId) return null;

  const handleRetrySubmitMeta = async () => {
    if (!data) return;
    setSubmittingMeta(true);
    setMetaError(null);
    try {
      await api.submitCampaignToMeta(data.campaign.id);
      loadData();
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      setMetaError(err.message || 'Meta advertising permissions are not configured or approved for this application.');
    } finally {
      setSubmittingMeta(false);
    }
  };

  const handleAdjustBudget = async (action: 'adjust_duration' | 'topup_budget' | 'refund_to_wallet', topupAmt?: number) => {
    if (!data) return;
    setAdjustingAction(action);
    setAdjustMessage(null);
    try {
      const res = await api.adjustCampaignBudget(data.campaign.id, action, topupAmt);
      setAdjustMessage({ type: 'success', text: res.message });
      loadData();
      if (onRefreshList) onRefreshList();
    } catch (err: any) {
      setAdjustMessage({ type: 'error', text: err.message || 'Failed to adjust budget' });
    } finally {
      setAdjustingAction(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-800 bg-[#0C1220] p-6 sm:p-8 text-slate-100 shadow-2xl">
        
        {/* Top Header */}
        <div className="flex items-start justify-between border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {data ? data.campaign.headline || data.campaign.business_name : 'Campaign Details'}
              </h2>
              {data && <StatusBadge status={data.campaign.status} />}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-mono">
              Campaign ID: {campaignId}
            </p>
          </div>

          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
          </div>
        ) : !data ? (
          <div className="py-12 text-center text-sm text-slate-400">
            Campaign data could not be loaded.
          </div>
        ) : (
          <div className="mt-6 space-y-6">

            {metaError && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-4 text-xs text-amber-200 space-y-2">
                <div className="flex items-center gap-2 font-bold text-amber-300">
                  <ShieldCheck className="h-4 w-4 text-amber-400" />
                  <span>Meta Activation Notice & Safety Guard</span>
                </div>
                <p className="leading-relaxed text-slate-300">{metaError}</p>
                <div className="rounded-lg bg-black/40 p-3 border border-amber-500/20 text-[11px] text-slate-300 space-y-1">
                  <span className="font-semibold text-amber-300 block">Actionable Next Steps:</span>
                  <div>1. Live Meta campaign submissions are safely disabled by default (<span className="font-mono text-amber-200">META_LIVE_SUBMISSIONS_ENABLED=false</span>) to protect against accidental ad spend.</div>
                  <div>2. Meta Developer App requires Advanced Access via App Review for <span className="font-mono text-amber-200">ads_management</span> before live public ad serving.</div>
                  <div>3. In development and dry-run mode, campaign targeting, budget, and creative assets are verified safely with ₹0 spend.</div>
                </div>
              </div>
            )}

            {/* Budget & Breakdown Calculations */}
            {(() => {
              const pkgPrice = data.package?.price || 549;
              const totalBudget = data.campaign.total_budget || pkgPrice;
              const platformFee = data.campaign.budget_breakdown?.platform_fee ?? data.package?.platform_fee ?? 200;
              // Reconciled net media spend: strictly Platform Fee + Net Media Spend === Total Budget
              const mediaSpend = (data.campaign.budget_breakdown?.media_spend && (data.campaign.budget_breakdown.media_spend + platformFee === totalBudget))
                ? data.campaign.budget_breakdown.media_spend
                : (pkgPrice && totalBudget === pkgPrice && data.package?.media_spend)
                ? data.package.media_spend
                : Math.max(0, totalBudget - platformFee);
              const durationDays = data.campaign.duration_days || data.package?.duration_days || 14;
              const dailyMediaSpend = mediaSpend / (durationDays || 1);
              const minDailyBudget = data.campaign.budget_breakdown?.min_daily_media_spend || 95.46;
              const recommendedDuration = Math.max(1, Math.floor(mediaSpend / minDailyBudget));
              const recommendedDaily = mediaSpend / recommendedDuration;
              const requiredTotalMedia = Math.ceil(durationDays * minDailyBudget);
              const topupShortfall = Math.max(0, requiredTotalMedia - mediaSpend);

              const isBudgetBlocked =
                (data.campaign.status === 'BUDGET_ADJUSTMENT_REQUIRED' ||
                  Boolean(
                    (data.campaign.rejection_reason && data.campaign.rejection_reason.includes('Meta Budget Validation Blocked')) ||
                    (data.campaign.error_details && data.campaign.error_details.includes('Meta Budget Validation Blocked')) ||
                    (data.campaign.meta_status_message && data.campaign.meta_status_message.includes('Meta Budget Validation Blocked'))
                  )) &&
                dailyMediaSpend < minDailyBudget &&
                data.campaign.status !== 'ACTIVE' &&
                data.campaign.status !== 'COMPLETED' &&
                data.campaign.status !== 'UNDER_REVIEW';

              return (
                <>
                  {/* Top Stats Overview */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                    <div className="rounded-xl border border-slate-800 bg-[#090D18] p-3.5">
                      <span className="block text-slate-500 text-[11px]">Campaign Objective</span>
                      <span className="font-bold text-white text-sm mt-0.5 block capitalize">{data.campaign.objective || data.package?.name || 'Traffic'}</span>
                      <span className="text-[11px] text-indigo-400 font-semibold">Net Media: ₹{mediaSpend} (₹{dailyMediaSpend.toFixed(2)}/day)</span>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-[#090D18] p-3.5">
                      <span className="block text-slate-500 text-[11px]">Duration & Total Authorized</span>
                      <span className="font-bold text-white text-sm mt-0.5 block">{durationDays} Days</span>
                      <span className="text-[11px] text-slate-400">Total: ₹{totalBudget} (₹{platformFee} fee + ₹{mediaSpend} ad)</span>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-[#090D18] p-3.5">
                      <span className="block text-slate-500 text-[11px]">Placements</span>
                      <div className="flex items-center gap-1.5 mt-1 text-slate-200 font-semibold text-xs">
                        <Facebook className="h-3.5 w-3.5 text-blue-400" />
                        <Instagram className="h-3.5 w-3.5 text-pink-400" />
                        <span>{data.campaign.placements?.length ? `${data.campaign.placements.length} Placements` : 'FB + IG Feed & Stories'}</span>
                      </div>
                    </div>

                    <div className="rounded-xl border border-slate-800 bg-[#090D18] p-3.5">
                      <span className="block text-slate-500 text-[11px]">Delivery & Mode</span>
                      <span className={`font-bold text-sm mt-0.5 block ${
                        data.campaign.status === 'ACTIVE'
                          ? 'text-emerald-400'
                          : isBudgetBlocked
                          ? 'text-amber-400'
                          : data.campaign.status === 'FAILED'
                          ? 'text-red-400'
                          : 'text-indigo-400'
                      }`}>
                        {isBudgetBlocked ? 'Action Required' : data.campaign.status}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {data.campaign.meta_campaign_id
                          ? (data.campaign.status === 'ACTIVE' ? 'Live Delivering' : 'Meta Draft Linked')
                          : isBudgetBlocked
                          ? 'Awaiting Customer Choice'
                          : data.campaign.status === 'UNDER_REVIEW'
                          ? 'Under Meta Review (Dry-Run)'
                          : data.campaign.status === 'FAILED'
                          ? 'Submission Failed'
                          : data.campaign.status === 'SUBMITTING'
                          ? 'Submitting to Meta'
                          : data.campaign.status === 'QUEUED'
                          ? 'Queued in Worker'
                          : 'Safe Non-Delivering'}
                      </span>
                    </div>
                  </div>

                  {/* Interactive Budget Adjustment Resolution Card */}
                  {isBudgetBlocked && (
                    <div className="rounded-2xl border border-amber-500/40 bg-gradient-to-b from-amber-950/40 to-slate-900/60 p-5 space-y-4 shadow-xl animate-in fade-in duration-300">
                      <div className="flex items-center gap-2.5">
                        <AlertCircle className="h-5 w-5 text-amber-400 shrink-0" />
                        <div>
                          <h4 className="font-bold text-sm text-amber-300">
                            Meta Daily Budget Floor Adjustment Required
                          </h4>
                          <p className="text-[11px] text-slate-300 mt-0.5">
                            Meta Marketing API requires a minimum daily ad spend of ₹{minDailyBudget.toFixed(2)}/day ($1.00 USD/day) for ad sets in INR currency.
                          </p>
                        </div>
                      </div>

                      {/* Transparent Budget Breakdown Table */}
                      <div className="rounded-xl bg-black/50 border border-slate-800 p-4 divide-y divide-slate-800 text-xs">
                        <div className="flex justify-between py-1.5">
                          <span className="text-slate-400">Total Customer Authorized Amount:</span>
                          <span className="font-bold text-white">₹{totalBudget}</span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-slate-400">SMAP Platform, Creative & AI Management Fee:</span>
                          <span className="font-semibold text-slate-300">₹{platformFee}</span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-slate-400">Net Meta Ad Spend Allocation:</span>
                          <span className="font-bold text-indigo-400">₹{mediaSpend}</span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-slate-400">Requested Duration:</span>
                          <span className="text-slate-300">{durationDays} Days</span>
                        </div>
                        <div className="flex justify-between py-1.5">
                          <span className="text-slate-400">Allocated Daily Media Spend:</span>
                          <span className="font-bold text-amber-400">₹{dailyMediaSpend.toFixed(2)}/day (Meta requires ≥ ₹{minDailyBudget.toFixed(2)}/day)</span>
                        </div>
                        <div className="pt-2 text-[11px] text-slate-400 leading-relaxed italic">
                          * Arithmetic Reconciliation: Total customer authorized ₹{totalBudget} = ₹{platformFee} SMAP platform fee + ₹{mediaSpend} net Meta ad spend allocation (₹{dailyMediaSpend.toFixed(2)}/day over {durationDays} days).
                        </div>
                      </div>

                      {adjustMessage && (
                        <div className={`p-3 rounded-xl text-xs font-semibold ${
                          adjustMessage.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30' : 'bg-red-500/10 text-red-400 border border-red-500/30'
                        }`}>
                          {adjustMessage.text}
                        </div>
                      )}

                      {/* Interactive Choices */}
                      <div className="space-y-2.5 pt-1">
                        <span className="text-xs font-bold text-slate-200 block uppercase tracking-wider">
                          Choose One of the 3 Safe Resolution Options:
                        </span>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {/* Option 1: Adjust Duration */}
                          <div className="rounded-xl border border-indigo-500/40 bg-indigo-950/20 p-4 flex flex-col justify-between space-y-3">
                            <div>
                              <div className="inline-block px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                                Recommended (₹0 Extra)
                              </div>
                              <h5 className="font-bold text-white text-xs">Option 1: Adjust to {recommendedDuration} Days</h5>
                              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                Runs your full ₹{mediaSpend} ad spend over {recommendedDuration} days at ₹{recommendedDaily.toFixed(2)}/day (exceeds Meta minimum). No extra payment required.
                              </p>
                            </div>
                            <button
                              onClick={() => handleAdjustBudget('adjust_duration')}
                              disabled={adjustingAction !== null}
                              className="w-full py-2 px-3 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs disabled:opacity-50 transition-all shadow-md shadow-indigo-600/20"
                            >
                              {adjustingAction === 'adjust_duration' ? 'Adjusting...' : `Adjust to ${recommendedDuration} Days (₹0)`}
                            </button>
                          </div>

                          {/* Option 2: Top-Up Media Budget */}
                          {topupShortfall > 0 ? (
                            <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4 flex flex-col justify-between space-y-3">
                              <div>
                                <div className="inline-block px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                                  Keep All {durationDays} Days
                                </div>
                                <h5 className="font-bold text-white text-xs">Option 2: Top-Up Media Budget</h5>
                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                  Keep all {durationDays} days active by topping up ₹{topupShortfall} from your wallet to meet Meta's ₹{minDailyBudget.toFixed(2)}/day floor (Total media: ₹{requiredTotalMedia}).
                                </p>
                              </div>
                              <button
                                onClick={() => handleAdjustBudget('topup_budget', topupShortfall)}
                                disabled={adjustingAction !== null}
                                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs disabled:opacity-50 transition-all border border-slate-700"
                              >
                                {adjustingAction === 'topup_budget' ? 'Deducting...' : `Top-Up ₹${topupShortfall} from Wallet`}
                              </button>
                            </div>
                          ) : (
                            <div className="rounded-xl border border-slate-800/60 bg-slate-900/30 p-4 flex flex-col justify-between space-y-3 opacity-70">
                              <div>
                                <div className="inline-block px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                                  Floor Satisfied
                                </div>
                                <h5 className="font-bold text-white text-xs">Option 2: Daily Budget Meets Floor</h5>
                                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                  Current media allocation of ₹{dailyMediaSpend.toFixed(2)}/day meets or exceeds Meta's minimum of ₹{minDailyBudget.toFixed(2)}/day. No top-up needed.
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Option 3: Full Wallet Refund */}
                          <div className="rounded-xl border border-red-500/20 bg-red-950/10 p-4 flex flex-col justify-between space-y-3">
                            <div>
                              <div className="inline-block px-2 py-0.5 rounded-full bg-red-500/20 text-red-300 text-[10px] font-bold uppercase tracking-wider mb-1">
                                100% Wallet Refund
                              </div>
                              <h5 className="font-bold text-white text-xs">Option 3: Cancel & Full Refund</h5>
                              <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                Immediately cancel this campaign and receive a 100% full refund of ₹{totalBudget} credited directly back to your SMAP wallet balance.
                              </p>
                            </div>
                            <button
                              onClick={() => handleAdjustBudget('refund_to_wallet')}
                              disabled={adjustingAction !== null}
                              className="w-full py-2 px-3 rounded-lg bg-red-900/40 hover:bg-red-800/60 text-red-200 font-bold text-xs disabled:opacity-50 transition-all border border-red-700/50"
                            >
                              {adjustingAction === 'refund_to_wallet' ? 'Refunding...' : `Refund ₹${totalBudget} to Wallet`}
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}

            {/* Official Meta Insights Section (Section 27) */}
            <div className="rounded-2xl border border-slate-800 bg-[#090D18] p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-indigo-400" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                    Live Meta Graph Performance Insights
                  </h3>
                </div>
                <span className="text-[11px] text-slate-500">Official Graph API Telemetry</span>
              </div>

              {data.insights && data.insights.dataAvailable ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Reach</span>
                    <span className="text-lg font-bold text-white block tabular-nums">
                      {data.insights.reach?.toLocaleString()}
                    </span>
                  </div>
                  <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Impressions</span>
                    <span className="text-lg font-bold text-white block tabular-nums">
                      {data.insights.impressions?.toLocaleString()}
                    </span>
                  </div>
                  <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Clicks</span>
                    <span className="text-lg font-bold text-white block tabular-nums">
                      {data.insights.clicks?.toLocaleString()}
                    </span>
                  </div>
                  <div className="rounded-lg bg-slate-900/80 p-3 border border-slate-800">
                    <span className="text-[11px] text-slate-400">Spend</span>
                    <span className="text-lg font-bold text-white block tabular-nums">
                      ₹{data.insights.spend?.toLocaleString()}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="py-4 text-center rounded-xl bg-slate-900/40 border border-slate-800/80 text-xs text-slate-400">
                  <p className="font-medium text-slate-300">Metrics currently unavailable.</p>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Meta auction delivery data becomes visible once the ad set exits Meta's learning auction phase.
                  </p>
                </div>
              )}
            </div>

            {/* Creative & Copy Breakdown */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              {/* Media */}
              <div className="md:col-span-5 space-y-2">
                <span className="text-xs font-semibold text-slate-400">Creative Media</span>
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-black aspect-square flex items-center justify-center">
                  {data.campaign.creative_url ? (
                    data.campaign.creative_type === 'video' ? (
                      <video src={data.campaign.creative_url} controls className="h-full w-full object-contain" />
                    ) : (
                      <img src={data.campaign.creative_url} alt="" className="h-full w-full object-contain" />
                    )
                  ) : (
                    <span className="text-xs text-slate-500">No media attached</span>
                  )}
                </div>
              </div>

              {/* Copy & Details */}
              <div className="md:col-span-7 space-y-4 text-xs">
                <div>
                  <span className="text-slate-400 block text-[11px]">Primary Text</span>
                  <p className="text-slate-200 mt-1 leading-relaxed bg-slate-900/70 p-3 rounded-lg border border-slate-800">
                    {data.campaign.primary_text}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 block text-[11px]">Headline & Description</span>
                  <p className="text-white font-bold text-sm mt-0.5">
                    {data.campaign.headline}
                  </p>
                  {data.campaign.description && (
                    <p className="text-slate-400 text-xs mt-0.5">{data.campaign.description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Destination</span>
                    <span className="font-semibold text-white capitalize">
                      {String(data.campaign.destination_type || 'website').replace(/_/g, ' ')}
                    </span>
                    <a
                      href={data.campaign.destination_url ? (data.campaign.destination_url.startsWith('http') ? data.campaign.destination_url : `https://${data.campaign.destination_url}`) : '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-indigo-400 hover:underline block truncate mt-0.5"
                    >
                      {data.campaign.destination_url}
                    </a>
                  </div>

                  <div>
                    <span className="text-slate-400 block text-[11px]">Audience Parameters</span>
                    <span className="text-slate-200 block">
                      {data.campaign.targeting?.state || 'All India'} · {data.campaign.targeting?.min_age}-{data.campaign.targeting?.max_age}y
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      Gender: {data.campaign.targeting?.gender}
                    </span>
                  </div>
                </div>

                {/* Meta Status, Rejection, Progress or Safety Guard Banner */}
                {(() => {
                  const hasFailure = Boolean(data.campaign.rejection_reason || data.campaign.error_details || data.campaign.status === 'FAILED');
                  const msg = data.campaign.rejection_reason || data.campaign.error_details || data.campaign.meta_status_message || '';
                  if (!msg) return null;

                  const isSafeHold = msg.includes('Dry-Run') || msg.includes('safely disabled') || msg.includes('safety gate') || msg.includes('held safely') || msg.includes('non-delivering');

                  if (isSafeHold) {
                    return (
                      <div className="rounded-xl border border-amber-500/30 bg-amber-950/30 p-3.5 text-xs text-amber-200 space-y-1.5">
                        <div className="flex items-center gap-2 font-bold text-amber-300">
                          <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
                          <span>Pre-Flight Verified (Safe Dry-Run Mode):</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-300">
                          {msg}
                        </p>
                        <div className="text-[10px] text-amber-400 font-mono pt-0.5">
                          Safety Status: ₹0 Meta ad spend · Assets validated · Awaiting owner live production activation
                        </div>
                      </div>
                    );
                  }

                  // If submission is currently queued or submitting in background (NOT failed)
                  if (!hasFailure && (data.campaign.status === 'QUEUED' || data.campaign.status === 'SUBMITTING')) {
                    return (
                      <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/40 p-3.5 text-xs text-indigo-200 space-y-1.5">
                        <div className="flex items-center gap-2 font-bold text-indigo-300">
                          <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-indigo-400 border-t-transparent shrink-0" />
                          <span>Meta Submission in Progress:</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-indigo-100">
                          {msg}
                        </p>
                        <div className="text-[10px] text-indigo-400 font-mono pt-0.5">
                          Background Worker Active · Meta API creation pending
                        </div>
                      </div>
                    );
                  }

                  // If budget blocker message is stale and daily spend meets Meta floor, suppress stale warning
                  const pkgPrice = data.package?.price || 549;
                  const totalBudget = data.campaign.total_budget || pkgPrice;
                  const platformFee = data.campaign.budget_breakdown?.platform_fee ?? data.package?.platform_fee ?? 200;
                  const mediaSpend = (data.campaign.budget_breakdown?.media_spend && (data.campaign.budget_breakdown.media_spend + platformFee === totalBudget))
                    ? data.campaign.budget_breakdown.media_spend
                    : (pkgPrice && totalBudget === pkgPrice && data.package?.media_spend)
                    ? data.package.media_spend
                    : Math.max(0, totalBudget - platformFee);
                  const durationDays = data.campaign.duration_days || data.package?.duration_days || 14;
                  const dailyMediaSpend = mediaSpend / (durationDays || 1);
                  const minDailyBudget = data.campaign.budget_breakdown?.min_daily_media_spend || 95.46;
                  if (msg.includes('Meta Budget Validation Blocked') && (dailyMediaSpend >= minDailyBudget || data.campaign.status === 'UNDER_REVIEW' || data.campaign.status === 'ACTIVE')) {
                    return null;
                  }

                  // Real Failure Notice (Development Mode, Invalid Parameters, etc.)
                  if (hasFailure) {
                    const isDevModeBlocker = msg.includes('1885183') || msg.includes('Development Mode') || msg.includes('App Review');
                    return (
                      <div className={`rounded-xl border p-3.5 text-xs space-y-1.5 ${
                        isDevModeBlocker 
                          ? 'border-amber-500/40 bg-amber-950/40 text-amber-200' 
                          : 'border-red-500/30 bg-red-950/40 text-red-300'
                      }`}>
                        <div className={`flex items-center gap-2 font-bold ${isDevModeBlocker ? 'text-amber-400' : 'text-red-400'}`}>
                          <AlertCircle className="h-4 w-4 shrink-0" />
                          <span>{isDevModeBlocker ? 'Meta App Review & Development Mode Action Required:' : 'Meta Validation Notice:'}</span>
                        </div>
                        <p className="text-[11px] leading-relaxed">
                          {msg}
                        </p>
                        {isDevModeBlocker && (
                          <div className="pt-1 border-t border-amber-500/20 text-[10px] text-amber-300/90 leading-normal">
                            Customer funds are preserved. Live ad delivery to the general public requires Meta Developer App Review approval for <strong>ads_management</strong> and <strong>pages_manage_ads</strong> permissions.
                          </div>
                        )}
                      </div>
                    );
                  }

                  return null;
                })()}

                {/* Meta Identifiers */}
                <div className="rounded-lg bg-slate-900/60 p-3 border border-slate-800 space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Meta Campaign ID:</span>
                    <span className="text-slate-300">{data.campaign.meta_campaign_id || 'Pending Meta creation'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Meta AdSet ID:</span>
                    <span className="text-slate-300">{data.campaign.meta_adset_id || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Meta Creative ID:</span>
                    <span className="text-slate-300">{data.campaign.meta_creative_id || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Meta Ad ID:</span>
                    <span className="text-slate-300">{data.campaign.meta_ad_id || '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Managed Delivery Assets:</span>
                    <span className="text-slate-300 font-sans">Sahil Gupta (FB) · @ravi105065 (IG)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Scheduled End:</span>
                    <span className="text-slate-300">{data.campaign.end_at ? new Date(data.campaign.end_at).toLocaleString() : 'Upon activation'}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-slate-900/40 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
                  <span className="font-semibold text-slate-300 block mb-0.5">Asset & App Mode Transparency:</span>
                  Ads currently run under SMAP verified assets (Facebook Page: Sahil Gupta, Instagram: @ravi105065). Meta Developer App is in Development Mode (live delivery to public requires Meta App Review for ads_management).
                </div>

              </div>
            </div>

            {/* Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-800 text-xs">
              <span className="text-slate-400">
                Campaign schedule is managed automatically by SMAP server scheduler.
              </span>

              <div className="flex items-center gap-2">
                {data.payment?.status === 'PAID' && (data.campaign.status === 'PAYMENT_CONFIRMED' || data.campaign.status === 'META_NOT_CONNECTED' || data.campaign.status === 'FAILED') && (
                  <button
                    onClick={handleRetrySubmitMeta}
                    disabled={submittingMeta}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                  >
                    {submittingMeta ? 'Submitting...' : 'Submit to Meta API'}
                  </button>
                )}

                <button
                  onClick={onClose}
                  className="rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-slate-750"
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
};
