import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { env } from '../utils/env.js';

// Skip all rate limiting in development so repeated logins / hot-reloads
// never trigger 429s during local development.
const skipInDev = () => env.NODE_ENV === 'development';

// Global limiter applied to every /api route.
export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  skip: skipInDev,
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Slow-down middleware applied to every /api route.
export const apiSlowDown = slowDown({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  delayAfter: env.AUTH_RATE_LIMIT_MAX,
  delayMs: () => 500,
  maxDelayMs: 2000,
  skip: skipInDev,
});

// Dedicated, stricter limiter for auth endpoints (login, register, etc.).
// Applied per-route in auth.routes.js instead of globally.
export const authRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.AUTH_RATE_LIMIT_MAX,
  skip: skipInDev,
  message: {
    status: 'error',
    message: 'Too many login attempts. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});