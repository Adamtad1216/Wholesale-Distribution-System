import 'dotenv/config';
import jwt from 'jsonwebtoken';

const JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET;
const JWT_ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES;

const payload = { userId: 'test', username: 'test' };
const token = jwt.sign(payload, JWT_ACCESS_SECRET, { expiresIn: JWT_ACCESS_EXPIRES });
console.log('Token:', token);

try {
  const decoded = jwt.verify(token, JWT_ACCESS_SECRET);
  console.log('Verified:', decoded);
} catch (e) {
  console.error('Verify failed:', e.message);
}
