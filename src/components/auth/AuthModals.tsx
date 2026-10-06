import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { X, AlertCircle, ShieldCheck, RefreshCw, Mail, Lock, User as UserIcon, Phone, ChevronDown, ChevronUp } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onOpenLegal?: (type: 'terms' | 'privacy') => void;
  initialError?: string | null;
  initialMode?: 'login' | 'register';
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onOpenLegal,
  initialError,
  initialMode = 'login',
}) => {
  const { user, googleConfig, handleGoogleCredential, loginWithGoogle, loginWithEmail, registerWithEmail } = useAuth();
  const [error, setError] = useState<string | null>(initialError || null);
  const [gisRendered, setGisRendered] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [emailMode, setEmailMode] = useState<'login' | 'register'>(initialMode);

  React.useEffect(() => {
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);

  React.useEffect(() => {
    if (initialMode) {
      setEmailMode(initialMode);
    }
  }, [initialMode]);

  const isDev = Boolean(
    googleConfig?.isDevEnvironment ||
    (typeof window !== 'undefined' && (
      window.location.hostname.includes('ais-dev') ||
      window.location.hostname.includes('localhost') ||
      window.location.hostname === '127.0.0.1'
    ))
  );

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

  // Target client ID: from googleConfig or standard SMAP client ID
  const effectiveClientId = googleConfig?.clientId || '989765718508-t8crqu5je34utcjeblsmt33nfkqj4iol.apps.googleusercontent.com';

  // Render Google Identity Services standard button if GIS SDK is loaded and NOT in DEV mode
  React.useEffect(() => {
    if (!isOpen || isDev || !effectiveClientId) return;

    let mounted = true;
    const renderGis = () => {
      if (!mounted) return;
      const el = document.getElementById('google-gis-button-slot');
      if (el && (window as any).google?.accounts?.id) {
        try {
          (window as any).google.accounts.id.initialize({
            client_id: effectiveClientId,
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
            text: emailMode === 'register' ? 'signup_with' : 'continue_with',
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
  }, [isOpen, effectiveClientId, emailMode, handleGoogleCredential, isDev, onClose, onSuccess]);

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
          <h3 className="text-sm font-semibold text-slate-300">
            {emailMode === 'register' ? 'Create Your Advertiser Account' : 'Welcome Back to SMAP'}
          </h3>
        </div>

        {/* Tab Switcher: Log In vs Sign Up */}
        <div className="flex rounded-xl bg-slate-900/90 p-1 border border-slate-800 mt-5">
          <button
            type="button"
            onClick={() => { setEmailMode('login'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              emailMode === 'login'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Log In
          </button>
          <button
            type="button"
            onClick={() => { setEmailMode('register'); setError(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
              emailMode === 'register'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Sign Up
          </button>
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

        {/* Primary Action: Official Google Sign-In Button (Visible on BOTH Log In & Sign Up) */}
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
              <span className="text-sm font-medium">
                {emailMode === 'register' ? 'Sign up with Google' : 'Continue with Google'}
              </span>
            </button>
          )}

          {isAuthenticating && (
            <div className="flex items-center justify-center gap-2 py-1 text-xs text-slate-400">
              <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-400" />
              <span>Authenticating with Google...</span>
            </div>
          )}
        </div>

        {/* Divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-slate-800"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase">
            <span className="bg-[#0C1220] px-3 text-slate-500 font-semibold tracking-wider">
              Or with email & password
            </span>
          </div>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3">
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
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:border-purple-500 focus:outline-none"
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
                placeholder="name@example.com"
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:border-purple-500 focus:outline-none"
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
                className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:border-purple-500 focus:outline-none"
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
                  className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isAuthenticating}
            className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-semibold text-white hover:bg-purple-500 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-purple-600/25"
          >
            {isAuthenticating ? (
              <RefreshCw className="h-3.5 w-3.5 animate-spin" />
            ) : emailMode === 'login' ? (
              'Sign In with Email'
            ) : (
              'Create Account'
            )}
          </button>
        </form>

        {/* Footer switch between login and register */}
        <div className="mt-4 text-center text-xs text-slate-400">
          {emailMode === 'login' ? (
            <p>
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => { setEmailMode('register'); setError(null); }}
                className="font-bold text-purple-400 hover:text-purple-300 transition-colors"
              >
                Sign Up
              </button>
            </p>
          ) : (
            <p>
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setEmailMode('login'); setError(null); }}
                className="font-bold text-purple-400 hover:text-purple-300 transition-colors"
              >
                Log In
              </button>
            </p>
          )}
        </div>

        {/* Legal links */}
        <div className="mt-4 pt-3 border-t border-slate-800/80 text-center text-[11px] text-slate-500 flex items-center justify-center gap-4">
          <button
            type="button"
            onClick={() => {
              if (onOpenLegal) onOpenLegal('privacy');
              onClose();
            }}
            className="hover:text-slate-400 transition-colors"
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
            className="hover:text-slate-400 transition-colors"
          >
            Terms & Conditions
          </button>
        </div>

      </div>
    </div>
  );
};
