import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/config/prisma.js';
import bcrypt from 'bcryptjs';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Clone@123';
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME || 'System Administrator';

const TS = Date.now();
const CUSTOMER_USERNAME = `cust_pricing_${TS}`;
const CUSTOMER_EMAIL = `cust.pricing.${TS}@example.com`;
const REGION_CODE = `REG-PRICING-${TS}`;
const BRANCH_CODE = `BR-PRICING-${TS}`;
const WAREHOUSE_A_CODE = `WH-PRICING-A-${TS}`;
const WAREHOUSE_B_CODE = `WH-PRICING-B-${TS}`;
const PRODUCT_SKU = `PROD-PRICING-${TS}`;
const RETAIL_TIER_NAME = `RetailTest-${TS}`;
const WHOLESALE_TIER_NAME = `WholesaleTest-${TS}`;
const VIP_TIER_NAME = `VipTest-${TS}`;
const DISTRIBUTOR_TIER_NAME = `DistributorTest-${TS}`;

let adminToken = '';
let customerToken = '';
let customerId = '';
let retailTierId = '';
let wholesaleTierId = '';
let vipTierId = '';
let distributorTierId = '';
let warehouseAId = '';
let warehouseBId = '';
let productId = '';
let regionId = '';
let branchId = '';
let unit = null;
let category = null;

