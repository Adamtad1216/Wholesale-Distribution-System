import jwt from 'jsonwebtoken';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'your-access-secret';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'your-refresh-secret';
const JWT_ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const JWT_REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '7d';

export function signAccessToken(payload) {
  return jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRES });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, JWT_ACCESS_SECRET);
}

export function signRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES });
}

export function verifyRefreshToken(token) {
  return jwt.verify(token, JWT_REFRESH_SECRET);
}