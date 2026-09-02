import prisma from "../../../config/prisma.js";
import { AppError } from "../../../utils/errors.js";

function isActiveNow(startsAt, endsAt, now = new Date()) {
  if (startsAt && new Date(startsAt) > now) return false;
  if (endsAt && new Date(endsAt) < now) return false;
  return true;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

async function resolveDefaultPriceTierId() {
  return prisma.priceTier.findFirst({
    where: { isDefault: true, status: "ACTIVE" },
    select: { id: true, name: true },
  });
}

async function resolveCustomerPriceTier(customerId, requestingUser) {
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
    select: {
      id: true,
      priceTierId: true,
      priceTier: { select: { id: true, name: true, status: true, isDefault: true } },
      person: { select: { id: true } },
      organization: { select: { id: true } },
    },
  });

  if (!customer) {
    throw new AppError("Customer not found", 404);
  }

  if (customer.priceTier && customer.priceTier.status === "ACTIVE") {
    return customer.priceTier;
  }

  const def = await resolveDefaultPriceTierId();
  if (def) {
    return def;
  }

  if (requestingUser && requestingUser.userRoles) {
    const isCustomerRole = requestingUser.userRoles.some((ur) => ur.role.name === "CUSTOMER");
    if (isCustomerRole) {
      throw new AppError(
        "Customer does not have an assigned Price Tier and no default tier is configured. Please contact an authorized employee to assign a Price Tier.",
        412,
      );
    }
  }

  throw new AppError(
    "Customer does not have an assigned Price Tier and no default tier is configured. Please contact an administrator.",
    412,
  );
}

async function findProductPrice(productId, priceTierId, warehouseId) {
  if (!priceTierId || !warehouseId) return null;
  const now = new Date();
  const rows = await prisma.productPrice.findMany({
    where: {
      productId,
      priceTierId,
      warehouseId,
      status: "ACTIVE",
    },
  });
  const valid = rows.filter((r) => isActiveNow(r.startsAt, r.endsAt, now));
  return valid[0] || null;
}

async function findBestDiscount({ productId, priceTierId, warehouseId, quantity }) {
  if (!priceTierId || !warehouseId) return null;
  const now = new Date();
  const rows = await prisma.discountRule.findMany({
    where: {
      status: "ACTIVE",
      OR: [{ productId: null }, { productId }],
    },
  });
  const eligible = rows
    .filter((r) => isActiveNow(r.startsAt, r.endsAt, now))
    .filter((r) => (r.priceTierId ? r.priceTierId === priceTierId : true))
    .filter((r) => (r.warehouseId ? r.warehouseId === warehouseId : true))
    .filter((r) => (r.minQuantity ? Number(r.minQuantity) <= quantity : true))
    .sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
  return eligible[0] || null;
}

function computeDiscountAmount(rule, subtotal) {
  if (!rule) return 0;
  const v = Number(rule.discountValue);
  if (rule.discountType === "PERCENTAGE") {
    return Math.max(0, subtotal * (v / 100));
  }
  return Math.max(0, Math.min(subtotal, v));
}

async function getQuotaConsumed(quota, customerId, warehouseId) {
  if (!quota || !customerId) return 0;
  const start = new Date(quota.startsAt);
  const end = new Date(quota.endsAt);

  const matching = await prisma.salesQuota.findMany({
    where: {
      OR: [{ id: quota.id }],
    },
    select: { id: true },
  });
  if (matching.length === 0) return 0;

  const usages = await prisma.salesQuotaUsage.findMany({
    where: { quotaId: { in: matching.map((m) => m.id) }, customerId },
    select: { quantity: true },
  });
  return usages.reduce((s, u) => s + Number(u.quantity), 0);
}

async function findActiveQuotas({ customerId, productId, warehouseId, priceTierId }) {
  if (!warehouseId) return [];
  const now = new Date();
  const rows = await prisma.salesQuota.findMany({
    where: {
      status: "ACTIVE",
      AND: [
        { OR: [{ customerId: null }, ...(customerId ? [{ customerId }] : [])] },
        { OR: [{ productId: null }, ...(productId ? [{ productId }] : [])] },
      ],
    },
  });
  return rows
    .filter((r) => isActiveNow(r.startsAt, r.endsAt, now))
    .filter((r) => (r.priceTierId ? r.priceTierId === priceTierId : true))
    .filter((r) => (r.warehouseId ? r.warehouseId === warehouseId : true));
}

