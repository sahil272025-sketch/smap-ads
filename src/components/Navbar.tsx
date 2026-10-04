import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from './ThemeToggle';
import { Menu, X, ArrowRight, ShieldCheck, User as UserIcon } from 'lucide-react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  openAuthModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, openAuthModal }) => {
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleNavClick = (tab: string) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-800/80 bg-white/95 dark:bg-[#080C14]/95 backdrop-blur-md transition-colors">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Wordmark */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleNavClick(user ? 'dashboard' : 'home')}
            className="group flex items-center gap-2 text-left focus:outline-none"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white font-extrabold text-lg shadow-md shadow-purple-600/30">
              S
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              SMAP
            </span>
          </button>
        </div>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-7 text-xs font-semibold text-slate-600 dark:text-slate-300">
          {user ? (
            <>
              <button
                onClick={() => handleNavClick('dashboard')}
                className={`transition-colors hover:text-purple-600 dark:hover:text-white ${currentTab === 'dashboard' ? 'text-purple-600 dark:text-purple-400 font-bold' : ''}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => handleNavClick('create-ad')}
                className={`transition-colors hover:text-purple-600 dark:hover:text-white ${currentTab === 'create-ad' ? 'text-purple-600 dark:text-purple-400 font-bold' : ''}`}
              >
                Create Ad
              </button>
              <button
                onClick={() => handleNavClick('my-campaigns')}
                className={`transition-colors hover:text-purple-600 dark:hover:text-white ${currentTab === 'my-campaigns' ? 'text-purple-600 dark:text-purple-400 font-bold' : ''}`}
              >
                Campaigns
              </button>
              <button
                onClick={() => handleNavClick('payments')}
                className={`transition-colors hover:text-purple-600 dark:hover:text-white ${currentTab === 'payments' ? 'text-purple-600 dark:text-purple-400 font-bold' : ''}`}
              >
                Payments
              </button>
              <button
                onClick={() => handleNavClick('settings')}
                className={`transition-colors hover:text-purple-600 dark:hover:text-white ${currentTab === 'settings' ? 'text-purple-600 dark:text-purple-400 font-bold' : ''}`}
              >
                Settings
              </button>
              {user.role === 'admin' && (
                <button
                  onClick={() => handleNavClick('admin')}
                  className={`flex items-center gap-1.5 transition-colors text-amber-500 hover:text-amber-400 ${currentTab === 'admin' ? 'font-bold underline' : ''}`}
                >
                  <ShieldCheck className="h-4 w-4" />
                  Admin Panel
                </button>
              )}
            </>
          ) : (
            <>
              <button
                onClick={() => handleNavClick('home')}
                className={`transition-colors hover:text-purple-600 dark:hover:text-white ${currentTab === 'home' ? 'text-purple-600 dark:text-purple-400 font-bold' : ''}`}
              >
                Home
              </button>
              <a
                href="/about"
                onClick={(e) => { e.preventDefault(); handleNavClick('about'); }}
                className={`transition-colors hover:text-purple-600 dark:hover:text-white ${currentTab === 'about' ? 'text-purple-600 dark:text-purple-400 font-bold' : ''}`}
              >
                About SMAP
              </a>
              <button
                onClick={() => handleNavClick('how-it-works')}
                className={`transition-colors hover:text-purple-600 dark:hover:text-white ${currentTab === 'how-it-works' ? 'text-purple-600 dark:text-purple-400 font-bold' : ''}`}
              >
                How It Works
              </button>
              <button
                onClick={() => handleNavClick('packages')}
                className={`transition-colors hover:text-purple-600 dark:hover:text-white ${currentTab === 'packages' || currentTab === 'pricing' ? 'text-purple-600 dark:text-purple-400 font-bold' : ''}`}
              >
                Pricing
              </button>
              <button
                onClick={() => handleNavClick('features')}
                className={`transition-colors hover:text-purple-600 dark:hover:text-white ${currentTab === 'features' ? 'text-purple-600 dark:text-purple-400 font-bold' : ''}`}
              >
                Features
              </button>
              <button
                onClick={() => handleNavClick('contact')}
                className={`transition-colors hover:text-purple-600 dark:hover:text-white ${currentTab === 'contact' ? 'text-purple-600 dark:text-purple-400 font-bold' : ''}`}
              >
                Contact
              </button>
            </>
          )}
        </nav>

        {/* Right Actions: Theme Selector & Auth */}
        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle variant="dropdown" />

          {user ? (
            <div className="flex items-center gap-3 pl-2 border-l border-slate-200 dark:border-slate-800">
              <button
                onClick={() => handleNavClick('profile')}
                className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-purple-600 dark:hover:text-purple-400"
              >
                <UserIcon className="h-3.5 w-3.5 text-purple-600 dark:text-purple-400" />
                <span className="truncate max-w-[120px]">{user.name}</span>
              </button>
              <button
                onClick={() => logout()}
                className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => openAuthModal()}
                className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-white transition-colors"
              >
                Login
              </button>
              <button
                onClick={() => openAuthModal()}
                className="inline-flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/25 hover:bg-purple-500 active:scale-95 transition-all"
              >
                <span>Get Started</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Mobile menu trigger */}
        <div className="flex items-center gap-2 md:hidden">
          <ThemeToggle variant="compact" />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl p-2 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] px-4 py-4 md:hidden animate-in fade-in duration-150">
          <div className="flex flex-col gap-2">
            {user ? (
              <>
                <div className="mb-2 border-b border-slate-100 dark:border-slate-800 pb-2 text-xs text-slate-500">
                  Signed in as <span className="font-semibold text-slate-900 dark:text-white">{user.name}</span>
                </div>
                <button
                  onClick={() => handleNavClick('dashboard')}
                  className="text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => handleNavClick('create-ad')}
                  className="text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                >
                  Create Ad
                </button>
                <button
                  onClick={() => handleNavClick('my-campaigns')}
                  className="text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                >
                  Campaigns
                </button>
                <button
                  onClick={() => handleNavClick('payments')}
                  className="text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                >
                  Payments
                </button>
                <button
                  onClick={() => handleNavClick('settings')}
                  className="text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                >
                  Settings
                </button>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    onClick={() => { logout(); setMobileMenuOpen(false); }}
                    className="w-full text-center py-2 text-xs text-red-600 dark:text-red-400 font-semibold"
                  >
                    Logout
                  </button>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={() => handleNavClick('home')}
                  className="text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                >
                  Home
                </button>
                <button
                  onClick={() => handleNavClick('about')}
                  className="text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                >
                  About SMAP
                </button>
                <button
                  onClick={() => handleNavClick('how-it-works')}
                  className="text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                >
                  How It Works
                </button>
                <button
                  onClick={() => handleNavClick('pricing')}
                  className="text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                >
                  Pricing & Packages
                </button>
                <button
                  onClick={() => handleNavClick('features')}
                  className="text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                >
                  Features
                </button>
                <button
                  onClick={() => handleNavClick('contact')}
                  className="text-left px-3 py-2 rounded-lg text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-purple-50 dark:hover:bg-purple-950/30"
                >
                  Contact Us
                </button>
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex gap-2">
                  <button
                    onClick={() => { setMobileMenuOpen(false); openAuthModal(); }}
                    className="flex-1 py-2 text-center rounded-xl bg-purple-600 text-white text-xs font-semibold"
                  >
                    Login / Sign Up
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
