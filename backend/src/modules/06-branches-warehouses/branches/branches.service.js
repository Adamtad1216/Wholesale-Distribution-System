import prisma from "../../../config/prisma.js";
import { logAudit } from "../../../middleware/audit.middleware.js";
import { AppError } from "../../../utils/errors.js";
import { getPaginationParams, buildPaginationMeta } from "../../../utils/pagination.js";

const sanitizeWarehouse = (wh) => {
  if (!wh) return wh;
  const currentAssignment =
    wh.managerAssignments?.find((a) => a.isCurrent) ||
    wh.managerAssignments?.[0] ||
    null;
  const manager = wh.manager || currentAssignment?.employee || null;
  return {
    ...wh,
    manager,
  };
};

const sanitizeBranch = (branch) => {
  if (!branch) return branch;
  const currentAssignment =
    branch.managerAssignments?.find((a) => a.isCurrent) ||
    branch.managerAssignments?.[0] ||
    null;
  const manager = branch.manager || currentAssignment?.employee || null;

  return {
    ...branch,
    manager,
    managerAssignments: branch.managerAssignments || [],
    warehouses: (branch.warehouses || []).map(sanitizeWarehouse),
    region: branch.region
      ? {
          id: branch.region.id,
          name: branch.region.name,
          code: branch.region.code,
        }
      : null,
    createdBy: branch.createdBy
      ? {
          id: branch.createdBy.id,
          person: branch.createdBy.person,
        }
      : null,
    updatedBy: branch.updatedBy
      ? {
          id: branch.updatedBy.id,
          person: branch.updatedBy.person,
        }
      : null,
  };
};

