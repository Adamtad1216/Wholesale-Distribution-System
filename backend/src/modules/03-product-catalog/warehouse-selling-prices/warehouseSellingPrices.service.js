import prisma from "../../../config/prisma.js";
import { logAudit } from "../../../middleware/audit.middleware.js";
import { createNotification } from "../../14-notifications/notifications/notifications.service.js";
import { AppError } from "../../../utils/errors.js";
import { getPaginationParams, buildPaginationMeta } from "../../../utils/pagination.js";

const sanitizePrice = (price) => {
  if (!price) return price;
  return {
    ...price,
    updatedAt: price.updatedById ? price.updatedAt : null,
    createdBy: price.createdBy
      ? {
          id: price.createdBy.id,
          person: price.createdBy.person,
        }
      : null,
    updatedBy: price.updatedById && price.updatedBy
      ? {
          id: price.updatedBy.id,
          person: price.updatedBy.person,
        }
      : null,
  };
};

export async function createWarehouseSellingPrice(data, createdById, req) {
  // Validate product exists and is active
  const product = await prisma.product.findFirst({
    where: { id: data.productId, isArchived: false },
  });
  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // Validate warehouse exists and is active
  const warehouse = await prisma.warehouse.findFirst({
    where: { id: data.warehouseId, isArchived: false },
  });
  if (!warehouse) {
    throw new AppError('Warehouse not found', 404);
  }

  const existingPrice = await prisma.warehouseSellingPrice.findUnique({
    where: {
      productId_warehouseId: {
        productId: data.productId,
        warehouseId: data.warehouseId,
      },
    },
  });

  if (existingPrice && !existingPrice.isArchived) {
    throw new AppError(
      'Warehouse selling price already exists for this product in this warehouse. Use the update endpoint to modify the price.',
      409
    );
  }

  let price;
  if (existingPrice && existingPrice.isArchived) {
    // Restore previously archived price
    price = await prisma.warehouseSellingPrice.update({
      where: { id: existingPrice.id },
      data: {
        sellingPrice: data.sellingPrice,
        wholesalePrice: data.wholesalePrice,
        status: data.status || 'ACTIVE',
        isArchived: false,
        archivedAt: null,
        createdById,
        updatedById: null,
        updatedAt: new Date(),
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, code: true, name: true } },
      },
    });
  } else {
    price = await prisma.warehouseSellingPrice.create({
      data: {
        productId: data.productId,
        warehouseId: data.warehouseId,
        sellingPrice: data.sellingPrice,
        wholesalePrice: data.wholesalePrice,
        status: data.status || 'ACTIVE',
        createdById,
        updatedById: null,
        updatedAt: null,
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, code: true, name: true } },
      },
    });
  }

  await logAudit({
    createdById,
    action: 'WAREHOUSE_SELLING_PRICE_CREATED',
    entityType: 'WarehouseSellingPrice',
    entityId: price.id,
    newValues: {
      productId: price.productId,
      warehouseId: price.warehouseId,
      sellingPrice: price.sellingPrice,
      wholesalePrice: price.wholesalePrice,
      status: price.status,
    },
    req,
  });

  await createNotification({
    userId: createdById,
    title: 'Warehouse Selling Price Set',
    message: `Selling price for product "${product.name}" in warehouse "${warehouse.name}" set to ${data.sellingPrice}`,
    type: 'CATALOG_WAREHOUSE_SELLING_PRICE_CREATED',
    createdById,
  });

  return getWarehouseSellingPriceById(price.id);
}

export async function getWarehouseSellingPrices(filters) {
  const { page, limit, skip } = getPaginationParams(filters);
  const where = { isArchived: false };

  if (filters.productId) {
    where.productId = filters.productId;
  }
  if (filters.warehouseId) {
    where.warehouseId = filters.warehouseId;
  }
  if (filters.status) {
    where.status = filters.status;
  }

  const [prices, total] = await Promise.all([
    prisma.warehouseSellingPrice.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
            unit: { select: { id: true, name: true, abbreviation: true } },
          },
        },
        warehouse: {
          select: {
            id: true,
            code: true,
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
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.warehouseSellingPrice.count({ where }),
  ]);

  const meta = buildPaginationMeta({ page, limit, total });

  return {
    prices: prices.map(sanitizePrice),
    meta,
  };
}

