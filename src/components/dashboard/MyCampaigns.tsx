import React, { useState, useEffect } from 'react';
import { Campaign } from '../../types';
import { api } from '../../lib/api';
import { StatusBadge } from './CustomerDashboard';
import { Facebook, Instagram, Search, Layers, ArrowRight, Plus } from 'lucide-react';

interface MyCampaignsProps {
  onOpenCampaign: (campaignId: string) => void;
  onCreateNew: () => void;
}

export const MyCampaigns: React.FC<MyCampaignsProps> = ({ onOpenCampaign, onCreateNew }) => {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  const loadCampaigns = () => {
    setLoading(true);
    api.getCampaigns(filter)
      .then((res) => setCampaigns(res.campaigns || []))
      .catch((err) => console.error('Error fetching campaigns', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadCampaigns();
  }, [filter]);

  const filteredCampaigns = campaigns.filter((c) => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      (c.business_name || '').toLowerCase().includes(term) ||
      (c.headline || '').toLowerCase().includes(term) ||
      (c.id || '').toLowerCase().includes(term)
    );
  });

  const filterTabs = [
    { id: 'ALL', label: 'All' },
    { id: 'DRAFT', label: 'Draft' },
    { id: 'PENDING_REVIEW', label: 'Pending Review' },
    { id: 'ACTIVE', label: 'Active' },
    { id: 'PAUSED', label: 'Paused' },
    { id: 'COMPLETED', label: 'Completed' },
    { id: 'REJECTED', label: 'Rejected' },
    { id: 'FAILED', label: 'Failed' },
  ];

  return (
    <div className="space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 dark:border-slate-800/80 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            My Campaigns
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track performance, delivery statuses, and duration lifecycles across Facebook & Instagram.
          </p>
        </div>

        <button
          onClick={onCreateNew}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-purple-600/25 hover:bg-purple-500 active:scale-95 transition-all self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          <span>Create Ad</span>
        </button>
      </div>

      {/* Filter and search bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        {/* Interactive Segmented Filter Controls */}
        <div className="flex items-center gap-1 overflow-x-auto p-1 rounded-xl bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          {filterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors ${
                filter === tab.id
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative min-w-[240px]">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search campaigns..."
            className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 pl-10 pr-3 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-purple-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Campaigns list */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
          </div>
        ) : filteredCampaigns.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Layers className="h-12 w-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">No campaigns found</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              {search ? 'Try modifying your search term or filter.' : 'Launch a new Facebook and Instagram campaign to get started.'}
            </p>
            {!search && (
              <button
                onClick={onCreateNew}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-purple-500 shadow-md shadow-purple-600/25 active:scale-95 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Create Ad Campaign</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-500 dark:text-slate-400 font-semibold">
                <tr>
                  <th className="py-3.5 pl-4">Campaign Name</th>
                  <th className="py-3.5">Networks</th>
                  <th className="py-3.5">Package</th>
                  <th className="py-3.5">Status</th>
                  <th className="py-3.5">Created Date</th>
                  <th className="py-3.5 text-right pr-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-600 dark:text-slate-300">
                {filteredCampaigns.map((cmp) => (
                  <tr
                    key={cmp.id}
                    onClick={() => onOpenCampaign(cmp.id)}
                    className="cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    <td className="py-4 pl-4">
                      <div className="flex items-center gap-3">
                        {cmp.creative_url ? (
                          <img
                            src={cmp.creative_url}
                            alt=""
                            className="h-11 w-11 rounded-xl object-cover bg-slate-100 dark:bg-slate-800 shrink-0"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="h-11 w-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0 font-bold">
                            Ad
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-slate-900 dark:text-white block text-sm">
                            {cmp.headline || cmp.business_name}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {cmp.business_name} · ID: {cmp.id.slice(-8)}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                        <Facebook className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        <Instagram className="h-4 w-4 text-pink-500" />
                        <span className="text-xs">Facebook + Instagram</span>
                      </div>
                    </td>

                    <td className="py-4">
                      <span className="font-bold text-slate-900 dark:text-white capitalize block">
                        {cmp.package_id
                          ? cmp.package_id.replace('pkg_', '').replace('_', ' ')
                          : cmp.objective
                          ? `${cmp.objective.toLowerCase()} campaign`
                          : 'Custom Campaign'}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {cmp.duration_days
                          ? `${cmp.duration_days} Days Run`
                          : (cmp.package_id || '').includes('sprint')
                          ? '5 Days Run'
                          : (cmp.package_id || '').includes('growth')
                          ? '10 Days Run'
                          : (cmp.package_id || '').includes('business')
                          ? '14 Days Run'
                          : '30 Days Run'}
                      </span>
                    </td>

                    <td className="py-4">
                      <StatusBadge status={cmp.status} />
                    </td>

                    <td className="py-4 text-slate-500 dark:text-slate-400 font-mono text-[11px]">
                      {new Date(cmp.created_at).toLocaleDateString()}
                    </td>

                    <td className="py-4 text-right pr-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline">
                        View
                        <ArrowRight className="h-3 w-3" />
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};
