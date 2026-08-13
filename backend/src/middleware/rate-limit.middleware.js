import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { env } from '../utils/env.js';

export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiSlowDown = slowDown({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  delayAfter: env.AUTH_RATE_LIMIT_MAX,
  delayMs: () => 500,
  maxDelayMs: 2000,
});