import prisma from "../../../config/prisma.js";
import { logAudit } from "../../../middleware/audit.middleware.js";
import { AppError } from "../../../utils/errors.js";
import { getPaginationParams, buildPaginationMeta } from "../../../utils/pagination.js";

const sanitizeUnit = (unit) => {
  if (!unit) return unit;
  return {
    ...unit,
    updatedAt: unit.updatedById ? unit.updatedAt : null,
    createdBy: unit.createdBy
      ? {
          id: unit.createdBy.id,
          person: unit.createdBy.person,
        }
      : null,
    updatedBy: unit.updatedById && unit.updatedBy
      ? {
          id: unit.updatedBy.id,
          person: unit.updatedBy.person,
        }
      : null,
  };
};

export async function createUnit(data, createdById, req) {
  const existingAbbreviation = await prisma.unit.findFirst({
    where: { abbreviation: data.abbreviation, isArchived: false },
  });
  if (existingAbbreviation) {
    throw new AppError('Unit abbreviation already exists', 409);
  }

  // Clean up any previously archived unit with this abbreviation
  await prisma.unit.deleteMany({
    where: { abbreviation: data.abbreviation, isArchived: true },
  });

  const unit = await prisma.unit.create({
    data: {
      name: data.name,
      abbreviation: data.abbreviation,
      createdById,
      updatedById: null,
      updatedAt: null,
    },
    include: {
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
    action: 'UNIT_CREATED',
    entityType: 'Unit',
    entityId: unit.id,
    newValues: { name: unit.name, abbreviation: unit.abbreviation },
    req,
  });

  return sanitizeUnit(unit);
}

export async function getUnits(filters) {
  const { page, limit, skip } = getPaginationParams(filters);
  const where = buildUnitWhere(filters);

  const [units, total] = await Promise.all([
    prisma.unit.findMany({
      where,
      include: {
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
    prisma.unit.count({ where }),
  ]);

  const meta = buildPaginationMeta({ page, limit, total });

  return {
    units: units.map(sanitizeUnit),
    meta,
  };
}

export async function getUnitById(id) {
  const unit = await prisma.unit.findFirst({
    where: { id, isArchived: false },
    include: {
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

  if (!unit) {
    throw new AppError('Unit not found', 404);
  }

  return sanitizeUnit(unit);
}

export async function updateUnit(id, data, createdById, req) {
  const existingUnit = await prisma.unit.findFirst({
    where: { id, isArchived: false },
  });

  if (!existingUnit) {
    throw new AppError('Unit not found', 404);
  }

  if (data.name && data.name !== existingUnit.name) {
    const duplicateName = await prisma.unit.findFirst({
      where: { name: data.name, id: { not: id }, isArchived: false },
    });
    if (duplicateName) {
      throw new AppError('Unit name already exists', 409);
    }
  }

  if (data.abbreviation && data.abbreviation !== existingUnit.abbreviation) {
    const duplicateAbbreviation = await prisma.unit.findFirst({
      where: { abbreviation: data.abbreviation, id: { not: id }, isArchived: false },
    });
    if (duplicateAbbreviation) {
      throw new AppError('Unit abbreviation already exists', 409);
    }
  }

  const updatedUnit = await prisma.unit.update({
    where: { id },
    data: {
      name: data.name,
      abbreviation: data.abbreviation,
      updatedById: createdById,
      updatedAt: new Date(),
    },
    include: {
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
    action: 'UNIT_UPDATED',
    entityType: 'Unit',
    entityId: id,
    oldValues: { name: existingUnit.name },
    newValues: { name: data.name },
    req,
  });

  return sanitizeUnit(updatedUnit);
}

export async function deleteUnit(id, createdById, req) {
  const existingUnit = await prisma.unit.findFirst({
    where: { id, isArchived: false },
  });

  if (!existingUnit) {
    throw new AppError('Unit not found', 404);
  }

  const productCount = await prisma.product.count({
    where: { unitId: id, isArchived: false },
  });

  if (productCount > 0) {
    throw new AppError('Cannot delete unit with associated products', 400);
  }

  await prisma.unit.update({
    where: { id },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      updatedById: createdById,
      updatedAt: new Date(),
    },
  });

  await logAudit({
    createdById,
    action: 'UNIT_DELETED',
    entityType: 'Unit',
    entityId: id,
    oldValues: { name: existingUnit.name, abbreviation: existingUnit.abbreviation },
    req,
  });

  return { message: 'Unit deleted successfully' };
}

function buildUnitWhere(filters) {
  const where = { isArchived: false };

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { abbreviation: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return where;
}
