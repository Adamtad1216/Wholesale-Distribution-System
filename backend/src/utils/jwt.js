import jwt from 'jsonwebtoken';
import { env } from './env.js';

const JWT_ACCESS_SECRET = env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET = env.JWT_REFRESH_SECRET;
const JWT_ACCESS_EXPIRES = env.JWT_ACCESS_EXPIRES;
const JWT_REFRESH_EXPIRES = env.JWT_REFRESH_EXPIRES;

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