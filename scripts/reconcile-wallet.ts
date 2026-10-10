/**
 * SMAP Production Wallet Reconciliation Tool
 * 
 * Safely audits and reconciles customer wallet balances strictly against verified Razorpay payments.
 * Ensures zero double-credits, zero fake funds, and full ledger traceability.
 * 
 * Usage:
 *   npx tsx scripts/reconcile-wallet.ts --inspect
 *   npx tsx scripts/reconcile-wallet.ts --inspect --user sahilguptasahilgupta652@gmail.com
 *   npx tsx scripts/reconcile-wallet.ts --apply --user sahilguptasahilgupta652@gmail.com
 */

import { db } from '../src/server/db.js';

interface CliArgs {
  mode: 'inspect' | 'apply';
  userQuery?: string;
  reason?: string;
}

function parseArgs(): CliArgs {
  const args = process.argv.slice(2);
  let mode: 'inspect' | 'apply' = 'inspect';
  let userQuery: string | undefined;
  let reason = 'Production ledger reconciliation: Restoring balance from verified Razorpay payments';

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--apply') {
      mode = 'apply';
    } else if (args[i] === '--inspect' || args[i] === '--dry-run') {
      mode = 'inspect';
    } else if (args[i] === '--user' && args[i + 1]) {
      userQuery = args[i + 1];
      i++;
    } else if (args[i] === '--reason' && args[i + 1]) {
      reason = args[i + 1];
      i++;
    }
  }

  return { mode, userQuery, reason };
}

async function run() {
  const { mode, userQuery, reason } = parseArgs();

  console.log('====================================================');
  console.log('🔍 SMAP WALLET LEDGER AUDIT & RECONCILIATION');
  console.log(`Mode: ${mode.toUpperCase()} ${mode === 'inspect' ? '(Read-only / No data changed)' : '(APPLYING CORRECTIONS)'}`);
  console.log('====================================================\n');

  const users = db.getUsers();
  const targetUsers = userQuery
    ? users.filter(u => u.id === userQuery || u.email.toLowerCase() === userQuery.toLowerCase())
    : users.filter(u => {
        // Find users with verified payments
        const payments = db.findPaymentsByUserId(u.id).filter(p => p.status === 'PAID');
        return payments.length > 0;
      });

  if (targetUsers.length === 0) {
    console.log(`No users found matching query "${userQuery || 'with verified payments'}"`);
    return;
  }

  for (const user of targetUsers) {
    console.log(`👤 Customer: ${user.name} (${user.email}) [ID: ${user.id}]`);
    console.log(`   Current Database Balance: ₹${user.wallet_balance.toFixed(2)}`);

    const payments = db.findPaymentsByUserId(user.id).filter(p => p.status === 'PAID');
    const totalDeposited = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    console.log(`   Verified Razorpay Payments (PAID): ${payments.length} payments, Total: ₹${totalDeposited.toFixed(2)}`);
    payments.forEach(p => {
      console.log(`     - Payment ID: ${p.id} | Gateway: ${p.gateway_payment_id || 'N/A'} | Amount: ₹${p.amount.toFixed(2)} | Date: ${p.created_at}`);
    });

    const txs = db.getWalletTransactions(user.id);
    const debits = txs.filter(t => t.type === 'CAMPAIGN_PAYMENT' && t.status === 'SUCCESS');
    const totalSpent = debits.reduce((sum, t) => sum + (t.amount || 0), 0);
    console.log(`   Legitimate Campaign Spend: ₹${totalSpent.toFixed(2)} (${debits.length} campaigns)`);

    const legitimateBalance = Math.max(0, totalDeposited - totalSpent);
    const discrepancy = Number((legitimateBalance - user.wallet_balance).toFixed(2));

    console.log(`   Legitimate Verified Balance: ₹${legitimateBalance.toFixed(2)}`);
    console.log(`   Discrepancy: ${discrepancy > 0 ? `+₹${discrepancy.toFixed(2)} missing` : discrepancy < 0 ? `-₹${Math.abs(discrepancy).toFixed(2)} excess` : '₹0.00 (Balanced)'}`);

    if (discrepancy === 0) {
      console.log('   ✅ Status: Balance is already verified and consistent with the ledger.\n');
      continue;
    }

    if (mode === 'inspect') {
      console.log(`   ⚠️ ACTION PROPOSED (Dry-Run):`);
      console.log(`      Will credit ₹${discrepancy.toFixed(2)} via AUDIT_CORRECTION ledger entry.`);
      console.log(`      New Balance will be: ₹${legitimateBalance.toFixed(2)}`);
      console.log(`      To apply this correction, run with: --apply --user "${user.email}"\n`);
    } else {
      console.log(`   🔄 APPLYING RECONCILIATION...`);
      const result = db.reconcileAndRestoreLegitimateBalance(user.id, reason);
      console.log(`   ✅ RECONCILIATION RESULT:`);
      console.log(`      Status: ${result.status}`);
      console.log(`      Previous Balance: ₹${result.previousBalance.toFixed(2)}`);
      console.log(`      Restored Balance: ₹${result.restoredBalance.toFixed(2)}`);
      console.log(`      Correction Amount: ₹${result.correctionAmount.toFixed(2)}`);
      if (result.transaction) {
        console.log(`      Audit Transaction ID: ${result.transaction.id}`);
        console.log(`      Description: ${result.transaction.description}`);
      }
      console.log('');
    }
  }

  console.log('====================================================');
  console.log('Audit completed.');
}

run().catch(err => {
  console.error('Reconciliation error:', err);
  process.exit(1);
});
