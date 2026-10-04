import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, AlertCircle, ShieldCheck, RefreshCw, Mail, Lock, User as UserIcon, Phone, ChevronDown, ChevronUp } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onOpenLegal?: (type: 'terms' | 'privacy') => void;
  initialError?: string | null;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, onOpenLegal, initialError }) => {
  const { user, googleConfig, handleGoogleCredential, loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const [error, setError] = useState<string | null>(initialError || null);
  const [gisRendered, setGisRendered] = useState<boolean>(false);

  React.useEffect(() => {
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showEmailAuth, setShowEmailAuth] = useState(false);
  const [emailMode, setEmailMode] = useState<'login' | 'register'>('login');

  const isDev = Boolean(
    googleConfig?.isDevEnvironment ||
    (typeof window !== 'undefined' && (
      window.location.hostname.includes('ais-dev') ||
      window.location.hostname.includes('localhost') ||
      window.location.hostname === '127.0.0.1'
    ))
  );

  // In DEV environment, default email/password auth to open since Google Sign-In is isolated to production
  React.useEffect(() => {
    if (isDev) {
      setShowEmailAuth(true);
    }
  }, [isDev]);

  // Email form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Auto-close and navigate on successful login
  React.useEffect(() => {
    if (user && isOpen) {
      onClose();
      if (onSuccess) onSuccess();
    }
  }, [user, isOpen, onClose, onSuccess]);

  // Render Google Identity Services standard button if GIS SDK is loaded and NOT in DEV mode
  React.useEffect(() => {
    if (!isOpen || isDev || !googleConfig?.isConfigured || !googleConfig.clientId) return;

    let mounted = true;
    const renderGis = () => {
      if (!mounted) return;
      const el = document.getElementById('google-gis-button-slot');
      if (el && (window as any).google?.accounts?.id) {
        try {
          // Official Google Identity Services initialization
          // ux_mode: 'popup' with callback functions seamlessly across both mobile and desktop.
          // It receives the cryptographic ID token directly without triggering an OAuth redirect,
          // preventing redirect_uri_mismatch errors on published production and custom domains.
          (window as any).google.accounts.id.initialize({
            client_id: googleConfig.clientId,
            ux_mode: 'popup',
            callback: async (response: any) => {
              if (response && response.credential) {
                try {
                  setIsAuthenticating(true);
                  setError(null);
                  await handleGoogleCredential(response.credential);
                  onClose();
                  if (onSuccess) onSuccess();
                } catch (err: any) {
                  setError(err.message || 'Google authentication failed');
                } finally {
                  setIsAuthenticating(false);
                }
              }
            },
            auto_select: false,
            cancel_on_tap_outside: true,
          });

          (window as any).google.accounts.id.renderButton(el, {
            type: 'standard',
            theme: 'outline',
            size: 'large',
            text: 'continue_with',
            shape: 'rectangular',
            width: el.offsetWidth || 340,
          });
          setGisRendered(true);
        } catch {
          // ignore
        }
      }
    };

    renderGis();
    const t = setTimeout(renderGis, 300);
    const t2 = setTimeout(renderGis, 800);
    const t3 = setTimeout(renderGis, 1500);

    // Keep checking if GIS rendered its iframe
    const interval = setInterval(() => {
      const el = document.getElementById('google-gis-button-slot');
      if (el && el.childElementCount > 0) {
        setGisRendered(true);
        clearInterval(interval);
      } else {
        renderGis();
      }
    }, 500);

    const timeout = setTimeout(() => {
      clearInterval(interval);
    }, 6000);

    return () => {
      mounted = false;
      clearTimeout(t);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(timeout);
      clearInterval(interval);
    };
  }, [isOpen, googleConfig, handleGoogleCredential, onClose, onSuccess]);

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsAuthenticating(true);

    try {
      if (emailMode === 'login') {
        await loginWithEmail({ email, password });
      } else {
        await registerWithEmail({ name, email, password, phone });
      }
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#0C1220] p-6 sm:p-8 text-slate-100 shadow-2xl">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Brand Header */}
        <div className="text-center space-y-2 pt-1">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600 font-extrabold text-white text-xl shadow-lg shadow-purple-600/30">
            S
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white">SMAP</h2>
          <h3 className="text-lg font-semibold text-slate-200">
            {showEmailAuth && emailMode === 'register' ? 'Create Your Account' : 'Welcome back'}
          </h3>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            Sign in securely with your Google Account
          </p>
        </div>

        {/* Error Notice */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/40 p-3.5 text-xs text-red-300 space-y-1.5 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 font-bold text-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>Authentication Notice</span>
            </div>
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* If DEV Environment: Google Sign-In is isolated to production deployment */}
        {isDev ? (
          <div className="mt-4 rounded-xl border border-sky-500/30 bg-sky-950/40 p-3.5 text-xs text-sky-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-sky-300 flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-sky-400" />
                Development Preview Environment
              </span>
              <span className="rounded bg-sky-900/60 border border-sky-500/40 px-2 py-0.5 text-[10px] font-bold text-sky-300">
                DEV Mode
              </span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              Official Google Sign-In is active on the production deployment (<span className="font-mono text-sky-200">ais-pre</span>). In this DEV preview, please sign in below with your email and password.
            </p>
          </div>
        ) : (
          <>
            {/* Status notice if configuration missing */}
            {googleConfig && !googleConfig.isConfigured && (
              <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-xs text-amber-200/90 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-amber-300 flex items-center gap-1.5">
                    <ShieldCheck className="h-4 w-4 text-amber-400" />
                    Google Sign-In Configuration Required
                  </span>
                  <span className="rounded bg-amber-900/60 border border-amber-500/40 px-2 py-0.5 text-[10px] font-bold text-amber-300">
                    Setup Required
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-300">
                  Real Google Sign-In requires <span className="font-mono text-amber-200">GOOGLE_CLIENT_ID</span> and <span className="font-mono text-amber-200">GOOGLE_CLIENT_SECRET</span> in your server environment variables.
                </p>
                <div className="rounded-lg bg-slate-950/80 p-2.5 font-mono text-[10px] text-slate-400 border border-slate-800 space-y-1">
                  <div>Callback URI: <span className="text-slate-200">{googleConfig.redirectUri}</span></div>
                  <div>OAuth Scopes: <span className="text-slate-200">openid, email, profile</span></div>
                </div>
              </div>
            )}

            {/* Primary Action: Official Google Sign-In Button on Production */}
            <div className="mt-5 space-y-2">
              <div
                id="google-gis-button-slot"
                className={`w-full flex justify-center min-h-[44px] ${gisRendered ? 'block' : 'hidden'}`}
              ></div>

              {!gisRendered && (
                <button
                  type="button"
                  disabled={isAuthenticating}
                  onClick={async () => {
                    setIsAuthenticating(true);
                    setError(null);
                    try {
                      await loginWithGoogle();
                    } catch (err: any) {
                      setError(err.message || 'Google authentication failed. Please try again.');
                    } finally {
                      setIsAuthenticating(false);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-3 rounded-xl border border-slate-700 bg-white hover:bg-slate-100 text-slate-800 font-semibold py-2.5 px-4 shadow-sm transition-all active:scale-[0.99] disabled:opacity-60 cursor-pointer"
                >
                  <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                  <span className="text-sm font-medium">Continue with Google</span>
                </button>
              )}

              {isAuthenticating && !showEmailAuth && (
                <div className="flex items-center justify-center gap-2 py-1 text-xs text-slate-400">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-400" />
                  <span>Authenticating with Google...</span>
                </div>
              )}
            </div>

            {/* Security & Password policy notice */}
            <div className="mt-4 rounded-xl border border-slate-800 bg-[#090E1A] p-3 text-[11px] text-slate-400 text-center leading-relaxed">
              <p>
                Google handles your authentication securely. SMAP never asks for, accesses, or stores your Google password.
              </p>
            </div>
          </>
        )}

        {/* Secondary: Email/Password Authentication (Always available, default open in DEV) */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <button
            type="button"
            onClick={() => setShowEmailAuth(!showEmailAuth)}
            className="flex w-full items-center justify-between text-xs text-slate-400 hover:text-slate-200 transition-colors py-1"
          >
            <span>{isDev ? 'Sign in or register with email & password' : 'Or sign in with email & password'}</span>
            {showEmailAuth ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>

          {showEmailAuth && (
            <form onSubmit={handleEmailSubmit} className="mt-3 space-y-3 animate-in fade-in duration-150">
              <div className="flex border-b border-slate-800 mb-2">
                <button
                  type="button"
                  onClick={() => setEmailMode('login')}
                  className={`pb-1.5 px-3 text-xs font-semibold ${emailMode === 'login' ? 'text-purple-400 border-b-2 border-purple-500' : 'text-slate-500'}`}
                >
                  Log In
                </button>
                <button
                  type="button"
                  onClick={() => setEmailMode('register')}
                  className={`pb-1.5 px-3 text-xs font-semibold ${emailMode === 'register' ? 'text-purple-400 border-b-2 border-purple-500' : 'text-slate-500'}`}
                >
                  Sign Up
                </button>
              </div>

              {emailMode === 'register' && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-400 mb-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                  />
                </div>
              </div>

              {emailMode === 'register' && (
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1">Phone Number (Optional)</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:border-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-semibold text-white hover:bg-purple-500 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {isAuthenticating && showEmailAuth ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : emailMode === 'login' ? (
                  'Sign In with Email'
                ) : (
                  'Create Account'
                )}
              </button>
            </form>
          )}
        </div>

        {/* Legal links */}
        <div className="mt-5 pt-3 border-t border-slate-800/80 text-center text-xs text-slate-500 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => {
              if (onOpenLegal) onOpenLegal('privacy');
              onClose();
            }}
            className="hover:text-slate-300 transition-colors"
          >
            Privacy Policy
          </button>
          <span aria-hidden="true">·</span>
          <button
            type="button"
            onClick={() => {
              if (onOpenLegal) onOpenLegal('terms');
              onClose();
            }}
            className="hover:text-slate-300 transition-colors"
          >
            Terms & Conditions
          </button>
        </div>

      </div>
    </div>
  );
};
