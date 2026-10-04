import React from 'react';

interface FooterProps {
  onOpenLegal: (type: 'terms' | 'privacy' | 'refund' | 'advertising') => void;
  onNavigate: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenLegal, onNavigate }) => {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-[#060911] text-slate-500 dark:text-slate-400 py-12 transition-colors">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          
          {/* Brand & Mission */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-600 font-extrabold text-white text-base shadow-md shadow-purple-600/30">
                S
              </div>
              <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
                SMAP
              </span>
            </div>
            <p className="text-xs font-semibold text-purple-600 dark:text-purple-400">
              Sahil Marketing Ads Powerful
            </p>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 max-w-sm">
              A high-precision advertising platform empowering Indian businesses to launch and manage official Facebook & Instagram campaigns.
            </p>
          </div>

          {/* Supported Networks */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Supported Networks
            </h4>
            <ul className="mt-4 space-y-2 text-xs">
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-slate-700 dark:text-slate-300" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                </svg>
                <button
                  onClick={() => onNavigate('features')}
                  className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  Facebook Advertising
                </button>
              </li>
              <li className="flex items-center gap-2">
                <svg className="h-4 w-4 text-slate-700 dark:text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
                <button
                  onClick={() => onNavigate('features')}
                  className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  Instagram Advertising
                </button>
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Company & Service
            </h4>
            <ul className="mt-4 space-y-2 text-xs">
              <li>
                <a
                  href="/about"
                  onClick={(e) => { e.preventDefault(); onNavigate('about'); }}
                  className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  About SMAP
                </a>
              </li>
              <li>
                <a
                  href="/pricing"
                  onClick={(e) => { e.preventDefault(); onNavigate('pricing'); }}
                  className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  Pricing & Packages
                </a>
              </li>
              <li>
                <a
                  href="/how-it-works"
                  onClick={(e) => { e.preventDefault(); onNavigate('how-it-works'); }}
                  className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  How It Works
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  onClick={(e) => { e.preventDefault(); onNavigate('contact'); }}
                  className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  Contact Us
                </a>
              </li>
            </ul>
          </div>

          {/* Legal Compliance */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
              Legal & Policies
            </h4>
            <ul className="mt-4 space-y-2 text-xs">
              <li>
                <a
                  href="/terms"
                  onClick={(e) => { e.preventDefault(); onNavigate('terms'); }}
                  className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  Terms & Conditions
                </a>
              </li>
              <li>
                <a
                  href="/privacy"
                  onClick={(e) => { e.preventDefault(); onNavigate('privacy'); }}
                  className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="/refund"
                  onClick={(e) => { e.preventDefault(); onNavigate('refund'); }}
                  className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  Refund & Cancellation
                </a>
              </li>
              <li>
                <a
                  href="/contact"
                  onClick={(e) => { e.preventDefault(); onNavigate('contact'); }}
                  className="hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                >
                  Grievance & Support
                </a>
              </li>
            </ul>
          </div>

        </div>

        <div className="mt-10 pt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500">
          <p>© {new Date().getFullYear()} SMAP (Sahil Marketing Ads Powerful). All rights reserved.</p>
          <p>Official Facebook & Instagram Marketing Partner Integration.</p>
        </div>
      </div>
    </footer>
  );
};
