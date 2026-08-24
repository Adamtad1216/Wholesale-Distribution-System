import prisma from "../../../config/prisma.js";
import { logAudit } from "../../../middleware/audit.middleware.js";
import { AppError } from "../../../utils/errors.js";
import { getPaginationParams, buildPaginationMeta } from "../../../utils/pagination.js";

const sanitizeWarehouse = (warehouse) => {
  if (!warehouse) return warehouse;
  return {
    ...warehouse,
    region: warehouse.region
      ? {
          id: warehouse.region.id,
          name: warehouse.region.name,
          code: warehouse.region.code,
        }
      : null,
    createdBy: warehouse.createdBy
      ? {
          id: warehouse.createdBy.id,
          person: warehouse.createdBy.person,
        }
      : null,
    updatedBy: warehouse.updatedBy
      ? {
          id: warehouse.updatedBy.id,
          person: warehouse.updatedBy.person,
        }
      : null,
  };
};

export async function createWarehouse(data, createdById, req) {
  const branch = await prisma.branch.findFirst({
    where: { id: data.branchId, isArchived: false },
  });

  if (!branch) {
    throw new AppError('Branch not found', 404);
  }

  const region = await prisma.region.findFirst({
    where: { id: data.regionId, isActive: true },
  });

  if (!region) {
    throw new AppError('Region not found or inactive', 404);
  }

  const warehouse = await prisma.warehouse.create({
    data: {
      code: data.code,
      name: data.name,
      branchId: data.branchId,
      location: data.location,
      regionId: data.regionId,
      city: data.city,
      subCity: data.subCity,
      woreda: data.woreda,
      kebele: data.kebele,
      houseNumber: data.houseNumber,
      managerId: data.managerId,
      status: data.status || 'ACTIVE',
      createdById,
      updatedById: createdById,
    },
    include: {
      region: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      branch: {
        select: {
          id: true,
          name: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      manager: {
        include: {
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      createdBy: {
        include: {
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      updatedBy: {
        include: {
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  await logAudit({
    createdById,
    action: 'WAREHOUSE_CREATED',
    entityType: 'Warehouse',
    entityId: warehouse.id,
    newValues: { name: warehouse.name, branchId: warehouse.branchId },
    req,
  });

  return sanitizeWarehouse(warehouse);
}

export async function getWarehouses(filters) {
  const { page, limit, skip } = getPaginationParams(filters);
  const where = buildWarehouseWhere(filters);

  const [warehouses, total] = await Promise.all([
    prisma.warehouse.findMany({
      where,
      include: {
        region: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
        branch: {
          select: {
            id: true,
            name: true,
            company: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        manager: {
          include: {
            person: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        createdBy: {
          include: {
            person: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        updatedBy: {
          include: {
            person: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.warehouse.count({ where }),
  ]);

  const meta = buildPaginationMeta({ page, limit, total });

  return {
    warehouses: warehouses.map(sanitizeWarehouse),
    meta,
  };
}

export async function getWarehouseById(id) {
  const warehouse = await prisma.warehouse.findFirst({
    where: { id, isArchived: false },
    include: {
      region: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      branch: {
        select: {
          id: true,
          name: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      manager: {
        include: {
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      createdBy: {
        include: {
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      updatedBy: {
        include: {
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  if (!warehouse) {
    throw new AppError('Warehouse not found', 404);
  }

  return sanitizeWarehouse(warehouse);
}

export async function updateWarehouse(id, data, createdById, req) {
  const existingWarehouse = await prisma.warehouse.findFirst({
    where: { id, isArchived: false },
    include: {
      branch: true,
      region: true,
      createdBy: {
        include: {
          person: true,
        },
      },
    },
  });

  if (!existingWarehouse) {
    throw new AppError('Warehouse not found', 404);
  }

  if (data.branchId && data.branchId !== existingWarehouse.branchId) {
    const branch = await prisma.branch.findFirst({
      where: { id: data.branchId, isArchived: false },
    });
    if (!branch) {
      throw new AppError('Branch not found', 404);
    }
  }

  if (data.regionId && data.regionId !== existingWarehouse.regionId) {
    const region = await prisma.region.findFirst({
      where: { id: data.regionId, isActive: true },
    });
    if (!region) {
      throw new AppError('Region not found or inactive', 404);
    }
  }

  if (data.code && data.code !== existingWarehouse.code) {
    const duplicate = await prisma.warehouse.findFirst({
      where: { code: data.code, id: { not: id } },
    });
    if (duplicate) {
      throw new AppError('Warehouse code already exists', 409);
    }
  }

  const updatedWarehouse = await prisma.warehouse.update({
    where: { id },
    data: {
      code: data.code,
      name: data.name,
      branchId: data.branchId,
      location: data.location,
      regionId: data.regionId,
      city: data.city,
      subCity: data.subCity,
      woreda: data.woreda,
      kebele: data.kebele,
      houseNumber: data.houseNumber,
      managerId: data.managerId,
      status: data.status,
      updatedById: createdById,
    },
    include: {
      region: {
        select: {
          id: true,
          name: true,
          code: true,
        },
      },
      branch: {
        select: {
          id: true,
          name: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      manager: {
        include: {
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      createdBy: {
        include: {
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
      updatedBy: {
        include: {
          person: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      },
    },
  });

  await logAudit({
    createdById,
    action: 'WAREHOUSE_UPDATED',
    entityType: 'Warehouse',
    entityId: id,
    oldValues: { name: existingWarehouse.name, branchId: existingWarehouse.branchId },
    newValues: { name: updatedWarehouse.name, branchId: updatedWarehouse.branchId },
    req,
  });

  return sanitizeWarehouse(updatedWarehouse);
}

export async function deleteWarehouse(id, createdById, req) {
  const existingWarehouse = await prisma.warehouse.findFirst({
    where: { id, isArchived: false },
  });

  if (!existingWarehouse) {
    throw new AppError('Warehouse not found', 404);
  }

  await prisma.warehouse.update({
    where: { id },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      updatedById: createdById,
    },
  });

  await logAudit({
    createdById,
    action: 'WAREHOUSE_DELETED',
    entityType: 'Warehouse',
    entityId: id,
    oldValues: { name: existingWarehouse.name },
    req,
  });

  return { message: 'Warehouse deleted successfully' };
}

function buildWarehouseWhere(filters) {
  const where = { isArchived: false };

  if (filters.branchId) {
    where.branchId = filters.branchId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { code: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return where;
}

