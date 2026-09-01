import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/config/prisma.js';
import bcrypt from 'bcryptjs';

const TS = Date.now();
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

const REPORT_REP_USERNAME = `rep_report_${TS}`;
const REPORT_REP_EMAIL = `rep.report.${TS}@example.com`;
const DRIVER_USERNAME = `driver_report_${TS}`;
const DRIVER_EMAIL = `driver.report.${TS}@example.com`;
const NO_PERM_USERNAME = `noperm_report_${TS}`;
const NO_PERM_EMAIL = `noperm.report.${TS}@example.com`;

const REGION_CODE = `REG-RPT-${TS}`;
const BRANCH_CODE = `BR-RPT-${TS}`;
const WAREHOUSE_CODE = `WH-RPT-${TS}`;
const PRODUCT_SKU = `PROD-RPT-${TS}`;
const CATEGORY_NAME = `Cat Report ${TS}`;

let adminToken = '';
let repToken = '';
let driverToken = '';
let noPermToken = '';
let adminId = '';
let repEmployeeId = '';
let driverEmployeeId = '';
let regionId = '';
let branchId = '';
let warehouseId = '';
let vehicleId = '';
let categoryId = '';
let productId = '';
let customerId = '';
let companyId = '';

const REPORT_PERMISSIONS = [
  'REPORT_VIEW_DASHBOARD',
  'REPORT_VIEW_SALES',
  'REPORT_VIEW_PRODUCTS',
  'REPORT_VIEW_CUSTOMERS',
  'REPORT_VIEW_SALES_REPS',
  'REPORT_VIEW_WAREHOUSE',
  'REPORT_VIEW_DELIVERIES',
  'REPORT_EXPORT',
];

async function ensureRolesAndPermissions() {
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: {},
    create: { name: 'ADMIN', description: 'System Administrator' },
  });
  const repRole = await prisma.role.upsert({
    where: { name: 'SALES_REPRESENTATIVE' },
    update: {},
    create: { name: 'SALES_REPRESENTATIVE', description: 'Sales Representative' },
  });
  const driverRole = await prisma.role.upsert({
    where: { name: 'DRIVER' },
    update: {},
    create: { name: 'DRIVER', description: 'Driver' },
  });

  const perms = await prisma.$transaction(
    REPORT_PERMISSIONS.map((name) =>
      prisma.permission.upsert({
        where: { name },
        update: {},
        create: {
          name,
          module: 'reports',
          action: name.replace('REPORT_', '').toLowerCase(),
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

  const reportViewPerms = perms.filter((p) => p.name !== 'REPORT_EXPORT');
  await prisma.rolePermission.deleteMany({ where: { roleId: repRole.id } });
  for (const perm of reportViewPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: repRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: repRole.id, permissionId: perm.id },
    });
  }

  await prisma.rolePermission.deleteMany({ where: { roleId: driverRole.id } });
  const driverReportPerm = perms.find((p) => p.name === 'REPORT_VIEW_DELIVERIES');
  if (driverReportPerm) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: driverRole.id, permissionId: driverReportPerm.id } },
      update: {},
      create: { roleId: driverRole.id, permissionId: driverReportPerm.id },
    });
  }

  return { adminRole, repRole, driverRole };
}

async function getAuthToken(username, password) {
  const response = await request(app).post('/api/v1/auth/login').send({ username, password });
  expect(response.status).toBe(200);
  return response.body.data.accessToken;
}

async function createUserWithRole(username, email, password, roleName) {
  const person = await prisma.person.create({
    data: { firstName: username, lastName: 'Test', email, status: 'ACTIVE' },
  });
  const user = await prisma.user.create({
    data: {
      personId: person.id,
      username,
      passwordHash: await bcrypt.hash(password, 12),
      isActive: true,
    },
  });
  if (roleName) {
    const role = await prisma.role.findUnique({ where: { name: roleName } });
    if (role) {
      await prisma.userRole.create({ data: { userId: user.id, roleId: role.id } });
    }
  }
  return { person, user };
}

