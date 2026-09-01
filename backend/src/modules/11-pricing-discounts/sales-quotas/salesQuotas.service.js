import prisma from "../../../config/prisma.js";
import { AppError } from "../../../utils/errors.js";
import { logAudit } from "../../../middleware/audit.middleware.js";

function serialize(q) {
  return {
    id: q.id,
    name: q.name,
    customerId: q.customerId,
    productId: q.productId,
    priceTierId: q.priceTierId,
    warehouseId: q.warehouseId,
    branchId: q.branchId,
    maxQuantity: Number(q.maxQuantity),
    period: q.period,
    startsAt: q.startsAt,
    endsAt: q.endsAt,
    status: q.status,
    customer: q.customer
      ? {
          id: q.customer.id,
          customerCode: q.customer.customerCode,
        }
      : null,
    product: q.product
      ? { id: q.product.id, sku: q.product.sku, name: q.product.name }
      : null,
    priceTier: q.priceTier
      ? { id: q.priceTier.id, name: q.priceTier.name }
      : null,
    warehouse: q.warehouse
      ? { id: q.warehouse.id, code: q.warehouse.code, name: q.warehouse.name }
      : null,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
  };
}

async function validateRefs({ customerId, productId, priceTierId, warehouseId, branchId }) {
  const checks = [];
  if (customerId)
    checks.push(prisma.customer.findFirst({ where: { id: customerId, isArchived: false } }).then((r) => r || "Customer"));
  if (productId)
    checks.push(prisma.product.findFirst({ where: { id: productId, isArchived: false } }).then((r) => r || "Product"));
  if (priceTierId)
    checks.push(prisma.priceTier.findFirst({ where: { id: priceTierId, isArchived: false } }).then((r) => r || "PriceTier"));
  if (warehouseId)
    checks.push(prisma.warehouse.findFirst({ where: { id: warehouseId, isArchived: false } }).then((r) => r || "Warehouse"));
  if (branchId)
    checks.push(prisma.branch.findFirst({ where: { id: branchId, isArchived: false } }).then((r) => r || "Branch"));
  const results = await Promise.all(checks);
  for (const r of results) {
    if (typeof r === "string") throw new AppError(`${r} not found`, 404);
  }
}

