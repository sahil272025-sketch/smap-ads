import { db, Campaign, MetaConnection } from './db.js';

export interface MetaConfigStatus {
  isConfigured: boolean;
  integrationRequired: boolean;
  appIdConfigured: boolean;
  appSecretConfigured: boolean;
  redirectUriConfigured: boolean;
  apiVersion: string;
  appIdMasked: string | null;
  redirectUri: string;
  requiredScopes: string[];
  statusMessage: string;
  productionReady: boolean;
}

export interface MetaAdAccount {
  id: string;
  account_id: string;
  name: string;
  currency: string;
  account_status: number;
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

export class MetaService {
  private static getApiVersion(): string {
    return process.env.META_API_VERSION || 'v21.0';
  }

  private static getAppId(): string | null {
    return process.env.META_APP_ID || null;
  }

  private static getAppSecret(): string | null {
    return process.env.META_APP_SECRET || null;
  }

  private static getRedirectUri(origin?: string): string {
    const configured = process.env.META_REDIRECT_URI;
    if (configured && configured.startsWith('http')) {
      return configured;
    }
    const base = origin || process.env.APP_URL || 'http://localhost:3000';
    return `${base.replace(/\/$/, '')}${configured || '/api/meta/oauth/callback'}`;
  }

  public static readonly REQUIRED_SCOPES = [
    'ads_management',
    'ads_read',
    'pages_show_list',
    'pages_read_engagement',
    'instagram_basic',
  ];

  public static getConfigStatus(origin?: string): MetaConfigStatus {
    const appId = this.getAppId();
    const appSecret = this.getAppSecret();
    const redirectUri = this.getRedirectUri(origin);
    const apiVersion = this.getApiVersion();

    const appIdConfigured = !!appId && appId.trim().length > 0;
    const appSecretConfigured = !!appSecret && appSecret.trim().length > 0;
    const redirectUriConfigured = !!redirectUri && redirectUri.trim().length > 0;
    const isConfigured = appIdConfigured && appSecretConfigured && redirectUriConfigured;

    let statusMessage = 'Integration Required: Meta App ID and App Secret must be configured in environment variables to enable live Facebook and Instagram OAuth & ad publishing.';
    if (isConfigured) {
      statusMessage = 'Meta API credentials configured. Standard/Advanced Facebook App Review access required for live customer ads.';
    }

    const maskedAppId = appIdConfigured ? `${appId!.substring(0, 4)}••••${appId!.substring(Math.max(0, appId!.length - 4))}` : null;

    return {
      isConfigured,
      integrationRequired: !isConfigured,
      appIdConfigured,
      appSecretConfigured,
      redirectUriConfigured,
      apiVersion,
      appIdMasked: maskedAppId,
      redirectUri,
      requiredScopes: this.REQUIRED_SCOPES,
      statusMessage,
      productionReady: isConfigured,
    };
  }

  public static getOAuthUrl(state: string, origin?: string): { url: string | null; error?: string } {
    const config = this.getConfigStatus(origin);
    if (!config.isConfigured) {
      return {
        url: null,
        error: 'Meta advertising permissions are not configured or approved for this application. Please configure META_APP_ID and META_APP_SECRET in your server environment.',
      };
    }

    const appId = this.getAppId()!;
    const redirectUri = encodeURIComponent(config.redirectUri);
    const scope = encodeURIComponent(this.REQUIRED_SCOPES.join(','));
    const encodedState = encodeURIComponent(state);

    const url = `https://www.facebook.com/${config.apiVersion}/dialog/oauth?client_id=${appId}&redirect_uri=${redirectUri}&scope=${scope}&state=${encodedState}&response_type=code`;
    return { url };
  }

