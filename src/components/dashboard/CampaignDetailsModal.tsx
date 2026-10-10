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
              <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-4 text-xs text-red-300">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  Meta Submission Notice:
                </div>
                <p>{metaError}</p>
              </div>
            )}

            {/* Top Stats Overview */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="rounded-xl border border-slate-800 bg-[#090D18] p-3.5">
                <span className="block text-slate-500 text-[11px]">Campaign Objective</span>
                <span className="font-bold text-white text-sm mt-0.5 block capitalize">{data.campaign.objective || data.package?.name || 'Traffic'}</span>
                <span className="text-[11px] text-indigo-400 font-semibold">₹{data.campaign.daily_budget ? `${data.campaign.daily_budget}/day` : `₹${data.package?.price || data.campaign.total_budget || 200}`}</span>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#090D18] p-3.5">
                <span className="block text-slate-500 text-[11px]">Duration & Budget</span>
                <span className="font-bold text-white text-sm mt-0.5 block">{data.campaign.duration_days || data.package?.duration_days || 5} Days</span>
                <span className="text-[11px] text-slate-400">Total: ₹{data.campaign.total_budget || data.package?.price || 200}</span>
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
                <span className={`font-bold text-sm mt-0.5 block ${data.campaign.status === 'ACTIVE' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {data.campaign.status}
                </span>
                <span className="text-[11px] text-slate-400">
                  {data.campaign.meta_campaign_id ? 'Meta Draft Linked' : 'Safe Non-Delivering'}
                </span>
              </div>
            </div>

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

                {/* Meta Rejection or Error Banner if present */}
                {(data.campaign.rejection_reason || data.campaign.error_details) && (
                  <div className="rounded-xl border border-red-500/30 bg-red-950/40 p-3.5 text-xs text-red-300 space-y-1">
                    <div className="flex items-center gap-2 font-bold text-red-400">
                      <AlertCircle className="h-4 w-4" />
                      <span>Meta Delivery Notice:</span>
                    </div>
                    <p className="text-[11px] leading-relaxed">
                      {data.campaign.rejection_reason || data.campaign.meta_status_message || data.campaign.error_details}
                    </p>
                  </div>
                )}

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
