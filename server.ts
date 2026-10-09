import express from 'express';
import path from 'path';
import fs from 'fs';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { apiRouter, handleGoogleOAuthCallback } from './src/server/routes.js';
import { SchedulerService } from './src/server/schedulerService.js';
import { renderPolicyHtml } from './src/server/policyPages.js';
import { RENDER_PRODUCTION_REDIRECT_URI, DEFAULT_GOOGLE_CLIENT_ID } from './src/server/authService.js';
import { VERIFIED_META_ACCESS_TOKEN } from './src/server/metaTokenFallback.js';

dotenv.config({ override: true });

// Load .dev.env.json if present in parent or root (injected by AI Studio environment)
const devEnvLocations = ['/app/.dev.env.json', './.dev.env.json', '../.dev.env.json'];
for (const loc of devEnvLocations) {
  if (fs.existsSync(loc)) {
    try {
      const raw = fs.readFileSync(loc, 'utf8');
      const parsed = JSON.parse(raw);
      for (const [key, val] of Object.entries(parsed)) {
        if (typeof val === 'string' && val.trim().length > 0 && !process.env[key]) {
          process.env[key] = val;
        }
      }
      break;
    } catch {
      // ignore
    }
  }
}

// Default to existing SMAP Google Client ID if not provided
if (!process.env.GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID.trim().length === 0) {
  process.env.GOOGLE_CLIENT_ID = DEFAULT_GOOGLE_CLIENT_ID;
}

// Ensure verified META_ACCESS_TOKEN is configured in process.env for all services
if (!process.env.META_ACCESS_TOKEN && VERIFIED_META_ACCESS_TOKEN) {
  process.env.META_ACCESS_TOKEN = VERIFIED_META_ACCESS_TOKEN;
}

// Verify and ensure Google OAuth redirect URI is configured
if (!process.env.GOOGLE_REDIRECT_URI) {
  process.env.GOOGLE_REDIRECT_URI = RENDER_PRODUCTION_REDIRECT_URI;
}

const app = express();
app.set('trust proxy', true);
// AI Studio dev server runs behind an nginx reverse proxy on 8080 that forwards to 3000.
// On external hosting platforms (Render, Railway, Heroku, Fly.io, VPS), the platform provides PORT (e.g. 10000).
const isAIStudio = Boolean(process.env.APPLET_ID || process.env.NGINX_PORT);
const PORT = isAIStudio ? 3000 : (Number(process.env.PORT) || 3000);
const isProduction = process.env.NODE_ENV === 'production';

// Body parsing & cookies
app.use(express.json({
  limit: '10mb',
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// Static uploads directory
const uploadsDir = path.resolve(process.cwd(), 'data/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/api/uploads', express.static(uploadsDir));

// Explicitly register real Google OAuth 2.0 callback endpoint at root level & api level
app.all(['/api/auth/google/callback', '/api/auth/google/callback/', '/auth/google/callback', '/auth/google/callback/'], handleGoogleOAuthCallback);

// API routes
app.use('/api', apiRouter);

// Publicly accessible legal & compliance pages (About, Privacy, Terms, Refund, Pricing, Contact)
// Directly returns semantic, readable HTML with HTTP 200 for Razorpay verification & external crawlers
app.get(['/about', '/about-us'], (_req, res) => {
  res.status(200).type('html').send(renderPolicyHtml('about'));
});

app.get(['/contact', '/contact-us'], (_req, res) => {
  res.status(200).type('html').send(renderPolicyHtml('contact'));
});

app.get(['/privacy', '/privacy-policy'], (_req, res) => {
  res.status(200).type('html').send(renderPolicyHtml('privacy'));
});

app.get(['/terms', '/terms-and-conditions', '/terms-of-service'], (_req, res) => {
  res.status(200).type('html').send(renderPolicyHtml('terms'));
});

app.get(['/refund', '/refund-policy', '/cancellation-policy'], (_req, res) => {
  res.status(200).type('html').send(renderPolicyHtml('refund'));
});

app.get(['/pricing', '/packages', '/plans'], (_req, res) => {
  res.status(200).type('html').send(renderPolicyHtml('pricing'));
});

// Explicit robots.txt allowing all web crawlers & verifiers (Razorpay, Googlebot, etc.)
app.get('/robots.txt', (_req, res) => {
  res.type('text/plain').send('User-agent: *\nAllow: /\n');
});

// Lightweight public health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'SMAP', timestamp: new Date().toISOString() });
});

// Start campaign expiry background scheduler
SchedulerService.start(30000); // Check every 30 seconds

// Frontend integration
if (!isProduction) {
  const { createServer: createViteServer } = await import('vite');
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      port: PORT,
      host: '0.0.0.0',
      hmr: false,
      allowedHosts: true,
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  const distDir = path.resolve(process.cwd(), 'dist');
  app.use(express.static(distDir, {
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      } else if (filePath.includes('/assets/')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    },
  }));
  app.get('*', (_req, res) => {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SMAP advertising server running at http://0.0.0.0:${PORT} [${isProduction ? 'PRODUCTION' : 'DEVELOPMENT'}]`);
});
