import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fetch from 'node-fetch';

const JWT_SECRET = process.env.JWT_SECRET || 'smap_production_secure_jwt_secret_key_2026';
const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'sandbox_test_webhook_secret';
const BASE_URL = 'http://localhost:3000';

async function runComprehensiveWalletTest() {
  console.log('====================================================');
  console.log('--- STARTING COMPREHENSIVE WALLET & UPI VERIFICATION ---');
  console.log('====================================================\n');

  // Register fresh customer user
  const testId = Date.now();
  const testEmail = `sahil_wallet_${testId}@gmail.com`;
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Sahil Test User',
      email: testEmail,
      password: 'Password123!@#',
    }),
  });
  const regData: any = await regRes.json();
  if (!regData.user || !regData.token) {
    throw new Error('Failed to register test user: ' + JSON.stringify(regData));
  }
  const customer = regData.user;
  const customerToken = regData.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${customerToken}`,
  };

  // ----------------------------------------------------
  // TEST 1: Starting wallet = ₹0, Select Add Funds ₹1, Cancel payment -> Expected wallet = ₹0
  // ----------------------------------------------------
  console.log('--- TEST 1: Add Funds ₹1 and Cancel (No Payment) ---');
  const balRes0 = await fetch(`${BASE_URL}/api/wallet/balance`, { headers: authHeaders });
  const balData0: any = await balRes0.json();
  console.log('Initial wallet balance:', balData0.balance);
  if (balData0.balance !== 0) throw new Error(`Initial balance is not 0 (got ${balData0.balance})`);

  // Create Add Funds order for ₹1
  const addRes1 = await fetch(`${BASE_URL}/api/wallet/add-funds`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ amount: 1 }),
  });
  const addData1: any = await addRes1.json();
  console.log('Created ₹1 Add Funds order:', {
    paymentId: addData1.payment?.id,
    amount: addData1.amount,
    keyId: addData1.keyId,
  });
  if (!addData1.payment || addData1.amount !== 1) {
    throw new Error('Failed to create ₹1 Add Funds order');
  }

  // Customer closes Razorpay popup or cancels payment without completing it
  // Verify wallet balance remains exactly ₹0!
  const balRes1 = await fetch(`${BASE_URL}/api/wallet/balance`, { headers: authHeaders });
  const balData1: any = await balRes1.json();
  console.log('Wallet balance after cancellation:', balData1.balance);
  if (balData1.balance !== 0) {
    throw new Error(`SECURITY BREACH: Balance was credited without payment! (balance = ₹${balData1.balance})`);
  }
  console.log('>>> PASSED TEST 1: Balance remained strictly ₹0 after cancelling payment.\n');

  // ----------------------------------------------------
  // TEST 2: Starting wallet = ₹0, Add Funds ₹1, Real UPI payment captured -> Expected wallet = ₹1
  // ----------------------------------------------------
  console.log('--- TEST 2: Add Funds ₹1, Real Payment Verification ---');
  const paymentId2 = addData1.payment.id;
  const gatewayOrderId2 = addData1.gatewayOrderId || `order_live_${paymentId2}`;
  const gatewayPaymentId2 = `pay_upi_live_${Date.now()}`;

  const webhookBody2 = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: gatewayPaymentId2,
          order_id: gatewayOrderId2,
          amount: 100, // 100 paise = ₹1.00
          currency: 'INR',
          method: 'upi',
          receipt: paymentId2,
          acquirer_data: {
            rrn: '778899001122',
            upi_transaction_id: 'UPI1122334455',
          },
        },
      },
    },
  };

  const rawPayload2 = JSON.stringify(webhookBody2);
  const sig2 = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawPayload2).digest('hex');

  const whRes2 = await fetch(`${BASE_URL}/api/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': sig2,
    },
    body: rawPayload2,
  });
  const whData2: any = await whRes2.json();
  console.log('Razorpay verified webhook response:', whData2);
  if (!whData2.success || whData2.status !== 'PAID') {
    throw new Error('Webhook processing failed: ' + JSON.stringify(whData2));
  }

  // Verify wallet balance is now EXACTLY ₹1
  const balRes2 = await fetch(`${BASE_URL}/api/wallet/balance`, { headers: authHeaders });
  const balData2: any = await balRes2.json();
  console.log('Wallet balance after verified ₹1 payment:', balData2.balance);
  if (balData2.balance !== 1) {
    throw new Error(`Expected balance ₹1, but got ₹${balData2.balance}`);
  }
  console.log('>>> PASSED TEST 2: Wallet balance is now exactly ₹1 after verified UPI payment.\n');

  // ----------------------------------------------------
  // TEST 3: Duplicate webhook sent again -> Must not be credited twice
  // ----------------------------------------------------
  console.log('--- TEST 3: Webhook Idempotency Check (Duplicate Delivery) ---');
  const whDupRes = await fetch(`${BASE_URL}/api/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': sig2,
    },
    body: rawPayload2,
  });
  const whDupData: any = await whDupRes.json();
  console.log('Duplicate webhook response:', whDupData);
  if (!whDupData.duplicate && whDupData.status !== 'PAID') {
    throw new Error('Idempotency guard failed');
  }

  // Verify wallet balance is STILL ₹1 (NOT ₹2)
  const balRes3 = await fetch(`${BASE_URL}/api/wallet/balance`, { headers: authHeaders });
  const balData3: any = await balRes3.json();
  console.log('Wallet balance after duplicate webhook:', balData3.balance);
  if (balData3.balance !== 1) {
    throw new Error(`SECURITY BREACH: Double-credit occurred! Balance is ₹${balData3.balance} instead of ₹1`);
  }
  console.log('>>> PASSED TEST 3: Duplicate webhook ignored, wallet balance remained strictly ₹1.\n');

  // ----------------------------------------------------
  // TEST 4: Create ₹200 campaign with wallet balance ₹1 -> Insufficient balance error, ₹1 must not be used
  // ----------------------------------------------------
  console.log('--- TEST 4: Create ₹200 campaign with ₹1 balance (Insufficient Balance Guard) ---');
  const cmpRes4 = await fetch(`${BASE_URL}/api/campaigns`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      packageId: 'pkg_starter_200', // ₹200
      creativeUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
      creativeType: 'image',
      businessName: 'Sahil Test Business',
      primaryText: 'Test campaign',
      headline: 'Starter Ad',
      destinationType: 'website',
      destinationUrl: 'https://example.com',
      targeting: { country: 'India', state: 'All', city: 'All', min_age: 18, max_age: 65, gender: 'ALL', interests: [] },
    }),
  });
  const cmpData4: any = await cmpRes4.json();
  if (!cmpData4.campaign || cmpData4.payment?.amount !== 200) {
    throw new Error('Failed to create ₹200 campaign: ' + JSON.stringify(cmpData4));
  }
  const campaignId4 = cmpData4.campaign.id;
  console.log(`Created draft campaign ${campaignId4} with cost ₹200.`);

  // Attempt to pay ₹200 from wallet when balance is only ₹1
  const payCmpRes4 = await fetch(`${BASE_URL}/api/wallet/pay-campaign`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ campaignId: campaignId4 }),
  });
  const payCmpData4: any = await payCmpRes4.json();
  console.log('Insufficient balance rejection response:', payCmpData4);
  if (payCmpRes4.status !== 400 || !payCmpData4.error?.includes('Insufficient balance')) {
    throw new Error('Expected insufficient balance error, but got: ' + JSON.stringify(payCmpData4));
  }

  // Ensure balance remains ₹1 and was not touched
  const balRes4 = await fetch(`${BASE_URL}/api/wallet/balance`, { headers: authHeaders });
  const balData4: any = await balRes4.json();
  if (balData4.balance !== 1) {
    throw new Error(`Balance was altered on rejected transaction: ₹${balData4.balance}`);
  }
  console.log('>>> PASSED TEST 4: Insufficient balance rejected properly, ₹1 balance untouched.\n');

  // ----------------------------------------------------
  // TEST 5: Top up wallet to ₹200, pay ₹200 campaign -> ₹200 deducted, wallet becomes ₹0
  // ----------------------------------------------------
  console.log('--- TEST 5: Top up ₹199 to reach ₹200, pay ₹200 campaign -> Wallet becomes ₹0 ---');
  // Add ₹199 to wallet (1 + 199 = 200)
  const addRes5 = await fetch(`${BASE_URL}/api/wallet/add-funds`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ amount: 199 }),
  });
  const addData5: any = await addRes5.json();
  const paymentId5 = addData5.payment.id;
  const gatewayOrderId5 = addData5.gatewayOrderId || `order_live_${paymentId5}`;
  const gatewayPaymentId5 = `pay_upi_live_${Date.now()}_5`;

  // Deliver verified webhook for ₹199
  const webhookBody5 = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: gatewayPaymentId5,
          order_id: gatewayOrderId5,
          amount: 19900, // 19900 paise = ₹199.00
          currency: 'INR',
          method: 'upi',
          receipt: paymentId5,
          acquirer_data: { rrn: '998877665544', upi_transaction_id: 'UPI5566778899' },
        },
      },
    },
  };
  const rawPayload5 = JSON.stringify(webhookBody5);
  const sig5 = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawPayload5).digest('hex');
  await fetch(`${BASE_URL}/api/payments/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': sig5 },
    body: rawPayload5,
  });

  // Verify wallet is now ₹200
  const balRes5a = await fetch(`${BASE_URL}/api/wallet/balance`, { headers: authHeaders });
  const balData5a: any = await balRes5a.json();
  console.log('Wallet balance before paying campaign:', balData5a.balance);
  if (balData5a.balance !== 200) {
    throw new Error(`Expected balance ₹200, but got ₹${balData5a.balance}`);
  }

  // Pay ₹200 campaign using wallet
  const payCmpRes5 = await fetch(`${BASE_URL}/api/wallet/pay-campaign`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ campaignId: campaignId4 }),
  });
  const payCmpData5: any = await payCmpRes5.json();
  console.log('Campaign payment response:', {
    success: payCmpData5.success,
    remainingBalance: payCmpData5.balance,
    campaignStatus: payCmpData5.campaign?.status,
  });
  if (!payCmpData5.success || payCmpData5.balance !== 0) {
    throw new Error(`Expected balance ₹0 after ₹200 payment, but got ₹${payCmpData5.balance}`);
  }
  console.log('>>> PASSED TEST 5: ₹200 deducted from wallet, remaining balance is exactly ₹0.00.\n');

  // ----------------------------------------------------
  // TEST 6: Create ₹200 campaign with ₹0 wallet -> Choose direct payment -> Razorpay Checkout opens with ₹200
  // ----------------------------------------------------
  console.log('--- TEST 6: Direct ₹200 Campaign Payment via Razorpay Checkout ---');
  const cmpRes6 = await fetch(`${BASE_URL}/api/campaigns`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      packageId: 'pkg_starter_200', // ₹200
      creativeUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
      creativeType: 'image',
      businessName: 'Sahil Direct Pay Business',
      primaryText: 'Direct UPI Campaign',
      headline: 'Direct Pay Ad',
      destinationType: 'website',
      destinationUrl: 'https://example.com',
      targeting: { country: 'India', state: 'All', city: 'All', min_age: 18, max_age: 65, gender: 'ALL', interests: [] },
    }),
  });
  const cmpData6: any = await cmpRes6.json();
  const directPayment = cmpData6.payment;
  console.log('Direct Campaign Payment Details:', {
    paymentId: directPayment.id,
    amount: directPayment.amount,
    currency: directPayment.currency,
    upi_intent_url: directPayment.upi_intent_url,
  });
  if (directPayment.amount !== 200) {
    throw new Error(`Direct payment amount expected 200, got ${directPayment.amount}`);
  }

  // Check prepare-order endpoint
  const prepRes = await fetch(`${BASE_URL}/api/payments/${directPayment.id}/prepare-order`, {
    method: 'POST',
    headers: authHeaders,
  });
  const prepData: any = await prepRes.json();
  console.log('Prepared order for direct checkout:', {
    paymentId: prepData.payment?.id,
    amount: prepData.payment?.amount,
    gateway_key_id: prepData.payment?.gateway_key_id,
  });

  // Simulate direct customer payment via Razorpay UPI & Webhook
  const directGatewayPayId = `pay_direct_upi_${Date.now()}`;
  const directWebhookBody = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: directGatewayPayId,
          order_id: prepData.payment?.gateway_order_id,
          amount: 20000, // 20000 paise = ₹200
          currency: 'INR',
          method: 'upi',
          receipt: directPayment.id,
          acquirer_data: { rrn: '334455667788', upi_transaction_id: 'UPI9900112233' },
        },
      },
    },
  };
  const rawDirectPayload = JSON.stringify(directWebhookBody);
  const directSig = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawDirectPayload).digest('hex');
  const directWhRes = await fetch(`${BASE_URL}/api/payments/webhook`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': directSig },
    body: rawDirectPayload,
  });
  const directWhData: any = await directWhRes.json();
  console.log('Direct payment webhook confirmation:', directWhData);
  if (!directWhData.success || directWhData.status !== 'PAID') {
    throw new Error('Direct payment confirmation failed');
  }

  // Verify campaign is now confirmed and wallet balance is STILL ₹0 (not altered)
  const finalBalRes = await fetch(`${BASE_URL}/api/wallet/balance`, { headers: authHeaders });
  const finalBalData: any = await finalBalRes.json();
  console.log('Final wallet balance after direct payment:', finalBalData.balance);
  if (finalBalData.balance !== 0) {
    throw new Error(`Wallet balance should remain ₹0, but was ₹${finalBalData.balance}`);
  }
  console.log('>>> PASSED TEST 6: Direct ₹200 campaign payment completed successfully!\n');

  console.log('====================================================');
  console.log('--- ALL 6 TEST SCENARIOS PASSED WITH 100% SUCCESS ---');
  console.log('====================================================');
}

runComprehensiveWalletTest().catch((err) => {
  console.error('\nTEST SUITE FAILED:', err);
  process.exit(1);
});
