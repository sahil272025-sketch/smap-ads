import fs from 'fs';
import path from 'path';

export interface User {
  id: string;
  google_sub: string;
  name: string;
  email: string;
  email_verified: boolean;
  profile_picture: string | null;
  role: 'customer' | 'admin';
  status: 'ACTIVE' | 'SUSPENDED';
  created_at: string;
  last_login_at: string;
  phone?: string;
  password_hash?: string | null;
  wallet_balance?: number; // In INR (default 0)
  updated_at?: string;
}

export type WalletTransactionType =
  | 'ADD_FUNDS'
  | 'CAMPAIGN_PAYMENT'
  | 'REFUND'
  | 'FAILED_PAYMENT';

export type WalletTransactionStatus = 'SUCCESS' | 'FAILED' | 'PENDING';

export interface WalletTransaction {
  id: string;
  user_id: string;
  type: WalletTransactionType;
  amount: number;
  balance_before: number;
  balance_after: number;
  description: string;
  payment_id?: string | null;
  gateway_payment_id?: string | null;
  gateway_order_id?: string | null;
  campaign_id?: string | null;
  status: WalletTransactionStatus;
  created_at: string;
}

export interface Package {
  id: string;
  name: string;
  price: number; // ₹200, ₹399, ₹549, ₹749
  duration_days: number; // 5, 10, 14, 30
  platforms: string[]; // ['Facebook', 'Instagram']
  features: string[];
  active: boolean;
  is_popular?: boolean;
  created_at: string;
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
  verification_source: 'GATEWAY_WEBHOOK' | 'GATEWAY_API' | 'ADMIN_MANUAL_VERIFICATION' | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface MetaConnection {
  id: string;
  user_id: string;
  meta_user_id: string;
  meta_user_name: string;
  access_token: string;
  token_expires_at: string;
  ad_accounts: Array<{
    id: string;
    account_id: string;
    name: string;
    currency: string;
    account_status: number;
  }>;
  selected_ad_account_id: string | null;
  created_at: string;
  updated_at: string;
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
  category: 'AUTH' | 'PAYMENT' | 'META_API' | 'SCHEDULER' | 'ADMIN' | 'CAMPAIGN';
  level: 'INFO' | 'WARN' | 'ERROR';
  message: string;
  details?: Record<string, unknown>;
  created_at: string;
}

interface DatabaseSchema {
  users: User[];
  packages: Package[];
  campaigns: Campaign[];
  payments: Payment[];
  meta_connections: MetaConnection[];
  support_tickets: SupportTicket[];
  system_logs: SystemLog[];
  wallet_transactions: WalletTransaction[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'smap_db.json');

class DatabaseService {
  private db: DatabaseSchema = {
    users: [],
    packages: [],
    campaigns: [],
    payments: [],
    meta_connections: [],
    support_tickets: [],
    system_logs: [],
    wallet_transactions: [],
  };

  constructor() {
    this.init();
  }

  private init() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const uploadsDir = path.join(DATA_DIR, 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.db = JSON.parse(raw);
        // Ensure valid users array and initialize wallet_balance
        if (Array.isArray(this.db.users)) {
          this.db.users = this.db.users.filter(u => u && u.id && u.email).map(u => ({
            ...u,
            wallet_balance: typeof u.wallet_balance === 'number' && !isNaN(u.wallet_balance) ? u.wallet_balance : 0,
          }));
        }
        // Ensure wallet_transactions array exists
        if (!Array.isArray(this.db.wallet_transactions)) {
          this.db.wallet_transactions = [];
        }
      } catch (err) {
        console.error('Failed to parse existing DB file, reinitializing', err);
        this.seedInitialData();
      }
    } else {
      this.seedInitialData();
    }

    // Ensure packages are present and match specifications
    this.ensureDefaultPackages();
  }

  private save() {
    try {
      const tempFile = `${DB_FILE}.tmp`;
      fs.writeFileSync(tempFile, JSON.stringify(this.db, null, 2), 'utf-8');
      fs.renameSync(tempFile, DB_FILE);
    } catch (err) {
      console.error('Failed to persist database file', err);
    }
  }

  private seedInitialData() {
    this.db.users = [];
    this.seedDefaultPackages();
    this.log('AUTH', 'INFO', 'Production database initialized with clean Google Authentication architecture');
    this.save();
  }

