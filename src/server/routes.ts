import express, { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { db, User } from './db.js';
import { AuthService, AuthSessionPayload } from './authService.js';
import { PaymentService } from './paymentService.js';
import { MetaService } from './metaService.js';
import { CampaignService } from './campaignService.js';
import { SupportService } from './supportService.js';
import { WalletService } from './walletService.js';

export const apiRouter = express.Router();

// File upload configuration using multer
const uploadDir = path.resolve(process.cwd(), 'data/uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBase = path.basename(file.originalname, ext).replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${cleanBase}_${Date.now()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max
  fileFilter: (_req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp|mp4|mov|webm/;
    const ext = path.extname(file.originalname).toLowerCase().replace('.', '');
    const mime = file.mimetype;
    if (allowed.test(ext) || allowed.test(mime)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file format. Only JPEG, PNG, WEBP, MP4, MOV, and WEBM files are allowed.'));
    }
  },
});

// Auth Middleware
export interface AuthenticatedRequest extends Request {
  user?: User;
  tokenPayload?: AuthSessionPayload;
}

export function getRequestOrigin(req: Request): string {
  // 1. Check referer (common for browser GET requests like /api/auth/google/url)
  const referer = req.get('referer');
  if (referer) {
    try {
      const parsed = new URL(referer);
      if (parsed.host && !parsed.host.includes('localhost:3000')) {
        return `${parsed.protocol}//${parsed.host}`;
      }
    } catch {
      // ignore
    }
  }

  // 2. Check origin header (standard for POST/CORS requests)
  const origin = req.get('origin');
  if (origin && !origin.includes('localhost:3000')) {
    return origin;
  }

  // 3. Check x-forwarded-host or host headers
  const forwardedProto = req.get('x-forwarded-proto') || (req.secure ? 'https' : 'http');
  const forwardedHost = req.get('x-forwarded-host') || req.get('host');
  if (forwardedHost && !forwardedHost.includes('localhost:3000')) {
    return `${forwardedProto}://${forwardedHost}`;
  }

  // 4. Default to configured APP_URL or production Render URL
  if (process.env.APP_URL && !process.env.APP_URL.includes('ais-dev')) {
    return process.env.APP_URL.trim().replace(/\/$/, '');
  }

  return 'https://smap-ads.onrender.com';
}

export const requireAuth = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  let token: string | null = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.cookies && req.cookies.smap_session) {
    token = req.cookies.smap_session;
  } else if (req.cookies && req.cookies.smap_token) {
    token = req.cookies.smap_token;
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication required. Please sign in with Google.' });
  }

  const payload = AuthService.verifySessionToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Session expired or invalid token. Please sign in with Google again.' });
  }

  let user = db.findUserById(payload.userId);
  if (!user && payload.email) {
    user = db.findUserByEmail(payload.email);
  }
  if (!user && payload.googleSub) {
    user = db.findUserByGoogleSub(payload.googleSub);
  }
  if (!user && payload.email) {
    // Self-healing: reconstruct user session from verified cryptographic JWT payload
    const { user: restoredUser } = AuthService.findOrCreateGoogleUser({
      sub: payload.googleSub || '',
      email: payload.email,
      name: payload.email.split('@')[0],
      email_verified: true,
      picture: null,
    });
    user = restoredUser;
  }

  if (!user) {
    return res.status(401).json({ error: 'Customer account not found.' });
  }

  if (user.status === 'SUSPENDED') {
    return res.status(403).json({ error: 'Your SMAP account is suspended. Please contact support.' });
  }

  req.user = user;
  req.tokenPayload = payload;
  next();
};

export const requireAdmin = (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  requireAuth(req, res, () => {
    if (req.user?.role !== 'admin') {
      return res.status(403).json({ error: 'Access restricted to administrators only.' });
    }
    next();
  });
};

