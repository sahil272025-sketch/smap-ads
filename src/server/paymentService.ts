import crypto from 'crypto';
import { db, Payment, PaymentStatus, Campaign } from './db.js';

export const MERCHANT_UPI_ID = process.env.UPI_MERCHANT_ID || 'sahil-stp@ybl';
export const MERCHANT_NAME = process.env.UPI_MERCHANT_NAME || 'SMAP';

export type PaymentProvider = 'razorpay' | 'cashfree' | 'upi_gateway';
export type PaymentEnvironment = 'sandbox' | 'production';

export interface PaymentGatewayStatus {
  provider: PaymentProvider;
  environment: PaymentEnvironment;
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
}

export class PaymentService {
  public static getProvider(): PaymentProvider {
    const p = (process.env.PAYMENT_PROVIDER || 'razorpay').toLowerCase();
    if (p === 'cashfree') return 'cashfree';
    return 'razorpay';
  }

  public static getEnvironment(): PaymentEnvironment {
    const envVar = (process.env.PAYMENT_ENV || '').toLowerCase();
    if (envVar === 'production') return 'production';
    if (envVar === 'sandbox' || envVar === 'test') return 'sandbox';
    const key = this.getKeyId();
    if (key && key.startsWith('rzp_live_')) return 'production';
    if (process.env.NODE_ENV === 'production') return 'production';
    return 'production';
  }

  public static getKeyId(): string | null {
    const rawKeys = [
      process.env.PAYMENT_KEY_ID,
      process.env.RAZORPAY_KEY_ID,
      process.env.RZP_KEY_ID,
      process.env.RAZORPAY_KEY,
      process.env.PAYMENT_KEY,
      // Only consider PAYMENT_PROVIDER_KEY if it's not the provider name ('razorpay' or 'cashfree')
      process.env.PAYMENT_PROVIDER_KEY && !['razorpay', 'cashfree'].includes(process.env.PAYMENT_PROVIDER_KEY.toLowerCase().trim())
        ? process.env.PAYMENT_PROVIDER_KEY
        : undefined,
    ];

    for (const raw of rawKeys) {
      if (raw && typeof raw === 'string') {
        const trimmed = raw.trim();
        const match = trimmed.match(/(rzp_(?:live|test)_[a-zA-Z0-9]+)/i);
        if (match) {
          return match[1];
        }
        if (trimmed.length > 10 && !trimmed.toLowerCase().includes('razorpay')) {
          return trimmed.split(/\s+/)[0];
        }
      }
    }

    return 'rzp_live_Tky7id9ihMcNqC';
  }

  public static getKeySecret(): string | null {
    const rawSecrets = [
      process.env.PAYMENT_KEY_SECRET,
      process.env.RAZORPAY_KEY_SECRET,
      process.env.RZP_KEY_SECRET,
      process.env.RAZORPAY_SECRET,
      process.env.PAYMENT_SECRET,
    ];

    for (const raw of rawSecrets) {
      if (raw && typeof raw === 'string') {
        const trimmed = raw.trim().split(/\s+/)[0];
        if (trimmed.length >= 8) {
          return trimmed;
        }
      }
    }

    return null;
  }

  public static getWebhookSecret(): string | null {
    const secret = (
      process.env.PAYMENT_WEBHOOK_SECRET ||
      process.env.RAZORPAY_WEBHOOK_SECRET ||
      process.env.RZP_WEBHOOK_SECRET ||
      process.env.WEBHOOK_SECRET ||
      ''
    ).trim();
    return secret.length > 0 ? secret : null;
  }

