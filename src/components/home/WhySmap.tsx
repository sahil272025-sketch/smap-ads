import React from 'react';
import { Target, Zap, Clock, ShieldCheck, Check } from 'lucide-react';

export const WhySmap: React.FC = () => {
  const points = [
    {
      icon: Target,
      title: 'Exclusively Facebook & Instagram',
      description: 'Zero distractions from complex advertising channels. We specialize 100% in Meta social feeds, stories, and reels where Indian buyers spend their time.',
    },
    {
      icon: Zap,
      title: 'Frictionless Mobile UPI Intent',
      description: 'No manual credit card entries, no OTP delays, and no scanning QR codes. Tap Pay with UPI on mobile to launch your preferred UPI app with pre-filled details.',
    },
    {
      icon: Clock,
      title: 'Automated Campaign Stop',
      description: 'Exact budget protection. Our server scheduler monitors your purchased duration (5 to 30 days) and automatically pauses the Meta campaign right on schedule.',
    },
    {
      icon: ShieldCheck,
      title: 'Transparent Meta Account Ownership',
      description: 'Your campaigns run directly through authorized Meta OAuth tokens. No fake statistics, no opaque markups, and full alignment with Meta Advertising Policies.',
    },
  ];

  return (
    <section className="py-20 border-t border-slate-800/80 bg-[#080C16]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Why Indian Businesses Choose SMAP
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Designed for Simplicity, Velocity and Real Growth
          </h2>
          <p className="text-sm sm:text-base text-slate-400">
            Running digital advertising shouldn't require hiring an expensive agency or navigating confusing corporate ad managers. SMAP bridges the gap with a clean, honest, and mobile-ready platform.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {points.map((pt, idx) => {
            const Icon = pt.icon;
            return (
              <div
                key={idx}
                className="group relative rounded-xl border border-slate-800/80 bg-[#0C1220] p-6 transition-all hover:border-slate-700 hover:bg-[#0F1628]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-500/20 mb-5 group-hover:scale-105 transition-transform">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-base font-bold text-white mb-2">{pt.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{pt.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
