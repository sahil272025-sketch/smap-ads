import { db, Campaign, CampaignStatus, CampaignTargeting, Package } from './db.js';
import { MetaService } from './metaService.js';
import { PaymentService } from './paymentService.js';

export class CampaignService {
  public static async createDraft(userId: string, data: {
    packageId?: string;
    objective?: 'AWARENESS' | 'TRAFFIC' | 'ENGAGEMENT' | 'LEADS' | 'SALES';
    creativeUrl: string;
    creativeType?: 'image' | 'video';
    businessName: string;
    primaryText: string;
    headline: string;
    description?: string;
    callToAction?: string;
    destinationType?: 'website' | 'whatsapp' | 'facebook_page' | 'instagram_profile';
    destinationUrl: string;
    placements?: Array<'facebook_feed' | 'instagram_feed' | 'instagram_stories' | 'instagram_reels'>;
    targeting?: CampaignTargeting;
    dailyBudget?: number;
    durationDays?: number;
    startDate?: string;
    endDate?: string;
    syncToMeta?: boolean;
    status?: CampaignStatus;
  }): Promise<{ campaign: Campaign; payment?: any; metaResult?: any }> {
    // Validate required fields
    if (!data.businessName || !data.headline || !data.primaryText || !data.destinationUrl) {
      throw new Error('Required campaign fields missing: Business name, headline, primary text, and destination URL');
    }

    const destinationType = data.destinationType || 'website';
    const destinationUrl = data.destinationUrl.trim();

    // Validate destination based on type
    if (destinationType === 'website') {
      try {
        const u = new URL(destinationUrl);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') {
          throw new Error('Website URL must start with http:// or https://');
        }
      } catch {
        throw new Error('Please enter a valid website URL (e.g. https://yourbusiness.com)');
      }
    } else if (destinationType === 'whatsapp') {
      const cleanPhone = destinationUrl.replace(/[^0-9]/g, '');
      if (cleanPhone.length < 10) {
        throw new Error('Please enter a valid WhatsApp phone number with country code');
      }
    }