async function ensureAdmin() {
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

  const perms = await prisma.$transaction(
    [
      'PRICE_TIER_VIEW',
      'PRICE_TIER_CREATE',
      'PRICE_TIER_UPDATE',
      'PRICE_TIER_DELETE',
      'PRODUCT_PRICE_VIEW',
      'PRODUCT_PRICE_CREATE',
      'PRODUCT_PRICE_UPDATE',
      'PRODUCT_PRICE_DELETE',
      'DISCOUNT_VIEW',
      'DISCOUNT_CREATE',
      'DISCOUNT_UPDATE',
      'DISCOUNT_DELETE',
      'QUOTA_VIEW',
      'QUOTA_CREATE',
      'QUOTA_UPDATE',
      'QUOTA_DELETE',
      'sales_orders:read',
      'sales_orders:create',
      'customers:create',
      'customers:read',
      'products:create',
      'products:read',
      'employees:create',
      'employees:read',
      'warehouses:read',
      'regions:read',
      'branches:read',
    ].map((name) =>
      prisma.permission.upsert({
        where: { name },
        update: {},
        create: {
          name,
          module: name.includes(':') ? name.split(':')[0] : 'pricing',
          action: name.includes(':') ? name.split(':')[1] : name.toLowerCase(),
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
}

async function loginAdmin() {
  const r = await request(app).post('/api/v1/auth/login').send({
    username: ADMIN_USERNAME,
    password: ADMIN_PASSWORD,
  });
  if (r.status !== 200) {
    console.error('login failed:', r.status, r.body);
  }
  expect(r.status).toBe(200);
  return r.body.data.accessToken;
}

async function setupTestData() {
  const region = await prisma.region.upsert({
    where: { code: REGION_CODE },
    update: {},
    create: { code: REGION_CODE, name: 'Pricing Test Region', isActive: true },
  });
  regionId = region.id;

  let company = await prisma.company.findFirst({ where: { name: 'Pricing Test Company' } });
  if (!company) {
    company = await prisma.company.create({
      data: { name: 'Pricing Test Company', regionId, status: 'ACTIVE' },
    });
  }

  const branch = await prisma.branch.upsert({
    where: { branchCode: BRANCH_CODE },
    update: {},
    create: {
      branchCode: BRANCH_CODE,
      name: 'Pricing Test Branch',
      companyId: company.id,
      regionId,
      status: 'ACTIVE',
    },
  });
  branchId = branch.id;

  const warehouseA = await prisma.warehouse.upsert({
    where: { code: WAREHOUSE_A_CODE },
    update: {},
    create: {
      code: WAREHOUSE_A_CODE,
      name: 'Warehouse A (Addis)',
      branchId: branch.id,
      regionId,
      status: 'ACTIVE',
    },
  });
  warehouseAId = warehouseA.id;

  const warehouseB = await prisma.warehouse.upsert({
    where: { code: WAREHOUSE_B_CODE },
    update: {},
    create: {
      code: WAREHOUSE_B_CODE,
      name: 'Warehouse B (Dire Dawa)',
      branchId: branch.id,
      regionId,
      status: 'ACTIVE',
    },
  });
  warehouseBId = warehouseB.id;

  category = await prisma.category.findFirst({ where: { name: 'Pricing Test Category' } });
  if (!category) {
    category = await prisma.category.create({
      data: { name: 'Pricing Test Category', status: 'ACTIVE' },
    });
  }

  unit = await prisma.unit.findFirst({ where: { name: 'PricingUnit' } });
  if (!unit) {
    unit = await prisma.unit.create({ data: { name: 'PricingUnit', abbreviation: 'PU' } });
  }

  const product = await prisma.product.upsert({
    where: { sku: PRODUCT_SKU },
    update: { isArchived: false, status: 'ACTIVE' },
    create: {
      sku: PRODUCT_SKU,
      name: 'Pricing Test Coca',
      categoryId: category.id,
      unitId: unit.id,
      sellingPrice: 100,
      wholesalePrice: 95,
      purchasePrice: 60,
      status: 'ACTIVE',
    },
  });
  productId = product.id;

  const customerPerson = await prisma.person.create({
    data: {
      firstName: 'Pricing',
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

  await prisma.userRole.create({
    data: {
      userId: customerUser.id,
      roleId: (await prisma.role.findUnique({ where: { name: 'CUSTOMER' } })).id,
    },
  });

  const customer = await prisma.customer.create({
    data: {
      customerCode: `CUS-PRICING-${TS}`,
      customerType: 'PERSON',
      personId: customerPerson.id,
      status: 'ACTIVE',
    },
  });
  customerId = customer.id;

  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ username: CUSTOMER_USERNAME, password: 'Customer@123!' });
  expect(loginRes.status).toBe(200);
  customerToken = loginRes.body.data.accessToken;

  const repPerson = await prisma.person.create({
    data: {
      firstName: 'Pricing',
      lastName: 'Rep',
      email: `sales.rep.pricing.${TS}@example.com`,
      status: 'ACTIVE',
    },
  });
  const repUser = await prisma.user.create({
    data: {
      personId: repPerson.id,
      username: `salesrep_pricing_${TS}`,
      passwordHash: await bcrypt.hash('Rep@123!', 12),
      isActive: true,
    },
  });
  await prisma.userRole.create({
    data: {
      userId: repUser.id,
      roleId: (await prisma.role.findUnique({ where: { name: 'SALES_REPRESENTATIVE' } })).id,
    },
  });
  await prisma.employee.create({
    data: {
      personId: repPerson.id,
      employeeCode: `EMP-PRICING-${TS}`,
      hireDate: new Date(),
      status: 'ACTIVE',
      isAvailableForSales: true,
      branchId: branch.id,
    },
  });
}

async function cleanup() {
  await prisma.salesQuotaUsage.deleteMany({});
  await prisma.salesQuota.deleteMany({ where: { name: { contains: 'PricingTest' } } });
  await prisma.salesOrderItem.deleteMany({});
  if (customerId) {
    await prisma.salesOrder.deleteMany({ where: { customerId } });
  } else {
    await prisma.salesOrder.deleteMany({});
  }
  await prisma.discountRule.deleteMany({ where: { name: { contains: 'PricingTest' } } });
  await prisma.productPrice.deleteMany({});
  if (customerId) {
    await prisma.customer.update({ where: { id: customerId }, data: { priceTierId: null } }).catch(() => {});
  }
  await prisma.priceTier.deleteMany({ where: { name: { in: [RETAIL_TIER_NAME, WHOLESALE_TIER_NAME, VIP_TIER_NAME, DISTRIBUTOR_TIER_NAME] } } });
  if (customerId) {
    await prisma.customer.deleteMany({ where: { id: customerId } });
  }
  if (productId) {
    await prisma.product.deleteMany({ where: { id: productId } });
  }
  if (category) await prisma.category.delete({ where: { id: category.id } }).catch(() => {});
  if (unit) await prisma.unit.delete({ where: { id: unit.id } }).catch(() => {});
  if (warehouseAId) await prisma.warehouse.delete({ where: { id: warehouseAId } }).catch(() => {});
  if (warehouseBId) await prisma.warehouse.delete({ where: { id: warehouseBId } }).catch(() => {});
  if (branchId) {
    await prisma.branch.delete({ where: { id: branchId } }).catch(() => {});
  }
  await prisma.company.deleteMany({ where: { name: 'Pricing Test Company' } }).catch(() => {});
  if (regionId) {
    await prisma.region.delete({ where: { id: regionId } }).catch(() => {});
  }
  await prisma.user.deleteMany({ where: { username: CUSTOMER_USERNAME } }).catch(() => {});
  await prisma.person.deleteMany({ where: { email: CUSTOMER_EMAIL } }).catch(() => {});
  await prisma.user.deleteMany({ where: { username: `salesrep_pricing_${TS}` } }).catch(() => {});
  await prisma.person.deleteMany({ where: { email: `sales.rep.pricing.${TS}@example.com` } }).catch(() => {});
  await prisma.employee.deleteMany({ where: { employeeCode: `EMP-PRICING-${TS}` } }).catch(() => {});
}

describe('Pricing, Discounts and Quotas', () => {
  beforeAll(async () => {
    await ensureAdmin();
    adminToken = await loginAdmin();
    await cleanup();
    await setupTestData();
  });

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  describe('Price Tiers', () => {
    it('admin can create a dynamic Price Tier', async () => {
      const res = await request(app)
        .post('/api/v1/pricing/tiers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: RETAIL_TIER_NAME, description: 'Retail pricing', priority: 1 });

      expect(res.status).toBe(201);
      expect(res.body.data.name).toBe(RETAIL_TIER_NAME);
      retailTierId = res.body.data.id;

      const r2 = await request(app)
        .post('/api/v1/pricing/tiers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: WHOLESALE_TIER_NAME, description: 'Wholesale pricing', priority: 10 });
      expect(r2.status).toBe(201);
      wholesaleTierId = r2.body.data.id;

      const r3 = await request(app)
        .post('/api/v1/pricing/tiers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: VIP_TIER_NAME, priority: 20 });
      expect(r3.status).toBe(201);
      vipTierId = r3.body.data.id;

      const r4 = await request(app)
        .post('/api/v1/pricing/tiers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: DISTRIBUTOR_TIER_NAME, priority: 30 });
      expect(r4.status).toBe(201);
      distributorTierId = r4.body.data.id;
    });

    it('rejects duplicate tier names', async () => {
      const res = await request(app)
        .post('/api/v1/pricing/tiers')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: RETAIL_TIER_NAME });
      expect(res.status).toBe(409);
    });

    it('admin can list price tiers', async () => {
      const res = await request(app)
        .get('/api/v1/pricing/tiers')
        .set('Authorization', `Bearer ${adminToken}`);
      if (res.status !== 200) console.error('LIST TIERS ERROR', res.status, res.body);
      expect(res.status).toBe(200);
      expect(res.body.data.find((t) => t.name === RETAIL_TIER_NAME)).toBeDefined();
    });

    it('admin can get a price tier by id', async () => {
      const res = await request(app)
        .get(`/api/v1/pricing/tiers/${retailTierId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.name).toBe(RETAIL_TIER_NAME);
    });

    it('admin can update a price tier', async () => {
      const res = await request(app)
        .patch(`/api/v1/pricing/tiers/${retailTierId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Updated description', priority: 5 });
      expect(res.status).toBe(200);
      expect(res.body.data.description).toBe('Updated description');
      expect(res.body.data.priority).toBe(5);
    });

    it('admin can activate and deactivate a price tier', async () => {
      const deactivateRes = await request(app)
        .post(`/api/v1/pricing/tiers/${retailTierId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(deactivateRes.status).toBe(200);
      expect(deactivateRes.body.data.status).toBe('INACTIVE');

      const activateRes = await request(app)
        .post(`/api/v1/pricing/tiers/${retailTierId}/activate`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(activateRes.status).toBe(200);
      expect(activateRes.body.data.status).toBe('ACTIVE');
    });

    it('unauthorized users cannot manage price tiers', async () => {
      const res = await request(app)
        .post('/api/v1/pricing/tiers')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'ShouldFail' });
      expect(res.status).toBe(403);
    });

    it('admin can assign customer to a tier', async () => {
      const res = await request(app)
        .patch(`/api/v1/pricing/tiers/${wholesaleTierId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({});
      expect(res.status).toBe(400);

      await prisma.customer.update({
        where: { id: customerId },
        data: { priceTierId: wholesaleTierId },
      });

      const getRes = await request(app)
        .get(`/api/v1/customers/${customerId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(getRes.status).toBe(200);
    });
  });

  describe('Product Prices', () => {
    it('admin can create product prices per warehouse', async () => {
      const aRes = await request(app)
        .post('/api/v1/pricing/product-prices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId,
          priceTierId: wholesaleTierId,
          warehouseId: warehouseAId,
          unitPrice: 95,
        });
      expect(aRes.status).toBe(201);
      expect(aRes.body.data.unitPrice).toBe(95);

      const bRes = await request(app)
        .post('/api/v1/pricing/product-prices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId,
          priceTierId: wholesaleTierId,
          warehouseId: warehouseBId,
          unitPrice: 100,
        });
      expect(bRes.status).toBe(201);
      expect(bRes.body.data.unitPrice).toBe(100);
    });

    it('prevents duplicate active price for the same product/tier/warehouse', async () => {
      const res = await request(app)
        .post('/api/v1/pricing/product-prices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId,
          priceTierId: wholesaleTierId,
          warehouseId: warehouseAId,
          unitPrice: 95,
        });
      expect(res.status).toBe(409);
    });

    it('preview returns different price by warehouse for same customer/product', async () => {
      const aRes = await request(app)
        .post('/api/v1/sales/orders/preview')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          warehouseId: warehouseAId,
          items: [{ productId, quantity: 10 }],
        });
      expect(aRes.status).toBe(200);
      expect(aRes.body.data.items[0].unitPrice).toBe(95);
      expect(aRes.body.data.subtotal).toBe(950);

      const bRes = await request(app)
        .post('/api/v1/sales/orders/preview')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          warehouseId: warehouseBId,
          items: [{ productId, quantity: 10 }],
        });
      expect(bRes.status).toBe(200);
      expect(bRes.body.data.items[0].unitPrice).toBe(100);
      expect(bRes.body.data.subtotal).toBe(1000);
    });

    it('expired/inactive pricing rules are not used', async () => {
      const expired = await request(app)
        .post('/api/v1/pricing/product-prices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          productId,
          priceTierId: wholesaleTierId,
          warehouseId: warehouseAId,
          unitPrice: 50,
          status: 'EXPIRED',
          startsAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
          endsAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
        });
      expect(expired.status).toBe(201);

      const res = await request(app)
        .post('/api/v1/sales/orders/preview')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ warehouseId: warehouseAId, items: [{ productId, quantity: 1 }] });
      expect(res.status).toBe(200);
      expect(res.body.data.items[0].unitPrice).toBe(95);
    });
  });

  describe('Discount Rules', () => {
    it('admin can create warehouse-specific discount', async () => {
      const res = await request(app)
        .post('/api/v1/pricing/discounts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'PricingTest Warehouse A Discount',
          productId,
          priceTierId: wholesaleTierId,
          warehouseId: warehouseAId,
          minQuantity: 100,
          discountType: 'PERCENTAGE',
          discountValue: 5,
          priority: 10,
        });
      expect(res.status).toBe(201);
      expect(res.body.data.discountValue).toBe(5);
    });

    it('preview applies discount only at the configured warehouse', async () => {
      const aRes = await request(app)
        .post('/api/v1/sales/orders/preview')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ warehouseId: warehouseAId, items: [{ productId, quantity: 200 }] });
      expect(aRes.status).toBe(200);
      expect(aRes.body.data.items[0].discount).toBe(950);
      expect(aRes.body.data.total).toBe(18050);

      const bRes = await request(app)
        .post('/api/v1/sales/orders/preview')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ warehouseId: warehouseBId, items: [{ productId, quantity: 200 }] });
      expect(bRes.status).toBe(200);
      expect(bRes.body.data.items[0].discount).toBe(0);
      expect(bRes.body.data.total).toBe(20000);
    });

    it('highest-priority discount rule wins when multiple qualify', async () => {
      await request(app)
        .post('/api/v1/pricing/discounts')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'PricingTest Lower Priority',
          productId,
          priceTierId: wholesaleTierId,
          warehouseId: warehouseAId,
          minQuantity: 50,
          discountType: 'FIXED_AMOUNT',
          discountValue: 100,
          priority: 1,
        });

      const res = await request(app)
        .post('/api/v1/sales/orders/preview')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ warehouseId: warehouseAId, items: [{ productId, quantity: 200 }] });
      expect(res.status).toBe(200);
      expect(res.body.data.items[0].discount).toBe(950);
    });

    it('unauthorized users cannot create discount rules', async () => {
      const res = await request(app)
        .post('/api/v1/pricing/discounts')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'Should fail',
          productId,
          discountType: 'PERCENTAGE',
          discountValue: 5,
        });
      expect(res.status).toBe(403);
    });
  });

  describe('Sales Quotas', () => {
    it('admin can create customer/product/warehouse quota', async () => {
      const aQuota = await request(app)
        .post('/api/v1/pricing/quotas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'PricingTest Coca-Cola Addis quota',
          customerId,
          productId,
          warehouseId: warehouseAId,
          maxQuantity: 1000,
          period: 'MONTHLY',
          startsAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
        });
      expect(aQuota.status).toBe(201);

      const bQuota = await request(app)
        .post('/api/v1/pricing/quotas')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'PricingTest Coca-Cola Dire Dawa quota',
          customerId,
          productId,
          warehouseId: warehouseBId,
          maxQuantity: 500,
          period: 'MONTHLY',
          startsAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
          endsAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30).toISOString(),
        });
      expect(bQuota.status).toBe(201);
    });

    it('quota is calculated separately per warehouse', async () => {
      const consumption = await request(app)
        .get(`/api/v1/pricing/quotas/consumption?customerId=${customerId}&productId=${productId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(consumption.status).toBe(200);
      expect(Array.isArray(consumption.body.data)).toBe(true);
    });

    it('preview returns quota warnings when quota is exceeded', async () => {
      const res = await request(app)
        .post('/api/v1/sales/orders/preview')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ warehouseId: warehouseAId, items: [{ productId, quantity: 1500 }] });
      expect(res.status).toBe(200);
      expect(res.body.data.quotaWarnings.length).toBeGreaterThan(0);
      expect(res.body.data.quotaWarnings[0].quotaName).toContain('Addis');
    });

    it('sales order creation rejects quota exceeded', async () => {
      const res = await request(app)
        .post('/api/v1/sales/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ warehouseId: warehouseAId, items: [{ productId, quantity: 1500 }] });
      expect(res.status).toBe(409);
      expect(res.body.message).toContain('Quota');
    });

    it('sales order with 500 units at Dire Dawa quota succeeds', async () => {
      const res = await request(app)
        .post('/api/v1/sales/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ warehouseId: warehouseBId, items: [{ productId, quantity: 400 }] });
      if (res.status !== 201) console.error('DIRE DAWA ERROR:', res.status, res.body);
      expect(res.status).toBe(201);
      expect(Number(res.body.data.total)).toBe(40000);
    });
  });

  describe('External customer cannot choose tier', () => {
    it('rejects customer without tier if no default exists', async () => {
      await prisma.customer.update({
        where: { id: customerId },
        data: { priceTierId: null },
      });

      const defaultTier = await prisma.priceTier.findFirst({ where: { isDefault: true } });
      await prisma.priceTier.updateMany({
        where: { isDefault: true },
        data: { isDefault: false },
      });

      const res = await request(app)
        .post('/api/v1/sales/orders/preview')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ warehouseId: warehouseAId, items: [{ productId, quantity: 5 }] });
      expect(res.status).toBe(412);

      if (defaultTier) {
        await prisma.priceTier.update({
          where: { id: defaultTier.id },
          data: { isDefault: true },
        });
      } else {
        await prisma.priceTier.update({
          where: { id: retailTierId },
          data: { isDefault: true },
        });
      }
    });
  });

  describe('Frontend price tampering ignored', () => {
    it('sales order creation recalculates pricing ignoring client values', async () => {
      const res = await request(app)
        .post('/api/v1/sales/orders')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          warehouseId: warehouseBId,
          items: [{ productId, quantity: 50, unitPrice: 0.01 }],
        });
      expect(res.status).toBe(201);
      expect(res.body.data.items[0].unitPrice).toBeDefined();
      expect(Number(res.body.data.items[0].unitPrice)).toBe(100);
      expect(Number(res.body.data.items[0].total)).toBe(5000);
    });
  });

  describe('Existing Sales Order workflow still works', () => {
    it('validates input items on preview', async () => {
      const res = await request(app)
        .post('/api/v1/sales/orders/preview')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ items: [] });
      expect(res.status).toBe(400);
    });
  });
});