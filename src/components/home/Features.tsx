import React from 'react';
import {
  FileText,
  UploadCloud,
  Users,
  Facebook,
  Instagram,
  Smartphone,
  BarChart3,
  Activity,
  TimerOff,
  History,
  LayoutDashboard,
  Headphones,
} from 'lucide-react';

export const Features: React.FC = () => {
  const featureList = [
    {
      icon: FileText,
      title: 'Create Ad',
      description: 'Streamlined multi-step advertising builder for custom headlines, primary text, and target destinations.',
    },
    {
      icon: UploadCloud,
      title: 'Upload Image or Video',
      description: 'Built-in media uploader supporting JPEG, PNG, WEBP, MP4, and MOV formats with strict aspect and size validation.',
    },
    {
      icon: Users,
      title: 'Audience Targeting',
      description: 'Configure geographic reach by country, state, or city alongside target age brackets and relevant consumer interests.',
    },
    {
      icon: Facebook,
      title: 'Facebook Advertising',
      description: 'Direct placement on Facebook mobile feeds and audiences via official Meta Graph API endpoints.',
    },
    {
      icon: Instagram,
      title: 'Instagram Advertising',
      description: 'Seamless campaign deployment to Instagram feed, story placements, and vertical reels.',
    },
    {
      icon: Smartphone,
      title: 'UPI Payment',
      description: 'Mobile-first UPI intent triggering your installed UPI apps without QR code scanning or card details.',
    },
    {
      icon: BarChart3,
      title: 'Campaign Tracking',
      description: 'Direct visibility into campaign metrics and delivery status directly pulled from Meta Graph API.',
    },
    {
      icon: Activity,
      title: 'Campaign Status',
      description: 'Transparent progression from Draft, Payment Pending, Under Review, Active, to Paused or Completed.',
    },
    {
      icon: TimerOff,
      title: 'Automatic Campaign Stop',
      description: 'Server-side automated scheduler that pauses campaigns on Meta the exact moment their duration expires.',
    },
    {
      icon: History,
      title: 'Payment History',
      description: 'Comprehensive audit trail of all UPI payments, UTR references, verification sources, and timestamps.',
    },
    {
      icon: LayoutDashboard,
      title: 'Customer Dashboard',
      description: 'Unified command center to monitor active campaigns, review spending, and submit new advertising creative.',
    },
    {
      icon: Headphones,
      title: 'Support System',
      description: 'Integrated ticket system for campaign assistance, policy questions, and payment verification inquiries.',
    },
  ];

  return (
    <section id="features" className="py-20 border-t border-slate-800/80 bg-[#090D18]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-400">
            Platform Capabilities
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Engineered for Real Advertising Performance
          </h2>
          <p className="text-sm text-slate-400">
            Every feature on SMAP is backed by real server-side infrastructure and official Meta API endpoints.
          </p>
        </div>

        <div className="mt-14 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {featureList.map((f, idx) => {
            const Icon = f.icon;
            return (
              <div
                key={idx}
                className="rounded-xl border border-slate-800 bg-[#0C1220]/80 p-5 transition-all hover:border-indigo-500/30 hover:bg-[#0F172A]"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-950/60 text-indigo-400 border border-indigo-500/20 mb-3.5">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1.5">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{f.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
