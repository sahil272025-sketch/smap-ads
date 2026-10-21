import React, { useState, useEffect, useRef } from 'react';
import { Package, Campaign } from '../../types';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { AddFundsModal } from './AddFundsModal';
import {
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Smartphone,
  Facebook,
  Instagram,
  Sparkles,
  ShieldCheck,
  Check,
  X,
  Search,
  Layers,
  MapPin,
  ExternalLink,
  Info,
  Clock,
  Zap,
  Lock,
  Wallet,
  Plus,
  Target,
  TrendingUp,
  ShoppingBag,
  Users,
  MousePointer,
  Eye,
  Play,
  Calendar,
  CheckSquare,
  Square,
  DollarSign,
  Film,
  Image as ImageIcon,
  Video,
  Trash2,
  RefreshCw,
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
  'Delhi NCR',
];

const TOP_INDIAN_METROS = [
  'Mumbai',
  'Delhi NCR',
  'Bengaluru',
  'Hyderabad',
  'Chennai',
  'Kolkata',
  'Pune',
  'Ahmedabad',
  'Jaipur',
  'Surat',
  'Lucknow',
  'Chandigarh',
];

const POPULAR_INTEREST_TAGS = [
  'Online Shopping',
  'Small Business',
  'Retail & E-commerce',
  'Fashion & Apparel',
  'Technology & Gadgets',
  'Food & Dining',
  'Health & Fitness',
  'Travel & Tourism',
  'Real Estate',
  'Education & Learning',
  'Beauty & Cosmetics',
  'Digital Marketing',
];

type ObjectiveKey = 'AWARENESS' | 'TRAFFIC' | 'ENGAGEMENT' | 'LEADS' | 'SALES';

interface ObjectiveOption {
  key: ObjectiveKey;
  title: string;
  metaOutcome: string;
  description: string;
  bestFor: string;
  icon: React.ReactNode;
}

const OBJECTIVES: ObjectiveOption[] = [
  {
    key: 'AWARENESS',
    title: 'Awareness',
    metaOutcome: 'OUTCOME_AWARENESS',
    description: 'Reach the maximum number of people who are most likely to remember your brand and offer.',
    bestFor: 'Brand recall, local business launches, reaching wide demographics',
    icon: <Eye className="h-6 w-6 text-sky-500" />,
  },
  {
    key: 'TRAFFIC',
    title: 'Traffic',
    metaOutcome: 'OUTCOME_TRAFFIC',
    description: 'Direct high-intent people straight to your website, landing page, or online shop.',
    bestFor: 'Website visits, online catalogs, link clicks, blog readers',
    icon: <MousePointer className="h-6 w-6 text-violet-500" />,
  },
  {
    key: 'ENGAGEMENT',
    title: 'Engagement',
    metaOutcome: 'OUTCOME_ENGAGEMENT',
    description: 'Get more post likes, video views, comments, shares, or direct inquiries.',
    bestFor: 'Video views, social proof, community growth, post interactions',
    icon: <Sparkles className="h-6 w-6 text-amber-500" />,
  },
  {
    key: 'LEADS',
    title: 'Leads',
    metaOutcome: 'OUTCOME_LEADS',
    description: 'Collect contact details, inquiries, and customer interest for your business.',
    bestFor: 'Inquiry forms, service consultations, phone calls, quote requests',
    icon: <Users className="h-6 w-6 text-emerald-500" />,
  },
  {
    key: 'SALES',
    title: 'Sales',
    metaOutcome: 'OUTCOME_SALES',
    description: 'Find people likely to purchase your product or service online.',
    bestFor: 'E-commerce orders, checkout conversions, product sales',
    icon: <ShoppingBag className="h-6 w-6 text-rose-500" />,
  },
];

type PlacementKey = 'facebook_feed' | 'instagram_feed' | 'instagram_stories' | 'instagram_reels';

interface PlacementOption {
  key: PlacementKey;
  title: string;
  platform: 'facebook' | 'instagram';
  aspectRatio: string;
  description: string;
}

const PLACEMENTS_LIST: PlacementOption[] = [
  {
    key: 'facebook_feed',
    title: 'Facebook Feed',
    platform: 'facebook',
    aspectRatio: '1:1 or 4:5',
    description: 'Primary news feed across Facebook mobile and desktop apps.',
  },
  {
    key: 'instagram_feed',
    title: 'Instagram Feed',
    platform: 'instagram',
    aspectRatio: '1:1 or 4:5',
    description: 'Standard scroll feed on Instagram mobile application.',
  },
  {
    key: 'instagram_stories',
    title: 'Instagram Stories',
    platform: 'instagram',
    aspectRatio: '9:16 vertical',
    description: 'Full-screen immersive vertical stories appearing between user stories.',
  },
  {
    key: 'instagram_reels',
    title: 'Instagram Reels',
    platform: 'instagram',
    aspectRatio: '9:16 vertical',
    description: 'High-discovery short-form video feed on Instagram Reels tab.',
  },
];

const CTA_OPTIONS = [
  { value: 'LEARN_MORE', label: 'Learn More' },
  { value: 'SHOP_NOW', label: 'Shop Now' },
  { value: 'SIGN_UP', label: 'Sign Up' },
  { value: 'CONTACT_US', label: 'Contact Us' },
  { value: 'ORDER_NOW', label: 'Order Now' },
  { value: 'BOOK_NOW', label: 'Book Now' },
  { value: 'GET_OFFER', label: 'Get Offer' },
  { value: 'SEND_WHATSAPP_MESSAGE', label: 'Send WhatsApp Message' },
];

export interface CampaignPackageOption {
  id: string;
  alias: string;
  name: string;
  price: number;
  durationDays: number;
  tagline: string;
  popular?: boolean;
  features: string[];
}

export const CAMPAIGN_PACKAGES: CampaignPackageOption[] = [
  {
    id: 'pkg_starter_200',
    alias: 'starter_sprint',
    name: 'Starter Sprint',
    price: 200,
    durationDays: 5,
    tagline: 'Ideal for quick testing & local business reach',
    popular: false,
    features: [
      '5 Consecutive Days duration',
      '₹200 fixed total package price',
      'Facebook & Instagram advertising',
      'Target audience setup & optimization',
      'Live campaign tracking & status reporting',
      'UPI instant checkout',
    ],
  },
  {
    id: 'pkg_growth_399',
    alias: 'growth_accelerate',
    name: 'Growth Accelerate',
    price: 399,
    durationDays: 10,
    tagline: 'Most popular for small business growth & leads',
    popular: true,
    features: [
      '10 Consecutive Days duration',
      '₹399 fixed total package price',
      'Facebook & Instagram feeds, stories & reels',
      'Target audience setup & interest matching',
      'Priority campaign monitoring & analytics',
      'UPI instant checkout',
    ],
  },
  {
    id: 'pkg_pro_549',
    alias: 'business_pro',
    name: 'Business Pro',
    price: 549,
    durationDays: 14,
    tagline: 'Optimal 2-week continuous sales & traffic run',
    popular: false,
    features: [
      '14 Consecutive Days duration',
      '₹549 fixed total package price',
      'High-intent audience segment targeting',
      'Multi-placement algorithm delivery',
      'Extended auction reach stability',
      'UPI instant checkout',
    ],
  },
  {
    id: 'pkg_scale_749',
    alias: 'enterprise_scale',
    name: 'Enterprise Scale',
    price: 749,
    durationDays: 30,
    tagline: 'Full month high-authority brand & sales scale',
    popular: false,
    features: [
      '30 Days full monthly duration',
      '₹749 fixed total package price',
      'Pan-India high-frequency authority reach',
      'Long-term audience learning phase',
      'Dedicated placement optimization',
      'UPI instant checkout',
    ],
  },
];

