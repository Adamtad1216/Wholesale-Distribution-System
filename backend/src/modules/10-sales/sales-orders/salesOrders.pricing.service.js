import prisma from "../../../config/prisma.js";
import { AppError } from "../../../utils/errors.js";

export async function calculateSalesOrderPricing(items) {
  const productIds = [...new Set(items.map((item) => item.productId))];

  if (productIds.length === 0) {
    throw new AppError("Items array cannot be empty", 400);
  }

  const products = await prisma.product.findMany({
    where: {
      id: { in: productIds },
      isArchived: false,
      status: "ACTIVE",
    },
    include: {
      category: true,
      brand: true,
      unit: true,
    },
  });

  if (products.length !== productIds.length) {
    throw new AppError("One or more products are invalid or unavailable", 400);
  }

  const productMap = new Map(products.map((p) => [p.id, p]));

  const validatedItems = [];
  const seenProductIds = new Set();

  for (const item of items) {
    if (seenProductIds.has(item.productId)) {
      throw new AppError(`Duplicate product detected: ${item.productId}`, 400);
    }
    seenProductIds.add(item.productId);

    const quantity = Number(item.quantity);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      throw new AppError("Quantity must be a positive number", 400);
    }
    if (quantity > 999999999999) {
      throw new AppError("Quantity exceeds maximum allowed value", 400);
    }

    const product = productMap.get(item.productId);
    const unitPrice = Number(product.sellingPrice);
    const subtotal = unitPrice * quantity;
    const discount = 0;
    const tax = 0;
    const total = subtotal - discount + tax;

    validatedItems.push({
      productId: item.productId,
      product,
      quantity,
      unitPrice,
      subtotal,
      discount,
      tax,
      total,
    });
  }

  const orderSubtotal = validatedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const orderDiscount = validatedItems.reduce((sum, item) => sum + item.discount, 0);
  const orderTax = validatedItems.reduce((sum, item) => sum + item.tax, 0);
  const orderTotal = validatedItems.reduce((sum, item) => sum + item.total, 0);

  return {
    items: validatedItems,
    subtotal: orderSubtotal,
    discount: orderDiscount,
    tax: orderTax,
    total: orderTotal,
  };
}
