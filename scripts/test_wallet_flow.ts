import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import fetch from 'node-fetch';
import { db } from '../src/server/db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'smap_production_secure_jwt_secret_key_2026';
const WEBHOOK_SECRET = process.env.PAYMENT_WEBHOOK_SECRET || 'sandbox_test_webhook_secret';
const BASE_URL = 'http://localhost:3000';

async function runTest() {
  console.log('--- STARTING WALLET FLOW TEST ---');

  // 1. Create a fresh customer user via API
  const testId = Date.now();
  const testEmail = `wallet_test_${testId}@gmail.com`;
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Sahil Test Customer',
      email: testEmail,
      password: 'Password123!@#',
    }),
  });
  const regData: any = await regRes.json();
  if (!regData.user || !regData.token) {
    throw new Error('Failed to register test customer: ' + JSON.stringify(regData));
  }
  const customer = regData.user;
  const customerToken = regData.token;

  const authHeaders = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${customerToken}`,
  };

  // 2. Check initial wallet balance
  const balRes1 = await fetch(`${BASE_URL}/api/wallet/balance`, { headers: authHeaders });
  const balData1: any = await balRes1.json();
  console.log('Initial wallet balance:', balData1);
  if (balData1.balance !== 0) throw new Error('Initial balance is not 0');

  // 3. Initiate Add Funds: ₹500
  console.log('\nStep 1: Adding ₹500 to wallet...');
  const addRes = await fetch(`${BASE_URL}/api/wallet/add-funds`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ amount: 500 }),
  });
  const addData: any = await addRes.json();
  console.log('Add Funds order response:', {
    paymentId: addData.payment?.id,
    amount: addData.amount,
    gatewayOrderId: addData.gatewayOrderId,
  });
  if (!addData.payment || addData.amount !== 500) {
    throw new Error('Failed to create Add Funds order');
  }

  const paymentId = addData.payment.id;
  const gatewayOrderId = addData.gatewayOrderId || `order_sandbox_${paymentId}`;
  const gatewayPaymentId = `pay_rzp_live_${Date.now()}`;

  // 4. Test Webhook delivery (Razorpay payment.captured)
  console.log('\nStep 2: Delivering verified Razorpay payment.captured webhook...');
  const webhookBody = {
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: gatewayPaymentId,
          order_id: gatewayOrderId,
          amount: 50000, // in paise
          currency: 'INR',
          method: 'upi',
          receipt: paymentId,
          acquirer_data: {
            rrn: '123456789012',
            upi_transaction_id: 'UPI987654321',
          },
        },
      },
    },
  };

  const rawPayload = JSON.stringify(webhookBody);
  const signature = crypto.createHmac('sha256', WEBHOOK_SECRET).update(rawPayload).digest('hex');

  const whRes = await fetch(`${BASE_URL}/api/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': signature,
    },
    body: rawPayload,
  });
  const whData: any = await whRes.json();
  console.log('Webhook response:', whData);
  if (!whData.success || whData.status !== 'PAID') {
    throw new Error('Webhook processing failed to credit payment');
  }

  // 5. Test Webhook Idempotency (deliver same webhook again)
  console.log('\nStep 3: Testing webhook idempotency (duplicate delivery)...');
  const whRes2 = await fetch(`${BASE_URL}/api/payments/webhook`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': signature,
    },
    body: rawPayload,
  });
  const whData2: any = await whRes2.json();
  console.log('Duplicate webhook response:', whData2);
  if (!whData2.duplicate && whData2.status !== 'PAID') {
    throw new Error('Idempotency check failed on duplicate webhook');
  }

  // 6. Verify wallet balance is now ₹500 (NOT ₹1000)
  const balRes2 = await fetch(`${BASE_URL}/api/wallet/balance`, { headers: authHeaders });
  const balData2: any = await balRes2.json();
  console.log('\nWallet balance after ₹500 top-up:', balData2.balance);
  if (balData2.balance !== 500) {
    throw new Error(`Expected balance ₹500, but got ₹${balData2.balance}`);
  }

  // Check transaction history
  const txRes = await fetch(`${BASE_URL}/api/wallet/transactions`, { headers: authHeaders });
  const txData: any = await txRes.json();
  console.log('Wallet transactions count:', txData.transactions?.length);
  const addTx = txData.transactions?.find((t: any) => t.type === 'ADD_FUNDS');
  if (!addTx || addTx.amount !== 500 || addTx.balance_after !== 500) {
    throw new Error('ADD_FUNDS transaction record not verified properly');
  }

  // 7. Create an Ad Campaign with Growth Accelerate package (cost = ₹399)
  console.log('\nStep 4: Creating campaign with ₹399 package...');
  const cmpRes = await fetch(`${BASE_URL}/api/campaigns`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      packageId: 'pkg_growth_399',
      creativeUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
      creativeType: 'image',
      businessName: 'Sahil Store',
      primaryText: 'Test campaign launch',
      headline: 'Special Offer',
      description: 'Exclusive deal',
      destinationType: 'website',
      destinationUrl: 'https://example.com',
      targeting: {
        country: 'India',
        state: 'All States',
        city: 'All Cities',
        min_age: 18,
        max_age: 65,
        gender: 'ALL',
        interests: ['Online Shopping'],
      },
    }),
  });
  const cmpData: any = await cmpRes.json();
  console.log('Campaign draft created:', {
    id: cmpData.campaign?.id,
    packageId: cmpData.campaign?.package_id,
    paymentAmount: cmpData.payment?.amount,
  });
  if (!cmpData.campaign || cmpData.payment?.amount !== 399) {
    throw new Error('Failed to create campaign draft with ₹399 package');
  }

  const campaignId = cmpData.campaign.id;

  // 8. Pay Campaign using Wallet Balance (₹500 balance - ₹399 cost = ₹101 remaining)
  console.log('\nStep 5: Paying campaign ₹399 from Wallet balance...');
  const payCmpRes = await fetch(`${BASE_URL}/api/wallet/pay-campaign`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ campaignId }),
  });
  const payCmpData: any = await payCmpRes.json();
  console.log('Campaign payment response:', {
    success: payCmpData.success,
    newBalance: payCmpData.balance,
    campaignStatus: payCmpData.campaign?.status,
    txId: payCmpData.transaction?.id,
  });

  if (!payCmpData.success) {
    throw new Error('Campaign payment with wallet failed');
  }

  // Requirement 8: Balance must be ₹101!
  if (payCmpData.balance !== 101) {
    throw new Error(`Expected remaining balance of ₹101, but got ₹${payCmpData.balance}`);
  }
  console.log(`>>> VERIFIED: Wallet balance successfully reduced from ₹500 to ₹${payCmpData.balance} after ₹399 payment!`);

  // 9. Test Insufficient Balance Guard (Requirement 9)
  console.log('\nStep 6: Testing Insufficient Balance guard...');
  // Try to create another campaign for ₹399 and pay when balance is only ₹101
  const cmpRes2 = await fetch(`${BASE_URL}/api/campaigns`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({
      packageId: 'pkg_growth_399', // ₹399
      creativeUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
      creativeType: 'image',
      businessName: 'Sahil Store 2',
      primaryText: 'Test campaign 2',
      headline: 'Offer 2',
      destinationType: 'website',
      destinationUrl: 'https://example.com',
      targeting: { country: 'India', state: 'All', city: 'All', min_age: 18, max_age: 65, gender: 'ALL', interests: [] },
    }),
  });
  const cmpData2: any = await cmpRes2.json();
  const campaignId2 = cmpData2.campaign.id;

  const insufficientRes = await fetch(`${BASE_URL}/api/wallet/pay-campaign`, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ campaignId: campaignId2 }),
  });
  const insufficientData: any = await insufficientRes.json();
  console.log('Insufficient balance rejection response:', insufficientData);

  if (insufficientRes.status !== 400 || !insufficientData.error?.includes('Insufficient balance')) {
    throw new Error('Failed to block payment when balance is insufficient');
  }
  console.log('>>> VERIFIED: Insufficient balance properly prevented campaign launch with message: "' + insufficientData.error + '"');

  // Verify balance is still ₹101
  const balRes3 = await fetch(`${BASE_URL}/api/wallet/balance`, { headers: authHeaders });
  const balData3: any = await balRes3.json();
  if (balData3.balance !== 101) {
    throw new Error(`Balance was altered on failed transaction: ₹${balData3.balance}`);
  }

  // 10. Test Admin Wallets endpoint (Requirement 17)
  console.log('\nStep 7: Testing Admin Wallets overview API...');
  const adminToken = jwt.sign(
    {
      userId: 'admin_test_1',
      googleSub: 'admin_sub',
      email: 'sahilking17341734@gmail.com',
      role: 'admin',
    },
    JWT_SECRET,
    { expiresIn: '1h' }
  );

  const adminRes = await fetch(`${BASE_URL}/api/admin/wallets`, {
    headers: {
      Authorization: `Bearer ${adminToken}`,
    },
  });
  const adminData: any = await adminRes.json();
  console.log('Admin Wallets Summary:', adminData.summary);
  const custRecord = adminData.customers?.find((c: any) => c.userId === customer.id);
  console.log('Customer Record in Admin ledger:', custRecord);

  if (!custRecord || custRecord.currentBalance !== 101 || custRecord.totalFundsAdded !== 500 || custRecord.totalFundsUsed !== 399) {
    throw new Error('Admin ledger figures do not match expected wallet accounting');
  }
  console.log('>>> VERIFIED: Admin wallet accounting matches perfectly (Balance: ₹101, Added: ₹500, Used: ₹399)');

  console.log('\n--- ALL WALLET FLOW TESTS PASSED SUCCESSFULLY! ---');
}

runTest().catch((err) => {
  console.error('\nTEST FAILED:', err);
  process.exit(1);
});
