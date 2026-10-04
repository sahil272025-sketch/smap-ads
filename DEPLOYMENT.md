# Free Public Hosting Deployment Guide (Zero Billing / No Trial Needed)

This guide walks you through deploying your SMAP application on a free public web hosting platform (such as **Render.com** or **Koyeb**) that does **NOT** require Google Cloud billing, credit cards, or trial periods.

---

## Step 1: Export Project from Google AI Studio to GitHub

Google AI Studio provides a native 1-click GitHub export:

1. In the Google AI Studio top navigation bar (top right corner), click the **GitHub icon** or the **"..." (More options)** / **"Export to GitHub"** menu.
2. Select **"Save to GitHub"** or **"Export to Repository"**.
3. Authorize your GitHub account if prompted.
4. Choose **Create new repository** (e.g., `smap-ads-platform`) and select **Public** or **Private**.
5. Click **Export**. AI Studio pushes all code, configuration files, and build scripts directly to your GitHub repository.

*(Note: Sensitive secrets in `.env`, `.dev.env.json`, and database state are automatically excluded by `.gitignore`)*.

---

## Step 2: Deploy for Free on Render.com (Recommended)

Render offers a free tier for Node.js Web Services with free custom domains and automatic SSL.

1. Go to [Render.com](https://render.com) and sign up for free using your GitHub account (No credit card required).
2. On your Render Dashboard, click **New +** → **Web Service**.
3. Select **Build and deploy from a Git repository** and connect your exported SMAP GitHub repository.
4. Configure the Web Service settings:
   - **Name**: `smap-ads` (or your chosen name)
   - **Region**: Singapore / Frankfurt / Oregon (choose closest to India / your audience)
   - **Branch**: `main`
   - **Root Directory**: leave blank
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`
5. Under **Environment Variables**, click **Add Environment Variable** and add the values from your `.env.example`:
   - `NODE_ENV`: `production`
   - `JWT_SECRET`: (any secure random string, e.g. `smap_production_secret_key_2026`)
   - `ADMIN_EMAILS`: `sahilking17341734@gmail.com`
   - `UPI_MERCHANT_ID`: `sahil-stp@ybl`
   - `UPI_MERCHANT_NAME`: `SMAP`
   - `PAYMENT_PROVIDER`: `razorpay`
   - `PAYMENT_ENV`: `production` (or `sandbox` if testing)
   - `PAYMENT_KEY_ID`: Your Razorpay Key ID
   - `PAYMENT_KEY_SECRET`: Your Razorpay Key Secret
   - `PAYMENT_WEBHOOK_SECRET`: Your Razorpay Webhook Secret (if configured)
   - `GOOGLE_CLIENT_ID`: `989765718508-t8crqu5je34utcjeblsmt33nfkqj4iol.apps.googleusercontent.com`
   - `GOOGLE_CLIENT_SECRET`: Your Google OAuth Client Secret (from Google Cloud Console)
   - `GOOGLE_REDIRECT_URI`: `https://smap-ads.onrender.com/api/auth/google/callback`
   - `APP_URL`: `https://smap-ads.onrender.com`
   - `META_APP_ID`: Your Meta App ID (if using Facebook Ads API)
   - `META_APP_SECRET`: Your Meta App Secret (if using Facebook Ads API)
6. Click **Create Web Service**.
7. Render will build the Vite frontend, start the Express backend, and provide you with a permanent public URL:
   `https://smap-ads.onrender.com` (or similar).

---

## Step 3: Update Google Cloud Console OAuth (1 Minute)

Once you have your Render URL (for example: `https://smap-ads.onrender.com`):

1. Open [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Click on your existing Web Client (`989765718508-t8crqu5je34utcjeblsmt33nfkqj4iol.apps.googleusercontent.com`).
3. Under **Authorized JavaScript origins**, click **+ ADD URI**:
   - Add: `https://smap-ads.onrender.com` (your exact Render URL, without trailing slash)
4. Under **Authorized redirect URIs**, click **+ ADD URI**:
   - Add: `https://smap-ads.onrender.com/api/auth/google/callback`
5. Click **SAVE**.

Google Sign-In will now work seamlessly on your public Render domain via real Google ID token verification.

---

## Step 4: Submit to Razorpay for Instant Website Verification

Because Render.com serves your website directly without Google preview interstitial cookies:

1. Test your URL in an incognito window or via curl:
   ```bash
   curl -I https://smap-ads.onrender.com/
   curl -I https://smap-ads.onrender.com/about
   curl -I https://smap-ads.onrender.com/privacy
   curl -I https://smap-ads.onrender.com/terms
   curl -I https://smap-ads.onrender.com/refund
   curl -I https://smap-ads.onrender.com/contact
   curl -I https://smap-ads.onrender.com/pricing
   ```
   All of these endpoints return **HTTP 200 OK** directly with pre-rendered semantic HTML.
2. Go to your Razorpay Dashboard → **Settings** / **Website Details**.
3. Paste:
   ```
   https://smap-ads.onrender.com
   ```
4. Click **Verify / Submit**. Razorpay's crawler will verify the website immediately.

---

## Alternative Free Hosting Platforms

You can also deploy this repository to other free platforms with identical setup:
- **Koyeb**: Free web service tier, Docker & Node native, instant deploy from GitHub.
- **Railway**: Generous monthly free trial credits, auto-detects `Dockerfile` or `package.json`.
- **Fly.io**: Free allowances using `fly launch` with the included `Dockerfile`.
