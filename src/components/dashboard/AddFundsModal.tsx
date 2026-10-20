import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { api } from '../../lib/api';
import {
  X,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  Smartphone,
  Loader2,
  AppWindow,
  QrCode,
  Info,
} from 'lucide-react';

interface AddFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onSuccess: (newBalance: number) => void;
  recommendedAmount?: number;
}

const PRESET_AMOUNTS = [1, 10, 100, 200, 299, 509, 1000];

const loadRazorpaySdk = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof (window as any).Razorpay !== 'undefined') {
      resolve(true);
      return;
    }
    let script = document.querySelector('script[src*="checkout.razorpay.com"]') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }
    script.onload = () => resolve(typeof (window as any).Razorpay !== 'undefined');
    script.onerror = () => resolve(false);
  });
};

export const AddFundsModal: React.FC<AddFundsModalProps> = ({
  isOpen,
  onClose,
  currentBalance,
  recommendedAmount,
  onSuccess,
}) => {
  const { user } = useAuth();
  const { t, formatCurrency } = useLanguage();
  const [selectedAmount, setSelectedAmount] = useState<number>(recommendedAmount || 100);
  const [customAmount, setCustomAmount] = useState<string>(recommendedAmount ? String(recommendedAmount) : '100');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [processingMode, setProcessingMode] = useState<'standard' | 'native_intent' | null>(null);
  const [fallbackHelp, setFallbackHelp] = useState<string | null>(null);
  const isProcessing = processingMode !== null;

  if (!isOpen) return null;

  const handlePresetSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount(String(amount));
    setError(null);
    setFallbackHelp(null);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(val);
    const num = Number(val);
    if (!isNaN(num)) {
      setSelectedAmount(num);
    }
    setError(null);
    setFallbackHelp(null);
  };

  const amountToAdd = Number(customAmount) || selectedAmount;
  const projectedBalance = Math.round((currentBalance + (amountToAdd > 0 ? amountToAdd : 0)) * 100) / 100;

  const handleLaunchUpiCheckout = async (mode: 'standard' | 'native_intent' = 'standard') => {
    if (!amountToAdd || amountToAdd < 1) {
      setError('Please enter an amount of at least ₹1');
      return;
    }
    setError(null);
    setFallbackHelp(null);
    setProcessingMode(mode);

    try {
      // 1. Create real server-side Razorpay Order with exact amount and secure reference
      const orderRes = await api.createAddFundsOrder(amountToAdd);
      
      if (orderRes.gatewayError) {
        setError(`Payment Gateway Notice: ${orderRes.gatewayError.description} (${orderRes.gatewayError.code}). Please verify the server gateway configuration.`);
        setProcessingMode(null);
        return;
      }

      const keyId = orderRes.keyId;
      const gatewayOrderId = orderRes.gatewayOrderId;
      const paymentRecord = orderRes.payment;

      // 2. Load Razorpay Checkout SDK
      const sdkReady = await loadRazorpaySdk();

      if (sdkReady && keyId) {
        // Device capability detection
        const isMobileDevice = typeof navigator !== 'undefined' && /android|iphone|ipad|ipod/i.test(navigator.userAgent);
        const isAndroid = typeof navigator !== 'undefined' && /android/i.test(navigator.userAgent);

        // If 'native_intent' is chosen on a desktop browser, provide helpful context
        if (mode === 'native_intent' && !isMobileDevice) {
          setFallbackHelp('Native UPI App launch is optimized for Android phones with installed UPI apps. On desktop, Razorpay will display a dynamic QR code for you to scan.');
        }

        // Official Razorpay UPI flow configuration:
        // - 'native_intent': Strictly 'intent' flow. On Android, launches the native OS app chooser directly
        //   without opening an intermediate payment selection webpage.
        // - 'standard': Supported standard flow with both intent and dynamic QR code options.
        const upiFlows = mode === 'native_intent' ? ['intent'] : ['intent', 'qr'];

        const rzpOptions: any = {
          key: keyId,
          amount: Math.round(amountToAdd * 100), // in paise (exact server-verified order amount)
          currency: 'INR',
          name: 'SMAP Advertising',
          description: `Wallet Top-Up: ₹${amountToAdd} (SMAP Ads)`,
          prefill: {
            name: user?.name || 'SMAP Customer',
            email: user?.email || '',
            contact: user?.phone || '',
            method: 'upi',
          },
          config: {
            display: {
              blocks: {
                upi: {
                  name: mode === 'native_intent' ? 'Pay with Installed UPI App' : 'UPI Payment Options',
                  instruments: [
                    {
                      method: 'upi',
                      flows: upiFlows,
                    },
                  ],
                },
              },
              sequence: ['block.upi'],
              preferences: {
                show_default_blocks: false,
              },
            },
          },
          theme: {
            color: '#0891B2', // Cyan brand matching SMAP logo
          },
          notes: {
            purpose: 'WALLET_TOPUP',
            domain: 'https://smap-ads.onrender.com',
            website: 'https://smap-ads.onrender.com',
          },
          handler: async (response: any) => {
            try {
              // 3. Cryptographically verify payment on server & credit wallet atomically
              const verifyRes = await api.verifyWalletPayment({
                paymentId: paymentRecord.id,
                gatewayPaymentId: response.razorpay_payment_id,
                gatewayOrderId: response.razorpay_order_id,
                gatewaySignature: response.razorpay_signature,
              });

              if (verifyRes.success) {
                setSuccessMsg(`Payment of ₹${amountToAdd} successfully verified! New SMAP Balance: ₹${verifyRes.balance.toFixed(2)}`);
                onSuccess(verifyRes.balance);
                setTimeout(() => {
                  onClose();
                }, 1500);
              }
            } catch (err: any) {
              setError(err.message || 'Payment verification failed at server.');
            } finally {
              setProcessingMode(null);
            }
          },
          modal: {
            ondismiss: () => {
              setProcessingMode(null);
              if (!isMobileDevice) {
                setFallbackHelp('On desktop browsers, you can scan the on-screen QR Code using your phone’s PhonePe, GPay, or Paytm app.');
              }
            },
          },
        };

        if (gatewayOrderId) {
          rzpOptions.order_id = gatewayOrderId;
        }

        const rzp = new (window as any).Razorpay(rzpOptions);

        rzp.on('payment.failed', (resp: any) => {
          setProcessingMode(null);
          const reason = resp.error?.description || resp.error?.reason || 'Payment cancelled or no compatible UPI app selected';
          setError(`UPI Payment Notice: ${reason}`);
          if (!isMobileDevice) {
            setFallbackHelp('No UPI apps found directly on this browser? Scan the on-screen QR Code using your phone’s PhonePe, GPay, or Paytm app.');
          } else {
            setFallbackHelp('Ensure PhonePe, Google Pay, or Paytm is installed on your mobile device, or select the QR code option inside checkout.');
          }
        });

        rzp.open();
      } else {
        setError('Could not initialize Razorpay Checkout. Please check your network connection.');
        setProcessingMode(null);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize Razorpay payment');
      setProcessingMode(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B101E] shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden max-h-[92vh] overflow-y-auto">
        
        {/* Glow ambient background matching cyan brand */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500/10 dark:bg-cyan-950/30 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 shadow-sm">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
                <span>{t.addFunds.title}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {t.addFunds.subtitle}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Balance Status Banner */}
        <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl border border-cyan-500/20 bg-cyan-50/50 dark:bg-cyan-950/20">
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              {t.wallet.availableBalance}
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              {formatCurrency(currentBalance)}
            </span>
          </div>
          <div className="border-l border-cyan-500/20 pl-3">
            <span className="text-[11px] font-medium text-cyan-600 dark:text-cyan-300 block">
              {t.wallet.balanceAfter}
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-cyan-600 dark:text-cyan-400 tabular-nums">
              {formatCurrency(projectedBalance)}
            </span>
          </div>
        </div>

        {/* Quick Amount Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {t.addFunds.selectAmount}
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
            {PRESET_AMOUNTS.map((amt) => {
              const isSelected = amountToAdd === amt;
              return (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handlePresetSelect(amt)}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-600 to-cyan-600 text-white border-cyan-400 shadow-md shadow-cyan-500/25 scale-[1.02]'
                      : 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-cyan-500/40'
                  }`}
                >
                  ₹{amt}
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom Amount Input */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            {t.addFunds.customAmount}
          </label>
          <div className="relative">
            <span className="absolute left-4 top-3 text-lg font-bold text-slate-400">
              ₹
            </span>
            <input
              type="text"
              inputMode="numeric"
              value={customAmount}
              onChange={handleCustomChange}
              placeholder="Enter amount (e.g. 509)"
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] py-3 pl-9 pr-4 text-lg font-extrabold text-slate-900 dark:text-white tabular-nums placeholder:text-slate-400 focus:border-cyan-500 focus:outline-none transition-colors"
            />
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            {t.addFunds.minDepositNote}
          </p>
        </div>

        {/* Feedback messages */}
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-50 dark:bg-red-950/40 p-3.5 text-xs text-red-600 dark:text-red-400 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {fallbackHelp && (
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/20 p-3 text-xs text-cyan-200 flex items-start gap-2">
            <Info className="h-4 w-4 shrink-0 mt-0.5 text-cyan-400" />
            <span className="leading-relaxed">{fallbackHelp}</span>
          </div>
        )}

        {successMsg && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 p-3.5 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Payment CTA Section - Two Distinct UPI Options */}
        <div className="space-y-3 pt-2">
          {/* Option 1: Launch UPI App (PhonePe / GPay / Paytm) */}
          <button
            type="button"
            onClick={() => handleLaunchUpiCheckout('standard')}
            disabled={amountToAdd < 1 || isProcessing}
            className="w-full flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-cyan-600 hover:opacity-95 py-3.5 px-6 text-sm font-extrabold text-white shadow-xl shadow-cyan-600/25 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
          >
            {processingMode === 'standard' ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-cyan-200" />
                <span>{t.addFunds.verifying}</span>
              </>
            ) : (
              <>
                <Smartphone className="h-5 w-5 text-cyan-300" />
                <span>{t.addFunds.payWithAnyUpi}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          {/* Clean OR Divider */}
          <div className="relative flex items-center justify-center py-0.5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200 dark:border-slate-800" />
            </div>
            <div className="relative bg-white dark:bg-[#0B101E] px-3 text-[11px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              OR
            </div>
          </div>

          {/* Option 2: Use Your UPI App (Direct Native Intent) */}
          <button
            type="button"
            onClick={() => handleLaunchUpiCheckout('native_intent')}
            disabled={amountToAdd < 1 || isProcessing}
            className="w-full flex items-center justify-center gap-2.5 rounded-2xl border-2 border-cyan-500/40 bg-cyan-500/10 hover:bg-cyan-500/20 py-3.5 px-6 text-sm font-extrabold text-cyan-700 dark:text-cyan-300 shadow-sm active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all cursor-pointer"
          >
            {processingMode === 'native_intent' ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-cyan-400" />
                <span>{t.addFunds.verifying}</span>
              </>
            ) : (
              <>
                <AppWindow className="h-5 w-5 text-cyan-500 dark:text-cyan-400" />
                <span>{t.addFunds.upiOptionTitle}</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 pt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>256-bit encrypted • Razorpay Automated UPI Verification</span>
          </div>
        </div>

      </div>
    </div>
  );
};
