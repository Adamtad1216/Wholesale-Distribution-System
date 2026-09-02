import prisma from '../../../config/prisma.js';

export const getAllRoles = async () => {
  return prisma.role.findMany({
    where: { isArchived: false },
    include: {
      rolePermissions: {
        where: { isArchived: false },
        include: {
          permission: true,
        },
      },
    },
    orderBy: { name: 'asc' },
  });
};

export const getRoleById = async (id) => {
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      rolePermissions: {
        where: { isArchived: false },
        include: {
          permission: true,
        },
      },
    },
  });
  if (!role || role.isArchived) {
    throw new Error('Role not found');
  }
  return role;
};

export const createRole = async (data, userId) => {
  const existing = await prisma.role.findUnique({
    where: { name: data.name },
  });
  if (existing && !existing.isArchived) {
    throw new Error('Role with this name already exists');
  }
  
  return prisma.role.create({
    data: {
      ...data,
      createdById: userId,
    },
  });
};

export const updateRole = async (id, data, userId) => {
  const role = await getRoleById(id);
  
  if (data.name && data.name !== role.name) {
    const existing = await prisma.role.findUnique({
      where: { name: data.name },
    });
    if (existing && !existing.isArchived) {
      throw new Error('Role with this name already exists');
    }
  }

  return prisma.role.update({
    where: { id },
    data: {
      ...data,
      updatedById: userId,
    },
  });
};

export const deleteRole = async (id, userId) => {
  const role = await getRoleById(id);
  
  return prisma.role.update({
    where: { id },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      updatedById: userId,
    },
  });
};

export const assignPermission = async (roleId, permissionId, userId) => {
  const role = await getRoleById(roleId);
  const permission = await prisma.permission.findUnique({ where: { id: permissionId } });
  
  if (!permission || permission.isArchived) {
    throw new Error('Permission not found');
  }

  const existingMapping = await prisma.rolePermission.findUnique({
    where: {
      roleId_permissionId: {
        roleId,
        permissionId,
      },
    },
  });

  if (existingMapping) {
    if (existingMapping.isArchived) {
      return prisma.rolePermission.update({
        where: { roleId_permissionId: { roleId, permissionId } },
        data: { isArchived: false, updatedById: userId },
      });
    }
    throw new Error('Permission is already assigned to this role');
  }

  return prisma.rolePermission.create({
    data: {
      roleId,
      permissionId,
      createdById: userId,
    },
  });
};

export const removePermission = async (roleId, permissionId, userId) => {
  const existingMapping = await prisma.rolePermission.findUnique({
    where: {
      roleId_permissionId: {
        roleId,
        permissionId,
      },
    },
  });

  if (!existingMapping || existingMapping.isArchived) {
    throw new Error('Permission is not assigned to this role');
  }

  return prisma.rolePermission.update({
    where: { roleId_permissionId: { roleId, permissionId } },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      updatedById: userId,
    },
  });
};
