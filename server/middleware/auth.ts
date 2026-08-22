import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AuthPayload {
  userId: string;
  role: 'resident' | 'admin';
  email: string;
  name: string;
}

// Augment Express Request so `req.user` is typed project-wide
declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET environment variable is required but not set.');
  return secret;
}

const COOKIE_NAME = 'auth_token';

/** Generate a signed JWT for the given payload. */
export function generateToken(payload: AuthPayload): string {
  const expiresIn = (process.env.JWT_EXPIRES_IN || '1d') as jwt.SignOptions['expiresIn'];
  return jwt.sign(payload, getSecret(), { expiresIn });
}

/** Attach the JWT as a secure httpOnly cookie on the response. */
export function setCookieToken(res: Response, token: string): void {
  const isProduction = process.env.NODE_ENV === 'production';
  // maxAge in milliseconds: mirrors JWT_EXPIRES_IN (default 1 day)
  const maxAgeMs = 24 * 60 * 60 * 1000;
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: isProduction,      // HTTPS only in production
    sameSite: 'lax',           // CSRF protection while allowing normal navigation
    maxAge: maxAgeMs,
    path: '/',
  });
}

/** Clear the auth cookie (used on logout). */
export function clearCookieToken(res: Response): void {
  res.clearCookie(COOKIE_NAME, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

// ─── Middleware ───────────────────────────────────────────────────────────────

/**
 * Verifies the JWT from the httpOnly cookie.
 * Attaches `req.user` on success, returns 401 on failure.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const token: string | undefined = req.cookies?.[COOKIE_NAME];

  if (!token) {
    res.status(401).json({ error: 'Authentication required. Please log in.' });
    return;
  }

  try {
    req.user = jwt.verify(token, getSecret()) as AuthPayload;
    next();
  } catch {
    // Covers: expired, malformed, wrong secret
    res.status(401).json({ error: 'Session expired or invalid. Please log in again.' });
  }
}

/**
 * Ensures the authenticated user holds the 'admin' role.
 * Must be used AFTER requireAuth.
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    res.status(401).json({ error: 'Authentication required.' });
    return;
  }
  if (req.user.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required.' });
    return;
  }
  next();
}