async function setupTestData() {
  const region = await prisma.region.upsert({
    where: { code: REGION_CODE },
    update: {},
    create: { code: REGION_CODE, name: 'Report Test Region', isActive: true },
  });
  regionId = region.id;

  const company = await prisma.company.create({
    data: { name: `Report Test Company ${TS}`, regionId, status: 'ACTIVE' },
  });
  companyId = company.id;

  const branch = await prisma.branch.upsert({
    where: { branchCode: BRANCH_CODE },
    update: {},
    create: { branchCode: BRANCH_CODE, name: 'Report Test Branch', companyId, regionId, status: 'ACTIVE' },
  });
  branchId = branch.id;

  const warehouse = await prisma.warehouse.create({
    data: { code: WAREHOUSE_CODE, name: 'Report Test Warehouse', branchId, regionId, status: 'ACTIVE' },
  });
  warehouseId = warehouse.id;

  const vehicle = await prisma.vehicle.create({
    data: { plateNumber: `VEH-RPT-${TS}`, vehicleType: 'Truck', status: 'ACTIVE' },
  });
  const vehicleId = vehicle.id;

  const category = await prisma.category.create({
    data: { name: CATEGORY_NAME, status: 'ACTIVE' },
  });
  categoryId = category.id;

  const unit = await prisma.unit.findFirst({ where: { name: 'Bag' } });
  const unitObj = unit || await prisma.unit.create({ data: { name: 'Bag', abbreviation: 'BG' } });
  const product = await prisma.product.create({
    data: {
      sku: PRODUCT_SKU,
      name: 'Report Test Product',
      categoryId,
      unitId: unitObj.id,
      sellingPrice: 100,
      wholesalePrice: 80,
      purchasePrice: 60,
      status: 'ACTIVE',
    },
  });
  productId = product.id;

  const repPerson = await prisma.person.create({
    data: { firstName: 'Report', lastName: 'Rep', email: REPORT_REP_EMAIL, status: 'ACTIVE' },
  });
  const repUser = await prisma.user.create({
    data: {
      personId: repPerson.id,
      username: REPORT_REP_USERNAME,
      passwordHash: await bcrypt.hash('Rep@123!', 12),
      isActive: true,
    },
  });
  const repRole = await prisma.role.findUnique({ where: { name: 'SALES_REPRESENTATIVE' } });
  await prisma.userRole.create({ data: { userId: repUser.id, roleId: repRole.id } });
  const repEmployee = await prisma.employee.create({
    data: {
      personId: repPerson.id,
      employeeCode: `EMP-RPT-REP-${TS}`,
      hireDate: new Date(),
      status: 'ACTIVE',
      isAvailableForSales: true,
      branchId,
    },
  });
  repEmployeeId = repEmployee.id;
  repToken = await getAuthToken(REPORT_REP_USERNAME, 'Rep@123!');

  const driverPerson = await prisma.person.create({
    data: { firstName: 'Report', lastName: 'Driver', email: DRIVER_EMAIL, status: 'ACTIVE' },
  });
  const driverUser = await prisma.user.create({
    data: {
      personId: driverPerson.id,
      username: DRIVER_USERNAME,
      passwordHash: await bcrypt.hash('Driver@123!', 12),
      isActive: true,
    },
  });
  const driverRole = await prisma.role.findUnique({ where: { name: 'DRIVER' } });
  await prisma.userRole.create({ data: { userId: driverUser.id, roleId: driverRole.id } });
  const driverEmployee = await prisma.employee.create({
    data: {
      personId: driverPerson.id,
      employeeCode: `EMP-RPT-DRV-${TS}`,
      hireDate: new Date(),
      status: 'ACTIVE',
      branchId,
    },
  });
  driverEmployeeId = driverEmployee.id;
  driverToken = await getAuthToken(DRIVER_USERNAME, 'Driver@123!');

  const noPerm = await createUserWithRole(NO_PERM_USERNAME, NO_PERM_EMAIL, 'NoPerm@123!', null);
  noPermToken = await getAuthToken(NO_PERM_USERNAME, 'NoPerm@123!');

  const customerPerson = await prisma.person.create({
    data: { firstName: 'Report', lastName: 'Customer', email: `rpt.cust.${TS}@example.com`, status: 'ACTIVE' },
  });
  const customer = await prisma.customer.create({
    data: { customerCode: `CUS-RPT-${TS}`, customerType: 'PERSON', personId: customerPerson.id, status: 'ACTIVE' },
  });
  customerId = customer.id;

  const orderDate = new Date();
  const salesOrder = await prisma.salesOrder.create({
    data: {
      orderNumber: `SO-RPT-${TS}`,
      customerId,
      salesRepId: repEmployeeId,
      warehouseId,
      source: 'SALES_REPRESENTATIVE',
      orderDate,
      status: 'APPROVED',
      subtotal: 1000,
      discount: 0,
      tax: 0,
      total: 1000,
      items: {
        create: [{ productId, quantity: 10, unitPrice: 100, total: 1000 }],
      },
    },
    include: { items: true },
  });

  const salesOrderItemId = salesOrder.items[0].id;

  await prisma.preparationTask.create({
    data: {
      salesOrderId: salesOrder.id,
      warehouseId,
      storeKeeperId: repEmployeeId,
      scheduledBy: adminId,
      scheduledDate: new Date(),
      status: 'COMPLETED',
      startedAt: new Date(),
      completedAt: new Date(),
      items: {
        create: [{ salesOrderItemId, productId, quantity: 10, preparedQuantity: 10, status: 'COMPLETED' }],
      },
    },
  });

  await prisma.delivery.create({
    data: {
      deliveryNumber: `DEL-RPT-${TS}`,
      salesOrderId: salesOrder.id,
      customerId,
      warehouseId,
      driverId: driverEmployeeId,
      vehicleId,
      scheduledDate: new Date(),
      status: 'DELIVERED',
      deliveryAddress: '123 Test St',
    },
  });
}