  public static async exchangeOAuthCode(code: string, origin?: string): Promise<{ success: boolean; connection?: MetaConnection; error?: string }> {
    const config = this.getConfigStatus(origin);
    if (!config.isConfigured) {
      return {
        success: false,
        error: 'Meta advertising permissions are not configured or approved for this application.',
      };
    }

    const appId = this.getAppId()!;
    const appSecret = this.getAppSecret()!;
    const redirectUri = config.redirectUri;

    try {
      // 1. Exchange authorization code for User Access Token
      const tokenUrl = `https://graph.facebook.com/${config.apiVersion}/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${code}`;
      const tokenRes = await fetch(tokenUrl);
      const tokenData = await tokenRes.json();

      if (!tokenRes.ok || tokenData.error) {
        const errorMsg = tokenData.error?.message || 'Meta OAuth token exchange failed';
        db.log('META_API', 'ERROR', `OAuth exchange error: ${errorMsg}`, { tokenData });
        return { success: false, error: errorMsg };
      }

      const accessToken = tokenData.access_token;

      // 2. Fetch User Profile
      const meRes = await fetch(`https://graph.facebook.com/${config.apiVersion}/me?fields=id,name&access_token=${accessToken}`);
      const meData = await meRes.json();

      if (!meRes.ok || meData.error) {
        return { success: false, error: meData.error?.message || 'Failed to fetch Meta user profile' };
      }

      // 3. Fetch Authorized Ad Accounts
      const adAccountsRes = await fetch(`https://graph.facebook.com/${config.apiVersion}/me/adaccounts?fields=id,account_id,name,currency,account_status&access_token=${accessToken}`);
      const adAccountsData = await adAccountsRes.json();

      const adAccounts: MetaAdAccount[] = Array.isArray(adAccountsData.data)
        ? adAccountsData.data.map((acc: any) => ({
            id: acc.id,
            account_id: acc.account_id,
            name: acc.name || `Ad Account ${acc.account_id}`,
            currency: acc.currency || 'INR',
            account_status: acc.account_status ?? 1,
          }))
        : [];

      return {
        success: true,
        connection: {
          id: `meta_conn_${Date.now()}`,
          user_id: '', // Will be assigned by caller
          meta_user_id: meData.id,
          meta_user_name: meData.name || 'Authorized Meta User',
          access_token: accessToken,
          token_expires_at: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
          ad_accounts: adAccounts,
          selected_ad_account_id: adAccounts.length > 0 ? adAccounts[0].id : null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      };
    } catch (err: any) {
      db.log('META_API', 'ERROR', `Network failure during Meta OAuth: ${err?.message}`, { error: String(err) });
      return { success: false, error: `Meta API connection failed: ${err?.message || 'Unknown network error'}` };
    }
  }

  public static async getAudienceEstimate(adAccountId: string, targeting: any, accessToken: string): Promise<{ estimate: number | null; message: string }> {
    const config = this.getConfigStatus();
    if (!config.isConfigured || !accessToken) {
      return {
        estimate: null,
        message: 'Estimated audience unavailable.',
      };
    }

    try {
      const cleanAccountId = adAccountId.replace('act_', '');
      const targetingSpec = encodeURIComponent(JSON.stringify({
        geo_locations: { countries: [targeting.country || 'IN'] },
        age_min: targeting.min_age || 18,
        age_max: targeting.max_age || 65,
      }));

      const url = `https://graph.facebook.com/${config.apiVersion}/act_${cleanAccountId}/delivery_estimate?targeting_spec=${targetingSpec}&access_token=${accessToken}`;
      const res = await fetch(url);
      const data = await res.json();

      if (res.ok && data.data && data.data[0]?.estimate_mau_lower_bound) {
        return {
          estimate: data.data[0].estimate_mau_lower_bound,
          message: 'Estimated audience calculated via Meta Graph API',
        };
      }
      return {
        estimate: null,
        message: 'Estimated audience unavailable.',
      };
    } catch {
      return {
        estimate: null,
        message: 'Estimated audience unavailable.',
      };
    }
  }

  public static async submitCampaignToMeta(campaign: Campaign, connection: MetaConnection): Promise<{
    success: boolean;
    meta_campaign_id?: string;
    meta_adset_id?: string;
    meta_creative_id?: string;
    meta_ad_id?: string;
    status: 'ACTIVE' | 'UNDER_REVIEW' | 'FAILED';
    error?: string;
  }> {
    const config = this.getConfigStatus();
    if (!config.isConfigured) {
      db.log('META_API', 'WARN', `Attempted campaign submission without configured Meta credentials for campaign ${campaign.id}`);
      return {
        success: false,
        status: 'FAILED',
        error: 'Meta advertising permissions are not configured or approved for this application.',
      };
    }

    const adAccountId = connection.selected_ad_account_id || (connection.ad_accounts[0]?.id);
    if (!adAccountId) {
      return {
        success: false,
        status: 'FAILED',
        error: 'No authorized Meta ad account selected. Please select an ad account in your Meta connection settings.',
      };
    }

    const cleanAccountId = adAccountId.startsWith('act_') ? adAccountId : `act_${adAccountId}`;

    try {
      db.log('META_API', 'INFO', `Submitting campaign ${campaign.id} to Meta account ${cleanAccountId}`);

      // 1. Create Campaign on Meta Graph API
      const campaignUrl = `https://graph.facebook.com/${config.apiVersion}/${cleanAccountId}/campaigns`;
      const campaignParams = new URLSearchParams({
        name: `SMAP - ${campaign.business_name} - ${campaign.headline.substring(0, 30)}`,
        objective: 'OUTCOME_TRAFFIC',
        status: 'PAUSED', // Start in paused/review to configure adset and ad safely
        special_ad_categories: '[]',
        access_token: connection.access_token,
      });

      const campaignRes = await fetch(campaignUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: campaignParams.toString(),
      });
      const campaignData = await campaignRes.json();

      if (!campaignRes.ok || !campaignData.id) {
        const errorMsg = campaignData.error?.message || 'Meta API rejected campaign creation';
        db.log('META_API', 'ERROR', `Meta campaign creation failed: ${errorMsg}`, { response: campaignData });
        return {
          success: false,
          status: 'FAILED',
          error: `Meta advertising permissions are not configured or approved for this application: ${errorMsg}`,
        };
      }

      const metaCampaignId = campaignData.id;

      // 2. Create Ad Set
      const adsetUrl = `https://graph.facebook.com/${config.apiVersion}/${cleanAccountId}/adsets`;
      const targetingSpec = JSON.stringify({
        geo_locations: {
          countries: [campaign.targeting?.country || 'IN'],
        },
        age_min: campaign.targeting?.min_age || 18,
        age_max: campaign.targeting?.max_age || 65,
        publisher_platforms: ['facebook', 'instagram'],
      });

      const adsetParams = new URLSearchParams({
        name: `SMAP AdSet - ${campaign.headline.substring(0, 25)}`,
        campaign_id: metaCampaignId,
        daily_budget: '50000', // ₹500 in cents/paise
        billing_event: 'IMPRESSIONS',
        optimization_goal: 'LINK_CLICKS',
        targeting: targetingSpec,
        status: 'PAUSED',
        access_token: connection.access_token,
      });

      const adsetRes = await fetch(adsetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: adsetParams.toString(),
      });
      const adsetData = await adsetRes.json();

      if (!adsetRes.ok || !adsetData.id) {
        const errorMsg = adsetData.error?.message || 'Meta AdSet creation failed';
        db.log('META_API', 'ERROR', `Meta adset error: ${errorMsg}`, { response: adsetData });
        return {
          success: false,
          status: 'FAILED',
          error: `Meta advertising permissions are not configured or approved for this application: ${errorMsg}`,
        };
      }

      const metaAdsetId = adsetData.id;

      // 3. Create Ad Creative & Ad
      const creativeUrl = `https://graph.facebook.com/${config.apiVersion}/${cleanAccountId}/adcreatives`;
      const creativeParams = new URLSearchParams({
        name: `SMAP Creative - ${campaign.business_name}`,
        object_story_spec: JSON.stringify({
          page_id: connection.ad_accounts[0]?.account_id || '',
          link_data: {
            message: campaign.primary_text,
            name: campaign.headline,
            description: campaign.description,
            link: campaign.destination_url,
          },
        }),
        access_token: connection.access_token,
      });

      const creativeRes = await fetch(creativeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: creativeParams.toString(),
      });
      const creativeData = await creativeRes.json();