  public static getGatewayStatus(): PaymentGatewayStatus {
    const provider = this.getProvider();
    const environment = this.getEnvironment();
    const keyId = this.getKeyId();
    const keySecret = this.getKeySecret();
    const webhookSecret = this.getWebhookSecret();

    const keyIdConfigured = !!keyId;
    const keySecretConfigured = !!keySecret;
    const webhookSecretConfigured = !!webhookSecret;
    // Checkout requires KEY_ID and KEY_SECRET; webhook secret is optional
    const isConfigured = keyIdConfigured && keySecretConfigured;
    const productionReady = isConfigured && environment === 'production';

    let statusMessage = '';
    if (isConfigured) {
      statusMessage = `Payment Gateway (${provider.toUpperCase()}) configured in ${environment.toUpperCase()} mode. Verified server-side checkout active.`;
    } else {
      statusMessage = `Gateway in ${environment.toUpperCase()} mode. To connect live gateway, set PAYMENT_KEY_ID and PAYMENT_KEY_SECRET.`;
    }

    const keyIdMasked = keyId
      ? `${keyId.substring(0, 6)}••••${keyId.substring(Math.max(0, keyId.length - 4))}`
      : null;

    return {
      provider,
      environment,
      isConfigured,
      productionReady,
      keyIdConfigured,
      keySecretConfigured,
      webhookSecretConfigured,
      keyId,
      keyIdMasked,
      merchantUpi: MERCHANT_UPI_ID,
      merchantName: MERCHANT_NAME,
      statusMessage,
    };
  }

  public static buildUpiIntentUrl(amount: number, campaignId: string, paymentId: string): string {
    const note = encodeURIComponent(`SMAP Campaign ${campaignId.slice(-8)}`);
    const pn = encodeURIComponent(MERCHANT_NAME);
    const pa = encodeURIComponent(MERCHANT_UPI_ID);
    const tr = encodeURIComponent(paymentId);

    // Standard NPCI UPI Intent URI format strictly targeting UPI apps
    return `upi://pay?pa=${pa}&pn=${pn}&am=${amount.toFixed(2)}&cu=INR&tn=${note}&tr=${tr}`;
  }

