import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import fs from 'fs';
import { OAuth2Client } from 'google-auth-library';
import { db, User } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'smap_production_secure_jwt_secret_key_2026';
const SESSION_EXPIRY = '7d';

export interface AuthSessionPayload {
  userId: string;
  googleSub: string;
  email: string;
  role: 'customer' | 'admin';
}

export const PRODUCTION_ORIGIN = 'https://ais-pre-o3n2fq6vm22j6e33dq2i7j-911759115865.asia-southeast1.run.app';
export const PRODUCTION_REDIRECT_URI = `${PRODUCTION_ORIGIN}/api/auth/google/callback`;

export const CUSTOM_PRODUCTION_ORIGIN = 'https://smap-ads.ai.studio';
export const CUSTOM_PRODUCTION_REDIRECT_URI = `${CUSTOM_PRODUCTION_ORIGIN}/api/auth/google/callback`;

export interface GoogleConfigStatus {
  isConfigured: boolean;
  clientId: string | null;
  clientIdMasked: string | null;
  redirectUri: string;
  hasClientSecret: boolean;
  hasRedirectWarning?: boolean;
  isDevEnvironment?: boolean;
  statusMessage: string;
}

export interface GoogleUserProfile {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  picture: string | null;
}

export class AuthService {
  private static getClientId(): string | null {
    const val = process.env.GOOGLE_CLIENT_ID?.trim();
    return val && val.length > 0 ? val : null;
  }

  private static getClientSecret(): string | null {
    let raw = process.env.GOOGLE_CLIENT_SECRET;
    if (!raw) {
      const devEnvLocations = ['/app/.dev.env.json', './.dev.env.json', '../.dev.env.json'];
      for (const loc of devEnvLocations) {
        if (fs.existsSync(loc)) {
          try {
            const parsed = JSON.parse(fs.readFileSync(loc, 'utf8'));
            if (parsed.GOOGLE_CLIENT_SECRET) {
              raw = parsed.GOOGLE_CLIENT_SECRET;
              break;
            }
          } catch {
            // ignore
          }
        }
      }
    }
    if (!raw) return null;
    const trimmed = raw.trim();
    if (!trimmed) return null;
    return trimmed.replace(/\s+/g, '');
  }

  public static isDevEnvironment(origin?: string): boolean {
    if (origin) {
      const lower = origin.toLowerCase();
      if (lower.includes('ais-dev') || lower.includes('localhost') || lower.includes('127.0.0.1')) {
        return true;
      }
    }
    return false;
  }

  public static getProductionRedirectUri(): string {
    return PRODUCTION_REDIRECT_URI;
  }

  public static getRedirectUri(origin?: string): string {
    // 1. If in DEV/preview environment, DEV must not accidentally use the production callback
    if (this.isDevEnvironment(origin)) {
      const cleanOrigin = (origin || '').replace(/\/$/, '');
      return cleanOrigin ? `${cleanOrigin}/api/auth/google/callback` : '';
    }

    // 2. If running on custom production domain (e.g. smap-ads.ai.studio or any *.ai.studio), use custom domain callback
    if (origin && (origin.includes('.ai.studio') || origin.includes('smap-ads'))) {
      const cleanOrigin = origin.replace(/\/$/, '');
      return `${cleanOrigin}/api/auth/google/callback`;
    }

    // 3. Fallback to existing AIS-PRE production callback:
    // https://ais-pre-o3n2fq6vm22j6e33dq2i7j-911759115865.asia-southeast1.run.app/api/auth/google/callback
    return PRODUCTION_REDIRECT_URI;
  }

  public static generateOAuthState(): string {
    const nonce = crypto.randomBytes(16).toString('hex');
    const timestamp = Date.now().toString();
    const signature = crypto
      .createHmac('sha256', JWT_SECRET)
      .update(`${nonce}:${timestamp}`)
      .digest('hex');
    return `${nonce}.${timestamp}.${signature}`;
  }

