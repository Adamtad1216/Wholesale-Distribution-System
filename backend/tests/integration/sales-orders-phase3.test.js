import 'dotenv/config';
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app.js';
import prisma from '../../src/config/prisma.js';
import bcrypt from 'bcryptjs';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME || 'System Administrator';

const TS = Date.now();
const CUSTOMER_USERNAME = `cust_phase3_${TS}`;
const CUSTOMER_EMAIL = `cust.phase3.${TS}@example.com`;
const REP_USERNAME = `salesrep_phase3_${TS}`;
const REP_EMAIL = `sales.rep.phase3.${TS}@example.com`;
const PRODUCT_SKU_1 = `PROD-PHASE3-1-${TS}`;
const PRODUCT_SKU_2 = `PROD-PHASE3-2-${TS}`;
const REGION_CODE = `REG-PHASE3-${TS}`;
const BRANCH_CODE = `BR-PHASE3-${TS}`;
const WAREHOUSE_CODE = `WH-PHASE3-${TS}`;

const BASE_URL = "/api/v1/sales/orders";

let adminToken = '';
let customerToken = '';
let salesRepToken = '';
let warehouseManagerToken = '';
let storeKeeperToken = '';
let driverToken = '';

let customerId;
let salesRepId;
let warehouseManagerId;
let storeKeeperId;
let driverId;
let vehicleId;
let warehouseId;
let productId;
let productId2;

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

  const warehouseManagerRole = await prisma.role.upsert({
    where: { name: 'WAREHOUSE_MANAGER' },
    update: {},
    create: { name: 'WAREHOUSE_MANAGER', description: 'Warehouse Manager' },
  });

  const storeKeeperRole = await prisma.role.upsert({
    where: { name: 'STORE_KEEPER' },
    update: {},
    create: { name: 'STORE_KEEPER', description: 'Store Keeper' },
  });

  const driverRole = await prisma.role.upsert({
    where: { name: 'DRIVER' },
    update: {},
    create: { name: 'DRIVER', description: 'Driver' },
  });

  const perms = await prisma.$transaction(
    [
      'sales_orders:create',
      'sales_orders:read',
      'sales_orders:update',
      'preparation_tasks:create',
      'preparation_tasks:read',
      'preparation_tasks:update',
      'deliveries:create',
      'deliveries:read',
      'deliveries:update',
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
    return { user: existing, roles: { adminRole, customerRole, salesRepRole, warehouseManagerRole, storeKeeperRole, driverRole } };
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

  return { user, roles: { adminRole, customerRole, salesRepRole, warehouseManagerRole, storeKeeperRole, driverRole } };
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
  const { roles } = await ensureAdmin();
  const { adminRole, customerRole, salesRepRole, warehouseManagerRole, storeKeeperRole, driverRole } = roles;

  await prisma.deliveryProof.deleteMany();
  await prisma.deliveryItem.deleteMany();
  await prisma.delivery.deleteMany();
  await prisma.preparationTaskItem.deleteMany();
  await prisma.preparationTask.deleteMany();
  await prisma.salesOrderItem.deleteMany();
  await prisma.salesOrder.deleteMany();
  await prisma.salesOrderStatusHistory.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();
  await prisma.person.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.company.deleteMany();
  await prisma.region.deleteMany();

  const region = await prisma.region.upsert({
    where: { code: REGION_CODE },
    update: {},
    create: { code: REGION_CODE, name: 'Phase3 Test Region', isActive: true },
  });

  const company = await prisma.company.upsert({
    where: { tinNumber: 'PHASE3-001' },
    update: {},
    create: { name: 'Phase3 Test Company', tinNumber: 'PHASE3-001', regionId: region.id, status: 'ACTIVE' },
  });

  const branch = await prisma.branch.upsert({
    where: { branchCode: BRANCH_CODE },
    update: {},
    create: { branchCode: BRANCH_CODE, name: 'Phase3 Test Branch', companyId: company.id, regionId: region.id, status: 'ACTIVE' },
  });

  const warehouse = await prisma.warehouse.create({
    data: {
      code: WAREHOUSE_CODE,
      name: 'Phase3 Warehouse',
      branchId: branch.id,
      regionId: region.id,
      status: 'ACTIVE',
    },
  });
  warehouseId = warehouse.id;

  const category = await prisma.category.create({
    data: { name: 'Phase3 Category', description: 'Phase3 test category', status: 'ACTIVE' },
  });

  const unit = await prisma.unit.create({
    data: { name: 'Piece', abbreviation: 'PCS' },
  });

  const [product1, product2] = await prisma.$transaction(async (tx) => {
    const p1 = await tx.product.create({
      data: {
        sku: PRODUCT_SKU_1,
        name: 'Product Phase3 A',
        categoryId: category.id,
        unitId: unit.id,
        purchasePrice: 10,
        sellingPrice: 20,
        wholesalePrice: 18,
        status: 'ACTIVE',
      },
    });
    const p2 = await tx.product.create({
      data: {
        sku: PRODUCT_SKU_2,
        name: 'Product Phase3 B',
        categoryId: category.id,
        unitId: unit.id,
        purchasePrice: 10,
        sellingPrice: 20,
        wholesalePrice: 18,
        status: 'ACTIVE',
      },
    });
    return [p1, p2];
  });
  productId = product1.id;
  productId2 = product2.id;

  const customerPerson = await prisma.person.create({
    data: { firstName: 'Customer', lastName: 'Phase3', email: CUSTOMER_EMAIL, phone: '+251911111111', status: 'ACTIVE' },
  });
  const customerUser = await prisma.user.create({
    data: {
      personId: customerPerson.id,
      username: CUSTOMER_USERNAME,
      passwordHash: await bcrypt.hash('Customer@123!', 12),
      isActive: true,
    },
  });
  await prisma.userRole.create({ data: { userId: customerUser.id, roleId: customerRole.id } });
  const customer = await prisma.customer.upsert({
    where: { customerCode: 'CUST-PHASE3-001' },
    update: {},
    create: { customerCode: 'CUST-PHASE3-001', personId: customerPerson.id, customerType: 'PERSON', status: 'ACTIVE' },
  });
  customerId = customer.id;
  customerToken = await getAuthToken(CUSTOMER_USERNAME, 'Customer@123!');

  const salesRepPerson = await prisma.person.create({
    data: { firstName: 'Sales', lastName: 'Rep', email: REP_EMAIL, phone: '+251922222222', status: 'ACTIVE' },
  });
  const salesRepUser = await prisma.user.create({
    data: {
      personId: salesRepPerson.id,
      username: REP_USERNAME,
      passwordHash: await bcrypt.hash('SalesRep@123!', 12),
      isActive: true,
    },
  });
  await prisma.userRole.create({ data: { userId: salesRepUser.id, roleId: salesRepRole.id } });
  const salesRepEmployee = await prisma.employee.create({
    data: { personId: salesRepPerson.id, employeeCode: 'SR-PHASE3-001', hireDate: new Date('2024-01-01'), status: 'ACTIVE', isAvailableForSales: true },
  });
  salesRepId = salesRepEmployee.id;
  salesRepToken = await getAuthToken(REP_USERNAME, 'SalesRep@123!');

  const warehouseManagerPerson = await prisma.person.create({
    data: { firstName: 'Warehouse', lastName: 'Manager', email: 'whmgr.phase3@test.com', phone: '+251933333333', status: 'ACTIVE' },
  });
  const warehouseManagerUser = await prisma.user.create({
    data: {
      personId: warehouseManagerPerson.id,
      username: 'whmgr.phase3',
      passwordHash: await bcrypt.hash('WhMgr@123!', 12),
      isActive: true,
    },
  });
  await prisma.userRole.create({ data: { userId: warehouseManagerUser.id, roleId: warehouseManagerRole.id } });
  const warehouseManagerEmployee = await prisma.employee.create({
    data: { personId: warehouseManagerPerson.id, employeeCode: 'WM-PHASE3-001', hireDate: new Date('2024-01-01'), status: 'ACTIVE' },
  });
  await prisma.warehouse.update({ where: { id: warehouseId }, data: { managerId: warehouseManagerEmployee.id } });
  warehouseManagerId = warehouseManagerEmployee.id;
  warehouseManagerToken = await getAuthToken('whmgr.phase3', 'WhMgr@123!');

  const storeKeeperPerson = await prisma.person.create({
    data: { firstName: 'Store', lastName: 'Keeper', email: 'storekeeper.phase3@test.com', phone: '+251944444444', status: 'ACTIVE' },
  });
  const storeKeeperUser = await prisma.user.create({
    data: {
      personId: storeKeeperPerson.id,
      username: 'storekeeper.phase3',
      passwordHash: await bcrypt.hash('StoreKeeper@123!', 12),
      isActive: true,
    },
  });
  await prisma.userRole.create({ data: { userId: storeKeeperUser.id, roleId: storeKeeperRole.id } });
  const storeKeeperEmployee = await prisma.employee.create({
    data: { personId: storeKeeperPerson.id, employeeCode: 'SK-PHASE3-001', hireDate: new Date('2024-01-01'), status: 'ACTIVE' },
  });
  storeKeeperId = storeKeeperEmployee.id;
  storeKeeperToken = await getAuthToken('storekeeper.phase3', 'StoreKeeper@123!');

  const driverPerson = await prisma.person.create({
    data: { firstName: 'Driver', lastName: 'Phase3', email: 'driver.phase3@test.com', phone: '+251955555555', status: 'ACTIVE' },
  });
  const driverUser = await prisma.user.create({
    data: {
      personId: driverPerson.id,
      username: 'driver.phase3',
      passwordHash: await bcrypt.hash('Driver@123!', 12),
      isActive: true,
    },
  });
  await prisma.userRole.create({ data: { userId: driverUser.id, roleId: driverRole.id } });
  const driverEmployee = await prisma.employee.create({
    data: {
      personId: driverPerson.id,
      employeeCode: 'DR-PHASE3-001',
      hireDate: new Date('2024-01-01'),
      status: 'ACTIVE',
      driverLicenseNumber: 'DL-PHASE3-123',
      driverLicenseExpiry: new Date('2026-12-31'),
    },
  });
  driverId = driverEmployee.id;
  driverToken = await getAuthToken('driver.phase3', 'Driver@123!');

  const vehicle = await prisma.vehicle.create({
    data: {
      plateNumber: 'PHASE3-VEH-001',
      vehicleType: 'TRUCK',
      capacity: 1000,
      status: 'ACTIVE',
    },
  });

  const allPerms = await prisma.permission.findMany();
  await prisma.rolePermission.deleteMany({ where: { roleId: adminRole.id } });
  for (const perm of allPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }

  const salesRepPerms = await prisma.permission.findMany({
    where: { name: { in: ['sales_orders:read', 'sales_orders:update', 'sales:read', 'sales:create', 'sales:update', 'sales:delete'] } },
  });
  await prisma.rolePermission.deleteMany({ where: { roleId: salesRepRole.id } });
  for (const perm of salesRepPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: salesRepRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: salesRepRole.id, permissionId: perm.id },
    });
  }

  const wmPerms = await prisma.permission.findMany({
    where: { name: { in: ['sales_orders:read', 'sales_orders:update', 'preparation_tasks:create', 'preparation_tasks:read', 'preparation_tasks:update', 'deliveries:create', 'deliveries:read', 'deliveries:update', 'warehouses:read', 'customers:read', 'products:read'] } },
  });
  await prisma.rolePermission.deleteMany({ where: { roleId: warehouseManagerRole.id } });
  for (const perm of wmPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: warehouseManagerRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: warehouseManagerRole.id, permissionId: perm.id },
    });
  }

  const skPerms = await prisma.permission.findMany({
    where: { name: { in: ['preparation_tasks:read', 'preparation_tasks:update', 'sales_orders:read', 'warehouses:read', 'products:read'] } },
  });
  await prisma.rolePermission.deleteMany({ where: { roleId: storeKeeperRole.id } });
  for (const perm of skPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: storeKeeperRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: storeKeeperRole.id, permissionId: perm.id },
    });
  }

  const driverPerms = await prisma.permission.findMany({
    where: { name: { in: ['deliveries:read', 'deliveries:update', 'sales_orders:read', 'customers:read', 'products:read'] } },
  });
  await prisma.rolePermission.deleteMany({ where: { roleId: driverRole.id } });
  for (const perm of driverPerms) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: driverRole.id, permissionId: perm.id } },
      update: {},
      create: { roleId: driverRole.id, permissionId: perm.id },
    });
  }
}

