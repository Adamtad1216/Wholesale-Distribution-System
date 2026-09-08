import prisma from "../src/config/prisma.js";
import {
  calculateSalesOrderPricing,
  getQuotaPeriodBounds,
} from "../src/modules/11-pricing-discounts/shared/pricing.service.js";
import { createProductPrice } from "../src/modules/11-pricing-discounts/product-prices/productPrices.service.js";
import { createDiscountRule } from "../src/modules/11-pricing-discounts/discount-rules/discountRules.service.js";
import { createSalesQuota } from "../src/modules/11-pricing-discounts/sales-quotas/salesQuotas.service.js";
import { recordStatusChange } from "../src/modules/10-sales/sales-orders/salesOrders.status.service.js";

async function runTests() {
  console.log("=== STARTING PRICING, DISCOUNTS & QUOTAS BUSINESS LOGIC FIXES VERIFICATION ===");

  const admin = await prisma.user.findFirst({
    where: { isActive: true },
  });
  if (!admin) {
    throw new Error("No active user found in DB");
  }

  // 1. Fetch reference warehouse, customer, products, category
  const warehouse = await prisma.warehouse.findFirst({
    where: { isArchived: false, status: "ACTIVE" },
  });
  const otherWarehouse = await prisma.warehouse.findFirst({
    where: { isArchived: false, status: "ACTIVE", id: { not: warehouse.id } },
  });
  const customer = await prisma.customer.findFirst({
    where: { isArchived: false, status: "ACTIVE" },
  });
  const category = await prisma.category.findFirst({
    where: { isArchived: false, status: "ACTIVE" },
  });
  const products = await prisma.product.findMany({
    where: { isArchived: false, status: "ACTIVE", categoryId: category.id },
    take: 2,
  });

  if (!warehouse || !customer || products.length < 2) {
    throw new Error("Insufficient reference test data (need warehouse, customer, 2 products in same category)");
  }

  const p1 = products[0];
  const p2 = products[1];

  console.log(`Test Context:`);
  console.log(` - Warehouse: ${warehouse.name} (${warehouse.id})`);
  console.log(` - Customer: ${customer.id}`);
  console.log(` - Category: ${category.name} (${category.id})`);
  console.log(` - Product 1: ${p1.name} (Base: ${p1.sellingPrice})`);
  console.log(` - Product 2: ${p2.name} (Base: ${p2.sellingPrice})`);

  // Clean any old test artifacts
  await prisma.salesQuotaUsage.deleteMany({ where: { customerId: customer.id } });
  await prisma.discountRule.deleteMany({ where: { name: { startsWith: "TEST_" } } });
  await prisma.salesQuota.deleteMany({ where: { name: { startsWith: "TEST_" } } });
  await prisma.productPrice.deleteMany({ where: { product: { name: { startsWith: "TEST_" } } } });

  // Create a dedicated test Price Tier
  const testTier = await prisma.priceTier.create({
    data: {
      name: `TEST_TIER_${Date.now()}`,
      priority: 50,
      status: "ACTIVE",
      createdById: admin.id,
      updatedById: admin.id,
    },
  });

  // Assign tier to test customer
  await prisma.customer.update({
    where: { id: customer.id },
    data: { priceTierId: testTier.id },
  });

  try {
    // -------------------------------------------------------------
    // TEST 1: Global vs Warehouse-Specific Product Tier Pricing
    // -------------------------------------------------------------
    console.log("\n[TEST 1] Testing Global vs Warehouse-Specific Product Pricing...");
    
    // Set a GLOBAL tier price for p1 (warehouseId = null) -> 120.00
    const globalPrice = await createProductPrice({
      productId: p1.id,
      priceTierId: testTier.id,
      warehouseId: null,
      unitPrice: 120.0,
      status: "ACTIVE",
    }, admin);
    console.log(" ✓ Created Global Tier Price: 120.00 ETB (warehouseId: null)");

    // Calculation from warehouse should resolve global tier price (120.00)
    let pricing1 = await calculateSalesOrderPricing({
      items: [{ productId: p1.id, quantity: 5 }],
      customerId: customer.id,
      warehouseId: warehouse.id,
      requestingUser: admin,
    });
    if (Number(pricing1.items[0].unitPrice) !== 120.0) {
      throw new Error(`Expected global tier price 120.00, got ${pricing1.items[0].unitPrice}`);
    }
    console.log(" ✓ Order resolved Global Tier Price 120.00 correctly!");

    // Now set a warehouse-specific override for warehouse -> 110.00
    const specificPrice = await createProductPrice({
      productId: p1.id,
      priceTierId: testTier.id,
      warehouseId: warehouse.id,
      unitPrice: 110.0,
      status: "ACTIVE",
    }, admin);
    console.log(` ✓ Created Warehouse-Specific Override: 110.00 ETB for ${warehouse.name}`);

    // Re-calculate for warehouse -> should pick 110.00
    pricing1 = await calculateSalesOrderPricing({
      items: [{ productId: p1.id, quantity: 5 }],
      customerId: customer.id,
      warehouseId: warehouse.id,
      requestingUser: admin,
    });
    if (Number(pricing1.items[0].unitPrice) !== 110.0) {
      throw new Error(`Expected warehouse override 110.00, got ${pricing1.items[0].unitPrice}`);
    }
    console.log(" ✓ Order correctly prioritized warehouse override (110.00) over global tier price!");

    // If ordered from otherWarehouse, should still fall back to global tier price (120.00)
    if (otherWarehouse) {
      const pricingOther = await calculateSalesOrderPricing({
        items: [{ productId: p1.id, quantity: 5 }],
        customerId: customer.id,
        warehouseId: otherWarehouse.id,
        requestingUser: admin,
      });
      if (Number(pricingOther.items[0].unitPrice) !== 120.0) {
        throw new Error(`Expected fallback to global tier price 120.00, got ${pricingOther.items[0].unitPrice}`);
      }
      console.log(" ✓ Order from other warehouse correctly fell back to Global Tier Price (120.00)!");
    }

    // -------------------------------------------------------------
    // TEST 2: Per-Unit Wholesale FIXED_AMOUNT Discount Math
    // -------------------------------------------------------------
    console.log("\n[TEST 2] Testing Per-Unit Wholesale Fixed Discount Calculation...");
    
    // Fixed discount: 10.00 ETB off per unit when buying 20+ units
    const fixedDiscount = await createDiscountRule({
      name: `TEST_FIXED_VOL_${Date.now()}`,
      productId: p1.id,
      priceTierId: testTier.id,
      warehouseId: warehouse.id,
      minQuantity: 20,
      discountType: "FIXED_AMOUNT",
      discountValue: 10.0,
      priority: 20,
      status: "ACTIVE",
    }, admin);

    // Order 20 units at unit price 110.00 -> subtotal = 2,200.00
    // Discount should be 10.00 * 20 = 200.00 ETB (NOT 10.00 flat!)
    const pricing2 = await calculateSalesOrderPricing({
      items: [{ productId: p1.id, quantity: 20 }],
      customerId: customer.id,
      warehouseId: warehouse.id,
      requestingUser: admin,
    });

    console.log(` -> Subtotal: ${pricing2.subtotal}, Discount: ${pricing2.discount}, Total: ${pricing2.total}`);
    if (Number(pricing2.items[0].discount) !== 200.0) {
      throw new Error(`Expected per-unit fixed discount 200.00 ETB (10 * 20), got ${pricing2.items[0].discount}`);
    }
    console.log(" ✓ FIXED_AMOUNT discount properly multiplied per unit: 10.00 * 20 = 200.00 ETB savings!");

    // -------------------------------------------------------------
    // TEST 3: Category-Based Discount Resolution
    // -------------------------------------------------------------
    console.log("\n[TEST 3] Testing Category-Based Discount Rules...");
    
    // Create a 15% discount for all products in category
    const catDiscount = await createDiscountRule({
      name: `TEST_CAT_DISC_${Date.now()}`,
      productId: null,
      categoryId: category.id,
      priceTierId: testTier.id,
      warehouseId: warehouse.id,
      minQuantity: 5,
      discountType: "PERCENTAGE",
      discountValue: 15.0,
      priority: 10,
      status: "ACTIVE",
    }, admin);

    // Calculate for p2 (which has no product-specific discount, but belongs to category)
    const pricing3 = await calculateSalesOrderPricing({
      items: [{ productId: p2.id, quantity: 10 }],
      customerId: customer.id,
      warehouseId: warehouse.id,
      requestingUser: admin,
    });

    if (pricing3.items[0].discountRuleId !== catDiscount.id) {
      throw new Error(`Expected category discount ${catDiscount.id}, got ${pricing3.items[0].discountRuleId}`);
    }
    const expectedCatSavings = Number(pricing3.items[0].subtotal) * 0.15;
    if (Math.abs(Number(pricing3.items[0].discount) - expectedCatSavings) > 0.05) {
      throw new Error(`Expected 15% discount ${expectedCatSavings}, got ${pricing3.items[0].discount}`);
    }
    console.log(" ✓ Category-based discount successfully matched and applied 15% off for product in category!");

    // -------------------------------------------------------------
    // TEST 4: Recurring Quota Windowing & Multi-Item Order
    // -------------------------------------------------------------
    console.log("\n[TEST 4] Testing Recurring Quota Period Bounds & Multi-Item Orders...");

    const quotaPeriodBounds = getQuotaPeriodBounds("MONTHLY", new Date());
    console.log(` ✓ Quota Monthly Bounds: ${quotaPeriodBounds.start.toISOString()} to ${quotaPeriodBounds.end.toISOString()}`);

    // Create a monthly quota of 50 units for p1
    const testQuota = await createSalesQuota({
      name: `TEST_QUOTA_${Date.now()}`,
      customerId: customer.id,
      productId: p1.id,
      warehouseId: warehouse.id,
      maxQuantity: 50,
      period: "MONTHLY",
      startsAt: new Date(Date.now() - 86400000),
      endsAt: new Date(Date.now() + 86400000 * 30),
      status: "ACTIVE",
    }, admin);

    // Create a mock sales order with p1 AND p2 to test multi-item quota usage creation without unique constraint violation
    const mockOrder = await prisma.salesOrder.create({
      data: {
        orderNumber: `TEST-SO-${Date.now()}`,
        customerId: customer.id,
        warehouseId: warehouse.id,
        source: "CUSTOMER_PORTAL",
        orderDate: new Date(),
        status: "PENDING_REVIEW",
        subtotal: 1000,
        discount: 0,
        tax: 0,
        total: 1000,
        createdById: admin.id,
        updatedById: admin.id,
        items: {
          create: [
            { productId: p1.id, quantity: 20, unitPrice: 50, total: 1000 },
            { productId: p2.id, quantity: 10, unitPrice: 50, total: 500 },
          ],
        },
      },
    });

    // Insert 2 quota usages for this same order (tests non-unique constraint fix)
    await prisma.salesQuotaUsage.create({
      data: {
        quotaId: testQuota.id,
        customerId: customer.id,
        salesOrderId: mockOrder.id,
        productId: p1.id,
        quantity: 20,
      },
    });
    console.log(" ✓ Recorded first item quota usage (20 units)");

    // Recording another usage for same order & quota (previously would crash @@unique([quotaId, salesOrderId]))
    await prisma.salesQuotaUsage.create({
      data: {
        quotaId: testQuota.id,
        customerId: customer.id,
        salesOrderId: mockOrder.id,
        productId: p2.id,
        quantity: 5,
      },
    });
    console.log(" ✓ Multi-item quota usage created without unique constraint collision!");

    // Check consumption
    const pricingQuota = await calculateSalesOrderPricing({
      items: [{ productId: p1.id, quantity: 30 }], // 25 consumed + 30 requested = 55 > 50!
      customerId: customer.id,
      warehouseId: warehouse.id,
      requestingUser: admin,
      enforceQuota: false, // preview mode -> warnings
    });

    if (pricingQuota.quotaWarnings.length === 0) {
      throw new Error("Expected quota warning when projected consumption (55) exceeds limit (50)");
    }
    console.log(` ✓ Quota warning correctly triggered: ${pricingQuota.quotaWarnings[0].consumed} / ${pricingQuota.quotaWarnings[0].maxQuantity} consumed`);

    // -------------------------------------------------------------
    // TEST 5: Quota Rollback on Cancellation / Rejection
    // -------------------------------------------------------------
    console.log("\n[TEST 5] Testing Automatic Quota Release on Order Rejection / Cancellation...");

    const usagesBefore = await prisma.salesQuotaUsage.count({
      where: { salesOrderId: mockOrder.id },
    });
    if (usagesBefore !== 2) {
      throw new Error(`Expected 2 usages before rollback, got ${usagesBefore}`);
    }

    // Call recordStatusChange with CANCELLED
    await recordStatusChange(mockOrder.id, "PENDING_REVIEW", "CANCELLED", "CANCELLED", "Customer cancelled", admin.id);

    const usagesAfter = await prisma.salesQuotaUsage.count({
      where: { salesOrderId: mockOrder.id },
    });
    if (usagesAfter !== 0) {
      throw new Error(`Expected 0 usages after cancellation rollback, got ${usagesAfter}`);
    }
    console.log(" ✓ Sales quota usages were automatically deleted and released upon order cancellation!");

    // Clean up created mock order
    await prisma.salesOrderItem.deleteMany({ where: { salesOrderId: mockOrder.id } });
    await prisma.salesOrderStatusHistory.deleteMany({ where: { salesOrderId: mockOrder.id } });
    await prisma.salesOrder.delete({ where: { id: mockOrder.id } });

    console.log("\n=== ALL 5 BUSINESS LOGIC AND REAL-WORLD FIXES VERIFIED SUCCESSFULLY! ===");
  } finally {
    // Cleanup test rules
    await prisma.salesQuotaUsage.deleteMany({ where: { quota: { name: { startsWith: "TEST_" } } } });
    await prisma.salesQuota.deleteMany({ where: { name: { startsWith: "TEST_" } } });
    await prisma.discountRule.deleteMany({ where: { name: { startsWith: "TEST_" } } });
    await prisma.productPrice.deleteMany({ where: { priceTierId: testTier.id } });
    await prisma.customer.update({
      where: { id: customer.id },
      data: { priceTierId: null },
    });
    await prisma.priceTier.delete({ where: { id: testTier.id } });
    console.log(" ✓ Test cleanup completed.");
  }
}

runTests()
  .catch((err) => {
    console.error("❌ TEST FAILED:", err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