  private seedDefaultPackages() {
    const now = new Date().toISOString();
    this.db.packages = [
      {
        id: 'pkg_starter_200',
        name: 'Starter Sprint',
        price: 200,
        duration_days: 5,
        platforms: ['Facebook', 'Instagram'],
        features: [
          '5 Days duration',
          'Facebook + Instagram advertising',
          'Target audience setup',
          'Campaign management',
          'Campaign status tracking',
          'UPI Instant Intent checkout',
        ],
        active: true,
        created_at: now,
      },
      {
        id: 'pkg_growth_399',
        name: 'Growth Accelerate',
        price: 399,
        duration_days: 10,
        platforms: ['Facebook', 'Instagram'],
        features: [
          '10 Days duration',
          'Facebook + Instagram advertising',
          'Target audience setup',
          'Campaign management',
          'Campaign status tracking',
          'Priority campaign monitoring',
        ],
        active: true,
        is_popular: true,
        created_at: now,
      },
      {
        id: 'pkg_pro_549',
        name: 'Business Pro',
        price: 549,
        duration_days: 14,
        platforms: ['Facebook', 'Instagram'],
        features: [
          '14 Days duration',
          'Facebook + Instagram advertising',
          'Target audience setup',
          'Campaign management',
          'Campaign status tracking',
          'Extended auction reach stability',
        ],
        active: true,
        created_at: now,
      },
      {
        id: 'pkg_scale_749',
        name: 'Enterprise Scale',
        price: 749,
        duration_days: 30,
        platforms: ['Facebook', 'Instagram'],
        features: [
          '30 Days full monthly duration',
          'Facebook + Instagram advertising',
          'Target audience setup',
          'Campaign management',
          'Campaign status tracking',
          'Long-term audience learning phase',
        ],
        active: true,
        created_at: now,
      },
    ];
  }

  private ensureDefaultPackages() {
    if (!this.db.packages || this.db.packages.length === 0) {
      this.seedDefaultPackages();
      this.save();
    }
  }

