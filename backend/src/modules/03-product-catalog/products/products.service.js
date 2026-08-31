import prisma from "../../../config/prisma.js";
import { logAudit } from "../../../middleware/audit.middleware.js";
import { AppError } from "../../../utils/errors.js";
import { getPaginationParams, buildPaginationMeta } from "../../../utils/pagination.js";

export const generateProductCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PRD-${timestamp}-${random}`;
};

export const ensureUniqueSku = async (tx, sku) => {
  let uniqueSku = sku;
  let attempts = 0;
  while (attempts < 5) {
    const existing = await tx.product.findUnique({
      where: { sku: uniqueSku },
    });
    if (!existing) return uniqueSku;
    uniqueSku = `${sku}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    attempts++;
  }
  return uniqueSku;
};

const sanitizeProduct = (product) => {
  if (!product) return product;
  return {
    ...product,
    purchasePrice: Number(product.purchasePrice),
    sellingPrice: Number(product.sellingPrice),
    wholesalePrice: Number(product.wholesalePrice),
    minimumStockLevel: Number(product.minimumStockLevel),
    reorderLevel: Number(product.reorderLevel),
    createdBy: product.createdBy
      ? {
          id: product.createdBy.id,
          person: product.createdBy.person,
        }
      : null,
    updatedBy: product.updatedBy
      ? {
          id: product.updatedBy.id,
          person: product.updatedBy.person,
        }
      : null,
  };
};

