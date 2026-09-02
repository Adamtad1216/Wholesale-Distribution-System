import prisma from "../../../config/prisma.js";
import { AppError } from "../../../utils/errors.js";
import { logAudit } from "../../../middleware/audit.middleware.js";
import { assignSalesRepresentative } from "../shared/salesRepresentativeAssignment.service.js";
import { calculateSalesOrderPricing } from "../../11-pricing-discounts/shared/pricing.service.js";

export async function previewSalesOrder({ items, customerId, warehouseId, requestingUser }) {
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

export async function createSalesOrder({
  customerId,
  warehouseId,
  items,
  requiredDate,
  deliveryLocation,
  requestingUser,
}) {
  const warehouse = await prisma.warehouse.findFirst({
    where: { id: warehouseId, isArchived: false, status: "ACTIVE" },
  });
  if (!warehouse) {
    throw new AppError("Warehouse not found or not active", 404);
  }

  const pricing = await calculateSalesOrderPricing({
    items,
    customerId,
    warehouseId,
    requestingUser,
    enforceQuota: true,
  });

  const assignment = await assignSalesRepresentative();

  let lastError;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const salesOrder = await prisma.$transaction(async (tx) => {
        const orderNumber = await generateOrderNumber(tx);

        const order = await tx.salesOrder.create({
          data: {
            orderNumber,
            customerId,
            salesRepId: assignment.salesRepId,
            warehouseId,
            source: "CUSTOMER_PORTAL",
            orderDate: new Date(),
            requiredDate: requiredDate ?? null,
            status: "PENDING_REVIEW",
            priceTierId: pricing.priceTier?.id ?? null,
            deliveryLatitude: deliveryLocation?.latitude ? Number(deliveryLocation.latitude) : null,
            deliveryLongitude: deliveryLocation?.longitude ? Number(deliveryLocation.longitude) : null,
            deliveryAddressText: deliveryLocation?.addressText || null,
            subtotal: pricing.subtotal,
            discount: pricing.discount,
            tax: pricing.tax,
            total: pricing.total,
            createdById: requestingUser.id,
            updatedById: requestingUser.id,
            items: {
              create: pricing.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                priceTierId: item.priceTierId,
                discountRuleId: item.discountRuleId,
                discount: item.discount,
                tax: item.tax,
                total: item.total,
              })),
            },
          },
          include: {
            customer: { include: { person: true, organization: true, priceTier: true } },
            salesRep: { include: { person: true } },
            warehouse: true,
            priceTier: true,
            items: {
              include: {
                product: { include: { category: true, brand: true, unit: true } },
                priceTier: true,
                discountRule: true,
              },
            },
          },
        });

        const now = new Date();
        const productIds = pricing.items.map((i) => i.productId);
        const quotaCandidates = await tx.salesQuota.findMany({
          where: {
            status: "ACTIVE",
            AND: [
              { OR: [{ customerId: null }, { customerId }] },
              { OR: [{ productId: null }, { productId: { in: productIds } }] },
            ],
          },
        });
        const matchingQuotas = quotaCandidates
          .filter((q) => q.startsAt <= now && q.endsAt >= now)
          .filter((q) =>
            pricing.items.some(
              (i) =>
                (!q.productId || q.productId === i.productId) &&
                (!q.priceTierId || q.priceTierId === i.priceTierId) &&
                (!q.warehouseId || q.warehouseId === warehouseId),
            ),
          );

        for (const item of pricing.items) {
          const itemQuotas = matchingQuotas.filter(
            (q) => !q.productId || q.productId === item.productId,
          );
          for (const quota of itemQuotas) {
            await tx.salesQuotaUsage.create({
              data: {
                quotaId: quota.id,
                customerId,
                salesOrderId: order.id,
                quantity: item.quantity,
              },
            });
          }
        }

        return order;
      });

      await logAudit({
        createdById: requestingUser.id,
        action: "SALES_ORDER_CREATED",
        entityType: "SalesOrder",
        entityId: salesOrder.id,
        newValues: {
          orderNumber: salesOrder.orderNumber,
          customerId: salesOrder.customerId,
          salesRepId: salesOrder.salesRepId,
          warehouseId: salesOrder.warehouseId,
          priceTierId: salesOrder.priceTierId,
          total: Number(salesOrder.total),
          itemCount: salesOrder.items.length,
        },
        req: null,
      });

      return salesOrder;
    } catch (err) {
      lastError = err;
      if (err.code === "P2002" && attempt < 2) {
        await new Promise((resolve) => setTimeout(resolve, 50));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

async function generateOrderNumber(tx) {
  const year = new Date().getFullYear();
  const prefix = `SO-${year}-`;

  const lastOrder = await tx.salesOrder.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: "desc" },
  });

  let nextSequence = 1;
  if (lastOrder) {
    const parts = lastOrder.orderNumber.split("-");
    const lastSequence = parseInt(parts[parts.length - 1], 10);
    if (!isNaN(lastSequence)) {
      nextSequence = lastSequence + 1;
    }
  }

  return `${prefix}${String(nextSequence).padStart(6, "0")}`;
}