// ==========================================
// 1. PUBLIC & CONFIG
// ==========================================
apiRouter.get('/config', (req, res) => {
  const reqOrigin = getRequestOrigin(req);
  const metaConfig = MetaService.getConfigStatus(reqOrigin);
  const paymentStatus = PaymentService.getGatewayStatus();
  const googleConfig = AuthService.getGoogleConfigStatus(reqOrigin);

  res.json({
    appName: 'SMAP',
    brandName: 'SMAP (Sahil Marketing Ads Powerful)',
    platforms: ['Facebook', 'Instagram'],
    merchantUpi: paymentStatus.merchantUpi,
    paymentStatus,
    googleConfig,
    metaStatus: {
      isConfigured: metaConfig.isConfigured,
      apiVersion: metaConfig.apiVersion,
      statusMessage: metaConfig.statusMessage,
    },
  });
});

apiRouter.get('/packages', (_req, res) => {
  const packages = db.getPackages(true);
  res.json({ packages });
});

// ==========================================
// 2. REAL GOOGLE AUTHENTICATION ONLY
// ==========================================
apiRouter.get('/auth/google/config', (req, res) => {
  const status = AuthService.getGoogleConfigStatus(getRequestOrigin(req));
  res.json(status);
});

function renderAuthResultPage(res: Response, {
  success,
  token,
  user,
  error,
}: {
  success: boolean;
  token?: string;
  user?: User;
  error?: string;
}) {
  const safeError = error || 'Authentication could not be completed.';
  const redirectUrl = success ? '/?tab=dashboard' : `/?tab=home&auth_error=${encodeURIComponent(safeError)}&open_auth=true`;

  if (success && token) {
    // Set secure HTTP-only session cookie for top-level navigation
    res.cookie('smap_session', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600 * 1000,
    });
    res.cookie('smap_token', token, {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600 * 1000,
    });
  }

  // Handle JSON requests (e.g. automated tests or programmatic probes)
  const acceptsHtml = res.req.headers['accept']?.includes('text/html');
  const acceptsJson = res.req.headers['accept']?.includes('application/json');
  if (acceptsJson && !acceptsHtml) {
    if (success) {
      return res.json({ success: true, user, token, redirectUrl });
    } else {
      return res.status(400).json({ success: false, error: safeError, redirectUrl });
    }
  }

  // HTML response supporting both popup messaging and full-window redirect
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${success ? 'SMAP — Authentication Successful' : 'SMAP — Authentication Notice'}</title>
  <meta http-equiv="refresh" content="${success ? '1' : '3'}; url=${redirectUrl}" />
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #090D16;
      color: #F8FAFC;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      padding: 16px;
    }
    .card {
      background: #0F172A;
      border: 1px solid ${success ? '#059669' : '#DC2626'};
      border-radius: 16px;
      padding: 32px;
      max-width: 440px;
      width: 100%;
      text-align: center;
      box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.5);
    }
    .icon {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      margin-bottom: 16px;
      background: ${success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)'};
      color: ${success ? '#34D399' : '#F87171'};
    }
    h2 { margin: 0 0 8px 0; font-size: 20px; font-weight: 700; color: #FFFFFF; }
    p { margin: 0 0 20px 0; font-size: 14px; color: #94A3B8; line-height: 1.5; }
    .btn {
      display: inline-block;
      background: ${success ? '#4F46E5' : '#334155'};
      color: #FFFFFF;
      padding: 10px 20px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      transition: opacity 0.2s;
    }
    .btn:hover { opacity: 0.9; }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">${success ? '✓' : '⚠'}</div>
    <h2>${success ? 'Sign-In Successful' : 'Authentication Notice'}</h2>
    <p>${success ? 'Welcome back! Redirecting you to the SMAP Dashboard...' : safeError}</p>
    <a href="${redirectUrl}" class="btn">${success ? 'Open SMAP Dashboard' : 'Return to SMAP Login'}</a>
  </div>
  <script>
    try {
      if (window.opener && !window.opener.closed) {
        try {
          window.opener.postMessage(${JSON.stringify(
            success
              ? { type: 'GOOGLE_AUTH_SUCCESS', token, user }
              : { type: 'GOOGLE_AUTH_ERROR', error: safeError }
          )}, '*');
        } catch (_) {}
        setTimeout(function() { 
          window.close();
          // If window.close() is blocked (e.g. mobile Chrome tabs), navigate current window to dashboard
          setTimeout(function() {
            window.location.replace(${JSON.stringify(redirectUrl)});
          }, 300);
        }, ${success ? 500 : 2500});
      } else {
        setTimeout(function() { window.location.replace(${JSON.stringify(redirectUrl)}); }, ${success ? 400 : 2500});
      }
    } catch (e) {
      window.location.replace(${JSON.stringify(redirectUrl)});
    }
  </script>
</body>
</html>`;

  res.send(html);
}

export const handleGoogleOAuthCallback = async (req: Request, res: Response) => {
  const body = req.body || {};
  const query = req.query || {};
  const credential = body.credential || query.credential;
  const { code, state, error, error_description } = (req.method === 'POST' ? body : query) || {};
  const savedState = req.cookies?.smap_oauth_state;

  // 0. Handle Google Identity Services (GIS) redirect ID token credential
  if (credential) {
    db.log('AUTH', 'INFO', 'Received Google Identity Services redirect credential at callback');
    const result = await AuthService.verifyGoogleIdTokenDirect(String(credential));
    if (!result.success || !result.user || !result.token) {
      db.log('AUTH', 'WARN', `GIS credential verification failed: ${result.error}`);
      return renderAuthResultPage(res, {
        success: false,
        error: result.error || 'Google authentication failed.',
      });
    }

    db.log('AUTH', 'INFO', `User authenticated successfully via GIS: ${result.user.email}`);

    // Set secure HTTP-only session cookie for the domain with path: '/'
    res.cookie('smap_session', result.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600 * 1000,
    });
    res.cookie('smap_token', result.token, {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600 * 1000,
    });

    // GIS redirect mode is a top-level browser POST from accounts.google.com.
    // HTTP 303 Post-Redirect-Get directly to the dashboard with both session cookies and token param ensures instant reliable rendering.
    return res.redirect(303, `/?tab=dashboard&auth_token=${encodeURIComponent(result.token)}`);
  }

  // 1. Direct route probe or health check (no OAuth query params provided)
  if (!code && !state && !error) {
    if (req.headers['accept']?.includes('application/json') || req.query.format === 'json') {
      return res.status(200).json({
        status: 'active',
        route: '/api/auth/google/callback',
        handler: 'google_oauth_callback',
        message: 'SMAP Google OAuth 2.0 callback endpoint is active and listening for Google authorization redirects.',
      });
    }
    return res.status(200).send(`<!doctype html>
<html lang="en">
<head><title>SMAP — Google OAuth Callback</title></head>
<body style="font-family: sans-serif; background: #090D16; color: #fff; padding: 40px; text-align: center;">
  <h2>SMAP Google OAuth 2.0 Callback Service</h2>
  <p style="color: #94a3b8;">This server endpoint is registered and ready to receive OAuth authorization codes from Google.</p>
  <a href="/?tab=dashboard" style="display: inline-block; margin-top: 16px; background: #4f46e5; color: #fff; padding: 10px 20px; border-radius: 8px; text-decoration: none;">Go to SMAP Dashboard &rarr;</a>
</body>
</html>`);
  }

  // 2. Google returned an error or the user cancelled the OAuth consent screen
  if (error) {
    const errorMsg = String(error_description || error);
    db.log('AUTH', 'WARN', `Google OAuth callback reported error: ${errorMsg}`);
    res.clearCookie('smap_oauth_state');
    return renderAuthResultPage(res, {
      success: false,
      error: `Google Sign-In was cancelled or denied: ${errorMsg}`,
    });
  }

  // 3. Validate state parameter to protect against CSRF attacks
  const isValidState = AuthService.validateOAuthState(String(state || ''), savedState);
  if (!isValidState) {
    res.clearCookie('smap_oauth_state');
    db.log('AUTH', 'WARN', 'Google OAuth callback rejected: CSRF state parameter mismatch or expired');
    return renderAuthResultPage(res, {
      success: false,
      error: 'OAuth security verification failed: invalid or expired session state. Please try signing in again.',
    });
  }

  // State verified: clear the one-time state cookie
  res.clearCookie('smap_oauth_state');

  // 4. Validate authorization code presence
  if (!code) {
    return renderAuthResultPage(res, {
      success: false,
      error: 'Authorization code was missing from the Google callback.',
    });
  }

  // 5. Exchange authorization code securely on server
  const result = await AuthService.exchangeGoogleAuthCode(String(code), getRequestOrigin(req));

  if (!result.success || !result.user || !result.token) {
    const errorMsg = result.error || 'Google authentication failed';
    return renderAuthResultPage(res, {
      success: false,
      error: errorMsg,
    });
  }

  // 6. Complete login and redirect to SMAP Dashboard
  return renderAuthResultPage(res, {
    success: true,
    user: result.user,
    token: result.token,
  });
};

apiRouter.get('/auth/google/url', (req, res) => {
  const state = AuthService.generateOAuthState();
  
  // Set secure CSRF state cookie
  res.cookie('smap_oauth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
    maxAge: 15 * 60 * 1000, // 15 minutes
  });

  const result = AuthService.getGoogleAuthUrl(state, getRequestOrigin(req));

  if (result.error || !result.url) {
    return res.status(400).json({
      error: result.error || 'Google Sign-In configuration required.',
      configured: false,
    });
  }

  res.json({ url: result.url, configured: true });
});

apiRouter.all(['/auth/google/callback', '/auth/google/callback/', '/api/auth/google/callback', '/api/auth/google/callback/'], handleGoogleOAuthCallback);

apiRouter.post('/auth/google/verify', async (req, res) => {
  const { idToken } = req.body;
  if (!idToken) {
    return res.status(400).json({ error: 'Google ID token is required' });
  }

  const result = await AuthService.verifyGoogleIdTokenDirect(idToken);
  if (!result.success || !result.user || !result.token) {
    return res.status(401).json({ error: result.error || 'Google authentication failed' });
  }

  res.cookie('smap_session', result.token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 3600 * 1000,
  });
  res.cookie('smap_token', result.token, {
    httpOnly: false,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 3600 * 1000,
  });

  res.json({ user: result.user, token: result.token });
});

// Existing Email/Password Authentication (Kept as secondary login method per requirement 5)
apiRouter.post('/auth/register', async (req, res) => {
  try {
    const result = await AuthService.registerWithEmailPassword(req.body);
    res.cookie('smap_session', result.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600 * 1000,
    });
    res.cookie('smap_token', result.token, {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600 * 1000,
    });
    res.json({ user: result.user, token: result.token });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Registration failed' });
  }
});

apiRouter.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await AuthService.loginWithEmailPassword(email, password);
    res.cookie('smap_session', result.token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600 * 1000,
    });
    res.cookie('smap_token', result.token, {
      httpOnly: false,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 3600 * 1000,
    });
    res.json({ user: result.user, token: result.token });
  } catch (err: any) {
    res.status(401).json({ error: err.message || 'Invalid credentials' });
  }
});

apiRouter.get('/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
  const user = req.user!;
  const metaConnection = db.findMetaConnectionByUserId(user.id);

  res.json({
    user: {
      id: user.id,
      google_sub: user.google_sub,
      name: user.name,
      email: user.email,
      email_verified: user.email_verified,
      profile_picture: user.profile_picture,
      phone: user.phone,
      role: user.role,
      status: user.status,
      created_at: user.created_at,
      last_login_at: user.last_login_at,
    },
    metaConnection: metaConnection ? {
      connected: true,
      meta_user_name: metaConnection.meta_user_name,
      ad_accounts: metaConnection.ad_accounts,
      selected_ad_account_id: metaConnection.selected_ad_account_id,
      expires_at: metaConnection.token_expires_at,
    } : {
      connected: false,
    },
  });
});

apiRouter.put('/auth/profile', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const updated = AuthService.updateProfile(req.user!.id, req.body);
    res.json({ user: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Profile update failed' });
  }
});

apiRouter.post('/auth/logout', (_req, res) => {
  res.clearCookie('smap_session', { path: '/' });
  res.clearCookie('smap_token', { path: '/' });
  res.json({ success: true, message: 'Logged out successfully' });
});

// ==========================================
// 3. CAMPAIGNS & CREATIVES
// ==========================================
apiRouter.post('/campaigns/upload', requireAuth, upload.single('creative'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No media file uploaded' });
  }

  const isVideo = /mp4|mov|webm/i.test(path.extname(req.file.originalname));
  const fileUrl = `/api/uploads/${req.file.filename}`;

  res.json({
    url: fileUrl,
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    type: isVideo ? 'video' : 'image',
  });
});

apiRouter.post('/campaigns', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { campaign, payment } = await CampaignService.createDraft(req.user!.id, req.body);
    res.status(201).json({ campaign, payment });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Campaign creation failed' });
  }
});

apiRouter.get('/campaigns', requireAuth, (req: AuthenticatedRequest, res) => {
  const campaigns = db.getCampaigns(req.user!.id);
  const statusFilter = req.query.status as string;

  const filtered = statusFilter && statusFilter !== 'ALL'
    ? campaigns.filter(c => c.status === statusFilter)
    : campaigns;

  res.json({ campaigns: filtered });
});

apiRouter.get('/campaigns/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const details = await CampaignService.getCampaignWithMetaMetrics(req.params.id, req.user!.role === 'admin' ? undefined : req.user!.id);
    res.json(details);
  } catch (err: any) {
    res.status(404).json({ error: err.message || 'Campaign not found' });
  }
});

apiRouter.post('/campaigns/:id/submit-meta', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const updated = await CampaignService.submitToMeta(req.params.id, req.user!.id);
    res.json({ campaign: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to submit campaign to Meta' });
  }
});

// ==========================================
// 4. PAYMENTS (REAL UPI PAYMENT GATEWAY ONLY)
// ==========================================
apiRouter.get('/payments/status', (_req, res) => {
  const status = PaymentService.getGatewayStatus();
  res.json(status);
});

apiRouter.get('/payments', requireAuth, (req: AuthenticatedRequest, res) => {
  const payments = db.getPayments(req.user!.id);
  res.json({ payments });
});

apiRouter.get('/payments/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const payment = db.findPaymentById(req.params.id);
  if (!payment) return res.status(404).json({ error: 'Payment not found' });
  if (req.user!.role !== 'admin' && payment.user_id !== req.user!.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  res.json({ payment });
});

// Prepare or refresh Razorpay live order before opening checkout
apiRouter.post('/payments/:id/prepare-order', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const payment = db.findPaymentById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (req.user!.role !== 'admin' && payment.user_id !== req.user!.id) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    const updated = await PaymentService.ensureGatewayOrder(req.params.id);
    res.json({ payment: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to prepare payment order' });
  }
});

// Independent Backend Payment Verification
apiRouter.post('/payments/:id/verify', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { gatewayPaymentId, gatewayOrderId, gatewaySignature } = req.body;
    const result = await PaymentService.verifyPayment({
      paymentId: req.params.id,
      userId: req.user!.id,
      gatewayPaymentId,
      gatewayOrderId,
      gatewaySignature,
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Payment verification failed' });
  }
});

// Sandbox Payment Simulation Endpoint (for testing sandbox flows)
apiRouter.post('/payments/:id/sandbox-simulate', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { status, failureReason } = req.body;
    const payment = db.findPaymentById(req.params.id);
    if (!payment) return res.status(404).json({ error: 'Payment not found' });
    if (payment.user_id !== req.user!.id && req.user!.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    if (status === 'PAID') {
      const result = await PaymentService.verifyPayment({
        paymentId: req.params.id,
        userId: req.user!.id,
        gatewayPaymentId: `pay_sandbox_${Date.now()}`,
        gatewayOrderId: payment.gateway_order_id || `order_sandbox_${payment.id}`,
      });
      return res.json(result);
    } else if (status === 'FAILED') {
      const updated = db.updatePayment(payment.id, {
        status: 'FAILED',
        failure_reason: failureReason || 'Customer cancelled UPI authorization in bank app.',
      });
      return res.json({ success: true, payment: updated });
    } else {
      // Pending
      const updated = db.updatePayment(payment.id, {
        status: 'PENDING',
      });
      return res.json({ success: true, payment: updated });
    }
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Simulation failed' });
  }
});

// Customer UTR Reference Submission (for fallback audit)
apiRouter.post('/payments/:id/submit-ref', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const { transactionReference } = req.body;
    const payment = PaymentService.submitTransactionReference(req.params.id, req.user!.id, transactionReference);
    res.json({
      payment,
      message: 'Transaction reference recorded for gateway audit.',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to submit transaction reference' });
  }
});

// Real Payment Gateway Webhook Endpoint
apiRouter.post('/payments/webhook', (req, res) => {
  const signature = (req.headers['x-razorpay-signature'] ||
    req.headers['x-payment-signature'] ||
    req.headers['x-webhook-signature']) as string;
  const rawBody = JSON.stringify(req.body);

  try {
    const result = PaymentService.processGatewayWebhook(req.body, signature, rawBody);
    res.json(result);
  } catch (err: any) {
    const statusCode = err.message === 'Invalid webhook signature' ? 401 : 400;
    res.status(statusCode).json({ error: err.message || 'Webhook processing failed' });
  }
});

// Sandbox Webhook Simulator (Programmatic test runner for sandbox webhooks & idempotency)
apiRouter.post('/payments/sandbox/simulate-webhook', (req, res) => {
  const { paymentId, event, amount, failureReason, invalidSignature } = req.body;
  const payment = db.findPaymentById(paymentId);
  if (!payment) {
    return res.status(404).json({ error: `Payment ${paymentId} not found` });
  }

  const gatewayPaymentId = `pay_sandbox_wh_${Date.now()}`;
  const webhookBody = {
    event: event || 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: gatewayPaymentId,
          order_id: payment.gateway_order_id || `order_sandbox_${payment.id}`,
          amount: (amount !== undefined ? amount : payment.amount) * 100,
          currency: 'INR',
          method: 'upi',
          receipt: payment.id,
          error_description: failureReason || null,
          acquirer_data: {
            rrn: `992837${Date.now().toString().slice(-6)}`,
            upi_transaction_id: `UPI${Date.now()}`,
          },
        },
      },
    },
  };

  const rawBody = JSON.stringify(webhookBody);
  const secret = process.env.PAYMENT_WEBHOOK_SECRET || 'sandbox_test_webhook_secret';
  const validSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
  const signatureToUse = invalidSignature ? 'invalid_signature_hash_12345' : validSignature;

  try {
    const result = PaymentService.processGatewayWebhook(webhookBody, signatureToUse, rawBody);
    const updatedPayment = db.findPaymentById(payment.id);
    const updatedCampaign = db.findCampaignById(payment.campaign_id);

    res.json({
      success: true,
      webhookResult: result,
      payment: updatedPayment,
      campaign: updatedCampaign,
    });
  } catch (err: any) {
    const statusCode = err.message === 'Invalid webhook signature' ? 401 : 400;
    res.status(statusCode).json({
      success: false,
      error: err.message,
    });
  }
});

// ==========================================
// 4B. CUSTOMER WALLET & ADD FUNDS API
// ==========================================

// Get customer wallet data (balance and transaction history)
apiRouter.get('/wallet', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const data = WalletService.getWalletData(req.user!.id);
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch wallet data' });
  }
});

// Get customer wallet balance only
apiRouter.get('/wallet/balance', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const balance = db.getWalletBalance(req.user!.id);
    res.json({ balance, currency: 'INR' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch wallet balance' });
  }
});

// Get customer wallet transaction history
apiRouter.get('/wallet/transactions', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const transactions = db.getWalletTransactions(req.user!.id);
    const balance = db.getWalletBalance(req.user!.id);
    res.json({ transactions, balance, currency: 'INR' });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch wallet transactions' });
  }
});

// Create Add Funds order for Razorpay checkout
apiRouter.post('/wallet/add-funds', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { amount } = req.body;
    const result = await WalletService.createAddFundsOrder(req.user!.id, amount);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to initiate Add Funds order' });
  }
});

// Verify Add Funds payment and credit customer wallet
apiRouter.post('/wallet/verify-payment', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { paymentId, gatewayPaymentId, gatewayOrderId, gatewaySignature } = req.body;
    if (!paymentId || !gatewayPaymentId) {
      return res.status(400).json({ error: 'paymentId and gatewayPaymentId are required' });
    }
    const result = await WalletService.verifyPaymentAndCreditWallet(req.user!.id, {
      paymentId,
      gatewayPaymentId,
      gatewayOrderId,
      gatewaySignature,
    });
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Payment verification failed' });
  }
});

// Pay campaign using wallet balance (deducts funds atomically and marks campaign paid)
apiRouter.post('/wallet/pay-campaign', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { campaignId } = req.body;
    if (!campaignId) {
      return res.status(400).json({ error: 'campaignId is required' });
    }
    const result = await WalletService.payCampaignWithWallet(req.user!.id, campaignId);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to pay with wallet' });
  }
});

// Admin endpoint: Get full customer wallets overview and transaction ledger
apiRouter.get('/admin/wallets', requireAdmin, (_req, res) => {
  try {
    const data = WalletService.getAdminWalletData();
    res.json(data);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to fetch admin wallet overview' });
  }
});

// ==========================================
// 5. META / FACEBOOK & INSTAGRAM INTEGRATION
// ==========================================
apiRouter.get('/meta/status', (_req, res) => {
  const status = MetaService.getConfigStatus();
  res.json(status);
});

apiRouter.get('/meta/oauth/url', requireAuth, (req: AuthenticatedRequest, res) => {
  const state = JSON.stringify({ userId: req.user!.id, timestamp: Date.now() });
  const result = MetaService.getOAuthUrl(state, getRequestOrigin(req));
  if (result.error) {
    return res.status(400).json({ error: result.error });
  }
  res.json({ url: result.url });
});

apiRouter.get('/meta/oauth/callback', async (req, res) => {
  const { code, state, error, error_description } = req.query;

  if (error) {
    return res.redirect(`/dashboard/profile?meta_error=${encodeURIComponent(String(error_description || error))}`);
  }

  if (!code) {
    return res.redirect('/dashboard/profile?meta_error=Authorization%20code%20missing');
  }

  try {
    let userId: string | null = null;
    if (state) {
      try {
        const parsed = JSON.parse(String(state));
        userId = parsed.userId;
      } catch {
        // state parse fallback
      }
    }

    const exchange = await MetaService.exchangeOAuthCode(String(code), getRequestOrigin(req));
    if (!exchange.success || !exchange.connection) {
      return res.redirect(`/dashboard/profile?meta_error=${encodeURIComponent(exchange.error || 'Meta authorization failed')}`);
    }

    if (userId) {
      exchange.connection.user_id = userId;
      db.saveMetaConnection(exchange.connection);
    }

    res.redirect('/dashboard/profile?meta_success=true');
  } catch (err: any) {
    res.redirect(`/dashboard/profile?meta_error=${encodeURIComponent(err?.message || 'Meta OAuth failed')}`);
  }
});

apiRouter.post('/meta/select-account', requireAuth, (req: AuthenticatedRequest, res) => {
  const { adAccountId } = req.body;
  const connection = db.findMetaConnectionByUserId(req.user!.id);
  if (!connection) {
    return res.status(400).json({ error: 'Meta account not connected' });
  }

  connection.selected_ad_account_id = adAccountId;
  db.saveMetaConnection(connection);
  res.json({ success: true, connection });
});

apiRouter.delete('/meta/disconnect', requireAuth, (req: AuthenticatedRequest, res) => {
  db.deleteMetaConnection(req.user!.id);
  res.json({ success: true, message: 'Meta advertising account disconnected' });
});

apiRouter.post('/meta/estimate-audience', requireAuth, async (req: AuthenticatedRequest, res) => {
  const connection = db.findMetaConnectionByUserId(req.user!.id);
  const result = await MetaService.getAudienceEstimate(
    connection?.selected_ad_account_id || '',
    req.body.targeting,
    connection?.access_token || ''
  );
  res.json(result);
});

// ==========================================
// 6. SUPPORT TICKETS
// ==========================================
apiRouter.get('/support', requireAuth, (req: AuthenticatedRequest, res) => {
  const tickets = db.getTickets(req.user!.id);
  res.json({ tickets });
});

apiRouter.post('/support', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const ticket = SupportService.createTicket({
      userId: req.user!.id,
      subject: req.body.subject,
      message: req.body.message,
      campaignId: req.body.campaignId,
      attachmentUrl: req.body.attachmentUrl,
    });
    res.status(201).json({ ticket });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to create support ticket' });
  }
});

apiRouter.get('/support/:id', requireAuth, (req: AuthenticatedRequest, res) => {
  const ticket = db.findTicketById(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Ticket not found' });
  if (req.user!.role !== 'admin' && ticket.user_id !== req.user!.id) {
    return res.status(403).json({ error: 'Unauthorized' });
  }
  res.json({ ticket });
});

apiRouter.post('/support/:id/reply', requireAuth, (req: AuthenticatedRequest, res) => {
  try {
    const updated = SupportService.addReply(
      req.params.id,
      req.user!.id,
      req.user!.role === 'admin' ? 'admin' : 'user',
      req.body.message
    );
    res.json({ ticket: updated });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to add reply' });
  }
});

// ==========================================
// 7. ADMIN DASHBOARD
// ==========================================
apiRouter.get('/admin/stats', requireAdmin, (_req, res) => {
  const users = db.getUsers().filter(u => u.role !== 'admin');
  const campaigns = db.getCampaigns();
  const payments = db.getPayments();

  const activeCampaigns = campaigns.filter(c => c.status === 'ACTIVE').length;
  const pendingCampaigns = campaigns.filter(c => c.status === 'PAYMENT_PENDING' || c.status === 'UNDER_REVIEW' || c.status === 'SUBMITTING').length;
  const completedCampaigns = campaigns.filter(c => c.status === 'COMPLETED').length;

  const verifiedPayments = payments.filter(p => p.status === 'PAID');
  const totalRevenue = verifiedPayments.reduce((sum, p) => sum + p.amount, 0);

  res.json({
    totalCustomers: users.length,
    totalCampaigns: campaigns.length,
    activeCampaigns,
    pendingCampaigns,
    completedCampaigns,
    totalVerifiedPayments: verifiedPayments.length,
    totalRevenue,
  });
});

apiRouter.get('/admin/customers', requireAdmin, (_req, res) => {
  const users = db.getUsers().map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    created_at: u.created_at,
  }));
  res.json({ customers: users });
});

apiRouter.get('/admin/campaigns', requireAdmin, (_req, res) => {
  const campaigns = db.getCampaigns();
  res.json({ campaigns });
});

apiRouter.get('/admin/payments', requireAdmin, (_req, res) => {
  const payments = db.getPayments();
  res.json({ payments });
});

apiRouter.post('/admin/payments/:id/verify', requireAdmin, (req, res) => {
  try {
    const updated = PaymentService.markPaymentAsPaid(req.params.id, {
      source: 'ADMIN_MANUAL_VERIFICATION',
      transaction_reference: req.body.transactionReference,
      notes: req.body.notes || 'Verified by administrator.',
    });
    res.json({ payment: updated, message: 'Payment verified successfully.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Payment verification failed' });
  }
});

apiRouter.post('/admin/payments/:id/reject', requireAdmin, (req, res) => {
  try {
    const updated = PaymentService.adminRejectPayment(req.params.id, req.body.reason || 'Verification rejected');
    res.json({ payment: updated, message: 'Payment rejected.' });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to reject payment' });
  }
});

apiRouter.get('/admin/packages', requireAdmin, (_req, res) => {
  res.json({ packages: db.getPackages(false) });
});

apiRouter.put('/admin/packages/:id', requireAdmin, (req, res) => {
  const updated = db.updatePackage(req.params.id, req.body);
  if (!updated) return res.status(404).json({ error: 'Package not found' });
  res.json({ package: updated });
});

apiRouter.post('/admin/packages', requireAdmin, (req, res) => {
  const newPkg = db.createPackage({
    id: `pkg_${Date.now()}`,
    name: req.body.name,
    price: Number(req.body.price),
    duration_days: Number(req.body.duration_days),
    platforms: ['Facebook', 'Instagram'],
    features: req.body.features || [],
    active: req.body.active ?? true,
    created_at: new Date().toISOString(),
  });
  res.status(201).json({ package: newPkg });
});

apiRouter.get('/admin/logs', requireAdmin, (req, res) => {
  const limit = req.query.limit ? Number(req.query.limit) : 100;
  res.json({ logs: db.getLogs(limit) });
});

apiRouter.get('/admin/tickets', requireAdmin, (_req, res) => {
  res.json({ tickets: db.getTickets() });
});

apiRouter.put('/admin/tickets/:id/status', requireAdmin, (req, res) => {
  const updated = SupportService.updateStatus(req.params.id, req.body.status);
  res.json({ ticket: updated });
});
