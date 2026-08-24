import prisma from "../../../config/prisma.js";
import { logAudit } from "../../../middleware/audit.middleware.js";
import { AppError } from "../../../utils/errors.js";
import { hashPassword } from "../../../utils/password.js";
import { getPaginationParams, buildPaginationMeta } from "../../../utils/pagination.js";

export async function getUsers(filters, _requesterId) {
  const { page, limit, skip } = getPaginationParams(filters);
  const where = buildUserWhere(filters);

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        person: {
          select: {
            id: true,
            firstName: true,
            middleName: true,
            lastName: true,
            phone: true,
            email: true,
          },
        },
        userRoles: {
          include: {
            role: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.user.count({ where }),
  ]);

  const meta = buildPaginationMeta({ page, limit, total });

  return { users, meta };
}

export async function getUserById(id) {
  const user = await prisma.user.findFirst({
    where: { id, isArchived: false },
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

export async function createUser(data, createdById, req) {
  const existingUsername = await prisma.user.findUnique({
    where: { username: data.username },
  });
  if (existingUsername) {
    throw new AppError('Username already taken', 409);
  }

  if (data.email) {
    const existingEmail = await prisma.person.findUnique({
      where: { email: data.email },
    });
    if (existingEmail) {
      throw new AppError('Email already registered', 409);
    }
  }

  const roles = await prisma.role.findMany({
    where: { id: { in: data.roleIds } },
  });
  if (roles.length !== data.roleIds.length) {
    throw new AppError('One or more roles not found', 400);
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
        status: 'ACTIVE',
        createdById: createdById,
        updatedById: createdById,
      },
    });

    const userRecord = await tx.user.create({
      data: {
        personId: person.id,
        username: data.username,
        passwordHash,
        isActive: data.isActive,
        createdById: createdById,
        updatedById: createdById,
      },
      include: {
        person: true,
      },
    });

    await tx.userRole.createMany({
      data: data.roleIds.map((roleId) => ({
        createdById: userRecord.id,
        roleId,
      })),
    });

    return userRecord;
  });

  await logAudit({
    createdById,
    action: 'USER_CREATED',
    entityType: 'User',
    entityId: user.id,
    newValues: { username: user.username, roleIds: data.roleIds },
    req,
  });

  return user;
}

export async function updateUser(id, data, createdById, req) {
  const existingUser = await prisma.user.findUnique({
    where: { id },
    include: { person: true },
  });

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  if (data.username && data.username !== existingUser.username) {
    const existingUsername = await prisma.user.findUnique({
      where: { username: data.username },
    });
    if (existingUsername) {
      throw new AppError('Username already taken', 409);
    }
  }

  if (data.email && data.email !== existingUser.person?.email) {
    const existingEmail = await prisma.person.findUnique({
      where: { email: data.email },
    });
    if (existingEmail) {
      throw new AppError('Email already registered', 409);
    }
  }

  if (data.roleIds) {
    const roles = await prisma.role.findMany({
      where: { id: { in: data.roleIds } },
    });
    if (roles.length !== data.roleIds.length) {
      throw new AppError('One or more roles not found', 400);
    }
  }

  const user = await prisma.$transaction(async (tx) => {
    const personUpdates = {};

    if (data.person) {
      if (data.person.firstName !== undefined) personUpdates.firstName = data.person.firstName;
      if (data.person.middleName !== undefined) personUpdates.middleName = data.person.middleName;
      if (data.person.lastName !== undefined) personUpdates.lastName = data.person.lastName;
      if (data.person.phone !== undefined) personUpdates.phone = data.person.phone;
      if (data.person.email !== undefined) personUpdates.email = data.person.email;
      if (data.person.address !== undefined) personUpdates.address = data.person.address;
    } else {
      if (data.firstName !== undefined) personUpdates.firstName = data.firstName;
      if (data.middleName !== undefined) personUpdates.middleName = data.middleName;
      if (data.lastName !== undefined) personUpdates.lastName = data.lastName;
      if (data.phone !== undefined) personUpdates.phone = data.phone;
      if (data.email !== undefined) personUpdates.email = data.email;
      if (data.address !== undefined) personUpdates.address = data.address;
    }

    if (Object.keys(personUpdates).length > 0) {
      await tx.person.update({
        where: { id: existingUser.personId },
        data: {
          ...personUpdates,
          updatedById: createdById,
        },
      });
    }

    const updateData = {
      isActive: data.isActive,
      updatedById: createdById,
    };

    if (data.username) {
      updateData.username = data.username;
    }

    const updatedUser = await tx.user.update({
      where: { id },
      data: updateData,
      include: {
        person: true,
      },
    });

    if (data.roleIds) {
      await tx.userRole.deleteMany({
        where: { createdById: id },
      });
      await tx.userRole.createMany({
        data: data.roleIds.map((roleId) => ({
          createdById: id,
          roleId,
        })),
      });
    }

    return updatedUser;
  });

  await logAudit({
    createdById,
    action: 'USER_UPDATED',
    entityType: 'User',
    entityId: id,
    oldValues: { username: existingUser.username },
    newValues: { username: user.username },
    req,
  });

  return user;
}

export async function resetUserPassword(id, newPassword, createdById, req) {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id },
    data: {
      passwordHash,
      resetTokenHash: null,
      resetTokenExpires: null,
      failedLoginAttempts: 0,
      lockedUntil: null,
      updatedById: createdById,
    },
  });

  await prisma.user.update({
    where: { id },
    data: {
      refreshTokenHash: null,
      refreshTokenExpiresAt: null,
    },
  });

  await logAudit({
    createdById,
    action: 'USER_PASSWORD_RESET',
    entityType: 'User',
    entityId: id,
    req,
  });

  return user;
}

function buildUserWhere(filters) {
  const where = { isArchived: false };

  if (filters.role) {
    where.userRoles = {
      some: {
        role: {
          name: filters.role,
        },
      },
    };
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive === 'true';
  }

  if (filters.search) {
    where.OR = [
      { username: { contains: filters.search, mode: 'insensitive' } },
      {
        person: {
          OR: [
            { firstName: { contains: filters.search, mode: 'insensitive' } },
            { lastName: { contains: filters.search, mode: 'insensitive' } },
          ],
        },
      },
    ];
  }

  return where;
}

export async function deleteUser(id, createdById, req) {
  const existingUser = await prisma.user.findFirst({
    where: { id, isArchived: false },
    include: { person: true },
  });

  if (!existingUser) {
    throw new AppError('User not found', 404);
  }

  await prisma.user.update({
    where: { id },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      updatedById: createdById,
    },
  });

  await logAudit({
    createdById,
    action: 'USER_DELETED',
    entityType: 'User',
    entityId: id,
    oldValues: { username: existingUser.username },
    req,
  });

  return { message: 'User deleted successfully' };
}

