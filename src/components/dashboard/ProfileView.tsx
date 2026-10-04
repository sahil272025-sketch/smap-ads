import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { User, Facebook, ShieldCheck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const ProfileView: React.FC = () => {
  const { user, metaConnection, refreshUser } = useAuth();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [disconnecting, setDisconnecting] = useState(false);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setStatusMsg(null);

    try {
      await api.updateProfile({
        name,
        phone,
      });
      await refreshUser();
      setStatusMsg({ type: 'success', text: 'Contact details updated successfully.' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to update contact details.' });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnectMeta = async () => {
    if (!window.confirm('Are you sure you want to disconnect your Meta advertising account? Active campaigns will retain their current state on Meta.')) {
      return;
    }

    setDisconnecting(true);
    try {
      await api.disconnectMeta();
      await refreshUser();
      setStatusMsg({ type: 'success', text: 'Meta account disconnected successfully.' });
    } catch (err: any) {
      setStatusMsg({ type: 'error', text: err.message || 'Failed to disconnect Meta account.' });
    } finally {
      setDisconnecting(false);
    }
  };

  const handleConnectMeta = async () => {
    try {
      const res = await api.getMetaOAuthUrl();
      if (res.url) {
        window.location.href = res.url;
      }
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: 'Integration Required: Meta App ID & App Secret are not configured in server environment. External credentials remain optional in development mode.',
      });
    }
  };

  return (
    <div className="max-w-4xl space-y-6 sm:space-y-8 animate-in fade-in duration-200">
      
      {/* Header */}
      <div className="border-b border-slate-200 dark:border-slate-800/80 pb-6">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Customer Profile & Authenticated Account
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          Verified Google account details and Meta advertising authorizations.
        </p>
      </div>

      {statusMsg && (
        <div
          className={`rounded-2xl border p-4 text-xs flex items-center gap-2.5 ${
            statusMsg.type === 'success'
              ? 'border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
              : 'border-red-500/30 bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300'
          }`}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Google Account Verification Card */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] p-6 sm:p-8 space-y-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {user?.profile_picture ? (
              <img
                src={user.profile_picture}
                alt={user.name}
                className="h-12 w-12 rounded-xl object-cover border border-slate-200 dark:border-slate-700"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-600 text-white font-bold text-lg shadow-md shadow-purple-600/30">
                {user?.name?.charAt(0) || 'S'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 dark:text-white">{user?.name}</h2>
                <span className="rounded-full bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-500/30 px-2.5 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Verified with Google
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">{user?.email}</p>
            </div>
          </div>

          <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
            Role: <span className="font-semibold text-slate-900 dark:text-white capitalize">{user?.role}</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs">
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 block">Google Subject ID (sub):</span>
            <span className="font-mono text-slate-700 dark:text-slate-300 block truncate mt-0.5">
              {user?.google_sub || 'Verified'}
            </span>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 block">Account Status:</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400 block mt-0.5">
              {user?.status || 'ACTIVE'}
            </span>
          </div>
          <div className="rounded-xl bg-slate-50 dark:bg-slate-900/60 p-3 border border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 block">Last Sign-In:</span>
            <span className="font-mono text-slate-700 dark:text-slate-300 block mt-0.5">
              {user?.last_login_at ? new Date(user.last_login_at).toLocaleString() : 'Just now'}
            </span>
          </div>
        </div>
      </div>

      {/* Meta Connection Section */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] p-6 sm:p-8 space-y-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40">
              <Facebook className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">Meta Advertising Authorization</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Official OAuth connection for Facebook & Instagram campaigns
              </p>
            </div>
          </div>

          <span
            className={`rounded-full px-3 py-0.5 text-xs font-semibold ${
              metaConnection?.connected
                ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-500/30'
            }`}
          >
            {metaConnection?.connected ? 'Connected' : 'Not Connected'}
          </span>
        </div>

        {metaConnection?.connected ? (
          <div className="space-y-4 pt-2">
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#090D18] p-4 text-xs text-slate-700 dark:text-slate-300 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Authorized Meta User:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{metaConnection.meta_user_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Ad Accounts Available:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {metaConnection.ad_accounts?.length || 0} Ad Accounts
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">OAuth Security:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Active & Validated</span>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                disabled={disconnecting}
                onClick={handleDisconnectMeta}
                className="rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-950/30 px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 disabled:opacity-50"
              >
                {disconnecting ? 'Disconnecting...' : 'Disconnect Meta Account'}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              To submit paid campaigns to Facebook & Instagram, authorize your Meta account via official OAuth. SMAP never asks for or stores your Facebook or Instagram password.
            </p>

            <button
              type="button"
              onClick={handleConnectMeta}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-purple-500 transition-all shadow-md shadow-purple-600/25 active:scale-95"
            >
              <Facebook className="h-4 w-4" />
              Connect Meta Advertising Account
            </button>
          </div>
        )}
      </div>

      {/* Contact Details Form */}
      <form onSubmit={handleUpdate} className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0D121F] p-6 sm:p-8 space-y-6 shadow-sm">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">Campaign Notification Contact</h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Your WhatsApp/phone number for ad status updates and delivery notifications.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Display Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2.5 px-3 text-xs text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Email Address</label>
            <input
              type="email"
              disabled
              value={user?.email || ''}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-950 py-2.5 px-3 text-xs text-slate-500 cursor-not-allowed"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">Managed by Google Authentication.</span>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Phone Number (WhatsApp notifications)</label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 py-2.5 px-3 text-xs text-slate-900 dark:text-white focus:border-purple-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">Account Registration Date</label>
            <div className="py-2.5 text-xs text-slate-700 dark:text-slate-300 font-mono">
              {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Active'}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-purple-600 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-purple-600/25 hover:bg-purple-500 active:scale-95 transition-all disabled:opacity-50"
          >
            {saving ? 'Saving changes...' : 'Save Contact Details'}
          </button>
        </div>
      </form>

    </div>
  );
};
