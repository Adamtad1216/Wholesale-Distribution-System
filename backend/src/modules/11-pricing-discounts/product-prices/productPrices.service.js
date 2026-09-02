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
  const [p, t, w] = await Promise.all([
    prisma.product.findFirst({ where: { id: productId, isArchived: false } }),
    prisma.priceTier.findFirst({ where: { id: priceTierId, isArchived: false } }),
    prisma.warehouse.findFirst({ where: { id: warehouseId, isArchived: false } }),
  ]);
  if (!p) throw new AppError("Product not found", 404);
  if (!t) throw new AppError("Price Tier not found", 404);
  if (!w) throw new AppError("Warehouse not found", 404);
}

export async function listProductPrices({ page, limit, productId, priceTierId, warehouseId, status }) {
  const where = {};
  if (productId) where.productId = productId;
  if (priceTierId) where.priceTierId = priceTierId;
  if (warehouseId) where.warehouseId = warehouseId;
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
  await validateRefs(data.productId, data.priceTierId, data.warehouseId);

  if (data.status === "ACTIVE") {
    const existing = await prisma.productPrice.findFirst({
      where: {
        productId: data.productId,
        priceTierId: data.priceTierId,
        warehouseId: data.warehouseId,
        status: "ACTIVE",
      },
    });
    if (existing) {
      throw new AppError(
        "An active price already exists for this Product + Price Tier + Warehouse combination.",
        409,
      );
    }
  }

  const pp = await prisma.productPrice.create({
    data: {
      productId: data.productId,
      priceTierId: data.priceTierId,
      warehouseId: data.warehouseId,
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

  if (data.status === "ACTIVE") {
    const dup = await prisma.productPrice.findFirst({
      where: {
        productId: existing.productId,
        priceTierId: existing.priceTierId,
        warehouseId: existing.warehouseId,
        status: "ACTIVE",
        id: { not: id },
      },
    });
    if (dup) {
      throw new AppError(
        "An active price already exists for this Product + Price Tier + Warehouse combination.",
        409,
      );
    }
  }

  const pp = await prisma.productPrice.update({
    where: { id },
    data: {
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