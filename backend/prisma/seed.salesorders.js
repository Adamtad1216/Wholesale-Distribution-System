import 'dotenv/config';
import prisma from '../src/config/prisma.js';

async function main() {
  console.log('--- Seeding Sales Orders for Testing Stock Reservation ---');

  // 1. Get warehouses with stocks
  const warehouses = await prisma.warehouse.findMany({
    where: { isArchived: false, status: 'ACTIVE' },
    include: {
      stocks: {
        where: { isArchived: false },
        include: { product: true },
      },
    },
  });

  if (warehouses.length === 0) {
    throw new Error('No active warehouses found. Run seed.sales.js or seed.employees.js first.');
  }

  // 2. Get active customers
  const customers = await prisma.customer.findMany({
    where: { isArchived: false },
    include: { person: true, organization: true },
  });

  if (customers.length === 0) {
    throw new Error('No active customers found.');
  }

  // 3. Get an employee to act as sales rep
  const salesRep = await prisma.employee.findFirst({
    where: { isArchived: false, status: 'ACTIVE' },
  });

  // 4. Ensure products and stock exist in at least the first 2 warehouses
  let products = await prisma.product.findMany({ where: { isArchived: false } });
  if (products.length === 0) {
    throw new Error('No products found. Run seed.sales.js first.');
  }

  for (const wh of warehouses) {
    for (const prod of products.slice(0, 3)) {
      await prisma.warehouseStock.upsert({
        where: { warehouseId_productId: { warehouseId: wh.id, productId: prod.id } },
        update: {
          quantity: 150,
          availableQuantity: 150,
          reservedQuantity: 0,
          isArchived: false,
          archivedAt: null,
        },
        create: {
          warehouseId: wh.id,
          productId: prod.id,
          quantity: 150,
          availableQuantity: 150,
          reservedQuantity: 0,
          minimumStock: 10,
          reorderLevel: 20,
        },
      });
    }
  }
  console.log('Stock availability verified/updated across warehouses.');

  // 5. Create 4 Realistic Sales Orders
  const orderConfigs = [
    {
      orderNumber: 'SO-2026-0001',
      status: 'APPROVED',
      notes: 'Corporate restock order',
    },
    {
      orderNumber: 'SO-2026-0002',
      status: 'PENDING_REVIEW',
      notes: 'Wholesale distributor replenishment',
    },
    {
      orderNumber: 'SO-2026-0003',
      status: 'APPROVED',
      notes: 'Priority regional delivery',
    },
    {
      orderNumber: 'SO-2026-0004',
      status: 'PENDING_REVIEW',
      notes: 'Standard retail branch order',
    },
  ];

  for (let i = 0; i < orderConfigs.length; i++) {
    const config = orderConfigs[i];
    const customer = customers[i % customers.length];
    const warehouse = warehouses[i % warehouses.length];

    // Pick 2 products
    const orderProducts = products.slice(0, 2);

    let subtotal = 0;
    const itemsData = orderProducts.map((p, idx) => {
      const qty = (idx + 1) * 10; // 10, 20
      const price = Number(p.sellingPrice || 100);
      const itemSubtotal = qty * price;
      const itemTax = itemSubtotal * 0.15;
      const itemTotal = itemSubtotal + itemTax;
      subtotal += itemSubtotal;

      return {
        productId: p.id,
        quantity: qty,
        unitPrice: price,
        discount: 0,
        tax: itemTax,
        total: itemTotal,
      };
    });

    const tax = subtotal * 0.15;
    const total = subtotal + tax;

    const existingOrder = await prisma.salesOrder.findUnique({
      where: { orderNumber: config.orderNumber },
    });

    if (existingOrder) {
      console.log(`Order ${config.orderNumber} already exists. Updating status to ${config.status}...`);
      await prisma.salesOrder.update({
        where: { id: existingOrder.id },
        data: {
          status: config.status,
          warehouseId: warehouse.id,
          customerId: customer.id,
          isArchived: false,
        },
      });
    } else {
      const order = await prisma.salesOrder.create({
        data: {
          orderNumber: config.orderNumber,
          customerId: customer.id,
          warehouseId: warehouse.id,
          salesRepId: salesRep ? salesRep.id : null,
          source: 'CUSTOMER_PORTAL',
          orderDate: new Date(),
          requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          status: config.status,
          subtotal,
          discount: 0,
          tax,
          total,
          deliveryAddressText: 'Addis Ababa Bole Sub-City, Compound 4',
          items: {
            create: itemsData,
          },
        },
        include: {
          items: true,
        },
      });

      const custName = customer.organization?.name ||
        `${customer.person?.firstName || ''} ${customer.person?.lastName || ''}`.trim() ||
        'Customer';
      console.log(`Created ${config.orderNumber} (${config.status}) for ${custName} @ ${warehouse.name} with ${itemsData.length} items`);
    }
  }

  console.log('--- Sales Order Seeding Completed Successfully ---');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
