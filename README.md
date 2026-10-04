# SMAP — Sahil Marketing Ads Powerful

SMAP is an enterprise social media advertising platform for creating, launching, and managing ad campaigns across Facebook and Instagram with automated Razorpay UPI payments, Google Cloud OAuth, and Meta Marketing Graph API integration.

## Key Features
- **Facebook & Instagram Marketing Campaign Management**: Automated campaign creation, ad set targeting, creative asset management, and daily ad budgeting.
- **Payment Gateway Architecture**: Automated Razorpay payment order generation, webhook signature verification (HMAC-SHA256), and UPI payment flows.
- **Dual Authentication**: Real Google Identity Services (GIS) token verification alongside secure bcrypt email/password authentication.
- **Razorpay Merchant Compliance**: Full pre-rendered semantic compliance pages (`/about`, `/pricing`, `/contact`, `/terms`, `/privacy`, `/refund`) and crawler-friendly `robots.txt`.
- **Lightweight Embedded Persistence**: Local JSON/SQLite database storage with automatic scheduled expiry tasks.

---

## Quick Start (Local & Standalone)

### 1. Prerequisites
- Node.js 20+ or 22+
- npm or bun

### 2. Installation
```bash
# Clone your exported GitHub repository
git clone https://github.com/<your-username>/<your-repo-name>.git
cd <your-repo-name>

# Install dependencies
npm install
```

### 3. Environment Setup
Copy `.env.example` to `.env` and fill in your keys:
```bash
cp .env.example .env
```
*(See `.env.example` for all configurable variables)*

### 4. Build and Run
```bash
# Development mode
npm run dev

# Production build and run
npm run build
npm start
```
The server will run on `http://localhost:3000` (or the port defined by `process.env.PORT`).

---

## Free Production Deployment Guide

For full instructions on deploying for free without Google Cloud Billing or credit cards, refer to [DEPLOYMENT.md](./DEPLOYMENT.md).
