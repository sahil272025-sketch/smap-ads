import React, { useEffect, useState } from 'react';
import { Package } from '../../types';
import { api } from '../../lib/api';
import { Check, ArrowRight, Crown } from 'lucide-react';

interface PackagesSectionProps {
  onSelectPackage: (packageId: string) => void;
}

export const PackagesSection: React.FC<PackagesSectionProps> = ({ onSelectPackage }) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getPackages()
      .then((res) => {
        setPackages(res.packages);
      })
      .catch((err) => {
        console.error('Failed to load packages', err);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="packages" className="py-20 border-t border-slate-200 dark:border-slate-800/80 bg-slate-50/50 dark:bg-[#070B14] transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
            Advertising Packages
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Transparent Pricing. Exact Durations.
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Select the advertising duration that matches your campaign goals. Paid exclusively with friction-free mobile UPI.
          </p>
        </div>

        {/* Realistic Auction Disclaimer */}
        <div className="mt-6 max-w-2xl mx-auto text-center rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0C1220]/70 p-3.5 text-xs text-slate-500 dark:text-slate-400">
          <span>We do not promise a fixed number of views, clicks, impressions or sales. Campaign reach is determined by Meta auction dynamics, creative quality, and competition.</span>
        </div>

        {loading ? (
          <div className="mt-12 flex justify-center py-12">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-600 border-t-transparent" />
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {packages.map((pkg) => {
              const isPopular = pkg.price === 399 || pkg.is_popular;
              return (
                <div
                  key={pkg.id}
                  className={`relative flex flex-col justify-between rounded-2xl p-6 transition-all ${
                    isPopular
                      ? 'border-2 border-purple-600 bg-white dark:bg-[#0D121F] shadow-xl shadow-purple-600/10'
                      : 'border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] hover:border-slate-300 dark:hover:border-slate-700 shadow-sm'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-purple-600 px-3.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-md shadow-purple-600/30">
                      Most Popular
                    </div>
                  )}

                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-slate-900 dark:text-white">{pkg.name}</span>
                    </div>

                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                        ₹{pkg.price}
                      </span>
                      <span className="text-xs text-slate-400 font-medium">/ package</span>
                    </div>

                    <div className="mt-2 text-xs font-semibold text-purple-600 dark:text-purple-400">
                      {pkg.duration_days} Days Active Run
                    </div>

                    <div className="mt-6 space-y-3 border-t border-slate-100 dark:border-slate-800/80 pt-5 text-xs text-slate-600 dark:text-slate-300">
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                        <span>Facebook + Instagram advertising</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                        <span>Target audience setup (City, Age, Gender)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                        <span>Campaign management & review</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                        <span>Live campaign status tracking</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-purple-600 dark:text-purple-400 shrink-0" />
                        <span>Frictionless UPI mobile checkout</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-2">
                    <button
                      onClick={() => onSelectPackage(pkg.id)}
                      className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-semibold transition-all active:scale-95 ${
                        isPopular
                          ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30 hover:bg-purple-500'
                          : 'border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <span>Choose Plan</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