  // System Logs
  public log(category: SystemLog['category'], level: SystemLog['level'], message: string, details?: Record<string, unknown>) {
    const entry: SystemLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      category,
      level,
      message,
      details,
      created_at: new Date().toISOString(),
    };
    this.db.system_logs.unshift(entry);
    // Keep last 1000 logs
    if (this.db.system_logs.length > 1000) {
      this.db.system_logs = this.db.system_logs.slice(0, 1000);
    }
    this.save();
    return entry;
  }

  private reloadFromDisk() {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.users)) {
          this.db.users = data.users.filter((u: User) => u && u.id && u.email);
        }
      }
    } catch {
      // ignore
    }
  }

  // Users
  public getUsers() { return this.db.users; }
  public findUserById(id: string) {
    let u = this.db.users.find(user => user.id === id);
    if (!u) {
      this.reloadFromDisk();
      u = this.db.users.find(user => user.id === id);
    }
    return u;
  }
  public findUserByGoogleSub(googleSub: string) {
    let u = this.db.users.find(user => user.google_sub === googleSub);
    if (!u) {
      this.reloadFromDisk();
      u = this.db.users.find(user => user.google_sub === googleSub);
    }
    return u;
  }
  public findUserByEmail(email: string) {
    let u = this.db.users.find(user => user.email.toLowerCase() === email.toLowerCase());
    if (!u) {
      this.reloadFromDisk();
      u = this.db.users.find(user => user.email.toLowerCase() === email.toLowerCase());
    }
    return u;
  }
  public createUser(user: User) {
    this.db.users.push(user);
    this.save();
    return user;
  }
  public updateUser(id: string, updates: Partial<User>) {
    const idx = this.db.users.findIndex(u => u.id === id);
    if (idx !== -1) {
      this.db.users[idx] = { ...this.db.users[idx], ...updates, updated_at: new Date().toISOString() };
      this.save();
      return this.db.users[idx];
    }
    return null;
  }

  // Packages
  public getPackages(onlyActive = true) {
    return onlyActive ? this.db.packages.filter(p => p.active) : this.db.packages;
  }
  public findPackageById(id: string) { return this.db.packages.find(p => p.id === id); }
  public createPackage(pkg: Package) {
    this.db.packages.push(pkg);
    this.save();
    return pkg;
  }
  public updatePackage(id: string, updates: Partial<Package>) {
    const idx = this.db.packages.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.db.packages[idx] = { ...this.db.packages[idx], ...updates };
      this.save();
      return this.db.packages[idx];
    }
    return null;
  }

  // Campaigns
  public getCampaigns(userId?: string) {
    if (userId) {
      return this.db.campaigns.filter(c => c.user_id === userId);
    }
    return this.db.campaigns;
  }
  public findCampaignById(id: string) { return this.db.campaigns.find(c => c.id === id); }
  public createCampaign(campaign: Campaign) {
    this.db.campaigns.unshift(campaign);
    this.save();
    return campaign;
  }
  public updateCampaign(id: string, updates: Partial<Campaign>) {
    const idx = this.db.campaigns.findIndex(c => c.id === id);
    if (idx !== -1) {
      this.db.campaigns[idx] = { ...this.db.campaigns[idx], ...updates, updated_at: new Date().toISOString() };
      this.save();
      return this.db.campaigns[idx];
    }
    return null;
  }

  // Payments
  public getPayments(userId?: string) {
    if (userId) {
      return this.db.payments.filter(p => p.user_id === userId);
    }
    return this.db.payments;
  }
  public findPaymentById(id: string) { return this.db.payments.find(p => p.id === id); }
  public findPaymentByCampaignId(campaignId: string) { return this.db.payments.find(p => p.campaign_id === campaignId); }
  public findPaymentByGatewayOrderId(orderId: string) { return this.db.payments.find(p => p.gateway_order_id === orderId); }
  public findPaymentByGatewayPaymentId(paymentId: string) { return this.db.payments.find(p => p.gateway_payment_id === paymentId); }
  public createPayment(payment: Payment) {
    this.db.payments.unshift(payment);
    this.save();
    return payment;
  }
  public updatePayment(id: string, updates: Partial<Payment>) {
    const idx = this.db.payments.findIndex(p => p.id === id);
    if (idx !== -1) {
      this.db.payments[idx] = { ...this.db.payments[idx], ...updates, updated_at: new Date().toISOString() };
      this.save();
      return this.db.payments[idx];
    }
    return null;
  }

  // Meta Connections
  public findMetaConnectionByUserId(userId: string) {
    return this.db.meta_connections.find(m => m.user_id === userId);
  }
  public saveMetaConnection(connection: MetaConnection) {
    const idx = this.db.meta_connections.findIndex(m => m.user_id === connection.user_id);
    if (idx !== -1) {
      this.db.meta_connections[idx] = { ...connection, updated_at: new Date().toISOString() };
    } else {
      this.db.meta_connections.push(connection);
    }
    this.save();
    return connection;
  }
  public deleteMetaConnection(userId: string) {
    this.db.meta_connections = this.db.meta_connections.filter(m => m.user_id !== userId);
    this.save();
  }

  // Support Tickets
  public getTickets(userId?: string) {
    if (userId) {
      return this.db.support_tickets.filter(t => t.user_id === userId);
    }
    return this.db.support_tickets;
  }
  public findTicketById(id: string) { return this.db.support_tickets.find(t => t.id === id); }
  public createTicket(ticket: SupportTicket) {
    this.db.support_tickets.unshift(ticket);
    this.save();
    return ticket;
  }
  public updateTicket(id: string, updates: Partial<SupportTicket>) {
    const idx = this.db.support_tickets.findIndex(t => t.id === id);
    if (idx !== -1) {
      this.db.support_tickets[idx] = { ...this.db.support_tickets[idx], ...updates, updated_at: new Date().toISOString() };
      this.save();
      return this.db.support_tickets[idx];
    }
    return null;
  }
  public addTicketReply(ticketId: string, reply: SupportTicketReply) {
    const ticket = this.findTicketById(ticketId);
    if (ticket) {
      ticket.replies.push(reply);
      ticket.updated_at = new Date().toISOString();
      this.save();
      return ticket;
    }
    return null;
  }

  // System Logs getter
  public getLogs(limit = 100) {
    return this.db.system_logs.slice(0, limit);
  }

  // --- Customer Wallet & Transactions ---
  public getWalletBalance(userId: string): number {
    const user = this.findUserById(userId);
    if (!user) return 0;
    return typeof user.wallet_balance === 'number' && !isNaN(user.wallet_balance)
      ? Math.max(0, Math.round(user.wallet_balance * 100) / 100)
      : 0;
  }

  public getWalletTransactions(userId?: string): WalletTransaction[] {
    if (!Array.isArray(this.db.wallet_transactions)) {
      this.db.wallet_transactions = [];
    }
    if (userId) {
      return this.db.wallet_transactions.filter((tx) => tx.user_id === userId);
    }
    return this.db.wallet_transactions;
  }

  public findWalletTransactionById(id: string): WalletTransaction | undefined {
    return this.db.wallet_transactions.find((tx) => tx.id === id);
  }

  public findWalletTransactionByPaymentId(paymentId: string): WalletTransaction | undefined {
    return this.db.wallet_transactions.find((tx) => tx.payment_id === paymentId && tx.status === 'SUCCESS');
  }

  public findWalletTransactionByGatewayPaymentId(gatewayPaymentId: string): WalletTransaction | undefined {
    return this.db.wallet_transactions.find((tx) => tx.gateway_payment_id === gatewayPaymentId && tx.status === 'SUCCESS');
  }

  public createWalletTransaction(tx: WalletTransaction): WalletTransaction {
    if (!Array.isArray(this.db.wallet_transactions)) {
      this.db.wallet_transactions = [];
    }
    this.db.wallet_transactions.unshift(tx);
    this.save();
    return tx;
  }

  /**
   * Credit customer wallet atomically and record an ADD_FUNDS transaction.
   * Guarantees that wallet balance is updated strictly in the backend database.
   */
  public creditWallet(
    userId: string,
    amount: number,
    meta: {
      description: string;
      paymentId?: string;
      gatewayPaymentId?: string;
      gatewayOrderId?: string;
      status?: WalletTransactionStatus;
    }
  ): { newBalance: number; transaction: WalletTransaction } {
    const user = this.findUserById(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const currentBalance = typeof user.wallet_balance === 'number' && !isNaN(user.wallet_balance)
      ? user.wallet_balance
      : 0;
    const roundedAmount = Math.max(0, Math.round(amount * 100) / 100);
    const newBalance = Math.round((currentBalance + roundedAmount) * 100) / 100;

    const tx: WalletTransaction = {
      id: `wtx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      user_id: userId,
      type: 'ADD_FUNDS',
      amount: roundedAmount,
      balance_before: currentBalance,
      balance_after: newBalance,
      description: meta.description,
      payment_id: meta.paymentId || null,
      gateway_payment_id: meta.gatewayPaymentId || null,
      gateway_order_id: meta.gatewayOrderId || null,
      campaign_id: null,
      status: meta.status || 'SUCCESS',
      created_at: new Date().toISOString(),
    };

    user.wallet_balance = newBalance;
    user.updated_at = new Date().toISOString();
    this.createWalletTransaction(tx);
    this.save();

    this.log('PAYMENT', 'INFO', `Credited ₹${roundedAmount} to wallet for user ${userId}. New balance: ₹${newBalance}`, {
      userId,
      amount: roundedAmount,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      txId: tx.id,
      paymentId: meta.paymentId,
    });

    return { newBalance, transaction: tx };
  }

  /**
   * Deduct funds atomically from customer wallet for a campaign launch/payment.
   * Never trusts client-side assertions. Verifies sufficient funds in database.
   */
  public deductWallet(
    userId: string,
    amount: number,
    meta: {
      description: string;
      campaignId?: string;
    }
  ): { newBalance: number; transaction: WalletTransaction } {
    const user = this.findUserById(userId);
    if (!user) {
      throw new Error(`User ${userId} not found`);
    }

    const currentBalance = typeof user.wallet_balance === 'number' && !isNaN(user.wallet_balance)
      ? user.wallet_balance
      : 0;
    const roundedAmount = Math.max(0, Math.round(amount * 100) / 100);

    if (currentBalance < roundedAmount) {
      throw new Error(`Insufficient balance. Please Add Funds to continue. Current balance: ₹${currentBalance}, Required: ₹${roundedAmount}`);
    }

    const newBalance = Math.round((currentBalance - roundedAmount) * 100) / 100;

    const tx: WalletTransaction = {
      id: `wtx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      user_id: userId,
      type: 'CAMPAIGN_PAYMENT',
      amount: roundedAmount,
      balance_before: currentBalance,
      balance_after: newBalance,
      description: meta.description,
      payment_id: null,
      gateway_payment_id: null,
      gateway_order_id: null,
      campaign_id: meta.campaignId || null,
      status: 'SUCCESS',
      created_at: new Date().toISOString(),
    };

    user.wallet_balance = newBalance;
    user.updated_at = new Date().toISOString();
    this.createWalletTransaction(tx);
    this.save();

    this.log('PAYMENT', 'INFO', `Deducted ₹${roundedAmount} from wallet for user ${userId}. New balance: ₹${newBalance}`, {
      userId,
      amount: roundedAmount,
      balanceBefore: currentBalance,
      balanceAfter: newBalance,
      campaignId: meta.campaignId,
      txId: tx.id,
    });

    return { newBalance, transaction: tx };
  }

  /**
   * Record a failed or cancelled payment attempt in transaction ledger for transparency,
   * without affecting the customer's wallet balance.
   */
  public recordFailedWalletTransaction(
    userId: string,
    amount: number,
    meta: {
      description: string;
      paymentId?: string;
      gatewayPaymentId?: string;
      failureReason?: string;
    }
  ): WalletTransaction {
    const currentBalance = this.getWalletBalance(userId);
    const tx: WalletTransaction = {
      id: `wtx_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
      user_id: userId,
      type: 'FAILED_PAYMENT',
      amount: Math.max(0, Math.round(amount * 100) / 100),
      balance_before: currentBalance,
      balance_after: currentBalance,
      description: meta.failureReason
        ? `${meta.description} (Reason: ${meta.failureReason})`
        : meta.description,
      payment_id: meta.paymentId || null,
      gateway_payment_id: meta.gatewayPaymentId || null,
      gateway_order_id: null,
      campaign_id: null,
      status: 'FAILED',
      created_at: new Date().toISOString(),
    };

    this.createWalletTransaction(tx);
    return tx;
  }

  /**
   * Aggregates platform wallet statistics and customer ledgers for Admin overview.
   */
  public getAdminWalletOverview() {
    const users = this.getUsers().filter((u) => u && u.role !== 'admin');
    const transactions = this.getWalletTransactions();

    let totalPlatformBalance = 0;
    let totalFundsAdded = 0;
    let totalFundsUsed = 0;

    const customers = users.map((u) => {
      const balance = typeof u.wallet_balance === 'number' && !isNaN(u.wallet_balance) ? u.wallet_balance : 0;
      totalPlatformBalance += balance;

      const userTxs = transactions.filter((tx) => tx.user_id === u.id);
      const added = userTxs
        .filter((tx) => tx.type === 'ADD_FUNDS' && tx.status === 'SUCCESS')
        .reduce((sum, tx) => sum + tx.amount, 0);
      const used = userTxs
        .filter((tx) => tx.type === 'CAMPAIGN_PAYMENT' && tx.status === 'SUCCESS')
        .reduce((sum, tx) => sum + tx.amount, 0);

      totalFundsAdded += added;
      totalFundsUsed += used;

      const lastTx = userTxs[0];

      return {
        userId: u.id,
        name: u.name,
        email: u.email,
        phone: u.phone,
        currentBalance: Math.round(balance * 100) / 100,
        totalFundsAdded: Math.round(added * 100) / 100,
        totalFundsUsed: Math.round(used * 100) / 100,
        transactionsCount: userTxs.length,
        lastActivityAt: lastTx ? lastTx.created_at : u.created_at,
      };
    });

    return {
      summary: {
        totalPlatformBalance: Math.round(totalPlatformBalance * 100) / 100,
        totalFundsAdded: Math.round(totalFundsAdded * 100) / 100,
        totalFundsUsed: Math.round(totalFundsUsed * 100) / 100,
        totalTransactions: transactions.length,
      },
      customers,
      transactions,
    };
  }
}

export const db = new DatabaseService();
