import React, { useState } from 'react';
import { ChevronDown, HelpCircle } from 'lucide-react';

export const Faq: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Do you promise guaranteed views, clicks, reach, or sales?',
      a: 'No. SMAP never makes false claims of guaranteed metrics or sales. Real campaign performance depends on Meta\'s advertising auction, audience targeting parameters, creative quality, competition, and real market demand.',
    },
    {
      q: 'How does the UPI payment work? Do I need to scan a QR code?',
      a: 'You do NOT need to scan a QR code. On mobile devices, simply tap "Pay with UPI". The system automatically triggers your installed UPI apps (Google Pay, PhonePe, Paytm, BHIM, etc.) with the exact package amount (₹200, ₹399, ₹549, or ₹749) and merchant information pre-filled.',
    },
    {
      q: 'What happens when my package duration ends?',
      a: 'Our server-side scheduler continuously monitors your campaign\'s end timestamp. As soon as the purchased duration expires (e.g. 5, 10, 14, or 30 days), our scheduler automatically calls Meta\'s Graph API to pause and deactivate the campaign, preventing unexpected ad spend.',
    },
    {
      q: 'Do I need to give you my Facebook or Instagram password?',
      a: 'Never. SMAP never asks for or stores your Facebook or Instagram password. We use official Meta OAuth authorization, where you authorize advertising permissions securely directly via Meta\'s login dialog.',
    },
    {
      q: 'What destination links can I promote?',
      a: 'You can choose between: 1) Your official Website URL, 2) Direct WhatsApp chat link for customer inquiries, 3) Your Facebook Business Page, or 4) Your Instagram Profile page.',
    },
    {
      q: 'Why only Facebook and Instagram?',
      a: 'Phase 1 of SMAP is strictly focused on Meta\'s platforms (Facebook & Instagram) because they represent the highest concentration of visual consumer engagement in India. Google, YouTube, and TikTok are not supported in Phase 1.',
    },
  ];

  return (
    <section className="py-20 border-t border-slate-800/80 bg-[#080C16]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-3 mb-12">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Frequently Asked Questions
          </p>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Transparent Answers to Your Questions
          </h2>
          <p className="text-sm text-slate-400">
            Everything you need to know about our UPI-first advertising workflow.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((item, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-[#0C1220] transition-colors"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="flex w-full items-center justify-between p-5 text-left text-sm font-semibold text-white focus:outline-none"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="h-4 w-4 text-indigo-400 shrink-0" />
                    {item.q}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${
                      isOpen ? 'rotate-180 text-indigo-400' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-800/60">
                    {item.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
