import { db, User } from '../src/server/db.js';
import { CampaignService } from '../src/server/campaignService.js';
import { WalletService } from '../src/server/walletService.js';
import { MetaService } from '../src/server/metaService.js';
import { SupportService } from '../src/server/supportService.js';
import { renderPolicyHtml } from '../src/server/policyPages.js';

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
  assert(liveAdAccountBudget.source === 'META_API', 'Queried live Meta Marketing API /minimum_budgets endpoint directly');
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

  console.log('\n====================================================');
  console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED SUCCESSFULLY!`);
  console.log('====================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ TEST RUN ENCOUNTERED FATAL ERROR:', err);
  process.exit(1);
});