      const metaCreativeId = creativeData.id || null;

      // Create Ad
      const adUrl = `https://graph.facebook.com/${config.apiVersion}/${cleanAccountId}/ads`;
      const adParams = new URLSearchParams({
        name: `SMAP Ad - ${campaign.headline.substring(0, 25)}`,
        adset_id: metaAdsetId,
        creative: JSON.stringify({ creative_id: metaCreativeId }),
        status: 'ACTIVE',
        access_token: connection.access_token,
      });

      const adRes = await fetch(adUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: adParams.toString(),
      });
      const adData = await adRes.json();

      const metaAdId = adData.id || null;

      db.log('META_API', 'INFO', `Campaign successfully registered with Meta: ${metaCampaignId}`, {
        metaCampaignId,
        metaAdsetId,
        metaAdId,
      });

      return {
        success: true,
        meta_campaign_id: metaCampaignId,
        meta_adset_id: metaAdsetId,
        meta_creative_id: metaCreativeId,
        meta_ad_id: metaAdId,
        status: 'UNDER_REVIEW', // In accordance with Meta standard review cycle
      };
    } catch (err: any) {
      db.log('META_API', 'ERROR', `Exception during Meta campaign creation: ${err?.message}`, { error: String(err) });
      return {
        success: false,
        status: 'FAILED',
        error: `Meta advertising permissions are not configured or approved for this application: ${err?.message || 'Network error'}`,
      };
    }
  }

  public static async pauseCampaign(campaign: Campaign): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfigStatus();
    if (!config.isConfigured || !campaign.meta_campaign_id) {
      return {
        success: false,
        error: 'Meta API credentials or Meta Campaign ID missing',
      };
    }

    const connection = db.findMetaConnectionByUserId(campaign.user_id);
    if (!connection || !connection.access_token) {
      return {
        success: false,
        error: 'Authorized Meta connection not available for campaign pause',
      };
    }

    try {
      const url = `https://graph.facebook.com/${config.apiVersion}/${campaign.meta_campaign_id}`;
      const params = new URLSearchParams({
        status: 'PAUSED',
        access_token: connection.access_token,
      });

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        db.log('META_API', 'INFO', `Successfully paused Meta campaign ${campaign.meta_campaign_id} for campaign ${campaign.id}`);
        return { success: true };
      }

      const errorMsg = data.error?.message || 'Meta API returned non-success response on campaign pause';
      db.log('META_API', 'ERROR', `Failed to pause Meta campaign ${campaign.meta_campaign_id}: ${errorMsg}`, { response: data });
      return { success: false, error: errorMsg };
    } catch (err: any) {
      db.log('META_API', 'ERROR', `Exception pausing Meta campaign: ${err?.message}`);
      return { success: false, error: err?.message };
    }
  }

  public static async getCampaignInsights(campaign: Campaign): Promise<MetaInsights> {
    const fallback: MetaInsights = {
      reach: null,
      impressions: null,
      clicks: null,
      spend: null,
      ctr: null,
      cpc: null,
      dataAvailable: false,
      notice: 'Metrics currently unavailable.',
    };

    if (!campaign.meta_campaign_id) {
      return fallback;
    }

    const config = this.getConfigStatus();
    if (!config.isConfigured) {
      return fallback;
    }

    const connection = db.findMetaConnectionByUserId(campaign.user_id);
    if (!connection || !connection.access_token) {
      return fallback;
    }

    try {
      const url = `https://graph.facebook.com/${config.apiVersion}/${campaign.meta_campaign_id}/insights?fields=reach,impressions,clicks,spend,ctr,cpc&access_token=${connection.access_token}`;
      const res = await fetch(url);
      const data = await res.json();

      if (res.ok && Array.isArray(data.data) && data.data.length > 0) {
        const item = data.data[0];
        return {
          reach: Number(item.reach) || 0,
          impressions: Number(item.impressions) || 0,
          clicks: Number(item.clicks) || 0,
          spend: Number(item.spend) || 0,
          ctr: Number(item.ctr) || 0,
          cpc: Number(item.cpc) || 0,
          dataAvailable: true,
          notice: 'Official Meta Graph API performance data',
        };
      }
      return fallback;
    } catch {
      return fallback;
    }
  }
}