export async function createProduct(data, createdById, req) {
  const sku = data.sku
    ? await ensureUniqueSku(prisma, data.sku)
    : generateProductCode();

  const existingSku = await prisma.product.findUnique({
    where: { sku },
  });
  if (existingSku) {
    throw new AppError('Product SKU already exists', 409);
  }

  // Validate category exists and is a leaf category (no children)
  const category = await prisma.category.findFirst({
    where: { id: data.categoryId, isArchived: false },
  });
  if (!category) {
    throw new AppError('Category not found', 404);
  }
  const childCategories = await prisma.category.count({
    where: { parentId: data.categoryId, isArchived: false },
  });
  if (childCategories > 0) {
    throw new AppError('Category must be a leaf category (the last child with no sub-categories)', 400);
  }

  const product = await prisma.product.create({
    data: {
      sku,
      name: data.name,
      categoryId: data.categoryId,
      brandId: data.brandId,
      unitId: data.unitId,
      purchasePrice: data.purchasePrice,
      sellingPrice: data.sellingPrice,
      wholesalePrice: data.wholesalePrice,
      minimumStockLevel: data.minimumStockLevel,
      reorderLevel: data.reorderLevel,
      status: data.status || 'ACTIVE',
      createdById,
      updatedById: createdById,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      brand: {
        select: {
          id: true,
          name: true,
        },
      },
      unit: {
        select: {
          id: true,
          name: true,
          abbreviation: true,
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

  if (data.images && data.images.length > 0) {
    await prisma.productImage.createMany({
      data: data.images.map((img) => ({
        productId: product.id,
        imageUrl: img.imageUrl,
        isPrimary: img.isPrimary || false,
        createdById,
        updatedById: createdById,
      })),
    });
  }

  await logAudit({
    createdById,
    action: 'PRODUCT_CREATED',
    entityType: 'Product',
    entityId: product.id,
    newValues: { sku: product.sku, name: product.name },
    req,
  });

  return getProductById(product.id);
}

export async function getProducts(filters) {
  const { page, limit, skip } = getPaginationParams(filters);
  const where = buildProductWhere(filters);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        brand: {
          select: {
            id: true,
            name: true,
          },
        },
        unit: {
          select: {
            id: true,
            name: true,
            abbreviation: true,
          },
        },
        images: {
          select: {
            id: true,
            imageUrl: true,
            isPrimary: true,
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
    prisma.product.count({ where }),
  ]);

  const meta = buildPaginationMeta({ page, limit, total });

  return {
    products: products.map(sanitizeProduct),
    meta,
  };
}

export async function getProductById(id) {
  const product = await prisma.product.findFirst({
    where: { id },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      brand: {
        select: {
          id: true,
          name: true,
        },
      },
      unit: {
        select: {
          id: true,
          name: true,
          abbreviation: true,
        },
      },
      images: true,
      priceTiers: true,
      discountRules: true,
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

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  return sanitizeProduct(product);
}

export async function updateProduct(id, data, createdById, req) {
  const existingProduct = await prisma.product.findFirst({
    where: { id, isArchived: false },
    include: {
      category: true,
      brand: true,
      unit: true,
    },
  });

  if (!existingProduct) {
    throw new AppError('Product not found', 404);
  }

  if (data.sku && data.sku !== existingProduct.sku) {
    const duplicateSku = await prisma.product.findFirst({
      where: { sku: data.sku, id: { not: id } },
    });
    if (duplicateSku) {
      throw new AppError('Product SKU already exists', 409);
    }
  }

  // Validate category is a leaf category if being updated
  if (data.categoryId && data.categoryId !== existingProduct.categoryId) {
    const category = await prisma.category.findFirst({
      where: { id: data.categoryId, isArchived: false },
    });
    if (!category) {
      throw new AppError('Category not found', 404);
    }
    const childCategories = await prisma.category.count({
      where: { parentId: data.categoryId, isArchived: false },
    });
    if (childCategories > 0) {
      throw new AppError('Category must be a leaf category (the last child with no sub-categories)', 400);
    }
  }

  const updatedProduct = await prisma.product.update({
    where: { id },
    data: {
      sku: data.sku,
      name: data.name,
      categoryId: data.categoryId,
      brandId: data.brandId,
      unitId: data.unitId,
      purchasePrice: data.purchasePrice,
      sellingPrice: data.sellingPrice,
      wholesalePrice: data.wholesalePrice,
      minimumStockLevel: data.minimumStockLevel,
      reorderLevel: data.reorderLevel,
      status: data.status,
      updatedById: createdById,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      brand: {
        select: {
          id: true,
          name: true,
        },
      },
      unit: {
        select: {
          id: true,
          name: true,
          abbreviation: true,
        },
      },
      images: true,
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
    action: 'PRODUCT_UPDATED',
    entityType: 'Product',
    entityId: id,
    oldValues: { name: existingProduct.name, sku: existingProduct.sku },
    newValues: { name: data.name, sku: data.sku },
    req,
  });

  return sanitizeProduct(updatedProduct);
}

export async function deleteProduct(id, createdById, req) {
  const existingProduct = await prisma.product.findFirst({
    where: { id, isArchived: false },
  });

  if (!existingProduct) {
    throw new AppError('Product not found', 404);
  }

  await prisma.product.update({
    where: { id },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      updatedById: createdById,
    },
  });

  await logAudit({
    createdById,
    action: 'PRODUCT_DELETED',
    entityType: 'Product',
    entityId: id,
    oldValues: { sku: existingProduct.sku, name: existingProduct.name },
    req,
  });

  return { message: 'Product deleted successfully' };
}

export async function addProductImage(productId, data, createdById, req) {
  const product = await prisma.product.findFirst({
    where: { id: productId, isArchived: false },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  if (data.isPrimary) {
    await prisma.productImage.updateMany({
      where: { productId },
      data: { isPrimary: false },
    });
  }

  const image = await prisma.productImage.create({
    data: {
      productId,
      imageUrl: data.imageUrl,
      isPrimary: data.isPrimary || false,
      createdById,
      updatedById: createdById,
    },
  });

  await logAudit({
    createdById,
    action: 'PRODUCT_IMAGE_ADDED',
    entityType: 'ProductImage',
    entityId: image.id,
    newValues: { productId, imageUrl: data.imageUrl },
    req,
  });

  return image;
}

export async function removeProductImage(productId, imageId, createdById, req) {
  const image = await prisma.productImage.findFirst({
    where: { id: imageId, productId },
  });

  if (!image) {
    throw new AppError('Image not found', 404);
  }

  await prisma.productImage.delete({
    where: { id: imageId },
  });

  await logAudit({
    createdById,
    action: 'PRODUCT_IMAGE_REMOVED',
    entityType: 'ProductImage',
    entityId: imageId,
    oldValues: { productId, imageUrl: image.imageUrl },
    req,
  });

  return { message: 'Image removed successfully' };
}

export async function addPriceTier(productId, data, createdById, req) {
  const product = await prisma.product.findFirst({
    where: { id: productId, isArchived: false },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const tier = await prisma.priceTier.create({
    data: {
      productId,
      minQuantity: data.minQuantity,
      maxQuantity: data.maxQuantity,
      unitPrice: data.unitPrice,
      createdById,
      updatedById: createdById,
    },
  });

  await logAudit({
    createdById,
    action: 'PRICE_TIER_CREATED',
    entityType: 'PriceTier',
    entityId: tier.id,
    newValues: { productId, name: data.name, minQuantity: data.minQuantity, price: data.price },
    req,
  });

  return tier;
}

export async function updatePriceTier(productId, tierId, data, createdById, req) {
  const tier = await prisma.priceTier.findFirst({
    where: { id: tierId, productId },
  });

  if (!tier) {
    throw new AppError('Price tier not found', 404);
  }

  const updatedTier = await prisma.priceTier.update({
    where: { id: tierId },
    data: {
      minQuantity: data.minQuantity,
      maxQuantity: data.maxQuantity,
      unitPrice: data.unitPrice,
      updatedById: createdById,
    },
  });

  await logAudit({
    createdById,
    action: 'PRICE_TIER_UPDATED',
    entityType: 'PriceTier',
    entityId: tierId,
    oldValues: { name: tier.name, price: tier.price },
    newValues: { name: data.name, price: data.price },
    req,
  });

  return updatedTier;
}

export async function removePriceTier(productId, tierId, createdById, req) {
  const tier = await prisma.priceTier.findFirst({
    where: { id: tierId, productId },
  });

  if (!tier) {
    throw new AppError('Price tier not found', 404);
  }

  await prisma.priceTier.delete({
    where: { id: tierId },
  });

  await logAudit({
    createdById,
    action: 'PRICE_TIER_REMOVED',
    entityType: 'PriceTier',
    entityId: tierId,
    oldValues: { productId, name: tier.name, price: tier.price },
    req,
  });

  return { message: 'Price tier removed successfully' };
}

export async function addDiscountRule(productId, data, createdById, req) {
  const product = await prisma.product.findFirst({
    where: { id: productId, isArchived: false },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const rule = await prisma.discountRule.create({
    data: {
      product: { connect: { id: productId } },
      name: data.name,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minQuantity: data.minQuantity,
      maxQuantity: data.maxQuantity,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      status: data.status || 'ACTIVE',
      createdBy: { connect: { id: createdById } },
      updatedBy: { connect: { id: createdById } },
    },
  });

  await logAudit({
    createdById,
    action: 'DISCOUNT_RULE_CREATED',
    entityType: 'DiscountRule',
    entityId: rule.id,
    newValues: { productId, name: data.name, discountType: data.discountType, discountValue: data.discountValue },
    req,
  });

  return rule;
}

export async function updateDiscountRule(productId, ruleId, data, createdById, req) {
  const rule = await prisma.discountRule.findFirst({
    where: { id: ruleId, productId },
  });

  if (!rule) {
    throw new AppError('Discount rule not found', 404);
  }

  const updatedRule = await prisma.discountRule.update({
    where: { id: ruleId },
    data: {
      name: data.name,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minQuantity: data.minQuantity,
      maxQuantity: data.maxQuantity,
      startsAt: data.startsAt ? new Date(data.startsAt) : null,
      endsAt: data.endsAt ? new Date(data.endsAt) : null,
      status: data.status,
      updatedBy: { connect: { id: createdById } },
    },
  });

  await logAudit({
    createdById,
    action: 'DISCOUNT_RULE_UPDATED',
    entityType: 'DiscountRule',
    entityId: ruleId,
    oldValues: { name: rule.name, discountValue: rule.discountValue },
    newValues: { name: data.name, discountValue: data.discountValue },
    req,
  });

  return updatedRule;
}

export async function removeDiscountRule(productId, ruleId, createdById, req) {
  const rule = await prisma.discountRule.findFirst({
    where: { id: ruleId, productId },
  });

  if (!rule) {
    throw new AppError('Discount rule not found', 404);
  }

  await prisma.discountRule.update({
    where: { id: ruleId },
    data: {
      isArchived: true,
      archivedAt: new Date(),
      updatedBy: { connect: { id: createdById } },
    },
  });

  await logAudit({
    createdById,
    action: 'DISCOUNT_RULE_REMOVED',
    entityType: 'DiscountRule',
    entityId: ruleId,
    oldValues: { productId, name: rule.name },
    req,
  });

  return { message: 'Discount rule removed successfully' };
}

function buildProductWhere(filters) {
  const where = { isArchived: false };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.brandId) {
    where.brandId = filters.brandId;
  }

  if (filters.unitId) {
    where.unitId = filters.unitId;
  }

  if (filters.search) {
    where.OR = [
      { sku: { contains: filters.search, mode: 'insensitive' } },
      { name: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  return where;
}
