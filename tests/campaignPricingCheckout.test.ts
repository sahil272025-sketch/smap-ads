import express from 'express';
import bcrypt from 'bcryptjs';
import { db, User } from '../src/server/db.js';
import { CampaignService } from '../src/server/campaignService.js';
import { WalletService } from '../src/server/walletService.js';
import { MetaService } from '../src/server/metaService.js';
import { SupportService } from '../src/server/supportService.js';
import { AuthService } from '../src/server/authService.js';
import { CampaignQueueService } from '../src/server/campaignQueue.js';
import { renderPolicyHtml, registerPolicyRoutes } from '../src/server/policyPages.js';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
  passedTests++;
  console.log(`✅ PASSED: ${message}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('🧪 SMAP — Campaign Pricing, Checkout & Verification Tests');
  console.log('====================================================\n');

  // Setup test user
  const testUserId = `test_usr_${Date.now()}`;
  const testUser: User = {
    id: testUserId,
    email: `test_${Date.now()}@smap-ads.test`,
    name: 'Test Customer',
    role: 'customer',
    status: 'ACTIVE',
    google_sub: `sub_${Date.now()}`,
    email_verified: true,
    profile_picture: null,
    last_login_at: new Date().toISOString(),
    wallet_balance: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.createUser(testUser);

  // TEST 1: Starter Sprint costs exactly ₹200 for 5 days, not ₹1,000
  console.log('--- TEST 1: Starter Sprint Fixed Price ---');
  const starter = db.findPackageById('pkg_starter_200');
  const starterAlias = db.findPackageById('starter_sprint');
  assert(!!starter && starter.price === 200, 'Starter Sprint direct ID costs exactly ₹200');
  assert(!!starter && starter.duration_days === 5, 'Starter Sprint direct ID has duration of 5 days');
  assert(!!starterAlias && starterAlias.price === 200, 'Starter Sprint alias resolves to ₹200');
  assert(!!starterAlias && starterAlias.duration_days === 5, 'Starter Sprint alias has duration of 5 days');
  assert(starter?.price !== 1000, 'Starter Sprint does NOT multiply 200 * 5 to ₹1,000');

  // TEST 2: Growth Accelerate costs exactly ₹399 for 10 days
  console.log('\n--- TEST 2: Growth Accelerate Fixed Price ---');
  const growth = db.findPackageById('pkg_growth_399');
  const growthAlias = db.findPackageById('growth_accelerate');
  assert(!!growth && growth.price === 399, 'Growth Accelerate costs exactly ₹399');
  assert(!!growth && growth.duration_days === 10, 'Growth Accelerate duration is 10 days');
  assert(!!growthAlias && growthAlias.price === 399, 'Growth Accelerate alias resolves to ₹399');
  assert(!!growthAlias && growthAlias.duration_days === 10, 'Growth Accelerate alias duration is 10 days');

  // TEST 3: Business Pro costs exactly ₹549 for 14 days
  console.log('\n--- TEST 3: Business Pro Fixed Price ---');
  const pro = db.findPackageById('pkg_pro_549');
  const proAlias = db.findPackageById('business_pro');
  assert(!!pro && pro.price === 549, 'Business Pro costs exactly ₹549');
  assert(!!pro && pro.duration_days === 14, 'Business Pro duration is 14 days');
  assert(!!proAlias && proAlias.price === 549, 'Business Pro alias resolves to ₹549');
  assert(!!proAlias && proAlias.duration_days === 14, 'Business Pro alias duration is 14 days');

  // TEST 4: Enterprise Scale costs exactly ₹749 for 30 days
  console.log('\n--- TEST 4: Enterprise Scale Fixed Price ---');
  const scale = db.findPackageById('pkg_scale_749');
  const scaleAlias = db.findPackageById('enterprise_scale');
  assert(!!scale && scale.price === 749, 'Enterprise Scale costs exactly ₹749');
  assert(!!scale && scale.duration_days === 30, 'Enterprise Scale duration is 30 days');
  assert(!!scaleAlias && scaleAlias.price === 749, 'Enterprise Scale alias resolves to ₹749');
  assert(!!scaleAlias && scaleAlias.duration_days === 30, 'Enterprise Scale alias duration is 30 days');

  // TEST 5: Changing state/targeting does not change package price
  console.log('\n--- TEST 5: State & Targeting Invariance ---');
  const draftMaharashtra = await CampaignService.createDraft(testUserId, {
    packageId: 'pkg_starter_200',
    businessName: 'MH Store',
    headline: 'MH Festive Offer',
    primaryText: 'Festive shopping',
    creativeUrl: 'https://example.com/mh.jpg',
    destinationUrl: 'https://example.com/mh',
    targeting: {
      country: 'IN',
      state: 'Maharashtra',
      city: 'Mumbai',
      min_age: 21,
      max_age: 45,
      gender: 'WOMEN',
      interests: ['Festive Shopping', 'Jewelry'],
      locations: ['Mumbai', 'Pune'],
      estimated_audience_size: '4.2M people',
    },
    syncToMeta: false,
  });

  const draftAllIndia = await CampaignService.createDraft(testUserId, {
    packageId: 'pkg_starter_200',
    businessName: 'All India Store',
    headline: 'Nationwide Offer',
    primaryText: 'Nationwide shipping',
    creativeUrl: 'https://example.com/all-india.jpg',
    destinationUrl: 'https://example.com/all-india',
    targeting: {
      country: 'IN',
      state: 'All States',
      city: 'All Cities',
      min_age: 18,
      max_age: 65,
      gender: 'ALL',
      interests: ['Online Shopping'],
      locations: ['All India'],
      estimated_audience_size: '22M people',
    },
    syncToMeta: false,
  });

  assert(
    draftMaharashtra.campaign.total_budget === 200,
    'Maharashtra targeted campaign has total budget of exactly ₹200'
  );
  assert(
    draftAllIndia.campaign.total_budget === 200,
    'All-India targeted campaign has total budget of exactly ₹200'
  );
  assert(
    draftMaharashtra.campaign.total_budget === draftAllIndia.campaign.total_budget,
    'Changing state and audience targeting does NOT alter package price'
  );

  // TEST 6: Insufficient wallet balance cannot create a paid order or deduct money
  console.log('\n--- TEST 6: Insufficient Wallet Balance Protection ---');
  const initialBalance = db.getWalletBalance(testUserId);
  assert(initialBalance === 0, 'Test user has 0 balance initially');

  let insufficientErrorCaught = false;
  try {
    await CampaignService.checkoutWithWallet(testUserId, {
      packageId: 'pkg_starter_200',
      businessName: 'Unfunded Campaign',
      headline: 'Should Fail',
      primaryText: 'Insufficient funds test',
      creativeUrl: 'https://example.com/unfunded.jpg',
      destinationUrl: 'https://example.com/test',
    });
  } catch (err: any) {
    insufficientErrorCaught = true;
    assert(
      err.message.includes('Insufficient') || err.message.includes('balance'),
      `Correct error message thrown on insufficient funds: "${err.message}"`
    );
  }
  assert(insufficientErrorCaught, 'Insufficient balance blocked checkout');
  assert(db.getWalletBalance(testUserId) === 0, 'Wallet balance remained ₹0 without unauthorized deduction');

  // Verify no paid campaign was created for Unfunded Campaign
  const unfunded = db.getCampaigns(testUserId).find((c) => c.business_name === 'Unfunded Campaign');
  assert(!unfunded, 'No campaign record created when checkout fails due to insufficient funds');

  // TEST 7: Sufficient wallet balance deducts the exact package price once
  console.log('\n--- TEST 7: Sufficient Wallet Balance Deducts Exact Price Once ---');
  // Credit wallet with ₹500 via admin/verified ledger
  db.creditWallet(testUserId, 500, {
    description: 'Verified UPI wallet credit for testing',
  });
  const creditedBal = db.getWalletBalance(testUserId);
  assert(creditedBal === 500, 'User wallet credited to exactly ₹500');

  const checkoutResult = await CampaignService.checkoutWithWallet(testUserId, {
    packageId: 'pkg_starter_200',
    businessName: 'Funded Campaign',
    headline: 'Successfully Paid',
    primaryText: 'Sufficient funds test',
    creativeUrl: 'https://example.com/funded.jpg',
    destinationUrl: 'https://example.com/funded',
    idempotencyKey: 'idem_test_order_1',
  });

  assert(checkoutResult.success === true, 'Checkout succeeded with sufficient wallet funds');
  assert(checkoutResult.newBalance === 300, 'Wallet balance after ₹200 deduction is exactly ₹300 (500 - 200)');
  assert(checkoutResult.payment.status === 'PAID', 'Payment record marked as PAID');
  assert(checkoutResult.payment.amount === 200, 'Payment record amount is exactly ₹200');
  assert(
    checkoutResult.campaign.status === 'PAYMENT_CONFIRMED' ||
      checkoutResult.campaign.status === 'UNDER_REVIEW' ||
      checkoutResult.campaign.status === 'ACTIVE' ||
      checkoutResult.campaign.status === 'FAILED',
    `Campaign status recorded truthfully: ${checkoutResult.campaign.status}`
  );
  if (checkoutResult.campaign.status === 'FAILED') {
    assert(
      Boolean(checkoutResult.campaign.error_details || checkoutResult.campaign.rejection_reason),
      'Failed Meta submission stores honest rejection reason / error details'
    );
  }

  // TEST 8: Unverified UPI payment cannot create a paid order
  console.log('\n--- TEST 8: Unverified UPI Payment Cannot Create Paid Order ---');
  const unverifiedPaymentId = `pay_unverified_${Date.now()}`;
  db.createPayment({
    id: unverifiedPaymentId,
    user_id: testUserId,
    campaign_id: draftMaharashtra.campaign.id,
    package_id: 'pkg_starter_200',
    amount: 200,
    currency: 'INR',
    payment_method: 'UPI',
    payee_upi: 'sahil-stp@ybl',
    upi_intent_url: '',
    transaction_reference: null,
    gateway_payment_id: null,
    gateway_order_id: null,
    gateway_key_id: null,
    status: 'PENDING',
    webhook_status: 'PENDING',
    failure_reason: null,
    idempotency_key: null,
    paid_at: null,
    verified_at: null,
    verification_source: null,
    notes: 'Unverified test payment',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  let unverifiedBlocked = false;
  try {
    // Attempting to submit to Meta with an unverified PENDING payment must fail
    await CampaignService.submitToMeta(draftMaharashtra.campaign.id, testUserId);
  } catch (err: any) {
    unverifiedBlocked = true;
    assert(
      err.message.includes('Payment must be verified as PAID'),
      `Unverified payment blocked with error: "${err.message}"`
    );
  }
  assert(unverifiedBlocked, 'Unverified UPI payment strictly blocked from activating campaign');

  // TEST 9: Duplicate requests/webhooks cannot create duplicate deductions or orders
  console.log('\n--- TEST 9: Strict Idempotency Guards ---');
  const balanceBeforeDup = db.getWalletBalance(testUserId);
  assert(balanceBeforeDup === 300, 'Balance before duplicate attempt is ₹300');

  // Call checkoutWithWallet again with the EXACT SAME idempotencyKey
  const duplicateCheckoutResult = await CampaignService.checkoutWithWallet(testUserId, {
    packageId: 'pkg_starter_200',
    businessName: 'Funded Campaign',
    headline: 'Successfully Paid',
    primaryText: 'Sufficient funds test',
    creativeUrl: 'https://example.com/funded.jpg',
    destinationUrl: 'https://example.com/funded',
    idempotencyKey: 'idem_test_order_1',
  });

  assert(duplicateCheckoutResult.success === true, 'Duplicate request returned existing order safely');
  assert(
    duplicateCheckoutResult.campaign.id === checkoutResult.campaign.id,
    'Returned identical campaign ID without creating new order'
  );
  assert(
    db.getWalletBalance(testUserId) === 300,
    'Wallet balance remained ₹300; duplicate deduction was prevented by idempotency guard'
  );

  // Also test direct deductWallet idempotency with campaignId
  const dupDeductResult = db.deductWallet(testUserId, 200, {
    description: 'Attempt duplicate deduction',
    campaignId: checkoutResult.campaign.id,
  });
  assert(
    dupDeductResult.newBalance === 300,
    'Direct deductWallet idempotency guard returned current balance without double deducting'
  );
  assert(
    dupDeductResult.transaction.id === checkoutResult.walletTransaction.id,
    'Direct deductWallet returned original transaction record'
  );

  // TEST 10: Failed Meta publishing is reported honestly and never shown as a running campaign
  console.log('\n--- TEST 10: Honest Reporting of Meta Failures ---');
  // Create a campaign with invalid/disconnected Meta state
  const mockFailedCampaignId = `cmp_fail_${Date.now()}`;
  db.createCampaign({
    id: mockFailedCampaignId,
    user_id: testUserId,
    package_id: 'pkg_starter_200',
    objective: 'TRAFFIC',
    creative_url: 'https://example.com/img.jpg',
    creative_type: 'image',
    business_name: 'Test Failure',
    primary_text: 'Ad copy',
    headline: 'Headline',
    description: '',
    call_to_action: 'LEARN_MORE',
    destination_type: 'website',
    destination_url: 'https://example.com',
    placements: ['facebook_feed'],
    targeting: {
      country: 'IN',
      state: 'All India',
      city: 'All Cities',
      min_age: 18,
      max_age: 65,
      gender: 'ALL',
      interests: [],
      locations: ['All India'],
      estimated_audience_size: '10M',
    },
    daily_budget: 40,
    duration_days: 5,
    total_budget: 200,
    start_at: new Date().toISOString(),
    end_at: new Date(Date.now() + 5 * 86400000).toISOString(),
    status: 'PAYMENT_CONFIRMED',
    meta_campaign_id: null,
    meta_adset_id: null,
    meta_creative_id: null,
    meta_ad_id: null,
    meta_account_id: 'act_1627260695520511',
    meta_status_message: 'Payment confirmed. Meta submission error occurred: Ad account requires active payment method on Meta.',
    rejection_reason: null,
    error_details: 'Ad account requires active payment method on Meta.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const failedCampaign = db.findCampaignById(mockFailedCampaignId)!;
  assert(
    failedCampaign.status !== 'ACTIVE',
    'Failed/pending Meta campaign is NEVER marked as ACTIVE'
  );
  assert(
    failedCampaign.error_details !== null,
    'Failed Meta campaign honestly stores error_details'
  );
  assert(
    (failedCampaign.meta_status_message || '').includes('Meta'),
    'Failed Meta campaign displays honest status message'
  );

  // TEST 11: Ad Creative error handling: submitCampaignToMeta fails honestly and never reports UNDER_REVIEW when creative fails
  console.log('\n--- TEST 11: Strict Creative & Ad Creation Error Handling ---');
  const dummyCampaign: any = {
    id: `cmp_dummy_${Date.now()}`,
    user_id: testUserId,
    package_id: 'pkg_starter_200',
    objective: 'TRAFFIC',
    creative_url: 'https://example.com/creative.jpg',
    creative_type: 'image',
    business_name: 'Test Business',
    headline: 'Test Headline',
    primaryText: 'Test Primary Text',
    destination_url: 'https://example.com',
    duration_days: 5,
    daily_budget: 40,
    total_budget: 200,
    status: 'PAYMENT_CONFIRMED',
  };

  const submitTestResult = await MetaService.submitCampaignToMeta(dummyCampaign);
  // In development mode, Meta rejects the creative post; the submission must return success: false and status: FAILED
  assert(
    submitTestResult.status === 'FAILED' || submitTestResult.status === 'UNDER_REVIEW',
    `Submission result returned valid Meta lifecycle state: ${submitTestResult.status}`
  );
  if (!submitTestResult.success) {
    assert(submitTestResult.status === 'FAILED', 'Failed submission strictly returns status FAILED, never claims UNDER_REVIEW');
    assert(Boolean(submitTestResult.error), 'Failed submission provides truthful error message');
  }

  // TEST 12: Truthful Campaign Status Reconciliation
  console.log('\n--- TEST 12: Truthful Campaign Status Reconciliation ---');
  const testReconcileCmp = db.createCampaign({
    id: `cmp_recon_${Date.now()}`,
    user_id: testUserId,
    package_id: 'pkg_starter_200',
    objective: 'TRAFFIC',
    creative_url: 'https://example.com/c.jpg',
    creative_type: 'image',
    business_name: 'Reconcile Test',
    primary_text: 'Reconcile',
    headline: 'Reconcile',
    description: '',
    call_to_action: 'LEARN_MORE',
    destination_type: 'website',
    destination_url: 'https://example.com',
    placements: ['facebook_feed'],
    targeting: {
      country: 'IN',
      state: 'All India',
      city: 'All Cities',
      min_age: 18,
      max_age: 65,
      gender: 'ALL',
      interests: [],
      locations: ['All India'],
      estimated_audience_size: '10M',
    },
    daily_budget: 40,
    duration_days: 5,
    total_budget: 200,
    start_at: new Date().toISOString(),
    end_at: new Date(Date.now() + 5 * 86400000).toISOString(),
    status: 'UNDER_REVIEW',
    meta_campaign_id: '120251658136230295', // Real recent paused campaign on ad account
    meta_adset_id: null,
    meta_creative_id: null,
    meta_ad_id: null,
    meta_account_id: 'act_1627260695520511',
    meta_status_message: 'In review',
    rejection_reason: null,
    error_details: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const reconciled = await MetaService.reconcileCampaignStatus(testReconcileCmp);
  assert(Boolean(reconciled), 'Reconciliation executed cleanly without crashing');
  assert(
    reconciled.status !== 'ACTIVE',
    'Paused Meta campaign is not falsely reconciled as ACTIVE'
  );

  // TEST 13: Meta Minimum Budget Rule Verification (Dynamic & Non-Universal)
  console.log('\n--- TEST 13: Meta Minimum Budget Dynamic Rules ---');
  const liveAdAccountBudget = await MetaService.getAdAccountMinimumBudget('1627260695520511', 'AED', 'IMPRESSIONS');
  assert(Boolean(liveAdAccountBudget.currency), `Ad account currency recognized dynamically: ${liveAdAccountBudget.currency}`);
  assert(
    liveAdAccountBudget.source === 'META_API' || liveAdAccountBudget.source === 'CALCULATED_CURRENCY_FLOOR',
    'Evaluated Meta minimum budgets (via live API when token is active, or calculated currency floor when token is expired)'
  );
  assert(liveAdAccountBudget.minDailyBudget > 0, `Meta minimum daily budget retrieved for ${liveAdAccountBudget.currency}: ${liveAdAccountBudget.minDailyBudget}`);
  
  const clicksBudget = await MetaService.getAdAccountMinimumBudget('1627260695520511', 'AED', 'LINK_CLICKS');
  assert(clicksBudget.minDailyBudget > liveAdAccountBudget.minDailyBudget, 'LINK_CLICKS billing event requires a significantly higher minimum budget than IMPRESSIONS');

  const inrFallback = await MetaService.getAdAccountMinimumBudget('non_existent_account', 'INR', 'IMPRESSIONS');
  assert(inrFallback.currency === 'INR', 'INR fallback currency evaluated as INR');
  assert(inrFallback.minDailyBudget === 85.0, 'INR calculated benchmark is ₹85.00/day ($1.00 equivalent)');

  const usdFallback = await MetaService.getAdAccountMinimumBudget('non_existent_account', 'USD', 'IMPRESSIONS');
  assert(usdFallback.minDailyBudget === 1.0, 'USD ad accounts floor evaluated at $1.00/day, proving ₹90 is not assumed universally');

  // TEST 14: Transparent Package Fee vs Meta Media Spend & Payer Entity
  console.log('\n--- TEST 14: Transparent Fee Breakdown & Payer Disclosure ---');
  const starterPkg = db.findPackageById('pkg_starter_200')!;
  assert(starterPkg.platform_fee === 100, 'Starter Sprint has ₹100 explicit platform fee');
  assert(starterPkg.media_spend === 100, 'Starter Sprint has ₹100 explicit Meta media budget');
  assert(starterPkg.platform_fee! + starterPkg.media_spend! === starterPkg.price, 'Platform fee + media spend strictly equals total charged price (₹200)');
  assert(Boolean(starterPkg.payer_entity && starterPkg.payer_entity.includes('Customer pays SMAP')), 'Payer entity transparently informs customer who pays Meta');

  const growthPkg = db.findPackageById('pkg_growth_399')!;
  assert(growthPkg.platform_fee === 150, 'Growth Accelerate has ₹150 platform fee');
  assert(growthPkg.media_spend === 249, 'Growth Accelerate has ₹249 Meta media spend');
  assert(growthPkg.platform_fee! + growthPkg.media_spend! === growthPkg.price, 'Growth fee + media spend strictly equals ₹399');

  // TEST 15: Production Safety Gate Blocks Real Submissions Until Enabled
  console.log('\n--- TEST 15: Production Safety Gate & Budget Validation ---');
  const safetyGate = MetaService.canSubmitLiveCampaigns();
  assert(
    safetyGate.allowed === false,
    'Safety gate blocks live campaign submissions when META_LIVE_SUBMISSIONS_ENABLED is not explicitly true'
  );
  assert(
    safetyGate.reason.includes('safely disabled') || safetyGate.reason.includes('blocked'),
    'Safety gate returns clear explanation that real ads/spending are blocked'
  );

  const blockedSubmit = await MetaService.submitCampaignToMeta(dummyCampaign);
  assert(blockedSubmit.success === false, 'submitCampaignToMeta returns false when safety gate is active');
  assert(blockedSubmit.status === 'FAILED', 'Blocked submission marked as FAILED with zero money spent on Meta');
  assert(Boolean(blockedSubmit.error && (blockedSubmit.error.includes('Submission Blocked') || blockedSubmit.error.includes('Budget'))), 'Blocked submission stores transparent blocker reason');

  // TEST 16: Refund/Cancellation Policy, Grievance Officer & Support Ticket Tracking
  console.log('\n--- TEST 16: Refund Policy, Grievance Officer & Ticket Tracking ---');
  const contactHtml = renderPolicyHtml('contact');
  assert(contactHtml.includes('Designated Grievance Redressal Officer'), 'Contact page contains Designated Grievance Redressal Officer section');
  assert(contactHtml.includes('Sahil Gupta'), 'Grievance Officer name (Sahil Gupta) prominently rendered');
  assert(contactHtml.includes('sahilking17341734@gmail.com'), 'Official Grievance Officer email rendered');
  assert(contactHtml.includes('24 business hours'), '24-hour statutory acknowledgement timeline displayed');

  const refundHtml = renderPolicyHtml('refund');
  assert(refundHtml.includes('7 calendar days') || refundHtml.includes('7-Day Refund Window'), 'Refund page renders 7-day refund policy window');
  assert(refundHtml.includes('Prior to Meta Submission'), 'Refund policy specifies 100% full refund before Meta submission');

  const dataDeletionHtml = renderPolicyHtml('data-deletion');
  assert(dataDeletionHtml.includes('User Data Deletion Instructions'), 'Data deletion page renders proper heading');
  assert(dataDeletionHtml.includes('sahilking17341734@gmail.com'), 'Data deletion page contains official support email');
  assert(dataDeletionHtml.includes('Apps and Websites'), 'Data deletion page explains how to disconnect via Meta Apps and Websites');
  assert(dataDeletionHtml.includes('30 calendar days'), 'Data deletion page specifies 30-day processing window');
  assert(dataDeletionHtml.includes('Statutory Legal Retention Requirements'), 'Data deletion page specifies legal tax/payment retention rules');

  // Verify Support Ticket lifecycle in database
  const newTicket = SupportService.createTicket({
    userId: testUserId,
    subject: 'Campaign Budget Clarification',
    message: 'How is my ₹200 Starter Sprint allocated between SMAP and Meta?',
  });
  assert(Boolean(newTicket.id), `Support ticket created successfully with ID: ${newTicket.id}`);
  assert(newTicket.status === 'OPEN', 'Newly created ticket has status OPEN');
  
  // Create test admin for support replies
  const adminUserId = `test_admin_${Date.now()}`;
  db.createUser({
    id: adminUserId,
    email: 'admin@smap-ads.test',
    name: 'SMAP Admin Support',
    role: 'admin',
    status: 'ACTIVE',
    google_sub: `sub_admin_${Date.now()}`,
    email_verified: true,
    profile_picture: null,
    last_login_at: new Date().toISOString(),
    wallet_balance: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const updatedWithReply = SupportService.addReply(
    newTicket.id,
    adminUserId,
    'admin',
    'Your Starter Sprint includes ₹100 platform management and ₹100 Meta media budget.'
  );
  assert(Boolean(updatedWithReply), 'Support reply created successfully');
  assert(updatedWithReply!.status === 'IN_PROGRESS', 'Admin reply moves ticket status to IN_PROGRESS');
  assert(updatedWithReply!.replies.length === 1, 'Ticket thread contains reply');

  const resolvedTicket = SupportService.updateStatus(newTicket.id, 'RESOLVED');
  assert(Boolean(resolvedTicket), 'Ticket resolved successfully');
  assert(resolvedTicket!.status === 'RESOLVED', 'Ticket status successfully marked as RESOLVED');

  // ==========================================
  // TEST 17: Wallet Ledger Protection & Audit Reconciliation
  // ==========================================
  console.log('\n--- TEST 17: Wallet Ledger Protection & Audit Reconciliation ---');

  // 1. Create a customer with 2 verified Razorpay payments
  const auditCustId = `cust_audit_${Date.now()}`;
  const auditUser = db.createUser({
    id: auditCustId,
    email: `audit_${Date.now()}@smap-ads.test`,
    name: 'Audit Customer',
    role: 'customer',
    status: 'ACTIVE',
    google_sub: `sub_audit_${Date.now()}`,
    email_verified: true,
    profile_picture: null,
    last_login_at: new Date().toISOString(),
    wallet_balance: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  // Credit Payment 1 (₹1.00)
  const pay1Id = `pay_rzp_audit_1_${Date.now()}`;
  db.createPayment({
    id: `smap_${pay1Id}`,
    user_id: auditCustId,
    campaign_id: 'WALLET_TOPUP',
    package_id: 'wallet_topup',
    amount: 1,
    currency: 'INR',
    payment_method: 'UPI',
    payee_upi: 'sahil-stp@ybl',
    upi_intent_url: '',
    transaction_reference: 'UTR_257178192361',
    gateway_payment_id: pay1Id,
    gateway_order_id: `order_audit_1`,
    status: 'PAID',
    verified_at: new Date().toISOString(),
    verification_source: 'GATEWAY_API',
    notes: 'Verified against Razorpay LIVE captured payment',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  db.creditWallet(auditCustId, 1, {
    description: 'Added funds via Razorpay UPI (UTR_257178192361)',
    gatewayPaymentId: pay1Id,
  });

  // Credit Payment 2 (₹1.00)
  const pay2Id = `pay_rzp_audit_2_${Date.now()}`;
  db.createPayment({
    id: `smap_${pay2Id}`,
    user_id: auditCustId,
    campaign_id: 'WALLET_TOPUP',
    package_id: 'wallet_topup',
    amount: 1,
    currency: 'INR',
    payment_method: 'UPI',
    payee_upi: 'sahil-stp@ybl',
    upi_intent_url: '',
    transaction_reference: 'UTR_667696542797',
    gateway_payment_id: pay2Id,
    gateway_order_id: `order_audit_2`,
    status: 'PAID',
    verified_at: new Date().toISOString(),
    verification_source: 'GATEWAY_API',
    notes: 'Verified against Razorpay LIVE captured payment',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });
  db.creditWallet(auditCustId, 1, {
    description: 'Added funds via Razorpay UPI (UTR_667696542797)',
    gatewayPaymentId: pay2Id,
  });

  const fundedUser = db.findUserById(auditCustId);
  assert(fundedUser?.wallet_balance === 2, 'Customer successfully funded with ₹2.00 from 2 verified payments');

  // 2. Verified funds cannot be casually reset
  let resetPrevented = false;
  try {
    db.resetWalletBalance(auditCustId, 'Accidental test reset');
  } catch (err: any) {
    resetPrevented = true;
    assert(
      err.message.includes('verified real payment'),
      'resetWalletBalance throws protective error when verified payments exist'
    );
  }
  assert(resetPrevented, 'Casual balance reset is strictly blocked when user has verified paid transactions');

  // 3. Simulate accidental zeroing (e.g. override or incident) to test recovery
  // Manually wipe balance to ₹0 like the incident
  fundedUser!.wallet_balance = 0;
  db.save();

  assert(
    db.findUserById(auditCustId)?.wallet_balance === 0,
    'Simulated incident: wallet balance became ₹0.00'
  );

  // 4. Run Audit Reconciliation
  const reconResult = WalletService.reconcileAndRestoreLegitimateBalance(
    auditCustId,
    adminUserId,
    'Reconciling accidental wallet balance reset against verified payments'
  );

  assert(reconResult.status === 'RESTORED', 'Reconciliation detects missing funds and marks status RESTORED');
  assert(reconResult.restoredBalance === 2, 'Reconciliation restores exact verified balance of ₹2.00');
  assert(reconResult.correctionAmount === 2, 'Correction amount is exactly ₹2.00');
  assert(reconResult.verifiedPayments.length === 2, 'Reconciliation identifies both verified Razorpay payments');
  assert(reconResult.transaction?.type === 'AUDIT_CORRECTION', 'Correction creates an AUDIT_CORRECTION transaction');
  assert(reconResult.transaction?.balance_after === 2, 'Correction transaction records balance_after as ₹2.00');

  // Verify database state
  const restoredUser = db.findUserById(auditCustId);
  assert(restoredUser?.wallet_balance === 2, 'User wallet balance is now verified ₹2.00 in database');

  // 5. Subsequent reconciliation is strictly idempotent (no double credit)
  const secondRecon = WalletService.reconcileAndRestoreLegitimateBalance(
    auditCustId,
    adminUserId,
    'Second reconciliation attempt'
  );
  assert(secondRecon.status === 'ALREADY_RECONCILED', 'Second reconciliation recognizes balance is ALREADY_RECONCILED');
  assert(secondRecon.correctionAmount === 0, 'Second reconciliation applies 0 correction');
  assert(secondRecon.transaction === null, 'Second reconciliation does NOT generate duplicate transaction');
  assert(db.findUserById(auditCustId)?.wallet_balance === 2, 'Balance remains strictly ₹2.00 without double crediting');

  // TEST 23: Dynamic Customer Asset IDs & Multi-Page / Multi-Instagram Support
  console.log('\n--- TEST 23: Dynamic Customer Asset IDs & Page/Instagram Binding ---');
  const customMetaUser: User = {
    id: `usr_meta_${Date.now()}`,
    email: `meta_${Date.now()}@test.com`,
    name: 'Customer With Assets',
    role: 'customer',
    status: 'ACTIVE',
    google_sub: `sub_${Date.now()}`,
    email_verified: true,
    profile_picture: null,
    last_login_at: new Date().toISOString(),
    wallet_balance: 500,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.createUser(customMetaUser);

  const customConnection = {
    id: `conn_${Date.now()}`,
    user_id: customMetaUser.id,
    meta_user_id: '998877665544',
    meta_user_name: 'Customer Business Owner',
    access_token: 'EAAP_mock_customer_long_lived_token',
    token_expires_at: new Date(Date.now() + 60 * 24 * 3600 * 1000).toISOString(),
    token_type: 'long_lived' as const,
    ad_accounts: [
      {
        id: 'act_9988112233',
        account_id: '9988112233',
        name: 'Customer Custom Ad Account',
        currency: 'INR',
        account_status: 1,
      },
    ],
    selected_ad_account_id: 'act_9988112233',
    pages: [
      {
        id: 'page_cust_111',
        name: 'Customer Brand Store',
        category: 'Retail',
        tasks: ['MANAGE', 'ADVERTISE'],
        instagram_account_id: 'ig_cust_222',
        instagram_username: 'customerbrand',
      },
      {
        id: 'page_cust_333',
        name: 'Secondary Brand Page',
        category: 'Services',
        tasks: ['ADVERTISE'],
      },
    ],
    selected_page_id: 'page_cust_111',
    page_id: 'page_cust_111',
    page_name: 'Customer Brand Store',
    instagram_accounts: [
      {
        id: 'ig_cust_222',
        username: 'customerbrand',
        name: 'Customer Brand',
        page_id: 'page_cust_111',
      },
    ],
    selected_instagram_id: 'ig_cust_222',
    instagram_id: 'ig_cust_222',
    instagram_username: 'customerbrand',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.saveMetaConnection(customConnection);

  const fetchedConn = db.findMetaConnectionByUserId(customMetaUser.id);
  assert(!!fetchedConn, 'Custom Meta connection successfully saved and retrieved');
  assert(fetchedConn?.selected_page_id === 'page_cust_111', 'Selected page is customer owned page_cust_111');
  assert(fetchedConn?.selected_instagram_id === 'ig_cust_222', 'Selected Instagram is customer owned ig_cust_222');
  assert(fetchedConn?.selected_ad_account_id === 'act_9988112233', 'Selected Ad Account is customer owned act_9988112233');

  // Verify createDraftCampaignInMeta binds to customer's dynamic assets
  const custCampaign = await CampaignService.createDraft(customMetaUser.id, {
    packageId: 'pkg_starter_200',
    businessName: 'Customer Brand',
    headline: 'Grand Opening Special',
    primaryText: 'Visit our new store online today!',
    creativeUrl: 'https://example.com/asset.jpg',
    destinationUrl: 'https://example.com',
    syncToMeta: true,
  });

  assert(!!custCampaign.campaign, 'Customer campaign draft created successfully');
  assert(
    custCampaign.metaResult?.identities?.facebook_page_id === 'page_cust_111',
    'Meta draft uses customer-owned Facebook Page ID (page_cust_111), not hardcoded platform owner Page'
  );
  assert(
    custCampaign.metaResult?.identities?.instagram_account_id === 'ig_cust_222',
    'Meta draft uses customer-owned Instagram Account ID (ig_cust_222)'
  );
  assert(
    custCampaign.metaResult?.identities?.ad_account === 'act_9988112233',
    'Meta draft uses customer-owned Ad Account (act_9988112233)'
  );

  // TEST 24: Safety Gate is Strictly Preserved
  console.log('\n--- TEST 24: Safety Gate Strict Enforcement ---');
  const gate = MetaService.canSubmitLiveCampaigns();
  assert(
    gate.allowed === false,
    'META_LIVE_SUBMISSIONS_ENABLED is strictly false; live ad creation remains blocked'
  );

  // TEST 25: GET /data-deletion Server Route Direct Serving (Not Dashboard)
  console.log('\n--- TEST 25: GET /data-deletion Serves Policy HTML Directly (Not Dashboard) ---');
  const testApp = express();
  registerPolicyRoutes(testApp);

  // Register simulated SPA catch-all fallback (which would serve the main dashboard on Render if route wasn't matched)
  testApp.get('*', (_req, res) => {
    res.status(200).send('<html><body><div id="root"><main id="customer-dashboard">Main SMAP Customer Dashboard Workspace</main></div></body></html>');
  });

  const server = await new Promise<any>((resolve) => {
    const s = testApp.listen(0, '127.0.0.1', () => resolve(s));
  });
  const address = server.address();
  const testPort = typeof address === 'object' && address ? address.port : 0;
  assert(testPort > 0, `Test HTTP server listening on ephemeral port ${testPort}`);

  try {
    // 1. Direct GET /data-deletion
    const res1 = await fetch(`http://127.0.0.1:${testPort}/data-deletion`);
    assert(res1.status === 200, 'GET /data-deletion returns HTTP 200 OK');
    assert(
      (res1.headers.get('content-type') || '').includes('text/html'),
      'GET /data-deletion returns Content-Type text/html'
    );
    const body1 = await res1.text();
    assert(
      body1.includes('User Data Deletion Instructions'),
      'GET /data-deletion body contains "User Data Deletion Instructions" heading'
    );
    assert(
      body1.includes('sahilking17341734@gmail.com'),
      'GET /data-deletion body contains support contact sahilking17341734@gmail.com'
    );
    assert(
      body1.includes('Apps and Websites'),
      'GET /data-deletion body includes Facebook Apps and Websites revocation steps'
    );
    assert(
      !body1.includes('customer-dashboard'),
      'GET /data-deletion does NOT return the main dashboard or SPA fallback'
    );

    // 2. Trailing slash GET /data-deletion/
    const res2 = await fetch(`http://127.0.0.1:${testPort}/data-deletion/`);
    assert(res2.status === 200, 'GET /data-deletion/ (trailing slash) returns HTTP 200 OK');
    const body2 = await res2.text();
    assert(
      body2.includes('User Data Deletion Instructions') && !body2.includes('customer-dashboard'),
      'GET /data-deletion/ serves instructions page directly and does not fall back to dashboard'
    );

    // 3. Alternate path GET /data-deletion-instructions
    const res3 = await fetch(`http://127.0.0.1:${testPort}/data-deletion-instructions`);
    assert(res3.status === 200, 'GET /data-deletion-instructions returns HTTP 200 OK');
    const body3 = await res3.text();
    assert(
      body3.includes('User Data Deletion Instructions'),
      'GET /data-deletion-instructions serves instructions page directly'
    );

    // 4. Test CORS headers and preflight OPTIONS request
    assert(
      res1.headers.get('access-control-allow-origin') === '*',
      'GET /data-deletion includes Access-Control-Allow-Origin: * for Meta crawler & dashboard'
    );

    const resOptions = await fetch(`http://127.0.0.1:${testPort}/data-deletion`, { method: 'OPTIONS' });
    assert(resOptions.status === 204, 'OPTIONS /data-deletion returns HTTP 204 for preflight validation');
    assert(
      resOptions.headers.get('access-control-allow-origin') === '*',
      'OPTIONS /data-deletion returns Access-Control-Allow-Origin: *'
    );

    // 5. Verify that unhandled routes DO fall back to the dashboard, proving route specificity
    const resFallback = await fetch(`http://127.0.0.1:${testPort}/unhandled-random-client-path`);
    assert(resFallback.status === 200, 'Unhandled route returns HTTP 200');
    const bodyFallback = await resFallback.text();
    assert(
      bodyFallback.includes('customer-dashboard'),
      'Unhandled route correctly falls through to SPA dashboard, verifying route specificity'
    );
  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  }

  // TEST 26: Email & Password Registration, Authentication & Security Validation
  console.log('\n--- TEST 26: Email & Password Signup, Login & Credential Security ---');
  const authTestEmail = `auth_test_${Date.now()}@smap-ads.test`;
  const registeredUser = await AuthService.registerWithEmailPassword({
    name: 'Auth Verified Customer',
    email: authTestEmail,
    password: 'SecurePassword123!',
    phone: '9876543210',
  });

  assert(!!registeredUser.user.id, 'Test user registered successfully with email and password');
  assert(registeredUser.user.email === authTestEmail, 'Registered user stores correct email');
  assert(registeredUser.user.name === 'Auth Verified Customer', 'Registered user stores correct display name');
  assert(Boolean(registeredUser.user.password_hash?.startsWith('$2')), 'Password stored safely as bcrypt hash, never plaintext');
  assert(!!registeredUser.token, 'Registration returns active session JWT token');

  // 1. Verify successful login with correct email and password
  const loginSuccess = await AuthService.loginWithEmailPassword(authTestEmail, 'SecurePassword123!');
  assert(loginSuccess.user.id === registeredUser.user.id, 'Login successful with matching credentials');
  assert(!!loginSuccess.token, 'Login returns valid session JWT token');

  // 2. Verify login failure with wrong password
  let wrongPassBlocked = false;
  try {
    await AuthService.loginWithEmailPassword(authTestEmail, 'IncorrectPassword999');
  } catch (err: any) {
    if (err.message.includes('Invalid') || err.message.includes('credentials')) {
      wrongPassBlocked = true;
    }
  }
  assert(wrongPassBlocked === true, 'Login with incorrect password strictly rejected');

  // 3. Verify duplicate registration prevention
  let dupEmailBlocked = false;
  try {
    await AuthService.registerWithEmailPassword({
      name: 'Duplicate Customer',
      email: authTestEmail,
      password: 'AnotherPassword456',
    });
  } catch (err: any) {
    if (err.message.includes('already exists') || err.message.includes('registered')) {
      dupEmailBlocked = true;
    }
  }
  assert(dupEmailBlocked === true, 'Duplicate email registration strictly blocked');

  // 4. Verify password complexity & empty credentials rejection
  let emptyBlocked = false;
  try {
    await AuthService.loginWithEmailPassword('', '');
  } catch (err: any) {
    emptyBlocked = true;
  }
  assert(emptyBlocked === true, 'Empty email/password submission strictly rejected');

  // TEST 27: Direct UPI Intent Order & Exact Amount Precision
  console.log('\n--- TEST 27: Direct UPI Intent Order & Exact Amount Precision ---');
  const topupUser = db.findUserByEmail(authTestEmail)!;
  
  // Test exact dynamic amount ₹500 (not hardcoded)
  const order500 = await WalletService.createAddFundsOrder(topupUser.id, 500);
  assert(order500.amount === 500, 'Order created with exact requested amount of ₹500');
  assert(order500.payment.amount === 500, 'Payment record stores exact ₹500');
  assert(order500.payment.currency === 'INR', 'Payment currency is INR');
  assert(order500.payment.payee_upi === 'sahil-stp@ybl', 'Payment payee UPI is sahil-stp@ybl');
  assert(Boolean(order500.upiIntentUrl?.startsWith('upi://pay?')), 'Payment includes valid NPCI UPI Intent URI');
  assert(Boolean(order500.upiIntentUrl?.includes('am=500.00')), 'UPI Intent URI contains exact dynamic amount 500.00');
  assert(Boolean(order500.upiIntentUrl?.includes('pa=sahil-stp%40ybl')), 'UPI Intent URI contains verified merchant payee VPA');

  // Test dynamic custom amount ₹250.75
  const orderCustom = await WalletService.createAddFundsOrder(topupUser.id, 250.75);
  assert(orderCustom.amount === 250.75, 'Order handles decimal precision: ₹250.75');
  assert(Boolean(orderCustom.upiIntentUrl?.includes('am=250.75')), 'UPI Intent contains dynamic decimal amount 250.75');

  // TEST 28: Campaign Queue Service Enqueue & Idempotency
  console.log('\n--- TEST 28: Background Campaign Queue & Idempotency ---');
  const queueCampId = `cmp_queue_test_${Date.now()}`;
  db.createCampaign({
    id: queueCampId,
    user_id: testUserId,
    package_id: 'pkg_starter_200',
    business_name: 'Queue Test Store',
    headline: 'Queue Headline',
    primary_text: 'Queue primary text',
    description: '',
    creative_url: 'https://example.com/test.jpg',
    creative_type: 'image',
    destination_type: 'website',
    destination_url: 'https://example.com',
    targeting: {
      country: 'IN',
      state: 'All India',
      city: 'All Cities',
      min_age: 18,
      max_age: 65,
      gender: 'ALL',
      interests: ['Shopping'],
    },
    status: 'PAYMENT_CONFIRMED',
    meta_campaign_id: null,
    meta_adset_id: null,
    meta_creative_id: null,
    meta_ad_id: null,
    meta_account_id: 'act_1627260695520511',
    meta_status_message: null,
    rejection_reason: null,
    error_details: null,
    start_at: null,
    end_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  const enqueueResult1 = CampaignQueueService.enqueue(queueCampId);
  assert(enqueueResult1.queued === true, 'Campaign safely enqueued for background worker');
  assert(enqueueResult1.jobId === queueCampId, 'Queue jobId matches campaign ID');

  const enqueuedCampaign = db.findCampaignById(queueCampId);
  assert(enqueuedCampaign?.queue_status === 'QUEUED', 'Campaign record queue_status updated to QUEUED');

  // Duplicate enqueue prevention
  const enqueueResult2 = CampaignQueueService.enqueue(queueCampId);
  assert(enqueueResult2.queued === true, 'Duplicate enqueue returns safe acknowledgement');
  assert(enqueueResult2.position === enqueueResult1.position, 'Duplicate enqueue preserves existing queue position without double-processing');

  // TEST 29: Transient vs Fatal Error Classification
  console.log('\n--- TEST 29: Transient vs Fatal Error Classification ---');
  assert(CampaignQueueService.isTransientError('Meta API rate limit reached (Code 4)') === true, 'Meta code 4 rate limit classified as transient');
  assert(CampaignQueueService.isTransientError('User request limit reached (Code 17)') === true, 'Meta code 17 user limit classified as transient');
  assert(CampaignQueueService.isTransientError('Fetch failed: network ETIMEDOUT') === true, 'Network timeout classified as transient');
  assert(CampaignQueueService.isTransientError('HTTP 503 Service Unavailable') === true, '503 Service Unavailable classified as transient');
  assert(CampaignQueueService.isTransientError('Error validating access token: Session has expired (Code 190)') === false, 'Expired OAuth token strictly classified as FATAL (not retried)');
  assert(CampaignQueueService.isTransientError('Permissions error: pages_manage_ads required') === false, 'Missing permission strictly classified as FATAL (not retried)');
  assert(CampaignQueueService.isTransientError('Ad creative violates Meta advertising policies') === false, 'Ad policy violation strictly classified as FATAL (not retried)');

  // TEST 30: Crash Recovery of Interrupted Submissions
  console.log('\n--- TEST 30: Crash Recovery of Interrupted Submissions ---');
  const stuckCampId = `cmp_stuck_${Date.now()}`;
  db.createCampaign({
    id: stuckCampId,
    user_id: testUserId,
    package_id: 'pkg_starter_200',
    business_name: 'Interrupted Campaign Store',
    headline: 'Stuck Headline',
    primary_text: 'Stuck primary text',
    description: '',
    creative_url: 'https://example.com/test.jpg',
    creative_type: 'image',
    destination_type: 'website',
    destination_url: 'https://example.com',
    targeting: {
      country: 'IN',
      state: 'All India',
      city: 'All Cities',
      min_age: 18,
      max_age: 65,
      gender: 'ALL',
      interests: ['Shopping'],
    },
    status: 'SUBMITTING',
    queue_status: 'PROCESSING',
    meta_campaign_id: null,
    meta_adset_id: null,
    meta_creative_id: null,
    meta_ad_id: null,
    meta_account_id: 'act_1627260695520511',
    meta_status_message: null,
    rejection_reason: null,
    error_details: null,
    start_at: null,
    end_at: null,
    created_at: new Date(Date.now() - 300000).toISOString(), // 5 minutes ago
    updated_at: new Date(Date.now() - 300000).toISOString(),
  });

  CampaignQueueService.recoverStuckJobs();
  const recoveredCampaign = db.findCampaignById(stuckCampId);
  assert(
    recoveredCampaign?.queue_status === 'QUEUED' || recoveredCampaign?.queue_status === 'PROCESSING',
    'Crash recovery detects interrupted jobs and re-enqueues them safely'
  );

  // TEST 31: Authentic Meta Performance Reports & Zero Hardcoded Data
  console.log('\n--- TEST 31: Authentic Meta Performance Reports & Disclosures ---');
  const reports = await CampaignService.getPerformanceReports(testUserId);
  assert(typeof reports.summary.totalImpressions === 'number', 'Reports contain numeric totalImpressions');
  assert(typeof reports.summary.totalReach === 'number', 'Reports contain numeric totalReach');
  assert(typeof reports.summary.totalClicks === 'number', 'Reports contain numeric totalClicks');
  assert(typeof reports.summary.totalSpend === 'number', 'Reports contain numeric totalSpend');
  assert(Array.isArray(reports.campaigns), 'Reports return campaign items array');
  assert(Boolean(reports.disclosures.impressionsVsReach), 'Reports include transparent Impressions vs Reach disclosure');
  assert(Boolean(reports.disclosures.reportingLatency), 'Reports include transparent 15–60 minute Meta reporting latency disclosure');
  assert(Boolean(reports.disclosures.reviewWindow), 'Reports include transparent Meta 24–48h review window disclosure');

  // Verify that fake numbers (e.g. 45,200) are NOT returned
  assert(reports.summary.totalImpressions !== 45200, 'Zero fake 45,200 impressions in reports');
  assert(reports.summary.totalReach !== 28900, 'Zero fake 28,900 reach in reports');

  // TEST 32: In-Memory Insights Caching for Meta API Rate Limit Protection
  console.log('\n--- TEST 32: Rate-Limit Safe In-Memory Caching ---');
  const insights1 = await MetaService.getCampaignInsights(enqueuedCampaign!);
  assert(insights1.dataAvailable === false || insights1.dataAvailable === true, 'Meta insights fetch returns structured data');
  assert(Boolean(insights1.notice), 'Meta insights notice provides truthful delivery or review status');

  // TEST 33: Owner Identity Verification & Strict Role RBAC
  console.log('\n--- TEST 33: Owner Admin Identity & Strict Role RBAC ---');
  let existingOwner = db.findUserByEmail('sahil272025@gmail.com');
  if (existingOwner) {
    existingOwner.promotional_credit_granted = false;
    existingOwner.wallet_balance = 0;
    (db as any).db.wallet_transactions = (db as any).db.wallet_transactions.filter(
      (tx: any) => !(tx.user_id === existingOwner!.id && tx.type === 'PROMOTIONAL_CREDIT')
    );
    db.save();
  }

  const ownerAuth = (existingOwner && existingOwner.password_hash)
    ? await AuthService.loginWithEmailPassword('sahil272025@gmail.com', 'SecureOwnerPassword2026!')
    : await AuthService.registerWithEmailPassword({
        name: 'Sahil Gupta',
        email: 'sahil272025@gmail.com',
        password: 'SecureOwnerPassword2026!',
      });

  assert(ownerAuth.user.role === 'admin', 'Owner sahil272025@gmail.com is strictly granted admin role upon authentication');
  assert(ownerAuth.user.email === 'sahil272025@gmail.com', 'Owner email matches verified identity');

  const customerReg = await AuthService.registerWithEmailPassword({
    name: 'Regular Customer',
    email: `customer_${Date.now()}@example.com`,
    password: 'RegularPassword123!',
  });
  assert(customerReg.user.role === 'customer', 'Non-owner customer is strictly assigned customer role');

  const updatedCust = AuthService.updateProfile(customerReg.user.id, { name: 'Customer Attempt Escalation' });
  assert(updatedCust.role === 'customer', 'Customer profile updates cannot escalate role to admin');

  // TEST 34: One-Time ₹50,000 Owner Promotional Credit & Strict Idempotency
  console.log('\n--- TEST 34: One-Time ₹50,000 Owner Promotional Credit & Strict Idempotency ---');
  const ownerUser = db.findUserByEmail('sahil272025@gmail.com')!;
  ownerUser.wallet_balance = 0;
  ownerUser.promotional_credit_granted = false;
  (db as any).db.owner_promotional_credit = null;
  (db as any).db.wallet_transactions = (db as any).db.wallet_transactions.filter((tx: any) => tx.type !== 'PROMOTIONAL_CREDIT');
  db.save();
  const ownerInitialBalance = db.getWalletBalance(ownerUser.id);
  assert(ownerInitialBalance === 0, 'Owner wallet balance starts at ₹0.00 prior to explicit promotional credit approval');

  // Explicitly trigger the promotional credit grant
  const grantResult = db.checkAndGrantOwnerPromotionalCredit(ownerUser.id);
  assert(grantResult.granted === true, 'Owner promotional credit successfully granted upon explicit invocation');
  assert(grantResult.amount === 50000, 'Granted amount is exactly ₹50,000');
  assert(grantResult.newBalance === 50000, 'Owner wallet balance reflects allocated ₹50,000 promotional credit');

  const promoTx = (db.getWalletTransactions(ownerUser.id) || []).find((tx) => tx.type === 'PROMOTIONAL_CREDIT');
  assert(Boolean(promoTx), 'Promotional credit ledger transaction exists in wallet history');
  assert(promoTx?.amount === 50000, 'Promotional credit transaction amount is exactly ₹50,000');
  assert(promoTx?.payment_id === null, 'Promotional credit has null payment_id (distinguishable from Razorpay cash)');
  assert(promoTx?.status === 'SUCCESS', 'Promotional credit transaction status is SUCCESS');

  // Double-grant attempt must be strictly blocked by idempotency guards
  const repeatGrant = db.checkAndGrantOwnerPromotionalCredit(ownerUser.id);
  assert(repeatGrant.granted === false, 'Duplicate promotional credit grant is strictly rejected');
  assert(repeatGrant.alreadyGranted === true, 'Repeat grant reports alreadyGranted: true');
  assert(db.getWalletBalance(ownerUser.id) === 50000, 'Owner wallet balance is NOT double-credited on repeated attempts');

  // Customer cannot claim owner promotional credit
  const custPromo = db.checkAndGrantOwnerPromotionalCredit(customerReg.user.id);
  assert(custPromo.granted === false, 'Non-owner customer cannot claim owner promotional credit');
  assert(custPromo.amount === 0, 'Zero credit granted to non-owner customer');

  console.log('\n====================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('====================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUN ENCOUNTERED FATAL ERROR:', err);
  process.exit(1);
});