export async function listSalesQuotas({
  page,
  limit,
  customerId,
  productId,
  priceTierId,
  warehouseId,
  branchId,
  period,
  status,
}) {
  const where = {};
  if (customerId) where.customerId = customerId;
  if (productId) where.productId = productId;
  if (priceTierId) where.priceTierId = priceTierId;
  if (warehouseId) where.warehouseId = warehouseId;
  if (branchId) where.branchId = branchId;
  if (period) where.period = period;
  if (status) where.status = status;

  const [items, total] = await Promise.all([
    prisma.salesQuota.findMany({
      where,
      include: {
        customer: { select: { id: true, customerCode: true } },
        product: { select: { id: true, sku: true, name: true } },
        priceTier: { select: { id: true, name: true } },
        warehouse: { select: { id: true, code: true, name: true } },
      },
      orderBy: [{ customerId: "asc" }, { productId: "asc" }, { warehouseId: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.salesQuota.count({ where }),
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

export async function getSalesQuota(id) {
  const q = await prisma.salesQuota.findUnique({
    where: { id },
    include: {
      customer: { select: { id: true, customerCode: true } },
      product: { select: { id: true, sku: true, name: true } },
      priceTier: { select: { id: true, name: true } },
      warehouse: { select: { id: true, code: true, name: true } },
    },
  });
  if (!q) throw new AppError("Sales Quota not found", 404);
  return serialize(q);
}

export async function createSalesQuota(data, user) {
  await validateRefs(data);
  const q = await prisma.salesQuota.create({
    data: {
      name: data.name,
      customerId: data.customerId ?? null,
      productId: data.productId ?? null,
      priceTierId: data.priceTierId ?? null,
      warehouseId: data.warehouseId ?? null,
      branchId: data.branchId ?? null,
      maxQuantity: data.maxQuantity,
      period: data.period ?? "MONTHLY",
      startsAt: data.startsAt,
      endsAt: data.endsAt,
      status: data.status ?? "ACTIVE",
      createdById: user.id,
      updatedById: user.id,
    },
    include: {
      customer: { select: { id: true, customerCode: true } },
      product: { select: { id: true, sku: true, name: true } },
      priceTier: { select: { id: true, name: true } },
      warehouse: { select: { id: true, code: true, name: true } },
    },
  });

  await logAudit({
    createdById: user.id,
    action: "SALES_QUOTA_CREATED",
    entityType: "SalesQuota",
    entityId: q.id,
    newValues: { name: q.name, maxQuantity: Number(q.maxQuantity), period: q.period },
  });

  return serialize(q);
}

export async function updateSalesQuota(id, data, user) {
  const existing = await prisma.salesQuota.findUnique({ where: { id } });
  if (!existing) throw new AppError("Sales Quota not found", 404);

  if (
    data.customerId !== undefined ||
    data.productId !== undefined ||
    data.priceTierId !== undefined ||
    data.warehouseId !== undefined ||
    data.branchId !== undefined
  ) {
    await validateRefs({
      customerId: data.customerId ?? existing.customerId,
      productId: data.productId ?? existing.productId,
      priceTierId: data.priceTierId ?? existing.priceTierId,
      warehouseId: data.warehouseId ?? existing.warehouseId,
      branchId: data.branchId ?? existing.branchId,
    });
  }

  const q = await prisma.salesQuota.update({
    where: { id },
    data: {
      ...(data.name !== undefined ? { name: data.name } : {}),
      ...(data.customerId !== undefined ? { customerId: data.customerId } : {}),
      ...(data.productId !== undefined ? { productId: data.productId } : {}),
      ...(data.priceTierId !== undefined ? { priceTierId: data.priceTierId } : {}),
      ...(data.warehouseId !== undefined ? { warehouseId: data.warehouseId } : {}),
      ...(data.branchId !== undefined ? { branchId: data.branchId } : {}),
      ...(data.maxQuantity !== undefined ? { maxQuantity: data.maxQuantity } : {}),
      ...(data.period !== undefined ? { period: data.period } : {}),
      ...(data.startsAt !== undefined ? { startsAt: data.startsAt } : {}),
      ...(data.endsAt !== undefined ? { endsAt: data.endsAt } : {}),
      ...(data.status !== undefined ? { status: data.status } : {}),
      updatedById: user.id,
    },
    include: {
      customer: { select: { id: true, customerCode: true } },
      product: { select: { id: true, sku: true, name: true } },
      priceTier: { select: { id: true, name: true } },
      warehouse: { select: { id: true, code: true, name: true } },
    },
  });

  await logAudit({
    createdById: user.id,
    action: "SALES_QUOTA_UPDATED",
    entityType: "SalesQuota",
    entityId: q.id,
  });

  return serialize(q);
}

export async function deleteSalesQuota(id, user) {
  const existing = await prisma.salesQuota.findUnique({ where: { id } });
  if (!existing) throw new AppError("Sales Quota not found", 404);
  await prisma.salesQuotaUsage.deleteMany({ where: { quotaId: id } });
  await prisma.salesQuota.delete({ where: { id } });
  await logAudit({
    createdById: user.id,
    action: "SALES_QUOTA_DELETED",
    entityType: "SalesQuota",
    entityId: id,
  });
  return true;
}

export async function getQuotaConsumptionForCustomer({ customerId, productId, warehouseId, priceTierId }) {
  const now = new Date();
  const candidates = await prisma.salesQuota.findMany({
    where: {
      status: "ACTIVE",
      AND: [
        { OR: [{ customerId: null }, ...(customerId ? [{ customerId }] : [])] },
        { OR: [{ productId: null }, ...(productId ? [{ productId }] : [])] },
      ],
    },
  });
  const matching = candidates
    .filter((q) => q.startsAt <= now && q.endsAt >= now)
    .filter((q) => (q.priceTierId ? q.priceTierId === priceTierId : true))
    .filter((q) => (q.warehouseId ? q.warehouseId === warehouseId : true));

  if (matching.length === 0) return [];

  const results = [];
  for (const quota of matching) {
    const usages = await prisma.salesQuotaUsage.findMany({
      where: { quotaId: quota.id, customerId },
      select: { quantity: true },
    });
    const consumed = usages.reduce((s, u) => s + Number(u.quantity), 0);
    results.push({
      quotaId: quota.id,
      quotaName: quota.name,
      maxQuantity: Number(quota.maxQuantity),
      consumed,
      remaining: Math.max(0, Number(quota.maxQuantity) - consumed),
      period: quota.period,
      startsAt: quota.startsAt,
      endsAt: quota.endsAt,
    });
  }
  return results;
}