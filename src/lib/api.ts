import { User, Package, Campaign, Payment, MetaConnectionState, MetaInsights, MetaVerificationReport, SupportTicket, AdminStats, SystemLog, GoogleConfigStatus, WalletTransaction, WalletData, AdminWalletData } from '../types';

class ApiClient {
  private inMemoryToken: string | null = null;

  constructor() {
    this.readTokenFromCookie();
  }

  private readTokenFromCookie() {
    try {
      if (typeof document !== 'undefined') {
        const match = document.cookie.match(/(?:^|;\s*)smap_token=([^;]+)/);
        if (match && match[1]) {
          this.inMemoryToken = decodeURIComponent(match[1]);
        }
      }
    } catch {
      // ignore
    }
  }

  public setToken(token: string | null) {
    this.inMemoryToken = token;
    try {
      if (typeof document !== 'undefined') {
        if (token) {
          document.cookie = `smap_token=${encodeURIComponent(token)}; path=/; max-age=604800; SameSite=Lax; Secure`;
        } else {
          document.cookie = 'smap_token=; path=/; max-age=0; SameSite=Lax; Secure';
        }
      }
    } catch {
      // ignore
    }
  }

  public getToken(): string | null {
    if (!this.inMemoryToken) {
      this.readTokenFromCookie();
    }
    return this.inMemoryToken;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      ...(options.headers as Record<string, string>),
    };

    const token = this.getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (!(options.body instanceof FormData) && !headers['Content-Type']) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`/api${endpoint}`, {
      ...options,
      credentials: 'same-origin',
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(data.error || `Request failed with status ${response.status}`);
    }