async function cleanupTestData() {
    await prisma.deliveryProof.deleteMany();
    await prisma.deliveryItem.deleteMany();
    await prisma.delivery.deleteMany();
    await prisma.preparationTaskItem.deleteMany();
    await prisma.preparationTask.deleteMany();
    await prisma.salesOrderItem.deleteMany();
    await prisma.salesOrder.deleteMany();
    await prisma.salesOrderStatusHistory.deleteMany();
    await prisma.vehicle.deleteMany();
  const deleteCustomers = prisma.customer.deleteMany();
  const deleteEmployees = prisma.employee.deleteMany();
  const deleteUsers = prisma.user.deleteMany();
  const deletePersons = prisma.person.deleteMany();
  const deleteProducts = prisma.product.deleteMany();
  const deleteCategories = prisma.category.deleteMany();
  const deleteUnits = prisma.unit.deleteMany();
  const deleteWarehouses = prisma.warehouse.deleteMany();
  const deleteBranches = prisma.branch.deleteMany();
  const deleteCompanies = prisma.company.deleteMany();
  const deleteRegions = prisma.region.deleteMany();

  await prisma.$transaction([
    deleteCustomers,
    deleteEmployees,
    deleteUsers,
    deletePersons,
    deleteProducts,
    deleteCategories,
    deleteUnits,
    deleteWarehouses,
    deleteBranches,
    deleteCompanies,
    deleteRegions,
  ]);
}

