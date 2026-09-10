import prisma from "../../../config/prisma.js";
import { logAudit } from "../../../middleware/audit.middleware.js";
import { createNotification } from "../../14-notifications/notifications/notifications.service.js";
import { AppError } from "../../../utils/errors.js";
import { getPaginationParams, buildPaginationMeta } from "../../../utils/pagination.js";
import { getUserScope } from "../../../utils/warehouse-scope.js";

export const generateProductCode = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PRD-${timestamp}-${random}`;
};

export const ensureUniqueSku = async (tx, sku) => {
  let uniqueSku = sku;
  let attempts = 0;
  while (attempts < 5) {
    const existing = await tx.product.findFirst({
      where: { sku: uniqueSku, isArchived: false },
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
    sellingPrice: Number(product.sellingPrice ?? 0),
    wholesalePrice: Number(product.wholesalePrice ?? 0),
    costPrice: Number(product.costPrice ?? 0),
    warehouseStocks: product.warehouseStocks
      ? product.warehouseStocks.map((s) => ({
        ...s,
        quantity: Number(s.quantity ?? 0),
        availableQuantity: Number(s.availableQuantity ?? 0),
        reservedQuantity: Number(s.reservedQuantity ?? 0),
        minimumStock: Number(s.minimumStock ?? 0),
        reorderLevel: Number(s.reorderLevel ?? 0),
      }))
      : undefined,
    warehouseSellingPrices: product.warehouseSellingPrices
      ? product.warehouseSellingPrices.map((sp) => ({
        ...sp,
        sellingPrice: Number(sp.sellingPrice ?? 0),
        wholesalePrice: Number(sp.wholesalePrice ?? 0),
      }))
      : undefined,
    updatedAt: product.updatedById ? product.updatedAt : null,
    createdBy: product.createdBy
      ? {
        id: product.createdBy.id,
        person: product.createdBy.person,
      }
      : null,
    updatedBy: product.updatedById && product.updatedBy
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

  // Only active products block creating with the same SKU
  const existingActiveSku = await prisma.product.findFirst({
    where: { sku, isArchived: false },
  });
  if (existingActiveSku) {
    throw new AppError('Product SKU already exists', 409);
  }

  // Validate category exists and is a leaf category (allows root category if it has no child subcategories)
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
    throw new AppError('This category has subcategories. Products must be assigned to one of its child subcategories.', 400);
  }

  // Validate unit exists
  const unit = await prisma.unit.findFirst({
    where: { id: data.unitId, isArchived: false },
  });
  if (!unit) {
    throw new AppError('Unit of measurement not found', 404);
  }

  // Validate brand if provided
  if (data.brandId) {
    const brand = await prisma.brand.findFirst({
      where: { id: data.brandId, isArchived: false },
    });
    if (!brand) {
      throw new AppError('Brand not found', 404);
    }
  }

  // Validate warehouses if provided in selling prices
  if (data.warehouseSellingPrices && data.warehouseSellingPrices.length > 0) {
    const warehouseIds = [...new Set(data.warehouseSellingPrices.map((sp) => sp.warehouseId))];
    const existingWarehouses = await prisma.warehouse.findMany({
      where: { id: { in: warehouseIds }, isArchived: false },
      select: { id: true },
    });
    const foundIds = new Set(existingWarehouses.map((w) => w.id));
    const missingId = warehouseIds.find((id) => !foundIds.has(id));
    if (missingId) {
      throw new AppError(`Warehouse with ID ${missingId} not found`, 404);
    }
  }

  // Allow creating if previous product with this SKU was archived: remove the old archived record to free the unique constraint
  await prisma.product.deleteMany({
    where: { sku, isArchived: true },
  });

  const product = await prisma.$transaction(async (tx) => {
    const newProduct = await tx.product.create({
      data: {
        sku,
        name: data.name,
        categoryId: data.categoryId,
        brandId: data.brandId || null,
        unitId: data.unitId,
        status: data.status || 'ACTIVE',
        sellingPrice: data.sellingPrice !== undefined ? data.sellingPrice : 0,
        wholesalePrice: data.wholesalePrice !== undefined ? data.wholesalePrice : 0,
        createdById,
        updatedById: null,
      },
    });

    if (data.images && data.images.length > 0) {
      const hasPrimary = data.images.some((img) => img.isPrimary);
      await tx.productImage.createMany({
        data: data.images.map((img, idx) => ({
          productId: newProduct.id,
          imageUrl: img.imageUrl,
          isPrimary: hasPrimary ? Boolean(img.isPrimary) : idx === 0,
          createdById,
          updatedById: null,
        })),
      });
    }

    if (Array.isArray(data.warehouseSellingPrices) && data.warehouseSellingPrices.length > 0) {
      for (const sp of data.warehouseSellingPrices) {
        // Clean up any previously archived price for this pair to avoid unique collision
        await tx.warehouseSellingPrice.deleteMany({
          where: {
            productId: newProduct.id,
            warehouseId: sp.warehouseId,
            isArchived: true,
          },
        });

        await tx.warehouseSellingPrice.upsert({
          where: {
            productId_warehouseId: {
              productId: newProduct.id,
              warehouseId: sp.warehouseId,
            },
          },
          create: {
            productId: newProduct.id,
            warehouseId: sp.warehouseId,
            sellingPrice: Number(sp.sellingPrice),
            wholesalePrice: Number(sp.wholesalePrice),
            status: sp.status || 'ACTIVE',
            createdById,
            updatedById: null,
          },
          update: {
            sellingPrice: Number(sp.sellingPrice),
            wholesalePrice: Number(sp.wholesalePrice),
            status: sp.status || 'ACTIVE',
            isArchived: false,
            archivedAt: null,
            updatedById: createdById,
            updatedAt: new Date(),
          },
        });
      }
    }

    return newProduct;
  });

  await logAudit({
    createdById,
    action: 'PRODUCT_CREATED',
    entityType: 'Product',
    entityId: product.id,
    newValues: {
      sku: product.sku,
      name: product.name,
      status: product.status,
      warehouseSellingPricesCount: data.warehouseSellingPrices?.length || 0,
    },
    req,
  });

  await createNotification({
    userId: createdById,
    title: 'Product Created',
    message: `Product "${product.name}" (${product.sku}) has been created successfully`,
    type: 'CATALOG_PRODUCT_CREATED',
    createdById,
  });

  return getProductById(product.id);
}

export async function getProducts(filters, user = null) {
  const { page, limit, skip } = getPaginationParams(filters);
  const where = await buildProductWhere(filters, user);
  const scope = user ? await getUserScope(user) : { isGlobal: true };

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
          where: { isArchived: false },
          select: {
            id: true,
            imageUrl: true,
            isPrimary: true,
          },
        },
        warehouseSellingPrices: {
          where: {
            isArchived: false,
            ...(!scope.isGlobal ? { warehouseId: { in: scope.warehouseIds || [] } } : {}),
          },
          include: {
            warehouse: {
              select: {
                id: true,
                code: true,
                name: true,
                branch: {
                  select: {
                    id: true,
                    name: true,
                    branchCode: true,
                  },
                },
              },
            },
          },
        },
        warehouseStocks: {
          where: {
            isArchived: false,
            ...(!scope.isGlobal ? { warehouseId: { in: scope.warehouseIds || [] } } : {}),
          },
          select: {
            id: true,
            warehouseId: true,
            quantity: true,
            availableQuantity: true,
            reservedQuantity: true,
            minimumStock: true,
            reorderLevel: true,
            warehouse: {
              select: {
                id: true,
                code: true,
                name: true,
                branch: {
                  select: {
                    id: true,
                    name: true,
                    branchCode: true,
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
    prisma.product.count({ where }),
  ]);

  const meta = buildPaginationMeta({ page, limit, total });

  return {
    products: products.map(sanitizeProduct),
    meta,
  };
}

export async function getProductById(id, user = null) {
  const scope = user ? await getUserScope(user) : { isGlobal: true };

  const product = await prisma.product.findFirst({
    where: { id, isArchived: false },
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
        where: { isArchived: false },
        select: {
          id: true,
          imageUrl: true,
          isPrimary: true,
        },
      },
      warehouseSellingPrices: {
        where: {
          isArchived: false,
          ...(!scope.isGlobal ? { warehouseId: { in: scope.warehouseIds || [] } } : {}),
        },
        include: {
          warehouse: {
            select: {
              id: true,
              code: true,
              name: true,
              branch: {
                select: {
                  id: true,
                  name: true,
                  branchCode: true,
                },
              },
            },
          },
        },
      },
      warehouseStocks: {
        where: {
          isArchived: false,
          ...(!scope.isGlobal ? { warehouseId: { in: scope.warehouseIds || [] } } : {}),
        },
        select: {
          id: true,
          warehouseId: true,
          quantity: true,
          availableQuantity: true,
          reservedQuantity: true,
          minimumStock: true,
          reorderLevel: true,
          warehouse: {
            select: {
              id: true,
              code: true,
              name: true,
              branch: {
                select: {
                  id: true,
                  name: true,
                  branchCode: true,
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

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  // If user is non-global, verify that this product has stock or selling price in their assigned warehouses
  if (!scope.isGlobal) {
    const isAssigned =
      (product.warehouseStocks && product.warehouseStocks.length > 0) ||
      (product.warehouseSellingPrices && product.warehouseSellingPrices.length > 0);
    if (!isAssigned) {
      throw new AppError('Product not found or not assigned to your warehouse', 404);
    }
  }

  return sanitizeProduct(product);
}

export async function getProductWarehousePrices(productId) {
  const product = await prisma.product.findFirst({
    where: { id: productId, isArchived: false },
  });

  if (!product) {
    throw new AppError('Product not found', 404);
  }

  const prices = await prisma.warehouseSellingPrice.findMany({
    where: { productId, isArchived: false },
    include: {
      warehouse: {
        select: {
          id: true,
          code: true,
          name: true,
          branch: {
            select: {
              id: true,
              name: true,
              branchCode: true,
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
  });

  return prices.map((price) => ({
    ...price,
    sellingPrice: Number(price.sellingPrice ?? 0),
    wholesalePrice: Number(price.wholesalePrice ?? 0),
    updatedAt: price.updatedById ? price.updatedAt : null,
    createdBy: price.createdBy
      ? { id: price.createdBy.id, person: price.createdBy.person }
      : null,
    updatedBy: price.updatedById && price.updatedBy
      ? { id: price.updatedBy.id, person: price.updatedBy.person }
      : null,
  }));
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
      where: { sku: data.sku, id: { not: id }, isArchived: false },
    });
    if (duplicateSku) {
      throw new AppError('Product SKU already exists', 409);
    }
  }

  // Validate category is a leaf category if being updated (allows root category if it has no child subcategories)
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
      throw new AppError('This category has subcategories. Products must be assigned to one of its child subcategories.', 400);
    }
  }

  if (data.unitId && data.unitId !== existingProduct.unitId) {
    const unit = await prisma.unit.findFirst({
      where: { id: data.unitId, isArchived: false },
    });
    if (!unit) {
      throw new AppError('Unit not found', 404);
    }
  }

  if (data.brandId && data.brandId !== existingProduct.brandId) {
    const brand = await prisma.brand.findFirst({
      where: { id: data.brandId, isArchived: false },
    });
    if (!brand) {
      throw new AppError('Brand not found', 404);
    }
  }

  // Validate warehouses if provided in selling prices
  if (data.warehouseSellingPrices && data.warehouseSellingPrices.length > 0) {
    const warehouseIds = [...new Set(data.warehouseSellingPrices.map((sp) => sp.warehouseId))];
    const existingWarehouses = await prisma.warehouse.findMany({
      where: { id: { in: warehouseIds }, isArchived: false },
      select: { id: true },
    });
    const foundIds = new Set(existingWarehouses.map((w) => w.id));
    const missingId = warehouseIds.find((id) => !foundIds.has(id));
    if (missingId) {
      throw new AppError(`Warehouse with ID ${missingId} not found`, 404);
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        sku: data.sku,
        name: data.name,
        categoryId: data.categoryId,
        brandId: data.brandId,
        unitId: data.unitId,
        status: data.status,
        sellingPrice: data.sellingPrice !== undefined ? data.sellingPrice : undefined,
        wholesalePrice: data.wholesalePrice !== undefined ? data.wholesalePrice : undefined,
        updatedById: createdById,
        updatedAt: new Date(),
      },
    });

    if (data.warehouseSellingPrices !== undefined) {
      const activeWhIds = (data.warehouseSellingPrices || []).map((sp) => sp.warehouseId);

      // Archive warehouse selling prices that are no longer assigned or were left without prices
      await tx.warehouseSellingPrice.updateMany({
        where: {
          productId: id,
          warehouseId: { notIn: activeWhIds },
          isArchived: false,
        },
        data: {
          isArchived: true,
          archivedAt: new Date(),
          updatedById: createdById,
        },
      });

      for (const sp of data.warehouseSellingPrices) {
        await tx.warehouseSellingPrice.upsert({
          where: {
            productId_warehouseId: {
              productId: id,
              warehouseId: sp.warehouseId,
            },
          },
          create: {
            productId: id,
            warehouseId: sp.warehouseId,
            sellingPrice: Number(sp.sellingPrice),
            wholesalePrice: Number(sp.wholesalePrice),
            status: sp.status || 'ACTIVE',
            createdById,
            updatedById: null,
          },
          update: {
            sellingPrice: Number(sp.sellingPrice),
            wholesalePrice: Number(sp.wholesalePrice),
            status: sp.status || 'ACTIVE',
            isArchived: false,
            archivedAt: null,
            updatedById: createdById,
            updatedAt: new Date(),
          },
        });
      }
    }

    if (data.images !== undefined) {
      await tx.productImage.deleteMany({
        where: { productId: id },
      });

      if (data.images && data.images.length > 0) {
        const hasPrimary = data.images.some((img) => img.isPrimary);
        await tx.productImage.createMany({
          data: data.images.map((img, idx) => ({
            productId: id,
            imageUrl: img.imageUrl,
            isPrimary: hasPrimary ? Boolean(img.isPrimary) : idx === 0,
            createdById,
            updatedById: createdById,
          })),
        });
      }
    }
  });

  const updatedProduct = await getProductById(id);

  await logAudit({
    createdById,
    action: 'PRODUCT_UPDATED',
    entityType: 'Product',
    entityId: id,
    oldValues: { name: existingProduct.name, sku: existingProduct.sku, status: existingProduct.status },
    newValues: { name: data.name, sku: data.sku, status: data.status },
    req,
  });

  await createNotification({
    userId: createdById,
    title: 'Product Updated',
    message: `Product "${data.name || existingProduct.name}" (${data.sku || existingProduct.sku}) has been updated successfully`,
    type: 'CATALOG_PRODUCT_UPDATED',
    createdById,
  });

  return updatedProduct;
}

export async function deleteProduct(id, createdById, req) {
  const existingProduct = await prisma.product.findFirst({
    where: { id, isArchived: false },
  });

  if (!existingProduct) {
    throw new AppError('Product not found', 404);
  }

  // Restrict deletion if product is linked to existing transactions or inventory stock
  const [
    stockCount,
    transferCount,
    reservationCount,
    adjustmentCount,
    poCount,
    grCount,
    soCount,
    salesReturnCount,
    deliveryCount,
    invoiceCount,
    prCount,
  ] = await Promise.all([
    prisma.warehouseStock.count({ where: { productId: id, isArchived: false, quantity: { gt: 0 } } }),
    prisma.warehouseStockTransfer.count({ where: { productId: id, isArchived: false, status: 'PENDING' } }),
    prisma.stockReservation.count({ where: { productId: id, isArchived: false, status: 'RESERVED' } }),
    prisma.stockAdjustmentItem.count({
      where: { productId: id, isArchived: false, adjustment: { isArchived: false, status: 'PENDING' } },
    }),
    prisma.purchaseOrderItem.count({
      where: {
        productId: id,
        isArchived: false,
        purchaseOrder: { isArchived: false, status: { notIn: ['CANCELLED', 'CLOSED', 'COMPLETED', 'RECEIVED'] } },
      },
    }),
    prisma.goodsReceiptItem.count({ where: { productId: id, isArchived: false } }),
    prisma.salesOrderItem.count({
      where: {
        productId: id,
        isArchived: false,
        salesOrder: { isArchived: false, status: { notIn: ['COMPLETED', 'CANCELLED', 'REJECTED'] } },
      },
    }),
    prisma.salesReturnItem.count({ where: { productId: id, isArchived: false } }),
    prisma.deliveryItem.count({ where: { productId: id, isArchived: false } }),
    prisma.invoiceItem.count({ where: { productId: id, isArchived: false } }),
    prisma.purchaseReturnItem.count({ where: { productId: id, isArchived: false } }),
  ]);

  const totalLinked =
    stockCount +
    transferCount +
    reservationCount +
    adjustmentCount +
    poCount +
    grCount +
    soCount +
    salesReturnCount +
    deliveryCount +
    invoiceCount +
    prCount;

  if (totalLinked > 0) {
    throw new AppError(
      `Cannot delete product "${existingProduct.name}" because it is linked to ${totalLinked} active transaction(s) or inventory records.`,
      400
    );
  }

  await prisma.$transaction(async (tx) => {
    await tx.product.update({
      where: { id },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        updatedById: createdById,
        updatedAt: new Date(),
      },
    });

    // Soft-delete associated warehouse selling prices
    await tx.warehouseSellingPrice.updateMany({
      where: { productId: id, isArchived: false },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        updatedById: createdById,
        updatedAt: new Date(),
      },
    });

    // Soft-delete any remaining non-archived warehouse stocks (e.g. zero-quantity records)
    await tx.warehouseStock.updateMany({
      where: { productId: id, isArchived: false },
      data: {
        isArchived: true,
        archivedAt: new Date(),
        updatedById: createdById,
        updatedAt: new Date(),
      },
    });
  });

  await logAudit({
    createdById,
    action: 'PRODUCT_DELETED',
    entityType: 'Product',
    entityId: id,
    oldValues: { sku: existingProduct.sku, name: existingProduct.name },
    req,
  });

  await createNotification({
    userId: createdById,
    title: 'Product Deleted',
    message: `Product "${existingProduct.name}" (${existingProduct.sku}) has been deleted successfully`,
    type: 'CATALOG_PRODUCT_DELETED',
    createdById,
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
      isPrimary: Boolean(data.isPrimary),
      createdById,
      updatedById: null,
    },
  });

  await logAudit({
    createdById,
    action: 'PRODUCT_IMAGE_ADDED',
    entityType: 'ProductImage',
    entityId: image.id,
    newValues: { productId, imageUrl: data.imageUrl, isPrimary: data.isPrimary },
    req,
  });

  await createNotification({
    userId: createdById,
    title: 'Product Image Added',
    message: `Image added to product "${product.name}" successfully`,
    type: 'CATALOG_PRODUCT_IMAGE_ADDED',
    createdById,
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

  await createNotification({
    userId: createdById,
    title: 'Product Image Removed',
    message: `Image removed from product successfully`,
    type: 'CATALOG_PRODUCT_IMAGE_REMOVED',
    createdById,
  });

  return { message: 'Image removed successfully' };
}

async function buildProductWhere(filters, user = null) {
  const where = { isArchived: filters.includeArchived ? undefined : false };

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.categoryId) {
    // If category has children, include this category and all its descendant categories
    const childCategories = await prisma.category.findMany({
      where: { parentId: filters.categoryId, isArchived: false },
      select: { id: true },
    });
    if (childCategories.length > 0) {
      const childIds = childCategories.map((c) => c.id);
      const grandChildren = await prisma.category.findMany({
        where: { parentId: { in: childIds }, isArchived: false },
        select: { id: true },
      });
      const allCategoryIds = [filters.categoryId, ...childIds, ...grandChildren.map((g) => g.id)];
      where.categoryId = { in: allCategoryIds };
    } else {
      where.categoryId = filters.categoryId;
    }
  }

  if (filters.brandId) {
    where.brandId = filters.brandId;
  }

  if (filters.unitId) {
    where.unitId = filters.unitId;
  }

  if (filters.productId) {
    where.id = filters.productId;
  }

  const andClauses = [];

  if (user) {
    const scope = await getUserScope(user);
    if (!scope.isGlobal) {
      const scopedWarehouseIds = scope.warehouseIds || [];
      if (scopedWarehouseIds.length === 0) {
        where.id = '00000000-0000-0000-0000-000000000000';
      } else {
        let effectiveWarehouseIds = scopedWarehouseIds;
        if (filters.warehouseId) {
          if (scopedWarehouseIds.includes(filters.warehouseId)) {
            effectiveWarehouseIds = [filters.warehouseId];
          } else {
            where.id = '00000000-0000-0000-0000-000000000000';
            effectiveWarehouseIds = [];
          }
        }

        if (effectiveWarehouseIds.length > 0) {
          andClauses.push({
            OR: [
              {
                warehouseStocks: {
                  some: {
                    warehouseId: { in: effectiveWarehouseIds },
                    isArchived: false,
                  },
                },
              },
              {
                warehouseSellingPrices: {
                  some: {
                    warehouseId: { in: effectiveWarehouseIds },
                    isArchived: false,
                  },
                },
              },
            ],
          });
        }
      }
    } else if (filters.warehouseId) {
      andClauses.push({
        OR: [
          {
            warehouseStocks: {
              some: {
                warehouseId: filters.warehouseId,
                isArchived: false,
              },
            },
          },
          {
            warehouseSellingPrices: {
              some: {
                warehouseId: filters.warehouseId,
                isArchived: false,
              },
            },
          },
        ],
      });
    }
  } else if (filters.warehouseId) {
    andClauses.push({
      OR: [
        {
          warehouseStocks: {
            some: {
              warehouseId: filters.warehouseId,
              isArchived: false,
            },
          },
        },
        {
          warehouseSellingPrices: {
            some: {
              warehouseId: filters.warehouseId,
              isArchived: false,
            },
          },
        },
      ],
    });
  }

  if (filters.search) {
    andClauses.push({
      OR: [
        { sku: { contains: filters.search, mode: 'insensitive' } },
        { name: { contains: filters.search, mode: 'insensitive' } },
      ],
    });
  }

  if (andClauses.length > 0) {
    where.AND = andClauses;
  }

  return where;
}
