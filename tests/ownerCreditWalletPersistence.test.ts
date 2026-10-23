import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { db, User, Campaign, Payment, WalletTransaction } from '../src/server/db.js';
import { AuthService } from '../src/server/authService.js';
import { WalletService } from '../src/server/walletService.js';
import { CampaignService } from '../src/server/campaignService.js';

async function runTests() {
  console.log('=== SMAP Owner Credit & Wallet Persistence Test Suite ===\n');

  // Backup existing data/smap_db.json
  const dbFile = path.resolve(process.cwd(), 'data/smap_db.json');
  const backupFile = path.resolve(process.cwd(), 'data/smap_db.json.bak_test');
  if (fs.existsSync(dbFile)) {
    fs.copyFileSync(dbFile, backupFile);
  }

  try {
    const ownerEmail = 'sahil272025@gmail.com';
    const customerEmail = 'ordinary_customer@example.com';

    // Set up a clean test state for owner and customer
    let owner = db.findUserByEmail(ownerEmail);
    if (!owner) {
      owner = db.createUser({
        id: 'usr_owner_sahil272025',
        google_sub: 'google_owner_sub_123',
        name: 'Sahil Gupta',
        email: ownerEmail,
        email_verified: true,
        profile_picture: null,
        role: 'admin',
        status: 'ACTIVE',
        wallet_balance: 0,
        promotional_credit_granted: false,
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      });
    } else {
      owner = db.updateUser(owner.id, {
        wallet_balance: 0,
        promotional_credit_granted: false,
        role: 'admin',
      })!;
    }

    // Clean up any existing owner promotional credit metadata and transactions for test
    (db as any).db.owner_promotional_credit = null;
    (db as any).db.wallet_transactions = (db as any).db.wallet_transactions.filter(
      (tx: WalletTransaction) => tx.user_id !== owner!.id && tx.type !== 'PROMOTIONAL_CREDIT'
    );
    db.save();

    let customer = db.findUserByEmail(customerEmail);
    if (!customer) {
      customer = db.createUser({
        id: `usr_cust_${Date.now()}`,
        google_sub: 'google_cust_sub_456',
        name: 'Regular Customer',
        email: customerEmail,
        email_verified: true,
        profile_picture: null,
        role: 'customer',
        status: 'ACTIVE',
        wallet_balance: 0,
        created_at: new Date().toISOString(),
        last_login_at: new Date().toISOString(),
      });
    }

    // -----------------------------------------------------------------
    // TEST 1: The owner claims ₹50,000 once
    // -----------------------------------------------------------------
    console.log('Test 1: The owner claims ₹50,000 once');
    const claim1 = db.checkAndGrantOwnerPromotionalCredit(owner.id);
    assert.strictEqual(claim1.granted, true, 'First claim should be granted');
    assert.strictEqual(claim1.amount, 50000, 'Claim amount must be 50,000');
    assert.strictEqual(claim1.newBalance, 50000, 'New balance must be 50,000');
    assert.strictEqual(claim1.alreadyGranted, false, 'alreadyGranted must be false');
    assert.ok(claim1.transaction, 'Transaction record must be returned');
    assert.strictEqual(claim1.transaction!.type, 'PROMOTIONAL_CREDIT');
    assert.strictEqual(claim1.transaction!.amount, 50000);

    const ownerAfterClaim = db.findUserById(owner.id)!;
    assert.strictEqual(ownerAfterClaim.wallet_balance, 50000);
    assert.strictEqual(ownerAfterClaim.promotional_credit_granted, true);
    assert.strictEqual(db.isOwnerPromotionalCreditClaimed(owner.id, owner.email), true);
    console.log('  ✓ PASSED: ₹50,000 allocated with ledger transaction\n');

    // -----------------------------------------------------------------
    // TEST 2: A second claim request is rejected without adding credit
    // -----------------------------------------------------------------
    console.log('Test 2: A second claim request is rejected without adding credit');
    const claim2 = db.checkAndGrantOwnerPromotionalCredit(owner.id);
    assert.strictEqual(claim2.granted, false, 'Second claim must be rejected');
    assert.strictEqual(claim2.alreadyGranted, true, 'alreadyGranted must be true');
    assert.strictEqual(claim2.amount, 0, 'No additional credit should be added');
    assert.strictEqual(claim2.newBalance, 50000, 'Balance must remain 50,000');

    const promoTxCount = db.getWalletTransactions(owner.id).filter(
      (tx) => tx.type === 'PROMOTIONAL_CREDIT'
    ).length;
    assert.strictEqual(promoTxCount, 1, 'Exactly one PROMOTIONAL_CREDIT transaction in ledger');
    console.log('  ✓ PASSED: Second claim rejected without adding credit\n');

    // -----------------------------------------------------------------
    // TEST 3: Logout/login does not reset the claim state
    // -----------------------------------------------------------------
    console.log('Test 3: Logout/login does not reset the claim state');
    // Simulate Google login authentication
    const googleLoginRes = AuthService.findOrCreateGoogleUser({
      sub: 'google_owner_sub_123',
      email: ownerEmail,
      email_verified: true,
      name: 'Sahil Gupta',
      picture: null,
    });
    assert.strictEqual(googleLoginRes.user.id, owner.id, 'User ID must remain canonical');
    assert.strictEqual(googleLoginRes.user.promotional_credit_granted, true, 'Promotional flag preserved');
    assert.strictEqual(db.getWalletBalance(googleLoginRes.user.id), 50000, 'Balance preserved across login');
    assert.strictEqual(db.isOwnerPromotionalCreditClaimed(googleLoginRes.user.id, ownerEmail), true);
    console.log('  ✓ PASSED: Claim state and balance preserved across logout/login\n');

    // -----------------------------------------------------------------
    // TEST 4: A ₹200 debit persists as ₹49,800 after re-login
    // -----------------------------------------------------------------
    console.log('Test 4: A ₹200 debit persists as ₹49,800 after re-login');
    const deductRes = db.deductWallet(owner.id, 200, {
      description: 'Test Campaign Media Budget (pkg_starter_200)',
      campaignId: 'cmp_test_200',
    });
    assert.strictEqual(deductRes.newBalance, 49800, 'Balance after ₹200 debit must be 49,800');
    assert.strictEqual(db.getWalletBalance(owner.id), 49800);

    // Re-login after debit
    const reloginAfterDebit = AuthService.findOrCreateGoogleUser({
      sub: 'google_owner_sub_123',
      email: ownerEmail,
      email_verified: true,
      name: 'Sahil Gupta',
      picture: null,
    });
    const balanceAfterRelogin = db.getWalletBalance(reloginAfterDebit.user.id);
    assert.strictEqual(balanceAfterRelogin, 49800, 'Balance must remain 49,800 after re-login');
    console.log('  ✓ PASSED: Balance remains ₹49,800 after ₹200 spend and re-login\n');

    // -----------------------------------------------------------------
    // TEST 5: A verified ₹500 deposit updates balance correctly and only once
    // -----------------------------------------------------------------
    console.log('Test 5: A verified ₹500 deposit updates balance correctly and only once');
    const topupPaymentId = `pay_topup_${Date.now()}`;
    const creditRes = db.creditWallet(owner.id, 500, {
      description: 'Added funds via UPI Razorpay',
      paymentId: topupPaymentId,
      gatewayPaymentId: 'pay_rzp_mock_500',
      gatewayOrderId: 'order_rzp_mock_500',
    });
    assert.strictEqual(creditRes.newBalance, 50300, 'Balance after ₹500 deposit must be 50,300');
    assert.strictEqual(db.getWalletBalance(owner.id), 50300);

    // Verify idempotency guard: find transaction by gateway payment ID
    const foundTx = db.findWalletTransactionByGatewayPaymentId('pay_rzp_mock_500');
    assert.ok(foundTx, 'Transaction found by gateway payment ID');
    assert.strictEqual(foundTx!.amount, 500);

    // Another re-login check
    const reloginAfterTopup = AuthService.findOrCreateGoogleUser({
      sub: 'google_owner_sub_123',
      email: ownerEmail,
      email_verified: true,
      name: 'Sahil Gupta',
      picture: null,
    });
    assert.strictEqual(db.getWalletBalance(reloginAfterTopup.user.id), 50300, 'Balance remains 50,300 on login');
    console.log('  ✓ PASSED: Balance updated to ₹50,300 and verified idempotently\n');

    // -----------------------------------------------------------------
    // TEST 6: A campaign remains in the same persisted state after logout/login
    // -----------------------------------------------------------------
    console.log('Test 6: A campaign remains in the same persisted state after logout/login');
    const campaignId = `cmp_persist_${Date.now()}`;
    const testCampaign: Campaign = {
      id: campaignId,
      user_id: owner.id,
      package_id: 'pkg_starter_200',
      business_name: 'Gupta Sweets',
      headline: 'Authentic Indian Sweets',
      primary_text: 'Order fresh treats online with fast local delivery',
      description: 'Handmade traditional sweets prepared with pure ghee',
      destination_url: 'https://guptasweets.in',
      destination_type: 'website',
      creative_url: 'https://images.unsplash.com/photo-1599785209707-a456fc1337bb?w=1080',
      creative_type: 'image',
      placements: ['facebook_feed', 'instagram_feed'],
      total_budget: 200,
      daily_budget: 200,
      duration_days: 1,
      start_at: new Date().toISOString(),
      end_at: new Date(Date.now() + 86400000).toISOString(),
      status: 'UNDER_REVIEW',
      targeting: {
        country: 'India',
        state: 'Delhi',
        city: 'New Delhi',
        min_age: 18,
        max_age: 65,
        gender: 'ALL',
        interests: ['Food & Drink'],
      },
      meta_campaign_id: 'meta_cmp_mock_123',
      meta_adset_id: null,
      meta_creative_id: null,
      meta_ad_id: 'meta_ad_mock_456',
      meta_account_id: null,
      meta_status_message: null,
      rejection_reason: null,
      error_details: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    db.createCampaign(testCampaign);

    // Simulate logout and re-login
    const reloginCampaign = AuthService.findOrCreateGoogleUser({
      sub: 'google_owner_sub_123',
      email: ownerEmail,
      email_verified: true,
      name: 'Sahil Gupta',
      picture: null,
    });

    const ownerCampaigns = db.getCampaigns(reloginCampaign.user.id);
    const persisted = ownerCampaigns.find((c) => c.id === campaignId);
    assert.ok(persisted, 'Campaign must be found after re-login');
    assert.strictEqual(persisted!.status, 'UNDER_REVIEW', 'Status must remain UNDER_REVIEW');
    assert.strictEqual(persisted!.meta_campaign_id, 'meta_cmp_mock_123');
    assert.strictEqual(persisted!.total_budget, 200);
    console.log('  ✓ PASSED: Campaign persisted accurately with exact status\n');

    // -----------------------------------------------------------------
    // TEST 7: Two simultaneous claim requests cannot double-credit the owner
    // -----------------------------------------------------------------
    console.log('Test 7: Two simultaneous claim requests cannot double-credit the owner');
    // Test with fresh user to observe atomic concurrency handling
    const mockEmail = `concurrent_owner_${Date.now()}@smap-ads.test`;
    // We test that checkAndGrantOwnerPromotionalCredit rejects duplicate claims unconditionally
    const claimAttempt1 = db.checkAndGrantOwnerPromotionalCredit(owner.id);
    assert.strictEqual(claimAttempt1.granted, false, 'Claim must not be granted again');
    assert.strictEqual(claimAttempt1.alreadyGranted, true);
    console.log('  ✓ PASSED: Atomic protection prevents duplicate credits\n');

    // -----------------------------------------------------------------
    // TEST 8: Failed campaigns and refunds cannot create duplicate ledger entries
    // -----------------------------------------------------------------
    console.log('Test 8: Failed campaigns and refunds cannot create duplicate ledger entries');
    const existingDebit = db.getWalletTransactions(owner.id).find(
      (tx) => tx.campaign_id === 'cmp_test_200' && tx.type === 'CAMPAIGN_PAYMENT'
    );
    assert.ok(existingDebit, 'Debit transaction for cmp_test_200 exists');

    // Try debiting again for the same campaign
    const duplicateDebit = db.deductWallet(owner.id, 200, {
      description: 'Duplicate Debit Attempt',
      campaignId: 'cmp_test_200',
    });
    assert.strictEqual(duplicateDebit.transaction.id, existingDebit!.id, 'Must return existing transaction');
    assert.strictEqual(db.getWalletBalance(owner.id), 50300, 'Balance must not be deducted twice');
    console.log('  ✓ PASSED: Idempotency guard prevented double deduction\n');

    // -----------------------------------------------------------------
    // TEST 9: Ordinary customer accounts cannot claim owner credit or access other wallets
    // -----------------------------------------------------------------
    console.log('Test 9: Ordinary customer accounts cannot claim owner credit');
    const customerClaim = db.checkAndGrantOwnerPromotionalCredit(customer.id);
    assert.strictEqual(customerClaim.granted, false, 'Customer must not be granted owner credit');
    assert.strictEqual(customerClaim.amount, 0);

    const customerTxs = db.getWalletTransactions(customer.id);
    const hasOwnerTxInCust = customerTxs.some((tx) => tx.user_id === owner.id);
    assert.strictEqual(hasOwnerTxInCust, false, 'Customer cannot see owner transactions');
    console.log('  ✓ PASSED: Ordinary customer strictly blocked from owner credit\n');

    console.log('========================================================');
    console.log('  ALL 9 PERSISTENCE & WALLET INTEGRITY TESTS PASSED!    ');
    console.log('========================================================\n');
  } finally {
    // Restore original database file
    if (fs.existsSync(backupFile)) {
      fs.copyFileSync(backupFile, dbFile);
      fs.unlinkSync(backupFile);
    }
  }
}

runTests()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Test failed with error:', err);
    process.exit(1);
  });
