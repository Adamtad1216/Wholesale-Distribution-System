import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const PASSWORD = 'Minte@123';

// ─── Permission Sets ──────────────────────────────────────────────

const BRANCH_MANAGER_PERMISSIONS = [
  // Branch & Warehouse admin
  'branches:read',
  'branches:update',
  'warehouses:read',
  'warehouses:update',

  // Warehouse Stock — full CRUD
  'inventory:stock:read',
  'inventory:stock:create',
  'inventory:stock:update',
  'inventory:stock:delete',

  // Stock Adjustments — full lifecycle + approval
  'inventory:adjustments:read',
  'inventory:adjustments:create',
  'inventory:adjustments:update',
  'inventory:adjustments:approve',
  'inventory:adjustments:delete',

  // Stock Transfers — full lifecycle + approval
  'inventory:transfers:read',
  'inventory:transfers:create',
  'inventory:transfers:update',
  'inventory:transfers:approve',
  'inventory:transfers:delete',

  // Stock Reservations — full lifecycle + approval + release
  'inventory:reservations:read',
  'inventory:reservations:create',
  'inventory:reservations:update',
  'inventory:reservations:approve',
  'inventory:reservations:release',
  'inventory:reservations:delete',

  // Read-only lookups for reservation forms
  'products:read',
  'customers:read',
  'sales_orders:create',
  'sales_orders:read',

  // Dashboard & reports
  'REPORT_VIEW_DASHBOARD',
  'REPORT_VIEW_WAREHOUSE',
  'REPORT_VIEW_SALES',
];

const WAREHOUSE_MANAGER_PERMISSIONS = [
  // Warehouse read only
  'warehouses:read',

  // Warehouse Stock — read, create, update (no delete)
  'inventory:stock:read',
  'inventory:stock:create',
  'inventory:stock:update',

  // Stock Adjustments — submit only (no approve, no delete)
  'inventory:adjustments:read',
  'inventory:adjustments:create',
  'inventory:adjustments:update',

  // Stock Transfers — dispatch only (no approve, no delete)
  'inventory:transfers:read',
  'inventory:transfers:create',
  'inventory:transfers:update',

  // Stock Reservations — create and release only (no approve)
  'inventory:reservations:read',
  'inventory:reservations:create',
  'inventory:reservations:update',
  'inventory:reservations:release',

  // Read-only lookups
  'products:read',
  'sales_orders:read',

  // Reports
  'REPORT_VIEW_WAREHOUSE',
];

// ─── User Definitions ─────────────────────────────────────────────

const USERS = [
  {
    username: 'branchmanager',
    firstName: 'Abebe',
    lastName: 'Tadesse',
    email: 'branchmanager@wholesaledistribution.com',
    phone: '+251 91 200 0001',
    employeeCode: 'EMP-BM-001',
    department: 'Branch Operations',
    roleName: 'BRANCH_MANAGER',
    warehouseCode: 'WH-TEST-001',
    branchCode: 'BR-HQ-01',
    assignAsBranchManager: true,
  },
  {
    username: 'branchmanager2',
    firstName: 'Tigist',
    lastName: 'Bekele',
    email: 'branchmanager2@wholesaledistribution.com',
    phone: '+251 91 200 0002',
    employeeCode: 'EMP-BM-002',
    department: 'Branch Operations',
    roleName: 'BRANCH_MANAGER',
    warehouseCode: 'WH-EAST-002',
    branchCode: 'BR-EAST-01',
    assignAsBranchManager: true,
  },
  {
    username: 'warehousemanager',
    firstName: 'Dawit',
    lastName: 'Gebre',
    email: 'warehousemanager@wholesaledistribution.com',
    phone: '+251 91 200 0003',
    employeeCode: 'EMP-WM-001',
    department: 'Warehouse Operations',
    roleName: 'WAREHOUSE_MANAGER',
    warehouseCode: 'WH-TEST-001',
    branchCode: 'BR-HQ-01',
    assignAsBranchManager: false,
  },
  {
    username: 'warehousemanager2',
    firstName: 'Sara',
    lastName: 'Mekonnen',
    email: 'warehousemanager2@wholesaledistribution.com',
    phone: '+251 91 200 0004',
    employeeCode: 'EMP-WM-002',
    department: 'Warehouse Operations',
    roleName: 'WAREHOUSE_MANAGER',
    warehouseCode: 'WH-EAST-002',
    branchCode: 'BR-EAST-01',
    assignAsBranchManager: false,
  },
];

