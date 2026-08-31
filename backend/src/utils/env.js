import { z } from 'zod';
import { logger } from './logger.js';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(5000),
  DATABASE_URL: z.string().url(),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  JWT_ACCESS_EXPIRES: z.string().default('15m'),
  JWT_REFRESH_EXPIRES: z.string().default('7d'),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(900000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),
  AUTH_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(5),
  LOCKOUT_DURATION_MS: z.coerce.number().int().positive().default(900000),
  MAX_FAILED_ATTEMPTS: z.coerce.number().int().positive().default(10),
  RESET_TOKEN_SECRET: z.string().min(32),
  RESET_TOKEN_EXPIRES: z.string().default('1h'),
  BASE_URL: z.string().url().default('http://localhost:5000'),
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_SECURE: z.coerce.boolean().default(false),
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  SMTP_FROM: z.string().default('Wholesale Distribution <noreply@wholesale.com>'),
  SMTP_REJECT_UNAUTHORIZED: z.string().default('true'),
  CLOUDINARY_CLOUD_NAME: z.string().optional(),
  CLOUDINARY_API_KEY: z.string().optional(),
  CLOUDINARY_API_SECRET: z.string().optional(),
});

export function validateEnv() {
  const result = envSchema.safeParse(process.env);
  if (!result.success) {
    logger.error({ errors: result.error.flatten().fieldErrors }, 'Invalid environment variables');
    process.exit(1);
  }
  return result.data;
}

export const env = validateEnv();