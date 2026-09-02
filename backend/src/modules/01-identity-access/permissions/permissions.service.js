import prisma from '../../../config/prisma.js';

export const getAllPermissions = async () => {
  return prisma.permission.findMany({
    where: { isArchived: false },
    orderBy: [{ module: 'asc' }, { name: 'asc' }],
  });
};

export const getPermissionById = async (id) => {
  const permission = await prisma.permission.findUnique({
    where: { id },
  });
  if (!permission || permission.isArchived) {
    throw new Error('Permission not found');
  }
  return permission;
};

export const createPermission = async (data, userId) => {
  const existing = await prisma.permission.findUnique({
    where: { name: data.name },
  });
  if (existing && !existing.isArchived) {
    throw new Error('Permission with this name already exists');
  }
  
  return prisma.permission.create({
    data: {
      ...data,
      createdById: userId,
    },
  });
};

export const updatePermission = async (id, data, userId) => {
  const permission = await getPermissionById(id);
  
  if (data.name && data.name !== permission.name) {
    const existing = await prisma.permission.findUnique({
      where: { name: data.name },
    });
    if (existing && !existing.isArchived) {
      throw new Error('Permission with this name already exists');
    }
  }

  return prisma.permission.update({
    where: { id },
    data: {
      ...data,
      updatedById: userId,
    },
  });
};

export const deletePermission = async (id, userId) => {
  const permission = await getPermissionById(id);
  
  return prisma.permission.update({
    where: { id },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      updatedById: userId,
    },
  });
};
