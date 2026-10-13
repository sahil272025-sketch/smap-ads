import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import {
  X,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
  Mail,
  Lock,
  User as UserIcon,
  Phone,
  Eye,
  EyeOff,
  KeyRound,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onOpenLegal?: (type: 'terms' | 'privacy') => void;
  initialError?: string | null;
  initialMode?: 'login' | 'register' | 'forgot';
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
  const [successInfo, setSuccessInfo] = useState<string | null>(null);
  const [gisRendered, setGisRendered] = useState<boolean>(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>(initialMode);

  // Password visibility toggles
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);

  // Email/Password form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');

  // Forgot Password / OTP Flow state
  const [recoveryStep, setRecoveryStep] = useState<'contact' | 'otp' | 'new_password' | 'done'>('contact');
  const [recoveryContact, setRecoveryContact] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [maskedTarget, setMaskedTarget] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [otpExpirySeconds, setOtpExpirySeconds] = useState<number>(600);
  const [isOtpLoading, setIsOtpLoading] = useState(false);
  const [deliveryNote, setDeliveryNote] = useState<string | null>(null);

  React.useEffect(() => {
    if (initialError) {
      setError(initialError);
    }
  }, [initialError]);

  React.useEffect(() => {
    if (initialMode) {
      setAuthMode(initialMode);
    }
  }, [initialMode]);

  // Cooldown countdown timer
  React.useEffect(() => {
    if (cooldownRemaining <= 0) return;
    const timer = setInterval(() => {
      setCooldownRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldownRemaining]);

  // Auto-close on successful auth
  React.useEffect(() => {
    if (user && isOpen) {
      onClose();
      if (onSuccess) onSuccess();
    }
  }, [user, isOpen, onClose, onSuccess]);

  const isDev = Boolean(
    googleConfig?.isDevEnvironment ||
    (typeof window !== 'undefined' && (
      window.location.hostname.includes('ais-dev') ||
      window.location.hostname.includes('localhost') ||
      window.location.hostname === '127.0.0.1'
    ))
  );

  const effectiveClientId = googleConfig?.clientId || '989765718508-t8crqu5je34utcjeblsmt33nfkqj4iol.apps.googleusercontent.com';

  // Render Google Identity Services button
  React.useEffect(() => {
    if (!isOpen || isDev || !effectiveClientId || authMode === 'forgot') return;

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
            text: authMode === 'register' ? 'signup_with' : 'continue_with',
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
  }, [isOpen, effectiveClientId, authMode, handleGoogleCredential, isDev, onClose, onSuccess]);

  if (!isOpen) return null;

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessInfo(null);

    if (authMode === 'register' && confirmPassword && password !== confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setIsAuthenticating(true);

    try {
      if (authMode === 'login') {
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

  // STEP 1: Request OTP
  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessInfo(null);
    setDeliveryNote(null);

    if (!recoveryContact.trim()) {
      setError('Please enter your registered email address or phone number.');
      return;
    }

    setIsOtpLoading(true);
    try {
      const res = await api.sendPasswordResetOtp(recoveryContact.trim());
      setMaskedTarget(res.maskedTarget);
      setCooldownRemaining(res.cooldownSeconds || 60);
      setOtpExpirySeconds(res.expiresInSeconds || 600);
      if (res.deliveryNote) {
        setDeliveryNote(res.deliveryNote);
      }
      setSuccessInfo(`6-digit OTP code dispatched to ${res.maskedTarget}`);
      setRecoveryStep('otp');
    } catch (err: any) {
      setError(err.message || 'Could not send verification OTP. Please verify your contact details.');
    } finally {
      setIsOtpLoading(false);
    }
  };

  // STEP 2: Verify OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessInfo(null);

    const clean = otpCode.replace(/\D/g, '');
    if (clean.length !== 6) {
      setError('Please enter the full 6-digit OTP code.');
      return;
    }

    setIsOtpLoading(true);
    try {
      const res = await api.verifyPasswordResetOtp(recoveryContact.trim(), clean);
      setResetToken(res.resetToken);
      setSuccessInfo(res.message || 'OTP verified successfully! Now create your new password.');
      setRecoveryStep('new_password');
    } catch (err: any) {
      setError(err.message || 'Invalid or expired OTP code.');
    } finally {
      setIsOtpLoading(false);
    }
  };

  // STEP 3: Submit New Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessInfo(null);

    if (!newPassword || newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setError('New password and confirm password do not match.');
      return;
    }

    setIsOtpLoading(true);
    try {
      const res = await api.resetPasswordWithOtp({
        contact: recoveryContact.trim(),
        resetToken,
        newPassword,
      });
      setSuccessInfo(res.message);
      setRecoveryStep('done');
    } catch (err: any) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setIsOtpLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-[#0C1220] p-6 sm:p-8 text-slate-100 shadow-2xl max-h-[95vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          aria-label="Close dialog"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Brand Header with Official SMAP Logo */}
        <div className="text-center space-y-2 pt-1">
          <div className="flex items-center justify-center">
            <img
              src="/smap-logo.png"
              alt="SMAP ADS Official Logo"
              className="h-16 w-16 rounded-full object-cover ring-4 ring-cyan-500/40 shadow-xl shadow-cyan-500/25 animate-in zoom-in-95 duration-200"
            />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center justify-center gap-1.5">
            <span>SMAP ADS</span>
          </h2>
          <h3 className="text-xs font-semibold text-slate-300">
            {authMode === 'forgot'
              ? 'Account Recovery & Password Reset'
              : authMode === 'register'
              ? 'Create Your Advertiser Account'
              : 'Welcome Back to SMAP Advertising'}
          </h3>
        </div>

        {/* Switcher: Log In vs Sign Up (Visible when not in forgot mode) */}
        {authMode !== 'forgot' && (
          <div className="flex rounded-xl bg-slate-900/90 p-1 border border-slate-800 mt-5">
            <button
              type="button"
              onClick={() => { setAuthMode('login'); setError(null); setSuccessInfo(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                authMode === 'login'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => { setAuthMode('register'); setError(null); setSuccessInfo(null); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                authMode === 'register'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {/* Error Notice */}
        {error && (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-950/40 p-3.5 text-xs text-red-300 space-y-1.5 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 font-bold text-red-200">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>Notice</span>
            </div>
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* Success Notice */}
        {successInfo && (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-950/40 p-3.5 text-xs text-emerald-300 space-y-1.5 animate-in fade-in duration-150">
            <div className="flex items-center gap-2 font-bold text-emerald-200">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
              <span>Success</span>
            </div>
            <p className="leading-relaxed">{successInfo}</p>
          </div>
        )}

        {/* Delivery Note */}
        {deliveryNote && (
          <div className="mt-2 rounded-xl border border-purple-500/30 bg-purple-950/30 p-2.5 text-[11px] text-purple-300 leading-relaxed">
            <span className="font-semibold block text-white mb-0.5">Note on OTP Delivery:</span>
            {deliveryNote}
          </div>
        )}

        {/* ================= FORGOT PASSWORD / OTP RECOVERY MODE ================= */}
        {authMode === 'forgot' && (
          <div className="mt-5 space-y-4">
            
            {/* Step 1: Request OTP by Email or Phone */}
            {recoveryStep === 'contact' && (
              <form onSubmit={handleRequestOtp} className="space-y-4">
                <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3 text-xs text-slate-400 leading-relaxed">
                  Enter your registered <strong className="text-white">email address</strong> or <strong className="text-white">10-digit mobile number</strong>. We will send a secure 6-digit OTP code to verify your identity.
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Registered Email or Phone Number
                  </label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      value={recoveryContact}
                      onChange={(e) => setRecoveryContact(e.target.value)}
                      placeholder="e.g. name@example.com or 9876543210"
                      className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2.5 pl-9 pr-3 text-xs text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isOtpLoading || !recoveryContact.trim()}
                  className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 py-2.5 text-xs font-bold text-white hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25"
                >
                  {isOtpLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <span>Send 6-Digit Verification OTP</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 2: Enter & Verify OTP */}
            {recoveryStep === 'otp' && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="rounded-xl border border-cyan-500/30 bg-cyan-950/20 p-3 text-xs text-cyan-200">
                  <div className="font-semibold text-white">OTP Dispatched</div>
                  <div className="text-[11px] text-cyan-300/80 mt-0.5">
                    Sent to: <span className="font-mono text-cyan-200">{maskedTarget || recoveryContact}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[11px] font-medium text-slate-300">
                      Enter 6-Digit OTP Code
                    </label>
                    <span className="text-[10px] text-slate-500 font-mono">
                      Expires in: {Math.floor(otpExpirySeconds / 60)}m {otpExpirySeconds % 60}s
                    </span>
                  </div>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      inputMode="numeric"
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="• • • • • •"
                      className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2.5 pl-9 pr-3 text-center tracking-[0.5em] font-mono text-lg font-bold text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isOtpLoading || otpCode.length !== 6}
                  className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white hover:bg-purple-500 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-md shadow-purple-600/25"
                >
                  {isOtpLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    'Verify OTP Code'
                  )}
                </button>

                {/* Resend OTP button with cooldown */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <button
                    type="button"
                    onClick={() => { setRecoveryStep('contact'); setError(null); }}
                    className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px]"
                  >
                    <ArrowLeft className="h-3 w-3" /> Change contact
                  </button>

                  <button
                    type="button"
                    disabled={isOtpLoading || cooldownRemaining > 0}
                    onClick={handleRequestOtp}
                    className="text-purple-400 hover:text-purple-300 disabled:text-slate-600 font-semibold text-[11px] transition-colors"
                  >
                    {cooldownRemaining > 0 ? `Resend OTP (${cooldownRemaining}s)` : 'Resend OTP'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3: Set New Password with Eye Visibility Toggle */}
            {recoveryStep === 'new_password' && (
              <form onSubmit={handleResetPassword} className="space-y-3">
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-950/20 p-2.5 text-xs text-emerald-300">
                  Identity verified. Enter and confirm your new password below.
                </div>

                {/* New Password Field */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    New Password (Min. 6 chars)
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-10 text-xs text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                      aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                    >
                      {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm New Password Field */}
                <div>
                  <label className="block text-[11px] font-medium text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      minLength={6}
                      value={confirmNewPassword}
                      onChange={(e) => setConfirmNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-10 text-xs text-white placeholder:text-slate-600 focus:border-cyan-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                      aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    >
                      {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isOtpLoading || newPassword.length < 6 || newPassword !== confirmNewPassword}
                  className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-cyan-600 py-2.5 text-xs font-bold text-white hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-lg shadow-purple-600/25 mt-2"
                >
                  {isOtpLoading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    'Set New Password & Save'
                  )}
                </button>
              </form>
            )}

            {/* Step 4: Done */}
            {recoveryStep === 'done' && (
              <div className="text-center py-4 space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
                  <CheckCircle2 className="h-7 w-7" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-white">Password Updated!</h4>
                  <p className="text-xs text-slate-400">
                    Your password has been changed. You can now log into SMAP ADS.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setRecoveryStep('contact');
                    setError(null);
                    setSuccessInfo(null);
                  }}
                  className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-bold text-white hover:bg-purple-500 transition-all"
                >
                  Proceed to Log In
                </button>
              </div>
            )}

            {/* Return to Log In link */}
            {recoveryStep !== 'done' && (
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setAuthMode('login');
                    setRecoveryStep('contact');
                    setError(null);
                    setSuccessInfo(null);
                  }}
                  className="text-xs text-purple-400 hover:text-purple-300 font-semibold inline-flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="h-3 w-3" /> Back to Log In
                </button>
              </div>
            )}

          </div>
        )}

        {/* ================= STANDARD LOGIN / SIGN UP MODES ================= */}
        {authMode !== 'forgot' && (
          <>
            {/* Primary Action: Official Google Sign-In Button */}
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
                    {authMode === 'register' ? 'Sign up with Google' : 'Continue with Google'}
                  </span>
                </button>
              )}

              {isAuthenticating && (
                <div className="flex items-center justify-center gap-2 py-1 text-xs text-slate-400">
                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-purple-400" />
                  <span>Authenticating...</span>
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
              {authMode === 'register' && (
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

              {/* Password Field with Eye Visibility Icon */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-medium text-slate-400">Password</label>
                  {authMode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setAuthMode('forgot');
                        setRecoveryStep('contact');
                        setRecoveryContact(email);
                        setError(null);
                        setSuccessInfo(null);
                      }}
                      className="text-[11px] font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-10 text-xs text-white placeholder:text-slate-600 focus:border-purple-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {/* Register: Confirm Password & Phone */}
              {authMode === 'register' && (
                <>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">Confirm Password</label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2 pl-9 pr-10 text-xs text-white placeholder:text-slate-600 focus:border-purple-500 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-2.5 text-slate-400 hover:text-white transition-colors"
                        aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      >
                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-400 mb-1">
                      Phone Number (For UPI Verification & Recovery)
                    </label>
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
                </>
              )}

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full rounded-xl bg-purple-600 py-2.5 text-xs font-semibold text-white hover:bg-purple-500 active:scale-[0.99] transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-md shadow-purple-600/25 mt-2"
              >
                {isAuthenticating ? (
                  <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                ) : authMode === 'login' ? (
                  'Sign In with Email'
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            {/* Footer switch between login and register */}
            <div className="mt-4 text-center text-xs text-slate-400">
              {authMode === 'login' ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => { setAuthMode('register'); setError(null); setSuccessInfo(null); }}
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
                    onClick={() => { setAuthMode('login'); setError(null); setSuccessInfo(null); }}
                    className="font-bold text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    Log In
                  </button>
                </p>
              )}
            </div>
          </>
        )}

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
