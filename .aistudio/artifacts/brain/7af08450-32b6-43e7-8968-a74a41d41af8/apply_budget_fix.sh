#!/bin/bash
set -e

echo "================================================================"
echo "  SMAP Ads — Budget Reconciliation & 3-Day Adjustment Fix"
echo "================================================================"

if [ ! -d ".git" ] && [ ! -f "package.json" ]; then
  echo "❌ Error: Please run this script inside your cloned 'smap-ads' directory."
  echo "Example: cd ~/smap-ads && bash apply_budget_fix.sh"
  exit 1
fi

echo "1. Extracting updated files..."
python3 -c "
import zipfile
with zipfile.ZipFile('smap_budget_fix.zip', 'r') as zip_ref:
    zip_ref.extractall('.')
print('Extracted smap_budget_fix.zip successfully.')
"

echo "2. Running TypeScript linter..."
npm run lint

echo "3. Running verification test suites..."
npm test

echo "4. Building production bundle..."
npm run build

echo "================================================================"
echo "✅ All tests passed and production bundle compiled successfully!"
echo "You can now commit and push to git (git add . && git commit -m 'Fix campaign budget reconciliation and 3-day adjustment' && git push) to trigger Render deployment."
echo "================================================================"
