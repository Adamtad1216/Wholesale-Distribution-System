import prisma from '../../config/prisma.js';
import { hashPassword, comparePassword } from '../../utils/password.js';
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt.js';
import { logAudit } from '../../middleware/audit.middleware.js';
import { env } from '../../utils/env.js';
import crypto from 'crypto';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function register(data, req) {
  const existing = await prisma.user.findUnique({
    where: { username: data.username },
  });
  if (existing) {
    throw new Error('Username already taken');
  }

  if (data.email) {
    const emailPerson = await prisma.person.findUnique({
      where: { email: data.email },
    });
    if (emailPerson) {
      throw new Error('Email already registered');
    }
  }

  const passwordHash = await hashPassword(data.password);

  const user = await prisma.$transaction(async (tx) => {
    const person = await tx.person.create({
      data: {
        firstName: data.firstName,
        middleName: data.middleName,
        lastName: data.lastName,
        phone: data.phone,
        email: data.email,
        address: data.address,
      },
    });

    return tx.user.create({
      data: {
        personId: person.id,
        username: data.username,
        passwordHash,
      },
      include: {
        person: true,
      },
    });
  });

  const accessToken = signAccessToken({
    userId: user.id,
    username: user.username,
  });
  const refreshToken = signRefreshToken({
    userId: user.id,
    username: user.username,
  });
  const refreshTokenHash = await hashPassword(refreshToken);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshTokenHash,
      refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await logAudit({
    userId: user.id,
    action: 'USER_REGISTERED',
    entityType: 'User',
    entityId: user.id,
    newValues: { username: user.username },
    req,
  });

  return { user, accessToken, refreshToken };
}

export async function login(data, req) {
  const user = await prisma.user.findUnique({
    where: { username: data.username },
    include: {
      person: true,
    },
  });

  if (!user) {
    await logAudit({
      action: 'LOGIN_FAILED',
      entityType: 'User',
      entityId: 'unknown',
      newValues: { username: data.username, reason: 'User not found' },
      req,
    });
    const error = new Error('Invalid username or password');
    error.statusCode = 401;
    throw error;
  }

  if (!user.isActive) {
    await logAudit({
      userId: user.id,
      action: 'LOGIN_FAILED',
      entityType: 'User',
      entityId: user.id,
      newValues: { reason: 'Account inactive' },
      req,
    });
    const error = new Error('Invalid username or password');
    error.statusCode = 401;
    throw error;
  }

  if (user.lockedUntil && user.lockedUntil > new Date()) {
    await logAudit({
      userId: user.id,
      action: 'LOGIN_FAILED',
      entityType: 'User',
      entityId: user.id,
      newValues: { reason: 'Account locked' },
      req,
    });
    const error = new Error('Account is locked due to multiple failed login attempts');
    error.statusCode = 401;
    throw error;
  }

  const isPasswordValid = await comparePassword(
    data.password,
    user.passwordHash,
  );

  if (!isPasswordValid) {
    const newFailedAttempts = user.failedLoginAttempts + 1;
    let lockedUntil = null;

    if (newFailedAttempts >= env.MAX_FAILED_ATTEMPTS) {
      lockedUntil = new Date(Date.now() + env.LOCKOUT_DURATION_MS);
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginAttempts: newFailedAttempts,
        lockedUntil,
      },
    });

    if (newFailedAttempts >= 6 && newFailedAttempts <= 9) {
      await sleep(10000);
    } else if (newFailedAttempts >= 4 && newFailedAttempts <= 5) {
      await sleep(3000);
    }

    await logAudit({
      userId: user.id,
      action: 'LOGIN_FAILED',
      entityType: 'User',
      entityId: user.id,
      newValues: { reason: 'Invalid password' },
      req,
    });
    const error = new Error('Invalid username or password');
    error.statusCode = 401;
    throw error;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      lastLoginAt: new Date(),
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  const accessToken = signAccessToken({
    userId: user.id,
    username: user.username,
  });
  const refreshToken = signRefreshToken({
    userId: user.id,
    username: user.username,
  });
  const refreshTokenHash = await hashPassword(refreshToken);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshTokenHash,
      refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await logAudit({
    userId: user.id,
    action: 'LOGIN_SUCCESS',
    entityType: 'User',
    entityId: user.id,
    req,
  });

  return { user, accessToken, refreshToken };
}

export async function refreshTokens(refreshToken, req) {
  let payload;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch (err) {
    throw new Error('Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user || !user.isActive) {
    throw new Error('User not found or inactive');
  }

  if (!user.refreshTokenHash || !user.refreshTokenExpiresAt) {
    throw new Error('No refresh token session found');
  }

  if (user.refreshTokenExpiresAt < new Date()) {
    throw new Error('Refresh token expired');
  }

  const isTokenValid = await comparePassword(refreshToken, user.refreshTokenHash);
  if (!isTokenValid) {
    throw new Error('Invalid refresh token');
  }

  const accessToken = signAccessToken({
    userId: user.id,
    username: user.username,
  });
  const newRefreshToken = signRefreshToken({
    userId: user.id,
    username: user.username,
  });
  const newRefreshTokenHash = await hashPassword(newRefreshToken);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshTokenHash: newRefreshTokenHash,
      refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await logAudit({
    userId: user.id,
    action: 'TOKEN_REFRESHED',
    entityType: 'User',
    entityId: user.id,
    req,
  });

  return { accessToken, refreshToken: newRefreshToken };
}

export async function logout(userId, req) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
    },
  });

  await logAudit({
    userId,
    action: 'LOGOUT',
    entityType: 'User',
    entityId: userId,
    req,
  });
}

export async function getMe(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      person: true,
      userRoles: {
        include: {
          role: {
            include: {
              rolePermissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

export async function cleanupExpiredRefreshTokens() {
  const result = await prisma.user.updateMany({
    where: {
      refreshTokenExpiresAt: {
        lt: new Date(),
      },
    },
    data: {
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
    },
  });

  return result.count;
}

export async function createPasswordResetToken(email) {
  const person = await prisma.person.findUnique({
    where: { email },
    include: {
      user: true,
    },
  });

  if (!person || !person.user) {
    return null;
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenHash = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');
  const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.user.update({
    where: { id: person.user.id },
    data: {
      resetTokenHash,
      resetTokenExpires,
    },
  });

  await logAudit({
    userId: person.user.id,
    action: 'PASSWORD_RESET_REQUESTED',
    entityType: 'User',
    entityId: person.user.id,
    req: null,
  });

  return { userId: person.user.id, resetToken, resetTokenExpires };
}

export async function resetPassword(token, newPassword) {
  const resetTokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      resetTokenHash,
      resetTokenExpires: {
        gt: new Date(),
      },
    },
  });

  if (!user) {
    throw new Error('Invalid or expired reset token');
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      resetTokenHash: null,
      resetTokenExpires: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
    },
  });

  await logAudit({
    userId: user.id,
    action: 'PASSWORD_RESET_COMPLETED',
    entityType: 'User',
    entityId: user.id,
    req: null,
  });

  return user;
}