export interface MediaMetadata {
  width: number;
  height: number;
  aspectRatio: string;
  ratioValue: number;
  duration?: number;
  durationFormatted?: string;
  format: string;
  sizeBytes: number;
  sizeFormatted: string;
  isPlacementCompatible: boolean;
  recommendation?: string;
  warningNotice?: string;
}

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
  const { language, t, formatCurrency } = useLanguage();
  const [step, setStep] = useState<number>(1);

  // STEP 1: Campaign Objective
  const [objective, setObjective] = useState<ObjectiveKey>('TRAFFIC');

  // STEP 2: Ad Creative & Copy
  const [businessName, setBusinessName] = useState<string>('SMAP Merchant Store');
  const [headline, setHeadline] = useState<string>('Special Festive Discount on All Orders');
  const [primaryText, setPrimaryText] = useState<string>(
    'Discover curated, high-quality collections with nationwide fast delivery. Shop now and enjoy verified satisfaction!'
  );
  const [description, setDescription] = useState<string>('Limited time offer • Free delivery across India');
  const [callToAction, setCallToAction] = useState<string>('LEARN_MORE');
  const [destinationType, setDestinationType] = useState<'website' | 'whatsapp'>('website');
  const [destinationUrl, setDestinationUrl] = useState<string>('https://example.com/festive-deal');
  
  // Media Upload & Preview
  const [creativeFile, setCreativeFile] = useState<File | null>(null);
  const [creativeUrl, setCreativeUrl] = useState<string>('/smap_hero_visual_1790756029679.jpg');
  const [creativeType, setCreativeType] = useState<'image' | 'video'>('image');
  const [mediaMetadata, setMediaMetadata] = useState<MediaMetadata | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [restoredFileName, setRestoredFileName] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewPlacement, setPreviewPlacement] = useState<PlacementKey>('instagram_feed');

  // STEP 3: Placements
  const [selectedPlacements, setSelectedPlacements] = useState<PlacementKey[]>([
    'facebook_feed',
    'instagram_feed',
    'instagram_stories',
    'instagram_reels',
  ]);

  // STEP 4: Audience
  const [isAllIndia, setIsAllIndia] = useState<boolean>(true);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [locationSearch, setLocationSearch] = useState<string>('');
  const [minAge, setMinAge] = useState<number>(18);
  const [maxAge, setMaxAge] = useState<number>(65);
  const [gender, setGender] = useState<'ALL' | 'MEN' | 'WOMEN'>('ALL');
  const [interests, setInterests] = useState<string[]>([
    'Online Shopping',
    'Small Business',
    'Retail & E-commerce',
  ]);
  const [customInterest, setCustomInterest] = useState<string>('');

  // STEP 5: Plan & Schedule
  const [selectedPackageId, setSelectedPackageId] = useState<string>('pkg_starter_200');
  const [startDate, setStartDate] = useState<string>(() => new Date().toISOString().split('T')[0]);

  // Selected package helper
  const selectedPackage =
    CAMPAIGN_PACKAGES.find((p) => p.id === selectedPackageId || p.alias === selectedPackageId) ||
    CAMPAIGN_PACKAGES[0];
  const finalPrice = selectedPackage.price;
  const durationDays = selectedPackage.durationDays;

  // STEP 6: Review & Checkout State
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [showAddFundsModal, setShowAddFundsModal] = useState<boolean>(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState<boolean>(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [completedOrder, setCompletedOrder] = useState<any | null>(null);
  const idempotencyKeyRef = useRef<string>(`idem_cmp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`);

  // Load wallet balance
  const refreshWalletBalance = () => {
    api.getWalletBalance()
      .then((res) => setWalletBalance(res.balance || 0))
      .catch(() => {});
  };

  useEffect(() => {
    refreshWalletBalance();
    // Restore saved media draft if present across refreshes
    try {
      const savedUrl = localStorage.getItem('smap_draft_media_url');
      const savedType = localStorage.getItem('smap_draft_media_type') as 'image' | 'video' | null;
      const savedMeta = localStorage.getItem('smap_draft_media_meta');
      const savedName = localStorage.getItem('smap_draft_media_name');
      if (savedUrl) {
        setCreativeUrl(savedUrl);
        if (savedType) setCreativeType(savedType);
        if (savedMeta) {
          try {
            setMediaMetadata(JSON.parse(savedMeta));
          } catch {}
        }
        if (savedName) setRestoredFileName(savedName);
      }
    } catch {}
  }, []);

  const persistMediaDraft = (url: string, type: 'image' | 'video', meta: MediaMetadata | null, fileName: string) => {
    try {
      localStorage.setItem('smap_draft_media_url', url);
      localStorage.setItem('smap_draft_media_type', type);
      localStorage.setItem('smap_draft_media_name', fileName);
      if (meta) {
        localStorage.setItem('smap_draft_media_meta', JSON.stringify(meta));
      }
    } catch {}
  };

  const clearMediaDraft = () => {
    try {
      localStorage.removeItem('smap_draft_media_url');
      localStorage.removeItem('smap_draft_media_type');
      localStorage.removeItem('smap_draft_media_name');
      localStorage.removeItem('smap_draft_media_meta');
    } catch {}
  };

  // Handle Initial Package selection if passed
  useEffect(() => {
    if (initialPackageId) {
      const norm = initialPackageId.toLowerCase();
      if (norm.includes('starter') || norm.includes('sprint')) {
        setSelectedPackageId('pkg_starter_200');
      } else if (norm.includes('growth') || norm.includes('accelerate') || norm.includes('booster')) {
        setSelectedPackageId('pkg_growth_399');
      } else if (norm.includes('pro') || norm.includes('business')) {
        setSelectedPackageId('pkg_pro_549');
      } else if (norm.includes('scale') || norm.includes('enterprise')) {
        setSelectedPackageId('pkg_scale_749');
      }
    }
  }, [initialPackageId]);

  // Computed End Date
  const computedEndDate = (() => {
    try {
      const d = new Date(startDate);
      d.setDate(d.getDate() + durationDays);
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  })();

  // Computed Audience Reach Estimate
  const estimatedReach = (() => {
    let base = isAllIndia ? 38000000 : selectedLocations.length * 2800000;
    if (gender !== 'ALL') base = Math.round(base * 0.55);
    const ageSpan = Math.max(1, (maxAge - minAge) / 47);
    base = Math.round(base * ageSpan);
    const interestFactor = Math.min(1.2, 0.4 + interests.length * 0.12);
    base = Math.round(base * interestFactor);
    const minReach = Math.max(50000, Math.round(base * 0.75));
    const maxReach = Math.max(120000, Math.round(base * 1.25));

    const fmt = (n: number) => {
      if (n >= 10000000) return `${(n / 10000000).toFixed(1)} Cr`;
      if (n >= 100000) return `${(n / 100000).toFixed(1)} Lakh`;
      return n.toLocaleString('en-IN');
    };

    return `${fmt(minReach)} – ${fmt(maxReach)} people`;
  })();

  // Helper to format bytes
  const formatFileSize = (bytes: number) => {
    if (bytes >= 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  // High-Quality Image & 70s Video Media Pre-Flight Inspection & Upload Handler
  const processMediaFile = async (file: File) => {
    if (!file) return;

    // Reset previous errors
    setUploadError(null);
    setUploadProgress(10);

    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const mime = file.type.toLowerCase();

    const isImage = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) || mime.startsWith('image/');
    const isVideo = ['mp4', 'mov', 'webm'].includes(ext) || mime.startsWith('video/');

    if (!isImage && !isVideo) {
      setUploadError(
        language === 'hi'
          ? `असमर्थित प्रारूप (.${ext || 'unknown'})। कृपया उच्च-गुणवत्ता छवि (JPG, JPEG, PNG, WEBP) या वीडियो (MP4, MOV) अपलोड करें।`
          : `Unsupported format (.${ext || 'unknown'}). Please upload a high-resolution image (JPG, JPEG, PNG, WEBP) or video (MP4, MOV).`
      );
      setUploadProgress(0);
      return;
    }

    const hasStoriesOrReels = selectedPlacements.some((p) => p.includes('stories') || p.includes('reels'));
    const isStoriesOnly = selectedPlacements.every((p) => p.includes('stories'));

    // Image Validation
    if (isImage) {
      if (file.size > 30 * 1024 * 1024) {
        setUploadError(
          language === 'hi'
            ? `छवि फ़ाइल आकार (${formatFileSize(file.size)}) मेटा छवि विज्ञापनों के लिए 30MB सीमा से अधिक है।`
            : `Image file size (${formatFileSize(file.size)}) exceeds the 30MB limit for Meta image ads.`
        );
        setUploadProgress(0);
        return;
      }

      setIsUploading(true);
      setUploadProgress(30);
      const objectUrl = URL.createObjectURL(file);
      try {
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error(language === 'hi' ? 'अपलोड की गई छवि अमान्य या दूषित है। कृपया दूसरी छवि का प्रयास करें।' : 'The uploaded image file is invalid or corrupted. Please try another image.'));
          img.src = objectUrl;
        });

        const w = img.naturalWidth;
        const h = img.naturalHeight;
        const ratio = w / h;

        if (w < 500 || h < 500) {
          setUploadError(
            language === 'hi'
              ? `छवि रिज़ॉल्यूशन (${w} × ${h} px) बहुत कम है। मेटा विज्ञापनों के लिए न्यूनतम 600 × 600 px (इष्टतम: 1080 × 1080 px) की सिफारिश की जाती है।`
              : `Image resolution (${w} × ${h} px) is too low for Meta ads. Minimum recommended is 600 × 600 px (optimal: 1080 × 1080 px for Feeds or 1080 × 1920 px for Stories/Reels).`
          );
          setIsUploading(false);
          setUploadProgress(0);
          return;
        }

        let ratioLabel = 'Custom';
        let recommendation = '';
        if (Math.abs(ratio - 1.0) <= 0.08) {
          ratioLabel = '1:1 Square (1080 × 1080)';
          recommendation = language === 'hi' ? 'फेसबुक और इंस्टाग्राम फीड के लिए इष्टतम मानक प्रारूप।' : 'Optimal standard format for Facebook & Instagram Feeds.';
        } else if (Math.abs(ratio - 0.8) <= 0.08) {
          ratioLabel = '4:5 Portrait (1080 × 1350)';
          recommendation = language === 'hi' ? 'इंस्टाग्राम और फेसबुक फीड के लिए उच्च जुड़ाव वाला वर्टिकल प्रारूप।' : 'Optimal high-engagement vertical ratio for Instagram & Facebook Feeds.';
        } else if (Math.abs(ratio - (9 / 16)) <= 0.08) {
          ratioLabel = '9:16 Full Screen (1080 × 1920)';
          recommendation = language === 'hi' ? 'स्टोरीज़ और रील्स के लिए इष्टतम फुल-स्क्रीन प्रारूप।' : 'Optimal full-screen immersive ratio for Instagram Stories, Reels, and Facebook Stories.';
        } else if (Math.abs(ratio - 1.91) <= 0.1) {
          ratioLabel = '1.91:1 Landscape (1200 × 628)';
          recommendation = language === 'hi' ? 'फीड लिंक विज्ञापनों के लिए लैंडस्केप प्रारूप।' : 'Horizontal banner format for Feed link ads.';
        } else {
          ratioLabel = `${w} : ${h}`;
          if (hasStoriesOrReels) {
            recommendation = language === 'hi' ? 'स्टोरीज़ और रील्स 9:16 (1080 × 1920 px) में सबसे अच्छी दिखती हैं।' : 'Stories & Reels display best in 9:16 (1080 × 1920 px). Custom aspect ratios will display with dynamic background framing.';
          }
        }

        setUploadProgress(65);
        // Upload original uncompressed image directly to backend storage
        const uploaded = await api.uploadCreative(file);
        setUploadProgress(100);
        setCreativeFile(file);
        setCreativeUrl(uploaded.url);
        setCreativeType('image');
        setRestoredFileName(file.name);
        const metadata: MediaMetadata = {
          width: w,
          height: h,
          aspectRatio: ratioLabel,
          ratioValue: ratio,
          format: ext.toUpperCase() || 'IMAGE',
          sizeBytes: file.size,
          sizeFormatted: formatFileSize(file.size),
          isPlacementCompatible: true,
          recommendation,
        };
        setMediaMetadata(metadata);
        persistMediaDraft(uploaded.url, 'image', metadata, file.name);
      } catch (err: any) {
        setUploadError(err.message || 'Image processing failed. Please verify the file.');
      } finally {
        URL.revokeObjectURL(objectUrl);
        setIsUploading(false);
        setTimeout(() => setUploadProgress(0), 400);
      }
    } else {
      // Video Validation (up to 70 seconds / 100MB)
      if (file.size > 100 * 1024 * 1024) {
        setUploadError(
          language === 'hi'
            ? `वीडियो फ़ाइल आकार (${formatFileSize(file.size)}) अधिकतम 100MB सीमा से अधिक है।`
            : `Video file size (${formatFileSize(file.size)}) exceeds the maximum 100MB limit for Meta video ads.`
        );
        setUploadProgress(0);
        return;
      }

      setIsUploading(true);
      setUploadProgress(25);
      const objectUrl = URL.createObjectURL(file);
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        await new Promise<void>((resolve, reject) => {
          video.onloadedmetadata = () => resolve();
          video.onerror = () => reject(new Error(language === 'hi' ? 'वीडियो पार्स करने में विफल। कृपया मान्य MP4 या MOV वीडियो जांचें।' : 'Failed to parse video. Please verify the file is a valid MP4 or MOV video encoded in H.264/AAC.'));
          video.src = objectUrl;
        });

        const duration = video.duration || 0;
        const w = video.videoWidth || 1080;
        const h = video.videoHeight || 1920;
        const ratio = w / h;

        if (duration < 3) {
          setUploadError(
            language === 'hi'
              ? `वीडियो अवधि (${duration.toFixed(1)}s) बहुत छोटी है। मेटा विज्ञापनों के लिए वीडियो कम से कम 3 सेकंड लंबा होना चाहिए।`
              : `Video duration (${duration.toFixed(1)}s) is too short. Meta advertising requires videos to be at least 3 seconds long.`
          );
          setIsUploading(false);
          setUploadProgress(0);
          return;
        }

        if (duration > 70.9) {
          setUploadError(
            language === 'hi'
              ? `वीडियो अवधि ${Math.round(duration)} सेकंड है। अधिकतम अनुमत वीडियो अवधि 70 सेकंड (1 मिनट 10 सेकंड) है। कृपया अपना वीडियो ट्रिम करें।`
              : `Video duration is ${Math.round(duration)} seconds (${Math.floor(duration / 60)}m ${Math.round(duration % 60)}s). Maximum allowed video duration is 70 seconds (1 minute 10 seconds). Please trim your video.`
          );
          setIsUploading(false);
          setUploadProgress(0);
          return;
        }

        let warningNotice = '';
        if (duration > 60 && isStoriesOnly) {
          warningNotice = language === 'hi'
            ? `नोट: स्टैंडअलोन इंस्टाग्राम स्टोरी कार्ड अधिकतम 60 सेकंड प्रति कार्ड दिखाते हैं।`
            : `Note: Standalone Instagram Stories cards display up to 60s per card. Since your video is ${Math.round(duration)}s, ensure Instagram Reels and Feed placements are enabled for seamless 70s continuous playback.`;
        }

        let ratioLabel = 'Custom';
        let recommendation = '';
        if (Math.abs(ratio - (9 / 16)) <= 0.08) {
          ratioLabel = '9:16 Full Screen (1080 × 1920)';
          recommendation = language === 'hi' ? 'इंस्टाग्राम रील्स, फेसबुक रील्स और स्टोरीज़ के लिए उपयुक्त।' : 'Perfect for Instagram Reels, Facebook Reels, and Stories.';
        } else if (Math.abs(ratio - 1.0) <= 0.08) {
          ratioLabel = '1:1 Square (1080 × 1080)';
          recommendation = language === 'hi' ? 'फ़ीड वीडियो प्लेसमेंट के लिए उपयुक्त।' : 'Optimal for Feed video placements.';
        } else if (Math.abs(ratio - 0.8) <= 0.08) {
          ratioLabel = '4:5 Portrait (1080 × 1350)';
          recommendation = language === 'hi' ? 'उच्च जुड़ाव वाला मोबाइल फ़ीड वीडियो प्रारूप।' : 'High-engagement mobile Feed video format.';
        } else {
          ratioLabel = `${w} : ${h}`;
        }

        const mins = Math.floor(duration / 60);
        const secs = Math.round(duration % 60);
        const durationFormatted = `${mins > 0 ? `${mins}m ` : ''}${secs}s`;

        setUploadProgress(60);
        // Upload original uncompressed video
        const uploaded = await api.uploadCreative(file);
        setUploadProgress(100);
        setCreativeFile(file);
        setCreativeUrl(uploaded.url);
        setCreativeType('video');
        setRestoredFileName(file.name);
        const metadata: MediaMetadata = {
          width: w,
          height: h,
          aspectRatio: ratioLabel,
          ratioValue: ratio,
          duration,
          durationFormatted,
          format: ext.toUpperCase() || 'VIDEO',
          sizeBytes: file.size,
          sizeFormatted: formatFileSize(file.size),
          isPlacementCompatible: true,
          recommendation,
          warningNotice,
        };
        setMediaMetadata(metadata);
        persistMediaDraft(uploaded.url, 'video', metadata, file.name);
      } catch (err: any) {
        setUploadError(err.message || 'Video processing failed. Please verify the file.');
      } finally {
        URL.revokeObjectURL(objectUrl);
        setIsUploading(false);
        setTimeout(() => setUploadProgress(0), 400);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processMediaFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processMediaFile(file);
    }
  };

  const handleRemoveMedia = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCreativeFile(null);
    setCreativeUrl('/smap_hero_visual_1790756029679.jpg');
    setCreativeType('image');
    setMediaMetadata(null);
    setUploadError(null);
    setRestoredFileName(null);
    clearMediaDraft();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Toggle Placement
  const togglePlacement = (pl: PlacementKey) => {
    setSelectedPlacements((prev) => {
      if (prev.includes(pl)) {
        if (prev.length <= 1) return prev; // Keep at least one
        return prev.filter((p) => p !== pl);
      } else {
        return [...prev, pl];
      }
    });
  };

  // Toggle Location
  const toggleLocation = (loc: string) => {
    setSelectedLocations((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    );
  };

  // Add Custom Interest
  const handleAddInterest = () => {
    const trimmed = customInterest.trim();
    if (trimmed && !interests.includes(trimmed)) {
      setInterests((prev) => [...prev, trimmed]);
      setCustomInterest('');
    }
  };

  // Step Validation
  const canProceedStep = (s: number): boolean => {
    switch (s) {
      case 1:
        return !!objective;
      case 2:
        return (
          !isUploading &&
          !!headline.trim() &&
          headline.trim().length <= 100 &&
          !!description.trim() &&
          description.trim().length <= 400
        );
      case 3:
        return selectedPlacements.length > 0;
      case 4:
        return (isAllIndia || selectedLocations.length > 0) && minAge < maxAge;
      case 5:
        return !!selectedPackageId && durationDays >= 1;
      default:
        return true;
    }
  };

  // Place Order & Pay via SMAP Wallet
  const handlePlaceOrder = async () => {
    if (walletBalance < finalPrice) {
      setShowAddFundsModal(true);
      return;
    }

    setIsPlacingOrder(true);
    setCheckoutError(null);

    try {
      const finalHeadline = headline.trim();
      const finalDescription = description.trim();
      const finalPrimaryText = finalDescription || finalHeadline;
      const finalBusinessName = businessName.trim() || user?.name || 'SMAP Verified Merchant';
      const finalCreativeUrl = creativeUrl || '/smap_hero_visual_1790756029679.jpg';
      const finalDestinationUrl = destinationUrl.trim() || 'https://smap-ads.onrender.com';
      const finalCallToAction = callToAction || 'LEARN_MORE';

      const payload = {
        packageId: selectedPackage.id,
        objective,
        businessName: finalBusinessName,
        headline: finalHeadline,
        primaryText: finalPrimaryText,
        description: finalDescription,
        callToAction: finalCallToAction,
        destinationType: destinationType || 'website',
        destinationUrl: finalDestinationUrl,
        creativeUrl: finalCreativeUrl,
        creativeType: creativeType || 'image',
        placements: selectedPlacements,
        targeting: {
          country: 'IN',
          state: isAllIndia ? 'All India' : selectedLocations.join(', '),
          city: isAllIndia ? 'All Cities' : selectedLocations.join(', '),
          min_age: minAge,
          max_age: maxAge,
          gender,
          interests,
          locations: isAllIndia ? ['All India'] : selectedLocations,
          estimated_audience_size: estimatedReach,
        },
        startDate,
        idempotencyKey: idempotencyKeyRef.current,
      };

      const result = await api.checkoutCampaign(payload);
      setCompletedOrder(result);
      if (typeof result.newBalance === 'number') {
        setWalletBalance(result.newBalance);
      } else {
        refreshWalletBalance();
      }
      setStep(7); // Show confirmation view
    } catch (err: any) {
      setCheckoutError(err.message || 'Campaign order checkout failed. Please try again.');
      refreshWalletBalance();
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const stepTitles = language === 'hi' ? [
    'उद्देश्य',
    'विज्ञापन सामग्री',
    'प्लेसमेंट्स',
    'लक्षित दर्शक',
    'योजना और अवधि',
    'समीक्षा और भुगतान',
  ] : [
    'Objective',
    'Ad Creative',
    'Placements',
    'Audience',
    'Plan & Duration',
    'Review & Pay',
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6 animate-in fade-in duration-200">
      {/* Top Header Card with Step Indicator */}
      <div className="rounded-2xl border border-card bg-card p-4 sm:p-6 shadow-sm transition-colors">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center justify-center h-6 px-2.5 rounded-full bg-violet-600/10 text-violet-600 dark:text-violet-400 font-bold text-xs">
                {step <= 6 ? (language === 'hi' ? `चरण ${step} / 6` : `Step ${step} of 6`) : (language === 'hi' ? 'पूर्ण' : 'Complete')}
              </span>
              <h1 className="text-lg font-bold text-slate-900 dark:text-white">
                {step <= 6 ? stepTitles[step - 1] : (language === 'hi' ? 'अभियान ड्राफ्ट तैयार' : 'Campaign Draft Created')}
              </h1>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {language === 'hi'
                ? 'आधिकारिक मेटा मार्केटिंग API एकीकरण के साथ फेसबुक और इंस्टाग्राम विज्ञापन अभियान बनाएं और पूर्वावलोकन करें।'
                : 'Create and preview Facebook & Instagram advertising campaigns with verified Meta Marketing API integration.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900 px-3.5 py-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
            >
              {language === 'hi' ? 'बिल्डर से बाहर निकलें' : 'Exit Builder'}
            </button>
          </div>
        </div>

        {/* Visual Step Progress Bar */}
        {step <= 6 && (
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
        )}
      </div>

      {/* ======================================================== */}
      {/* STEP 1: CAMPAIGN OBJECTIVE */}
      {/* ======================================================== */}
      {step === 1 && (
        <div className="rounded-2xl border border-card bg-card p-6 sm:p-8 space-y-6 shadow-sm transition-colors">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Select Campaign Objective
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Choose the primary business outcome for your advertising campaign. Meta optimizes delivery based on your objective.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {OBJECTIVES.map((obj) => (
              <div
                key={obj.key}
                onClick={() => setObjective(obj.key)}
                className={`cursor-pointer rounded-2xl border-2 p-5 transition-all flex flex-col justify-between ${
                  objective === obj.key
                    ? 'border-violet-600 bg-violet-600/5 dark:bg-violet-950/20 shadow-md shadow-violet-500/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800">
                    {obj.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                        {obj.title}
                      </h3>
                      {objective === obj.key && (
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-600 text-white">
                          <Check className="h-3 w-3" />
                        </span>
                      )}
                    </div>
                    <span className="inline-block mt-0.5 text-[10px] font-mono text-violet-600 dark:text-violet-400 font-semibold">
                      {obj.metaOutcome}
                    </span>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-2">
                      {obj.description}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                  <span className="font-medium text-slate-400">Best for:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-medium truncate ml-2">
                    {obj.bestFor}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setStep(2)}
              disabled={!canProceedStep(1)}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-violet-600/25 hover:bg-violet-500 active:scale-95 transition-all disabled:opacity-50"
            >
              <span>Continue to Creative</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 2: AD CREATIVE & COPY + LIVE PREVIEWS */}
      {/* ======================================================== */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Form (7 cols) - Ad Creative & Media Upload */}
          <div className="lg:col-span-7 rounded-2xl border border-card bg-card p-6 space-y-5 shadow-sm transition-colors">
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
                {language === 'hi' ? 'विज्ञापन सामग्री और मीडिया' : 'Design Your Ad Creative'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                {language === 'hi'
                  ? 'अपनी विज्ञापन फ़ोटो या वीडियो अपलोड करें, और शीर्षक व विवरण दर्ज करें। मेटा प्लेसमेंट और सुरक्षा सेटिंग्स स्वचालित रूप से प्रबंधित होती हैं।'
                  : 'Upload your ad photo or video, and enter your Headline and Description. Meta placements and technical defaults are handled safely.'}
              </p>
            </div>

            {/* Ad Creative Upload Section (Image or Video) */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {t.createAd.uploadCreative || 'Ad Creative (Image or Video)'}
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {language === 'hi' ? 'छवि ≤ 30MB • वीडियो ≤ 100MB (3-70s)' : 'Image ≤ 30MB • Video ≤ 100MB (3-70s)'}
                </span>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/quicktime,video/webm"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Upload State / Active Media Preview / Dropzone */}
              {isUploading ? (
                <div className="rounded-2xl border border-violet-500/40 bg-violet-500/5 dark:bg-violet-950/20 p-6 text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-violet-600 dark:text-violet-400 font-semibold text-xs sm:text-sm">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span>
                      {language === 'hi'
                        ? `उच्च-गुणवत्ता मीडिया अपलोड और सत्यापन प्रगति पर है (${uploadProgress}%)...`
                        : `Uploading & validating high-resolution media (${uploadProgress}%)...`}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-violet-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {language === 'hi'
                      ? 'मेटा विज्ञापनों के लिए प्रारूप, रिज़ॉल्यूशन और पहलू अनुपात की जांच की जा रही है।'
                      : 'Verifying dimensions, lossless quality, and Meta placement compliance.'}
                  </p>
                </div>
              ) : creativeFile || (creativeUrl && creativeUrl !== '/smap_hero_visual_1790756029679.jpg') || restoredFileName ? (
                /* Uploaded File Card with Preview, Meta info, Replace and Remove */
                <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 dark:bg-violet-950/15 p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    {/* Media Thumbnail */}
                    <div className="relative h-20 w-20 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 flex-shrink-0 flex items-center justify-center">
                      {creativeType === 'video' ? (
                        <>
                          <video
                            src={creativeUrl}
                            className="h-full w-full object-cover"
                            muted
                            playsInline
                          />
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <Play className="h-6 w-6 text-white drop-shadow" />
                          </div>
                        </>
                      ) : (
                        <img
                          src={creativeUrl}
                          alt="Creative preview"
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.currentTarget as HTMLImageElement).src =
                              'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80';
                          }}
                        />
                      )}
                    </div>

                    {/* Metadata & Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-violet-600 text-white">
                          {creativeType === 'video' ? 'Video' : 'Image'}
                        </span>
                        {mediaMetadata?.aspectRatio && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {mediaMetadata.aspectRatio}
                          </span>
                        )}
                        {mediaMetadata?.durationFormatted && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                            {mediaMetadata.durationFormatted}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400">
                          {creativeFile ? formatFileSize(creativeFile.size) : (mediaMetadata?.sizeFormatted || '')}
                        </span>
                      </div>

                      <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                        {creativeFile?.name || restoredFileName || 'Uploaded Creative Asset'}
                      </p>

                      {mediaMetadata?.recommendation && (
                        <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{mediaMetadata.recommendation}</span>
                        </p>
                      )}

                      {mediaMetadata?.warningNotice && (
                        <p className="text-[11px] text-amber-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{mediaMetadata.warningNotice}</span>
                        </p>
                      )}
                    </div>

                    {/* Actions: Replace / Remove */}
                    <div className="flex flex-col gap-1.5 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[11px] font-semibold text-slate-700 dark:text-slate-300 hover:border-violet-500 hover:text-violet-600 transition-colors shadow-sm cursor-pointer"
                      >
                        <RefreshCw className="h-3 w-3" />
                        <span>{language === 'hi' ? 'बदलें' : 'Replace'}</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveMedia}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-red-200 dark:border-red-950/60 bg-red-50 dark:bg-red-950/20 text-[11px] font-semibold text-red-600 dark:text-red-400 hover:bg-red-100 transition-colors cursor-pointer"
                      >
                        <Trash2 className="h-3 w-3" />
                        <span>{language === 'hi' ? 'हटाएं' : 'Remove'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Drag-and-Drop Area & Upload Button */
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  className={`group cursor-pointer rounded-2xl border-2 border-dashed p-6 text-center transition-all ${
                    isDragging
                      ? 'border-violet-500 bg-violet-500/10 scale-[0.99]'
                      : 'border-slate-200 dark:border-slate-800 hover:border-violet-500/50 bg-slate-50/50 dark:bg-slate-900/30'
                  }`}
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <div className="p-3 rounded-2xl bg-violet-600/10 text-violet-600 dark:text-violet-400 group-hover:scale-110 transition-transform">
                      <UploadCloud className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white">
                        {language === 'hi'
                          ? 'विज्ञापन फ़ोटो या वीडियो चुनें, या यहाँ ड्रैग करें'
                          : 'Click to upload ad media or drag & drop here'}
                      </p>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {language === 'hi'
                          ? 'समर्थित प्रारूप: JPG, JPEG, PNG, WEBP (अधिकतम 30MB) • MP4, MOV (अधिकतम 100MB, 3-70s)'
                          : 'JPG, JPEG, PNG, WEBP (up to 30MB) • MP4, MOV up to 70s (up to 100MB)'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        fileInputRef.current?.click();
                      }}
                      className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold text-xs shadow-md shadow-violet-600/20 active:scale-95 transition-all cursor-pointer"
                    >
                      <UploadCloud className="h-3.5 w-3.5" />
                      <span>{language === 'hi' ? 'फ़ोटो या वीडियो अपलोड करें' : 'Choose Ad Photo or Video'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Validation Error Notice */}
              {uploadError && (
                <div className="p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-start gap-2.5">
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <span className="font-semibold">{language === 'hi' ? 'अपलोड त्रुटि:' : 'Upload validation notice:'}</span>{' '}
                    <span>{uploadError}</span>
                  </div>
                </div>
              )}

              {/* Meta Placement Specs Quick Guide */}
              <div className="grid grid-cols-3 gap-2 pt-1 text-[10px] text-slate-500 dark:text-slate-400">
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-center">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">Feeds</span>
                  <span>1:1 Square / 4:5</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-center">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">Stories & Reels</span>
                  <span>9:16 Full Screen</span>
                </div>
                <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 text-center">
                  <span className="font-bold text-slate-700 dark:text-slate-300 block">Video Duration</span>
                  <span>3s to 70s</span>
                </div>
              </div>
            </div>

            {/* Field 1: Heading (Required, max 100 characters) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {t.createAd.heading || 'Heading'} <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {headline.length}/100 chars
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t.createAd.headingHint || 'Required • Maximum 100 characters. Keep it punchy and engaging.'}
              </p>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                maxLength={100}
                placeholder={t.createAd.headingPlaceholder || 'e.g., Special Festive Discount on All Orders'}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 px-3.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all shadow-inner"
              />
              {headline.trim().length === 0 && (
                <span className="text-[10px] text-amber-500 font-medium block">
                  {language === 'hi' ? 'शीर्षक आवश्यक है (अधिकतम 100 वर्ण)' : 'Heading is required (maximum 100 characters)'}
                </span>
              )}
            </div>

            {/* Field 2: Description (Required, max 400 characters) */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                  {t.createAd.description || 'Description'} <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">
                  {description.length}/400 chars
                </span>
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {t.createAd.descriptionHint || 'Required • Maximum 400 characters. Tell customers about your products or offers.'}
              </p>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setPrimaryText(e.target.value);
                }}
                maxLength={400}
                placeholder={t.createAd.descriptionPlaceholder || 'e.g., Discover curated, high-quality collections with nationwide fast delivery. Shop now and enjoy verified satisfaction!'}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-3 px-3.5 text-xs sm:text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:border-violet-500 focus:ring-1 focus:ring-violet-500 focus:outline-none transition-all shadow-inner resize-y min-h-[110px]"
              />
              {description.trim().length === 0 && (
                <span className="text-[10px] text-amber-500 font-medium block">
                  {language === 'hi' ? 'विवरण आवश्यक है (अधिकतम 400 वर्ण)' : 'Description is required (maximum 400 characters)'}
                </span>
              )}
            </div>

            {/* Automated Safe Defaults Card */}
            <div className="rounded-xl border border-violet-500/20 bg-violet-500/5 dark:bg-violet-950/20 p-3.5 sm:p-4 space-y-1.5 text-xs">
              <div className="flex items-center gap-2 font-bold text-violet-700 dark:text-violet-300">
                <Sparkles className="h-4 w-4 text-violet-500 flex-shrink-0" />
                <span>{t.createAd.safeDefaultsTitle || 'Automated Meta Setup & Safe Defaults'}</span>
              </div>
              <p className="text-[11px] sm:text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {t.createAd.safeDefaultsDesc || 'High-res lossless visual, verified merchant identity, "Learn More" action, and secured destination are pre-configured for Meta Marketing API compliance.'}
              </p>
              <div className="pt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <Check className="h-3 w-3 text-emerald-500" />
                  {language === 'hi' ? 'सत्यापित मर्चेंट पहचान' : 'Verified Merchant Identity'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <Check className="h-3 w-3 text-emerald-500" />
                  {language === 'hi' ? 'उच्च-रिज़ॉल्यूशन विज़ुअल' : 'Lossless Visual Template'}
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <Check className="h-3 w-3 text-emerald-500" />
                  CTA: Learn More
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>{language === 'hi' ? 'वापस' : 'Back'}</span>
              </button>

              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!canProceedStep(2)}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-violet-600/25 hover:bg-violet-500 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
              >
                <span>{language === 'hi' ? 'प्लेसमेंट के लिए आगे बढ़ें' : 'Continue to Placements'}</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Right Live Preview (5 cols) */}
          <div className="lg:col-span-5 rounded-2xl border border-card bg-card p-5 space-y-4 shadow-sm transition-colors sticky top-4 self-start">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Smartphone className="h-4 w-4 text-violet-500" />
                <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Live Ad Preview
                </h3>
              </div>
              <span className="text-[10px] text-slate-400 font-medium">Real Mockup</span>
            </div>

            {/* Placement Switcher for Preview */}
            <div className="flex rounded-xl bg-slate-100 dark:bg-slate-900 p-1 gap-1 text-[11px] font-semibold">
              <button
                type="button"
                onClick={() => setPreviewPlacement('instagram_feed')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  previewPlacement === 'instagram_feed'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                IG Feed
              </button>
              <button
                type="button"
                onClick={() => setPreviewPlacement('facebook_feed')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  previewPlacement === 'facebook_feed'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                FB Feed
              </button>
              <button
                type="button"
                onClick={() => setPreviewPlacement('instagram_stories')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  previewPlacement === 'instagram_stories'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Stories
              </button>
              <button
                type="button"
                onClick={() => setPreviewPlacement('instagram_reels')}
                className={`flex-1 py-1.5 rounded-lg transition-all ${
                  previewPlacement === 'instagram_reels'
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Reels
              </button>
            </div>

            {/* Ad Mockup Frame */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-black shadow-sm text-slate-900 dark:text-white text-xs">
              {/* Header */}
              <div className="p-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-900">
                <div className="flex items-center gap-2">
                  <div className="h-7 w-7 rounded-full bg-gradient-to-tr from-amber-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs shadow-inner">
                    {businessName ? businessName.charAt(0).toUpperCase() : 'S'}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-xs truncate max-w-[140px]">
                        {previewPlacement.startsWith('instagram') ? 'ravi105065' : 'Sahil Gupta'}
                      </span>
                      <span className="text-[10px] text-slate-400">•</span>
                      <span className="text-[10px] text-violet-500 font-semibold">Sponsored</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block truncate max-w-[160px]">
                      {businessName || 'SMAP Advertising'}
                    </span>
                  </div>
                </div>
                {previewPlacement.startsWith('instagram') ? (
                  <Instagram className="h-4 w-4 text-pink-500" />
                ) : (
                  <Facebook className="h-4 w-4 text-blue-600" />
                )}
              </div>

              {/* Primary text for feeds */}
              {(previewPlacement === 'facebook_feed' || previewPlacement === 'instagram_feed') && (
                <div className="px-3 py-2 text-xs leading-relaxed text-slate-700 dark:text-slate-300">
                  {description || primaryText || 'Your ad description will be displayed here.'}
                </div>
              )}

              {/* Creative Media Preview */}
              <div className="relative bg-slate-100 dark:bg-slate-900 aspect-square overflow-hidden flex items-center justify-center">
                {creativeType === 'video' ? (
                  <video
                    src={creativeUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <img
                    src={creativeUrl || '/smap_hero_visual_1790756029679.jpg'}
                    alt="Ad Creative"
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80';
                    }}
                  />
                )}

                {/* Vertical Story/Reels Overlay */}
                {(previewPlacement === 'instagram_stories' || previewPlacement === 'instagram_reels') && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 p-4 flex flex-col justify-between text-white">
                    <div className="flex items-center gap-2">
                      <div className="h-6 w-6 rounded-full bg-violet-600 flex items-center justify-center font-bold text-[10px]">
                        SG
                      </div>
                      <span className="font-bold text-xs">@ravi105065</span>
                      <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded text-white font-medium">
                        Sponsored
                      </span>
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs line-clamp-2 drop-shadow">
                        {description || primaryText}
                      </p>
                      <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-between">
                        <span className="font-bold text-xs">{headline || 'Headline'}</span>
                        <span className="text-[10px] font-bold bg-white text-slate-900 px-3 py-1 rounded-lg">
                          {CTA_OPTIONS.find((c) => c.value === callToAction)?.label || 'Learn More'}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Card for Feeds */}
              {(previewPlacement === 'facebook_feed' || previewPlacement === 'instagram_feed') && (
                <div className="p-3 bg-slate-50 dark:bg-slate-950 flex items-center justify-between border-t border-slate-100 dark:border-slate-900">
                  <div className="flex-1 mr-2 overflow-hidden">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block truncate">
                      {destinationType === 'website' ? new URL(destinationUrl || 'https://example.com').hostname : 'WhatsApp Business'}
                    </span>
                    <h4 className="font-bold text-xs truncate text-slate-900 dark:text-white">
                      {headline || 'Headline'}
                    </h4>
                    {description && (
                      <p className="text-[11px] text-slate-400 truncate">{description}</p>
                    )}
                  </div>
                  <button
                    type="button"
                    className="flex-shrink-0 px-3 py-1.5 rounded-lg bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-bold text-[11px] shadow-sm"
                  >
                    {CTA_OPTIONS.find((c) => c.value === callToAction)?.label}
                  </button>
                </div>
              )}
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
                <span>Verified Meta Identities Attached</span>
              </div>
              <p className="text-[10px] text-slate-500">
                Facebook Page: <strong className="text-slate-700 dark:text-slate-300">Sahil Gupta</strong> (ID: 128670460329078)
              </p>
              <p className="text-[10px] text-slate-500">
                Instagram Account: <strong className="text-slate-700 dark:text-slate-300">@ravi105065</strong> (Connected)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 3: PLACEMENTS */}
      {/* ======================================================== */}
      {step === 3 && (
        <div className="rounded-2xl border border-card bg-card p-6 sm:p-8 space-y-6 shadow-sm transition-colors">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Select Ad Placements
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Deliver your advertising across Facebook and Instagram placements. Select which positions to include.
            </p>
          </div>

          {/* Quick Select All / Reset */}
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              {selectedPlacements.length} of {PLACEMENTS_LIST.length} placements enabled
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSelectedPlacements(PLACEMENTS_LIST.map((p) => p.key))}
                className="text-xs font-semibold text-violet-600 dark:text-violet-400 hover:underline"
              >
                Enable All
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PLACEMENTS_LIST.map((pl) => {
              const isSelected = selectedPlacements.includes(pl.key);
              return (
                <div
                  key={pl.key}
                  onClick={() => togglePlacement(pl.key)}
                  className={`cursor-pointer rounded-2xl border-2 p-5 transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'border-violet-600 bg-violet-600/5 dark:bg-violet-950/20 shadow-md shadow-violet-500/10'
                      : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900/40 opacity-70'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800">
                        {pl.platform === 'facebook' ? (
                          <Facebook className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Instagram className="h-5 w-5 text-pink-500" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                          {pl.title}
                        </h3>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Aspect ratio: {pl.aspectRatio}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center">
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 text-violet-600" />
                      ) : (
                        <Square className="h-5 w-5 text-slate-300 dark:text-slate-600" />
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 mt-3">
                    {pl.description}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                    <span className="text-slate-400 font-medium">Meta Ad Account Asset:</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Supported & Linked
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => setStep(4)}
              disabled={!canProceedStep(3)}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-violet-600/25 hover:bg-violet-500 active:scale-95 transition-all disabled:opacity-50"
            >
              <span>Continue to Audience</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 4: AUDIENCE TARGETING */}
      {/* ======================================================== */}
      {step === 4 && (
        <div className="rounded-2xl border border-card bg-card p-6 sm:p-8 space-y-6 shadow-sm transition-colors">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Target Your Ideal Audience
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select geographic location, age demographics, gender, and customer interests across India.
            </p>
          </div>

          {/* Location Targeting */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Location Targeting
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setIsAllIndia(true)}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all flex items-center justify-between ${
                  isAllIndia
                    ? 'border-violet-600 bg-violet-600/5 dark:bg-violet-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-5 w-5 text-violet-500" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      All India (Pan-India Reach)
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Reach potential customers across all 28 states & union territories
                    </span>
                  </div>
                </div>
                {isAllIndia && <Check className="h-4 w-4 text-violet-600" />}
              </div>

              <div
                onClick={() => setIsAllIndia(false)}
                className={`cursor-pointer rounded-xl border-2 p-4 transition-all flex items-center justify-between ${
                  !isAllIndia
                    ? 'border-violet-600 bg-violet-600/5 dark:bg-violet-950/20'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <MapPin className="h-5 w-5 text-emerald-500" />
                  <div>
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                      Specific States & Cities
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      Filter to target specific Indian states or high-converting metro cities
                    </span>
                  </div>
                </div>
                {!isAllIndia && <Check className="h-4 w-4 text-violet-600" />}
              </div>
            </div>

            {/* If Specific States/Cities selected */}
            {!isAllIndia && (
              <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Selected Locations ({selectedLocations.length})
                  </span>
                  <div className="relative w-48">
                    <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      value={locationSearch}
                      onChange={(e) => setLocationSearch(e.target.value)}
                      placeholder="Search state/city..."
                      className="w-full rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-1.5 pl-8 pr-2 text-xs focus:outline-none"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto p-1">
                  {[...TOP_INDIAN_METROS, ...ALL_28_INDIAN_STATES]
                    .filter((loc, idx, arr) => arr.indexOf(loc) === idx)
                    .filter((loc) => !locationSearch || loc.toLowerCase().includes(locationSearch.toLowerCase()))
                    .map((loc) => {
                      const sel = selectedLocations.includes(loc);
                      return (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => toggleLocation(loc)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                            sel
                              ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                          }`}
                        >
                          {loc} {sel && '✓'}
                        </button>
                      );
                    })}
                </div>
              </div>
            )}
          </div>

          {/* Demographic: Age Range & Gender */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Age Range: <span className="text-violet-600 dark:text-violet-400 font-extrabold">{minAge} – {maxAge} years</span>
              </label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Min Age</span>
                  <input
                    type="number"
                    min={18}
                    max={60}
                    value={minAge}
                    onChange={(e) => setMinAge(Math.min(Number(e.target.value), maxAge - 1))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-xs"
                  />
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block mb-1">Max Age</span>
                  <input
                    type="number"
                    min={19}
                    max={65}
                    value={maxAge}
                    onChange={(e) => setMaxAge(Math.max(Number(e.target.value), minAge + 1))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-xs"
                  />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Gender Targeting
              </label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {(['ALL', 'MEN', 'WOMEN'] as const).map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setGender(g)}
                    className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                      gender === g
                        ? 'border-violet-600 bg-violet-600/10 text-violet-600 dark:text-violet-400 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    }`}
                  >
                    {g === 'ALL' ? 'All (100%)' : g === 'MEN' ? 'Men' : 'Women'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Interests Targeting */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
              Audience Interests & Behaviors
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {POPULAR_INTEREST_TAGS.map((tag) => {
                const active = interests.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setInterests((prev) =>
                        active ? prev.filter((t) => t !== tag) : [...prev, tag]
                      );
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      active
                        ? 'bg-violet-600 text-white border-violet-600 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {tag} {active && '✓'}
                  </button>
                );
              })}
            </div>

            {/* Custom Tag Input */}
            <div className="flex gap-2 mt-3">
              <input
                type="text"
                value={customInterest}
                onChange={(e) => setCustomInterest(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddInterest()}
                placeholder="Add custom interest tag (e.g. Handmade Crafts)..."
                className="flex-1 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2 px-3 text-xs"
              />
              <button
                type="button"
                onClick={handleAddInterest}
                className="px-4 py-2 rounded-xl bg-slate-900 dark:bg-slate-800 text-white text-xs font-semibold hover:bg-slate-800"
              >
                Add Tag
              </button>
            </div>
          </div>

          {/* Estimated Reach Gauge */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-violet-600/10 via-indigo-600/10 to-sky-600/10 border border-violet-500/20 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] uppercase font-bold text-violet-600 dark:text-violet-400 tracking-wider">
                Estimated Audience Size
              </span>
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white mt-0.5">
                {estimatedReach}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Calculated based on selected Indian locations, age ({minAge}-{maxAge}), and {interests.length} interest clusters.
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-violet-500/20 text-xs font-bold text-violet-600 dark:text-violet-400">
              High Reach Potential
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => setStep(5)}
              disabled={!canProceedStep(4)}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-violet-600/25 hover:bg-violet-500 active:scale-95 transition-all disabled:opacity-50"
            >
              <span>Continue to Plan & Duration</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 5: PLAN & DURATION */}
      {/* ======================================================== */}
      {step === 5 && (
        <div className="rounded-2xl border border-card bg-card p-6 sm:p-8 space-y-6 shadow-sm transition-colors">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Choose Your Advertising Plan & Duration
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Select your fixed advertising package and launch schedule. Every plan has one fixed price for the entire duration — not a daily budget.
            </p>
          </div>

          {/* Package Selection Cards */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Select Advertising Package
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {CAMPAIGN_PACKAGES.map((pkg) => {
                const isSelected = selectedPackageId === pkg.id || selectedPackageId === pkg.alias;
                return (
                  <div
                    key={pkg.id}
                    onClick={() => setSelectedPackageId(pkg.id)}
                    className={`relative rounded-2xl p-5 border-2 cursor-pointer transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-violet-600 bg-violet-600/5 shadow-md shadow-violet-600/10'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    {pkg.popular && (
                      <span className="absolute -top-3 right-4 px-2.5 py-0.5 rounded-full bg-violet-600 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-sm">
                        Most Popular
                      </span>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h3 className="font-extrabold text-sm text-slate-900 dark:text-white">
                          {pkg.name}
                        </h3>
                        <div
                          className={`h-4 w-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected
                              ? 'border-violet-600 bg-violet-600'
                              : 'border-slate-300 dark:border-slate-600'
                          }`}
                        >
                          {isSelected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </div>
                      </div>

                      <div>
                        <div className="flex items-baseline gap-1">
                          <span className="text-2xl font-black text-slate-900 dark:text-white">
                            ₹{pkg.price}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400">
                            total
                          </span>
                        </div>
                        <span className="inline-block mt-0.5 text-xs font-bold text-violet-600 dark:text-violet-400">
                          {pkg.durationDays} Days Active Run
                        </span>
                        <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                          {pkg.tagline}
                        </p>
                      </div>

                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5">
                        {pkg.features.map((feat, fIdx) => (
                          <div key={fIdx} className="flex items-start gap-1.5 text-[11px] text-slate-600 dark:text-slate-400">
                            <Check className="h-3 w-3 text-emerald-500 shrink-0 mt-0.5" />
                            <span>{feat}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                      <span className={`block text-center text-xs font-bold py-1.5 rounded-xl transition-all ${
                        isSelected
                          ? 'bg-violet-600 text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                      }`}>
                        {isSelected ? 'Selected' : 'Select Plan'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Schedule Dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Campaign Start Date
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 py-2.5 pl-10 pr-3 text-xs text-slate-900 dark:text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Calculated End Date ({selectedPackage.durationDays} Days Duration)
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  readOnly
                  value={computedEndDate}
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900/60 py-2.5 pl-10 pr-3 text-xs text-slate-700 dark:text-slate-300 cursor-not-allowed font-medium"
                />
              </div>
            </div>
          </div>

          {/* Fixed Price Breakdown Card */}
          <div className="rounded-2xl border border-violet-500/30 bg-violet-500/5 dark:bg-violet-950/20 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-extrabold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                <span>Fixed All-Inclusive Package Pricing</span>
              </h4>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold">
                No Daily Budget Multiplier
              </span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Selected Package:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedPackage.name}</span>
              </div>
              <div className="flex justify-between">
                <span>Campaign Duration:</span>
                <span className="font-semibold text-slate-900 dark:text-white">{selectedPackage.durationDays} Days ({startDate} to {computedEndDate})</span>
              </div>
              <div className="flex justify-between">
                <span>Targeting & Location Cost:</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Included (₹0 additional)</span>
              </div>
              <div className="pt-2 border-t border-violet-500/20 flex justify-between text-sm font-extrabold text-slate-900 dark:text-white">
                <span>Final Customer Payable Price:</span>
                <span className="text-base text-violet-600 dark:text-violet-400">₹{finalPrice.toLocaleString('en-IN')}</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 italic">
              * The package price remains exactly ₹{finalPrice} across plan selection, review, checkout, and campaign records. Selecting any Indian state or modifying targeting does not change this price.
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={() => setStep(6)}
              disabled={!canProceedStep(5)}
              className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-violet-600/25 hover:bg-violet-500 active:scale-95 transition-all disabled:opacity-50"
            >
              <span>Review Campaign & Checkout</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 6: REVIEW SCREEN & WALLET CHECKOUT */}
      {/* ======================================================== */}
      {step === 6 && (
        <div className="rounded-2xl border border-card bg-card p-6 sm:p-8 space-y-6 shadow-sm transition-colors">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Review Campaign & Final Checkout
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Confirm your creative, targeting, fixed package price, and complete payment via SMAP Wallet.
            </p>
          </div>

          {checkoutError && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{checkoutError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Box 1: Creative & Copy */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-white dark:bg-slate-900/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Ad Creative & Copy
              </span>
              <div className="flex gap-3">
                {creativeType === 'video' ? (
                  <div className="relative h-16 w-16 rounded-xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700 flex-shrink-0 flex items-center justify-center">
                    <video src={creativeUrl} className="h-full w-full object-cover" muted playsInline />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <Play className="h-5 w-5 text-white drop-shadow" />
                    </div>
                  </div>
                ) : (
                  <img
                    src={creativeUrl}
                    alt="Creative"
                    className="h-16 w-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=800&auto=format&fit=crop&q=80';
                    }}
                  />
                )}
                <div className="overflow-hidden">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate">
                    {headline}
                  </h4>
                  <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                    {primaryText}
                  </p>
                  <span className="inline-block mt-1 text-[10px] font-semibold text-violet-600 dark:text-violet-400">
                    CTA: {CTA_OPTIONS.find((c) => c.value === callToAction)?.label}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between">
                <span>Destination:</span>
                <span className="font-medium text-slate-700 dark:text-slate-300 truncate max-w-[200px]">
                  {destinationUrl}
                </span>
              </div>
            </div>

            {/* Box 2: Objective & Placements */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-3 bg-white dark:bg-slate-900/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Objective & Placements
              </span>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Objective:</span>
                <span className="font-bold text-xs text-violet-600 dark:text-violet-400">
                  {OBJECTIVES.find((o) => o.key === objective)?.title} ({OBJECTIVES.find((o) => o.key === objective)?.metaOutcome})
                </span>
              </div>
              <div>
                <span className="text-xs text-slate-500 block mb-1">Active Placements:</span>
                <div className="flex flex-wrap gap-1">
                  {selectedPlacements.map((p) => (
                    <span
                      key={p}
                      className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-semibold text-slate-700 dark:text-slate-300"
                    >
                      {PLACEMENTS_LIST.find((pl) => pl.key === p)?.title}
                    </span>
                  ))}
                </div>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 flex justify-between">
                <span>Identities:</span>
                <span className="font-medium text-emerald-600 dark:text-emerald-400">
                  Sahil Gupta (FB) + @ravi105065 (IG)
                </span>
              </div>
            </div>

            {/* Box 3: Audience */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 bg-white dark:bg-slate-900/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Target Audience
              </span>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Location:</span>
                <span className="font-semibold text-slate-900 dark:text-white truncate max-w-[200px]">
                  {isAllIndia ? 'All India (Pan-India)' : selectedLocations.join(', ')}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Demographics:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  Age {minAge}–{maxAge} • Gender: {gender}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Est. Audience:</span>
                <span className="font-bold text-violet-600 dark:text-violet-400">
                  {estimatedReach}
                </span>
              </div>
            </div>

            {/* Box 4: Package & Payable Amount */}
            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 p-4 space-y-2 bg-white dark:bg-slate-900/50">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Selected Package & Balance
              </span>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Package Plan:</span>
                <span className="font-bold text-slate-900 dark:text-white">{selectedPackage.name}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Package Duration:</span>
                <span className="font-semibold text-slate-900 dark:text-white">
                  {durationDays} Days ({startDate} to {computedEndDate})
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-slate-500">Final Payable Amount:</span>
                <span className="font-black text-violet-600 dark:text-violet-400 text-sm">
                  ₹{finalPrice.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between text-xs font-semibold">
                <span className="text-slate-500 flex items-center gap-1">
                  <Wallet className="h-3.5 w-3.5 text-violet-500" />
                  Available SMAP Wallet Balance:
                </span>
                <span className={`font-bold ${walletBalance >= finalPrice ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-600 dark:text-amber-400'}`}>
                  ₹{walletBalance.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Real Meta Advertising Billing Note */}
          <div className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 space-y-1.5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                Meta Advertising Account & Billing Notice
              </h4>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              The package price of <strong>₹{finalPrice}</strong> covers SMAP campaign management, audience setup, and Meta Marketing API orchestration. Campaign delivery is orchestrated through SMAP managed delivery assets (Facebook Page: <strong>Sahil Gupta</strong> & Instagram: <strong>@ravi105065</strong>) via connected Ad Account (<code>act_1627260695520511</code>). Meta Developer App is currently in Development Mode (live delivery to public requires Meta App Review for ads_management).
            </p>
          </div>

          {/* Checkout & Payment Action Box */}
          {walletBalance >= finalPrice ? (
            /* Sufficient Wallet Balance Flow */
            <div className="p-4 sm:p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/5 dark:bg-emerald-950/20 space-y-3">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                <div>
                  <h4 className="font-bold text-xs text-emerald-700 dark:text-emerald-400">
                    Sufficient SMAP Wallet Balance Available
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Your available balance of <strong>₹{walletBalance.toFixed(2)}</strong> is sufficient to pay the exact fixed package price of <strong>₹{finalPrice}</strong>.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            /* Insufficient Wallet Balance Flow */
            <div className="p-4 sm:p-5 rounded-2xl border border-amber-500/30 bg-amber-500/5 dark:bg-amber-950/20 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-xs text-amber-700 dark:text-amber-400">
                    Insufficient SMAP Wallet Balance
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400">
                    Fixed Package Price: <strong>₹{finalPrice}</strong> • Available Balance: <strong>₹{walletBalance.toFixed(2)}</strong> • Remaining Amount Required: <strong className="text-amber-600 dark:text-amber-400">₹{(finalPrice - walletBalance).toFixed(2)}</strong>.
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    Add the required funds using Razorpay UPI to complete your campaign order.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddFundsModal(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-4 py-2 text-xs font-bold text-white shadow-md shadow-violet-600/25 hover:bg-violet-500 active:scale-95 transition-all"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add ₹{Math.max(1, Math.ceil(finalPrice - walletBalance))} via Razorpay UPI</span>
                </button>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setStep(5)}
              disabled={isPlacingOrder}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>

            {walletBalance >= finalPrice ? (
              <button
                type="button"
                onClick={handlePlaceOrder}
                disabled={isPlacingOrder}
                className="inline-flex items-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-violet-600/25 hover:bg-violet-500 active:scale-95 transition-all disabled:opacity-50"
              >
                {isPlacingOrder ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    <span>Deducting Wallet & Activating Meta...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Pay ₹{finalPrice} from Wallet & Place Order</span>
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddFundsModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-amber-600 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-amber-600/25 hover:bg-amber-500 active:scale-95 transition-all"
              >
                <Plus className="h-4 w-4" />
                <span>Add ₹{Math.max(1, Math.ceil(finalPrice - walletBalance))} to Place Order</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* STEP 7: ORDER CONFIRMED & META ACTIVATION REPORT VIEW */}
      {/* ======================================================== */}
      {step === 7 && completedOrder && (
        <div className="rounded-2xl border border-card bg-card p-6 sm:p-8 space-y-6 shadow-sm transition-colors animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center space-y-2 py-4">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 ring-8 ring-emerald-500/5 mb-1">
              <CheckCircle2 className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Campaign Order Placed Successfully!
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
              Your fixed package price of ₹{finalPrice} has been deducted from your SMAP Wallet, and your order is confirmed.
            </p>
          </div>

          {/* Details Table */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900/50 overflow-hidden text-xs">
            <div className="p-3.5 flex justify-between items-center">
              <span className="text-slate-500">SMAP Campaign ID</span>
              <span className="font-mono font-bold text-slate-900 dark:text-white">
                {completedOrder.campaign?.id}
              </span>
            </div>

            <div className="p-3.5 flex justify-between items-center">
              <span className="text-slate-500">Package & Duration</span>
              <span className="font-bold text-slate-900 dark:text-white">
                {selectedPackage.name} • {selectedPackage.durationDays} Days
              </span>
            </div>

            <div className="p-3.5 flex justify-between items-center">
              <span className="text-slate-500">Amount Paid (Wallet Deduction)</span>
              <span className="font-extrabold text-emerald-600 dark:text-emerald-400">
                ₹{finalPrice.toFixed(2)} (PAID)
              </span>
            </div>

            {completedOrder.walletTransaction?.id && (
              <div className="p-3.5 flex justify-between items-center">
                <span className="text-slate-500">Wallet Transaction ID</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  {completedOrder.walletTransaction.id}
                </span>
              </div>
            )}

            <div className="p-3.5 flex justify-between items-center">
              <span className="text-slate-500">Remaining Wallet Balance</span>
              <span className="font-bold text-slate-900 dark:text-white">
                ₹{walletBalance.toFixed(2)}
              </span>
            </div>

            <div className="p-3.5 flex justify-between items-center">
              <span className="text-slate-500">Meta Campaign ID</span>
              <span className="font-mono font-bold text-violet-600 dark:text-violet-400">
                {completedOrder.campaign?.meta_campaign_id || completedOrder.metaResult?.meta_campaign_id || 'Submitted to Meta'}
              </span>
            </div>

            <div className="p-3.5 flex justify-between items-center">
              <span className="text-slate-500">Delivery Status</span>
              <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${
                completedOrder.campaign?.status === 'ACTIVE'
                  ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
                  : completedOrder.campaign?.status === 'UNDER_REVIEW'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  : completedOrder.campaign?.status === 'FAILED'
                  ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20'
                  : 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20'
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${
                  completedOrder.campaign?.status === 'ACTIVE'
                    ? 'bg-emerald-500'
                    : completedOrder.campaign?.status === 'FAILED'
                    ? 'bg-red-500'
                    : 'bg-amber-500'
                }`} />
                {completedOrder.campaign?.status === 'ACTIVE'
                  ? 'ACTIVE (Delivering)'
                  : completedOrder.campaign?.status === 'UNDER_REVIEW'
                  ? 'UNDER REVIEW (Meta Review Cycle)'
                  : completedOrder.campaign?.status === 'FAILED'
                  ? 'FAILED (Meta Configuration / Billing Notice)'
                  : 'PAYMENT CONFIRMED (Pending Meta Activation)'}
              </span>
            </div>

            <div className="p-3.5 flex justify-between items-center">
              <span className="text-slate-500">Attached Identities</span>
              <span className="font-medium text-slate-700 dark:text-slate-300">
                Facebook Page: Sahil Gupta • Instagram: @ravi105065
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-[11px] text-slate-500 leading-relaxed space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-700 dark:text-slate-300">
              <Info className="h-3.5 w-3.5 text-violet-500" />
              <span>Activation Status Note:</span>
            </div>
            <p>
              {completedOrder.campaign?.meta_status_message ||
                'Your payment is confirmed and recorded in SMAP. Campaign delivery proceeds according to Meta review standards and ad account billing policies.'}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => onCampaignCreated(completedOrder.campaign.id)}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-violet-600 px-6 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-violet-600/25 hover:bg-violet-500 active:scale-95 transition-all"
            >
              <span>View in My Campaigns</span>
              <ArrowRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                setCompletedOrder(null);
                setStep(1);
              }}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-5 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
            >
              <span>Create Another Campaign</span>
            </button>
          </div>
        </div>
      )}

      {/* Add Funds Modal */}
      <AddFundsModal
        isOpen={showAddFundsModal}
        onClose={() => setShowAddFundsModal(false)}
        currentBalance={walletBalance}
        recommendedAmount={Math.max(1, Math.ceil(finalPrice - walletBalance))}
        onSuccess={(newBal) => {
          setWalletBalance(newBal);
          setShowAddFundsModal(false);
        }}
      />
    </div>
  );
};
