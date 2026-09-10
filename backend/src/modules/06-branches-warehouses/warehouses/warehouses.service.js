import prisma from "../../../config/prisma.js";
import { logAudit } from "../../../middleware/audit.middleware.js";
import { AppError } from "../../../utils/errors.js";
import { getPaginationParams, buildPaginationMeta } from "../../../utils/pagination.js";
import { getUserScope } from "../../../utils/warehouse-scope.js";

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

  if (data.managerId) {
    const employee = await prisma.employee.findFirst({
      where: { id: data.managerId, isArchived: false, status: 'ACTIVE' },
    });
    if (!employee) {
      throw new AppError('Assigned warehouse manager employee not found or inactive', 404);
    }
  }

  const warehouse = await prisma.$transaction(async (tx) => {
    const wh = await tx.warehouse.create({
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
        managerId: data.managerId || null,
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
                phone: true,
                email: true,
              },
            },
          },
        },
        managerAssignments: {
          where: { isCurrent: true },
          include: {
            employee: {
              include: {
                person: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    email: true,
                  },
                },
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

    if (data.managerId) {
      await tx.warehouseManager.create({
        data: {
          warehouseId: wh.id,
          employeeId: data.managerId,
          isCurrent: true,
          assignedAt: new Date(),
          notes: 'Assigned during warehouse registration',
          createdById,
          updatedById: createdById,
        },
      });
    }

    return wh;
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

export async function getWarehouses(filters, user = null) {
  const { page, limit, skip } = getPaginationParams(filters);
  const where = buildWarehouseWhere(filters);

  // Enforce branch/warehouse scope for non-global users unless explicitly querying all (e.g. for transfer destination)
  if (user && filters.scope !== 'all') {
    const scope = await getUserScope(user);
    if (!scope.isGlobal) {
      where.id = { in: scope.warehouseIds || [] };
    }
  }

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
                phone: true,
                email: true,
              },
            },
          },
        },
        managerAssignments: {
          where: { isCurrent: true },
          include: {
            employee: {
              include: {
                person: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    email: true,
                  },
                },
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

export async function getWarehouseById(id, user = null) {
  if (user) {
    const scope = await getUserScope(user);
    if (!scope.isGlobal && !scope.warehouseIds.includes(id)) {
      throw new AppError('You are not authorized to view this warehouse', 403);
    }
  }

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
              phone: true,
              email: true,
            },
          },
        },
      },
      managerAssignments: {
        where: { isCurrent: true },
        include: {
          employee: {
            include: {
              person: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  phone: true,
                  email: true,
                },
              },
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

  if (data.managerId !== undefined && data.managerId !== existingWarehouse.managerId) {
    if (data.managerId) {
      const employee = await prisma.employee.findFirst({
        where: { id: data.managerId, isArchived: false, status: 'ACTIVE' },
      });
      if (!employee) {
        throw new AppError('Assigned warehouse manager employee not found or inactive', 404);
      }
    }
  }

  const updatedWarehouse = await prisma.$transaction(async (tx) => {
    const wh = await tx.warehouse.update({
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
        managerId: data.managerId !== undefined ? data.managerId : undefined,
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
                phone: true,
                email: true,
              },
            },
          },
        },
        managerAssignments: {
          where: { isCurrent: true },
          include: {
            employee: {
              include: {
                person: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    email: true,
                  },
                },
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

    if (data.managerId !== undefined && data.managerId !== existingWarehouse.managerId) {
      // Unassign existing active manager
      await tx.warehouseManager.updateMany({
        where: { warehouseId: id, isCurrent: true },
        data: {
          isCurrent: false,
          unassignedAt: new Date(),
          updatedById: createdById,
        },
      });

      // If new manager assigned, create new active record
      if (data.managerId) {
        await tx.warehouseManager.create({
          data: {
            warehouseId: id,
            employeeId: data.managerId,
            isCurrent: true,
            assignedAt: new Date(),
            notes: 'Manager updated via warehouse settings',
            createdById,
            updatedById: createdById,
          },
        });
      }
    }

    return wh;
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

export async function getEligibleManagers() {
  const employees = await prisma.employee.findMany({
    where: { isArchived: false, status: 'ACTIVE' },
    include: {
      person: {
        select: {
          id: true,
          firstName: true,
          middleName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
      jobSpecifications: {
        include: {
          jobSpecification: {
            select: { id: true, code: true, title: true, department: true },
          },
        },
      },
      branch: {
        select: { id: true, name: true, branchCode: true },
      },
      managedWarehouses: {
        where: { isArchived: false },
        select: { id: true, name: true, code: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return employees.map((emp) => {
    const fullName = emp.person
      ? [emp.person.firstName, emp.person.middleName, emp.person.lastName].filter(Boolean).join(' ')
      : emp.employeeCode;
    const primaryJob = emp.jobSpecifications?.[0]?.jobSpecification?.title || emp.department || 'Employee';

    return {
      id: emp.id,
      employeeCode: emp.employeeCode,
      name: fullName,
      email: emp.person?.email || null,
      phone: emp.person?.phone || null,
      department: emp.department || null,
      primaryRole: primaryJob,
      branch: emp.branch ? `${emp.branch.name} (${emp.branch.branchCode || 'BR'})` : null,
      currentWarehouse: emp.managedWarehouses?.[0]?.name || null,
    };
  });
}

export async function assignWarehouseManager(warehouseId, employeeId, notes, userId, req) {
  const warehouse = await prisma.warehouse.findFirst({
    where: { id: warehouseId, isArchived: false },
  });
  if (!warehouse) throw new AppError('Warehouse not found', 404);

  let employee = null;
  if (employeeId) {
    employee = await prisma.employee.findFirst({
      where: { id: employeeId, isArchived: false, status: 'ACTIVE' },
      include: { person: true },
    });
    if (!employee) throw new AppError('Employee not found or inactive', 404);
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.warehouseManager.updateMany({
      where: { warehouseId, isCurrent: true },
      data: {
        isCurrent: false,
        unassignedAt: new Date(),
        updatedById: userId,
      },
    });

    if (employeeId) {
      await tx.warehouseManager.create({
        data: {
          warehouseId,
          employeeId,
          isCurrent: true,
          assignedAt: new Date(),
          notes: notes || 'Direct manager assignment',
          createdById: userId,
          updatedById: userId,
        },
      });
    }

    return tx.warehouse.update({
      where: { id: warehouseId },
      data: {
        managerId: employeeId || null,
        updatedById: userId,
        updatedAt: new Date(),
      },
      include: {
        manager: {
          include: {
            person: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        managerAssignments: {
          where: { isCurrent: true },
          include: {
            employee: {
              include: {
                person: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    phone: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  });

  await logAudit({
    createdById: userId,
    action: 'WAREHOUSE_MANAGER_ASSIGNED',
    entityType: 'Warehouse',
    entityId: warehouseId,
    oldValues: { managerId: warehouse.managerId },
    newValues: { managerId: employeeId, notes },
    req,
  });

  return sanitizeWarehouse(result);
}