    const now = new Date().toISOString();
    const campaignId = `smap_cmp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Fixed package price and duration calculation (NEVER dailyBudget * durationDays)
    const pkg = data.packageId ? db.findPackageById(data.packageId) : undefined;
    const finalPrice = pkg ? pkg.price : (data.dailyBudget ? Math.round(Number(data.dailyBudget)) : 200);
    const durationDays = pkg ? pkg.duration_days : (data.durationDays ? Math.max(1, Math.round(Number(data.durationDays))) : 5);
    const totalBudget = finalPrice;
    const dailyBudget = Math.round(totalBudget / durationDays);

    const startDate = data.startDate || now;
    const parsedStart = new Date(startDate);
    const endDate = data.endDate || new Date(parsedStart.getTime() + durationDays * 24 * 3600 * 1000).toISOString();

    const placements: Array<'facebook_feed' | 'instagram_feed' | 'instagram_stories' | 'instagram_reels'> =
      data.placements && data.placements.length > 0
        ? data.placements
        : ['facebook_feed', 'instagram_feed', 'instagram_stories', 'instagram_reels'];

    const targeting: CampaignTargeting = {
      country: data.targeting?.country || 'IN',
      state: data.targeting?.state || 'All States',
      city: data.targeting?.city || 'All Cities',
      min_age: data.targeting?.min_age || 18,
      max_age: data.targeting?.max_age || 65,
      gender: data.targeting?.gender || 'ALL',
      interests: data.targeting?.interests || ['Online Shopping', 'Small Business'],
      locations: data.targeting?.locations || ['All India'],
      estimated_audience_size: data.targeting?.estimated_audience_size || '18M - 24M people',
    };

    const campaignStatus: CampaignStatus = data.status || 'DRAFT';

    const campaign: Campaign = {
      id: campaignId,
      user_id: userId,
      package_id: data.packageId || 'custom_campaign',
      objective: data.objective || 'TRAFFIC',
      creative_url: data.creativeUrl,
      creative_type: data.creativeType || 'image',
      business_name: data.businessName.trim(),
      primary_text: data.primaryText.trim(),
      headline: data.headline.trim(),
      description: data.description ? data.description.trim() : '',
      call_to_action: data.callToAction || 'LEARN_MORE',
      destination_type: destinationType,
      destination_url: destinationUrl,
      placements,
      targeting,
      daily_budget: dailyBudget,
      duration_days: durationDays,
      total_budget: totalBudget,
      start_at: startDate,
      end_at: endDate,
      status: campaignStatus,
      meta_campaign_id: null,
      meta_adset_id: null,
      meta_creative_id: null,
      meta_ad_id: null,
      meta_account_id: 'act_1627260695520511',
      meta_status_message: 'Draft campaign created safely. Non-delivering, ₹0 spend.',
      rejection_reason: null,
      error_details: null,
      created_at: now,
      updated_at: now,
    };

    // Safely sync to Meta as a PAUSED non-delivering draft if requested (default true)
    let metaResult: any = null;
    const shouldSyncMeta = data.syncToMeta !== false;

    if (shouldSyncMeta) {
      try {
        const userConn = db.findMetaConnectionByUserId(userId);
        metaResult = await MetaService.createDraftCampaignInMeta(campaign, userConn);
        if (metaResult.success) {
          campaign.meta_campaign_id = metaResult.meta_campaign_id || null;
          campaign.meta_adset_id = metaResult.meta_adset_id || null;
          campaign.meta_creative_id = metaResult.meta_creative_id || null;
          campaign.meta_ad_id = metaResult.meta_ad_id || null;
          campaign.meta_status_message = metaResult.notes || 'Meta draft campaign created in PAUSED status.';
        } else {
          campaign.meta_status_message = metaResult.notes || 'Meta draft sync notice: paused test mode.';
        }
      } catch (err: any) {
        db.log('CAMPAIGN', 'WARN', `Non-blocking Meta draft sync notice: ${err?.message}`);
        campaign.meta_status_message = `Draft saved locally: ${err?.message}`;
      }
    }

    db.createCampaign(campaign);

    db.log('CAMPAIGN', 'INFO', `Created campaign draft ${campaign.id} for user ${userId}`, {
      campaignId: campaign.id,
      objective: campaign.objective,
      metaCampaignId: campaign.meta_campaign_id,
      metaAdsetId: campaign.meta_adset_id,
      dailyBudget,
      durationDays,
      totalBudget,
      status: campaign.status,
    });

    return { campaign, metaResult };
  }

  public static async submitToMeta(campaignId: string, userId: string) {
    const campaign = db.findCampaignById(campaignId);
    if (!campaign) throw new Error('Campaign not found');
    if (campaign.user_id !== userId) throw new Error('Unauthorized');

    const payment = db.findPaymentByCampaignId(campaignId);
    if (!payment || payment.status !== 'PAID') {
      throw new Error('Payment must be verified as PAID before submitting to Meta.');
    }

    const connection = db.findMetaConnectionByUserId(userId);
    if (!connection) {
      db.updateCampaign(campaignId, { status: 'META_NOT_CONNECTED' });
      throw new Error('Meta account not connected. Please connect your Meta advertising account via OAuth.');
    }

    // Set status to SUBMITTING
    db.updateCampaign(campaignId, { status: 'SUBMITTING' });

    // Compute start_at and end_at based on package duration
    const pkg = db.findPackageById(campaign.package_id);
    const durationDays = pkg ? pkg.duration_days : 5;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 3600 * 1000);

    const result = await MetaService.submitCampaignToMeta(campaign, connection);

    if (result.success) {
      const updated = db.updateCampaign(campaignId, {
        status: result.status,
        meta_campaign_id: result.meta_campaign_id || null,
        meta_adset_id: result.meta_adset_id || null,
        meta_creative_id: result.meta_creative_id || null,
        meta_ad_id: result.meta_ad_id || null,
        start_at: startDate.toISOString(),
        end_at: endDate.toISOString(),
        meta_status_message: 'Campaign submitted to Meta. Currently in Meta review process.',
      });

      db.log('CAMPAIGN', 'INFO', `Campaign ${campaignId} submitted to Meta: ${result.meta_campaign_id}`);
      return updated!;
    } else {
      const updated = db.updateCampaign(campaignId, {
        status: 'FAILED',
        error_details: result.error || 'Meta campaign submission failed',
        meta_status_message: result.error,
      });

      db.log('CAMPAIGN', 'ERROR', `Campaign ${campaignId} Meta submission failed: ${result.error}`);
      return updated!;
    }
  }

  public static async getCampaignWithMetaMetrics(campaignId: string, userId?: string) {
    let campaign = db.findCampaignById(campaignId);
    if (!campaign) throw new Error('Campaign not found');
    if (userId && campaign.user_id !== userId) throw new Error('Unauthorized');

    // Live reconciliation with Meta Marketing API
    const connection = db.findMetaConnectionByUserId(campaign.user_id);
    campaign = await MetaService.reconcileCampaignStatus(campaign, connection);

    const pkg = db.findPackageById(campaign.package_id);
    const payment = db.findPaymentByCampaignId(campaignId);
    const insights = await MetaService.getCampaignInsights(campaign);

    return {
      campaign,
      package: pkg,
      payment,
      insights,
    };
  }

  /**
   * Atomic campaign checkout with customer wallet balance.
   * Validates package, fixed pricing, duration, targeting, and wallet balance server-side.
   * Performs atomic deduction and strictly advances campaign to paid/submitting status.
   */
  public static async checkoutWithWallet(userId: string, data: {
    packageId: string;
    objective?: 'AWARENESS' | 'TRAFFIC' | 'ENGAGEMENT' | 'LEADS' | 'SALES';
    creativeUrl: string;
    creativeType?: 'image' | 'video';
    businessName: string;
    primaryText: string;
    headline: string;
    description?: string;
    callToAction?: string;
    destinationType?: 'website' | 'whatsapp' | 'facebook_page' | 'instagram_profile';
    destinationUrl: string;
    placements?: Array<'facebook_feed' | 'instagram_feed' | 'instagram_stories' | 'instagram_reels'>;
    targeting?: CampaignTargeting;
    startDate?: string;
    idempotencyKey?: string;
  }): Promise<{
    success: boolean;
    campaign: Campaign;
    payment: any;
    walletTransaction: any;
    newBalance: number;
    metaResult?: any;
    metaSubmissionStatus: string;
  }> {
    const user = db.findUserById(userId);
    if (!user) throw new Error('User not found');

    if (!data.packageId) {
      throw new Error('Package ID is required');
    }

    const pkg = db.findPackageById(data.packageId);
    if (!pkg) {
      throw new Error(`Package not found for ID or alias: ${data.packageId}`);
    }

    // Fixed package price and duration - NEVER dailyBudget * durationDays
    const finalPackagePrice = pkg.price;
    const durationDays = pkg.duration_days;
    const dailyBudget = Math.round(finalPackagePrice / durationDays);

    // Validate campaign inputs
    if (!data.businessName?.trim() || !data.headline?.trim() || !data.primaryText?.trim() || !data.destinationUrl?.trim()) {
      throw new Error('Required campaign fields missing: Business name, headline, primary text, and destination URL');
    }

    const destinationType = data.destinationType || 'website';
    const destinationUrl = data.destinationUrl.trim();

    if (destinationType === 'website') {
      try {
        const u = new URL(destinationUrl);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') {
          throw new Error('Website URL must start with http:// or https://');
        }
      } catch {
        throw new Error('Please enter a valid website URL (e.g. https://yourbusiness.com)');
      }
    } else if (destinationType === 'whatsapp') {
      const cleanPhone = destinationUrl.replace(/[^0-9]/g, '');
      if (cleanPhone.length < 10) {
        throw new Error('Please enter a valid WhatsApp phone number with country code');
      }
    }

    // Idempotency check: if user already placed this order with the same idempotency key
    if (data.idempotencyKey) {
      const existingCampaign = db.getCampaigns(userId).find((c: any) => c.idempotency_key === data.idempotencyKey);
      if (existingCampaign) {
        const payment = db.findPaymentByCampaignId(existingCampaign.id);
        const currentBalance = db.getWalletBalance(userId);
        const lastTx = db.getWalletTransactions(userId).find((t) => t.campaign_id === existingCampaign.id);
        return {
          success: true,
          campaign: existingCampaign,
          payment: payment || ({} as any),
          walletTransaction: lastTx || ({} as any),
          newBalance: currentBalance,
          metaSubmissionStatus: existingCampaign.status,
        };
      }
    }

    // Balance check
    const currentBalance = db.getWalletBalance(userId);
    if (currentBalance < finalPackagePrice) {
      const remaining = Math.round((finalPackagePrice - currentBalance) * 100) / 100;
      throw new Error(`Insufficient wallet balance. Available: ₹${currentBalance.toFixed(2)}, Required: ₹${finalPackagePrice.toFixed(2)}, Remaining: ₹${remaining.toFixed(2)}. Please add funds via UPI to continue.`);
    }

    const now = new Date().toISOString();
    const campaignId = `smap_cmp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const paymentId = `smap_pay_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    // Atomically deduct from customer wallet
    const deductRes = db.deductWallet(userId, finalPackagePrice, {
      description: `Campaign Payment: ${pkg.name} (${data.businessName || data.headline})`,
      campaignId,
    });

    // Create payment record marked as PAID
    const payment = {
      id: paymentId,
      user_id: userId,
      campaign_id: campaignId,
      package_id: pkg.id,
      amount: finalPackagePrice,
      currency: 'INR' as const,
      payment_method: 'UPI' as const,
      payee_upi: 'sahil-stp@ybl',
      upi_intent_url: '',
      transaction_reference: deductRes.transaction.id,
      gateway_payment_id: null,
      gateway_order_id: null,
      gateway_key_id: null,
      status: 'PAID' as const,
      webhook_status: 'PROCESSED' as const,
      failure_reason: null,
      idempotency_key: data.idempotencyKey || null,
      paid_at: now,
      verified_at: now,
      verification_source: 'WALLET_BALANCE' as const,
      notes: `Verified payment of ₹${finalPackagePrice} deducted from SMAP Wallet (${deductRes.transaction.id})`,
      created_at: now,
      updated_at: now,
    };
    db.createPayment(payment);

    // Compute campaign schedule
    const startDate = data.startDate || now;
    const parsedStart = new Date(startDate);
    const endDate = new Date(parsedStart.getTime() + durationDays * 24 * 3600 * 1000).toISOString();

    const placements: Array<'facebook_feed' | 'instagram_feed' | 'instagram_stories' | 'instagram_reels'> =
      data.placements && data.placements.length > 0
        ? data.placements
        : ['facebook_feed', 'instagram_feed', 'instagram_stories', 'instagram_reels'];

    const targeting: CampaignTargeting = {
      country: data.targeting?.country || 'IN',
      state: data.targeting?.state || 'All States',
      city: data.targeting?.city || 'All Cities',
      min_age: data.targeting?.min_age || 18,
      max_age: data.targeting?.max_age || 65,
      gender: data.targeting?.gender || 'ALL',
      interests: data.targeting?.interests || ['Online Shopping', 'Small Business'],
      locations: data.targeting?.locations || ['All India'],
      estimated_audience_size: data.targeting?.estimated_audience_size || '18M - 24M people',
    };

    const campaign: Campaign & { idempotency_key?: string } = {
      id: campaignId,
      user_id: userId,
      package_id: pkg.id,
      objective: data.objective || 'TRAFFIC',
      creative_url: data.creativeUrl,
      creative_type: data.creativeType || 'image',
      business_name: data.businessName.trim(),
      primary_text: data.primaryText.trim(),
      headline: data.headline.trim(),
      description: data.description ? data.description.trim() : '',
      call_to_action: data.callToAction || 'LEARN_MORE',
      destination_type: destinationType,
      destination_url: destinationUrl,
      placements,
      targeting,
      daily_budget: dailyBudget,
      duration_days: durationDays,
      total_budget: finalPackagePrice,
      start_at: startDate,
      end_at: endDate,
      status: 'PAYMENT_CONFIRMED',
      meta_campaign_id: null,
      meta_adset_id: null,
      meta_creative_id: null,
      meta_ad_id: null,
      meta_account_id: 'act_1627260695520511',
      meta_status_message: 'Payment verified via SMAP Wallet. Submitting campaign to Meta Marketing API...',
      rejection_reason: null,
      error_details: null,
      created_at: now,
      updated_at: now,
      idempotency_key: data.idempotencyKey || undefined,
    };

    db.createCampaign(campaign as Campaign);

    // Meta Activation Flow
    let metaResult: any = null;
    let metaSubmissionStatus = 'PAYMENT_CONFIRMED';
    try {
      const metaConn = db.findMetaConnectionByUserId(userId);
      const submitRes = await MetaService.submitCampaignToMeta(campaign as Campaign, metaConn);
      metaResult = submitRes;
      if (submitRes.success) {
        metaSubmissionStatus = submitRes.status; // 'UNDER_REVIEW' or 'ACTIVE'
        db.updateCampaign(campaignId, {
          status: submitRes.status,
          meta_campaign_id: submitRes.meta_campaign_id || null,
          meta_adset_id: submitRes.meta_adset_id || null,
          meta_creative_id: submitRes.meta_creative_id || null,
          meta_ad_id: submitRes.meta_ad_id || null,
          meta_status_message: 'Campaign registered with Meta Marketing API. In standard review cycle.',
        });
      } else {
        // Honest error reporting - NEVER report success or UNDER_REVIEW when Meta rejected or failed!
        metaSubmissionStatus = 'FAILED';
        db.updateCampaign(campaignId, {
          status: 'FAILED',
          error_details: submitRes.error || 'Meta campaign submission notice',
          meta_status_message: submitRes.error || 'Meta creative or ad creation rejected.',
          rejection_reason: submitRes.error || 'Meta API rejected campaign creative/ad creation.',
        });
      }
    } catch (err: any) {
      metaSubmissionStatus = 'FAILED';
      db.updateCampaign(campaignId, {
        status: 'FAILED',
        error_details: err?.message,
        meta_status_message: `Meta activation failed: ${err?.message}`,
        rejection_reason: err?.message,
      });
    }

    const finalUpdatedCampaign = db.findCampaignById(campaignId)!;
    return {
      success: true,
      campaign: finalUpdatedCampaign,
      payment,
      walletTransaction: deductRes.transaction,
      newBalance: deductRes.newBalance,
      metaResult,
      metaSubmissionStatus,
    };
  }
}
