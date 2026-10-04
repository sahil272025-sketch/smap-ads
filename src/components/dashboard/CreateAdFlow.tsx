import React, { useState, useEffect, useRef } from 'react';
import { Package, Campaign, Payment } from '../../types';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Facebook,
  Instagram,
  RefreshCw,
  Sparkles,
  ShieldCheck,
  Check,
  Copy,
  X,
  Search,
  Layers,
  MapPin,
  CheckSquare,
  Square,
  ExternalLink,
  Info,
  Clock,
  Zap,
  Lock,
} from 'lucide-react';

const ALL_28_INDIAN_STATES = [
  'Andhra Pradesh',
  'Arunachal Pradesh',
  'Assam',
  'Bihar',
  'Chhattisgarh',
  'Goa',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Jharkhand',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Manipur',
  'Meghalaya',
  'Mizoram',
  'Nagaland',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Sikkim',
  'Tamil Nadu',
  'Telangana',
  'Tripura',
  'Uttar Pradesh',
  'Uttarakhand',
  'West Bengal',
];

interface CreateAdFlowProps {
  initialPackageId?: string | null;
  onCampaignCreated: (campaignId: string) => void;
  onCancel: () => void;
}

export const CreateAdFlow: React.FC<CreateAdFlowProps> = ({
  initialPackageId,
  onCampaignCreated,
  onCancel,
}) => {
  const { user, metaConnection } = useAuth();
  const [step, setStep] = useState<number>(1);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loadingPackages, setLoadingPackages] = useState(true);

  // STEP 1: Ad Platform (Unified Facebook & Instagram)
  const [facebookSelected, setFacebookSelected] = useState<boolean>(true);
  const [instagramSelected, setInstagramSelected] = useState<boolean>(true);

  // STEP 2: Ad Details (Only Ad Name & Ad Description)
  const [adName, setAdName] = useState<string>('');
  const [adDescription, setAdDescription] = useState<string>('');
  const [previewPlatform, setPreviewPlatform] = useState<'facebook' | 'instagram'>('instagram');

  // STEP 3: Audience (India Only + 28 States or All India)
  const [isAllIndia, setIsAllIndia] = useState<boolean>(true);
  const [selectedStates, setSelectedStates] = useState<string[]>([]);
  const [stateSearch, setStateSearch] = useState<string>('');

  // STEP 4: Upload Creative
  const [creativeFile, setCreativeFile] = useState<File | null>(null);
  const [creativeUrl, setCreativeUrl] = useState<string>('');
  const [creativeType, setCreativeType] = useState<'image' | 'video'>('image');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // STEP 5: Package Selection
  const [selectedPackageId, setSelectedPackageId] = useState<string>(initialPackageId || '');

  // STEP 6: Real UPI Payment & Meta Activation
  const [createdCampaign, setCreatedCampaign] = useState<Campaign | null>(null);
  const [activePayment, setActivePayment] = useState<Payment | null>(null);
  const [isCreatingDraft, setIsCreatingDraft] = useState(false);
  const [gatewayStatus, setGatewayStatus] = useState<any>(null);
  const [isLaunchingCheckout, setIsLaunchingCheckout] = useState(false);
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [paymentError, setPaymentError] = useState<string | null>(null);
  const [sandboxActionMsg, setSandboxActionMsg] = useState<string | null>(null);
  const [utrReference, setUtrReference] = useState('');
  const [isSubmittingUtr, setIsSubmittingUtr] = useState(false);
  const [utrSuccessMsg, setUtrSuccessMsg] = useState<string | null>(null);
  const [isSubmittingToMeta, setIsSubmittingToMeta] = useState(false);
  const [metaSubmitError, setMetaSubmitError] = useState<string | null>(null);
  const [metaSubmitSuccess, setMetaSubmitSuccess] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);

  // Load packages & gateway config
  useEffect(() => {
    api
      .getPackages()
      .then((res) => {
        setPackages(res.packages);
        if (!selectedPackageId && res.packages.length > 0) {
          const pop = res.packages.find((p) => p.price === 399) || res.packages[0];
          setSelectedPackageId(pop.id);
        }
      })
      .catch((err) => console.error('Packages error', err))
      .finally(() => setLoadingPackages(false));

    api
      .getPaymentGatewayStatus()
      .then((status) => setGatewayStatus(status))
      .catch(() => {});
  }, []);

  // Live polling for payment status when in Step 6 and awaiting verification
  useEffect(() => {
    if (step === 6 && activePayment && activePayment.status !== 'PAID') {
      const interval = setInterval(() => {
        api
          .getPaymentDetails(activePayment.id)
          .then((res) => {
            if (res.payment) {
              setActivePayment(res.payment);
              if (res.payment.status === 'PAID') {
                setIsVerifyingPayment(false);
              }
            }
          })
          .catch(() => {});
      }, 3000);
      return () => clearInterval(interval);
    }
  }, [step, activePayment?.id, activePayment?.status]);

  // Update preview platform to available one if user deselects
  useEffect(() => {
    if (!instagramSelected && facebookSelected) {
      setPreviewPlatform('facebook');
    } else if (!facebookSelected && instagramSelected) {
      setPreviewPlatform('instagram');
    }
  }, [facebookSelected, instagramSelected]);

  // Handle platform toggles
  const handleToggleFacebook = () => {
    if (facebookSelected && !instagramSelected) return;
    setFacebookSelected(!facebookSelected);
  };

  const handleToggleInstagram = () => {
    if (instagramSelected && !facebookSelected) return;
    setInstagramSelected(!instagramSelected);
  };

  const handleSelectBothPlatforms = () => {
    setFacebookSelected(true);
    setInstagramSelected(true);
  };

  // State selection helpers
  const handleToggleState = (stateName: string) => {
    if (isAllIndia) {
      setIsAllIndia(false);
      setSelectedStates([stateName]);
      return;
    }

    if (selectedStates.includes(stateName)) {
      const updated = selectedStates.filter((s) => s !== stateName);
      if (updated.length === 0) {
        setIsAllIndia(true);
        setSelectedStates([]);
      } else {
        setSelectedStates(updated);
      }
    } else {
      setSelectedStates([...selectedStates, stateName]);
    }
  };

  const handleSelectAllIndia = () => {
    setIsAllIndia(true);
    setSelectedStates([]);
  };

  const handleRemoveState = (stateName: string) => {
    const updated = selectedStates.filter((s) => s !== stateName);
    if (updated.length === 0) {
      setIsAllIndia(true);
      setSelectedStates([]);
    } else {
      setSelectedStates(updated);
    }
  };

  // File upload handler
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 50 * 1024 * 1024) {
      setUploadError('File size exceeds 50MB limit.');
      return;
    }

    setUploadError(null);
    setIsUploading(true);
    setCreativeFile(file);

    try {
      const res = await api.uploadCreative(file);
      setCreativeUrl(res.url);
      setCreativeType(res.type);
    } catch (err: any) {
      setUploadError(err.message || 'File upload failed. Please try again.');
      setCreativeFile(null);
      setCreativeUrl('');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveMedia = () => {
    setCreativeFile(null);
    setCreativeUrl('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Step 2 validation
  const validateStep2 = (): boolean => {
    if (!adName.trim()) {
      alert('Please enter an Ad Name.');
      return false;
    }
    if (!adDescription.trim()) {
      alert('Please enter an Ad Description.');
      return false;
    }
    return true;
  };

  // Step 3 validation
  const validateStep3 = (): boolean => {
    if (!isAllIndia && selectedStates.length === 0) {
      alert('Please select at least one state or choose All India.');
      return false;
    }
    return true;
  };

  // Step 4 validation
  const validateStep4 = (): boolean => {
    if (!creativeUrl && !creativeFile) {
      alert('Please upload an image or video for your ad creative.');
      return false;
    }
    return true;
  };

  // Step 5: Create Campaign Draft & Initiate Real Payment Order
  const handleProceedToPayment = async () => {
    if (!selectedPackageId) {
      alert('Please select a campaign package.');
      return;
    }

    setIsCreatingDraft(true);
    try {
      const targetState = isAllIndia || selectedStates.length === 0 ? 'All India' : selectedStates.join(', ');

      const res = await api.createCampaign({
        packageId: selectedPackageId,
        creativeUrl: creativeUrl || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
        creativeType,
        businessName: user?.name || adName.trim() || 'SMAP Advertiser',
        primaryText: adDescription.trim(),
        headline: adName.trim(),
        description: adDescription.trim(),
        destinationType: 'website',
        destinationUrl: window.location.origin || 'https://smap.ai.studio',
        targeting: {
          country: 'India',
          state: targetState,
          city: 'All Cities',
          min_age: 18,
          max_age: 65,
          gender: 'ALL',
          interests: ['Online Shopping', 'Business & Entrepreneurship'],
        },
      });

      setCreatedCampaign(res.campaign);
      setActivePayment(res.payment);
      setStep(6);
    } catch (err: any) {
      alert(err.message || 'Failed to initiate campaign draft.');
    } finally {
      setIsCreatingDraft(false);
    }
  };

  // Launch Real UPI Gateway Checkout Flow
  const handleLaunchUpiCheckout = async () => {
    if (!activePayment) return;
    setPaymentError(null);
    setSandboxActionMsg(null);
    setIsLaunchingCheckout(true);

    const keyId = activePayment.gateway_key_id;
    const isRazorpayReady = typeof (window as any).Razorpay !== 'undefined';

    // If Razorpay SDK is loaded and we have a key ID or sandbox configuration:
    if (isRazorpayReady && keyId) {
      try {
        const rzp = new (window as any).Razorpay({
          key: keyId,
          amount: Math.round(activePayment.amount * 100),
          currency: 'INR',
          name: 'SMAP',
          description: `${selectedPkg?.name || 'Advertising Package'} (${selectedPkg?.duration_days || 5} Days)`,
          order_id: activePayment.gateway_order_id,
          prefill: {
            name: user?.name || 'SMAP Advertiser',
            email: user?.email || '',
            contact: user?.phone || '',
          },
          theme: {
            color: '#7C3AED',
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
                show_default_blocks: false,
              },
            },
          },
          method: {
            upi: true,
            card: false,
            netbanking: false,
            wallet: false,
            emi: false,
          },
          handler: async (response: any) => {
            // DO NOT fake success. Submit to backend for independent verification!
            setIsVerifyingPayment(true);
            try {
              const verifyRes = await api.verifyPayment(activePayment.id, {
                gatewayPaymentId: response.razorpay_payment_id,
                gatewayOrderId: response.razorpay_order_id,
                gatewaySignature: response.razorpay_signature,
              });
              if (verifyRes.payment) {
                setActivePayment(verifyRes.payment);
              }
            } catch (err: any) {
              setPaymentError(err.message || 'Payment verification failed at server.');
            } finally {
              setIsVerifyingPayment(false);
            }
          },
          modal: {
            ondismiss: () => {
              setIsLaunchingCheckout(false);
            },
          },
        });

        rzp.open();
        setIsLaunchingCheckout(false);
        return;
      } catch (err) {
        console.warn('Razorpay checkout init notice, using native intent fallback', err);
      }
    }

    // Direct NPCI Mobile UPI Intent Fallback
    window.location.href = activePayment.upi_intent_url;
    setIsLaunchingCheckout(false);
  };

  // Sandbox Verification Simulation (Tests Sandbox Success)
  const handleSimulateSandboxPayment = async (status: 'PAID' | 'FAILED') => {
    if (!activePayment) return;
    setIsVerifyingPayment(true);
    setPaymentError(null);
    setSandboxActionMsg(null);

    try {
      const res = await api.simulateSandboxPayment(activePayment.id, {
        status,
        failureReason: status === 'FAILED' ? 'User cancelled in bank UPI app' : undefined,
      });

      if (res.payment) {
        setActivePayment(res.payment);
        setSandboxActionMsg(
          status === 'PAID'
            ? '✓ Sandbox payment independently verified as PAID via backend API.'
            : 'Payment marked as FAILED in sandbox mode.'
        );
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Sandbox simulation failed');
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  // Sandbox Webhook Simulator (Tests Webhook Signature & Idempotency)
  const handleSimulateWebhook = async (duplicate = false) => {
    if (!activePayment) return;
    setIsVerifyingPayment(true);
    setSandboxActionMsg(null);

    try {
      const res = await api.simulateSandboxWebhook({
        paymentId: activePayment.id,
        event: 'payment.captured',
      });

      if (res.payment) {
        setActivePayment(res.payment);
        setSandboxActionMsg(
          res.webhookResult?.duplicate
            ? '✓ Webhook Idempotency Confirmed: Duplicate webhook was recognized and ignored safely without double-charging.'
            : '✓ Webhook Confirmed: Cryptographic signature verified and payment marked PAID by server.'
        );
      }
    } catch (err: any) {
      setPaymentError(err.message || 'Webhook simulation error');
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  // Check payment status manually
  const checkPaymentStatus = async () => {
    if (!activePayment) return;
    setIsVerifyingPayment(true);
    try {
      const res = await api.getPaymentDetails(activePayment.id);
      setActivePayment(res.payment);
      if (res.payment.status === 'PAID') {
        setUtrSuccessMsg('Payment confirmed! You can now submit your campaign to Meta review.');
      }
    } catch (err) {
      console.error('Payment poll error', err);
    } finally {
      setIsVerifyingPayment(false);
    }
  };

  // Submit UTR Reference (Backup manual entry)
  const handleSubmitUtr = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activePayment || !utrReference.trim()) return;

    setIsSubmittingUtr(true);
    try {
      const res = await api.submitPaymentReference(activePayment.id, utrReference.trim());
      setActivePayment(res.payment);
      setUtrSuccessMsg('12-digit UPI reference recorded for transaction audit.');
    } catch (err: any) {
      alert(err.message || 'Failed to submit transaction reference.');
    } finally {
      setIsSubmittingUtr(false);
    }
  };

  // Submit to Meta (strictly gated on activePayment.status === 'PAID')
  const handleSubmitToMeta = async () => {
    if (!createdCampaign || !activePayment || activePayment.status !== 'PAID') {
      alert('Payment must be confirmed before submitting to Meta.');
      return;
    }

    setIsSubmittingToMeta(true);
    setMetaSubmitError(null);

    try {
      const res = await api.submitCampaignToMeta(createdCampaign.id);
      setCreatedCampaign(res.campaign);
      setMetaSubmitSuccess(true);
    } catch (err: any) {
      setMetaSubmitError(
        err.message || 'Meta advertising permissions are not configured or approved for this application.'
      );
    } finally {
      setIsSubmittingToMeta(false);
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText('sahil-stp@ybl');
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2000);
  };

  const selectedPkg = packages.find((p) => p.id === selectedPackageId);

  const filteredStates = ALL_28_INDIAN_STATES.filter((s) =>
    s.toLowerCase().includes(stateSearch.toLowerCase())
  );

  const stepTitles = [
    'Ad Platform',
    'Ad Details',
    'Audience',
    'Upload Creative',
    'Package',
    'Payment',
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-in fade-in duration-200">
      {/* Top Header Card with Step Indicator */}
      <div className="rounded-2xl border border-card bg-card p-4 sm:p-6 shadow-sm transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center h-6 px-2.5 rounded-full bg-violet-600/10 text-violet-600 dark:text-violet-400 font-bold text-xs">
                Step {step} of 6
              </span>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                {stepTitles[step - 1]}
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Create and launch advertising campaigns with real verified UPI payment.
            </p>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Exit Builder
          </button>
        </div>

        {/* Visual Step Progress Bar */}
        <div className="grid grid-cols-6 gap-2">
          {[1, 2, 3, 4, 5, 6].map((s) => (
            <div key={s} className="space-y-1">
              <div
                className={`h-2 rounded-full transition-all duration-300 ${
                  s === step
                    ? 'bg-violet-600 shadow-sm shadow-violet-500/50'
                    : s < step
                    ? 'bg-violet-600/70'
                    : 'bg-slate-200 dark:bg-slate-800'
                }`}
              />
              <span
                className={`hidden sm:block text-[10px] truncate ${
                  s === step
                    ? 'font-bold text-violet-600 dark:text-violet-400'
                    : s < step
                    ? 'text-slate-600 dark:text-slate-400'
                    : 'text-slate-400 dark:text-slate-600'
                }`}
              >
                {stepTitles[s - 1]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ======================================================== */}
      {/* STEP 1: AD PLATFORM — ONE UNIFIED OPTION */}
      {/* ======================================================== */}
      {step === 1 && (
        <div className="rounded-2xl border border-card bg-card p-6 sm:p-8 space-y-6 shadow-sm transition-colors">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Select Ad Platform
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Both platforms are handled as one unified campaign. Select Facebook, Instagram, or both.
            </p>
          </div>

          {/* Quick Preset: Facebook + Instagram (Recommended) */}
          <div
            onClick={handleSelectBothPlatforms}
            className={`cursor-pointer rounded-2xl border-2 p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              facebookSelected && instagramSelected
                ? 'border-violet-600 bg-violet-600/5 dark:bg-violet-950/20 shadow-md shadow-violet-500/10'
                : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-4">
              <div className="flex -space-x-2 overflow-hidden shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white ring-2 ring-white dark:ring-black">
                  <Facebook className="h-5 w-5" />
                </div>
                <div className="h-10 w-10 rounded-full bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 flex items-center justify-center text-white ring-2 ring-white dark:ring-black">
                  <Instagram className="h-5 w-5" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    Facebook + Instagram
                  </span>
                  <span className="rounded-full bg-violet-600 text-white text-[10px] font-bold px-2 py-0.5">
                    Recommended
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Distribute across feeds, reels, and stories for maximum reach in India.
                </p>
              </div>
            </div>

            <div className="shrink-0 flex items-center gap-2 text-xs font-semibold text-violet-600 dark:text-violet-400">
              {facebookSelected && instagramSelected ? (
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-violet-600 text-white font-bold text-xs">
                  <Check className="h-4 w-4" /> Selected
                </div>
              ) : (
                <span className="text-slate-400 dark:text-slate-500">Tap to select both</span>
              )}
            </div>
          </div>

          <div className="relative flex py-1 items-center">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
            <span className="flex-shrink mx-4 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Or Customize Platforms
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800" />
          </div>

          {/* Individual Checkbox Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              onClick={handleToggleFacebook}
              className={`cursor-pointer rounded-xl border p-4 transition-all flex items-center justify-between ${
                facebookSelected
                  ? 'border-violet-600 bg-violet-600/5 dark:bg-violet-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 opacity-70'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Facebook className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-semibold text-sm text-slate-900 dark:text-white block">
                    Facebook
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Feed, Reels & In-Stream
                  </span>
                </div>
              </div>
              <div
                className={`h-5 w-5 rounded flex items-center justify-center transition-colors ${
                  facebookSelected ? 'bg-violet-600 text-white' : 'border border-slate-400 dark:border-slate-600'
                }`}
              >
                {facebookSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </div>
            </div>

            <div
              onClick={handleToggleInstagram}
              className={`cursor-pointer rounded-xl border p-4 transition-all flex items-center justify-between ${
                instagramSelected
                  ? 'border-violet-600 bg-violet-600/5 dark:bg-violet-950/20'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700 opacity-70'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-amber-500 via-pink-500 to-purple-600 text-white flex items-center justify-center">
                  <Instagram className="h-5 w-5" />
                </div>
                <div>
                  <span className="font-semibold text-sm text-slate-900 dark:text-white block">
                    Instagram
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Feed, Stories & Reels
                  </span>
                </div>
              </div>
              <div
                className={`h-5 w-5 rounded flex items-center justify-center transition-colors ${
                  instagramSelected ? 'bg-violet-600 text-white' : 'border border-slate-400 dark:border-slate-600'
                }`}
              >
                {instagramSelected && <Check className="h-3.5 w-3.5 stroke-[3]" />}
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 active:scale-95 transition-all"
            >
              Continue to Ad Details
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 2: AD DETAILS — ONLY TWO FIELDS */}
      {/* ======================================================== */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 rounded-2xl border border-card bg-card p-6 sm:p-8 space-y-6 shadow-sm transition-colors">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                Enter Ad Details
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Enter your campaign name and ad message.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Ad Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={adName}
                onChange={(e) => setAdName(e.target.value)}
                placeholder="e.g. New Product Promotion"
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 py-3 px-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-violet-600 focus:ring-1 focus:ring-violet-600 focus:outline-none transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Ad Description <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={5}
                value={adDescription}
                onChange={(e) => setAdDescription(e.target.value)}
                placeholder="Special offer available this week. Contact us today."
                className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 py-3 px-4 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:border-violet-600 focus:ring-1 focus:ring-violet-600 focus:outline-none transition-all resize-none"
              />
            </div>

            <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <button
                type="button"
                onClick={() => {
                  if (validateStep2()) setStep(3);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 active:scale-95 transition-all"
              >
                Continue to Audience
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Right Column: Live Social Feed Preview */}
          <div className="lg:col-span-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Live Ad Preview
              </span>
              <div className="flex gap-1 p-1 rounded-lg bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                {instagramSelected && (
                  <button
                    type="button"
                    onClick={() => setPreviewPlatform('instagram')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                      previewPlatform === 'instagram'
                        ? 'bg-violet-600 text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Instagram
                  </button>
                )}
                {facebookSelected && (
                  <button
                    type="button"
                    onClick={() => setPreviewPlatform('facebook')}
                    className={`px-2.5 py-1 rounded text-[11px] font-semibold transition-colors ${
                      previewPlatform === 'facebook'
                        ? 'bg-violet-600 text-white'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Facebook
                  </button>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-card bg-card p-4 text-xs shadow-md transition-colors">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-violet-600 flex items-center justify-center font-bold text-white text-xs">
                    {adName ? adName.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 dark:text-white block text-xs leading-tight">
                      {adName || 'Your Ad Name'}
                    </span>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      Sponsored · SMAP Verified
                    </span>
                  </div>
                </div>
                {previewPlatform === 'instagram' ? (
                  <Instagram className="h-4 w-4 text-pink-500" />
                ) : (
                  <Facebook className="h-4 w-4 text-blue-500" />
                )}
              </div>

              <p className="text-xs text-slate-700 dark:text-slate-200 mb-3 leading-relaxed whitespace-pre-wrap">
                {adDescription || 'Special offer available this week. Contact us today.'}
              </p>

              <div className="rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-900 aspect-square sm:aspect-[4/3] relative flex items-center justify-center border border-slate-200 dark:border-slate-800">
                {creativeUrl ? (
                  creativeType === 'video' ? (
                    <video src={creativeUrl} className="h-full w-full object-cover" />
                  ) : (
                    <img src={creativeUrl} alt="Ad Preview" className="h-full w-full object-cover" />
                  )
                ) : (
                  <div className="text-center p-6 text-slate-400 dark:text-slate-500">
                    <UploadCloud className="h-8 w-8 mx-auto mb-2 opacity-60" />
                    <span className="text-xs font-medium block">
                      Creative media will appear here
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 3: AUDIENCE — SIMPLE INDIA TARGETING */}
      {/* ======================================================== */}
      {step === 3 && (
        <div className="rounded-2xl border border-card bg-card p-6 sm:p-8 space-y-6 shadow-sm transition-colors">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Simple India Targeting
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select geographic reach across India. Target All India or choose specific states.
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
              Country
            </label>
            <div className="flex items-center justify-between rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/60 p-3.5">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🇮🇳</span>
                <div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white block">
                    India
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Targeting 100% focused on Indian consumers
                  </span>
                </div>
              </div>
              <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold px-3 py-1 border border-emerald-500/20">
                Active Market
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                Select States
              </label>
              <span className="text-xs text-slate-500 dark:text-slate-400">
                {isAllIndia ? 'All 28 States Included' : `${selectedStates.length} States Selected`}
              </span>
            </div>

            <div
              onClick={handleSelectAllIndia}
              className={`cursor-pointer rounded-xl border-2 p-4 transition-all flex items-center justify-between ${
                isAllIndia
                  ? 'border-violet-600 bg-violet-600/5 dark:bg-violet-950/20 shadow-sm'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`h-5 w-5 rounded flex items-center justify-center transition-colors ${
                    isAllIndia
                      ? 'bg-violet-600 text-white'
                      : 'border border-slate-400 dark:border-slate-600'
                  }`}
                >
                  {isAllIndia && <Check className="h-3.5 w-3.5 stroke-[3]" />}
                </div>
                <div>
                  <span className="font-bold text-sm text-slate-900 dark:text-white block">
                    All India (Nationwide Coverage)
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Ad is delivered across all 28 states for widest audience reach
                  </span>
                </div>
              </div>
              <span className="text-xs font-bold text-violet-600 dark:text-violet-400">
                28 States
              </span>
            </div>

            {!isAllIndia && selectedStates.length > 0 && (
              <div className="space-y-1.5 pt-2">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  Targeted States ({selectedStates.length}):
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedStates.map((st) => (
                    <span
                      key={st}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-violet-600/10 text-violet-700 dark:text-violet-300 border border-violet-600/30 px-2.5 py-1 text-xs font-semibold"
                    >
                      {st}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveState(st);
                        }}
                        className="hover:text-red-500 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <button
                    type="button"
                    onClick={handleSelectAllIndia}
                    className="text-xs text-violet-600 dark:text-violet-400 font-semibold hover:underline self-center ml-2"
                  >
                    Switch to All India
                  </button>
                </div>
              </div>
            )}

            <div className="pt-2 space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  value={stateSearch}
                  onChange={(e) => setStateSearch(e.target.value)}
                  placeholder="Search among 28 states of India..."
                  className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900/90 pl-9 pr-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:border-violet-600 focus:outline-none"
                />
              </div>

              <div className="max-h-56 overflow-y-auto rounded-xl border border-slate-200 dark:border-slate-800 p-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5 custom-scrollbar bg-slate-50/50 dark:bg-slate-900/30">
                {filteredStates.map((st) => {
                  const isChecked = !isAllIndia && selectedStates.includes(st);
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => handleToggleState(st)}
                      className={`text-left rounded-lg px-2.5 py-2 text-xs font-medium transition-all flex items-center justify-between ${
                        isChecked
                          ? 'bg-violet-600 text-white font-semibold shadow-sm'
                          : 'bg-white dark:bg-slate-900/60 text-slate-700 dark:text-slate-300 hover:border-violet-500 border border-transparent'
                      }`}
                    >
                      <span className="truncate">{st}</span>
                      {isChecked && <Check className="h-3 w-3 shrink-0 ml-1" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <button
              type="button"
              onClick={() => {
                if (validateStep3()) setStep(4);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 active:scale-95 transition-all"
            >
              Continue to Creative Upload
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 4: UPLOAD CREATIVE */}
      {/* ======================================================== */}
      {step === 4 && (
        <div className="rounded-2xl border border-card bg-card p-6 sm:p-8 space-y-6 shadow-sm transition-colors">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Upload Ad Creative
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Upload the image or video that will appear in Facebook and Instagram feeds and reels.
            </p>
          </div>

          {uploadError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-600 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{uploadError}</span>
            </div>
          )}

          {!creativeUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="group cursor-pointer rounded-2xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 p-10 text-center transition-all hover:border-violet-500 hover:bg-violet-50/50 dark:hover:bg-slate-900"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                className="hidden"
                onChange={handleFileChange}
              />
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-600/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 group-hover:scale-105 transition-transform mb-4">
                {isUploading ? (
                  <RefreshCw className="h-7 w-7 animate-spin text-violet-600 dark:text-violet-400" />
                ) : (
                  <UploadCloud className="h-7 w-7" />
                )}
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isUploading ? 'Uploading creative media...' : 'Click to upload ad image or video'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1.5 max-w-sm mx-auto">
                Supported formats: JPEG, PNG, WEBP, MP4, MOV, WEBM. Maximum file size: 50MB.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative mx-auto max-w-md overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-black aspect-square sm:aspect-[4/3] shadow-md">
                {creativeType === 'video' ? (
                  <video src={creativeUrl} controls className="h-full w-full object-contain" />
                ) : (
                  <img src={creativeUrl} alt="Creative Preview" className="h-full w-full object-contain" />
                )}
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                >
                  Replace Media
                </button>
                <button
                  type="button"
                  onClick={handleRemoveMedia}
                  className="rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-950/30 px-4 py-2 text-xs font-semibold text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <button
              type="button"
              disabled={!creativeUrl || isUploading}
              onClick={() => {
                if (validateStep4()) setStep(5);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 active:scale-95 disabled:opacity-50 transition-all"
            >
              Continue to Package Selection
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 5: PACKAGE SELECTION */}
      {/* ======================================================== */}
      {step === 5 && (
        <div className="rounded-2xl border border-card bg-card p-6 sm:p-8 space-y-6 shadow-sm transition-colors">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Select Campaign Package
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Choose your campaign run duration. All packages include automated server stop and performance tracking.
            </p>
          </div>

          {loadingPackages ? (
            <div className="flex justify-center py-12">
              <div className="h-7 w-7 animate-spin rounded-full border-2 border-violet-600 border-t-transparent" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {packages.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`cursor-pointer rounded-2xl border-2 p-5 transition-all relative flex flex-col justify-between ${
                      isSelected
                        ? 'border-violet-600 bg-violet-600/5 dark:bg-violet-950/30 shadow-lg shadow-violet-600/20'
                        : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                          {pkg.name}
                        </span>
                        {pkg.is_popular && (
                          <span className="text-[10px] font-bold text-violet-600 dark:text-violet-400 bg-violet-100 dark:bg-violet-950 px-2 py-0.5 rounded-full border border-violet-500/30">
                            Popular
                          </span>
                        )}
                      </div>

                      <div className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                        ₹{pkg.price}
                      </div>

                      <div className="text-xs font-semibold text-violet-600 dark:text-violet-400 mt-1">
                        {pkg.duration_days} Days Active Run
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 space-y-1.5 text-[11px] text-slate-600 dark:text-slate-300">
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                          <span>Facebook + Instagram Ads</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                          <span>India geographic delivery</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                          <span>Automated campaign stop</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3">
                      <div
                        className={`w-full py-2 rounded-xl text-center text-xs font-bold transition-colors ${
                          isSelected
                            ? 'bg-violet-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {isSelected ? 'Selected' : 'Choose Plan'}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Campaign Order Summary Card */}
          {selectedPkg && (
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-4 sm:p-5 text-xs text-slate-600 dark:text-slate-300 space-y-3">
              <div className="font-bold text-slate-900 dark:text-white text-sm">
                Campaign Order Summary:
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-1">
                <div>
                  <span className="block text-[11px] text-slate-400 dark:text-slate-500">
                    Ad Name:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white truncate block">
                    {adName || 'Ad Campaign'}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-400 dark:text-slate-500">
                    Platforms:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {facebookSelected && instagramSelected
                      ? 'Facebook + Instagram'
                      : facebookSelected
                      ? 'Facebook'
                      : 'Instagram'}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-400 dark:text-slate-500">
                    Audience:
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    {isAllIndia ? 'All India (28 States)' : `${selectedStates.length} States`}
                  </span>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-400 dark:text-slate-500">
                    Payable Amount:
                  </span>
                  <span className="font-extrabold text-emerald-600 dark:text-emerald-400 text-base tabular-nums">
                    ₹{selectedPkg.price}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 px-5 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </button>

            <button
              type="button"
              disabled={isCreatingDraft || !selectedPackageId}
              onClick={handleProceedToPayment}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 px-7 py-3 text-sm font-semibold text-white shadow-xl shadow-violet-600/30 active:scale-95 disabled:opacity-50 transition-all"
            >
              {isCreatingDraft ? 'Generating Payment Order...' : 'Proceed to UPI Payment'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 6: REAL UPI PAYMENT CHECKOUT & META SUBMIT */}
      {/* ======================================================== */}
      {step === 6 && activePayment && (
        <div className="mx-auto max-w-xl rounded-2xl border border-card bg-card p-6 sm:p-8 space-y-6 shadow-sm transition-colors">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-600/10 text-violet-600 dark:text-violet-400 mb-2 border border-violet-500/20">
              <Smartphone className="h-6 w-6" />
            </div>
            <div className="text-xs font-extrabold uppercase tracking-widest text-violet-600 dark:text-violet-400">
              SMAP
            </div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">
              Payment Summary
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Production UPI Checkout · Verified Backend Confirmation
            </p>
          </div>

          {/* Payment Summary Box */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/60 p-5 space-y-3.5 text-sm">
            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-xs">
              <span className="font-medium text-slate-500 dark:text-slate-400">Selected Package:</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {selectedPkg?.name || 'Advertising Package'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-xs">
              <span className="font-medium text-slate-500 dark:text-slate-400">Campaign Name:</span>
              <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                {adName || 'SMAP Campaign'}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-xs">
              <span className="font-medium text-slate-500 dark:text-slate-400">Duration:</span>
              <span className="font-semibold text-slate-900 dark:text-white">
                {selectedPkg?.duration_days || 5} Days Run
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-600 dark:text-slate-300 text-xs">
              <span className="font-medium text-slate-500 dark:text-slate-400">Payment Method:</span>
              <span className="font-bold text-violet-600 dark:text-violet-400 bg-violet-600/10 px-2 py-0.5 rounded">
                UPI ONLY
              </span>
            </div>

            {/* Supported UPI Apps Row */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800/80">
              <div className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 mb-2">
                Supported UPI Apps:
              </div>
              <div className="flex flex-wrap gap-2 text-[10px] font-bold">
                <span className="px-2.5 py-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/60">
                  PhonePe
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                  Google Pay
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-cyan-50 dark:bg-cyan-950/60 text-cyan-700 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800/60">
                  Paytm
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60">
                  BHIM
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  Any UPI App
                </span>
              </div>
            </div>

            {/* Amount */}
            <div className="border-t border-slate-200 dark:border-slate-800 pt-3 flex items-center justify-between text-base font-bold text-slate-900 dark:text-white">
              <span>Total Payable Amount</span>
              <span className="text-2xl text-emerald-600 dark:text-emerald-400 tabular-nums">
                ₹{activePayment.amount}
              </span>
            </div>
          </div>

          {/* Error Message */}
          {paymentError && (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-600 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
              <span>{paymentError}</span>
            </div>
          )}

          {/* Sandbox Notice Banner */}
          {gatewayStatus?.environment === 'sandbox' && (
            <div className="rounded-xl border border-amber-500/30 bg-amber-50 dark:bg-amber-950/30 p-3.5 text-xs text-amber-700 dark:text-amber-300 space-y-2">
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-amber-500" />
                  Gateway Environment: Sandbox Active
                </span>
                <span className="text-[10px] bg-amber-200/60 dark:bg-amber-900/60 px-2 py-0.5 rounded font-mono">
                  PAYMENT_ENV=sandbox
                </span>
              </div>
              <p className="text-[11px] leading-relaxed">
                Backend signature verification, idempotency protection, and gateway APIs are active. Use the test triggers below or launch real UPI checkout to test flows without real money.
              </p>
            </div>
          )}

          {/* Primary Action Button: [ Pay via UPI ] */}
          {activePayment.status !== 'PAID' && (
            <div className="space-y-3">
              <button
                type="button"
                disabled={isLaunchingCheckout || isVerifyingPayment}
                onClick={handleLaunchUpiCheckout}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-violet-600 hover:bg-violet-500 py-4 text-base font-bold text-white shadow-xl shadow-violet-600/30 transition-all active:scale-95 disabled:opacity-50"
              >
                {isLaunchingCheckout || isVerifyingPayment ? (
                  <>
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    Connecting to UPI Gateway...
                  </>
                ) : (
                  <>
                    <Smartphone className="h-5 w-5" />
                    Pay via UPI (₹{activePayment.amount})
                  </>
                )}
              </button>

              <div className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-3 text-xs">
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
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white font-medium text-xs transition-colors"
                >
                  {copiedUpi ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" /> Copy UPI ID
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Verified Backend Status Card */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Verified Backend Payment Status:
              </span>
              {activePayment.status === 'PAID' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 font-bold text-xs">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Payment Successful
                </span>
              ) : activePayment.status === 'FAILED' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/30 font-bold text-xs">
                  <AlertCircle className="h-3.5 w-3.5" /> Payment Failed
                </span>
              ) : activePayment.status === 'VERIFICATION_PENDING' ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/30 font-bold text-xs">
                  <Clock className="h-3.5 w-3.5" /> Verification Pending
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border border-yellow-500/30 font-bold text-xs">
                  <Clock className="h-3.5 w-3.5" /> Payment Pending
                </span>
              )}
            </div>

            {/* If Paid: Show verified gateway IDs and audit data */}
            {activePayment.status === 'PAID' && (
              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 text-xs space-y-1.5 text-slate-600 dark:text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400 text-[11px]">Payment Order ID:</span>
                  <span className="font-mono text-slate-900 dark:text-white font-medium">
                    {activePayment.gateway_order_id || activePayment.id}
                  </span>
                </div>
                {activePayment.gateway_payment_id && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[11px]">Gateway Payment ID:</span>
                    <span className="font-mono text-slate-900 dark:text-white font-medium">
                      {activePayment.gateway_payment_id}
                    </span>
                  </div>
                )}
                {activePayment.transaction_reference && (
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[11px]">UTR / Bank Ref:</span>
                    <span className="font-mono text-slate-900 dark:text-white font-medium">
                      {activePayment.transaction_reference}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-400 text-[11px]">Verification Source:</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {activePayment.verification_source || 'GATEWAY_API'}
                  </span>
                </div>
              </div>
            )}

            {/* Check Status Button for pending */}
            {activePayment.status !== 'PAID' && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  disabled={isVerifyingPayment}
                  onClick={checkPaymentStatus}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  <RefreshCw className={`h-3 w-3 ${isVerifyingPayment ? 'animate-spin' : ''}`} />
                  Check Status
                </button>
              </div>
            )}
          </div>

          {/* Sandbox Testing Flow Panel */}
          {gatewayStatus?.environment === 'sandbox' && (
            <div className="rounded-2xl border border-dashed border-violet-500/40 bg-violet-600/5 dark:bg-violet-950/20 p-4 text-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-violet-700 dark:text-violet-300 flex items-center gap-1.5">
                  <Zap className="h-4 w-4" />
                  Sandbox Test Suite (Test Before Live Payments)
                </span>
                <span className="text-[10px] text-violet-600 dark:text-violet-400 font-semibold">
                  API & Webhook Checks
                </span>
              </div>

              {sandboxActionMsg && (
                <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
                  {sandboxActionMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={isVerifyingPayment}
                  onClick={() => handleSimulateSandboxPayment('PAID')}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 px-3 text-xs shadow-sm transition-colors text-center disabled:opacity-50"
                >
                  Simulate Paid (API)
                </button>
                <button
                  type="button"
                  disabled={isVerifyingPayment}
                  onClick={() => handleSimulateWebhook(false)}
                  className="rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold py-2 px-3 text-xs shadow-sm transition-colors text-center disabled:opacity-50"
                >
                  Simulate Webhook
                </button>
                <button
                  type="button"
                  disabled={isVerifyingPayment}
                  onClick={() => handleSimulateWebhook(true)}
                  className="rounded-xl border border-violet-500 text-violet-600 dark:text-violet-300 font-bold py-2 px-3 text-xs hover:bg-violet-500/10 transition-colors text-center disabled:opacity-50"
                >
                  Test Idempotency
                </button>
              </div>

              <div className="flex justify-between items-center text-[11px] pt-1 text-slate-500 dark:text-slate-400">
                <span>Test Failure Scenario:</span>
                <button
                  type="button"
                  onClick={() => handleSimulateSandboxPayment('FAILED')}
                  className="text-red-500 hover:underline font-semibold"
                >
                  Simulate Failed Payment
                </button>
              </div>
            </div>
          )}

          {/* Backup Manual UTR Reference Input */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/30 p-4 text-xs space-y-2">
            <div className="flex items-start gap-2">
              <Info className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
                  Already paid via your mobile UPI app?
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  Optionally enter your 12-digit UTR reference for automated banking audit:
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmitUtr} className="pt-1 flex gap-2">
              <input
                type="text"
                required
                value={utrReference}
                onChange={(e) => setUtrReference(e.target.value)}
                placeholder="e.g. 427812903481"
                className="flex-1 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 py-1.5 px-3 text-xs text-slate-900 dark:text-white placeholder-slate-400 font-mono focus:border-violet-600 focus:outline-none"
              />
              <button
                type="submit"
                disabled={isSubmittingUtr}
                className="rounded-xl bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 text-white px-3.5 py-1.5 text-xs font-semibold disabled:opacity-50"
              >
                {isSubmittingUtr ? 'Saving...' : 'Record UTR'}
              </button>
            </form>

            {utrSuccessMsg && (
              <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                {utrSuccessMsg}
              </div>
            )}
          </div>

          {/* Final Campaign Meta Submission (Strictly Gated on Payment Confirmed) */}
          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-3">
            {metaSubmitSuccess ? (
              <div className="text-center py-4 space-y-3">
                <CheckCircle2 className="h-10 w-10 text-emerald-500 mx-auto" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Campaign Registered Successfully!
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Your ad has been transmitted to Meta and is undergoing official automated review.
                </p>
                <button
                  type="button"
                  onClick={() => onCampaignCreated(createdCampaign!.id)}
                  className="w-full rounded-xl bg-violet-600 hover:bg-violet-500 py-3 text-xs sm:text-sm font-bold text-white shadow-lg shadow-violet-600/25 transition-all"
                >
                  View Campaign in Dashboard
                </button>
              </div>
            ) : (
              <>
                {metaSubmitError && (
                  <div className="rounded-xl border border-red-500/30 bg-red-50 dark:bg-red-950/40 p-3 text-xs text-red-600 dark:text-red-300">
                    <div className="flex items-center gap-1.5 font-bold mb-1">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      Notice:
                    </div>
                    <p>{metaSubmitError}</p>
                  </div>
                )}

                {activePayment.status === 'PAID' ? (
                  <button
                    type="button"
                    disabled={isSubmittingToMeta}
                    onClick={handleSubmitToMeta}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/25 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {isSubmittingToMeta ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Submitting to Meta API...
                      </>
                    ) : (
                      <>
                        Submit Campaign to Meta Review
                        <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      type="button"
                      disabled
                      className="w-full flex items-center justify-center gap-2 rounded-xl bg-slate-300 dark:bg-slate-800 py-3.5 text-sm font-bold text-slate-500 dark:text-slate-500 cursor-not-allowed"
                    >
                      <Lock className="h-4 w-4" />
                      Payment Confirmation Required Before Meta Submission
                    </button>
                    <p className="text-[11px] text-center text-slate-400 dark:text-slate-500">
                      Campaigns cannot be submitted to Meta while payment is unverified.
                    </p>
                  </div>
                )}

                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => onCampaignCreated(createdCampaign!.id)}
                    className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  >
                    Save as Draft and Return to Dashboard
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
