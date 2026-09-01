import prisma from "../../../config/prisma.js";
import { AppError } from "../../../utils/errors.js";
import { logAudit } from "../../../middleware/audit.middleware.js";

function serialize(dr) {
  return {
    id: dr.id,
    name: dr.name,
    productId: dr.productId,
    priceTierId: dr.priceTierId,
    warehouseId: dr.warehouseId,
    minQuantity: dr.minQuantity !== null && dr.minQuantity !== undefined ? Number(dr.minQuantity) : null,
    discountType: dr.discountType,
    discountValue: Number(dr.discountValue),
    priority: dr.priority,
    status: dr.status,
    startsAt: dr.startsAt,
    endsAt: dr.endsAt,
    product: dr.product
      ? { id: dr.product.id, sku: dr.product.sku, name: dr.product.name }
      : null,
    priceTier: dr.priceTier
      ? { id: dr.priceTier.id, name: dr.priceTier.name }
      : null,
    warehouse: dr.warehouse
      ? { id: dr.warehouse.id, code: dr.warehouse.code, name: dr.warehouse.name }
      : null,
    createdAt: dr.createdAt,
    updatedAt: dr.updatedAt,
  };
}

async function validateRefs(productId, priceTierId, warehouseId) {
  const checks = [];
  if (productId) checks.push(prisma.product.findFirst({ where: { id: productId, isArchived: false } }).then((p) => p || "Product"));
  if (priceTierId) checks.push(prisma.priceTier.findFirst({ where: { id: priceTierId, isArchived: false } }).then((t) => t || "PriceTier"));
  if (warehouseId) checks.push(prisma.warehouse.findFirst({ where: { id: warehouseId, isArchived: false } }).then((w) => w || "Warehouse"));
  const res = await Promise.all(checks);
  for (const r of res) {
    if (typeof r === "string") throw new AppError(`${r} not found`, 404);
  }
}

export async function listDiscountRules({ page, limit, productId, priceTierId, warehouseId, status }) {
  const where = {};
  if (productId) where.productId = productId;
  if (priceTierId) where.priceTierId = priceTierId;
  if (warehouseId) where.warehouseId = warehouseId;
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.discountRule.findMany({
      where,
      include: {
        product: { select: { id: true, sku: true, name: true } },
        priceTier: { select: { id: true, name: true } },
        warehouse: { select: { id: true, code: true, name: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.discountRule.count({ where }),
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

export async function getDiscountRule(id) {
  const dr = await prisma.discountRule.findUnique({
    where: { id },
    include: {
      product: { select: { id: true, sku: true, name: true } },
      priceTier: { select: { id: true, name: true } },
      warehouse: { select: { id: true, code: true, name: true } },
    },
  });
  if (!dr) throw new AppError("Discount Rule not found", 404);
  return serialize(dr);
}

export async function createDiscountRule(data, user) {
  await validateRefs(data.productId ?? null, data.priceTierId ?? null, data.warehouseId ?? null);

  const dr = await prisma.discountRule.create({
    data: {
      name: data.name,
      productId: data.productId ?? null,
      priceTierId: data.priceTierId ?? null,
      warehouseId: data.warehouseId ?? null,
      minQuantity: data.minQuantity ?? null,
      discountType: data.discountType,
      discountValue: data.discountValue,
      priority: data.priority ?? 0,
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
    action: "DISCOUNT_RULE_CREATED",
    entityType: "DiscountRule",
    entityId: dr.id,
    newValues: { name: dr.name, value: Number(dr.discountValue), type: dr.discountType },
  });

  return serialize(dr);
}

export async function updateDiscountRule(id, data, user) {
  const existing = await prisma.discountRule.findUnique({ where: { id } });
  if (!existing) throw new AppError("Discount Rule not found", 404);

  if (
    data.productId !== undefined ||
    data.priceTierId !== undefined ||
    data.warehouseId !== undefined
  ) {
    await validateRefs(
      data.productId ?? existing.productId,
      data.priceTierId ?? existing.priceTierId,
      data.warehouseId ?? existing.warehouseId,
    );
  }

  const dr = await prisma.discountRule.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.productId !== undefined ? { productId: data.productId } : {}),
      ...(data.priceTierId !== undefined ? { priceTierId: data.priceTierId } : {}),
      ...(data.warehouseId !== undefined ? { warehouseId: data.warehouseId } : {}),
      ...(data.minQuantity !== undefined ? { minQuantity: data.minQuantity } : {}),
      ...(data.discountType !== undefined ? { discountType: data.discountType } : {}),
      ...(data.discountValue !== undefined ? { discountValue: data.discountValue } : {}),
      ...(data.priority !== undefined ? { priority: data.priority } : {}),
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
    action: "DISCOUNT_RULE_UPDATED",
    entityType: "DiscountRule",
    entityId: dr.id,
  });

  return serialize(dr);
}

export async function deleteDiscountRule(id, user) {
  const existing = await prisma.discountRule.findUnique({ where: { id } });
  if (!existing) throw new AppError("Discount Rule not found", 404);
  await prisma.discountRule.delete({ where: { id } });
  await logAudit({
    createdById: user.id,
    action: "DISCOUNT_RULE_DELETED",
    entityType: "DiscountRule",
    entityId: id,
  });
  return true;
}