export interface User {
  id: string;
  google_sub: string;
  name: string;
  email: string;
  email_verified: boolean;
  profile_picture: string | null;
  phone?: string;
  role: 'customer' | 'admin';
  status: 'ACTIVE' | 'SUSPENDED';
  created_at: string;
  last_login_at: string;
}

export interface GoogleConfigStatus {
  isConfigured: boolean;
  clientId: string | null;
  clientIdMasked: string | null;
  redirectUri: string;
  hasClientSecret: boolean;
  hasRedirectWarning?: boolean;
  isDevEnvironment?: boolean;
  statusMessage: string;
}

export interface Package {
  id: string;
  name: string;
  price: number;
  duration_days: number;
  platforms: string[];
  features: string[];
  active: boolean;
  is_popular?: boolean;
}

export type CampaignStatus = 
  | 'DRAFT'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_CONFIRMED'
  | 'META_NOT_CONNECTED'
  | 'SUBMITTING'
  | 'UNDER_REVIEW'
  | 'ACTIVE'
  | 'PAUSED'
  | 'COMPLETED'
  | 'REJECTED'
  | 'FAILED';

export interface CampaignTargeting {
  country: string;
  state: string;
  city: string;
  min_age: number;
  max_age: number;
  gender: 'ALL' | 'MEN' | 'WOMEN';
  interests: string[];
}

export interface Campaign {
  id: string;
  user_id: string;
  package_id: string;
  creative_url: string;
  creative_type: 'image' | 'video';
  business_name: string;
  primary_text: string;
  headline: string;
  description: string;
  destination_type: 'website' | 'whatsapp' | 'facebook_page' | 'instagram_profile';
  destination_url: string;
  targeting: CampaignTargeting;
  start_at: string | null;
  end_at: string | null;
  status: CampaignStatus;
  meta_campaign_id: string | null;
  meta_adset_id: string | null;
  meta_creative_id: string | null;
  meta_ad_id: string | null;
  meta_account_id: string | null;
  meta_status_message: string | null;
  rejection_reason: string | null;
  error_details: string | null;
  created_at: string;
  updated_at: string;
}

export type PaymentStatus = 
  | 'PENDING'
  | 'VERIFICATION_PENDING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUND_PENDING'
  | 'REFUNDED';

export interface Payment {
  id: string;
  user_id: string;
  campaign_id: string;
  package_id: string;
  amount: number;
  currency: 'INR';
  payment_method: 'UPI';
  payee_upi: string;
  upi_intent_url: string;
  transaction_reference: string | null; // UTR or customer reference
  gateway_payment_id: string | null;
  gateway_order_id: string | null;
  gateway_key_id?: string | null;
  status: PaymentStatus;
  webhook_status?: 'PENDING' | 'PROCESSED' | 'FAILED' | null;
  failure_reason?: string | null;
  idempotency_key?: string | null;
  paid_at?: string | null;
  verified_at: string | null;
  verification_source: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MetaConnectionState {
  connected: boolean;
  meta_user_name?: string;
  ad_accounts?: Array<{
    id: string;
    account_id: string;
    name: string;
    currency: string;
    account_status: number;
  }>;
  selected_ad_account_id?: string | null;
  expires_at?: string;
}

export interface MetaInsights {
  reach: number | null;
  impressions: number | null;
  clicks: number | null;
  spend: number | null;
  ctr: number | null;
  cpc: number | null;
  dataAvailable: boolean;
  notice: string;
}

export interface SupportTicketReply {
  id: string;
  sender: 'user' | 'admin';
  sender_name: string;
  message: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  user_name: string;
  user_email: string;
  campaign_id: string | null;
  subject: string;
  message: string;
  attachment_url: string | null;
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  created_at: string;
  updated_at: string;
  replies: SupportTicketReply[];
}

export interface SystemLog {
  id: string;
  category: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  details?: any;
  created_at: string;
}

export interface AdminStats {
  totalCustomers: number;
  totalCampaigns: number;
  activeCampaigns: number;
  pendingCampaigns: number;
  completedCampaigns: number;
  totalVerifiedPayments: number;
  totalRevenue: number;
}
