import { db } from '../src/server/db.js';

interface CliArgs {
  apply: boolean;
  userId?: string;
  email?: string;
  reason?: string;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  const result: CliArgs = { apply: false };

  for (const arg of args) {
    if (arg === '--apply') {
      result.apply = true;
    } else if (arg.startsWith('--userId=')) {
      result.userId = arg.split('=')[1];
    } else if (arg.startsWith('--email=')) {
      result.email = arg.split('=')[1];
    } else if (arg.startsWith('--reason=')) {
      result.reason = arg.split('=')[1];
    }
  }

  return result;
}

async function run() {
  const args = parseArgs();
  console.log('====================================================');
  console.log('🔍 SMAP — Customer Wallet Ledger Audit & Reconciliation');
  console.log('====================================================');
  console.log(`Mode: ${args.apply ? 'LIVE EXECUTION (--apply flag provided)' : 'DRY RUN (No data will be modified)'}`);

  const targetEmail = args.email || 'sahilguptasahilgupta652@gmail.com';
  const allUsers = (db as any).db?.users || [];
  const targetUser = args.userId
    ? allUsers.find((u: any) => u.id === args.userId)
    : allUsers.find((u: any) => u.email?.toLowerCase() === targetEmail.toLowerCase()) || allUsers[0];

  if (!targetUser) {
    console.error(`❌ User not found for email: ${targetEmail}`);
    process.exit(1);
  }

  console.log(`\nCustomer: ${targetUser.name} (${targetUser.email})`);
  console.log(`Customer ID: ${targetUser.id}`);
  console.log(`Current Recorded Balance: ₹${(targetUser.wallet_balance || 0).toFixed(2)}`);

  // Inspect Payments
  const allPayments = (db as any).db?.payments || [];
  const userPayments = allPayments.filter((p: any) => p.user_id === targetUser.id);
  const verifiedPaidPayments = userPayments.filter((p: any) => p.status === 'PAID');

  console.log('\n--- VERIFIED PAYMENT GATEWAY RECEIPTS ---');
  if (verifiedPaidPayments.length === 0) {
    console.log('No verified PAID payments found.');
  } else {
    verifiedPaidPayments.forEach((p: any, idx: number) => {
      console.log(
        ` [${idx + 1}] Payment ID: ${p.id} | Amount: ₹${p.amount.toFixed(2)} | Gateway ID: ${
          p.gateway_payment_id || 'N/A'
        } | UTR: ${p.transaction_reference || 'N/A'} | Verified At: ${p.verified_at}`
      );
    });
  }

  const totalVerifiedCredits = Math.round(
    verifiedPaidPayments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) * 100
  ) / 100;

  // Inspect Wallet Transactions
  const allTxs = (db as any).db?.wallet_transactions || [];
  const userTxs = allTxs.filter((t: any) => t.user_id === targetUser.id);

  console.log('\n--- WALLET TRANSACTION HISTORY ---');
  userTxs.forEach((t: any, idx: number) => {
    console.log(
      ` [${idx + 1}] Tx: ${t.id} | Type: ${t.type} | Amount: ₹${t.amount.toFixed(2)} | ` +
      `Before: ₹${t.balance_before.toFixed(2)} -> After: ₹${t.balance_after.toFixed(2)} | Status: ${t.status}\n` +
      `     Desc: ${t.description}`
    );
  });

  const legitimateCampaignDebits = userTxs
    .filter((t: any) => t.type === 'CAMPAIGN_PAYMENT' && t.status === 'SUCCESS')
    .reduce((sum: number, t: any) => sum + (t.amount || 0), 0);

  const targetLegitimateBalance = Math.max(
    0,
    Math.round((totalVerifiedCredits - legitimateCampaignDebits) * 100) / 100
  );
  const currentBalance = typeof targetUser.wallet_balance === 'number' ? targetUser.wallet_balance : 0;
  const discrepancy = Math.round((targetLegitimateBalance - currentBalance) * 100) / 100;

  console.log('\n--- RECONCILIATION CALCULATION ---');
  console.log(`Total Verified Credits from Razorpay: ₹${totalVerifiedCredits.toFixed(2)}`);
  console.log(`Total Legitimate Campaign Debits:     ₹${legitimateCampaignDebits.toFixed(2)}`);
  console.log(`Legitimate Net Wallet Balance:        ₹${targetLegitimateBalance.toFixed(2)}`);
  console.log(`Current Recorded Balance:             ₹${currentBalance.toFixed(2)}`);
  console.log(`Discrepancy (Missing Funds):          ₹${discrepancy.toFixed(2)}`);

  if (discrepancy === 0) {
    console.log('\n✅ Ledger is already fully balanced. No correction needed.');
    return;
  }

  if (discrepancy > 0) {
    console.log(`\n⚠️ DISCREPANCY DETECTED: Customer is missing ₹${discrepancy.toFixed(2)} of legitimate verified funds.`);
    console.log(`Proposed correction transaction:`);
    console.log(`  - Type: AUDIT_CORRECTION`);
    console.log(`  - Amount: ₹${discrepancy.toFixed(2)}`);
    console.log(`  - Balance Before: ₹${currentBalance.toFixed(2)}`);
    console.log(`  - Balance After: ₹${targetLegitimateBalance.toFixed(2)}`);
    console.log(`  - Reference: Linked to verified Razorpay payments: ${verifiedPaidPayments.map((p: any) => p.gateway_payment_id || p.id).join(', ')}`);

    if (!args.apply) {
      console.log('\n🔒 DRY RUN COMPLETE. To apply this correction to the ledger, run:');
      console.log(`   npx tsx scripts/reconcile-customer-wallet.ts --apply --userId=${targetUser.id}`);
    } else {
      console.log('\n⚙️ Applying ledger correction...');
      const reason = args.reason || `Audited restoration of verified Razorpay funds (UTR: 257178192361 & 667696542797)`;
      const res = db.reconcileAndRestoreLegitimateBalance(targetUser.id, 'cli_admin', reason);
      console.log(`✅ Balance successfully restored to: ₹${res.restoredBalance.toFixed(2)}`);
      console.log(`   Correction Transaction ID: ${res.transaction?.id}`);
      console.log(`   Audit status: ${res.status}`);
    }
  }
}

run().catch((err) => {
  console.error('Fatal reconciliation error:', err);
  process.exit(1);
});