export async function getWarehouseSellingPriceById(id) {
  const price = await prisma.warehouseSellingPrice.findFirst({
    where: { id, isArchived: false },
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          unit: { select: { id: true, name: true, abbreviation: true } },
        },
      },
      warehouse: {
        select: {
          id: true,
          code: true,
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

  if (!price) {
    throw new AppError('Warehouse selling price not found', 404);
  }

  return sanitizePrice(price);
}

export async function getWarehouseSellingPricesByProductId(productId, warehouseId = null) {
  const product = await prisma.product.findFirst({
    where: { id: productId, isArchived: false },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const where = { productId, isArchived: false };
  if (warehouseId) {
    where.warehouseId = warehouseId;
  }

  const prices = await prisma.warehouseSellingPrice.findMany({
    where,
    include: {
      product: {
        select: {
          id: true,
          name: true,
          sku: true,
          unit: { select: { id: true, name: true, abbreviation: true } },
        },
      },
      warehouse: {
        select: {
          id: true,
          code: true,
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
    orderBy: { createdAt: 'desc' },
  });

  if (warehouseId && prices.length === 0) {
    throw new AppError('Warehouse selling price not found for this warehouse', 404);
  }

  const sanitized = prices.map(sanitizePrice);
  return warehouseId ? sanitized[0] : sanitized;
}

export async function updateWarehouseSellingPriceByProductId(productId, data, createdById, req) {
  const product = await prisma.product.findFirst({
    where: { id: productId, isArchived: false },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  let targetWarehouseId = data.warehouseId;
  if (!targetWarehouseId) {
    // If no warehouseId provided, check if product has only 1 price
    const existingPrices = await prisma.warehouseSellingPrice.findMany({
      where: { productId, isArchived: false },
    });
    if (existingPrices.length === 1) {
      targetWarehouseId = existingPrices[0].warehouseId;
    } else if (existingPrices.length === 0) {
      throw new AppError('warehouseId is required to set a selling price for this product', 400);
    } else {
      throw new AppError('warehouseId is required when product has multiple warehouse selling prices', 400);
    }
  }

  const existingPrice = await prisma.warehouseSellingPrice.findUnique({
    where: {
      productId_warehouseId: {
        productId,
        warehouseId: targetWarehouseId,
      },
    },
  });

  let updatedPrice;
  if (existingPrice) {
    updatedPrice = await prisma.warehouseSellingPrice.update({
      where: { id: existingPrice.id },
      data: {
        ...(data.sellingPrice !== undefined ? { sellingPrice: data.sellingPrice } : {}),
        ...(data.wholesalePrice !== undefined ? { wholesalePrice: data.wholesalePrice } : {}),
        ...(data.status ? { status: data.status } : {}),
        isArchived: false,
        archivedAt: null,
        updatedById: createdById,
        updatedAt: new Date(),
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, code: true, name: true } },
        createdBy: { include: { person: { select: { id: true, firstName: true, lastName: true } } } },
        updatedBy: { include: { person: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });
  } else {
    // Upsert new price
    if (data.sellingPrice === undefined || data.wholesalePrice === undefined) {
      throw new AppError('sellingPrice and wholesalePrice are required when creating new warehouse price', 400);
    }
    updatedPrice = await prisma.warehouseSellingPrice.create({
      data: {
        productId,
        warehouseId: targetWarehouseId,
        sellingPrice: data.sellingPrice,
        wholesalePrice: data.wholesalePrice,
        status: data.status || 'ACTIVE',
        createdById,
        updatedById: null,
        updatedAt: null,
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
        warehouse: { select: { id: true, code: true, name: true } },
        createdBy: { include: { person: { select: { id: true, firstName: true, lastName: true } } } },
        updatedBy: { include: { person: { select: { id: true, firstName: true, lastName: true } } } },
      },
    });
  }

  await logAudit({
    createdById,
    action: 'WAREHOUSE_SELLING_PRICE_UPDATED',
    entityType: 'WarehouseSellingPrice',
    entityId: updatedPrice.id,
    newValues: {
      productId,
      warehouseId: targetWarehouseId,
      sellingPrice: updatedPrice.sellingPrice,
      wholesalePrice: updatedPrice.wholesalePrice,
      status: updatedPrice.status,
    },
    req,
  });

  await createNotification({
    userId: createdById,
    title: 'Warehouse Selling Price Updated',
    message: `Selling price for product "${product.name}" updated`,
    type: 'CATALOG_WAREHOUSE_SELLING_PRICE_UPDATED',
    createdById,
  });

  return sanitizePrice(updatedPrice);
}

export async function deleteWarehouseSellingPriceByProductId(productId, warehouseId = null, createdById, req) {
  const product = await prisma.product.findFirst({
    where: { id: productId, isArchived: false },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const where = { productId, isArchived: false };
  if (warehouseId) {
    where.warehouseId = warehouseId;
  }

  const existingCount = await prisma.warehouseSellingPrice.count({ where });
  if (existingCount === 0) {
    throw new AppError('Warehouse selling price not found', 404);
  }

  await prisma.warehouseSellingPrice.updateMany({
    where,
    data: {
      isArchived: true,
      archivedAt: new Date(),
      updatedById: createdById,
      updatedAt: new Date(),
    },
  });

  await logAudit({
    createdById,
    action: 'WAREHOUSE_SELLING_PRICE_DELETED',
    entityType: 'WarehouseSellingPrice',
    entityId: productId,
    oldValues: { productId, warehouseId },
    req,
  });

  await createNotification({
    userId: createdById,
    title: 'Warehouse Selling Price Removed',
    message: `Selling price for product "${product.name}" removed`,
    type: 'CATALOG_WAREHOUSE_SELLING_PRICE_DELETED',
    createdById,
  });

  return { message: 'Warehouse selling price deleted successfully' };
}
