import { db, Campaign, CampaignStatus, CampaignTargeting, Package } from './db.js';
import { MetaService } from './metaService.js';
import { PaymentService } from './paymentService.js';
import { CampaignQueueService } from './campaignQueue.js';

export class CampaignService {
  public static async createDraft(userId: string, data: {
    packageId?: string;
    objective?: 'AWARENESS' | 'TRAFFIC' | 'ENGAGEMENT' | 'LEADS' | 'SALES';
    creativeUrl?: string;
    creativeType?: 'image' | 'video';
    businessName?: string;
    primaryText?: string;
    headline: string;
    description?: string;
    callToAction?: string;
    destinationType?: 'website' | 'whatsapp' | 'facebook_page' | 'instagram_profile' | 'instagram' | 'phone';
    destinationUrl?: string;
    phoneNumber?: string;
    phone_number?: string;
    phone?: string;
    placements?: Array<'facebook_feed' | 'instagram_feed' | 'instagram_stories' | 'instagram_reels'>;
    targeting?: CampaignTargeting;
    dailyBudget?: number;
    durationDays?: number;
    startDate?: string;
    endDate?: string;
    syncToMeta?: boolean;
    status?: CampaignStatus;
  }): Promise<{ campaign: Campaign; payment?: any; metaResult?: any }> {
    const user = db.findUserById(userId);
    const businessName = (data.businessName?.trim()) || user?.name || 'SMAP Verified Business';
    const headline = data.headline?.trim();
    if (!headline) {
      throw new Error('Heading (Headline) is required (max 100 characters)');
    }
    if (headline.length > 100) {
      throw new Error('Heading must be 100 characters or fewer');
    }
    const description = (data.description?.trim()) || '';
    if (description.length > 400) {
      throw new Error('Description must be 400 characters or fewer');
    }
    const primaryText = (data.primaryText?.trim()) || description || headline;
    const creativeUrl = data.creativeUrl || '/smap_hero_visual_1790756029679.jpg';
    const callToAction = data.callToAction || 'LEARN_MORE';

    const rawPhoneNumber = (data.phoneNumber || data.phone_number || data.phone)?.trim();
    let phoneNumber = rawPhoneNumber || undefined;
    if (callToAction === 'CALL_NOW') {
      const phoneDigits = (phoneNumber || data.destinationUrl || '').replace(/[^0-9]/g, '');
      if (phoneDigits.length < 10) {
        throw new Error('Call Now requires a valid contact phone number with at least 10 digits (e.g. +91 98765 43210)');
      }
      if (!phoneNumber && phoneDigits) {
        phoneNumber = data.destinationUrl?.startsWith('+') ? data.destinationUrl : `+91 ${phoneDigits}`;
      }
    } else if (phoneNumber) {
      const phoneDigits = phoneNumber.replace(/[^0-9]/g, '');
      if (phoneDigits.length < 10) {
        throw new Error('Please enter a valid contact phone number with at least 10 digits');
      }
    }

    let destinationType: 'website' | 'whatsapp' | 'facebook_page' | 'instagram_profile' | 'instagram' | 'phone' = data.destinationType || (callToAction === 'CALL_NOW' ? 'phone' : (callToAction === 'SEND_WHATSAPP_MESSAGE' ? 'whatsapp' : (callToAction === 'INSTAGRAM_MESSAGE' ? 'instagram' : 'website')));
    let destinationUrl = (data.destinationUrl?.trim()) || '';

    if (callToAction === 'CALL_NOW') {
      destinationType = 'phone';
      if (!destinationUrl) {
        destinationUrl = `tel:${phoneNumber}`;
      }
    } else if (callToAction === 'SEND_WHATSAPP_MESSAGE' || destinationType === 'whatsapp') {
      destinationType = 'whatsapp';
      const cleanPhone = (destinationUrl || phoneNumber || '').replace(/[^0-9]/g, '');
      if (cleanPhone.length < 10) {
        throw new Error('Please enter a valid WhatsApp phone number with country code (e.g. 919876543210)');
      }
      if (!destinationUrl.startsWith('http')) {
        destinationUrl = `https://wa.me/${cleanPhone}`;
      }
    } else if (callToAction === 'INSTAGRAM_MESSAGE' || destinationType === 'instagram_profile' || destinationType === 'instagram') {
      destinationType = data.destinationType === 'instagram_profile' ? 'instagram_profile' : 'instagram';
      if (!destinationUrl) {
        destinationUrl = 'https://instagram.com/smap';
      }
    } else {
      destinationType = 'website';
      if (!destinationUrl) {
        destinationUrl = 'https://smap-ads.onrender.com';
      }
      try {
        const u = new URL(destinationUrl);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') {
          throw new Error('Website URL must start with http:// or https://');
        }
      } catch {
        throw new Error('Please enter a valid website URL (e.g. https://yourbusiness.com)');
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
      creative_url: creativeUrl,
      creative_type: data.creativeType || 'image',
      business_name: businessName,
      primary_text: primaryText,
      headline: headline,
      description: description,
      call_to_action: callToAction,
      destination_type: destinationType,
      destination_url: destinationUrl,
      phone_number: phoneNumber,
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

    // Compute start_at and end_at based on package duration if not set
    const pkg = db.findPackageById(campaign.package_id);
    const durationDays = pkg ? pkg.duration_days : 5;
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + durationDays * 24 * 3600 * 1000);

    // Enqueue for resilient background worker execution
    const queueJob = CampaignQueueService.enqueue(campaignId);

    const updated = db.updateCampaign(campaignId, {
      status: 'SUBMITTING',
      queue_status: 'QUEUED',
      start_at: campaign.start_at || startDate.toISOString(),
      end_at: campaign.end_at || endDate.toISOString(),
      meta_status_message: 'Campaign safely queued for background worker submission to Meta Marketing API.',
    });

    db.log('CAMPAIGN', 'INFO', `Campaign ${campaignId} enqueued for Meta background submission (Job ${queueJob.jobId})`);
    return updated!;
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
   * Aggregates truthful campaign performance reports from Meta Marketing API insights.
   * Eliminates fabricated data and provides real totals, per-campaign metrics, and Meta latency disclosures.
   */
  public static async getPerformanceReports(userId?: string, forceRefresh = false) {
    const campaigns = db.getCampaigns(userId);

    // Sort campaigns with most recent first
    const sortedCampaigns = [...campaigns].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    let totalImpressions = 0;
    let totalReach = 0;
    let totalClicks = 0;
    let totalSpend = 0;
    let hasLiveMetrics = false;

    const campaignReports = await Promise.all(
      sortedCampaigns.map(async (c) => {
        const pkg = db.findPackageById(c.package_id);
        const insights = await MetaService.getCampaignInsights(c, forceRefresh);

        if (insights.dataAvailable) {
          hasLiveMetrics = true;
          totalImpressions += insights.impressions || 0;
          totalReach += insights.reach || 0;
          totalClicks += insights.clicks || 0;
          totalSpend += insights.spend || 0;
        }

        return {
          id: c.id,
          businessName: c.business_name,
          headline: c.headline,
          creativeUrl: c.creative_url,
          creativeType: c.creative_type,
          packageName: pkg?.name || 'Fixed Duration Package',
          packagePrice: pkg?.price || c.total_budget || 0,
          platforms: pkg?.platforms || ['Facebook', 'Instagram'],
          status: c.status,
          queueStatus: c.queue_status || null,
          metaCampaignId: c.meta_campaign_id,
          metaStatusMessage: c.meta_status_message,
          rejectionReason: c.rejection_reason,
          errorDetails: c.error_details,
          startAt: c.start_at,
          endAt: c.end_at,
          createdAt: c.created_at,
          insights,
          syncStatus: insights.syncStatus || 'NO_META_ID',
          lastSyncedAt: insights.lastSyncedAt || null,
        };
      })
    );

    const averageCtr = totalImpressions > 0
      ? Number(((totalClicks / totalImpressions) * 100).toFixed(2))
      : null;
    const averageCpc = totalClicks > 0
      ? Number((totalSpend / totalClicks).toFixed(2))
      : null;

    const activeCount = sortedCampaigns.filter(c => c.status === 'ACTIVE').length;
    const underReviewCount = sortedCampaigns.filter(c => c.status === 'UNDER_REVIEW' || c.status === 'PENDING_REVIEW').length;
    const queuedCount = sortedCampaigns.filter(c => c.status === 'QUEUED' || c.queue_status === 'QUEUED' || c.queue_status === 'PROCESSING').length;
    const completedCount = sortedCampaigns.filter(c => c.status === 'COMPLETED').length;
    const failedCount = sortedCampaigns.filter(c => c.status === 'FAILED').length;

    return {
      summary: {
        totalImpressions,
        totalReach,
        totalClicks,
        totalSpend,
        averageCtr,
        averageCpc,
        totalCampaigns: sortedCampaigns.length,
        activeCampaignsCount: activeCount,
        inReviewCount: underReviewCount,
        queuedCount,
        completedCount,
        failedCount,
        hasLiveMetrics,
      },
      campaigns: campaignReports,
      lastSyncedAt: new Date().toISOString(),
      disclosures: {
        impressionsVsReach: 'Impressions indicate the total count of times your ad was displayed on screen (which may include repeat views by the same person). Reach measures unique individual accounts who viewed your ad.',
        reportingLatency: 'Meta Marketing API updates metrics periodically in batches (typically 15 to 60 minutes). Very recent ad clicks or views may take up to an hour to appear in official reports.',
        reviewWindow: 'New ad creatives undergo standard Meta ad review within 24–48 hours before active delivery commences.',
      },
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
    creativeUrl?: string;
    creativeType?: 'image' | 'video';
    businessName?: string;
    primaryText?: string;
    headline: string;
    description?: string;
    callToAction?: string;
    destinationType?: 'website' | 'whatsapp' | 'facebook_page' | 'instagram_profile' | 'instagram' | 'phone';
    destinationUrl?: string;
    phoneNumber?: string;
    phone_number?: string;
    phone?: string;
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

    // Validate campaign inputs with safe existing defaults
    const businessName = (data.businessName?.trim()) || user.name || 'SMAP Verified Business';
    const headline = data.headline?.trim();
    if (!headline) {
      throw new Error('Heading (Headline) is required (max 100 characters)');
    }
    if (headline.length > 100) {
      throw new Error('Heading must be 100 characters or fewer');
    }
    const description = (data.description?.trim()) || '';
    if (description.length > 400) {
      throw new Error('Description must be 400 characters or fewer');
    }
    const primaryText = (data.primaryText?.trim()) || description || headline;
    const creativeUrl = data.creativeUrl || '/smap_hero_visual_1790756029679.jpg';
    const callToAction = data.callToAction || 'LEARN_MORE';

    const rawPhoneNumber = (data.phoneNumber || data.phone_number || data.phone)?.trim();
    let phoneNumber = rawPhoneNumber || undefined;
    if (callToAction === 'CALL_NOW') {
      const phoneDigits = (phoneNumber || data.destinationUrl || '').replace(/[^0-9]/g, '');
      if (phoneDigits.length < 10) {
        throw new Error('Call Now requires a valid contact phone number with at least 10 digits (e.g. +91 98765 43210)');
      }
      if (!phoneNumber && phoneDigits) {
        phoneNumber = data.destinationUrl?.startsWith('+') ? data.destinationUrl : `+91 ${phoneDigits}`;
      }
    } else if (phoneNumber) {
      const phoneDigits = phoneNumber.replace(/[^0-9]/g, '');
      if (phoneDigits.length < 10) {
        throw new Error('Please enter a valid contact phone number with at least 10 digits');
      }
    }

    let destinationType: 'website' | 'whatsapp' | 'facebook_page' | 'instagram_profile' | 'instagram' | 'phone' = data.destinationType || (callToAction === 'CALL_NOW' ? 'phone' : (callToAction === 'SEND_WHATSAPP_MESSAGE' ? 'whatsapp' : (callToAction === 'INSTAGRAM_MESSAGE' ? 'instagram' : 'website')));
    let destinationUrl = (data.destinationUrl?.trim()) || '';

    if (callToAction === 'CALL_NOW') {
      destinationType = 'phone';
      if (!destinationUrl) {
        destinationUrl = `tel:${phoneNumber}`;
      }
    } else if (callToAction === 'SEND_WHATSAPP_MESSAGE' || destinationType === 'whatsapp') {
      destinationType = 'whatsapp';
      const cleanPhone = (destinationUrl || phoneNumber || '').replace(/[^0-9]/g, '');
      if (cleanPhone.length < 10) {
        throw new Error('Please enter a valid WhatsApp phone number with country code (e.g. 919876543210)');
      }
      if (!destinationUrl.startsWith('http')) {
        destinationUrl = `https://wa.me/${cleanPhone}`;
      }
    } else if (callToAction === 'INSTAGRAM_MESSAGE' || destinationType === 'instagram_profile' || destinationType === 'instagram') {
      destinationType = data.destinationType === 'instagram_profile' ? 'instagram_profile' : 'instagram';
      if (!destinationUrl) {
        destinationUrl = 'https://instagram.com/smap';
      }
    } else {
      destinationType = 'website';
      if (!destinationUrl) {
        destinationUrl = 'https://smap-ads.onrender.com';
      }
      try {
        const u = new URL(destinationUrl);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') {
          throw new Error('Website URL must start with http:// or https://');
        }
      } catch {
        throw new Error('Please enter a valid website URL (e.g. https://yourbusiness.com)');
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
      creative_url: creativeUrl,
      creative_type: data.creativeType || 'image',
      business_name: businessName,
      primary_text: primaryText,
      headline: headline,
      description: description,
      call_to_action: callToAction,
      destination_type: destinationType,
      destination_url: destinationUrl,
      phone_number: phoneNumber,
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

    // Enqueue for resilient background execution (non-blocking, crash-recoverable, automatic retries)
    const queueJob = CampaignQueueService.enqueue(campaignId);

    const finalUpdatedCampaign = db.findCampaignById(campaignId)!;
    return {
      success: true,
      campaign: finalUpdatedCampaign,
      payment,
      walletTransaction: deductRes.transaction,
      newBalance: deductRes.newBalance,
      metaResult: {
        queued: true,
        jobId: queueJob.jobId,
        position: queueJob.position,
        message: 'Campaign safely queued for background worker submission to Meta Marketing API.',
      },
      metaSubmissionStatus: 'PAYMENT_CONFIRMED',
    };
  }
}
