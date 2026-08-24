import prisma from "../../../config/prisma.js";
import { hashPassword, comparePassword } from "../../../utils/password.js";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../../../utils/jwt.js";
import { logAudit } from "../../../middleware/audit.middleware.js";
import { env } from "../../../utils/env.js";
import { AppError } from "../../../utils/errors.js";
import crypto from 'crypto';
import { sendResetPasswordEmail } from "../../../utils/email.js";
import { ensureUniqueCode } from '../../09-customers/customers/customers.service.js';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function register(data, req) {
  const existingUsername = await prisma.user.findUnique({
    where: { username: data.username },
  });
  if (existingUsername) {
    throw new AppError('Username already taken', 400);
  }

  const customerRole = await prisma.role.findUnique({
    where: { name: 'CUSTOMER' },
  });

  if (!customerRole) {
    throw new AppError('CUSTOMER role not configured. Please contact support.', 500);
  }

  const passwordHash = await hashPassword(data.password);

  const result = await prisma.$transaction(async (tx) => {
    let person;
    let customer;

    if (data.customerType === 'PERSON') {
      if (data.email) {
        const existingEmail = await prisma.person.findFirst({
          where: { email: data.email },
        });
        if (existingEmail) {
          throw new AppError('Email already registered', 400);
        }
      }

      person = await tx.person.create({
        data: {
          firstName: data.firstName,
          middleName: data.middleName,
          lastName: data.lastName,
          phone: data.phone,
          email: data.email,
          address: data.address,
          status: 'ACTIVE',
        },
      });

      const customerCode = await ensureUniqueCode(tx, generateCustomerCode());

      customer = await tx.customer.create({
        data: {
          customerCode,
          customerType: 'PERSON',
          personId: person.id,
          status: 'ACTIVE',
          creditLimit: 0,
        },
      });
    } else if (data.customerType === 'ORGANIZATION') {
      const existingReg = await prisma.organization.findFirst({
        where: { registrationNumber: data.registrationNumber },
      });
      if (existingReg) {
        throw new AppError('Organization with this registration number already exists', 409);
      }

      const existingTax = await prisma.organization.findFirst({
        where: { taxNumber: data.taxNumber },
      });
      if (existingTax) {
        throw new AppError('Organization with this tax number already exists', 409);
      }

      if (!data.contacts || data.contacts.length === 0) {
        throw new AppError('At least one contact person is required for organization registration', 400);
      }

      for (const contact of data.contacts) {
        if (contact.email) {
          const existingEmail = await prisma.person.findFirst({
            where: { email: contact.email },
          });
          if (existingEmail) {
            throw new AppError('Contact email already registered', 400);
          }
        }
      }

      const organization = await tx.organization.create({
        data: {
          name: data.name,
          registrationNumber: data.registrationNumber,
          taxNumber: data.taxNumber,
          phone: data.phone,
          email: data.email,
          address: data.address,
          status: 'ACTIVE',
        },
      });

      const createdPersons = [];
      let primaryPerson = null;

      for (const contact of data.contacts) {
        const person = await tx.person.create({
          data: {
            firstName: contact.firstName,
            middleName: contact.middleName,
            lastName: contact.lastName,
            phone: contact.phone,
            email: contact.email,
            address: contact.address || data.address,
            status: 'ACTIVE',
          },
        });
        createdPersons.push(person);

        if (contact.isPrimary) {
          primaryPerson = person;
        }

        await tx.organizationContact.create({
          data: {
            organizationId: organization.id,
            personId: person.id,
            position: contact.position,
            isPrimary: contact.isPrimary,
          },
        });
      }

      const customerCode = await ensureUniqueCode(tx, generateCustomerCode());

      customer = await tx.customer.create({
        data: {
          customerCode,
          customerType: 'ORGANIZATION',
          organizationId: organization.id,
          status: 'ACTIVE',
          creditLimit: 0,
        },
      });

      if (!primaryPerson && createdPersons.length > 0) {
        primaryPerson = createdPersons[0];
      }

      if (primaryPerson) {
        person = primaryPerson;
      }
    } else {
      throw new AppError('Invalid customer type', 400);
    }

    const user = await tx.user.create({
      data: {
        personId: person.id,
        username: data.username,
        passwordHash,
        accountStatus: 'ACTIVE',
        isActive: true,
      },
      include: {
        person: true,
      },
    });

    await tx.userRole.create({
      data: {
        userId: user.id,
        roleId: customerRole.id,
      },
    });

    return { user, customer };
  });

  const customerWithRelations = await prisma.customer.findUnique({
    where: { id: result.customer.id },
    include: {
      person: true,
      organization: {
        include: {
          contacts: {
            include: {
              person: {
                select: {
                  id: true,
                  firstName: true,
                  middleName: true,
                  lastName: true,
                  phone: true,
                  email: true,
                  address: true,
                },
              },
            },
          },
        },
      },
    },
  });

  const accessToken = signAccessToken({
    userId: result.user.id,
    username: result.user.username,
  });
  const refreshToken = signRefreshToken({
    userId: result.user.id,
    username: result.user.username,
  });
  const refreshTokenHash = await hashPassword(refreshToken);

  await prisma.user.update({
    where: { id: result.user.id },
    data: {
      refreshTokenHash,
      refreshTokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  await logAudit({
    userId: result.user.id,
    action: 'CUSTOMER_REGISTERED',
    entityType: 'Customer',
    entityId: result.customer.id,
    newValues: {
      username: result.user.username,
      customerCode: result.customer.customerCode,
      customerType: result.customer.customerType,
    },
    req,
  });

  return {
    user: result.user,
    customer: customerWithRelations,
    accessToken,
    refreshToken,
  };
}

function generateCustomerCode() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CUS-${timestamp}-${random}`;
}

export async function login(data, req) {
  const user = await prisma.user.findUnique({
    where: { username: data.username },
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
    await logAudit({
      userId: null,
      action: 'LOGIN_FAILED',
      entityType: 'User',
      entityId: null,
      newValues: { username: data.username, reason: 'User not found' },
      req,
    });
    throw new AppError('Invalid username or password', 401);
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
    throw new AppError('Invalid username or password', 401);
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
    throw new AppError('Account is locked due to multiple failed login attempts', 401);
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
    throw new AppError('Invalid username or password', 401);
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
  } catch {
    throw new AppError('Invalid or expired refresh token', 401);
  }

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });

  if (!user || !user.isActive) {
    throw new AppError('User not found or inactive', 401);
  }

  if (!user.refreshTokenHash || !user.refreshTokenExpiresAt) {
    throw new AppError('No refresh token session found', 401);
  }

  if (user.refreshTokenExpiresAt < new Date()) {
    throw new AppError('Refresh token expired', 401);
  }

  const isTokenValid = await comparePassword(refreshToken, user.refreshTokenHash);
  if (!isTokenValid) {
    throw new AppError('Invalid refresh token', 401);
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
    throw new AppError('User not found', 404);
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

  await sendResetPasswordEmail(email, resetToken, person.firstName);

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
    throw new AppError('Invalid or expired reset token', 400);
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

export async function acceptInvitation(token, username, password) {
  const invitationTokenHash = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  const user = await prisma.user.findFirst({
    where: {
      invitationTokenHash,
      accountStatus: 'INVITED',
      invitationTokenExpiresAt: {
        gt: new Date(),
      },
    },
    include: {
      person: true,
    },
  });

  if (!user) {
    throw new AppError('Invalid or expired invitation token', 400);
  }

  const existingUsername = await prisma.user.findUnique({
    where: { username },
  });
  if (existingUsername) {
    throw new AppError('Username already taken', 409);
  }

  const passwordHash = await hashPassword(password);

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      username,
      passwordHash,
      accountStatus: 'ACTIVE',
      isActive: true,
      invitationAcceptedAt: new Date(),
      invitationTokenHash: null,
      invitationTokenExpiresAt: null,
    },
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

  await logAudit({
    userId: user.id,
    action: 'INVITATION_ACCEPTED',
    entityType: 'User',
    entityId: user.id,
    newValues: { username },
    req: null,
  });

  return updatedUser;
}