async function cleanup() {
  await prisma.deliveryItem.deleteMany({ where: { delivery: { deliveryNumber: `DEL-RPT-${TS}` } } }).catch(() => {});
  await prisma.delivery.deleteMany({ where: { deliveryNumber: `DEL-RPT-${TS}` } });
  await prisma.vehicle.deleteMany({ where: { plateNumber: `VEH-RPT-${TS}` } }).catch(() => {});
  await prisma.preparationTaskItem.deleteMany({ where: { preparationTask: { salesOrder: { orderNumber: `SO-RPT-${TS}` } } } }).catch(() => {});
  await prisma.preparationTask.deleteMany({ where: { salesOrder: { orderNumber: `SO-RPT-${TS}` } } }).catch(() => {});
  await prisma.salesOrderItem.deleteMany({ where: { salesOrder: { orderNumber: `SO-RPT-${TS}` } } }).catch(() => {});
  await prisma.salesOrder.deleteMany({ where: { orderNumber: `SO-RPT-${TS}` } });
  await prisma.customer.deleteMany({ where: { customerCode: `CUS-RPT-${TS}` } });
  await prisma.employee.deleteMany({ where: { employeeCode: { in: [`EMP-RPT-REP-${TS}`, `EMP-RPT-DRV-${TS}`] } } });
  await prisma.warehouse.deleteMany({ where: { code: WAREHOUSE_CODE } });
  await prisma.product.deleteMany({ where: { sku: PRODUCT_SKU } });
  await prisma.category.deleteMany({ where: { id: categoryId } }).catch(() => {});
  await prisma.branch.deleteMany({ where: { id: branchId } }).catch(() => {});
  await prisma.company.deleteMany({ where: { id: companyId } }).catch(() => {});
  await prisma.region.deleteMany({ where: { id: regionId } }).catch(() => {});
  await prisma.user.deleteMany({
    where: { username: { in: [REPORT_REP_USERNAME, DRIVER_USERNAME, NO_PERM_USERNAME] } },
  });
  await prisma.person.deleteMany({
    where: { email: { in: [REPORT_REP_EMAIL, DRIVER_EMAIL, NO_PERM_EMAIL, `rpt.cust.${TS}@example.com`] } },
  });
}

