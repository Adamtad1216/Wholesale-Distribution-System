import prisma from "../../../config/prisma.js";
import { logAudit } from "../../../middleware/audit.middleware.js";
import { AppError } from "../../../utils/errors.js";
import { getPaginationParams, buildPaginationMeta } from "../../../utils/pagination.js";

const sanitizeBranch = (branch) => {
  if (!branch) return branch;
  return {
    ...branch,
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

  const branch = await prisma.branch.create({
    data: {
      companyId: data.companyId,
      branchCode: data.branchCode,
      name: data.name,
      isHeadOffice: data.isHeadOffice || false,
      managerId: data.managerId,
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
    include: {
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
      include: {
        company: {
          select: {
            id: true,
            name: true,
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
    include: {
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
      warehouses: true,
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

  const updatedBranch = await prisma.branch.update({
    where: { id },
    data: {
      companyId: data.companyId,
      branchCode: data.branchCode,
      name: data.name,
      isHeadOffice: data.isHeadOffice,
      managerId: data.managerId,
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
    include: {
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