// ─── Helpers ──────────────────────────────────────────────────────

async function ensurePermissionExists(name) {
  return prisma.permission.upsert({
    where: { name },
    update: {},
    create: {
      name,
      module: name.split(':')[0] || 'general',
      action: name.split(':').slice(1).join(':') || 'access',
      description: `Permission: ${name}`,
    },
  });
}

async function ensureRole(roleName, description, permissionNames) {
  const role = await prisma.role.upsert({
    where: { name: roleName },
    update: { description },
    create: { name: roleName, description },
  });

  // Ensure all permissions exist and fetch their IDs
  const permissionIds = [];
  for (const permName of permissionNames) {
    const perm = await ensurePermissionExists(permName);
    permissionIds.push(perm.id);
  }

  // Assign permissions to role (idempotent)
  for (const permId of permissionIds) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: role.id, permissionId: permId } },
      update: { isArchived: false },
      create: { roleId: role.id, permissionId: permId },
    });
  }

  console.log(`  ✓ Role "${roleName}" ready with ${permissionIds.length} permissions`);
  return role;
}

async function refreshAdminPermissions() {
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: { description: 'System Administrator with full access' },
    create: { name: 'ADMIN', description: 'System Administrator with full access' },
  });

  const allPermissions = await prisma.permission.findMany();
  let added = 0;
  for (const perm of allPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: { isArchived: false },
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
    added++;
  }
  console.log(`  ✓ ADMIN role refreshed with ${added} permissions`);

  // Ensure 'admin' user exists, is ACTIVE, and has password Minte@123
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  let adminUser = await prisma.user.findFirst({
    where: { username: 'admin' },
  });

  if (!adminUser) {
    let adminPerson = await prisma.person.findFirst({
      where: { email: 'admin@wholesaledistribution.com' },
    });
    if (!adminPerson) {
      adminPerson = await prisma.person.create({
        data: {
          firstName: 'System',
          lastName: 'Administrator',
          email: 'admin@wholesaledistribution.com',
          phone: '+251 91 100 0000',
          status: 'ACTIVE',
        },
      });
    }
    adminUser = await prisma.user.create({
      data: {
        personId: adminPerson.id,
        username: 'admin',
        passwordHash,
        isActive: true,
        accountStatus: 'ACTIVE',
        invitationAcceptedAt: new Date(),
      },
    });
  } else {
    adminUser = await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        passwordHash,
        isActive: true,
        accountStatus: 'ACTIVE',
        lockedUntil: null,
        failedLoginAttempts: 0,
      },
    });
  }

  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: adminUser.id, roleId: adminRole.id } },
    update: { isArchived: false },
    create: { userId: adminUser.id, roleId: adminRole.id },
  });
  console.log(`  ✓ ADMIN user "admin" updated with password "${PASSWORD}" and active status`);

  return adminRole;
}

// ─── Infrastructure ───────────────────────────────────────────────

async function ensureInfrastructure() {
  // Region
  const region = await prisma.region.upsert({
    where: { code: 'AA' },
    update: {},
    create: { code: 'AA', name: 'Addis Ababa', description: 'Capital Region', isActive: true },
  });

  // Company
  let company = await prisma.company.findFirst({ where: { isArchived: false } });
  if (!company) {
    company = await prisma.company.create({
      data: {
        name: 'Main Wholesale Distribution Enterprise',
        tradeLicenseNumber: 'TL-HQ-001',
        regionId: region.id,
        status: 'ACTIVE',
      },
    });
  }

  // HQ Branch
  const hqBranch = await prisma.branch.upsert({
    where: { branchCode: 'BR-HQ-01' },
    update: {},
    create: {
      branchCode: 'BR-HQ-01',
      name: 'Headquarters Main Branch',
      isHeadOffice: true,
      companyId: company.id,
      regionId: region.id,
      city: 'Addis Ababa',
      phone: '+251 11 123 4567',
      email: 'hq@wholesaledistribution.com',
      status: 'ACTIVE',
    },
  });

  // Eastern Branch
  const eastBranch = await prisma.branch.upsert({
    where: { branchCode: 'BR-EAST-01' },
    update: {},
    create: {
      branchCode: 'BR-EAST-01',
      name: 'Eastern Distribution Branch',
      isHeadOffice: false,
      companyId: company.id,
      regionId: region.id,
      city: 'Addis Ababa',
      subCity: 'Bole',
      phone: '+251 11 234 5678',
      email: 'east@wholesaledistribution.com',
      status: 'ACTIVE',
    },
  });

  // Central Warehouse (HQ)
  const centralWarehouse = await prisma.warehouse.upsert({
    where: { code: 'WH-TEST-001' },
    update: {},
    create: {
      code: 'WH-TEST-001',
      name: 'Central Warehouse',
      branchId: hqBranch.id,
      regionId: region.id,
      city: 'Addis Ababa',
      status: 'ACTIVE',
    },
  });

  // Eastern Distribution Center
  const eastWarehouse = await prisma.warehouse.upsert({
    where: { code: 'WH-EAST-002' },
    update: {},
    create: {
      code: 'WH-EAST-002',
      name: 'Eastern Distribution Center',
      branchId: eastBranch.id,
      regionId: region.id,
      city: 'Addis Ababa',
      subCity: 'Bole',
      status: 'ACTIVE',
    },
  });

  console.log(`  ✓ Branches: ${hqBranch.name}, ${eastBranch.name}`);
  console.log(`  ✓ Warehouses: ${centralWarehouse.name} (${centralWarehouse.code}), ${eastWarehouse.name} (${eastWarehouse.code})`);

  return {
    region,
    company,
    branches: { 'BR-HQ-01': hqBranch, 'BR-EAST-01': eastBranch },
    warehouses: { 'WH-TEST-001': centralWarehouse, 'WH-EAST-002': eastWarehouse },
  };
}

