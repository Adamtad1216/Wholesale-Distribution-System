import prisma from "../../../config/prisma.js";
import { AppError } from "../../../utils/errors.js";
import { logAudit } from "../../../middleware/audit.middleware.js";

function serialize(pt) {
  return {
    id: pt.id,
    name: pt.name,
    description: pt.description,
    isDefault: pt.isDefault,
    priority: pt.priority,
    status: pt.status,
    createdAt: pt.createdAt,
    updatedAt: pt.updatedAt,
  };
}

export async function listPriceTiers({ page, limit, search, status, isDefault }) {
  const where = { isArchived: false };
  if (status) where.status = status;
  if (typeof isDefault === "boolean") where.isDefault = isDefault;
  if (search) where.name = { contains: search, mode: "insensitive" };

  const [items, total] = await Promise.all([
    prisma.priceTier.findMany({
      where,
      orderBy: [{ isDefault: "desc" }, { priority: "desc" }, { name: "asc" }],
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.priceTier.count({ where }),
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

export async function getPriceTier(id) {
  const pt = await prisma.priceTier.findFirst({
    where: { id, isArchived: false },
  });
  if (!pt) throw new AppError("Price Tier not found", 404);
  return serialize(pt);
}

export async function createPriceTier(data, user) {
  const existing = await prisma.priceTier.findFirst({
    where: { name: { equals: data.name, mode: "insensitive" } },
  });
  if (existing) throw new AppError("Price Tier with this name already exists", 409);

  const created = await prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.priceTier.updateMany({
        where: { isDefault: true, isArchived: false },
        data: { isDefault: false },
      });
    }
    return tx.priceTier.create({
      data: {
        name: data.name,
        description: data.description ?? null,
        isDefault: !!data.isDefault,
        priority: data.priority ?? 0,
        status: data.status ?? "ACTIVE",
        createdById: user.id,
        updatedById: user.id,
      },
    });
  });

  await logAudit({
    createdById: user.id,
    action: "PRICE_TIER_CREATED",
    entityType: "PriceTier",
    entityId: created.id,
    newValues: { name: created.name, isDefault: created.isDefault },
  });

  return serialize(created);
}

export async function updatePriceTier(id, data, user) {
  const existing = await prisma.priceTier.findFirst({ where: { id, isArchived: false } });
  if (!existing) throw new AppError("Price Tier not found", 404);

  if (data.name && data.name.toLowerCase() !== existing.name.toLowerCase()) {
    const dup = await prisma.priceTier.findFirst({
      where: { name: { equals: data.name, mode: "insensitive" }, id: { not: id } },
    });
    if (dup) throw new AppError("Price Tier with this name already exists", 409);
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (data.isDefault === true) {
      await tx.priceTier.updateMany({
        where: { isDefault: true, isArchived: false, id: { not: id } },
        data: { isDefault: false },
      });
    }
    return tx.priceTier.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.description !== undefined ? { description: data.description } : {}),
        ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
        ...(data.priority !== undefined ? { priority: data.priority } : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        updatedById: user.id,
      },
    });
  });

  await logAudit({
    createdById: user.id,
    action: "PRICE_TIER_UPDATED",
    entityType: "PriceTier",
    entityId: updated.id,
    oldValues: {
      name: existing.name,
      status: existing.status,
      isDefault: existing.isDefault,
      priority: existing.priority,
    },
    newValues: {
      name: updated.name,
      status: updated.status,
      isDefault: updated.isDefault,
      priority: updated.priority,
    },
  });

  return serialize(updated);
}

export async function setPriceTierActive(id, isActive, user) {
  const status = isActive ? "ACTIVE" : "INACTIVE";
  return updatePriceTier(id, { status }, user);
}

export async function archivePriceTier(id, user) {
  const existing = await prisma.priceTier.findFirst({ where: { id, isArchived: false } });
  if (!existing) throw new AppError("Price Tier not found", 404);

  if (existing.isDefault) {
    throw new AppError("Cannot archive the default Price Tier. Assign another tier as default first.", 409);
  }

  const assigned = await prisma.customer.count({ where: { priceTierId: id, isArchived: false } });
  if (assigned > 0) {
    throw new AppError(
      `Cannot archive Price Tier assigned to ${assigned} active customer(s).`,
      409,
    );
  }

  await prisma.priceTier.update({
    where: { id },
    data: { isArchived: true, archivedAt: new Date(), updatedById: user.id },
  });

  await logAudit({
    createdById: user.id,
    action: "PRICE_TIER_ARCHIVED",
    entityType: "PriceTier",
    entityId: id,
  });

  return true;
}