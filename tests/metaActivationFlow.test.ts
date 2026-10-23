import fs from 'fs';
import path from 'path';
import { db, User, Campaign, Package } from '../src/server/db.js';
import { MetaService } from '../src/server/metaService.js';
import { CampaignService } from '../src/server/campaignService.js';
import { CampaignQueueService } from '../src/server/campaignQueue.js';

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

async function runMetaActivationTests() {
  console.log('========================================================');
  console.log('🧪 SMAP — Meta Ads Activation Flow & Safety Gate Tests');
  console.log('========================================================\n');

  // Setup test user
  const testUserId = `test_meta_usr_${Date.now()}`;
  const testUser: User = {
    id: testUserId,
    email: `meta_owner_${Date.now()}@smap-ads.test`,
    name: 'Meta Test Owner',
    role: 'customer',
    status: 'ACTIVE',
    google_sub: `sub_meta_${Date.now()}`,
    email_verified: true,
    profile_picture: null,
    last_login_at: new Date().toISOString(),
    wallet_balance: 5000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.createUser(testUser);

  // Setup test package with valid Meta daily media spend (>= ₹85/day)
  const testPkg: Package = {
    id: 'pkg_test_pro_1000',
    name: 'Pro Test Sprint',
    price: 1000,
    duration_days: 5,
    platform_fee: 500,
    media_spend: 500, // ₹100/day >= ₹85/day Meta impression minimum
    platforms: ['Facebook', 'Instagram'],
    features: ['5 days', 'Testing'],
    active: true,
    created_at: new Date().toISOString(),
  };
  db.createPackage(testPkg);

  // Setup test campaign
  const testCampaignId = `smap_cmp_test_${Date.now()}`;
  const testCampaign: Campaign = {
    id: testCampaignId,
    user_id: testUserId,
    package_id: 'pkg_test_pro_1000',
    objective: 'TRAFFIC',
    creative_url: '/smap_hero_visual_1790756029679.jpg',
    creative_type: 'image',
    business_name: 'SMAP Verified Electronics',
    primary_text: 'High performance audio gear with 1 year warranty.',
    headline: 'Premium Wireless Audio Store',
    description: 'Shop verified audio equipment across India with express doorstep delivery.',
    call_to_action: 'LEARN_MORE',
    destination_type: 'website',
    destination_url: 'https://example-audio-store.in',
    placements: ['facebook_feed', 'instagram_feed', 'instagram_stories', 'instagram_reels'],
    targeting: {
      country: 'IN',
      state: 'All States',
      city: 'All Cities',
      min_age: 18,
      max_age: 65,
      gender: 'ALL',
      interests: ['Consumer Electronics', 'Audio Equipment'],
      locations: ['All India'],
      estimated_audience_size: '15M - 20M people',
    },
    daily_budget: 100,
    duration_days: 5,
    total_budget: 1000,
    start_at: new Date().toISOString(),
    end_at: new Date(Date.now() + 5 * 24 * 3600 * 1000).toISOString(),
    status: 'PAYMENT_CONFIRMED',
    meta_campaign_id: null,
    meta_adset_id: null,
    meta_creative_id: null,
    meta_ad_id: null,
    meta_account_id: 'act_1627260695520511',
    meta_status_message: 'Payment confirmed. Awaiting Meta review.',
    rejection_reason: null,
    error_details: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  db.createCampaign(testCampaign);

  // TEST 1: META_LIVE_SUBMISSIONS_ENABLED is false by default
  console.log('--- TEST 1: Live Submission Safety Gate Disabled by Default ---');
  const envVal = process.env.META_LIVE_SUBMISSIONS_ENABLED;
  assert(envVal !== 'true', 'META_LIVE_SUBMISSIONS_ENABLED is false or unset in environment by default');
  
  const gateCheck = MetaService.canSubmitLiveCampaigns();
  assert(gateCheck.allowed === false, 'canSubmitLiveCampaigns() returns allowed: false when flag is not true');
  assert(gateCheck.reason.includes('META_LIVE_SUBMISSIONS_ENABLED'), 'Safety gate provides explicit reason citing META_LIVE_SUBMISSIONS_ENABLED');

  // TEST 2: Structured Activation Prerequisites & Blocker Analysis
  console.log('\n--- TEST 2: Activation Status & Blocker Reporting ---');
  const actStatus = await MetaService.getActivationStatus();
  assert(actStatus.liveSubmissionsEnabled === false, 'Activation report confirms live submissions are disabled');
  assert(actStatus.dryRunSupported === true, 'Activation report confirms safe dry-run mode is supported');
  assert(actStatus.metaApp.mode === 'DEVELOPMENT', 'Meta Developer App mode identified as DEVELOPMENT');
  assert(actStatus.metaApp.accessLevel === 'STANDARD_ACCESS', 'Meta access level identified as STANDARD_ACCESS');
  assert(actStatus.allPrerequisitesMet === false, 'allPrerequisitesMet is false while blockers exist');
  assert(actStatus.blockers.length >= 2, 'Activation report enumerates specific blockers');
  assert(actStatus.actionableSteps.length >= 4, 'Activation report provides actionable next steps for owner');
  assert(actStatus.productionActivationGuide.configKey === 'META_LIVE_SUBMISSIONS_ENABLED', 'Activation guide references correct configKey');

  // TEST 3: Campaign Pre-Flight Validation (Valid Campaign)
  console.log('\n--- TEST 3: Safe Pre-Flight Validation on Valid Campaign ---');
  const validPreFlight = await MetaService.validateCampaignPreFlight(testCampaign);
  assert(validPreFlight.valid === true, 'Pre-flight validation succeeds for properly configured campaign');
  assert(validPreFlight.dryRun === true, 'Pre-flight validation flag indicates dry-run mode');
  assert(validPreFlight.errors.length === 0, 'No validation errors on valid campaign');
  assert(validPreFlight.details.headlineValid === true, 'Headline is validated within character limits');
  assert(validPreFlight.details.destinationValid === true, 'Destination URL is validated');

  // TEST 4: Campaign Pre-Flight Validation Catches Invalid Copy
  console.log('\n--- TEST 4: Pre-Flight Validation Rejects Oversized Copy ---');
  const invalidCopyCampaign = {
    ...testCampaign,
    headline: 'A'.repeat(101), // exceeds 100 char limit
    description: 'B'.repeat(401), // exceeds 400 char limit
  };
  const invalidCopyResult = await MetaService.validateCampaignPreFlight(invalidCopyCampaign);
  assert(invalidCopyResult.valid === false, 'Pre-flight fails when headline exceeds 100 chars');
  assert(invalidCopyResult.errors.some(e => e.includes('100 character limit')), 'Reports headline limit violation');
  assert(invalidCopyResult.errors.some(e => e.includes('400 character limit')), 'Reports description limit violation');

  // TEST 5: Pre-Flight Validation Catches Budget Below Meta Minimum Floor
  console.log('\n--- TEST 5: Pre-Flight Validation Enforces Meta Minimum Budget Floor ---');
  const underfundedCampaign: Campaign = {
    ...testCampaign,
    id: `smap_cmp_low_${Date.now()}`,
    total_budget: 100, // media spend = ₹50 over 10 days = ₹5/day (Meta minimum is ~₹85/day)
    duration_days: 10,
    daily_budget: 10,
    package_id: 'custom_low_budget',
  };
  const budgetResult = await MetaService.validateCampaignPreFlight(underfundedCampaign);
  assert(budgetResult.valid === false, 'Pre-flight fails when daily media spend is below Meta minimum daily budget');
  assert(budgetResult.errors.some(e => e.includes('below Meta minimum daily budget floor')), 'Explains Meta minimum budget rule without spending money');

  // TEST 6: Pre-Flight Validation Catches Invalid Destination URLs & Phone
  console.log('\n--- TEST 6: Pre-Flight Validation Verifies Destination URLs & CTA ---');
  const invalidUrlCampaign = {
    ...testCampaign,
    destination_url: 'not-a-valid-url',
  };
  const urlResult = await MetaService.validateCampaignPreFlight(invalidUrlCampaign);
  assert(urlResult.valid === false, 'Rejects invalid website URL protocol');

  const invalidCallCampaign: Campaign = {
    ...testCampaign,
    call_to_action: 'CALL_NOW',
    destination_type: 'phone',
    phone_number: '1234', // invalid short phone
  };
  const callResult = await MetaService.validateCampaignPreFlight(invalidCallCampaign);
  assert(callResult.valid === false, 'Rejects Call Now campaign with phone under 10 digits');

  // TEST 7: Safe Dry-Run Campaign Submission (₹0 Spent, Campaign NOT Failed)
  console.log('\n--- TEST 7: Safe Dry-Run Submission Execution ---');
  const submitResult = await MetaService.submitCampaignToMeta(testCampaign, undefined, { dryRun: true });
  assert(submitResult.success === true, 'submitCampaignToMeta() succeeds in safe dry-run mode');
  assert(submitResult.dryRun === true, 'dryRun flag is returned as true');
  assert(submitResult.status === 'UNDER_REVIEW', 'Campaign status set to UNDER_REVIEW (safe hold), NOT FAILED');
  assert(!submitResult.meta_campaign_id, 'No real Meta campaign ID is fabricated in dry-run mode');
  assert(Boolean(submitResult.notes?.includes('Safe Dry-Run Mode')), 'Notes confirm safe dry-run mode and ₹0 spend');

  // TEST 8: Queue Processing with Dry-Run Mode (Crash Recovery & Non-Failing Status)
  console.log('\n--- TEST 8: Background Queue Processing in Dry-Run Mode ---');
  const queueCampaignId = `smap_cmp_q_${Date.now()}`;
  const queueCampaign: Campaign = {
    ...testCampaign,
    id: queueCampaignId,
    status: 'PAYMENT_CONFIRMED',
    queue_status: 'QUEUED',
  };
  db.createCampaign(queueCampaign);

  // Enqueue job
  const enqueueRes = CampaignQueueService.enqueue(queueCampaignId);
  assert(enqueueRes.queued === true, 'Campaign enqueued successfully');
  assert(enqueueRes.jobId === queueCampaignId, 'Queue returns correct jobId');

  // Duplicate enqueue prevention
  const dupEnqueue = CampaignQueueService.enqueue(queueCampaignId);
  assert(dupEnqueue.queued === true, 'Duplicate enqueue handled idempotently');
  assert(dupEnqueue.position === 1, 'Duplicate job does not create additional queue entry');

  // Allow queue execution to complete
  const pollStart = Date.now();
  let afterQueueCmp = db.findCampaignById(queueCampaignId);
  while (afterQueueCmp?.queue_status !== 'COMPLETED' && afterQueueCmp?.queue_status !== 'FAILED' && Date.now() - pollStart < 5000) {
    await new Promise(r => setTimeout(r, 100));
    afterQueueCmp = db.findCampaignById(queueCampaignId);
  }

  assert(!!afterQueueCmp, 'Campaign exists after worker execution');
  if (afterQueueCmp?.status !== 'UNDER_REVIEW') {
    console.error(`Current campaign after queue: status=${afterQueueCmp?.status}, queue_status=${afterQueueCmp?.queue_status}, msg=${afterQueueCmp?.meta_status_message}`);
  }
  assert(afterQueueCmp?.status === 'UNDER_REVIEW', 'Worker transitioned campaign to UNDER_REVIEW, not FAILED');
  assert(afterQueueCmp?.queue_status === 'COMPLETED', 'Queue status marked COMPLETED');
  assert(Boolean(afterQueueCmp?.meta_status_message?.includes('Dry-Run Mode')), 'Status message notes dry-run holding');
  assert(afterQueueCmp?.rejection_reason === null, 'No rejection reason recorded for dry-run hold');

  // TEST 9: Error Classification (Transient vs Permanent)
  console.log('\n--- TEST 9: Error Classification Logic ---');
  assert(CampaignQueueService.isTransientError('fetch failed: network timeout') === true, 'Classifies network timeout as transient');
  assert(CampaignQueueService.isTransientError('Meta API 503 Service Unavailable') === true, 'Classifies 503 error as transient');
  assert(CampaignQueueService.isTransientError('User request limit reached: code 17') === true, 'Classifies rate limit as transient');
  assert(CampaignQueueService.isTransientError('Invalid OAuth access token: session expired') === false, 'Classifies expired token as fatal/permanent');
  assert(CampaignQueueService.isTransientError('Missing permission: pages_manage_ads') === false, 'Classifies missing permission as fatal/permanent');
  assert(CampaignQueueService.isTransientError('Ad policy disapproved: prohibited financial products') === false, 'Classifies policy disapproval as fatal/permanent');

  // TEST 10: Truthful Campaign Status Safeguard (Never ACTIVE without Meta Confirmation)
  console.log('\n--- TEST 10: Delivery Status Truthfulness Safeguard ---');
  const dummyCampaign: Campaign = {
    ...testCampaign,
    id: `smap_cmp_dummy_${Date.now()}`,
    status: 'UNDER_REVIEW',
    meta_campaign_id: null,
  };
  const reconciled = await MetaService.reconcileCampaignStatus(dummyCampaign);
  assert(reconciled.status !== 'ACTIVE', 'Campaign without confirmed Meta active delivery is NEVER marked ACTIVE');
  assert(reconciled.status === 'UNDER_REVIEW', 'Preserves UNDER_REVIEW status truthfully');

  console.log('\n========================================================');
  console.log(`🎉 All ${passedTests}/${totalTests} Meta Activation Tests PASSED!`);
  console.log('========================================================\n');
}

runMetaActivationTests()
  .then(() => {
    CampaignQueueService.stop();
    process.exit(0);
  })
  .catch((err) => {
    CampaignQueueService.stop();
    console.error('Test execution failed:', err);
    process.exit(1);
  });
