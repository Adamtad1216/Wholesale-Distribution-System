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

async function resolveDefaultPriceTierId(client = prisma) {
  return client.priceTier.findFirst({
    where: { isDefault: true, status: "ACTIVE" },
    select: { id: true, name: true },
  });
}

async function resolveCustomerPriceTier(customerId, requestingUser, client = prisma) {
  if (!customerId) {
    const def = await resolveDefaultPriceTierId(client);
    if (def) return def;
    const firstTier = await client.priceTier.findFirst({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
    });
    if (firstTier) return firstTier;
    throw new AppError("No active price tier configured in the system", 412);
  }

  const customer = await client.customer.findUnique({
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
    // If customer record not found, fall back to default price tier instead of hard-failing
    const def = await resolveDefaultPriceTierId(client);
    if (def) return def;
    const firstTier = await client.priceTier.findFirst({
      where: { status: "ACTIVE" },
      select: { id: true, name: true },
    });
    if (firstTier) return firstTier;
    throw new AppError("Customer not found", 404);
  }

  if (customer.priceTier && customer.priceTier.status === "ACTIVE") {
    return customer.priceTier;
  }

  const def = await resolveDefaultPriceTierId(client);
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

export function getQuotaPeriodBounds(period, referenceDate = new Date()) {
  const d = new Date(referenceDate);
  const year = d.getFullYear();
  const month = d.getMonth();
  const date = d.getDate();

  switch (period) {
    case "DAILY": {
      const start = new Date(year, month, date, 0, 0, 0, 0);
      const end = new Date(year, month, date, 23, 59, 59, 999);
      return { start, end };
    }
    case "WEEKLY": {
      const day = d.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const monday = new Date(year, month, date + diffToMonday, 0, 0, 0, 0);
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      return { start: monday, end: sunday };
    }
    case "MONTHLY": {
      const start = new Date(year, month, 1, 0, 0, 0, 0);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
    case "QUARTERLY": {
      const quarterStartMonth = Math.floor(month / 3) * 3;
      const start = new Date(year, quarterStartMonth, 1, 0, 0, 0, 0);
      const end = new Date(year, quarterStartMonth + 3, 0, 23, 59, 59, 999);
      return { start, end };
    }
    case "ANNUAL": {
      const start = new Date(year, 0, 1, 0, 0, 0, 0);
      const end = new Date(year, 11, 31, 23, 59, 59, 999);
      return { start, end };
    }
    default: {
      const start = new Date(year, month, 1, 0, 0, 0, 0);
      const end = new Date(year, month + 1, 0, 23, 59, 59, 999);
      return { start, end };
    }
  }
}

async function findProductPrice(productId, priceTierId, warehouseId, client = prisma) {
  if (!priceTierId) return null;
  const now = new Date();

  // 1. Try warehouse-specific tier price first if warehouseId is provided
  if (warehouseId) {
    const warehousePrices = await client.productPrice.findMany({
      where: {
        productId,
        priceTierId,
        warehouseId,
        status: "ACTIVE",
      },
    });
    const validWarehouse = warehousePrices.filter((r) => isActiveNow(r.startsAt, r.endsAt, now));
    if (validWarehouse.length > 0) return validWarehouse[0];
  }

  // 2. Fall back to global/company-wide tier price (warehouseId: null)
  const globalPrices = await client.productPrice.findMany({
    where: {
      productId,
      priceTierId,
      warehouseId: null,
      status: "ACTIVE",
    },
  });
  const validGlobal = globalPrices.filter((r) => isActiveNow(r.startsAt, r.endsAt, now));
  if (validGlobal.length > 0) return validGlobal[0];

  return null;
}

async function findBestDiscount({ productId, categoryId, priceTierId, warehouseId, quantity }, client = prisma) {
  if (!priceTierId || !warehouseId) return null;
  const now = new Date();

  const orConditions = [{ productId: null, categoryId: null }];
  if (productId) orConditions.push({ productId });
  if (categoryId) orConditions.push({ categoryId, productId: null });

  const rows = await client.discountRule.findMany({
    where: {
      status: "ACTIVE",
      OR: orConditions,
    },
  });

  const eligible = rows
    .filter((r) => isActiveNow(r.startsAt, r.endsAt, now))
    .filter((r) => (r.priceTierId ? r.priceTierId === priceTierId : true))
    .filter((r) => (r.warehouseId ? r.warehouseId === warehouseId : true))
    .filter((r) => (r.minQuantity ? Number(r.minQuantity) <= quantity : true))
    .sort((a, b) => {
      // 1. Priority desc
      if (b.priority !== a.priority) return b.priority - a.priority;
      // 2. Specificity desc: Product (3) > Category (2) > Global (1)
      const specA = a.productId ? 3 : a.categoryId ? 2 : 1;
      const specB = b.productId ? 3 : b.categoryId ? 2 : 1;
      if (specB !== specA) return specB - specA;
      // 3. Oldest rule breaks ties
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });

  return eligible[0] || null;
}

function computeDiscountAmount(rule, unitPrice, quantity) {
  if (!rule) return 0;
  const lineSubtotal = unitPrice * quantity;
  const v = Number(rule.discountValue);
  if (rule.discountType === "PERCENTAGE") {
    return Math.max(0, lineSubtotal * (v / 100));
  }
  // FIXED_AMOUNT is per-unit wholesale discount (capped at unitPrice and lineSubtotal)
  const perUnitDiscount = Math.min(unitPrice, v);
  return Math.max(0, Math.min(lineSubtotal, perUnitDiscount * quantity));
}

async function getQuotaConsumed(quota, customerId, warehouseId, client = prisma) {
  if (!quota) return 0;
  const now = new Date();
  const periodBounds = getQuotaPeriodBounds(quota.period, now);

  const quotaStart = quota.startsAt ? new Date(quota.startsAt) : null;
  const quotaEnd = quota.endsAt ? new Date(quota.endsAt) : null;

  const windowStart = quotaStart && quotaStart > periodBounds.start ? quotaStart : periodBounds.start;
  const windowEnd = quotaEnd && quotaEnd < periodBounds.end ? quotaEnd : periodBounds.end;

  const where = {
    quotaId: quota.id,
    createdAt: {
      gte: windowStart,
      lte: windowEnd,
    },
  };

  // If quota is assigned to a specific customer, count that customer's usage.
  // If customerId is null on quota, it's a shared pool quota across all buyers.
  if (quota.customerId) {
    where.customerId = customerId;
  }

  const usages = await client.salesQuotaUsage.findMany({
    where,
    select: { quantity: true },
  });
  return usages.reduce((s, u) => s + Number(u.quantity), 0);
}

async function findActiveQuotas({ customerId, productId, warehouseId, priceTierId }, client = prisma) {
  if (!warehouseId) return [];
  const now = new Date();
  const rows = await client.salesQuota.findMany({
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
  client = prisma,
}) {
  if (!items || items.length === 0) {
    throw new AppError("Items array cannot be empty", 400);
  }

  let priceTier = null;
  let priceTierId = null;
  if (warehouseId) {
    priceTier = await resolveCustomerPriceTier(customerId, requestingUser, client);
    priceTierId = priceTier.id;
  }

  const productIds = [...new Set(items.map((it) => it.productId))];
  const products = await client.product.findMany({
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
    if (priceTierId) {
      productPrice = await findProductPrice(it.productId, priceTierId, warehouseId, client);
    }

    if (productPrice) {
      unitPrice = Number(productPrice.unitPrice);
    } else {
      unitPrice = Number(product.sellingPrice);
    }

    const lineSubtotal = unitPrice * quantity;

    let discountRuleId = null;
    let discountAmount = 0;
    if (priceTierId && warehouseId) {
      const discount = await findBestDiscount({
        productId: it.productId,
        categoryId: product.categoryId,
        priceTierId,
        warehouseId,
        quantity,
      }, client);
      discountAmount = computeDiscountAmount(discount, unitPrice, quantity);
      discountRuleId = discount?.id ?? null;
    }
    const lineAfterDiscount = lineSubtotal - discountAmount;

    if (priceTierId && warehouseId) {
      const quotas = await findActiveQuotas({
        customerId,
        productId: it.productId,
        warehouseId,
        priceTierId,
      }, client);

      for (const quota of quotas) {
        const consumed = await getQuotaConsumed(quota, customerId, warehouseId, client);
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