import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fetch from 'node-fetch';

const JWT_SECRET = process.env.JWT_SECRET || 'smap_production_secure_jwt_secret_key_2026';
const KEY_SECRET = process.env.PAYMENT_KEY_SECRET || 'test_payment_key_secret_12345';
const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'test_webhook_secret_67890';
const BASE_URL = 'http://localhost:3000';

async function runSecurityTestSuite() {
  console.log('====================================================');
  console.log('🛡️  STARTING WALLET SECURITY & RAZORPAY VERIFICATION TEST SUITE');
  console.log('====================================================');

  // Register fresh unique customer user via HTTP API
  const testId = Date.now();
  const testEmail = `security_test_${testId}@example.com`;
  
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Sahil Security Tester',
      email: testEmail,
      password: 'StrongPassword123!@#',
    }),
  });
  const regData: any = await regRes.json();
  if (!regData.user || !regData.token) {
    throw new Error('Registration failed: ' + JSON.stringify(regData));
  }

  const customerToken = regData.token;
  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${customerToken}`,
  };

  // ----------------------------------------------------
  // TEST SCENARIO 1: STARTING BALANCE MUST BE ₹0
  // ----------------------------------------------------
  console.log('\n[TEST 1] Verifying initial customer wallet balance is strictly ₹0...');
  const initBalRes = await fetch(`${BASE_URL}/api/wallet/balance`, { headers: authHeaders });
  const initBalData: any = await initBalRes.json();
  console.log('  Initial balance response:', initBalData);
  if (initBalData.balance !== 0) {
    throw new Error(`FAILURE: Initial balance is ₹${initBalData.balance}, expected ₹0`);
  }
  console.log('  ✅ PASSED: Initial balance is exactly ₹0.00');

  // ----------------------------------------------------
  // TEST SCENARIO 2: CLICK +₹100 -> DO NOT PAY -> CANCEL/CLOSE RAZORPAY
  // BALANCE MUST REMAIN ₹0!
  // ----------------------------------------------------
  console.log('\n[TEST 2] Customer clicks +₹100 -> Razorpay order created -> Customer CANCELS/CLOSES checkout...');
  const orderRes = await fetch(`${BASE_URL}/api/wallet/add-funds`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ amount: 100 }),
  });
  const orderData: any = await orderRes.json();
  console.log('  Order created:', {
    paymentId: orderData.payment?.id,
    status: orderData.payment?.status,
    amount: orderData.amount,
  });

  if (!orderData.payment?.id || orderData.payment?.status !== 'PENDING') {
    throw new Error('FAILURE: Add funds order was not created in PENDING state');
  }

  // Customer closes/dismisses Razorpay without paying. No payment verification is submitted.
  // Check wallet balance:
  const cancelledBalRes = await fetch(`${BASE_URL}/api/wallet/balance`, { headers: authHeaders });
  const cancelledBalData: any = await cancelledBalRes.json();
  console.log('  Balance after cancelling Razorpay checkout:', cancelledBalData);

  if (cancelledBalData.balance !== 0) {
    throw new Error(`CRITICAL SECURITY FAILURE: Balance changed to ₹${cancelledBalData.balance} after cancelling payment!`);
  }
  console.log('  ✅ PASSED: Balance strictly remains ₹0.00 when user cancels/does not pay!');

  // ----------------------------------------------------
  // TEST SCENARIO 3: ATTEMPT FAKE/UNVERIFIED PAYMENT (FORGERY TEST)
  // MUST BE REJECTED BY SERVER
  // ----------------------------------------------------
  console.log('\n[TEST 3] Attacker attempts to forge payment verification without valid Razorpay cryptographic signature...');
  const fakeVerifyRes = await fetch(`${BASE_URL}/api/wallet/verify-payment`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      paymentId: orderData.payment.id,
      gatewayPaymentId: 'pay_fake_attacker_12345',
      gatewayOrderId: orderData.payment.gateway_order_id,
      gatewaySignature: 'fake_signature_hash_00000',
    }),
  });
  const fakeVerifyData: any = await fakeVerifyRes.json();
  console.log('  Fake verification response status:', fakeVerifyRes.status, fakeVerifyData);

  if (fakeVerifyRes.status !== 400 && fakeVerifyRes.status !== 401) {
    throw new Error('CRITICAL SECURITY FAILURE: Server accepted fake signature!');
  }

  // Verify balance is STILL ₹0
  const afterFakeBalRes = await fetch(`${BASE_URL}/api/wallet/balance`, { headers: authHeaders });
  const afterFakeBalData: any = await afterFakeBalRes.json();
  if (afterFakeBalData.balance !== 0) {
    throw new Error(`CRITICAL SECURITY FAILURE: Balance was credited from forged attempt! Balance: ₹${afterFakeBalData.balance}`);
  }
  console.log('  ✅ PASSED: Forged payment verification was rejected and balance remains strictly ₹0.00!');

  // ----------------------------------------------------
  // TEST SCENARIO 4: REAL RAZORPAY PAYMENT COMPLETION WITH VALID SIGNATURE
  // BALANCE MUST BECOME STRICTLY ₹100
  // ----------------------------------------------------
  console.log('\n[TEST 4] Customer completes genuine Razorpay payment with valid HMAC-SHA256 signature...');
  const genuinePaymentId = orderData.payment.id;
  const genuineGatewayOrderId = orderData.payment.gateway_order_id || `order_test_${Date.now()}`;
  const genuineGatewayPaymentId = `pay_real_rzp_${Date.now()}`;

  // Generate genuine Razorpay HMAC-SHA256 signature using server key secret
  const signaturePayload = `${genuineGatewayOrderId}|${genuineGatewayPaymentId}`;
  const validSignature = crypto.createHmac('sha256', KEY_SECRET).update(signaturePayload).digest('hex');

  const genuineVerifyRes = await fetch(`${BASE_URL}/api/wallet/verify-payment`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      paymentId: genuinePaymentId,
      gatewayPaymentId: genuineGatewayPaymentId,
      gatewayOrderId: genuineGatewayOrderId,
      gatewaySignature: validSignature,
    }),
  });
  const genuineVerifyData: any = await genuineVerifyRes.json();
  console.log('  Genuine verification response:', genuineVerifyData);

  if (!genuineVerifyData.success || genuineVerifyData.balance !== 100) {
    throw new Error(`FAILURE: Genuine payment verification failed: ${JSON.stringify(genuineVerifyData)}`);
  }

  // Check balance via GET /api/wallet/balance
  const paidBalRes = await fetch(`${BASE_URL}/api/wallet/balance`, { headers: authHeaders });
  const paidBalData: any = await paidBalRes.json();
  console.log('  Balance after verified ₹100 payment:', paidBalData);

  if (paidBalData.balance !== 100) {
    throw new Error(`FAILURE: Balance is ₹${paidBalData.balance}, expected strictly ₹100`);
  }
  console.log('  ✅ PASSED: Balance successfully became exactly ₹100.00 upon verified payment!');

  // ----------------------------------------------------
  // TEST SCENARIO 5: DUPLICATE WEBHOOK / IDEMPOTENCY TEST
  // BALANCE MUST NOT INCREASE AGAIN!
  // ----------------------------------------------------
  console.log('\n[TEST 5] Submitting duplicate payment verification & duplicate webhook (Idempotency test)...');
  
  // 5A: Duplicate client verification
  const dupVerifyRes = await fetch(`${BASE_URL}/api/wallet/verify-payment`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      paymentId: genuinePaymentId,
      gatewayPaymentId: genuineGatewayPaymentId,
      gatewayOrderId: genuineGatewayOrderId,
      gatewaySignature: validSignature,
    }),
  });
  const dupVerifyData: any = await dupVerifyRes.json();
  console.log('  Duplicate client verification response:', dupVerifyData);

  if (!dupVerifyData.alreadyProcessed && dupVerifyData.balance !== 100) {
    throw new Error(`FAILURE: Duplicate verification altered balance: ₹${dupVerifyData.balance}`);
  }

  // 5B: Duplicate webhook delivery to /api/payments/webhook
  const webhookBody = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: genuineGatewayPaymentId,
          order_id: genuineGatewayOrderId,
          amount: 10000, // paise = ₹100
          currency: 'INR',
          status: 'captured',
          method: 'upi',
          receipt: genuinePaymentId,
        },
      },
    },
  };
  const rawWebhook = JSON.stringify(webhookBody);
  const webhookSignature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawWebhook).digest('hex');

  const webhookRes = await fetch(`${BASE_URL}/api/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': webhookSignature,
    },
    body: rawWebhook,
  });
  const webhookData: any = await webhookRes.json();
  console.log('  Webhook response:', webhookData);

  if (!webhookData.duplicate && webhookData.status !== 'PAID') {
    throw new Error(`FAILURE: Webhook did not report idempotent duplicate status`);
  }

  // Verify balance is STILL strictly ₹100 (NEVER ₹200)
  const dupBalRes = await fetch(`${BASE_URL}/api/wallet/balance`, { headers: authHeaders });
  const dupBalData: any = await dupBalRes.json();
  console.log('  Balance after duplicate webhook:', dupBalData);

  if (dupBalData.balance !== 100) {
    throw new Error(`CRITICAL SECURITY FAILURE: Duplicate webhook credited wallet again! Balance is ₹${dupBalData.balance}, expected ₹100`);
  }
  console.log('  ✅ PASSED: Idempotency strictly verified! Balance remained ₹100.00 and was not double-credited!');

  // ----------------------------------------------------
  // TEST SCENARIO 6: TEST BALANCE RESET & AUDIT RECONCILIATION
  // ----------------------------------------------------
  console.log('\n[TEST 6] Testing Self-Service / Admin Balance Reset to reconcile test balances...');
  const resetRes = await fetch(`${BASE_URL}/api/wallet/reset-test-balance`, {
    method: 'POST',
    headers: authHeaders,
  });
  const resetData: any = await resetRes.json();
  console.log('  Reset response:', resetData);

  if (!resetData.success || resetData.balance !== 0) {
    throw new Error(`FAILURE: Reset test balance failed: ${JSON.stringify(resetData)}`);
  }

  const finalBalRes = await fetch(`${BASE_URL}/api/wallet/balance`, { headers: authHeaders });
  const finalBalData: any = await finalBalRes.json();
  console.log('  Final balance after reset:', finalBalData);

  if (finalBalData.balance !== 0) {
    throw new Error(`FAILURE: Balance after reset is ₹${finalBalData.balance}, expected ₹0`);
  }
  console.log('  ✅ PASSED: Test balance reset successfully reconciled account to ₹0.00 with audit ledger entry!');

  console.log('\n====================================================');
  console.log('🎉 ALL 6 WALLET SECURITY SCENARIOS PASSED WITH 100% SUCCESS!');
  console.log('====================================================');
}

runSecurityTestSuite().catch((err) => {
  console.error('\n❌ SECURITY TEST FAILED:', err);
  process.exit(1);
});
