import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';
import { env } from '../utils/env.js';

export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.NODE_ENV === 'development' ? 50000 : env.RATE_LIMIT_MAX,
  skip: () => env.NODE_ENV === 'development',
  message: {
    status: 'error',
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiSlowDown = slowDown({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  delayAfter: env.NODE_ENV === 'development' ? 50000 : env.AUTH_RATE_LIMIT_MAX,
  skip: () => env.NODE_ENV === 'development',
  delayMs: () => 500,
  maxDelayMs: 2000,
});