import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
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
  const [selectedAmount, setSelectedAmount] = useState<number>(recommendedAmount || 100);
  const [customAmount, setCustomAmount] = useState<string>(recommendedAmount ? String(recommendedAmount) : '100');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const handlePresetSelect = (amount: number) => {
    setSelectedAmount(amount);
    setCustomAmount(String(amount));
    setError(null);
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    setCustomAmount(val);
    const num = Number(val);
    if (!isNaN(num)) {
      setSelectedAmount(num);
    }
    setError(null);
  };

  const amountToAdd = Number(customAmount) || selectedAmount;
  const projectedBalance = Math.round((currentBalance + (amountToAdd > 0 ? amountToAdd : 0)) * 100) / 100;

  const handleLaunchUpiCheckout = async () => {
    if (!amountToAdd || amountToAdd < 1) {
      setError('Please enter an amount of at least ₹1');
      return;
    }
    setError(null);
    setIsProcessing(true);

    // If currently running in the temporary AI Studio preview environment,
    // Razorpay domain security requires checkout to originate from the registered production website:
    const isPreviewDomain = typeof window !== 'undefined' && window.location.hostname.includes('run.app');
    if (isPreviewDomain) {
      const prodUrl = `https://smap-ads.onrender.com/?tab=wallet&add_funds=${amountToAdd}`;
      window.location.href = prodUrl;
      return;
    }

    try {
      // 1. Create real server-side Razorpay Order
      const orderRes = await api.createAddFundsOrder(amountToAdd);
      
      if (orderRes.gatewayError) {
        setError(`Payment Gateway Notice: ${orderRes.gatewayError.description} (${orderRes.gatewayError.code}). Please verify the server gateway configuration.`);
        setIsProcessing(false);
        return;
      }

      const keyId = orderRes.keyId;
      const gatewayOrderId = orderRes.gatewayOrderId;
      const paymentRecord = orderRes.payment;

      // 2. Load Razorpay Checkout SDK
      const sdkReady = await loadRazorpaySdk();

      if (sdkReady && keyId) {
        const rzpOptions: any = {
          key: keyId,
          amount: Math.round(amountToAdd * 100), // in paise
          currency: 'INR',
          name: 'SMAP Advertising',
          description: `Add Funds to SMAP Wallet (₹${amountToAdd})`,
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
                  name: 'Pay via UPI',
                  instruments: [{ method: 'upi' }],
                },
              },
              sequence: ['block.upi'],
              preferences: {
                show_default_blocks: true,
              },
            },
          },
          theme: {
            color: '#7C3AED',
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
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
            },
          },
        };

        if (gatewayOrderId) {
          rzpOptions.order_id = gatewayOrderId;
        }

        const rzp = new (window as any).Razorpay(rzpOptions);

        rzp.on('payment.failed', (resp: any) => {
          setIsProcessing(false);
          const reason = resp.error?.description || resp.error?.reason || 'Payment failed or cancelled in UPI app';
          setError(`UPI Payment Notice: ${reason}`);
        });

        rzp.open();
      } else {
        setError('Could not initialize Razorpay Checkout. Please check your network connection.');
        setIsProcessing(false);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to initialize Razorpay payment');
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0B101E] shadow-2xl p-6 sm:p-8 space-y-6 overflow-hidden max-h-[92vh] overflow-y-auto">
        
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-purple-600/10 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-sm">
              <Wallet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Add Funds to Wallet
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Automated Razorpay UPI Payment • Instant Wallet Credit
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
        <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl border border-purple-500/20 bg-purple-50/50 dark:bg-purple-950/20">
          <div>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 block">
              Current Balance
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-slate-900 dark:text-white tabular-nums">
              ₹{currentBalance.toFixed(2)}
            </span>
          </div>
          <div className="border-l border-purple-500/20 pl-3">
            <span className="text-[11px] font-medium text-purple-600 dark:text-purple-300 block">
              Projected (After Payment)
            </span>
            <span className="text-lg sm:text-xl font-extrabold text-purple-600 dark:text-purple-400 tabular-nums">
              ₹{projectedBalance.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Quick Amount Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
            Select Preset Amount
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
                      ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30 scale-[1.02]'
                      : 'bg-slate-50 dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-purple-500/40'
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
            Or Enter Custom Amount (₹)
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
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] py-3 pl-9 pr-4 text-lg font-extrabold text-slate-900 dark:text-white tabular-nums placeholder:text-slate-400 focus:border-purple-500 focus:outline-none transition-colors"
            />
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Minimum top-up: ₹1 (Testing Supported) • Automated Razorpay verification
          </p>
        </div>

        {/* Feedback messages */}
        {error && (
          <div className="rounded-2xl border border-red-500/30 bg-red-50 dark:bg-red-950/40 p-3.5 text-xs text-red-600 dark:text-red-400 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {successMsg && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/40 p-3.5 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Payment CTA Section - ONLY ONE "Launch UPI App" BUTTON */}
        <div className="space-y-4 pt-2">
          {typeof window !== 'undefined' && window.location.hostname.includes('run.app') && (
            <div className="rounded-2xl border border-purple-500/20 bg-purple-500/10 p-3 text-[11px] text-purple-300">
              <span className="font-semibold block text-white mb-0.5">Production Razorpay Gateway:</span>
              <span>Razorpay requires payments to originate from your registered domain <strong>smap-ads.onrender.com</strong>. Tapping below opens your live site directly.</span>
            </div>
          )}

          {/* Main button: Launch UPI App (PhonePe / GPay / Paytm) */}
          <button
            type="button"
            onClick={handleLaunchUpiCheckout}
            disabled={amountToAdd < 1 || isProcessing}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-purple-600 hover:bg-purple-500 py-4 px-6 text-sm font-extrabold text-white shadow-xl shadow-purple-600/35 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all"
          >
            {isProcessing ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin text-purple-200" />
                <span>Opening UPI Checkout...</span>
              </>
            ) : (
              <>
                <Smartphone className="h-5 w-5 text-emerald-300" />
                <span>Launch UPI App (PhonePe / GPay / Paytm)</span>
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
