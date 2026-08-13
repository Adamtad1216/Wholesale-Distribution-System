import { env } from '../utils/env.js';

const authFailures = new Map();

function cleanupOldEntries() {
  const now = Date.now();
  for (const [ip, data] of authFailures.entries()) {
    if (now - data.lastAttempt > env.RATE_LIMIT_WINDOW_MS) {
      authFailures.delete(ip);
    }
  }
}

export function recordAuthFailure(ip) {
  cleanupOldEntries();
  const data = authFailures.get(ip) || { count: 0, lastAttempt: 0 };
  data.count++;
  data.lastAttempt = Date.now();
  authFailures.set(ip, data);
  return data.count;
}

export function clearAuthFailures(ip) {
  authFailures.delete(ip);
}

export function getAuthFailureCount(ip) {
  cleanupOldEntries();
  const data = authFailures.get(ip);
  return data ? data.count : 0;
}

export function isAuthBlocked(ip) {
  cleanupOldEntries();
  const data = authFailures.get(ip);
  return data ? data.count >= env.AUTH_RATE_LIMIT_MAX : false;
}

export const authFailureMiddleware = (req, res, next) => {
  if (isAuthBlocked(req.ip)) {
    return res.status(429).json({
      status: 'error',
      message: 'Too many authentication attempts, please try again later.',
    });
  }
  next();
};