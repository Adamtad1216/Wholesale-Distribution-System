import { z } from 'zod';

const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

export const registerSchema = z.discriminatedUnion('customerType', [
  z.object({
    customerType: z.literal('PERSON'),
    username: z.string().min(3).max(50),
    password: z.string().refine(
      (val) => strongPasswordRegex.test(val),
      'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
    ),
    firstName: z.string().min(1).max(100),
    middleName: z.string().max(100).optional(),
    lastName: z.string().min(1).max(100),
    phone: z.string().max(20).optional(),
    email: z.string().email().optional(),
    address: z.string().max(255).optional(),
  }),
  z.object({
    customerType: z.literal('ORGANIZATION'),
    username: z.string().min(3).max(50),
    password: z.string().refine(
      (val) => strongPasswordRegex.test(val),
      'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
    ),
    name: z.string().min(1).max(255),
    registrationNumber: z.string().max(100).optional(),
    taxNumber: z.string().max(100).optional(),
    phone: z.string().max(20).optional(),
    email: z.string().email().optional(),
    address: z.string().max(255).optional(),
    contacts: z.array(
      z.object({
        firstName: z.string().min(1).max(100),
        middleName: z.string().max(100).optional(),
        lastName: z.string().min(1).max(100),
        phone: z.string().max(20).optional(),
        email: z.string().email().optional(),
        address: z.string().max(255).optional(),
        position: z.string().max(100).optional(),
        isPrimary: z.boolean().default(false),
      })
    ).min(1),
  }),
]);

export const loginSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
});

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().refine(
    (val) => strongPasswordRegex.test(val),
    'Password must be at least 8 characters with uppercase, lowercase, number, and special character'
  ),
});