describe('Reporting Module', () => {
  beforeAll(async () => {
    const admin = await prisma.user.findFirst({
      where: { OR: [{ username: ADMIN_USERNAME }, { person: { email: ADMIN_EMAIL } }] },
      include: { person: true, userRoles: { include: { role: true } } },
    });
    if (admin) {
      adminId = admin.id;
      const hasAdminRole = admin.userRoles.some((ur) => ur.role.name === 'ADMIN');
      if (!hasAdminRole) {
        const adminRole = await prisma.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN' } });
        await prisma.userRole.create({ data: { userId: admin.id, roleId: adminRole.id } });
      }
    }
    await ensureRolesAndPermissions();
    adminToken = await getAuthToken(ADMIN_USERNAME, ADMIN_PASSWORD);
    await cleanup();
    await setupTestData();
  }, 60000);

  afterAll(async () => {
    await cleanup();
    await prisma.$disconnect();
  });

  describe('Authorization', () => {
    it('returns 401 when unauthenticated', async () => {
      const response = await request(app).get('/api/v1/reports/dashboard');
      expect(response.status).toBe(401);
    });

    it('returns 403 when user lacks reporting permission', async () => {
      const response = await request(app)
        .get('/api/v1/reports/dashboard')
        .set('Authorization', `Bearer ${noPermToken}`);
      expect(response.status).toBe(403);
    });

    it('allows admin with reporting permission', async () => {
      const response = await request(app)
        .get('/api/v1/reports/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('success');
    });
  });

  describe('GET /api/v1/reports/dashboard', () => {
    it('returns correct summary structure', async () => {
      const response = await request(app)
        .get('/api/v1/reports/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.data.orders).toBeDefined();
      expect(response.body.data.customers).toBeDefined();
      expect(response.body.data.products).toBeDefined();
      expect(response.body.data.revenue).toBeDefined();
      expect(typeof response.body.data.orders.total).toBe('number');
    });

    it('returns non-zero orders total after seeding data', async () => {
      const response = await request(app)
        .get('/api/v1/reports/dashboard')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.data.orders.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/v1/reports/sales', () => {
    it('returns aggregated sales data', async () => {
      const response = await request(app)
        .get('/api/v1/reports/sales')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.data.totalOrders).toBeGreaterThanOrEqual(1);
      expect(response.body.data.total).toBeDefined();
    });

    it('filters by status correctly', async () => {
      const response = await request(app)
        .get('/api/v1/reports/sales?status=APPROVED')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.data.totalOrders).toBeGreaterThanOrEqual(1);
    });

    it('filters by salesRepId correctly', async () => {
      const response = await request(app)
        .get(`/api/v1/reports/sales?salesRepId=${repEmployeeId}`)
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.data.totalOrders).toBeGreaterThanOrEqual(1);
    });

    it('returns 400 for invalid UUID', async () => {
      const response = await request(app)
        .get('/api/v1/reports/sales?salesRepId=not-a-uuid')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(400);
    });

    it('returns 400 when startDate > endDate', async () => {
      const response = await request(app)
        .get('/api/v1/reports/sales?startDate=2026-01-02&endDate=2026-01-01')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(400);
    });
  });

  describe('GET /api/v1/reports/sales/products', () => {
    it('returns paginated product sales', async () => {
      const response = await request(app)
        .get('/api/v1/reports/sales/products')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.meta).toBeDefined();
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('returns correct grouping with quantity and revenue', async () => {
      const response = await request(app)
        .get('/api/v1/reports/sales/products')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      const item = response.body.data[0];
      expect(item.product).toBeDefined();
      expect(item.quantitySold).toBeDefined();
      expect(item.revenue).toBeDefined();
    });

    it('respects pagination limit', async () => {
      const response = await request(app)
        .get('/api/v1/reports/sales/products?page=1&limit=1')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBeLessThanOrEqual(1);
      expect(response.body.meta.limit).toBe(1);
    });
  });

  describe('GET /api/v1/reports/customers', () => {
    it('returns paginated customer report', async () => {
      const response = await request(app)
        .get('/api/v1/reports/customers')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0].orderCount).toBeGreaterThanOrEqual(1);
      expect(response.body.data[0].totalPurchase).toBeDefined();
    });
  });

  describe('GET /api/v1/reports/sales-representatives', () => {
    it('returns sales rep performance data', async () => {
      const response = await request(app)
        .get('/api/v1/reports/sales-representatives')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      const rep = response.body.data[0];
      expect(rep.salesRepresentative).toBeDefined();
      expect(rep.assignedOrders).toBeDefined();
      expect(rep.salesAmount).toBeDefined();
    });

    it('restricts sales rep to their own data only', async () => {
      const response = await request(app)
        .get('/api/v1/reports/sales-representatives')
        .set('Authorization', `Bearer ${repToken}`);
      expect(response.status).toBe(200);
      expect(response.body.data.length).toBe(1);
      expect(response.body.data[0].salesRepId).toBe(repEmployeeId);
    });
  });

  describe('GET /api/v1/reports/orders/status', () => {
    it('returns order counts grouped by status', async () => {
      const response = await request(app)
        .get('/api/v1/reports/orders/status')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(1);
      const approved = response.body.data.find((s) => s.status === 'APPROVED');
      expect(approved).toBeDefined();
      expect(approved.count).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/v1/reports/warehouse', () => {
    it('returns warehouse preparation metrics', async () => {
      const response = await request(app)
        .get('/api/v1/reports/warehouse')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.data.preparationTasks).toBeDefined();
      expect(response.body.data.preparedQuantities).toBeDefined();
      expect(response.body.data.preparationTasks.total).toBeGreaterThanOrEqual(1);
    });
  });

  describe('GET /api/v1/reports/deliveries', () => {
    it('returns delivery metrics', async () => {
      const response = await request(app)
        .get('/api/v1/reports/deliveries')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.data.total).toBeGreaterThanOrEqual(1);
      expect(response.body.data.byStatus).toBeDefined();
      expect(response.body.data.byDriver).toBeDefined();
    });

    it('filters by status correctly', async () => {
      const response = await request(app)
        .get('/api/v1/reports/deliveries?status=DELIVERED')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(200);
      expect(response.body.data.total).toBeGreaterThanOrEqual(1);
    });

    it('restricts driver to their own deliveries only', async () => {
      const response = await request(app)
        .get('/api/v1/reports/deliveries')
        .set('Authorization', `Bearer ${driverToken}`);
      expect(response.status).toBe(200);
      expect(response.body.data.total).toBeGreaterThanOrEqual(1);
      if (response.body.data.byDriver.length > 0) {
        expect(response.body.data.byDriver[0].driver.id).toBe(driverEmployeeId);
      }
    });

    it('returns 400 for invalid date range', async () => {
      const response = await request(app)
        .get('/api/v1/reports/deliveries?startDate=2026-01-02&endDate=2026-01-01')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(400);
    });
  });

  describe('Validation', () => {
    it('returns 400 for invalid page value', async () => {
      const response = await request(app)
        .get('/api/v1/reports/sales/products?page=0&limit=10')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(400);
    });

    it('returns 400 for invalid limit value', async () => {
      const response = await request(app)
        .get('/api/v1/reports/sales/products?page=1&limit=0')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(400);
    });

    it('returns 400 for invalid product UUID in sales report', async () => {
      const response = await request(app)
        .get('/api/v1/reports/sales?productId=invalid')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(response.status).toBe(400);
    });
  });
});
