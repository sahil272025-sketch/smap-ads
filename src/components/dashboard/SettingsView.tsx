import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { Moon, Sun, Laptop, ShieldCheck, Bell, Palette, Globe, Check } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          Settings & Preferences
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Customize your SMAP workspace theme, security, and notification preferences.
        </p>
      </div>

      {/* 1. Theme Configuration Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Interface Theme
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select your visual preference. System mode automatically matches your device.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Dark Mode Card */}
          <button
            onClick={() => setTheme('dark')}
            className={`relative rounded-2xl border-2 p-4 text-left transition-all ${
              theme === 'dark'
                ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 shadow-md shadow-purple-600/10'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-[#080C14]'
            }`}
          >
            {theme === 'dark' && (
              <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white">
                <Check className="h-3 w-3" />
              </span>
            )}
            <div className="p-2 rounded-xl bg-[#080C14] text-purple-400 w-fit mb-3 border border-slate-800">
              <Moon className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Dark Mode</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Deep black aesthetic with violet accents, optimized for low-light focus.
            </p>
          </button>

          {/* Light Mode Card */}
          <button
            onClick={() => setTheme('light')}
            className={`relative rounded-2xl border-2 p-4 text-left transition-all ${
              theme === 'light'
                ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 shadow-md shadow-purple-600/10'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-[#080C14]'
            }`}
          >
            {theme === 'light' && (
              <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white">
                <Check className="h-3 w-3" />
              </span>
            )}
            <div className="p-2 rounded-xl bg-white text-amber-500 w-fit mb-3 border border-slate-200 shadow-sm">
              <Sun className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">Light Mode</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Crisp white and clean slate design with high contrast for bright daylight.
            </p>
          </button>

          {/* System Mode Card */}
          <button
            onClick={() => setTheme('system')}
            className={`relative rounded-2xl border-2 p-4 text-left transition-all ${
              theme === 'system'
                ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 shadow-md shadow-purple-600/10'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-[#080C14]'
            }`}
          >
            {theme === 'system' && (
              <span className="absolute top-3 right-3 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white">
                <Check className="h-3 w-3" />
              </span>
            )}
            <div className="p-2 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 w-fit mb-3">
              <Laptop className="h-5 w-5" />
            </div>
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">System (Auto)</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Synchronize dynamically with your computer or phone’s OS settings.
            </p>
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 flex items-center gap-1.5">
          <span>Active mode:</span>
          <span className="font-semibold text-purple-600 dark:text-purple-400 capitalize">
            {theme} ({resolvedTheme} active)
          </span>
        </div>
      </div>

      {/* 2. Platform & Account Info */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Security & Authentication
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Verified credentials and enterprise-level session protection.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <span className="text-slate-400 block text-[11px]">Account Email</span>
            <span className="font-semibold text-slate-900 dark:text-white block mt-0.5">{user?.email}</span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <span className="text-slate-400 block text-[11px]">Account Role</span>
            <span className="font-semibold text-slate-900 dark:text-white capitalize block mt-0.5">{user?.role || 'Customer'}</span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <span className="text-slate-400 block text-[11px]">Authentication Provider</span>
            <span className="font-semibold text-slate-900 dark:text-white block mt-0.5">
              {user?.google_sub ? 'Google Identity Services (OAuth 2.0)' : 'Email & Password'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <span className="text-slate-400 block text-[11px]">Supported Networks</span>
            <span className="font-semibold text-purple-600 dark:text-purple-400 block mt-0.5">
              Official Meta Ads (Facebook & Instagram)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