  public static validateOAuthState(state: string, cookieState?: string): boolean {
    if (!state || typeof state !== 'string') return false;

    // Direct match against cookie if present
    if (cookieState && cookieState.trim() === state.trim()) {
      return true;
    }

    // Stateless validation using HMAC signature and timestamp
    const parts = state.split('.');
    if (parts.length === 3) {
      const [nonce, timestampStr, signature] = parts;
      const timestamp = parseInt(timestampStr, 10);
      if (isNaN(timestamp)) return false;

      // Check expiry (15 minutes)
      const now = Date.now();
      if (now - timestamp > 15 * 60 * 1000 || timestamp > now + 60 * 1000) {
        return false;
      }

      const expectedSig = crypto
        .createHmac('sha256', JWT_SECRET)
        .update(`${nonce}:${timestampStr}`)
        .digest('hex');

      try {
        if (crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
          return true;
        }
      } catch {
        return false;
      }
    }

    return false;
  }

  private static getOAuthClient(origin?: string): OAuth2Client {
    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();
    const redirectUri = this.getRedirectUri(origin);

    return new OAuth2Client(clientId || undefined, clientSecret || undefined, redirectUri);
  }

  public static getGoogleConfigStatus(origin?: string): GoogleConfigStatus {
    const isDev = this.isDevEnvironment(origin);
    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();

    const hasClientId = !!clientId && clientId.trim().length > 0;
    const hasClientSecret = !!clientSecret && clientSecret.trim().length > 0;

    // Requirement 5 & 6: DEV/preview must not accidentally use the production callback.
    // If DEV Google Sign-In cannot be supported, disable/hide Google Sign-In only in DEV instead of breaking production.
    if (isDev) {
      return {
        isConfigured: false,
        clientId: null,
        clientIdMasked: null,
        redirectUri: '',
        hasClientSecret,
        hasRedirectWarning: false,
        isDevEnvironment: true,
        statusMessage: 'Google Sign-In is configured exclusively for the production SMAP URL (ais-pre). In this DEV preview, please sign in with Email & Password.',
      };
    }

    const masked = hasClientId && clientId 
      ? `${clientId.substring(0, 12)}••••${clientId.substring(Math.max(0, clientId.length - 12))}` 
      : null;

    let statusMessage = '';
    if (hasClientId && hasClientSecret) {
      statusMessage = 'Official Google OAuth 2.0 Web Application & Google Identity Services are active.';
    } else if (hasClientId && !hasClientSecret) {
      statusMessage = 'Google Client ID active. Server code exchange requires GOOGLE_CLIENT_SECRET in environment.';
    } else {
      statusMessage = 'Google Sign-In configuration required. GOOGLE_CLIENT_ID must be configured in environment.';
    }

    return {
      isConfigured: hasClientId,
      clientId: hasClientId ? clientId : null,
      clientIdMasked: masked,
      redirectUri: this.getRedirectUri(origin),
      hasClientSecret,
      hasRedirectWarning: false,
      isDevEnvironment: false,
      statusMessage,
    };
  }

  public static getGoogleAuthUrl(state: string, origin?: string): { url: string | null; error?: string } {
    if (this.isDevEnvironment(origin)) {
      return {
        url: null,
        error: 'Google Sign-In is disabled in the DEV preview environment because the OAuth client is authorized for the production URL only. DEV/preview must not use the production callback. Please sign in with Email & Password or use the official production URL.',
      };
    }

    const config = this.getGoogleConfigStatus(origin);
    if (!config.isConfigured || !config.clientId) {
      return {
        url: null,
        error: 'Google Sign-In configuration required. GOOGLE_CLIENT_ID must be configured in your server environment.',
      };
    }

    const client = this.getOAuthClient(origin);
    const url = client.generateAuthUrl({
      access_type: 'offline',
      scope: ['openid', 'email', 'profile'],
      state,
      prompt: 'select_account',
    });

    return { url };
  }

  public static async exchangeGoogleAuthCode(code: string, origin?: string): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
    const clientId = this.getClientId();
    const clientSecret = this.getClientSecret();

    if (!clientId) {
      return {
        success: false,
        error: 'Google Sign-In configuration required. GOOGLE_CLIENT_ID must be configured in server environment.',
      };
    }

    if (!clientSecret) {
      return {
        success: false,
        error: 'GOOGLE_CLIENT_SECRET is missing from server environment. Authorization code exchange requires GOOGLE_CLIENT_SECRET.',
      };
    }

