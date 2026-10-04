import React from 'react';
import { BarChart3, TrendingUp, Users, Target, ArrowUpRight } from 'lucide-react';

export const ReportsView: React.FC = () => {
  const metrics = [
    { label: 'Estimated Impressions', value: '45,200+', change: '+18.4%', note: 'Across FB & IG Feeds' },
    { label: 'Audience Reach', value: '28,900+', change: '+12.1%', note: 'Targeted Demographics' },
    { label: 'Link Clicks & Engagements', value: '3,840+', change: '+24.5%', note: 'High Intent Visitors' },
    { label: 'Average CTR', value: '2.84%', change: '+0.6%', note: 'Above Industry Average' },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Advertising Reports & Performance
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Detailed metrics, click-through rates, and algorithmic delivery stats for your active campaigns.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((m, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] p-5 shadow-sm"
          >
            <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
              <span>{m.label}</span>
              <span className="flex items-center text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                {m.change}
                <ArrowUpRight className="h-3 w-3" />
              </span>
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {m.value}
            </div>
            <div className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              {m.note}
            </div>
          </div>
        ))}
      </div>

      {/* Conversion & Breakdown Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] p-6 shadow-sm space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Platform Delivery Breakdown
        </h3>
        <div className="space-y-3 pt-2">
          <div>
            <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              <span>Instagram Feed & Reels</span>
              <span className="text-purple-600 dark:text-purple-400">58%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-purple-600 w-[58%]" />
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
              <span>Facebook Feed & Stories</span>
              <span className="text-purple-600 dark:text-purple-400">42%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div className="h-full rounded-full bg-indigo-500 w-[42%]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
