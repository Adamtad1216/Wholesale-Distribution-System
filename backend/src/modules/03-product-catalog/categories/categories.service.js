import prisma from "../../../config/prisma.js";
import { logAudit } from "../../../middleware/audit.middleware.js";
import { AppError } from "../../../utils/errors.js";
import { getPaginationParams, buildPaginationMeta } from "../../../utils/pagination.js";

const sanitizeCategory = (category) => {
  if (!category) return category;
  return {
    ...category,
    createdBy: category.createdBy
      ? {
          id: category.createdBy.id,
          person: category.createdBy.person,
        }
      : null,
    updatedBy: category.updatedBy
      ? {
          id: category.updatedBy.id,
          person: category.updatedBy.person,
        }
      : null,
  };
};

export async function createCategory(data, createdById, req) {
  const existingCategory = await prisma.category.findFirst({
    where: {
      name: data.name,
      parentId: data.parentId ?? null,
      isArchived: false,
    },
  });

  if (existingCategory) {
    throw new AppError('Category name already exists under this parent', 409);
  }

  if (data.parentId) {
    const parent = await prisma.category.findFirst({
      where: { id: data.parentId, isArchived: false },
    });
    if (!parent) {
      throw new AppError('Parent category not found', 404);
    }
  }

  const category = await prisma.category.create({
    data: {
      name: data.name,
      description: data.description,
      parentId: data.parentId,
      status: 'ACTIVE',
      createdById,
    },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
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
    action: 'CATEGORY_CREATED',
    entityType: 'Category',
    entityId: category.id,
    newValues: { name: category.name },
    req,
  });

  return sanitizeCategory(category);
}

export async function getCategories(filters) {
  const { page, limit, skip } = getPaginationParams(filters);
  const where = buildCategoryWhere(filters);

  const [categories, total] = await Promise.all([
    prisma.category.findMany({
      where,
      include: {
      parent: {
        select: {
          id: true,
          name: true,
        },
      },
      children: {
        select: {
          id: true,
          name: true,
          status: true,
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
    prisma.category.count({ where }),
  ]);

  const meta = buildPaginationMeta({ page, limit, total });

  return {
    categories: categories.map(sanitizeCategory),
    meta,
  };
}

export async function getCategoryById(id) {
  const category = await prisma.category.findFirst({
    where: { id, isArchived: false },
    include: {
      parent: {
        select: {
          id: true,
          name: true,
        },
      },
      children: {
        select: {
          id: true,
          name: true,
          status: true,
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

  if (!category) {
    throw new AppError('Category not found', 404);
  }

  return sanitizeCategory(category);
}

export async function updateCategory(id, data, createdById, req) {
  const existingCategory = await prisma.category.findFirst({
    where: { id, isArchived: false },
    include: {
      parent: true,
    },
  });

  if (!existingCategory) {
    throw new AppError('Category not found', 404);
  }

  if (data.parentId === id) {
    throw new AppError('Category cannot be its own parent', 400);
  }

  const duplicateCategory = await prisma.category.findFirst({
    where: {
      name: data.name,
      parentId: data.parentId ?? null,
      id: { not: id },
      isArchived: false,
    },
  });

  if (duplicateCategory) {
    throw new AppError('Category name already exists under this parent', 409);
  }

  const updateData = {};

  if (data.name !== undefined && data.name !== existingCategory.name) {
    updateData.name = data.name;
  }
  if (data.description !== undefined && data.description !== existingCategory.description) {
    updateData.description = data.description;
  }
  if (data.parentId !== undefined && data.parentId !== existingCategory.parentId) {
    updateData.parentId = data.parentId;
  }
  if (data.status !== undefined && data.status !== existingCategory.status) {
    updateData.status = data.status;
  }

  if (Object.keys(updateData).length === 0) {
    return getCategoryById(id);
  }

  updateData.updatedById = createdById;
  updateData.updatedAt = new Date();

  const updatedCategory = await prisma.category.update({
    where: { id },
    data: updateData,
    include: {
      parent: {
        select: {
          id: true,
          name: true,
        },
      },
      children: {
        select: {
          id: true,
          name: true,
          status: true,
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
    action: 'CATEGORY_UPDATED',
    entityType: 'Category',
    entityId: id,
    oldValues: { name: existingCategory.name },
    newValues: { name: data.name },
    req,
  });

  return sanitizeCategory(updatedCategory);
}

export async function deleteCategory(id, createdById, req) {
  const existingCategory = await prisma.category.findFirst({
    where: { id, isArchived: false },
    include: {
      children: true,
    },
  });

  if (!existingCategory) {
    throw new AppError('Category not found', 404);
  }

  if (existingCategory.children.length > 0) {
    throw new AppError('Cannot delete category with subcategories', 400);
  }

  const productCount = await prisma.product.count({
    where: { categoryId: id, isArchived: false },
  });

  if (productCount > 0) {
    throw new AppError('Cannot delete category with associated products', 400);
  }

  await prisma.category.update({
    where: { id },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      status: 'Inactive',
      updatedById: createdById,
    },
  });

  await logAudit({
    createdById,
    action: 'CATEGORY_DELETED',
    entityType: 'Category',
    entityId: id,
    oldValues: { name: existingCategory.name },
    req,
  });

  return { message: 'Category deleted successfully' };
}

function buildCategoryWhere(filters) {
  const where = { isArchived: false };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.parentId) {
    where.parentId = filters.parentId;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return where;
}
