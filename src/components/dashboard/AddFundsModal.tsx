import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../lib/api';
import { Payment } from '../../types';
import {
  X,
  Wallet,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  CreditCard,
  Smartphone,
  Copy,
  ExternalLink,
} from 'lucide-react';

interface AddFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onSuccess: (newBalance: number) => void;
  recommendedAmount?: number;
}

const PRESET_AMOUNTS = [1, 10, 100, 200, 500, 1000];

const loadRazorpaySdk = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof (window as any).Razorpay !== 'undefined') {
      return resolve(true);
    }
    let script = document.querySelector('script[src*="checkout.razorpay.com"]') as HTMLScriptElement | null;
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);
    }

    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      if (typeof (window as any).Razorpay !== 'undefined') {
        clearInterval(interval);
        resolve(true);
      } else if (attempts > 30) {
        clearInterval(interval);
        resolve(typeof (window as any).Razorpay !== 'undefined');
      }
    }, 100);

    script.addEventListener('load', () => {
      clearInterval(interval);
      resolve(true);
    }, { once: true });
  });
};

export const AddFundsModal: React.FC<AddFundsModalProps> = ({
  isOpen,
  onClose,
  currentBalance,
  onSuccess,
  recommendedAmount,
}) => {
  const { user } = useAuth();
  const [selectedAmount, setSelectedAmount] = useState<number>(recommendedAmount || 100);
  const [customAmount, setCustomAmount] = useState<string>(recommendedAmount ? String(recommendedAmount) : '100');
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [activePayment, setActivePayment] = useState<Payment | null>(null);
  const [utrInput, setUtrInput] = useState('');
  const [submittingUtr, setSubmittingUtr] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

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

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('sahil-stp@ybl');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const handleProceedToPayment = async () => {
    if (!amountToAdd || amountToAdd < 1) {
      setError('Please enter an amount of at least ₹1');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      // 1. Create order on backend
      const orderRes = await api.createAddFundsOrder(amountToAdd);
      const { payment, keyId, gatewayOrderId, gatewayError } = orderRes;
      setActivePayment(payment);

      const activeKeyId = keyId || 'rzp_live_TjqGRLXgjC3fWI';

      // If Razorpay order creation failed at the backend (e.g. Authentication failed)
      if (!gatewayOrderId && gatewayError) {
        setLoading(false);
        setError(
          `Razorpay Order Notice [${gatewayError.code}]: ${gatewayError.description}. ` +
          `Live Razorpay order could not be generated with current server credentials. ` +
          `You can pay directly using the native UPI App option below.`
        );
        return;
      }

      // 2. Ensure Razorpay SDK is ready
      const sdkReady = await loadRazorpaySdk();

      if (!sdkReady || !activeKeyId) {
        setLoading(false);
        setError(
          activeKeyId
            ? 'Failed to load Razorpay checkout SDK. Please refresh the page or use direct UPI below.'
            : 'Payment gateway is not currently configured on the server. Please contact support.'
        );
        return;
      }

      const options: any = {
        key: activeKeyId,
        amount: Math.round(payment.amount * 100), // paise (e.g. 100 paise = ₹1)
        currency: 'INR',
        name: 'SMAP Advertising',
        description: `Add ₹${payment.amount} to SMAP Wallet Balance`,
        order_id: gatewayOrderId || undefined,
        prefill: {
          name: user?.name || '',
          email: user?.email || '',
          contact: user?.phone || '',
          method: 'upi',
        },
        config: {
          display: {
            blocks: {
              upi: {
                name: 'Pay via UPI',
                instruments: [
                  { method: 'upi' },
                ],
              },
              other: {
                name: 'Cards & NetBanking',
                instruments: [
                  { method: 'card' },
                  { method: 'netbanking' },
                  { method: 'wallet' },
                ],
              },
            },
            sequence: ['block.upi', 'block.other'],
            preferences: {
              show_default_blocks: true,
            },
          },
        },
        theme: {
          color: '#7C3AED',
        },
        modal: {
          ondismiss: () => {
            // User cancelled or closed the Razorpay popup without paying - WALLET BALANCE REMAINS UNCHANGED
            setLoading(false);
            setVerifying(false);
            setError('Payment was cancelled. No funds were added to your wallet.');
          },
        },
        handler: async (response: any) => {
          // Razorpay returned payment confirmation and cryptographic signature
          setLoading(false);
          setVerifying(true);
          try {
            const verifyRes = await api.verifyWalletPayment({
              paymentId: payment.id,
              gatewayPaymentId: response.razorpay_payment_id,
              gatewayOrderId: response.razorpay_order_id,
              gatewaySignature: response.razorpay_signature,
            });

            setSuccessMsg(`₹${amountToAdd} successfully added to your SMAP wallet!`);
            onSuccess(verifyRes.balance);
            setTimeout(() => {
              onClose();
            }, 1600);
          } catch (vErr: any) {
            setError(vErr.message || 'Payment verification failed at server. No funds added.');
          } finally {
            setVerifying(false);
          }
        },
      };

      const rzp = new (window as any).Razorpay(options);

      rzp.on('payment.failed', (resp: any) => {
        // Payment failed or declined by bank/gateway - WALLET BALANCE REMAINS UNCHANGED
        setLoading(false);
        setVerifying(false);
        const errCode = resp.error?.code || 'GATEWAY_DECLINED';
        const errDesc = resp.error?.description || resp.error?.reason || 'Payment was declined by bank or gateway.';
        const errSource = resp.error?.source ? ` [Source: ${resp.error.source}]` : '';
        setError(`Payment Failed (${errCode}): ${errDesc}${errSource}. Wallet balance remains unchanged.`);
      });

      rzp.open();
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Failed to initiate payment.');
      setLoading(false);
    }
  };

  const handleLaunchDirectUpi = () => {
    if (!activePayment?.upi_intent_url) {
      const intentUrl = `upi://pay?pa=sahil-stp@ybl&pn=SMAP&am=${amountToAdd.toFixed(2)}&cu=INR&tn=SMAP%20Wallet%20Topup`;
      window.location.href = intentUrl;
    } else {
      window.location.href = activePayment.upi_intent_url;
    }
  };

  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePayment || !utrInput.trim()) return;
    setSubmittingUtr(true);
    try {
      await api.submitPaymentReference(activePayment.id, utrInput.trim());
      setSuccessMsg('UPI reference recorded. Wallet balance will be confirmed upon verification.');
      setUtrInput('');
    } catch (err: any) {
      setError(err.message || 'Failed to submit transaction reference');
    } finally {
      setSubmittingUtr(false);
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
                Instant UPI & Razorpay Checkout. Funds never expire.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={loading || verifying}
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
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
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
              placeholder="Enter amount (e.g. 500)"
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#080D1A] py-3 pl-9 pr-4 text-lg font-extrabold text-slate-900 dark:text-white tabular-nums placeholder:text-slate-400 focus:border-purple-500 focus:outline-none transition-colors"
            />
          </div>
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            Minimum top-up: ₹1 (Instant UPI Testing Supported) • Instant credit upon verification
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

        {/* Security badge & CTA */}
        <div className="space-y-3 pt-2">
          <button
            onClick={handleProceedToPayment}
            disabled={loading || verifying || amountToAdd < 1}
            className="w-full flex items-center justify-center gap-2 rounded-2xl bg-purple-600 py-3.5 px-6 text-sm font-bold text-white shadow-xl shadow-purple-600/30 hover:bg-purple-500 active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Connecting to Gateway...</span>
              </>
            ) : verifying ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin text-purple-200" />
                <span>Verifying Cryptographic Payment...</span>
              </>
            ) : (
              <>
                <CreditCard className="h-4 w-4" />
                <span>Pay via UPI / Razorpay (₹{amountToAdd || 0})</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>

          {/* Direct Mobile UPI Intent Button (GPay, PhonePe, Paytm) */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <div className="text-center text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              Or Pay Direct with Mobile UPI App
            </div>
            <button
              type="button"
              onClick={handleLaunchDirectUpi}
              className="w-full flex items-center justify-center gap-2 rounded-2xl bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 py-3 px-4 text-xs font-bold text-white shadow transition-all active:scale-95"
            >
              <Smartphone className="h-4 w-4 text-emerald-400" />
              <span>Launch UPI App (PhonePe / GPay / Paytm) — ₹{amountToAdd}</span>
              <ExternalLink className="h-3.5 w-3.5 text-slate-400" />
            </button>

            {/* Merchant UPI Details */}
            <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800/80 bg-slate-50 dark:bg-slate-900/60 p-3 text-xs">
              <div>
                <span className="block text-[10px] text-slate-400 uppercase font-semibold">
                  Merchant UPI ID
                </span>
                <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
                  sahil-stp@ybl
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyUpi}
                className="flex items-center gap-1 text-[11px] font-semibold text-purple-600 dark:text-purple-400 hover:underline"
              >
                <Copy className="h-3.5 w-3.5" />
                <span>{copiedUpi ? 'Copied!' : 'Copy UPI ID'}</span>
              </button>
            </div>

            {/* Optional UTR submission if paid outside Razorpay modal */}
            {activePayment && (
              <form onSubmit={handleSubmitUtr} className="pt-1 flex gap-2">
                <input
                  type="text"
                  value={utrInput}
                  onChange={(e) => setUtrInput(e.target.value)}
                  placeholder="Enter 12-digit UPI Ref / UTR"
                  className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/80 px-3 py-2 text-xs font-mono text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={submittingUtr || !utrInput.trim()}
                  className="rounded-xl bg-purple-600 hover:bg-purple-500 px-3 py-2 text-xs font-bold text-white disabled:opacity-50 transition-colors"
                >
                  {submittingUtr ? 'Saving...' : 'Submit UTR'}
                </button>
              </form>
            )}
          </div>

          <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 dark:text-slate-500 pt-1">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span>256-bit encrypted • Powered by Razorpay UPI & Webhooks</span>
          </div>
        </div>

      </div>
    </div>
  );
};
