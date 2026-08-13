import rateLimit from 'express-rate-limit';
import { config } from '../config/env';

// On serverless platforms (Vercel/Netlify functions) the client IP is not always
// present the way express-rate-limit expects, which throws
// ERR_ERL_UNDEFINED_IP_ADDRESS. Derive a stable key from forwarded headers and
// fall back to a constant bucket so a missing IP never crashes the request.
const safeKey = (req: { ip?: string; headers: Record<string, unknown> }): string => {
  const fwd = req.headers['x-forwarded-for'];
  const fromHeader = Array.isArray(fwd)
    ? fwd[0]
    : typeof fwd === 'string'
      ? fwd.split(',')[0]?.trim()
      : undefined;
  return req.ip || fromHeader || 'global';
};

/** Global API limiter. */
export const apiLimiter = rateLimit({
  windowMs: config.RATE_LIMIT_WINDOW_MS,
  max: config.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: safeKey as never,
  validate: false, // skip built-in IP validation (serverless-safe)
  message: { success: false, message: 'Too many requests, please try again later.', code: 'RATE_LIMIT' },
});

/** Stricter limiter for auth endpoints to slow brute-force attempts. */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.isProd ? 20 : 100,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: safeKey as never,
  validate: false,
  message: { success: false, message: 'Too many authentication attempts.', code: 'AUTH_RATE_LIMIT' },
});
