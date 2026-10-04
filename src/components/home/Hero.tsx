import React from 'react';
import { ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import heroVisualPath from '../../assets/images/smap_hero_visual_1790756029679.jpg';

interface HeroProps {
  onStartAdvertising: () => void;
  onViewPackages: () => void;
}

export const Hero: React.FC<HeroProps> = ({ onStartAdvertising, onViewPackages }) => {
  return (
    <section className="relative overflow-hidden pt-10 pb-20 lg:pt-16 lg:pb-28">
      {/* Ambient background glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] bg-gradient-to-tr from-purple-600/15 via-violet-600/15 to-indigo-600/15 blur-[120px] pointer-events-none rounded-full" />

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Value Proposition */}
          <div className="lg:col-span-7 space-y-6 text-left">
            
            {/* Clean unboxed metadata separator */}
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-600 dark:text-purple-400">
              <span>Official Facebook & Instagram Ads</span>
              <span aria-hidden="true" className="text-slate-400">·</span>
              <span>100% UPI Instant Checkout</span>
              <span aria-hidden="true" className="text-slate-400">·</span>
              <span>Zero Card Friction</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.12]">
              Advertise Your Business on{' '}
              <span className="bg-gradient-to-r from-purple-600 to-indigo-500 bg-clip-text text-transparent">
                Facebook & Instagram
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-2xl font-normal leading-relaxed">
              Create, launch and manage your advertising campaigns from one simple platform. Reach active buyers across India with seamless UPI payments and direct Meta Graph API orchestration.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={onStartAdvertising}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 px-7 py-3.5 text-base font-semibold text-white shadow-xl shadow-purple-600/25 transition-all hover:bg-purple-500 active:scale-95"
              >
                Start Advertising
                <ArrowRight className="h-5 w-5" />
              </button>

              <button
                onClick={onViewPackages}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 px-6 py-3.5 text-base font-semibold text-slate-700 dark:text-slate-200 transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                View Packages
              </button>
            </div>

            {/* Honest Auction & Meta Policy Notice */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0D121F]/70 p-4 text-xs text-slate-500 dark:text-slate-400 leading-relaxed max-w-2xl">
              <div className="flex items-start gap-2.5">
                <ShieldCheck className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" />
                <p>
                  <strong className="text-slate-800 dark:text-slate-200">Auction Transparency:</strong> Campaign performance depends on Meta's advertising auction, audience targeting, creative quality, competition and other factors.
                </p>
              </div>
            </div>

            {/* Trust points */}
            <div className="flex flex-wrap items-center gap-6 pt-2 text-xs text-slate-500 dark:text-slate-400">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Transparent durations (5 to 30 days)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>Automatic campaign stop scheduler</span>
              </div>
            </div>

          </div>

          {/* Right Column: Hero Visual Asset */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div className="overflow-hidden rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] shadow-2xl">
                <img
                  src={heroVisualPath}
                  alt="SMAP Facebook & Instagram Advertising Dashboard Interface"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
