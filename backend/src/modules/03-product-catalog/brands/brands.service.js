import prisma from "../../../config/prisma.js";
import { logAudit } from "../../../middleware/audit.middleware.js";
import { AppError } from "../../../utils/errors.js";
import { getPaginationParams, buildPaginationMeta } from "../../../utils/pagination.js";

const sanitizeBrand = (brand) => {
  if (!brand) return brand;
  return {
    ...brand,
    createdBy: brand.createdBy
      ? {
          id: brand.createdBy.id,
          person: brand.createdBy.person,
        }
      : null,
    updatedBy: brand.updatedBy
      ? {
          id: brand.updatedBy.id,
          person: brand.updatedBy.person,
        }
      : null,
  };
};

export async function createBrand(data, createdById, req) {
  const existingName = await prisma.brand.findFirst({
    where: { name: data.name },
  });
  if (existingName) {
    throw new AppError('Brand name already exists', 409);
  }

  const brand = await prisma.brand.create({
    data: {
      name: data.name,
      description: data.description,
      status: data.status || 'ACTIVE',
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
    action: 'BRAND_CREATED',
    entityType: 'Brand',
    entityId: brand.id,
    newValues: { name: brand.name },
    req,
  });

  return sanitizeBrand(brand);
}

export async function getBrands(filters) {
  const { page, limit, skip } = getPaginationParams(filters);
  const where = buildBrandWhere(filters);

  const [brands, total] = await Promise.all([
    prisma.brand.findMany({
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
    prisma.brand.count({ where }),
  ]);

  const meta = buildPaginationMeta({ page, limit, total });

  return {
    brands: brands.map(sanitizeBrand),
    meta,
  };
}

export async function getBrandById(id) {
  const brand = await prisma.brand.findFirst({
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

  if (!brand) {
    throw new AppError('Brand not found', 404);
  }

  return sanitizeBrand(brand);
}

export async function updateBrand(id, data, createdById, req) {
  const existingBrand = await prisma.brand.findFirst({
    where: { id, isArchived: false },
  });

  if (!existingBrand) {
    throw new AppError('Brand not found', 404);
  }

  if (data.name && data.name !== existingBrand.name) {
    const duplicateName = await prisma.brand.findFirst({
      where: { name: data.name, id: { not: id } },
    });
    if (duplicateName) {
      throw new AppError('Brand name already exists', 409);
    }
  }

  const updatedBrand = await prisma.brand.update({
    where: { id },
    data: {
      name: data.name,
      description: data.description,
      status: data.status,
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
    action: 'BRAND_UPDATED',
    entityType: 'Brand',
    entityId: id,
    oldValues: { name: existingBrand.name },
    newValues: { name: data.name },
    req,
  });

  return sanitizeBrand(updatedBrand);
}

export async function deleteBrand(id, createdById, req) {
  const existingBrand = await prisma.brand.findFirst({
    where: { id, isArchived: false },
  });

  if (!existingBrand) {
    throw new AppError('Brand not found', 404);
  }

  const productCount = await prisma.product.count({
    where: { brandId: id, isArchived: false },
  });

  if (productCount > 0) {
    throw new AppError('Cannot delete brand with associated products', 400);
  }

  await prisma.brand.update({
    where: { id },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      updatedById: createdById,
    },
  });

  await logAudit({
    createdById,
    action: 'BRAND_DELETED',
    entityType: 'Brand',
    entityId: id,
    oldValues: { name: existingBrand.name },
    req,
  });

  return { message: 'Brand deleted successfully' };
}

function buildBrandWhere(filters) {
  const where = { isArchived: false };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return where;
}
