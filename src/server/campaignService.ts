import { db, Campaign, CampaignStatus, CampaignTargeting, Package } from './db.js';
import { MetaService } from './metaService.js';
import { PaymentService } from './paymentService.js';

export class CampaignService {
  public static async createDraft(userId: string, data: {
    packageId: string;
    creativeUrl: string;
    creativeType: 'image' | 'video';
    businessName: string;
    primaryText: string;
    headline: string;
    description: string;
    destinationType: 'website' | 'whatsapp' | 'facebook_page' | 'instagram_profile';
    destinationUrl: string;
    targeting: CampaignTargeting;
  }): Promise<{ campaign: Campaign; payment: any }> {
    const pkg = db.findPackageById(data.packageId);
    if (!pkg) {
      throw new Error('Selected package not found');
    }

    if (!data.businessName || !data.headline || !data.primaryText || !data.destinationUrl) {
      throw new Error('Required campaign fields missing: Business name, headline, primary text, and destination URL');
    }

    // Validate destination based on type
    if (data.destinationType === 'website') {
      try {
        const u = new URL(data.destinationUrl);
        if (u.protocol !== 'http:' && u.protocol !== 'https:') {
          throw new Error('Website URL must start with http:// or https://');
        }
      } catch {
        throw new Error('Please enter a valid website URL (e.g. https://yourbusiness.com)');
      }
    } else if (data.destinationType === 'whatsapp') {
      const cleanPhone = data.destinationUrl.replace(/[^0-9]/g, '');
      if (cleanPhone.length < 10) {
        throw new Error('Please enter a valid WhatsApp phone number with country code');
      }
    }

    const now = new Date().toISOString();
    const campaignId = `smap_cmp_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const campaign: Campaign = {
      id: campaignId,
      user_id: userId,
      package_id: pkg.id,
      creative_url: data.creativeUrl,
      creative_type: data.creativeType || 'image',
      business_name: data.businessName.trim(),
      primary_text: data.primaryText.trim(),
      headline: data.headline.trim(),
      description: data.description ? data.description.trim() : '',
      destination_type: data.destinationType,
      destination_url: data.destinationUrl.trim(),
      targeting: {
        country: data.targeting.country || 'IN',
        state: data.targeting.state || 'All States',
        city: data.targeting.city || 'All Cities',
        min_age: data.targeting.min_age || 18,
        max_age: data.targeting.max_age || 65,
        gender: data.targeting.gender || 'ALL',
        interests: data.targeting.interests || ['Online Shopping', 'Small Business'],
      },
      start_at: null,
      end_at: null,
      status: 'PAYMENT_PENDING',
      meta_campaign_id: null,
      meta_adset_id: null,
      meta_creative_id: null,
      meta_ad_id: null,
      meta_account_id: null,
      meta_status_message: null,
      rejection_reason: null,
      error_details: null,
      created_at: now,
      updated_at: now,
    };

    db.createCampaign(campaign);

    // Create corresponding payment request
    const payment = await PaymentService.createPaymentRequest({
      userId,
      campaignId: campaign.id,
      packageId: pkg.id,
      amount: pkg.price,
    });

    db.log('CAMPAIGN', 'INFO', `Created campaign draft ${campaign.id} for user ${userId}`, {
      campaignId: campaign.id,
      package: pkg.name,
      amount: pkg.price,
    });

    return { campaign, payment };
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
