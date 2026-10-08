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

    // Budget & Schedule calculation
    const dailyBudget = data.dailyBudget ? Math.max(100, Math.round(Number(data.dailyBudget))) : 200;
    const durationDays = data.durationDays ? Math.max(1, Math.round(Number(data.durationDays))) : 5;
    const totalBudget = dailyBudget * durationDays;

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
        metaResult = await MetaService.createDraftCampaignInMeta(campaign);
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
    const campaign = db.findCampaignById(campaignId);
    if (!campaign) throw new Error('Campaign not found');
    if (userId && campaign.user_id !== userId) throw new Error('Unauthorized');

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
}