export async function calculateSalesOrderPricing({
  items,
  customerId,
  warehouseId,
  requestingUser,
  enforceQuota = false,
}) {
  if (!items || items.length === 0) {
    throw new AppError("Items array cannot be empty", 400);
  }
  if (!customerId) {
    throw new AppError("customerId is required for pricing", 400);
  }

  let priceTier = null;
  let priceTierId = null;
  if (warehouseId) {
    priceTier = await resolveCustomerPriceTier(customerId, requestingUser);
    priceTierId = priceTier.id;
  }

  const productIds = [...new Set(items.map((it) => it.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: productIds }, isArchived: false, status: "ACTIVE" },
    include: { category: true, brand: true, unit: true },
  });
  if (products.length !== productIds.length) {
    throw new AppError("One or more products are invalid or unavailable", 400);
  }
  const productMap = new Map(products.map((p) => [p.id, p]));

  const seen = new Set();
  const lineItems = [];
  let subtotal = 0;
  let totalDiscount = 0;
  const quotaWarnings = [];
  const quotaErrors = [];

  for (const it of items) {
    if (seen.has(it.productId)) {
      throw new AppError(`Duplicate product detected: ${it.productId}`, 400);
    }
    seen.add(it.productId);

    const quantity = Number(it.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new AppError("Quantity must be a positive number", 400);
    }
    if (quantity > 999999999999) {
      throw new AppError("Quantity exceeds maximum allowed value", 400);
    }

    const product = productMap.get(it.productId);
    let unitPrice;

    let productPrice = null;
    if (priceTierId && warehouseId) {
      productPrice = await findProductPrice(it.productId, priceTierId, warehouseId);
    }

    if (productPrice) {
      unitPrice = Number(productPrice.unitPrice);
    } else if (priceTierId && warehouseId) {
      unitPrice = Number(product.sellingPrice);
    } else {
      unitPrice = Number(product.sellingPrice);
    }

    const lineSubtotal = unitPrice * quantity;

    let discountRuleId = null;
    let discountAmount = 0;
    if (priceTierId && warehouseId) {
      const discount = await findBestDiscount({
        productId: it.productId,
        priceTierId,
        warehouseId,
        quantity,
      });
      discountAmount = computeDiscountAmount(discount, lineSubtotal);
      discountRuleId = discount?.id ?? null;
    }
    const lineAfterDiscount = lineSubtotal - discountAmount;

    if (priceTierId && warehouseId) {
      const quotas = await findActiveQuotas({
        customerId,
        productId: it.productId,
        warehouseId,
        priceTierId,
      });

      for (const quota of quotas) {
        const consumed = await getQuotaConsumed(quota, customerId, warehouseId);
        const max = Number(quota.maxQuantity);
        const projected = consumed + quantity;
        if (projected > max) {
          const err = {
            quotaId: quota.id,
            quotaName: quota.name,
            productId: it.productId,
            productName: product.name,
            warehouseId,
            consumed,
            maxQuantity: max,
            requestedQuantity: quantity,
            remaining: Math.max(0, max - consumed),
          };
          if (enforceQuota) {
            quotaErrors.push(err);
          } else {
            quotaWarnings.push(err);
          }
        }
      }
    }

    subtotal += lineSubtotal;
    totalDiscount += discountAmount;

    lineItems.push({
      productId: it.productId,
      product,
      quantity,
      unitPrice,
      subtotal: round2(lineSubtotal),
      discount: round2(discountAmount),
      discountRuleId,
      priceTierId,
      total: round2(lineAfterDiscount),
      tax: 0,
    });
  }

  if (quotaErrors.length > 0) {
    const e = new AppError(
      `Quota exceeded for ${quotaErrors.length} item(s). Reduce quantity or contact administrator.`,
      409,
    );
    e.details = { quotaErrors };
    throw e;
  }

  const tax = 0;
  const total = round2(subtotal - totalDiscount + tax);

  return {
    items: lineItems,
    subtotal: round2(subtotal),
    discount: round2(totalDiscount),
    tax,
    total,
    priceTier: priceTier ? { id: priceTier.id, name: priceTier.name } : null,
    quotaWarnings,
  };
}

export async function previewSalesOrder({
  items,
  customerId,
  warehouseId,
  requestingUser,
}) {
  const pricing = await calculateSalesOrderPricing({
    items,
    customerId,
    warehouseId,
    requestingUser,
    enforceQuota: false,
  });

  return {
    items: pricing.items.map((item) => ({
      productId: item.productId,
      productName: item.product.name,
      sku: item.product.sku,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      subtotal: item.subtotal,
      discount: item.discount,
      finalAmount: item.total,
      priceTierId: item.priceTierId,
      discountRuleId: item.discountRuleId,
    })),
    priceTier: pricing.priceTier,
    subtotal: pricing.subtotal,
    discount: pricing.discount,
    tax: pricing.tax,
    total: pricing.total,
    quotaWarnings: pricing.quotaWarnings,
  };
}