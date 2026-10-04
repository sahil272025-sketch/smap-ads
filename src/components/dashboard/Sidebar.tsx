import React from 'react';
import {
  LayoutDashboard,
  Plus,
  Megaphone,
  Layers,
  CreditCard,
  BarChart3,
  User,
  Settings,
  Crown,
  ArrowRight,
  ShieldCheck,
  X,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  onViewPlans?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  setCurrentTab,
  mobileOpen = false,
  onCloseMobile,
  onViewPlans,
}) => {
  const { user } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" /> },
    { id: 'create-ad', label: 'Create Ad', icon: <Plus className="h-4 w-4" /> },
    { id: 'my-campaigns', label: 'Campaigns', icon: <Megaphone className="h-4 w-4" /> },
    { id: 'ad-library', label: 'Ad Library', icon: <Layers className="h-4 w-4" /> },
    { id: 'payments', label: 'Payments', icon: <CreditCard className="h-4 w-4" /> },
    { id: 'reports', label: 'Reports', icon: <BarChart3 className="h-4 w-4" /> },
    { id: 'profile', label: 'Account', icon: <User className="h-4 w-4" /> },
    { id: 'settings', label: 'Settings', icon: <Settings className="h-4 w-4" /> },
  ];

  const handleItemClick = (id: string) => {
    setCurrentTab(id);
    if (onCloseMobile) onCloseMobile();
  };

  const content = (
    <div className="flex h-full flex-col justify-between p-4">
      {/* Top: Logo & Navigation */}
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between px-2">
          <button
            onClick={() => handleItemClick('dashboard')}
            className="flex items-center gap-3 text-left focus:outline-none group"
          >
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white font-extrabold text-lg shadow-lg shadow-purple-600/30">
              S
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              SMAP
            </span>
          </button>

          {/* Mobile close button */}
          {onCloseMobile && (
            <button
              onClick={onCloseMobile}
              className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Navigation list */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900/60'
                }`}
              >
                <span className={isActive ? 'text-white' : 'text-slate-500 dark:text-slate-400'}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </button>
            );
          })}

          {/* Admin Panel Link (if user is admin) */}
          {user?.role === 'admin' && (
            <button
              onClick={() => handleItemClick('admin')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                currentTab === 'admin'
                  ? 'bg-amber-600 text-white shadow-md'
                  : 'text-amber-500 hover:text-amber-400 hover:bg-amber-500/10'
              }`}
            >
              <ShieldCheck className="h-4 w-4" />
              <span>Admin Panel</span>
            </button>
          )}
        </nav>
      </div>

      {/* Bottom: Upgrade to Pro Plan card */}
      <div className="pt-4">
        <div className="relative overflow-hidden rounded-2xl border border-purple-500/30 bg-gradient-to-b from-purple-950/30 to-purple-900/10 dark:from-purple-950/40 dark:to-[#0D121F] p-4 text-left shadow-lg">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 mb-2">
            <Crown className="h-5 w-5" />
          </div>
          <h4 className="text-xs font-bold text-slate-900 dark:text-white">
            Upgrade to Pro Plan
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 mb-3 leading-relaxed">
            Get more campaigns & advanced features
          </p>
          <button
            onClick={() => {
              if (onViewPlans) onViewPlans();
              else handleItemClick('dashboard');
            }}
            className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-purple-600 px-3 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/25 hover:bg-purple-500 active:scale-95 transition-all"
          >
            <span>View Plans</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-slate-200 dark:border-slate-800/80 bg-white dark:bg-[#080C14] h-screen sticky top-0 overflow-y-auto">
        {content}
      </aside>

      {/* Mobile Drawer Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={onCloseMobile}
          />
          <div className="fixed inset-y-0 left-0 w-72 max-w-[85vw] bg-white dark:bg-[#080C14] shadow-2xl z-50 overflow-y-auto border-r border-slate-200 dark:border-slate-800">
            {content}
          </div>
        </div>
      )}
    </>
  );
};
