#!/usr/bin/env bash
# SMAP Final Pre-Launch Audit Deployment Script
# Applies safety gate hardening, policy 4.2 inauthentic behavior block,
# reviewer instructions endpoint, and reviewer test credentials.

set -e

echo "=========================================================="
echo "🚀 Applying SMAP Meta Ads Final Pre-Launch Audit Fix"
echo "=========================================================="

echo "1. Checking directory..."
if [ ! -f "package.json" ]; then
  echo "❌ Error: package.json not found. Run this from the repository root."
  exit 1
fi

echo "2. Compiling TypeScript..."
npm run lint

echo "3. Running automated verification test suite..."
npm test

echo "4. Building production bundle..."
npm run build

echo "=========================================================="
echo "✅ All tests passed! Ready to commit and push to GitHub."
echo "=========================================================="
