import prisma from "../../../config/prisma.js";
import { logAudit } from "../../../middleware/audit.middleware.js";
import { AppError } from "../../../utils/errors.js";
import { getPaginationParams, buildPaginationMeta } from "../../../utils/pagination.js";

const sanitizeRegion = (region) => {
  if (!region) return region;
  return {
    ...region,
    createdBy: region.createdBy
      ? {
          id: region.createdBy.id,
          person: region.createdBy.person,
        }
      : null,
    updatedBy: region.updatedBy
      ? {
          id: region.updatedBy.id,
          person: region.updatedBy.person,
        }
      : null,
  };
};

export async function createRegion(data, createdById, req) {
  const region = await prisma.region.create({
    data: {
      name: data.name,
      code: data.code,
      description: data.description,
      isActive: data.isActive ?? true,
      createdById,
      updatedById: createdById,
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
    action: 'REGION_CREATED',
    entityType: 'Region',
    entityId: region.id,
    newValues: { name: region.name, code: region.code },
    req,
  });

  return sanitizeRegion(region);
}

export async function getRegions(filters) {
  const { page, limit, skip } = getPaginationParams(filters);
  const where = buildRegionWhere(filters);

  const [regions, total] = await Promise.all([
    prisma.region.findMany({
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
      orderBy: { name: 'asc' },
      skip,
      take: limit,
    }),
    prisma.region.count({ where }),
  ]);

  const meta = buildPaginationMeta({ page, limit, total });

  return {
    regions: regions.map(sanitizeRegion),
    meta,
  };
}

export async function getRegionById(id) {
  const region = await prisma.region.findFirst({
    where: { id },
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

  if (!region) {
    throw new AppError('Region not found', 404);
  }

  return sanitizeRegion(region);
}

export async function updateRegion(id, data, createdById, req) {
  const existingRegion = await prisma.region.findFirst({
    where: { id },
  });

  if (!existingRegion) {
    throw new AppError('Region not found', 404);
  }

  if (data.code && data.code !== existingRegion.code) {
    const duplicate = await prisma.region.findFirst({
      where: { code: data.code, id: { not: id } },
    });
    if (duplicate) {
      throw new AppError('Region code already exists', 409);
    }
  }

  const updatedRegion = await prisma.region.update({
    where: { id },
    data: {
      name: data.name,
      code: data.code,
      description: data.description,
      isActive: data.isActive,
      updatedById: createdById,
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
    action: 'REGION_UPDATED',
    entityType: 'Region',
    entityId: id,
    oldValues: { name: existingRegion.name, code: existingRegion.code },
    newValues: { name: updatedRegion.name, code: updatedRegion.code },
    req,
  });

  return sanitizeRegion(updatedRegion);
}

export async function deleteRegion(id, createdById, req) {
  const existingRegion = await prisma.region.findFirst({
    where: { id },
  });

  if (!existingRegion) {
    throw new AppError('Region not found', 404);
  }

  await prisma.region.update({
    where: { id },
    data: {
      isActive: false,
      updatedById: createdById,
    },
  });

  await logAudit({
    createdById,
    action: 'REGION_DELETED',
    entityType: 'Region',
    entityId: id,
    oldValues: { name: existingRegion.name, code: existingRegion.code },
    req,
  });

  return { message: 'Region deleted successfully' };
}

function buildRegionWhere(filters) {
  const where = {};

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive === 'true';
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { code: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return where;
}