// ─── User Creation ────────────────────────────────────────────────

async function createUser(userDef, roles, infra) {
  const passwordHash = await bcrypt.hash(PASSWORD, 12);
  const role = roles[userDef.roleName];
  const warehouse = infra.warehouses[userDef.warehouseCode];
  const branch = infra.branches[userDef.branchCode];

  if (!role) throw new Error(`Role ${userDef.roleName} not found`);
  if (!warehouse) throw new Error(`Warehouse ${userDef.warehouseCode} not found`);
  if (!branch) throw new Error(`Branch ${userDef.branchCode} not found`);

  // 1. Person
  let person = await prisma.person.findFirst({ where: { email: userDef.email } });
  if (!person) {
    person = await prisma.person.create({
      data: {
        firstName: userDef.firstName,
        lastName: userDef.lastName,
        email: userDef.email,
        phone: userDef.phone,
        status: 'ACTIVE',
      },
    });
  } else {
    person = await prisma.person.update({
      where: { id: person.id },
      data: { firstName: userDef.firstName, lastName: userDef.lastName, phone: userDef.phone, status: 'ACTIVE' },
    });
  }

  // 2. Employee
  let employee = await prisma.employee.findFirst({
    where: { OR: [{ personId: person.id }, { employeeCode: userDef.employeeCode }] },
  });
  if (!employee) {
    employee = await prisma.employee.create({
      data: {
        personId: person.id,
        employeeCode: userDef.employeeCode,
        hireDate: new Date(),
        department: userDef.department,
        branchId: branch.id,
        status: 'ACTIVE',
      },
    });
  } else {
    employee = await prisma.employee.update({
      where: { id: employee.id },
      data: {
        branchId: branch.id,
        department: userDef.department,
        status: 'ACTIVE',
        isArchived: false,
      },
    });
  }

  // 3. Link employee as warehouse manager (for warehouse scope enforcement)
  await prisma.warehouse.update({
    where: { id: warehouse.id },
    data: { managerId: employee.id },
  });

  // Also create WarehouseManager assignment record
  const existingWmAssignment = await prisma.warehouseManager.findFirst({
    where: { warehouseId: warehouse.id, employeeId: employee.id },
  });
  if (!existingWmAssignment) {
    await prisma.warehouseManager.create({
      data: {
        warehouseId: warehouse.id,
        employeeId: employee.id,
        isCurrent: true,
        notes: `Assigned via seed script as ${userDef.roleName}`,
      },
    });
  }

  // 4. Optionally assign as branch manager too
  if (userDef.assignAsBranchManager) {
    const existingBmAssignment = await prisma.branchManager.findFirst({
      where: { branchId: branch.id, employeeId: employee.id },
    });
    if (!existingBmAssignment) {
      await prisma.branchManager.create({
        data: {
          branchId: branch.id,
          employeeId: employee.id,
          isCurrent: true,
          notes: `Assigned via seed script as Branch Manager`,
        },
      });
    }
  }

  // 5. User account
  let user = await prisma.user.findFirst({
    where: { OR: [{ username: userDef.username }, { personId: person.id }] },
  });
  if (!user) {
    user = await prisma.user.create({
      data: {
        personId: person.id,
        username: userDef.username,
        passwordHash,
        isActive: true,
        accountStatus: 'ACTIVE',
        invitationAcceptedAt: new Date(),
      },
    });
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        username: userDef.username,
        passwordHash,
        isActive: true,
        accountStatus: 'ACTIVE',
      },
    });
  }

  // 6. Assign role
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: role.id } },
    update: { isArchived: false },
    create: { userId: user.id, roleId: role.id },
  });

  console.log(`  ✓ User "${userDef.username}" (${userDef.firstName} ${userDef.lastName}) → ${userDef.roleName} → ${warehouse.name}`);
  return { person, employee, user };
}

