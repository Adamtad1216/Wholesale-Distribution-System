import prisma from "../../../config/prisma.js";
import { AppError } from "../../../utils/errors.js";
import { logAudit } from "../../../middleware/audit.middleware.js";

function serialize(pp) {
  return {
    id: pp.id,
    productId: pp.productId,
    priceTierId: pp.priceTierId,
    warehouseId: pp.warehouseId,
    unitPrice: Number(pp.unitPrice),
    status: pp.status,
    startsAt: pp.startsAt,
    endsAt: pp.endsAt,
    product: pp.product
      ? { id: pp.product.id, sku: pp.product.sku, name: pp.product.name }
      : undefined,
    priceTier: pp.priceTier
      ? { id: pp.priceTier.id, name: pp.priceTier.name }
      : undefined,
    warehouse: pp.warehouse
      ? { id: pp.warehouse.id, code: pp.warehouse.code, name: pp.warehouse.name }
      : undefined,
    createdAt: pp.createdAt,
    updatedAt: pp.updatedAt,
  };
}

async function validateRefs(productId, priceTierId, warehouseId) {
  const checks = [
    prisma.product.findFirst({ where: { id: productId, isArchived: false } }),
    prisma.priceTier.findFirst({ where: { id: priceTierId, isArchived: false } }),
  ];
  if (warehouseId) {
    checks.push(prisma.warehouse.findFirst({ where: { id: warehouseId, isArchived: false } }));
  }
  const [p, t, w] = await Promise.all(checks);
  if (!p) throw new AppError("Product not found", 404);
  if (!t) throw new AppError("Price Tier not found", 404);
  if (warehouseId && !w) throw new AppError("Warehouse not found", 404);
}

