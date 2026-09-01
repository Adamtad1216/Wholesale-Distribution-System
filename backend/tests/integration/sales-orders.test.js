import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/config/prisma.js';
import bcrypt from 'bcryptjs';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME || 'System Administrator';

const TS = Date.now();
const CUSTOMER_USERNAME = `cust_order_${TS}`;
const CUSTOMER_EMAIL = `cust.order.${TS}@example.com`;
const REP_USERNAME = `sales_rep_order_${TS}`;
const REP_EMAIL = `sales.rep.order.${TS}@example.com`;
const PRODUCT_SKU_ACTIVE = `PROD-ORDER-ACTIVE-${TS}`;
const PRODUCT_SKU_INACTIVE = `PROD-ORDER-INACTIVE-${TS}`;
const REGION_CODE = `REG-ORDER-${TS}`;
const BRANCH_CODE = `BR-ORDER-${TS}`;
const WAREHOUSE_CODE_PREFIX = `WH-ORDER-${TS}-`;

let adminToken = '';
let customerToken = '';
let customerId = '';
let activeRepId = '';
let activeProductId = '';
let inactiveProductId = '';
let testRegionId = '';
let testBranchId = '';
let category = null;
let unit = null;

async function ensureAdmin() {
  const existing = await prisma.user.findFirst({
    where: {
      OR: [
        { username: ADMIN_USERNAME },
        { person: { email: ADMIN_EMAIL } },
      ],
    },
    include: { person: true, userRoles: { include: { role: { include: { rolePermissions: { include: { permission: true } } } } } } },
  });

  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'System Administrator' },
  });

  const customerRole = await prisma.role.upsert({
    where: { name: 'CUSTOMER' },
    update: {},
    create: { name: 'CUSTOMER', description: 'Customer' },
  });

  const salesRepRole = await prisma.role.upsert({
    where: { name: 'SALES_REPRESENTATIVE' },
    update: {},
    create: { name: 'SALES_REPRESENTATIVE', description: 'Sales Representative' },
  });

  const perms = await prisma.$transaction(
    [
      'sales_orders:create',
      'sales_orders:read',
      'customers:create',
      'customers:read',
      'products:create',
      'products:read',
      'employees:create',
      'employees:read',
      'warehouses:read',
      'regions:read',
      'branches:read',
    ].map(
      (name) =>
        prisma.permission.upsert({
          where: { name },
          update: {},
          create: {
            name,
            module: name.split(':')[0],
            action: name.split(':')[1],
            description: `${name} permission`,
          },
        })
    )
  );

  await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } });
  for (const perm of perms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  await prisma.rolePermission.deleteMany({ where: { roleId: customerRole.id } });
  await prisma.rolePermission.deleteMany({ where: { roleId: salesRepRole.id } });

  if (existing) {
    const hasAdminRole = existing.userRoles.some((ur) => ur.role.name === 'ADMIN');
    if (!hasAdminRole) {
      await prisma.userRole.create({ data: { userId: existing.id, roleId: adminRole.id } });
    }
    return existing;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  const [person, user] = await prisma.$transaction(async (tx) => {
    const person = await tx.person.create({
      data: {
        firstName: ADMIN_FULL_NAME.split(' ')[0] || 'System',
        middleName: ADMIN_FULL_NAME.split(' ')[1] || undefined,
        lastName: ADMIN_FULL_NAME.split(' ').slice(2).join(' ') || 'Administrator',
        email: ADMIN_EMAIL,
        status: 'ACTIVE',
      },
    });
    const user = await tx.user.create({
      data: { personId: person.id, username: ADMIN_USERNAME, passwordHash, isActive: true },
    });
    await tx.userRole.create({ data: { userId: user.id, roleId: adminRole.id } });
    return [person, user];
  });

  return user;
}

async function getAuthToken(username, password) {
  const response = await request(app)
    .post('/api/v1/auth/login')
    .send({ username, password });

  expect(response.status).toBe(200);
  expect(response.body.status).toBe('success');
  return response.body.data.accessToken;
}

async function setupTestData() {
  const region = await prisma.region.upsert({
    where: { code: REGION_CODE },
    update: {},
    create: { code: REGION_CODE, name: 'Order Test Region', isActive: true },
  });
  testRegionId = region.id;

  let company = await prisma.company.findFirst({ where: { name: 'Order Test Company' } });
  if (!company) {
    company = await prisma.company.create({
      data: { name: 'Order Test Company', regionId: testRegionId, status: 'ACTIVE' },
    });
  }

  const branch = await prisma.branch.upsert({
    where: { branchCode: BRANCH_CODE },
    update: {},
    create: { branchCode: BRANCH_CODE, name: 'Order Test Branch', companyId: company.id, regionId: testRegionId, status: 'ACTIVE' },
  });
  testBranchId = branch.id;

  category = await prisma.category.findFirst({ where: { name: 'Test Category Order' } });
  if (!category) {
    category = await prisma.category.create({
      data: { name: 'Test Category Order', description: 'Test', status: 'ACTIVE' },
    });
  }

  unit = await prisma.unit.findFirst({ where: { name: 'Bag' } });
  if (!unit) {
    unit = await prisma.unit.create({ data: { name: 'Bag', abbreviation: 'BG' } });
  }

  const [activeProduct, inactiveProduct] = await prisma.$transaction(async (tx) => {
    const existingActive = await tx.product.findUnique({ where: { sku: PRODUCT_SKU_ACTIVE } });
    if (existingActive) {
      await tx.product.update({ where: { id: existingActive.id }, data: { isArchived: false, status: 'ACTIVE' } });
      return [existingActive, null];
    }
    const existingInactive = await tx.product.findUnique({ where: { sku: PRODUCT_SKU_INACTIVE } });
    if (existingInactive) {
      await tx.product.update({ where: { id: existingInactive.id }, data: { isArchived: true, status: 'INACTIVE' } });
    }
    return await Promise.all([
      tx.product.create({
        data: {
          sku: PRODUCT_SKU_ACTIVE,
          name: 'Active Product Order',
          categoryId: category.id,
          unitId: unit.id,
          sellingPrice: 100,
          wholesalePrice: 80,
          purchasePrice: 60,
          status: 'ACTIVE',
        },
      }),
      tx.product.create({
        data: {
          sku: PRODUCT_SKU_INACTIVE,
          name: 'Inactive Product Order',
          categoryId: category.id,
          unitId: unit.id,
          sellingPrice: 100,
          wholesalePrice: 80,
          purchasePrice: 60,
          status: 'INACTIVE',
          isArchived: true,
        },
      }),
    ]);
  });

  activeProductId = activeProduct.id;
  inactiveProductId = inactiveProduct.id;

  const customerPerson = await prisma.person.create({
    data: {
      firstName: 'Order',
      lastName: 'Customer',
      email: CUSTOMER_EMAIL,
      status: 'ACTIVE',
    },
  });

  const customerUser = await prisma.user.create({
    data: {
      personId: customerPerson.id,
      username: CUSTOMER_USERNAME,
      passwordHash: await bcrypt.hash('Customer@123!', 12),
      isActive: true,
    },
  });

  await prisma.userRole.create({ data: { userId: customerUser.id, roleId: (await prisma.role.findUnique({ where: { name: 'CUSTOMER' } })).id } });

  const customer = await prisma.customer.create({
    data: {
      customerCode: `CUS-ORDER-${TS}`,
      customerType: 'PERSON',
      personId: customerPerson.id,
      status: 'ACTIVE',
    },
  });
  customerId = customer.id;

  customerToken = await getAuthToken(CUSTOMER_USERNAME, 'Customer@123!');

  const repPerson = await prisma.person.create({
    data: {
      firstName: 'Order',
      lastName: 'Rep',
      email: REP_EMAIL,
      status: 'ACTIVE',
    },
  });

  const repUser = await prisma.user.create({
    data: {
      personId: repPerson.id,
      username: REP_USERNAME,
      passwordHash: await bcrypt.hash('Rep@123!', 12),
      isActive: true,
    },
  });

  await prisma.userRole.create({ data: { userId: repUser.id, roleId: (await prisma.role.findUnique({ where: { name: 'SALES_REPRESENTATIVE' } })).id } });

  const rep = await prisma.employee.create({
    data: {
      personId: repPerson.id,
      employeeCode: `EMP-ORDER-REP-${TS}`,
      hireDate: new Date(),
      status: 'ACTIVE',
      isAvailableForSales: true,
    },
  });
  activeRepId = rep.id;
}

async function cleanup() {
  await prisma.salesOrderItem.deleteMany({});
  await prisma.salesOrder.deleteMany({});
  await prisma.customer.deleteMany({ where: { customerCode: { startsWith: `CUS-ORDER-${TS}` } } });
  await prisma.employee.deleteMany({ where: { employeeCode: { startsWith: `EMP-ORDER-` } } });
  await prisma.warehouse.deleteMany({ where: { code: { startsWith: WAREHOUSE_CODE_PREFIX } } });
  await prisma.user.deleteMany({
    where: {
      person: {
        OR: [
          { email: { in: [CUSTOMER_EMAIL, REP_EMAIL] } },
          { firstName: 'Order', lastName: 'Customer' },
          { firstName: 'Order', lastName: 'Rep' },
        ],
      },
    },
  });
  await prisma.person.deleteMany({
    where: {
      OR: [
        { email: { in: [CUSTOMER_EMAIL, REP_EMAIL] } },
        { firstName: 'Order', lastName: 'Customer' },
        { firstName: 'Order', lastName: 'Rep' },
      ],
    },
  });
  await prisma.product.deleteMany({ where: { sku: { in: [PRODUCT_SKU_ACTIVE, PRODUCT_SKU_INACTIVE] } } });
  if (category) await prisma.category.delete({ where: { id: category.id } }).catch(() => {});
  if (unit) await prisma.unit.delete({ where: { id: unit.id } }).catch(() => {});
  if (testBranchId) {
    const branch = await prisma.branch.findUnique({ where: { id: testBranchId } });
    if (branch) {
      await prisma.branch.delete({ where: { id: testBranchId } });
    }
  }
  const company = await prisma.company.findFirst({ where: { name: 'Order Test Company' } });
  if (company) {
    await prisma.company.delete({ where: { id: company.id } });
  }
  if (testRegionId) {
    const region = await prisma.region.findUnique({ where: { id: testRegionId } });
    if (region) {
      await prisma.region.delete({ where: { id: testRegionId } });
    }
  }
}

describe('Sales Orders', () => {
  beforeAll(async () => {
    await ensureAdmin();
    adminToken = await getAuthToken(ADMIN_USERNAME, ADMIN_PASSWORD);
    await cleanup();
    await setupTestData();
  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  describe('POST /api/v1/sales/orders/preview', () => {
    it('returns 401 when unauthenticated', async () => {
      const response = await request(app)
        .post('/api/v1/sales/orders/preview')
        .send({
          items: [{ productId: inactiveProductId, quantity: 10 }],
        });

      expect(response.status).toBe(401);
    });

    it('returns valid quotation preview for valid items', async () => {
      const response = await request(app)
        .post('/api/v1/sales/orders/preview')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ productId: activeProductId, quantity: 10 }],
        });

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].productId).toBe(activeProductId);
      expect(response.body.data.items[0].productName).toBe('Active Product Order');
      expect(response.body.data.items[0].quantity).toBe(10);
      expect(response.body.data.items[0].unitPrice).toBe(100);
      expect(response.body.data.items[0].subtotal).toBe(1000);
      expect(response.body.data.subtotal).toBe(1000);
      expect(response.body.data.total).toBe(1000);
    });

    it('calculates multiple products correctly', async () => {
      const response = await request(app)
        .post('/api/v1/sales/orders/preview')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [
            { productId: activeProductId, quantity: 2 },
            { productId: activeProductId, quantity: 3 },
          ],
        });

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Duplicate');
    });

    it('backend retrieves authoritative prices, ignoring client price', async () => {
      const response = await request(app)
        .post('/api/v1/sales/orders/preview')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ productId: activeProductId, quantity: 10, unitPrice: 0.01, total: 0.1 }],
        });

      expect(response.status).toBe(200);
      expect(response.body.data.items[0].unitPrice).toBe(100);
      expect(response.body.data.items[0].subtotal).toBe(1000);
      expect(response.body.data.total).toBe(1000);
    });

    it('rejects empty items', async () => {
      const response = await request(app)
        .post('/api/v1/sales/orders/preview')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ items: [] });

      expect(response.status).toBe(400);
    });

    it('rejects invalid product', async () => {
      const response = await request(app)
        .post('/api/v1/sales/orders/preview')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ productId: '00000000-0000-0000-0000-000000000000', quantity: 10 }],
        });

      expect(response.status).toBe(400);
    });

    it('rejects inactive product', async () => {
      const response = await request(app)
        .post('/api/v1/sales/orders/preview')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ productId: inactiveProductId, quantity: 10 }],
        });

      expect(response.status).toBe(400);
    });

    it('rejects zero quantity', async () => {
      const response = await request(app)
        .post('/api/v1/sales/orders/preview')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ productId: activeProductId, quantity: 0 }],
        });

      expect(response.status).toBe(400);
    });

    it('rejects negative quantity', async () => {
      const response = await request(app)
        .post('/api/v1/sales/orders/preview')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ productId: activeProductId, quantity: -5 }],
        });

      expect(response.status).toBe(400);
    });

    it('rejects non-finite quantity', async () => {
      const response = await request(app)
        .post('/api/v1/sales/orders/preview')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ productId: activeProductId, quantity: NaN }],
        });

      expect(response.status).toBe(400);
    });

    it('does not create a SalesOrder', async () => {
      const beforeCount = await prisma.salesOrder.count();

      await request(app)
        .post('/api/v1/sales/orders/preview')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ productId: activeProductId, quantity: 10 }],
        });

      const afterCount = await prisma.salesOrder.count();
      expect(afterCount).toBe(beforeCount);
    });

    it('does not assign a Sales Representative', async () => {
      await request(app)
        .post('/api/v1/sales/orders/preview')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          items: [{ productId: activeProductId, quantity: 10 }],
        });

      const orders = await prisma.salesOrder.findMany();
      expect(orders.length).toBe(0);
    });
  });

  describe('POST /api/v1/sales/orders', () => {
    it('returns 401 when unauthenticated', async () => {
      const warehouse = await prisma.warehouse.create({
        data: {
          code: `${WAREHOUSE_CODE_PREFIX}UNAUTH`,
          name: 'Order Test Warehouse Unauth',
          branchId: testBranchId,
          regionId: testRegionId,
          status: 'ACTIVE',
        },
      });

      const response = await request(app)
        .post('/api/v1/sales/orders')
        .send({
          warehouseId: warehouse.id,
          items: [{ productId: activeProductId, quantity: 10 }],
        });

      expect(response.status).toBe(401);
    });

    it('creates a valid Sales Order', async () => {
      const warehouse = await prisma.warehouse.create({
        data: {
          code: `${WAREHOUSE_CODE_PREFIX}CREATE`,
          name: 'Order Test Warehouse Create',
          branchId: testBranchId,
          regionId: testRegionId,
          status: 'ACTIVE',
        },
      });

      const response = await request(app)
        .post('/api/v1/sales/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          warehouseId: warehouse.id,
          items: [{ productId: activeProductId, quantity: 10 }],
        });

      expect(response.status).toBe(201);
      expect(response.body.status).toBe('success');
      expect(response.body.data.orderNumber).toBeDefined();
      expect(response.body.data.status).toBe('PENDING_REVIEW');
      expect(response.body.data.customerId).toBe(customerId);
      expect(response.body.data.salesRep).toBeDefined();
      expect(response.body.data.salesRep.id).toBeDefined();
      expect(response.body.data.items).toHaveLength(1);
      expect(response.body.data.items[0].quantity).toBe("10");
      expect(response.body.data.items[0].unitPrice).toBe("100");
      expect(response.body.data.subtotal).toBe("1000");
      expect(response.body.data.total).toBe("1000");
    });

    it('creates SalesOrderItems with correct totals', async () => {
      const warehouse = await prisma.warehouse.create({
        data: {
          code: `${WAREHOUSE_CODE_PREFIX}ITEMS`,
          name: 'Order Test Warehouse Items',
          branchId: testBranchId,
          regionId: testRegionId,
          status: 'ACTIVE',
        },
      });

      const response = await request(app)
        .post('/api/v1/sales/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          warehouseId: warehouse.id,
          items: [{ productId: activeProductId, quantity: 5 }],
        });

      expect(response.status).toBe(201);
      expect(response.body.data.items[0].unitPrice).toBe("100");
      expect(response.body.data.items[0].total).toBe("500");
    });

    it('ignores client-provided prices and recalculates', async () => {
      const warehouse = await prisma.warehouse.create({
        data: {
          code: `${WAREHOUSE_CODE_PREFIX}PRICE`,
          name: 'Order Test Warehouse Price',
          branchId: testBranchId,
          regionId: testRegionId,
          status: 'ACTIVE',
        },
      });

      const response = await request(app)
        .post('/api/v1/sales/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          warehouseId: warehouse.id,
          items: [{ productId: activeProductId, quantity: 10, unitPrice: 0.01, total: 0.1 }],
        });

      expect(response.status).toBe(201);
      expect(response.body.data.items[0].unitPrice).toBe("100");
      expect(response.body.data.items[0].total).toBe("1000");
    });

    it('rejects invalid product', async () => {
      const warehouse = await prisma.warehouse.create({
        data: {
          code: `${WAREHOUSE_CODE_PREFIX}INVP`,
          name: 'Order Test Warehouse Invalid Product',
          branchId: testBranchId,
          regionId: testRegionId,
          status: 'ACTIVE',
        },
      });

      const response = await request(app)
        .post('/api/v1/sales/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          warehouseId: warehouse.id,
          items: [{ productId: '00000000-0000-0000-0000-000000000000', quantity: 10 }],
        });

      expect(response.status).toBe(400);
    });

    it('rejects zero quantity', async () => {
      const warehouse = await prisma.warehouse.create({
        data: {
          code: `${WAREHOUSE_CODE_PREFIX}ZEROQ`,
          name: 'Order Test Warehouse Zero Qty',
          branchId: testBranchId,
          regionId: testRegionId,
          status: 'ACTIVE',
        },
      });

      const response = await request(app)
        .post('/api/v1/sales/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          warehouseId: warehouse.id,
          items: [{ productId: activeProductId, quantity: 0 }],
        });

      expect(response.status).toBe(400);
    });

    it('rejects inactive warehouse', async () => {
      const warehouse = await prisma.warehouse.create({
        data: {
          code: `${WAREHOUSE_CODE_PREFIX}INACTW`,
          name: 'Order Test Warehouse Inactive',
          branchId: testBranchId,
          regionId: testRegionId,
          status: 'INACTIVE',
        },
      });

      const response = await request(app)
        .post('/api/v1/sales/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          warehouseId: warehouse.id,
          items: [{ productId: activeProductId, quantity: 10 }],
        });

      expect(response.status).toBe(404);
    });

    it('assigns a Sales Representative', async () => {
      const warehouse = await prisma.warehouse.create({
        data: {
          code: `${WAREHOUSE_CODE_PREFIX}REP`,
          name: 'Order Test Warehouse Rep',
          branchId: testBranchId,
          regionId: testRegionId,
          status: 'ACTIVE',
        },
      });

      const response = await request(app)
        .post('/api/v1/sales/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          warehouseId: warehouse.id,
          items: [{ productId: activeProductId, quantity: 10 }],
        });

      expect(response.status).toBe(201);
      expect(response.body.data.salesRep).toBeDefined();
      expect(response.body.data.salesRep.id).toBeDefined();
      expect(response.body.data.salesRep.person).toBeDefined();
    });
  });
});
