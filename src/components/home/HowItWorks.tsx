import React from 'react';
import { UploadCloud, Users, Smartphone, ShieldCheck, CheckCircle2 } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const steps = [
    {
      num: '01',
      icon: UploadCloud,
      title: 'Craft Creative & Set Destination',
      description: 'Upload your image or video and write your headline and primary copy. Direct customers to your Website, WhatsApp, Facebook Page, or Instagram Profile.',
    },
    {
      num: '02',
      icon: Users,
      title: 'Define Location & Audience',
      description: 'Select your target state, city, age range, gender, and customer interest categories for localized, relevant advertising reach.',
    },
    {
      num: '03',
      icon: Smartphone,
      title: 'Instant Mobile UPI Checkout',
      description: 'Choose 5, 10, 14, or 30 days. Tap "Pay with UPI" on your mobile device to open your installed UPI app with dynamic pre-filled amount.',
    },
    {
      num: '04',
      icon: ShieldCheck,
      title: 'Verify Payment & Link Meta Account',
      description: 'Once payment is verified, securely connect your authorized Meta advertising account via official Meta OAuth without password sharing.',
    },
    {
      num: '05',
      icon: CheckCircle2,
      title: 'Meta Delivery & Automated Expiry Stop',
      description: 'Campaign is submitted to Meta for review and active delivery. Our server scheduler automatically pauses the campaign when the duration ends.',
    },
  ];

  return (
    <section id="how-it-works" className="py-20 border-t border-slate-800/80 bg-[#090D18]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Transparent Workflow
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How SMAP Launches Your Campaigns
          </h2>
          <p className="text-sm text-slate-400">
            A linear, verifiable 5-step process designed for Indian entrepreneurs and business owners.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-5">
          {steps.map((st, idx) => {
            const Icon = st.icon;
            return (
              <div
                key={idx}
                className="relative rounded-2xl border border-slate-800 bg-[#0C1220] p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="font-mono text-xs font-extrabold text-indigo-400">
                      {st.num}
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-500/20">
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-2">{st.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed">{st.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
