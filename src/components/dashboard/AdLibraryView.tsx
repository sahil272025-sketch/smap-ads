import React from 'react';
import { Layers, Image, Video, Plus, ExternalLink, Sparkles } from 'lucide-react';

interface AdLibraryViewProps {
  onNavigate: (tab: string) => void;
}

export const AdLibraryView: React.FC<AdLibraryViewProps> = ({ onNavigate }) => {
  const sampleCreatives = [
    {
      title: 'E-commerce Festive Promotion',
      format: 'Feed & Stories (1:1 & 9:16)',
      platform: 'Facebook & Instagram',
      category: 'Product Sales',
      status: 'Active Template',
    },
    {
      title: 'Local Store Footfall Driver',
      format: 'Carousel & Feed (1:1)',
      platform: 'Instagram Reels & Stories',
      category: 'Local Business',
      status: 'Active Template',
    },
    {
      title: 'Lead Generation B2B Service',
      format: 'Single Image & Lead Form',
      platform: 'Facebook Feed',
      category: 'Lead Capture',
      status: 'Active Template',
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
            Ad Creative Library
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Browse verified high-converting ad layouts and templates optimized for Meta algorithms.
          </p>
        </div>

        <button
          onClick={() => onNavigate('create-ad')}
          className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-purple-600/25 hover:bg-purple-500 active:scale-95 transition-all self-start sm:self-center"
        >
          <Plus className="h-4 w-4" />
          <span>Launch Campaign</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {sampleCreatives.map((ad, idx) => (
          <div
            key={idx}
            className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] p-5 shadow-sm hover:border-purple-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-3">
                <span className="font-semibold text-purple-600 dark:text-purple-400">{ad.platform}</span>
                <span className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] text-slate-600 dark:text-slate-300">
                  {ad.category}
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mb-1.5">
                {ad.title}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {ad.format}
              </p>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                {ad.status}
              </span>
              <button
                onClick={() => onNavigate('create-ad')}
                className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
              >
                Use in Ad
                <ExternalLink className="h-3 w-3" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