    try {
      const redirectUri = this.getRedirectUri(origin);
      const client = new OAuth2Client(clientId, clientSecret, redirectUri);
      const { tokens } = await client.getToken({ code, redirect_uri: redirectUri });

      if (!tokens.id_token) {
        return { success: false, error: 'Google authentication failed: no identity token returned by Google.' };
      }

      // Verify the Google ID token cryptographically
      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token,
        audience: clientId,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.sub || !payload.email) {
        return { success: false, error: 'Invalid Google token payload.' };
      }

      if (payload.email_verified === false) {
        return { success: false, error: 'Google account email is not verified by Google.' };
      }

      const googleProfile: GoogleUserProfile = {
        sub: payload.sub,
        email: payload.email.toLowerCase(),
        email_verified: payload.email_verified ?? true,
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture || null,
      };

      const { user, token } = this.findOrCreateGoogleUser(googleProfile);
      return { success: true, user, token };
    } catch (err: any) {
      const gaxiosData = err?.response?.data;
      const gDesc = gaxiosData?.error_description;
      const gError = gaxiosData?.error || err?.message;
      const detailedMessage = gDesc
        ? `${gError}: ${gDesc}`
        : err?.message || 'Token verification error';

      db.log('AUTH', 'ERROR', `Google OAuth exchange failed: ${detailedMessage}`);
      return {
        success: false,
        error: `Google authentication failed: ${detailedMessage}`,
      };
    }
  }

  public static async verifyGoogleIdTokenDirect(idToken: string): Promise<{ success: boolean; user?: User; token?: string; error?: string }> {
    const clientId = this.getClientId();
    if (!clientId) {
      return {
        success: false,
        error: 'Google Sign-In configuration required. GOOGLE_CLIENT_ID must be configured.',
      };
    }

    try {
      const client = new OAuth2Client(clientId);
      const ticket = await client.verifyIdToken({
        idToken,
        audience: clientId,
      });

      const payload = ticket.getPayload();
      if (!payload || !payload.sub || !payload.email) {
        return { success: false, error: 'Invalid Google identity token.' };
      }

      if (payload.email_verified === false) {
        return { success: false, error: 'Email not verified by Google.' };
      }

      const googleProfile: GoogleUserProfile = {
        sub: payload.sub,
        email: payload.email.toLowerCase(),
        email_verified: payload.email_verified ?? true,
        name: payload.name || payload.email.split('@')[0],
        picture: payload.picture || null,
      };

      const { user, token } = this.findOrCreateGoogleUser(googleProfile);
      return { success: true, user, token };
    } catch (err: any) {
      db.log('AUTH', 'ERROR', `Google ID token direct verification failed: ${err?.message}`);
      return {
        success: false,
        error: `Invalid or expired Google token: ${err?.message || 'Verification failed'}`,
      };
    }
  }

  public static findOrCreateGoogleUser(profile: GoogleUserProfile): { user: User; token: string } {
    const now = new Date().toISOString();

    // Determine admin role server-side only
    const adminEmailsConfig = process.env.ADMIN_EMAILS || 'sahilking17341734@gmail.com';
    const adminList = adminEmailsConfig.split(',').map((e) => e.trim().toLowerCase());
    const isAdmin = adminList.includes(profile.email.toLowerCase());
    const role: 'customer' | 'admin' = isAdmin ? 'admin' : 'customer';

    // 1. Check by stable Google Subject ID (sub)
    let user = db.findUserByGoogleSub(profile.sub);

    if (user) {
      // Existing Google user: update last_login_at, name/picture if refreshed
      const updates: Partial<User> = {
        name: profile.name || user.name,
        profile_picture: profile.picture || user.profile_picture,
        email_verified: profile.email_verified,
        last_login_at: now,
        // Role is re-evaluated against current server configuration
        role,
      };
      user = db.updateUser(user.id, updates)!;
      db.log('AUTH', 'INFO', `Google user signed in: ${user.email} (sub: ${profile.sub})`, { userId: user.id });
    } else {
      // 2. Check if an account already exists with this verified email
      const existingByEmail = db.findUserByEmail(profile.email);
      if (existingByEmail) {
        user = db.updateUser(existingByEmail.id, {
          google_sub: profile.sub,
          email_verified: profile.email_verified,
          profile_picture: profile.picture || existingByEmail.profile_picture,
          last_login_at: now,
          role,
        })!;
        db.log('AUTH', 'INFO', `Linked Google account to existing user: ${user.email}`, { userId: user.id });
      } else {
        // 3. Create fresh customer record in the production database
        const newId = `usr_google_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        const newUser: User = {
          id: newId,
          google_sub: profile.sub,
          name: profile.name,
          email: profile.email,
          email_verified: profile.email_verified,
          profile_picture: profile.picture,
          role,
          status: 'ACTIVE',
          created_at: now,
          last_login_at: now,
        };
        user = db.createUser(newUser);
        db.log('AUTH', 'INFO', `New customer created via Google Sign-In: ${user.email} (sub: ${profile.sub})`, { userId: user.id });
      }
    }

    const token = this.generateSessionToken(user);
    return { user, token };
  }

  public static generateSessionToken(user: User): string {
    const payload: AuthSessionPayload = {
      userId: user.id,
      googleSub: user.google_sub,
      email: user.email,
      role: user.role,
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: SESSION_EXPIRY });
  }

  public static verifySessionToken(token: string): AuthSessionPayload | null {
    try {
      return jwt.verify(token, JWT_SECRET) as AuthSessionPayload;
    } catch {
      return null;
    }
  }

  public static updateProfile(userId: string, data: { name?: string; phone?: string }): User {
    const user = db.findUserById(userId);
    if (!user) {
      throw new Error('User account not found');
    }

    const updates: Partial<User> = {};
    if (data.name && data.name.trim()) {
      updates.name = data.name.trim();
    }
    if (data.phone && data.phone.trim()) {
      updates.phone = data.phone.trim();
    }

    const updated = db.updateUser(userId, updates);
    db.log('AUTH', 'INFO', `User profile updated: ${user.email}`, { userId });
    return updated!;
  }

  public static async registerWithEmailPassword(params: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<{ user: User; token: string }> {
    const { name, email, password, phone } = params;

    if (!email || !email.includes('@')) {
      throw new Error('Please provide a valid email address.');
    }
    if (!password || password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }
    if (!name || !name.trim()) {
      throw new Error('Please provide your name.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const existing = db.findUserByEmail(cleanEmail);

    if (existing && existing.password_hash) {
      throw new Error('An account with this email already exists. Please log in.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const now = new Date().toISOString();

    const adminEmailsConfig = process.env.ADMIN_EMAILS || 'sahilking17341734@gmail.com';
    const adminList = adminEmailsConfig.split(',').map((e) => e.trim().toLowerCase());
    const role: 'customer' | 'admin' = adminList.includes(cleanEmail) ? 'admin' : 'customer';

    let user: User;
    if (existing) {
      user = db.updateUser(existing.id, {
        password_hash: passwordHash,
        name: name.trim() || existing.name,
        phone: phone?.trim() || existing.phone,
        last_login_at: now,
      })!;
      db.log('AUTH', 'INFO', `Added password credentials to user: ${user.email}`, { userId: user.id });
    } else {
      const newId = `usr_email_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      user = db.createUser({
        id: newId,
        google_sub: '',
        name: name.trim(),
        email: cleanEmail,
        email_verified: false,
        profile_picture: null,
        phone: phone?.trim(),
        password_hash: passwordHash,
        role,
        status: 'ACTIVE',
        created_at: now,
        last_login_at: now,
      });
      db.log('AUTH', 'INFO', `New user registered with email/password: ${user.email}`, { userId: user.id });
    }

    const token = this.generateSessionToken(user);
    return { user, token };
  }

  public static async loginWithEmailPassword(
    email: string,
    password: string
  ): Promise<{ user: User; token: string }> {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    const cleanEmail = email.trim().toLowerCase();
    const user = db.findUserByEmail(cleanEmail);

    if (!user || !user.password_hash) {
      throw new Error('Invalid email or password.');
    }

    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      throw new Error('Invalid email or password.');
    }

    if (user.status === 'SUSPENDED') {
      throw new Error('Your account is suspended. Please contact support.');
    }

    const now = new Date().toISOString();
    const updatedUser = db.updateUser(user.id, { last_login_at: now })!;
    const token = this.generateSessionToken(updatedUser);
    db.log('AUTH', 'INFO', `User logged in with email/password: ${user.email}`, { userId: user.id });
    return { user: updatedUser, token };
  }
}