    return data as T;
  }

  // Public config & packages
  public getConfig() {
    return this.request<{
      appName: string;
      brandName: string;
      platforms: string[];
      merchantUpi: string;
      paymentStatus: { isConfigured: boolean; statusMessage: string; merchantUpi: string };
      metaStatus: { isConfigured: boolean; apiVersion: string; statusMessage: string };
    }>('/config');
  }

  public getPackages() {
    return this.request<{ packages: Package[] }>('/packages');
  }

  // Real Google Authentication
  public getGoogleConfig() {
    return this.request<GoogleConfigStatus>('/auth/google/config');
  }

  public getGoogleAuthUrl() {
    return this.request<{
      url: string;
      configured: boolean;
      devMode?: boolean;
      user?: User;
      token?: string;
    }>('/auth/google/url');
  }

  public verifyGoogleIdToken(idToken: string) {
    return this.request<{ user: User; token: string }>('/auth/google/verify', {
      method: 'POST',
      body: JSON.stringify({ idToken }),
    });
  }

  public loginWithEmail(credentials: { email: string; password: string }) {
    return this.request<{ user: User; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  public registerWithEmail(data: { name: string; email: string; password: string; phone?: string }) {
    return this.request<{ user: User; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public getMe() {
    return this.request<{ user: User; metaConnection: MetaConnectionState }>('/auth/me');
  }

  public updateProfile(payload: { name?: string; phone?: string }) {
    return this.request<{ user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  public logout() {
    this.setToken(null);
    return this.request<{ success: boolean }>('/auth/logout', { method: 'POST' });
  }

  // Creative upload
  public async uploadCreative(file: File): Promise<{
    url: string;
    filename: string;
    originalName: string;
    size: number;
    type: 'image' | 'video';
  }> {
    const formData = new FormData();
    formData.append('creative', file);

    return this.request('/campaigns/upload', {
      method: 'POST',
      body: formData,
    });
  }

  // Campaigns
  public createCampaign(payload: {
    packageId?: string;
    objective?: string;
    creativeUrl: string;
    creativeType?: 'image' | 'video';
    businessName: string;
    primaryText: string;
    headline: string;
    description?: string;
    callToAction?: string;
    destinationType?: string;
    destinationUrl: string;
    placements?: string[];
    targeting?: any;
    dailyBudget?: number;
    durationDays?: number;
    startDate?: string;
    endDate?: string;
    syncToMeta?: boolean;
    status?: string;
  }) {
    return this.request<{ campaign: Campaign; payment?: Payment; metaResult?: any }>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public getCampaigns(status?: string) {
    const q = status && status !== 'ALL' ? `?status=${encodeURIComponent(status)}` : '';
    return this.request<{ campaigns: Campaign[] }>(`/campaigns${q}`);
  }

  public getCampaignDetails(id: string) {
    return this.request<{
      campaign: Campaign;
      package: Package;
      payment: Payment | null;
      insights: MetaInsights;
    }>(`/campaigns/${id}`);
  }

  public submitCampaignToMeta(campaignId: string) {
    return this.request<{ campaign: Campaign }>(`/campaigns/${campaignId}/submit-meta`, {
      method: 'POST',
    });
  }

  // Payments (Real UPI Gateway Only)
  public getPayments() {
    return this.request<{ payments: Payment[] }>('/payments');
  }

  public getPaymentDetails(id: string) {
    return this.request<{ payment: Payment }>(`/payments/${id}`);
  }

  public getPaymentGatewayStatus() {
    return this.request<{
      provider: string;
      environment: 'sandbox' | 'production';
      isConfigured: boolean;
      productionReady: boolean;
      keyIdConfigured: boolean;
      keySecretConfigured: boolean;
      webhookSecretConfigured: boolean;
      keyId: string | null;
      keyIdMasked: string | null;
      merchantUpi: string;
      merchantName: string;
      statusMessage: string;
    }>('/payments/status');
  }

  public preparePaymentOrder(paymentId: string) {
    return this.request<{ payment: Payment }>(`/payments/${paymentId}/prepare-order`, {
      method: 'POST',
    });
  }

  public verifyPayment(paymentId: string, payload: {
    gatewayPaymentId: string;
    gatewayOrderId?: string;
    gatewaySignature?: string;
  }) {
    return this.request<{
      success: boolean;
      payment: Payment;
      campaign?: Campaign;
      error?: string;
    }>(`/payments/${paymentId}/verify`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public simulateSandboxPayment(paymentId: string, payload: {
    status: 'PAID' | 'FAILED' | 'PENDING';
    failureReason?: string;
  }) {
    return this.request<{
      success: boolean;
      payment: Payment;
      campaign?: Campaign;
    }>(`/payments/${paymentId}/sandbox-simulate`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public simulateSandboxWebhook(payload: {
    paymentId: string;
    event?: string;
    amount?: number;
    failureReason?: string;
    invalidSignature?: boolean;
  }) {
    return this.request<{
      success: boolean;
      webhookResult: any;
      payment?: Payment;
      campaign?: Campaign;
      error?: string;
    }>('/payments/sandbox/simulate-webhook', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public submitPaymentReference(paymentId: string, transactionReference: string) {
    return this.request<{ payment: Payment; message: string }>(`/payments/${paymentId}/submit-ref`, {
      method: 'POST',
      body: JSON.stringify({ transactionReference }),
    });
  }

  // --- Customer Wallet & Add Funds ---
  public getWallet() {
    return this.request<WalletData>('/wallet');
  }

  public syncWallet() {
    return this.request<{
      success: boolean;
      creditedCount: number;
      balance: number;
      transactions: WalletTransaction[];
      message: string;
    }>('/wallet/sync', {
      method: 'POST',
    });
  }

  public getWalletBalance() {
    return this.request<{ balance: number; currency: 'INR' }>('/wallet/balance');
  }

  public getWalletTransactions() {
    return this.request<{ transactions: WalletTransaction[]; balance: number; currency: 'INR' }>('/wallet/transactions');
  }

  public createAddFundsOrder(amount: number) {
    return this.request<{
      payment: Payment;
      keyId: string | null;
      amount: number;
      gatewayOrderId: string | null;
      gatewayError?: { code: string; description: string } | null;
    }>('/wallet/add-funds', {
      method: 'POST',
      body: JSON.stringify({ amount }),
    });
  }

  public verifyWalletPayment(payload: {
    paymentId: string;
    gatewayPaymentId: string;
    gatewayOrderId?: string;
    gatewaySignature?: string;
  }) {
    return this.request<{
      success: boolean;
      balance: number;
      transaction?: WalletTransaction;
      alreadyProcessed?: boolean;
    }>('/wallet/verify-payment', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public payCampaignWithWallet(campaignId: string) {
    return this.request<{
      success: boolean;
      balance: number;
      transaction: WalletTransaction;
      campaign: Campaign;
      payment: Payment;
    }>('/wallet/pay-campaign', {
      method: 'POST',
      body: JSON.stringify({ campaignId }),
    });
  }

  public resetTestBalance() {
    return this.request<{
      success: boolean;
      message: string;
      balance: number;
      transaction: WalletTransaction;
    }>('/wallet/reset-test-balance', {
      method: 'POST',
    });
  }

  public getAdminWallets() {
    return this.request<AdminWalletData>('/admin/wallets');
  }

  public adminResetCustomerBalance(userId: string, reason?: string) {
    return this.request<{
      success: boolean;
      message: string;
      balance: number;
      transaction: WalletTransaction;
    }>(`/admin/wallets/${userId}/reset`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  // Meta Integration
  public getMetaStatus() {
    return this.request<{
      isConfigured: boolean;
      appIdConfigured: boolean;
      appSecretConfigured: boolean;
      redirectUriConfigured: boolean;
      apiVersion: string;
      appIdMasked: string | null;
      redirectUri: string;
      requiredScopes: string[];
      statusMessage: string;
      productionReady: boolean;
    }>('/meta/status');
  }

  public getMetaOAuthUrl() {
    return this.request<{ url: string }>('/meta/oauth/url');
  }

  public selectMetaAccount(adAccountId: string) {
    return this.request<{ success: boolean; connection: any }>('/meta/select-account', {
      method: 'POST',
      body: JSON.stringify({ adAccountId }),
    });
  }

  public disconnectMeta() {
    return this.request<{ success: boolean; message: string }>('/meta/disconnect', {
      method: 'DELETE',
    });
  }

  public estimateAudience(targeting: any) {
    return this.request<{ estimate: number | null; message: string }>('/meta/estimate-audience', {
      method: 'POST',
      body: JSON.stringify({ targeting }),
    });
  }

  public verifyMetaConnection() {
    return this.request<MetaVerificationReport>('/meta/verify');
  }

  // Support
  public getSupportTickets() {
    return this.request<{ tickets: SupportTicket[] }>('/support');
  }

  public createSupportTicket(payload: { subject: string; message: string; campaignId?: string | null }) {
    return this.request<{ ticket: SupportTicket }>('/support', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  public getSupportTicket(id: string) {
    return this.request<{ ticket: SupportTicket }>(`/support/${id}`);
  }

  public replySupportTicket(id: string, message: string) {
    return this.request<{ ticket: SupportTicket }>(`/support/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // Admin
  public getAdminStats() {
    return this.request<AdminStats>('/admin/stats');
  }

  public getAdminCustomers() {
    return this.request<{ customers: User[] }>('/admin/customers');
  }

  public getAdminCampaigns() {
    return this.request<{ campaigns: Campaign[] }>('/admin/campaigns');
  }

  public getAdminPayments() {
    return this.request<{ payments: Payment[] }>('/admin/payments');
  }

  public verifyAdminPayment(paymentId: string, notes?: string, transactionReference?: string) {
    return this.request<{ payment: Payment; message: string }>(`/admin/payments/${paymentId}/verify`, {
      method: 'POST',
      body: JSON.stringify({ notes, transactionReference }),
    });
  }

  public rejectAdminPayment(paymentId: string, reason: string) {
    return this.request<{ payment: Payment; message: string }>(`/admin/payments/${paymentId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  }

  public getAdminPackages() {
    return this.request<{ packages: Package[] }>('/admin/packages');
  }

  public updateAdminPackage(id: string, updates: Partial<Package>) {
    return this.request<{ package: Package }>(`/admin/packages/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  public createAdminPackage(pkg: Partial<Package>) {
    return this.request<{ package: Package }>('/admin/packages', {
      method: 'POST',
      body: JSON.stringify(pkg),
    });
  }

  public getAdminLogs(limit = 100) {
    return this.request<{ logs: SystemLog[] }>(`/admin/logs?limit=${limit}`);
  }

  public getAdminTickets() {
    return this.request<{ tickets: SupportTicket[] }>('/admin/tickets');
  }

  public updateAdminTicketStatus(id: string, status: string) {
    return this.request<{ ticket: SupportTicket }>(`/admin/tickets/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }
}

export const api = new ApiClient();