const branchInclude = {
  region: {
    select: {
      id: true,
      name: true,
      code: true,
    },
  },
  company: {
    select: {
      id: true,
      name: true,
    },
  },
  warehouses: {
    where: { isArchived: false },
    include: {
      region: {
        select: { id: true, name: true, code: true },
      },
      manager: {
        include: {
          person: {
            select: { firstName: true, lastName: true, phone: true, email: true },
          },
        },
      },
      managerAssignments: {
        where: { isCurrent: true },
        include: {
          employee: {
            include: {
              person: {
                select: { firstName: true, lastName: true, phone: true, email: true },
              },
            },
          },
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
};

export async function createBranch(data, createdById, req) {
  const company = await prisma.company.findFirst({
    where: { id: data.companyId, isArchived: false },
  });

  if (!company) {
    throw new AppError('Company not found', 404);
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
      throw new AppError('Assigned branch manager employee not found or inactive', 404);
    }
  }

  const branch = await prisma.$transaction(async (tx) => {
    if (data.isHeadOffice) {
      await tx.branch.updateMany({
        where: { companyId: data.companyId, isHeadOffice: true },
        data: { isHeadOffice: false },
      });
    }

    const b = await tx.branch.create({
      data: {
        companyId: data.companyId,
        branchCode: data.branchCode,
        name: data.name,
        isHeadOffice: Boolean(data.isHeadOffice),
        phone: data.phone,
        email: data.email,
        regionId: data.regionId,
        city: data.city,
        subCity: data.subCity,
        woreda: data.woreda,
        kebele: data.kebele,
        houseNumber: data.houseNumber,
        landmark: data.landmark,
        status: data.status || 'ACTIVE',
        createdById,
        updatedById: createdById,
      },
      include: branchInclude,
    });

    if (data.managerId) {
      await tx.branchManager.create({
        data: {
          branchId: b.id,
          employeeId: data.managerId,
          isCurrent: true,
          assignedAt: new Date(),
          notes: 'Initial branch manager assignment during creation',
          createdById,
          updatedById: createdById,
        },
      });

      return tx.branch.findUnique({
        where: { id: b.id },
        include: branchInclude,
      });
    }

    return b;
  });

  await logAudit({
    createdById,
    action: 'BRANCH_CREATED',
    entityType: 'Branch',
    entityId: branch.id,
    newValues: { name: branch.name, companyId: branch.companyId },
    req,
  });

  return sanitizeBranch(branch);
}

export async function getBranches(filters) {
  const { page, limit, skip } = getPaginationParams(filters);
  const where = buildBranchWhere(filters);

  const [branches, total] = await Promise.all([
    prisma.branch.findMany({
      where,
      include: branchInclude,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.branch.count({ where }),
  ]);

  const meta = buildPaginationMeta({ page, limit, total });

  return {
    branches: branches.map(sanitizeBranch),
    meta,
  };
}

export async function getBranchById(id) {
  const branch = await prisma.branch.findFirst({
    where: { id, isArchived: false },
    include: branchInclude,
  });

  if (!branch) {
    throw new AppError('Branch not found', 404);
  }

  return sanitizeBranch(branch);
}

export async function updateBranch(id, data, createdById, req) {
  const existingBranch = await prisma.branch.findFirst({
    where: { id, isArchived: false },
    include: {
      company: true,
      region: true,
      managerAssignments: {
        where: { isCurrent: true },
      },
      createdBy: {
        include: {
          person: true,
        },
      },
    },
  });

  if (!existingBranch) {
    throw new AppError('Branch not found', 404);
  }

  if (data.companyId && data.companyId !== existingBranch.companyId) {
    const company = await prisma.company.findFirst({
      where: { id: data.companyId, isArchived: false },
    });
    if (!company) {
      throw new AppError('Company not found', 404);
    }
  }

  if (data.regionId && data.regionId !== existingBranch.regionId) {
    const region = await prisma.region.findFirst({
      where: { id: data.regionId, isActive: true },
    });
    if (!region) {
      throw new AppError('Region not found or inactive', 404);
    }
  }

  if (data.branchCode && data.branchCode !== existingBranch.branchCode) {
    const duplicate = await prisma.branch.findFirst({
      where: { branchCode: data.branchCode, id: { not: id } },
    });
    if (duplicate) {
      throw new AppError('Branch code already exists', 409);
    }
  }

  if (data.name && data.name !== existingBranch.name) {
    const duplicate = await prisma.branch.findFirst({
      where: {
        name: data.name,
        companyId: data.companyId || existingBranch.companyId,
        id: { not: id },
      },
    });
    if (duplicate) {
      throw new AppError('Branch with this name already exists in the company', 409);
    }
  }

  const targetCompanyId = data.companyId || existingBranch.companyId;

  if (data.managerId) {
    const employee = await prisma.employee.findFirst({
      where: { id: data.managerId, isArchived: false, status: 'ACTIVE' },
    });
    if (!employee) {
      throw new AppError('Employee not found or inactive', 404);
    }
  }

  const updatedBranch = await prisma.$transaction(async (tx) => {
    // If setting this branch as head office, automatically clear isHeadOffice on any other branch in the company
    if (data.isHeadOffice === true) {
      await tx.branch.updateMany({
        where: {
          companyId: targetCompanyId,
          isHeadOffice: true,
          id: { not: id },
        },
        data: { isHeadOffice: false },
      });
    }

    const b = await tx.branch.update({
      where: { id },
      data: {
        companyId: data.companyId,
        branchCode: data.branchCode,
        name: data.name,
        isHeadOffice: data.isHeadOffice !== undefined ? Boolean(data.isHeadOffice) : undefined,
        phone: data.phone,
        email: data.email,
        regionId: data.regionId,
        city: data.city,
        subCity: data.subCity,
        woreda: data.woreda,
        kebele: data.kebele,
        houseNumber: data.houseNumber,
        landmark: data.landmark,
        status: data.status,
        updatedById: createdById,
      },
      include: branchInclude,
    });

    if (data.managerId !== undefined) {
      const currentAssignment = existingBranch.managerAssignments?.[0];
      const currentManagerId = currentAssignment?.employeeId || null;

      if (data.managerId !== currentManagerId) {
        await tx.branchManager.updateMany({
          where: { branchId: id, isCurrent: true },
          data: {
            isCurrent: false,
            unassignedAt: new Date(),
            updatedById: createdById,
          },
        });

        if (data.managerId) {
          await tx.branchManager.create({
            data: {
              branchId: id,
              employeeId: data.managerId,
              isCurrent: true,
              assignedAt: new Date(),
              notes: 'Manager updated via branch settings',
              createdById,
              updatedById: createdById,
            },
          });
        }

        return tx.branch.findUnique({
          where: { id },
          include: branchInclude,
        });
      }
    }

    return b;
  });

  await logAudit({
    createdById,
    action: 'BRANCH_UPDATED',
    entityType: 'Branch',
    entityId: id,
    oldValues: { name: existingBranch.name, companyId: existingBranch.companyId },
    newValues: { name: updatedBranch.name, companyId: updatedBranch.companyId },
    req,
  });

  return sanitizeBranch(updatedBranch);
}

export async function deleteBranch(id, createdById, req) {
  const existingBranch = await prisma.branch.findFirst({
    where: { id, isArchived: false },
  });

  if (!existingBranch) {
    throw new AppError('Branch not found', 404);
  }

  await prisma.branch.update({
    where: { id },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      updatedById: createdById,
    },
  });

  await logAudit({
    createdById,
    action: 'BRANCH_DELETED',
    entityType: 'Branch',
    entityId: id,
    oldValues: { name: existingBranch.name },
    req,
  });

  return { message: 'Branch deleted successfully' };
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
      branchManagerAssignments: {
        where: { isCurrent: true, isArchived: false },
        include: {
          branch: {
            select: { id: true, name: true, branchCode: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return employees.map((emp) => {
    const fullName = emp.person
      ? [emp.person.firstName, emp.person.middleName, emp.person.lastName].filter(Boolean).join(' ')
      : emp.employeeCode;
    const primaryJob = emp.jobSpecifications?.[0]?.jobSpecification?.title || emp.department || 'Employee';
    const activeBranchAssignment = emp.branchManagerAssignments?.[0]?.branch;

    return {
      id: emp.id,
      employeeCode: emp.employeeCode,
      name: fullName,
      email: emp.person?.email || null,
      phone: emp.person?.phone || null,
      department: emp.department || null,
      primaryRole: primaryJob,
      branch: emp.branch ? `${emp.branch.name} (${emp.branch.branchCode || 'BR'})` : null,
      currentBranch: activeBranchAssignment ? `${activeBranchAssignment.name} (${activeBranchAssignment.branchCode || 'BR'})` : null,
    };
  });
}

export async function assignBranchManager(branchId, employeeId, notes, userId, req) {
  const branch = await prisma.branch.findFirst({
    where: { id: branchId, isArchived: false },
    include: {
      managerAssignments: { where: { isCurrent: true } },
    },
  });
  if (!branch) throw new AppError('Branch not found', 404);

  let employee = null;
  if (employeeId) {
    employee = await prisma.employee.findFirst({
      where: { id: employeeId, isArchived: false, status: 'ACTIVE' },
      include: { person: true },
    });
    if (!employee) throw new AppError('Employee not found or inactive', 404);
  }

  const currentManagerId = branch.managerAssignments?.[0]?.employeeId || null;

  const result = await prisma.$transaction(async (tx) => {
    await tx.branchManager.updateMany({
      where: { branchId, isCurrent: true },
      data: {
        isCurrent: false,
        unassignedAt: new Date(),
        updatedById: userId,
      },
    });

    if (employeeId) {
      await tx.branchManager.create({
        data: {
          branchId,
          employeeId,
          isCurrent: true,
          assignedAt: new Date(),
          notes: notes || 'Direct branch manager assignment',
          createdById: userId,
          updatedById: userId,
        },
      });
    }

    return tx.branch.findUnique({
      where: { id: branchId },
      include: branchInclude,
    });
  });

  await logAudit({
    createdById: userId,
    action: 'BRANCH_MANAGER_ASSIGNED',
    entityType: 'Branch',
    entityId: branchId,
    oldValues: { managerId: currentManagerId },
    newValues: { managerId: employeeId, notes },
    req,
  });

  return sanitizeBranch(result);
}

function buildBranchWhere(filters) {
  const where = { isArchived: false };

  if (filters.companyId) {
    where.companyId = filters.companyId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { branchCode: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return where;
}