export async function listProductPrices({ page, limit, productId, priceTierId, warehouseId, status }) {
  const where = {};
  if (productId) where.productId = productId;
  if (priceTierId) where.priceTierId = priceTierId;
  if (warehouseId === "null" || warehouseId === "GLOBAL") {
    where.warehouseId = null;
  } else if (warehouseId) {
    where.warehouseId = warehouseId;
  }
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.productPrice.findMany({
      where,
      include: {
        product: { select: { id: true, sku: true, name: true } },
        priceTier: { select: { id: true, name: true } },
        warehouse: { select: { id: true, code: true, name: true } },
      },
      orderBy: [{ productId: "asc" }, { warehouseId: "asc" }, { priceTierId: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.productPrice.count({ where }),
  ]);

  return {
    data: items.map(serialize),
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
      hasPreviousPage: page > 1,
    },
  };
}

export async function getProductPrice(id) {
  const pp = await prisma.productPrice.findUnique({
    where: { id },
    include: {
      product: { select: { id: true, sku: true, name: true } },
      priceTier: { select: { id: true, name: true } },
      warehouse: { select: { id: true, code: true, name: true } },
    },
  });
  if (!pp) throw new AppError("Product Price not found", 404);
  return serialize(pp);
}

export async function createProductPrice(data, user) {
  const warehouseId = data.warehouseId ?? null;
  await validateRefs(data.productId, data.priceTierId, warehouseId);

  if (data.status === "ACTIVE") {
    const existing = await prisma.productPrice.findFirst({
      where: {
        productId: data.productId,
        priceTierId: data.priceTierId,
        warehouseId,
        status: "ACTIVE",
      },
    });
    if (existing) {
      throw new AppError(
        warehouseId
          ? "An active price already exists for this Product + Price Tier + Warehouse combination."
          : "An active global price already exists for this Product + Price Tier.",
        409,
      );
    }
  }

  const pp = await prisma.productPrice.create({
    data: {
      productId: data.productId,
      priceTierId: data.priceTierId,
      warehouseId,
      unitPrice: data.unitPrice,
      status: data.status ?? "ACTIVE",
      startsAt: data.startsAt ?? null,
      endsAt: data.endsAt ?? null,
      createdById: user.id,
      updatedById: user.id,
    },
    include: {
      product: { select: { id: true, sku: true, name: true } },
      priceTier: { select: { id: true, name: true } },
      warehouse: { select: { id: true, code: true, name: true } },
    },
  });

  await logAudit({
    createdById: user.id,
    action: "PRODUCT_PRICE_CREATED",
    entityType: "ProductPrice",
    entityId: pp.id,
    newValues: {
      productId: pp.productId,
      priceTierId: pp.priceTierId,
      warehouseId: pp.warehouseId,
      unitPrice: Number(pp.unitPrice),
    },
  });

  return serialize(pp);
}

export async function updateProductPrice(id, data, user) {
  const existing = await prisma.productPrice.findUnique({ where: { id } });
  if (!existing) throw new AppError("Product Price not found", 404);

  const targetWarehouseId =
    data.warehouseId !== undefined ? (data.warehouseId ?? null) : existing.warehouseId;

  if (data.warehouseId !== undefined && data.warehouseId !== existing.warehouseId) {
    await validateRefs(existing.productId, existing.priceTierId, targetWarehouseId);
  }

  if (data.status === "ACTIVE" || (data.status === undefined && existing.status === "ACTIVE")) {
    const dup = await prisma.productPrice.findFirst({
      where: {
        productId: existing.productId,
        priceTierId: existing.priceTierId,
        warehouseId: targetWarehouseId,
        status: "ACTIVE",
        id: { not: id },
      },
    });
    if (dup) {
      throw new AppError(
        targetWarehouseId
          ? "An active price already exists for this Product + Price Tier + Warehouse combination."
          : "An active global price already exists for this Product + Price Tier.",
        409,
      );
    }
  }

  const pp = await prisma.productPrice.update({
    where: { id },
    data: {
      ...(data.warehouseId !== undefined ? { warehouseId: targetWarehouseId } : {}),
      ...(data.unitPrice !== undefined ? { unitPrice: data.unitPrice } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      ...(data.startsAt !== undefined ? { startsAt: data.startsAt } : {}),
      ...(data.endsAt !== undefined ? { endsAt: data.endsAt } : {}),
      updatedById: user.id,
    },
    include: {
      product: { select: { id: true, sku: true, name: true } },
      priceTier: { select: { id: true, name: true } },
      warehouse: { select: { id: true, code: true, name: true } },
    },
  });

  await logAudit({
    createdById: user.id,
    action: "PRODUCT_PRICE_UPDATED",
    entityType: "ProductPrice",
    entityId: pp.id,
    oldValues: {
      unitPrice: Number(existing.unitPrice),
      status: existing.status,
    },
    newValues: {
      unitPrice: Number(pp.unitPrice),
      status: pp.status,
    },
  });

  return serialize(pp);
}

export async function deleteProductPrice(id, user) {
  const existing = await prisma.productPrice.findUnique({ where: { id } });
  if (!existing) throw new AppError("Product Price not found", 404);
  await prisma.productPrice.delete({ where: { id } });
  await logAudit({
    createdById: user.id,
    action: "PRODUCT_PRICE_DELETED",
    entityType: "ProductPrice",
    entityId: id,
  });
  return true;
}

export async function createBatchProductPrices(data, user) {
  const warehouseId = data.warehouseId ?? null;
  const priceTier = await prisma.priceTier.findFirst({
    where: { id: data.priceTierId, isArchived: false },
  });
  if (!priceTier) throw new AppError("Price Tier not found", 404);

  if (warehouseId) {
    const warehouse = await prisma.warehouse.findFirst({
      where: { id: warehouseId, isArchived: false },
    });
    if (!warehouse) throw new AppError("Warehouse not found", 404);
  }

  const productIds = data.items.map((i) => i.productId);
  const foundProducts = await prisma.product.findMany({
    where: { id: { in: productIds }, isArchived: false },
    select: { id: true, name: true, sku: true },
  });
  if (foundProducts.length !== productIds.length) {
    throw new AppError("One or more selected products could not be found", 404);
  }

  const results = [];
  for (const item of data.items) {
    const existing = await prisma.productPrice.findFirst({
      where: {
        productId: item.productId,
        priceTierId: data.priceTierId,
        warehouseId,
      },
    });

    let pp;
    if (existing) {
      pp = await prisma.productPrice.update({
        where: { id: existing.id },
        data: {
          unitPrice: item.unitPrice,
          status: data.status ?? "ACTIVE",
          startsAt: data.startsAt !== undefined ? data.startsAt : existing.startsAt,
          endsAt: data.endsAt !== undefined ? data.endsAt : existing.endsAt,
          updatedById: user.id,
        },
        include: {
          product: { select: { id: true, sku: true, name: true } },
          priceTier: { select: { id: true, name: true } },
          warehouse: { select: { id: true, code: true, name: true } },
        },
      });
      await logAudit({
        createdById: user.id,
        action: "PRODUCT_PRICE_UPDATED",
        entityType: "ProductPrice",
        entityId: pp.id,
        newValues: { unitPrice: Number(pp.unitPrice), status: pp.status },
      });
    } else {
      pp = await prisma.productPrice.create({
        data: {
          productId: item.productId,
          priceTierId: data.priceTierId,
          warehouseId,
          unitPrice: item.unitPrice,
          status: data.status ?? "ACTIVE",
          startsAt: data.startsAt ?? null,
          endsAt: data.endsAt ?? null,
          createdById: user.id,
          updatedById: user.id,
        },
        include: {
          product: { select: { id: true, sku: true, name: true } },
          priceTier: { select: { id: true, name: true } },
          warehouse: { select: { id: true, code: true, name: true } },
        },
      });
      await logAudit({
        createdById: user.id,
        action: "PRODUCT_PRICE_CREATED",
        entityType: "ProductPrice",
        entityId: pp.id,
        newValues: {
          productId: pp.productId,
          priceTierId: pp.priceTierId,
          warehouseId: pp.warehouseId,
          unitPrice: Number(pp.unitPrice),
        },
      });
    }
    results.push(serialize(pp));
  }

  return results;
}