describe("Phase 3 Sales Order Lifecycle", () => {
  beforeAll(async () => {
    await setupTestData();
  }, 60000);

  afterAll(async () => {
    await cleanupTestData();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await prisma.deliveryProof.deleteMany();
    await prisma.deliveryItem.deleteMany();
    await prisma.delivery.deleteMany();
    await prisma.preparationTaskItem.deleteMany();
    await prisma.preparationTask.deleteMany();
    await prisma.salesOrderItem.deleteMany();
    await prisma.salesOrder.deleteMany();
    await prisma.salesOrderStatusHistory.deleteMany();
    await prisma.vehicle.deleteMany();
  });

  describe("Sales Representative Approval/Rejection/Adjustment", () => {
    let salesOrderId;

    beforeEach(async () => {
      const createRes = await request(app)
        .post(`${BASE_URL}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          warehouseId,
          deliveryLocation: {
            latitude: 9.032,
            longitude: 38.7469,
            addressText: "Addis Ababa, Ethiopia",
          },
          items: [
            { productId: productId, quantity: 10 },
          ],
        });
      salesOrderId = createRes.body.data.id;
    });

    it("sales rep can approve an order", async () => {
      const res = await request(app)
        .post(`${BASE_URL}/${salesOrderId}/approve`)
        .set("Authorization", `Bearer ${salesRepToken}`);
      if (res.status !== 200) {
        console.log('Approve error:', res.body);
      }
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("SALES_REP_APPROVED");
      expect(res.body.data.approvedBy).toBeDefined();
    });

    it("sales rep can reject an order with reason", async () => {
      const res = await request(app)
        .post(`${BASE_URL}/${salesOrderId}/reject`)
        .set("Authorization", `Bearer ${salesRepToken}`)
        .send({ reason: "Products not suitable" });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("REJECTED");
      expect(res.body.data.rejectionReason).toBe("Products not suitable");
    });

    it("sales rep can request adjustment", async () => {
      const res = await request(app)
        .post(`${BASE_URL}/${salesOrderId}/request-adjustment`)
        .set("Authorization", `Bearer ${salesRepToken}`)
        .send({ reason: "Quantity needs reduction" });
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("ADJUSTMENT_REQUIRED");
      expect(res.body.data.adjustmentReason).toBe("Quantity needs reduction");
    });

    it("unauthorized user cannot approve", async () => {
      const res = await request(app)
        .post(`${BASE_URL}/${salesOrderId}/approve`)
        .set("Authorization", `Bearer ${customerToken}`);
      expect(res.status).toBe(403);
    });
  });

  describe("Warehouse Manager Preparation", () => {
    let salesOrderId;

    beforeEach(async () => {
      const createRes = await request(app)
        .post(`${BASE_URL}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          warehouseId,
          deliveryLocation: {
            latitude: 9.032,
            longitude: 38.7469,
            addressText: "Addis Ababa, Ethiopia",
          },
          items: [{ productId: productId, quantity: 10 }],
        });
      salesOrderId = createRes.body.data.id;

      await request(app)
        .post(`${BASE_URL}/${salesOrderId}/approve`)
        .set("Authorization", `Bearer ${salesRepToken}`);
    });

    it("warehouse manager can view approved orders", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/warehouse/approved`)
        .set("Authorization", `Bearer ${warehouseManagerToken}`);
      if (res.status !== 200) {
        console.log('Approved orders error:', res.body);
      }
      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
    });

    it("warehouse manager can schedule preparation", async () => {
      const res = await request(app)
        .post(`${BASE_URL}/warehouse/${salesOrderId}/schedule-preparation`)
        .set("Authorization", `Bearer ${warehouseManagerToken}`)
        .send({
          warehouseId,
          storeKeeperId,
          scheduledDate: new Date().toISOString(),
          notes: "Prepare urgently",
        });
      if (res.status !== 200) {
        console.log('Schedule prep error:', res.body);
        console.log('warehouseManagerId:', warehouseManagerId);
        console.log('warehouse manager warehouse:', warehouseId);
      }
      expect(res.status).toBe(200);
      expect(res.body.data.status).toBe("PENDING");
    });
  });

  describe("Store Keeper Preparation", () => {
    let salesOrderId;
    let taskId;

    beforeEach(async () => {
      const createRes = await request(app)
        .post(`${BASE_URL}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          warehouseId,
          deliveryLocation: { latitude: 9.032, longitude: 38.7469, addressText: "Addis Ababa" },
          items: [{ productId: productId, quantity: 10 }],
        });
      salesOrderId = createRes.body.data.id;

      await request(app)
        .post(`${BASE_URL}/${salesOrderId}/approve`)
        .set("Authorization", `Bearer ${salesRepToken}`);

      const scheduleRes = await request(app)
        .post(`${BASE_URL}/warehouse/${salesOrderId}/schedule-preparation`)
        .set("Authorization", `Bearer ${warehouseManagerToken}`)
        .send({ warehouseId, storeKeeperId, scheduledDate: new Date().toISOString() });
      taskId = scheduleRes.body.data.id;
    });

    it("store keeper can view assigned tasks", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/storekeeper/tasks`)
        .set("Authorization", `Bearer ${storeKeeperToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.data.length).toBeGreaterThan(0);
    });

    it("store keeper can mark items prepared", async () => {
      const taskRes = await request(app)
        .get(`${BASE_URL}/storekeeper/tasks/${taskId}`)
        .set("Authorization", `Bearer ${storeKeeperToken}`);
      const itemId = taskRes.body.data.items[0].id;

      const res = await request(app)
        .post(`${BASE_URL}/storekeeper/tasks/${taskId}/mark-prepared`)
        .set("Authorization", `Bearer ${storeKeeperToken}`)
        .send({ items: [{ preparationTaskItemId: itemId, preparedQuantity: 10 }] });
      if (res.status !== 200) {
        console.log('Mark prepared error:', res.body);
      }
      expect(res.status).toBe(200);
    });
  });

  describe("Driver Delivery", () => {
    let salesOrderId;
    let deliveryId;

    beforeEach(async () => {
      const createRes = await request(app)
        .post(`${BASE_URL}`)
        .set("Authorization", `Bearer ${customerToken}`)
        .send({
          warehouseId,
          deliveryLocation: { latitude: 9.032, longitude: 38.7469, addressText: "Addis Ababa" },
          items: [{ productId: productId, quantity: 10 }],
        });
      salesOrderId = createRes.body.data.id;

      await request(app)
        .post(`${BASE_URL}/${salesOrderId}/approve`)
        .set("Authorization", `Bearer ${salesRepToken}`);

      const scheduleRes = await request(app)
        .post(`${BASE_URL}/warehouse/${salesOrderId}/schedule-preparation`)
        .set("Authorization", `Bearer ${warehouseManagerToken}`)
        .send({ warehouseId, storeKeeperId, scheduledDate: new Date().toISOString() });
      const taskId = scheduleRes.body.data.id;

      const taskRes = await request(app)
        .get(`${BASE_URL}/storekeeper/tasks/${taskId}`)
        .set("Authorization", `Bearer ${storeKeeperToken}`);
      const itemId = taskRes.body.data.items[0].id;

      await request(app)
        .post(`${BASE_URL}/storekeeper/tasks/${taskId}/mark-prepared`)
        .set("Authorization", `Bearer ${storeKeeperToken}`)
        .send({ items: [{ preparationTaskItemId: itemId, preparedQuantity: 10 }] });

      await request(app)
        .post(`${BASE_URL}/storekeeper/tasks/${taskId}/complete`)
        .set("Authorization", `Bearer ${storeKeeperToken}`);

      const deliveryRes = await request(app)
        .post(`${BASE_URL}/warehouse/${salesOrderId}/schedule-delivery`)
        .set("Authorization", `Bearer ${warehouseManagerToken}`)
        .send({
          scheduledDate: new Date().toISOString(),
          driverId,
          vehicleId,
        });
      console.log('Schedule delivery status:', deliveryRes.status);
      console.log('Schedule delivery body:', JSON.stringify(deliveryRes.body, null, 2));
      if (deliveryRes.status !== 200) {
        throw new Error(`Schedule delivery failed: ${deliveryRes.body.message || 'Unknown error'}`);
      }
      deliveryId = deliveryRes.body.data?.id;
      if (!deliveryId) {
        throw new Error('Delivery ID is missing from response');
      }
    });

    it("driver can view assigned deliveries", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/driver/deliveries`)
        .set("Authorization", `Bearer ${driverToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.data.length).toBeGreaterThan(0);
    });

    it("driver can view delivery details with customer location", async () => {
      const res = await request(app)
        .get(`${BASE_URL}/driver/deliveries/${deliveryId}`)
        .set("Authorization", `Bearer ${driverToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.deliveryLatitude).toBeDefined();
      expect(res.body.data.deliveryLongitude).toBeDefined();
    });

    it("driver can start delivery", async () => {
      const res = await request(app)
        .post(`${BASE_URL}/driver/deliveries/${deliveryId}/start`)
        .set("Authorization", `Bearer ${driverToken}`);
      expect(res.status).toBe(200);
    });
  });
});