// ─── Warehouse Stock Seeding ──────────────────────────────────────

async function seedWarehouseStock(warehouses) {
  const products = await prisma.product.findMany({
    where: { isArchived: false },
    take: 5,
    orderBy: { createdAt: 'asc' },
  });

  if (products.length === 0) {
    console.log('  ⚠ No products found — skipping stock seeding. Run seed.sales.js first.');
    return products;
  }

  for (const wh of Object.values(warehouses)) {
    for (const prod of products.slice(0, 3)) {
      await prisma.warehouseStock.upsert({
        where: { warehouseId_productId: { warehouseId: wh.id, productId: prod.id } },
        update: {
          quantity: 200,
          availableQuantity: 200,
          reservedQuantity: 0,
          isArchived: false,
          archivedAt: null,
        },
        create: {
          warehouseId: wh.id,
          productId: prod.id,
          quantity: 200,
          availableQuantity: 200,
          reservedQuantity: 0,
          minimumStock: 15,
          reorderLevel: 30,
        },
      });
    }
    console.log(`  ✓ Stock seeded in ${wh.name} for ${Math.min(products.length, 3)} products`);
  }

  return products;
}

// ─── Sales Order Seeding ──────────────────────────────────────────

async function seedSalesOrders(warehouses, products) {
  if (products.length < 2) {
    console.log('  ⚠ Need at least 2 products for sales orders — skipping.');
    return;
  }

  // Get or create customers
  let customers = await prisma.customer.findMany({
    where: { isArchived: false },
    include: { person: true, organization: true },
    take: 2,
  });

  if (customers.length === 0) {
    // Create 2 test customers
    const custPerson1 = await prisma.person.create({
      data: { firstName: 'Kebede', lastName: 'Hailu', email: 'kebede@testcustomer.com', phone: '+251 91 300 0001', status: 'ACTIVE' },
    });
    const custPerson2 = await prisma.person.create({
      data: { firstName: 'Meron', lastName: 'Alemu', email: 'meron@testcustomer.com', phone: '+251 91 300 0002', status: 'ACTIVE' },
    });

    const cust1 = await prisma.customer.create({
      data: { customerCode: 'CUST-INV-001', personId: custPerson1.id, customerType: 'PERSON', status: 'ACTIVE' },
    });
    const cust2 = await prisma.customer.create({
      data: { customerCode: 'CUST-INV-002', personId: custPerson2.id, customerType: 'PERSON', status: 'ACTIVE' },
    });

    customers = [
      { ...cust1, person: custPerson1 },
      { ...cust2, person: custPerson2 },
    ];
    console.log('  ✓ Created 2 test customers for sales orders');
  }

  // Get a sales rep
  const salesRep = await prisma.employee.findFirst({
    where: { isArchived: false, status: 'ACTIVE' },
  });

  const whCentral = warehouses['WH-TEST-001'];
  const whEast = warehouses['WH-EAST-002'];

  const orderConfigs = [
    {
      orderNumber: 'SO-INV-0001',
      status: 'APPROVED',
      warehouseId: whCentral.id,
      customerId: customers[0].id,
      notes: 'Corporate restock – ready for reservation',
    },
    {
      orderNumber: 'SO-INV-0002',
      status: 'APPROVED',
      warehouseId: whEast.id,
      customerId: customers[1 % customers.length].id,
      notes: 'Eastern branch replenishment – ready for reservation',
    },
    {
      orderNumber: 'SO-INV-0003',
      status: 'PENDING_REVIEW',
      warehouseId: whCentral.id,
      customerId: customers[0].id,
      notes: 'Pending wholesale order – not yet approvable for reservation',
    },
    {
      orderNumber: 'SO-INV-0004',
      status: 'APPROVED',
      warehouseId: whEast.id,
      customerId: customers[1 % customers.length].id,
      notes: 'Multi-item approved order for eastern branch',
    },
  ];

  const orderProducts = products.slice(0, 2);

  for (const config of orderConfigs) {
    const existing = await prisma.salesOrder.findUnique({
      where: { orderNumber: config.orderNumber },
    });

    if (existing) {
      await prisma.salesOrder.update({
        where: { id: existing.id },
        data: {
          status: config.status,
          warehouseId: config.warehouseId,
          customerId: config.customerId,
          isArchived: false,
        },
      });
      console.log(`  ↻ Updated existing order ${config.orderNumber} → ${config.status}`);
      continue;
    }

    // Build line items
    let subtotal = 0;
    const itemsData = orderProducts.map((p, idx) => {
      const qty = (idx + 1) * 15; // 15, 30
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

    await prisma.salesOrder.create({
      data: {
        orderNumber: config.orderNumber,
        customerId: config.customerId,
        warehouseId: config.warehouseId,
        salesRepId: salesRep?.id || null,
        source: 'CUSTOMER_PORTAL',
        orderDate: new Date(),
        requiredDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        status: config.status,
        subtotal,
        discount: 0,
        tax,
        total,
        deliveryAddressText: 'Addis Ababa, Bole Sub-City, Compound 4',
        items: { create: itemsData },
      },
    });

    console.log(`  ✓ Created ${config.orderNumber} (${config.status}) → ${config.warehouseId === whCentral.id ? 'Central Warehouse' : 'Eastern Distribution'}`);
  }
}

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════════════╗');
  console.log('║  Inventory Roles & Test Data Seed                           ║');
  console.log('╚══════════════════════════════════════════════════════════════╝');
  console.log('');

  // 1. Infrastructure
  console.log('▸ Setting up infrastructure...');
  const infra = await ensureInfrastructure();

  // 2. Roles
  console.log('');
  console.log('▸ Creating roles...');
  const branchManagerRole = await ensureRole(
    'BRANCH_MANAGER',
    'Branch Manager – Full branch-level inventory operations with approval authority',
    BRANCH_MANAGER_PERMISSIONS,
  );

  const warehouseManagerRole = await ensureRole(
    'WAREHOUSE_MANAGER',
    'Warehouse Manager – Day-to-day warehouse inventory operations (no approval authority)',
    WAREHOUSE_MANAGER_PERMISSIONS,
  );

  // 3. Refresh ADMIN
  await refreshAdminPermissions();

  const roles = {
    BRANCH_MANAGER: branchManagerRole,
    WAREHOUSE_MANAGER: warehouseManagerRole,
  };

  // 4. Users
  console.log('');
  console.log('▸ Creating test users...');
  for (const userDef of USERS) {
    await createUser(userDef, roles, infra);
  }

  // 5. Warehouse Stock
  console.log('');
  console.log('▸ Seeding warehouse stock...');
  const products = await seedWarehouseStock(infra.warehouses);

  // 6. Sales Orders
  console.log('');
  console.log('▸ Seeding sample sales orders...');
  await seedSalesOrders(infra.warehouses, products);

  // 7. Summary
  console.log('');
  console.log('┌──────────────────────────────────────────────────────────────┐');
  console.log('│  ✅ Seed completed successfully!                             │');
  console.log('├──────────────────────────────────────────────────────────────┤');
  console.log('│  Test Accounts (Password: Minte@123)                        │');
  console.log('│                                                              │');
  console.log('│  branchmanager     → BRANCH_MANAGER  → Central Warehouse    │');
  console.log('│  branchmanager2    → BRANCH_MANAGER  → Eastern Distribution │');
  console.log('│  warehousemanager  → WAREHOUSE_MANAGER → Central Warehouse  │');
  console.log('│  warehousemanager2 → WAREHOUSE_MANAGER → Eastern Distribution│');
  console.log('│  admin             → ADMIN (all permissions)                │');
  console.log('├──────────────────────────────────────────────────────────────┤');
  console.log('│  Branch Managers: Can approve adjustments, transfers,       │');
  console.log('│                   reservations in their assigned warehouse  │');
  console.log('│  Warehouse Managers: Can create/edit but CANNOT approve     │');
  console.log('│  Admin: Full access across all warehouses                   │');
  console.log('└──────────────────────────────────────────────────────────────┘');
}

main()
  .catch((e) => {
    console.error('');
    console.error('✗ Seed failed:', e.message || e);
    console.error(e.stack);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