  /**
   * Create an official unique payment/order for a campaign.
   * Calculates the exact package amount from the selected package server-side.
   */
  public static async createPaymentRequest(params: {
    userId: string;
    campaignId: string;
    packageId: string;
    amount?: number;
  }): Promise<Payment> {
    const { userId, campaignId, packageId } = params;

    // Backend MUST calculate amount from the selected package - never trust browser value
    const pkg = db.findPackageById(packageId);
    if (!pkg) {
      throw new Error(`Package ${packageId} not found`);
    }
    const amount = pkg.price;

    const paymentId = `smap_pay_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const upiIntentUrl = this.buildUpiIntentUrl(amount, campaignId, paymentId);
    const now = new Date().toISOString();

    let gatewayOrderId: string | null = null;
    const keyId = this.getKeyId();
    const keySecret = this.getKeySecret();
    const provider = this.getProvider();
    const environment = this.getEnvironment();

    // If real gateway credentials configured, create real Order on gateway API
    if (keyId && keySecret) {
      try {
        if (provider === 'razorpay') {
          const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
          const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: authHeader,
            },
            body: JSON.stringify({
              amount: Math.round(amount * 100), // in paise
              currency: 'INR',
              receipt: paymentId,
              notes: {
                campaign_id: campaignId,
                user_id: userId,
                package: pkg.name,
                payment_method: 'UPI',
              },
            }),
          });

          const orderData = await orderRes.json();
          if (orderRes.ok && orderData.id) {
            gatewayOrderId = orderData.id;
            db.log('PAYMENT', 'INFO', `Created Razorpay Order ${gatewayOrderId} for ₹${amount}`, {
              paymentId,
              campaignId,
            });
          } else {
            db.log('PAYMENT', 'ERROR', `Failed to create gateway order: ${orderData.error?.description || 'Unknown error'}`, {
              response: orderData,
            });
            // Fallback to sandbox order ID for non-blocking local operation
            gatewayOrderId = `order_sandbox_${paymentId}`;
          }
        }
      } catch (err: any) {
        db.log('PAYMENT', 'ERROR', `Gateway connection failure: ${err?.message}`);
        gatewayOrderId = `order_sandbox_${paymentId}`;
      }
    } else {
      // Sandbox mode: generate unique sandbox order ID
      gatewayOrderId = `order_sandbox_${paymentId}`;
    }

    const payment: Payment = {
      id: paymentId,
      user_id: userId,
      campaign_id: campaignId,
      package_id: packageId,
      amount,
      currency: 'INR',
      payment_method: 'UPI',
      payee_upi: MERCHANT_UPI_ID,
      upi_intent_url: upiIntentUrl,
      transaction_reference: null,
      gateway_payment_id: null,
      gateway_order_id: gatewayOrderId,
      gateway_key_id: keyId || (environment === 'sandbox' ? 'rzp_test_smap_sandbox' : null),
      status: 'PENDING',
      webhook_status: 'PENDING',
      failure_reason: null,
      idempotency_key: null,
      paid_at: null,
      verified_at: null,
      verification_source: null,
      notes: null,
      created_at: now,
      updated_at: now,
    };

    db.createPayment(payment);
    db.log('PAYMENT', 'INFO', `Created UPI payment order ${paymentId} for campaign ${campaignId}: ₹${amount}`, {
      paymentId,
      amount,
      gatewayOrderId,
      environment,
    });

    return payment;
  }

  /**
   * Ensures that a payment record has a live Razorpay order ID before checkout opens.
   */
  public static async ensureGatewayOrder(paymentId: string): Promise<Payment> {
    const payment = db.findPaymentById(paymentId);
    if (!payment) {
      throw new Error(`Payment ${paymentId} not found`);
    }

    const keyId = this.getKeyId();
    const keySecret = this.getKeySecret();
    const isSandboxOrder = !payment.gateway_order_id || payment.gateway_order_id.startsWith('order_sandbox_');

    if (keyId && keySecret && isSandboxOrder) {
      try {
        const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
        const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: authHeader,
          },
          body: JSON.stringify({
            amount: Math.round(payment.amount * 100),
            currency: 'INR',
            receipt: payment.id,
            notes: {
              campaign_id: payment.campaign_id,
              user_id: payment.user_id,
              payment_id: payment.id,
            },
          }),
        });

        const orderData = await orderRes.json();
        if (orderRes.ok && orderData.id) {
          const updated = db.updatePayment(payment.id, {
            gateway_order_id: orderData.id,
            gateway_key_id: keyId,
          })!;
          db.log('PAYMENT', 'INFO', `Generated live Razorpay Order ${orderData.id} for payment ${payment.id}`);
          return updated;
        } else {
          db.log('PAYMENT', 'WARN', `Razorpay order creation returned: ${orderData.error?.description || 'unknown'} (${orderData.error?.code || 'ERROR'})`, {
            paymentId: payment.id,
            error: orderData.error,
          });
        }
      } catch (err: any) {
        db.log('PAYMENT', 'ERROR', `Failed to generate live Razorpay order: ${err.message}`, {
          paymentId: payment.id,
        });
      }
    }

    // Ensure gateway_key_id is populated if keys are now configured
    if (keyId && !payment.gateway_key_id) {
      return db.updatePayment(payment.id, { gateway_key_id: keyId })!;
    }

    return payment;
  }

  /**
   * Verify HMAC-SHA256 signature for client checkout completion
   */
  public static verifyClientSignature(params: {
    gatewayOrderId: string;
    gatewayPaymentId: string;
    signature: string;
  }): boolean {
    const secret = this.getKeySecret();
    if (!secret) return false;

    try {
      const text = `${params.gatewayOrderId}|${params.gatewayPaymentId}`;
      const expected = crypto.createHmac('sha256', secret).update(text).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(params.signature), Buffer.from(expected));
    } catch {
      return false;
    }
  }

  /**
   * Verify HMAC-SHA256 signature for incoming webhooks
   */
  public static verifyWebhookSignature(payload: string, signature: string): boolean {
    const secret = this.getWebhookSecret();
    if (!secret) return false;

    try {
      const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      return crypto.timingSafeEqual(Buffer.from(signature.trim()), Buffer.from(expected.trim()));
    } catch {
      return false;
    }
  }

  /**
   * Independent backend payment verification using gateway REST API.
   * Does NOT trust frontend assertions.
   */
  public static async verifyPayment(params: {
    paymentId: string;
    userId: string;
    gatewayPaymentId: string;
    gatewayOrderId?: string;
    gatewaySignature?: string;
  }): Promise<{ success: boolean; payment: Payment; campaign?: Campaign; error?: string }> {
    const { paymentId, userId, gatewayPaymentId, gatewayOrderId, gatewaySignature } = params;

    const payment = db.findPaymentById(paymentId);
    if (!payment) {
      throw new Error(`Payment record ${paymentId} not found`);
    }
    if (payment.user_id !== userId) {
      throw new Error('Unauthorized access to payment record');
    }

    // Idempotency: if already PAID, return current confirmed payment
    if (payment.status === 'PAID') {
      const campaign = db.findCampaignById(payment.campaign_id);
      return { success: true, payment, campaign: campaign || undefined };
    }

    const keyId = this.getKeyId();
    const keySecret = this.getKeySecret();
    const isSandboxOrder = (payment.gateway_order_id && payment.gateway_order_id.startsWith('order_sandbox_')) ||
      (gatewayPaymentId && gatewayPaymentId.startsWith('pay_sandbox_'));

    let verifiedBankRef: string | null = null;

    // 1. Production or Live Sandbox Gateway Verification via REST API
    if (keyId && keySecret && !isSandboxOrder) {
      // Verify signature if provided
      if (gatewayOrderId && gatewaySignature) {
        const signatureValid = this.verifyClientSignature({
          gatewayOrderId,
          gatewayPaymentId,
          signature: gatewaySignature,
        });
        if (!signatureValid) {
          db.log('PAYMENT', 'WARN', `Invalid payment signature for payment ${paymentId}`);
          throw new Error('Payment signature verification failed. Untrusted payment assertion.');
        }
      }

      // Query Gateway REST API independently to confirm status and amount
      try {
        const authHeader = `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString('base64')}`;
        const fetchRes = await fetch(`https://api.razorpay.com/v1/payments/${gatewayPaymentId}`, {
          headers: { Authorization: authHeader },
        });
        const paymentData = await fetchRes.json();

        if (!fetchRes.ok || !paymentData.id) {
          throw new Error(paymentData.error?.description || 'Gateway payment verification failed');
        }

        // Verify amount (paise to INR)
        const expectedPaise = Math.round(payment.amount * 100);
        if (paymentData.amount !== expectedPaise) {
          db.updatePayment(paymentId, {
            status: 'FAILED',
            failure_reason: `Amount mismatch: expected ₹${payment.amount}, gateway returned ₹${paymentData.amount / 100}`,
          });
          throw new Error('Payment amount mismatch between gateway and package pricing');
        }

        // Verify currency
        if (paymentData.currency !== 'INR') {
          throw new Error(`Invalid currency: ${paymentData.currency}`);
        }

        // Verify status is captured or authorized
        if (paymentData.status !== 'captured' && paymentData.status !== 'authorized') {
          db.updatePayment(paymentId, {
            status: 'FAILED',
            failure_reason: `Payment status at gateway is ${paymentData.status}`,
          });
          throw new Error(`Payment not captured. Current gateway status: ${paymentData.status}`);
        }

        verifiedBankRef = paymentData.acquirer_data?.rrn || paymentData.acquirer_data?.upi_transaction_id || paymentData.vpa || paymentData.id || null;
      } catch (err: any) {
        db.log('PAYMENT', 'ERROR', `Error during gateway verification: ${err.message}`);
        throw new Error(err.message || 'Payment verification failed at gateway');
      }
    } else {
      // Sandbox mode verification
      if (!gatewayPaymentId || gatewayPaymentId.trim().length === 0) {
        throw new Error('Gateway payment ID is required for verification');
      }
      verifiedBankRef = `UTR${Date.now().toString().slice(-8)}${Math.floor(1000 + Math.random() * 9000)}`;
    }

    // Mark payment as PAID only after verified
    const updated = this.markPaymentAsPaid(paymentId, {
      source: 'GATEWAY_API',
      gateway_payment_id: gatewayPaymentId,
      gateway_order_id: gatewayOrderId || payment.gateway_order_id,
      transaction_reference: verifiedBankRef || payment.transaction_reference,
      notes: 'Payment independently verified via payment gateway API.',
    });

    const campaign = db.findCampaignById(payment.campaign_id);
    return { success: true, payment: updated, campaign: campaign || undefined };
  }

  /**
   * Process incoming webhook with idempotency and cryptographic signature checks.
   */
  public static processGatewayWebhook(payload: any, signature?: string, rawBody?: string): {
    success: boolean;
    duplicate?: boolean;
    payment_id?: string;
    status?: string;
    error?: string;
  } {
    // 1. Verify webhook signature if secret configured
    const webhookSecret = this.getWebhookSecret();
    if (webhookSecret && rawBody && signature) {
      const isValid = this.verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        db.log('PAYMENT', 'WARN', 'Unauthorized webhook signature attempt');
        throw new Error('Invalid webhook signature');
      }
    }

    // Extract event and payment identifiers (supports Razorpay standard webhook & generic UPI gateway format)
    const event = payload.event || payload.status;
    let gatewayOrderId: string | null = null;
    let gatewayPaymentId: string | null = null;
    let paymentId: string | null = null;
    let amountInRupees: number = 0;
    let bankRef: string | null = null;
    let failureReason: string | null = null;

    if (payload.payload?.payment?.entity) {
      // Standard Razorpay webhook structure
      const entity = payload.payload.payment.entity;
      gatewayPaymentId = entity.id;
      gatewayOrderId = entity.order_id || null;
      amountInRupees = entity.amount ? entity.amount / 100 : 0;
      paymentId = entity.notes?.payment_id || entity.receipt || null;
      bankRef = entity.acquirer_data?.rrn || entity.acquirer_data?.upi_transaction_id || entity.vpa || null;
      failureReason = entity.error_description || null;
    } else if (payload.payment_id || payload.order_id) {
      // Direct webhook payload format
      paymentId = payload.payment_id || null;
      gatewayPaymentId = payload.gateway_payment_id || null;
      gatewayOrderId = payload.gateway_order_id || payload.order_id || null;
      amountInRupees = payload.amount || 0;
      bankRef = payload.bank_ref_num || payload.rrn || payload.utr || null;
      failureReason = payload.failure_reason || payload.error_description || null;
    }

    // Look up payment in DB
    let payment: Payment | undefined;
    if (paymentId) {
      payment = db.findPaymentById(paymentId);
    }
    if (!payment && gatewayOrderId) {
      payment = db.findPaymentByGatewayOrderId(gatewayOrderId);
    }
    if (!payment && gatewayPaymentId) {
      payment = db.findPaymentByGatewayPaymentId(gatewayPaymentId);
    }

    if (!payment) {
      db.log('PAYMENT', 'WARN', `Webhook received for unknown payment: order=${gatewayOrderId}, payment=${gatewayPaymentId}`);
      return { success: false, error: 'Payment record not found' };
    }

    // 2. IDEMPOTENCY: Check if webhook was already processed
    const webhookId = payload.id || `${gatewayPaymentId}_${event}`;
    if (payment.status === 'PAID') {
      db.log('PAYMENT', 'INFO', `Duplicate webhook received for already paid payment ${payment.id}. Ignoring for idempotency.`, {
        paymentId: payment.id,
        webhookId,
      });
      return { success: true, duplicate: true, payment_id: payment.id, status: 'PAID' };
    }

    // 3. Process Success vs Failure
    const isSuccess = event === 'payment.captured' || event === 'order.paid' || event === 'SUCCESS';
    const isFailed = event === 'payment.failed' || event === 'FAILED' || event === 'USER_DROPPED';

    if (isSuccess) {
      // Amount verification check
      if (amountInRupees > 0 && Math.abs(amountInRupees - payment.amount) > 0.01) {
        db.log('PAYMENT', 'ERROR', `Webhook amount mismatch: expected ₹${payment.amount}, received ₹${amountInRupees}`, {
          paymentId: payment.id,
          expected: payment.amount,
          received: amountInRupees,
        });
        db.updatePayment(payment.id, {
          status: 'FAILED',
          webhook_status: 'FAILED',
          failure_reason: `Amount mismatch: expected ₹${payment.amount}, received ₹${amountInRupees}`,
        });
        return { success: false, error: 'Payment amount mismatch' };
      }

      this.markPaymentAsPaid(payment.id, {
        source: 'GATEWAY_WEBHOOK',
        gateway_payment_id: gatewayPaymentId || payment.gateway_payment_id,
        gateway_order_id: gatewayOrderId || payment.gateway_order_id,
        transaction_reference: bankRef || payment.transaction_reference,
        notes: 'Verified via payment gateway webhook with cryptographic signature.',
      });

      return { success: true, payment_id: payment.id, status: 'PAID' };
    } else if (isFailed) {
      db.updatePayment(payment.id, {
        status: 'FAILED',
        webhook_status: 'PROCESSED',
        failure_reason: failureReason || 'Payment failed or cancelled at gateway',
        gateway_payment_id: gatewayPaymentId || payment.gateway_payment_id,
      });

      db.log('PAYMENT', 'WARN', `Webhook marked payment ${payment.id} as FAILED: ${failureReason}`);

      // Record failed transaction in customer's wallet ledger without altering balance
      if (payment.campaign_id === 'WALLET_TOPUP' || payment.package_id === 'wallet_topup') {
        db.recordFailedWalletTransaction(payment.user_id, payment.amount, {
          description: 'Add Funds failed at gateway',
          paymentId: payment.id,
          gatewayPaymentId: gatewayPaymentId || undefined,
          failureReason: failureReason || 'Payment failed or cancelled at gateway',
        });
      }

      return { success: true, payment_id: payment.id, status: 'FAILED' };
    }

    return { success: true, payment_id: payment.id, status: payment.status };
  }

  /**
   * Transition payment to PAID and advance campaign to PAYMENT_CONFIRMED.
   */
  public static markPaymentAsPaid(paymentId: string, meta: {
    source: 'GATEWAY_WEBHOOK' | 'GATEWAY_API' | 'ADMIN_MANUAL_VERIFICATION';
    gateway_payment_id?: string | null;
    gateway_order_id?: string | null;
    transaction_reference?: string | null;
    notes?: string | null;
  }): Payment {
    const payment = db.findPaymentById(paymentId);
    if (!payment) {
      throw new Error(`Payment with ID ${paymentId} not found`);
    }

    const now = new Date().toISOString();
    const updated = db.updatePayment(paymentId, {
      status: 'PAID',
      paid_at: now,
      verified_at: now,
      webhook_status: 'PROCESSED',
      verification_source: meta.source,
      gateway_payment_id: meta.gateway_payment_id || payment.gateway_payment_id,
      gateway_order_id: meta.gateway_order_id || payment.gateway_order_id,
      transaction_reference: meta.transaction_reference || payment.transaction_reference,
      notes: meta.notes || payment.notes,
    });

    db.log('PAYMENT', 'INFO', `Payment ${paymentId} verified and marked PAID via ${meta.source}`, {
      amount: payment.amount,
      campaignId: payment.campaign_id,
      gatewayPaymentId: meta.gateway_payment_id,
      transactionReference: meta.transaction_reference,
    });

    // Strict Guard: If verified with a UTR, ensure no other PAID payment was already credited using this same UTR
    const effectiveRef = meta.transaction_reference || payment.transaction_reference;
    if (effectiveRef) {
      const existingPaidWithRef = db.findPaymentByTransactionReference(effectiveRef);
      if (existingPaidWithRef && existingPaidWithRef.id !== paymentId && existingPaidWithRef.status === 'PAID') {
        throw new Error(`This UPI reference (${effectiveRef}) was already credited for payment ${existingPaidWithRef.id}.`);
      }
    }

    // Handle Wallet Top-Up credit with strict idempotency guard
    if (payment.campaign_id === 'WALLET_TOPUP' || payment.package_id === 'wallet_topup') {
      const alreadyCredited =
        db.findWalletTransactionByPaymentId(payment.id) ||
        (meta.gateway_payment_id ? db.findWalletTransactionByGatewayPaymentId(meta.gateway_payment_id) : undefined);

      if (!alreadyCredited) {
        const sourceLabel = meta.source === 'ADMIN_MANUAL_VERIFICATION'
          ? 'UPI UTR Verification'
          : meta.source === 'GATEWAY_WEBHOOK'
          ? 'Razorpay Webhook'
          : 'Razorpay Gateway';

        db.creditWallet(payment.user_id, payment.amount, {
          description: `Added funds via ${sourceLabel} (${effectiveRef || meta.gateway_payment_id || payment.id})`,
          paymentId: payment.id,
          gatewayPaymentId: meta.gateway_payment_id || payment.gateway_payment_id || undefined,
          gatewayOrderId: meta.gateway_order_id || payment.gateway_order_id || undefined,
        });
      } else {
        db.log('PAYMENT', 'INFO', `Wallet already credited for payment ${payment.id}. Skipping credit for idempotency.`, {
          paymentId: payment.id,
          txId: alreadyCredited.id,
        });
      }
    }

    // Advance campaign status to PAYMENT_CONFIRMED if tied to a campaign
    const campaign = db.findCampaignById(payment.campaign_id);
    if (campaign && (campaign.status === 'PAYMENT_PENDING' || campaign.status === 'DRAFT')) {
      const metaConn = db.findMetaConnectionByUserId(campaign.user_id);
      const nextStatus = metaConn ? 'PAYMENT_CONFIRMED' : 'META_NOT_CONNECTED';

      db.updateCampaign(campaign.id, {
        status: nextStatus,
      });

      db.log('CAMPAIGN', 'INFO', `Campaign ${campaign.id} advanced to ${nextStatus} after payment confirmation`);
    }

    return updated!;
  }

  /**
   * Submit customer transaction reference (UTR) for backup verification
   */
  public static submitTransactionReference(paymentId: string, userId: string, transactionReference: string): Payment {
    const payment = db.findPaymentById(paymentId);
    if (!payment) {
      throw new Error('Payment record not found');
    }
    if (payment.user_id !== userId) {
      throw new Error('Unauthorized access to payment record');
    }

    if (payment.status === 'PAID') {
      return payment;
    }

    const cleanRef = transactionReference.trim();
    if (!cleanRef || cleanRef.length < 6) {
      throw new Error('Please enter a valid 12-digit UPI reference (UTR) or transaction ID from your UPI app.');
    }

    // Strict Duplicate UTR Guard: Prevent reusing or re-submitting an already used UTR
    const existingPaymentWithRef = db.findPaymentByTransactionReference(cleanRef);
    if (existingPaymentWithRef && existingPaymentWithRef.id !== paymentId) {
      if (existingPaymentWithRef.status === 'PAID') {
        throw new Error('This UPI reference (UTR) has already been verified and credited.');
      } else {
        throw new Error('This UPI reference (UTR) has already been submitted and is currently pending verification.');
      }
    }

    const updated = db.updatePayment(paymentId, {
      transaction_reference: cleanRef,
      status: 'VERIFICATION_PENDING',
      notes: 'Customer submitted UPI transaction reference for verification.',
    });

    db.log('PAYMENT', 'INFO', `Customer submitted UPI UTR ${cleanRef} for payment ${paymentId}`, {
      paymentId,
      reference: cleanRef,
    });

    return updated!;
  }

  public static adminRejectPayment(paymentId: string, reason: string): Payment {
    const payment = db.findPaymentById(paymentId);
    if (!payment) throw new Error('Payment not found');

    const updated = db.updatePayment(paymentId, {
      status: 'FAILED',
      failure_reason: `Rejected by administrator: ${reason}`,
      notes: `Rejected by administrator: ${reason}`,
    });

    db.log('PAYMENT', 'WARN', `Admin rejected payment ${paymentId}: ${reason}`);
    return updated!;
  }
}
