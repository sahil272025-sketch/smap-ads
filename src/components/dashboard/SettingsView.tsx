import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { Moon, Sun, Laptop, ShieldCheck, Palette, Globe, Check } from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  return (
    <div className="space-y-6 max-w-4xl animate-in fade-in duration-200">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
          {t.settings.title}
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t.settings.subtitle}
        </p>
      </div>

      {/* 1. Language Configuration Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {t.settings.languageTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.settings.languageSubtitle}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          {/* English Option */}
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`relative rounded-2xl border-2 p-5 text-left transition-all ${
              language === 'en'
                ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 shadow-md shadow-purple-600/10'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-[#080C14]'
            }`}
          >
            {language === 'en' && (
              <span className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white">
                <Check className="h-3 w-3" />
              </span>
            )}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl" role="img" aria-label="UK flag">
                🇬🇧
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {t.settings.english}
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.settings.englishDesc}
            </p>
            {language === 'en' && (
              <div className="mt-3 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                {t.settings.active}
              </div>
            )}
          </button>

          {/* Hindi Option */}
          <button
            type="button"
            onClick={() => setLanguage('hi')}
            className={`relative rounded-2xl border-2 p-5 text-left transition-all ${
              language === 'hi'
                ? 'border-purple-600 bg-purple-50/50 dark:bg-purple-950/30 shadow-md shadow-purple-600/10'
                : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50 dark:bg-[#080C14]'
            }`}
          >
            {language === 'hi' && (
              <span className="absolute top-4 right-4 flex h-5 w-5 items-center justify-center rounded-full bg-purple-600 text-white">
                <Check className="h-3 w-3" />
              </span>
            )}
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl" role="img" aria-label="India flag">
                🇮🇳
              </span>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                {t.settings.hindi}
              </h4>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.settings.hindiDesc}
            </p>
            {language === 'hi' && (
              <div className="mt-3 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-100 dark:bg-purple-950/80 text-purple-700 dark:text-purple-300">
                {t.settings.active}
              </div>
            )}
          </button>
        </div>
      </div>

      {/* 2. Theme Configuration Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Palette className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {t.settings.themeTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.settings.themeSubtitle}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Dark Mode Card */}
          <button
            type="button"
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
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t.settings.darkMode}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t.settings.darkModeDesc}
            </p>
          </button>

          {/* Light Mode Card */}
          <button
            type="button"
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
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t.settings.lightMode}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t.settings.lightModeDesc}
            </p>
          </button>

          {/* System Mode Card */}
          <button
            type="button"
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
            <h4 className="text-sm font-bold text-slate-900 dark:text-white">{t.settings.systemMode}</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {t.settings.systemModeDesc}
            </p>
          </button>
        </div>

        <div className="text-xs text-slate-500 dark:text-slate-400 pt-2 flex items-center gap-1.5">
          <span>{t.settings.activeMode}:</span>
          <span className="font-semibold text-purple-600 dark:text-purple-400 capitalize">
            {theme} ({resolvedTheme})
          </span>
        </div>
      </div>

      {/* 3. Platform & Account Info */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] p-6 shadow-sm space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              {t.settings.securityTitle}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {t.settings.securitySubtitle}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <span className="text-slate-400 block text-[11px]">{t.settings.accountEmail}</span>
            <span className="font-semibold text-slate-900 dark:text-white block mt-0.5">{user?.email}</span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <span className="text-slate-400 block text-[11px]">{t.settings.accountRole}</span>
            <span className="font-semibold text-slate-900 dark:text-white capitalize block mt-0.5">{user?.role || 'Customer'}</span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <span className="text-slate-400 block text-[11px]">{t.settings.authProvider}</span>
            <span className="font-semibold text-slate-900 dark:text-white block mt-0.5">
              {user?.google_sub ? 'Google Identity Services (OAuth 2.0)' : 'Email & Password'}
            </span>
          </div>

          <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40">
            <span className="text-slate-400 block text-[11px]">{t.settings.supportedNetworks}</span>
            <span className="font-semibold text-purple-600 dark:text-purple-400 block mt-0.5">
              {t.settings.metaNetworks}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
