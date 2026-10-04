import React from 'react';
import { Facebook, Instagram, Layers, ShieldCheck, Check } from 'lucide-react';
import adPreviewImg from '../../assets/images/smap_ad_preview_1790756046750.jpg';

export const MetaPlatformShowcase: React.FC = () => {
  return (
    <section className="py-20 border-t border-slate-800/80 bg-[#070A14]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Column: Visual Showcase */}
          <div className="lg:col-span-6 relative">
            <div className="relative rounded-2xl border border-slate-800 bg-[#0B101E] overflow-hidden shadow-2xl">
              <div className="aspect-[4/3] overflow-hidden bg-slate-950">
                <img
                  src={adPreviewImg}
                  alt="Meta Advertising Formats"
                  className="h-full w-full object-cover object-center"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              <div className="p-4 bg-[#090E1A] border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                <div className="flex items-center gap-2">
                  <Facebook className="h-4 w-4 text-blue-500" />
                  <Instagram className="h-4 w-4 text-pink-500" />
                  <span className="font-semibold text-slate-200">Unified Meta Auction Placements</span>
                </div>
                <span className="text-[11px] text-slate-500">Official Graph API Pipeline</span>
              </div>
            </div>
          </div>

          {/* Right Column: Explanations */}
          <div className="lg:col-span-6 space-y-6 text-left">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400">
              <Layers className="h-4 w-4" />
              <span>Facebook & Instagram Exclusivity</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight leading-tight">
              Reach Customers in Their Daily Social Discovery Feeds
            </h2>

            <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
              In India, high-intent discovery occurs primarily inside Meta's ecosystem. SMAP builds native ads that render fluidly across mobile feeds, Instagram Stories, and engaging full-screen Reels.
            </p>

            <div className="space-y-4 pt-2">
              <div className="rounded-xl border border-slate-800 bg-[#0C1220] p-4 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-sm font-bold text-white mb-1">
                  <Instagram className="h-4 w-4 text-pink-400" />
                  Instagram Feed, Stories & Reels
                </div>
                <p className="text-slate-400">
                  Ideal for visual products, fashion, dining, retail, and direct customer engagement via Instagram Profile or WhatsApp.
                </p>
              </div>

              <div className="rounded-xl border border-slate-800 bg-[#0C1220] p-4 text-xs text-slate-300">
                <div className="flex items-center gap-2 text-sm font-bold text-white mb-1">
                  <Facebook className="h-4 w-4 text-blue-400" />
                  Facebook Mobile Feed & Audience Placements
                </div>
                <p className="text-slate-400">
                  Target local communities, demographics, and interest groups looking for local services, consultations, or direct business contact.
                </p>
              </div>
            </div>

            <div className="rounded-lg border border-slate-800/80 bg-slate-900/40 p-3 text-xs text-slate-400">
              <p>
                <strong>Phase 1 Policy:</strong> We deliberately do not clutter the platform with Google Search Ads, YouTube pre-rolls, or TikTok networks. We master Meta feeds first.
              </p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};
