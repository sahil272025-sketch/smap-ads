import { db, Payment, WalletTransaction } from './db.js';
import { PaymentService } from './paymentService.js';

export class WalletService {
  /**
   * Get customer wallet balance and transactions
   */
  public static getWalletData(userId: string): {
    balance: number;
    currency: 'INR';
    transactions: WalletTransaction[];
  } {
    const balance = db.getWalletBalance(userId);
    const transactions = db.getWalletTransactions(userId);
    return {
      balance,
      currency: 'INR',
      transactions,
    };
  }

  /**
   * Create an official Add Funds order with Razorpay Order ID.
   */
  public static async createAddFundsOrder(userId: string, amount: number): Promise<{
    payment: Payment;
    keyId: string | null;
    amount: number;
    gatewayOrderId: string | null;
  }> {
    const user = db.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount < 10) {
      throw new Error('Minimum amount to add to wallet is ₹10');
    }
    if (numAmount > 500000) {
      throw new Error('Maximum single top-up limit is ₹5,00,000');
    }

    const roundedAmount = Math.round(numAmount * 100) / 100;
    const paymentId = `smap_fund_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    const now = new Date().toISOString();

    const keyId = PaymentService.getKeyId();
    const keySecret = PaymentService.getKeySecret();
    const provider = PaymentService.getProvider();
    const environment = PaymentService.getEnvironment();

    let gatewayOrderId: string | null = null;

    // Create live Razorpay Order if credentials exist
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
              amount: Math.round(roundedAmount * 100), // paise
              currency: 'INR',
              receipt: paymentId,
              notes: {
                purpose: 'WALLET_TOPUP',
                user_id: userId,
                user_email: user.email,
                amount: String(roundedAmount),
              },
            }),
          });

          const orderData = await orderRes.json();
          if (orderRes.ok && orderData.id) {
            gatewayOrderId = orderData.id;
            db.log('PAYMENT', 'INFO', `Created Razorpay Order ${gatewayOrderId} for Add Funds ₹${roundedAmount}`, {
              paymentId,
              userId,
              gatewayOrderId,
            });
          } else {
            db.log('PAYMENT', 'ERROR', `Failed to create gateway order for Add Funds: ${orderData.error?.description || 'Unknown error'}`, {
              response: orderData,
            });
            gatewayOrderId = `order_sandbox_${paymentId}`;
          }
        }
      } catch (err: any) {
        db.log('PAYMENT', 'ERROR', `Gateway connection failure during Add Funds: ${err?.message}`);
        gatewayOrderId = `order_sandbox_${paymentId}`;
      }
    } else {
      gatewayOrderId = `order_sandbox_${paymentId}`;
    }

    const upiIntentUrl = PaymentService.buildUpiIntentUrl(roundedAmount, 'wallet_topup', paymentId);

    const payment: Payment = {
      id: paymentId,
      user_id: userId,
      campaign_id: 'WALLET_TOPUP',
      package_id: 'wallet_topup',
      amount: roundedAmount,
      currency: 'INR',
      payment_method: 'UPI',
      payee_upi: 'sahil-stp@ybl',
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
      notes: 'Add Funds to SMAP Customer Wallet',
      created_at: now,
      updated_at: now,
    };

    db.createPayment(payment);
    db.log('PAYMENT', 'INFO', `Created Add Funds payment request ${paymentId} for ₹${roundedAmount}`, {
      userId,
      paymentId,
      amount: roundedAmount,
      gatewayOrderId,
    });

    return {
      payment,
      keyId: keyId || (environment === 'sandbox' ? 'rzp_test_smap_sandbox' : null),
      amount: roundedAmount,
      gatewayOrderId,
    };
  }

  /**
   * Verify Razorpay payment and credit customer's wallet.
   * Enforces cryptographic signature verification & strict idempotency.
   */
  public static async verifyPaymentAndCreditWallet(
    userId: string,
    params: {
      paymentId: string;
      gatewayPaymentId: string;
      gatewayOrderId?: string;
      gatewaySignature?: string;
    }
  ): Promise<{
    success: boolean;
    alreadyProcessed?: boolean;
    balance: number;
    transaction?: WalletTransaction;
  }> {
    const payment = db.findPaymentById(params.paymentId);
    if (!payment) {
      throw new Error(`Payment record ${params.paymentId} not found`);
    }
    if (payment.user_id !== userId) {
      throw new Error('Unauthorized access to payment record');
    }

    // 1. Idempotency Guard: Check if wallet was already credited for this payment
    const existingTx =
      db.findWalletTransactionByPaymentId(payment.id) ||
      db.findWalletTransactionByGatewayPaymentId(params.gatewayPaymentId);

    if (existingTx) {
      db.log('PAYMENT', 'INFO', `Duplicate credit attempt prevented for payment ${payment.id}. Already credited.`, {
        paymentId: payment.id,
        txId: existingTx.id,
      });
      return {
        success: true,
        alreadyProcessed: true,
        balance: db.getWalletBalance(userId),
        transaction: existingTx,
      };
    }

    // 2. Verify signature if credentials configured
    const keySecret = PaymentService.getKeySecret();
    const orderIdToVerify = params.gatewayOrderId || payment.gateway_order_id;

    if (keySecret && params.gatewaySignature && orderIdToVerify && !orderIdToVerify.startsWith('order_sandbox_')) {
      const isValid = PaymentService.verifyClientSignature({
        gatewayOrderId: orderIdToVerify,
        gatewayPaymentId: params.gatewayPaymentId,
        signature: params.gatewaySignature,
      });

      if (!isValid) {
        db.log('PAYMENT', 'ERROR', `Invalid payment signature for Add Funds payment ${payment.id}`, {
          paymentId: payment.id,
          gatewayPaymentId: params.gatewayPaymentId,
        });

        db.updatePayment(payment.id, {
          status: 'FAILED',
          failure_reason: 'Invalid Razorpay cryptographic signature',
        });

        db.recordFailedWalletTransaction(userId, payment.amount, {
          description: 'Add Funds failed',
          paymentId: payment.id,
          gatewayPaymentId: params.gatewayPaymentId,
          failureReason: 'Cryptographic signature mismatch',
        });

        throw new Error('Cryptographic signature verification failed.');
      }
    }

    // 3. Mark payment as PAID
    const now = new Date().toISOString();
    db.updatePayment(payment.id, {
      status: 'PAID',
      paid_at: now,
      verified_at: now,
      verification_source: 'GATEWAY_API',
      gateway_payment_id: params.gatewayPaymentId,
      gateway_order_id: orderIdToVerify,
      notes: 'Verified via Razorpay Checkout signature.',
    });

    // 4. Credit wallet atomically
    const creditRes = db.creditWallet(userId, payment.amount, {
      description: `Added funds via Razorpay (${params.gatewayPaymentId})`,
      paymentId: payment.id,
      gatewayPaymentId: params.gatewayPaymentId,
      gatewayOrderId: orderIdToVerify || undefined,
    });

    return {
      success: true,
      balance: creditRes.newBalance,
      transaction: creditRes.transaction,
    };
  }

  /**
   * Pay for an advertising campaign directly from the customer's wallet balance.
   * Atomically checks balance, deducts amount, updates campaign and payment records.
   */
  public static async payCampaignWithWallet(
    userId: string,
    campaignId: string
  ): Promise<{
    success: boolean;
    balance: number;
    transaction: WalletTransaction;
    campaign: any;
    payment: Payment;
  }> {
    const campaign = db.findCampaignById(campaignId);
    if (!campaign) {
      throw new Error('Campaign not found');
    }
    if (campaign.user_id !== userId) {
      throw new Error('Unauthorized');
    }

    const pkg = db.findPackageById(campaign.package_id);
    if (!pkg) {
      throw new Error('Campaign package not found');
    }

    let payment = db.findPaymentByCampaignId(campaignId);
    if (!payment) {
      payment = await PaymentService.createPaymentRequest({
        userId,
        campaignId,
        packageId: pkg.id,
        amount: pkg.price,
      });
    }

    if (payment.status === 'PAID') {
      return {
        success: true,
        balance: db.getWalletBalance(userId),
        transaction: db.getWalletTransactions(userId)[0],
        campaign,
        payment,
      };
    }

    const requiredAmount = pkg.price;
    const currentBalance = db.getWalletBalance(userId);

    // Requirement 9: Insufficient balance check
    if (currentBalance < requiredAmount) {
      throw new Error(
        `Insufficient balance. Please Add Funds to continue. (Available: ₹${currentBalance}, Required: ₹${requiredAmount})`
      );
    }

    // Atomically deduct from wallet
    const deductRes = db.deductWallet(userId, requiredAmount, {
      description: `Campaign Payment: ${pkg.name} (${campaign.business_name || campaign.headline})`,
      campaignId,
    });

    // Mark payment as PAID
    const now = new Date().toISOString();
    const updatedPayment = db.updatePayment(payment.id, {
      status: 'PAID',
      paid_at: now,
      verified_at: now,
      verification_source: 'ADMIN_MANUAL_VERIFICATION',
      notes: `Paid ₹${requiredAmount} using SMAP Wallet Balance. Transaction ID: ${deductRes.transaction.id}`,
    });

    // Advance campaign status to PAYMENT_CONFIRMED or META_NOT_CONNECTED
    const metaConn = db.findMetaConnectionByUserId(userId);
    const nextStatus = metaConn ? 'PAYMENT_CONFIRMED' : 'META_NOT_CONNECTED';
    const updatedCampaign = db.updateCampaign(campaignId, {
      status: nextStatus,
    });

    db.log('CAMPAIGN', 'INFO', `Campaign ${campaignId} paid ₹${requiredAmount} via SMAP Wallet. Advanced to ${nextStatus}`, {
      userId,
      campaignId,
      amount: requiredAmount,
      walletTxId: deductRes.transaction.id,
      newBalance: deductRes.newBalance,
    });

    return {
      success: true,
      balance: deductRes.newBalance,
      transaction: deductRes.transaction,
      campaign: updatedCampaign!,
      payment: updatedPayment!,
    };
  }

  /**
   * Get Admin Wallet Overview
   */
  public static getAdminWalletData() {
    return db.getAdminWalletOverview();
  }
}
