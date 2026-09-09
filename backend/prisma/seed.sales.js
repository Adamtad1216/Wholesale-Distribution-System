import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const REGION_CODE = 'ADD';
const REGION_NAME = 'Addis Ababa';
const COMPANY_NAME = 'Test Wholesale Ltd';
const BRANCH_CODE = 'BR-TEST-001';
const BRANCH_NAME = 'Main Branch';
const WAREHOUSE_CODE = 'WH-TEST-001';
const WAREHOUSE_NAME = 'Central Warehouse';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'clonetechnology@gmail.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Clone@123';
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME || 'System Administrator';
const adminParts = (ADMIN_FULL_NAME || '').trim().split(/\s+/);
const adminFirstName = adminParts[0] || 'System';
const adminLastName = adminParts.slice(1).join(' ') || 'Administrator';

const PRODUCTS = [
  { sku: 'PROD-TEST-001', name: 'Premium Teff Grain (50kg)', category: 'Grains & Cereals', brand: 'Harvest Gold', unit: 'Bag', abbreviation: 'BAG', sellingPrice: 4200, wholesalePrice: 3800, purchasePrice: 3200 },
  { sku: 'PROD-TEST-002', name: 'Refined Cooking Oil (20L)', category: 'Oils & Fats', brand: 'PureLife', unit: 'Jerrycan', abbreviation: 'JCAN', sellingPrice: 2600, wholesalePrice: 2350, purchasePrice: 2000 },
  { sku: 'PROD-TEST-003', name: 'Standard Wheat Flour (25kg)', category: 'Grains & Cereals', brand: 'SunMill', unit: 'Bag', abbreviation: 'BAG', sellingPrice: 1950, wholesalePrice: 1750, purchasePrice: 1500 },
  { sku: 'PROD-TEST-004', name: 'Packed Sugar (50kg)', category: 'Sugar & Sweeteners', brand: 'SweetPure', unit: 'Bag', abbreviation: 'BAG', sellingPrice: 4800, wholesalePrice: 4400, purchasePrice: 4000 },
  { sku: 'PROD-TEST-005', name: 'Imported Dry Yeast (500g)', category: 'Baking Ingredients', brand: 'BakerChoice', unit: 'Box', abbreviation: 'BOX', sellingPrice: 380, wholesalePrice: 320, purchasePrice: 260 },
];

async function ensureSchemaUpToDate(client) {
  try {
    await client.$executeRawUnsafe(`
      DO $$ BEGIN
        CREATE TYPE "FulfillmentType" AS ENUM ('DELIVERY', 'SELF_PICKUP');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        ALTER TYPE "SalesOrderStatus" ADD VALUE IF NOT EXISTS 'READY_FOR_PICKUP';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        ALTER TYPE "SalesOrderHistoryAction" ADD VALUE IF NOT EXISTS 'READY_FOR_PICKUP';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      DO $$ BEGIN
        ALTER TYPE "SalesOrderHistoryAction" ADD VALUE IF NOT EXISTS 'PICKED_UP';
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;

      ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "driver_confirmed_at" TIMESTAMP(3);
      ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "driver_notes" TEXT;
      ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "customer_confirmed_at" TIMESTAMP(3);
      ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "customer_confirmed_by" UUID;
      ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "customer_recipient_name" TEXT;
      ALTER TABLE "deliveries" ADD COLUMN IF NOT EXISTS "customer_notes" TEXT;
      ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "delivery_latitude" DECIMAL(10, 7);
      ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "delivery_longitude" DECIMAL(10, 7);
      ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "delivery_address_text" TEXT;
      ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "fulfillment_type" "FulfillmentType" DEFAULT 'DELIVERY';
      ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "pickup_person_name" TEXT;
      ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "pickup_phone" TEXT;
      ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "pickup_vehicle_plate" TEXT;
      ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "pickup_notes" TEXT;
      ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "picked_up_at" TIMESTAMP(3);
      ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "picked_up_by" UUID;
      ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "customer_pickup_confirmed_at" TIMESTAMP(3);
      ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "customer_pickup_confirmed_by" UUID;
      ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "customer_pickup_recipient_name" TEXT;
      ALTER TABLE "sales_orders" ADD COLUMN IF NOT EXISTS "customer_pickup_notes" TEXT;

      ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "make" TEXT;
      ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "model" TEXT;
      ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "year" INTEGER;
      ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "notes" TEXT;
      ALTER TABLE "vehicles" ADD COLUMN IF NOT EXISTS "assigned_driver_id" UUID;

      ALTER TABLE "discount_rules" ADD COLUMN IF NOT EXISTS "category_id" UUID;
      CREATE INDEX IF NOT EXISTS "discount_rules_category_id_status_idx" ON "discount_rules"("category_id", "status");
    `);
  } catch (err) {
    console.warn("Schema self-heal note:", err?.message);
  }
}

export async function seedAllWorkflowRolesAndUsers() {
  console.log('========================================================');
  console.log('Starting Complete End-to-End Sales & Fulfillment Seed...');
  console.log('========================================================');

  await ensureSchemaUpToDate(prisma);


  // 1. Region, Company, Branch, Warehouse
  const region = await prisma.region.upsert({
    where: { code: REGION_CODE },
    update: {},
    create: { name: REGION_NAME, code: REGION_CODE, description: 'Capital city of Ethiopia', isActive: true },
  });
  console.log(`Region ready: ${region.name} (${region.id})`);

  const existingCompany = await prisma.company.findFirst({ where: { name: COMPANY_NAME } });
  const company = existingCompany
    ? existingCompany
    : await prisma.company.create({ data: { name: COMPANY_NAME, regionId: region.id, status: 'ACTIVE' } });
  console.log(`Company ready: ${company.name} (${company.id})`);

  const branch = await prisma.branch.upsert({
    where: { branchCode: BRANCH_CODE },
    update: {},
    create: { companyId: company.id, branchCode: BRANCH_CODE, name: BRANCH_NAME, regionId: region.id, status: 'ACTIVE' },
  });
  console.log(`Branch ready: ${branch.name} (${branch.id})`);

  const warehouse = await prisma.warehouse.upsert({
    where: { code: WAREHOUSE_CODE },
    update: {},
    create: { code: WAREHOUSE_CODE, name: WAREHOUSE_NAME, branchId: branch.id, regionId: region.id, status: 'ACTIVE' },
  });
  console.log(`Warehouse ready: ${warehouse.name} (${warehouse.id})`);

  // 2. Roles & Permissions Setup
  const fulfillmentPermissions = [
    { name: 'sales_orders:create', module: 'sales_orders', action: 'create', description: 'Create sales orders' },
    { name: 'sales_orders:read', module: 'sales_orders', action: 'read', description: 'Read sales orders' },
    { name: 'sales_orders:update', module: 'sales_orders', action: 'update', description: 'Update sales orders' },
    { name: 'preparation_tasks:create', module: 'preparation_tasks', action: 'create', description: 'Schedule and create preparation tasks' },
    { name: 'preparation_tasks:read', module: 'preparation_tasks', action: 'read', description: 'Read preparation tasks' },
    { name: 'preparation_tasks:update', module: 'preparation_tasks', action: 'update', description: 'Update and complete preparation tasks' },
    { name: 'deliveries:create', module: 'deliveries', action: 'create', description: 'Schedule and create deliveries' },
    { name: 'deliveries:read', module: 'deliveries', action: 'read', description: 'Read deliveries' },
    { name: 'deliveries:update', module: 'deliveries', action: 'update', description: 'Start and complete deliveries' },
    { name: 'customers:read', module: 'customers', action: 'read', description: 'Read customers' },
    { name: 'products:read', module: 'products', action: 'read', description: 'Read products' },
    { name: 'warehouses:read', module: 'warehouses', action: 'read', description: 'Read warehouses' },
    { name: 'branches:read', module: 'branches', action: 'read', description: 'Read branches' },
    { name: 'REPORT_VIEW_SALES', module: 'reporting', action: 'view_sales', description: 'View sales reports' },
    { name: 'REPORT_VIEW_SALES_REPS', module: 'reporting', action: 'view_sales_reps', description: 'View sales reps reports' },
    { name: 'REPORT_VIEW_DASHBOARD', module: 'reporting', action: 'view_dashboard', description: 'View dashboard reports' },
  ];

  for (const perm of fulfillmentPermissions) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: { description: perm.description, module: perm.module, action: perm.action },
      create: perm,
    });
  }

  const roleDefs = [
    { name: 'SUPER_ADMIN', description: 'Super System Administrator' },
    { name: 'ADMIN', description: 'System Administrator' },
    { name: 'SALES_REPRESENTATIVE', description: 'Commercial Sales Representative' },
    { name: 'WAREHOUSE_MANAGER', description: 'Warehouse Logistics Manager' },
    { name: 'STORE_KEEPER', description: 'Warehouse Store Keeper' },
    { name: 'DRIVER', description: 'Logistics Delivery Driver' },
    { name: 'CUSTOMER', description: 'Wholesale B2B Customer' },
  ];

  const roles = {};
  for (const r of roleDefs) {
    roles[r.name] = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: r,
    });
  }

  // Grant role permissions
  const rolePermissionMap = {
    SALES_REPRESENTATIVE: ['sales_orders:create', 'sales_orders:read', 'sales_orders:update', 'customers:read', 'products:read', 'warehouses:read', 'deliveries:read', 'REPORT_VIEW_SALES', 'REPORT_VIEW_DASHBOARD'],
    WAREHOUSE_MANAGER: ['sales_orders:read', 'preparation_tasks:create', 'preparation_tasks:read', 'preparation_tasks:update', 'deliveries:create', 'deliveries:read', 'deliveries:update', 'vehicles:read', 'vehicles:create', 'vehicles:update', 'vehicles:delete', 'vehicles:assign', 'products:read', 'warehouses:read', 'branches:read'],
    STORE_KEEPER: ['preparation_tasks:read', 'preparation_tasks:update', 'products:read', 'warehouses:read', 'deliveries:read'],
    DRIVER: ['deliveries:read', 'deliveries:update', 'sales_orders:read'],
    CUSTOMER: ['sales_orders:create', 'sales_orders:read', 'products:read', 'warehouses:read'],
  };

  for (const [roleName, permNames] of Object.entries(rolePermissionMap)) {
    const roleObj = roles[roleName];
    for (const pName of permNames) {
      const permObj = await prisma.permission.findUnique({ where: { name: pName } });
      if (permObj) {
        const exists = await prisma.rolePermission.findFirst({
          where: { roleId: roleObj.id, permissionId: permObj.id },
        });
        if (!exists) {
          await prisma.rolePermission.create({
            data: { roleId: roleObj.id, permissionId: permObj.id },
          });
        }
      }
    }
  }

  // Super Admin & Admin wildcard / all permissions
  const allPermsInDb = await prisma.permission.findMany();
  for (const adminRoleName of ['SUPER_ADMIN', 'ADMIN']) {
    const roleObj = roles[adminRoleName];
    for (const permObj of allPermsInDb) {
      const exists = await prisma.rolePermission.findFirst({
        where: { roleId: roleObj.id, permissionId: permObj.id },
      });
      if (!exists) {
        await prisma.rolePermission.create({
          data: { roleId: roleObj.id, permissionId: permObj.id },
        });
      }
    }
  }

  // 3. Helper to create or update user + person + role
  async function seedUser({ username, email, password, firstName, lastName, phone, roleName }) {
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ username }, { person: { email } }],
      },
      include: { person: true },
    });

    const passwordHash = await bcrypt.hash(password, 12);

    let user;
    let person;

    if (existingUser) {
      user = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          username,
          passwordHash,
          isActive: true,
          accountStatus: 'ACTIVE',
        },
        include: { person: true },
      });
      person = await prisma.person.update({
        where: { id: user.personId },
        data: {
          firstName,
          lastName,
          phone,
          status: 'ACTIVE',
        },
      });
    } else {
      person = await prisma.person.create({
        data: { firstName, lastName, email, phone, status: 'ACTIVE' },
      });
      user = await prisma.user.create({
        data: {
          personId: person.id,
          username,
          passwordHash,
          isActive: true,
          accountStatus: 'ACTIVE',
          invitationAcceptedAt: new Date(),
        },
      });
    }

    const targetRole = roles[roleName];
    if (targetRole) {
      const hasRole = await prisma.userRole.findFirst({
        where: { userId: user.id, roleId: targetRole.id },
      });
      if (!hasRole) {
        await prisma.userRole.create({
          data: { userId: user.id, roleId: targetRole.id },
        });
      }
    }

    return { person, user };
  }

  // 4. Seed Super Admin (from Environment Variables)
  const adminAccount = await seedUser({
    username: ADMIN_USERNAME,
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    firstName: adminFirstName,
    lastName: adminLastName,
    phone: '+251911000000',
    roleName: 'SUPER_ADMIN',
  });
  console.log(`✓ Admin User: ${adminAccount.user.username} (${adminAccount.person.email})`);

  // 5. Seed Customer (Wholesale B2B Buyer)
  const customerAccount = await seedUser({
    username: 'customer',
    email: 'customer@testwholesale.com',
    password: 'Customer@123',
    firstName: 'Dawit',
    lastName: 'Mengistu',
    phone: '+251911998877',
    roleName: 'CUSTOMER',
  });

  let customerOrg = await prisma.organization.findFirst({
    where: { name: 'Abyssinia Trading PLC' },
  });
  if (!customerOrg) {
    customerOrg = await prisma.organization.create({
      data: {
        name: 'Abyssinia Trading PLC',
        taxNumber: '0098765432',
        email: 'info@abyssiniatrading.com',
        phone: '+251116667788',
        status: 'ACTIVE',
      },
    });
  }

  let immediatePaymentTerm = await prisma.paymentTerms.findFirst({
    where: { days: 0 },
  });
  if (!immediatePaymentTerm) {
    immediatePaymentTerm = await prisma.paymentTerms.create({
      data: {
        name: 'Immediate Payment (0 Days)',
        days: 0,
        description: 'Payment due immediately upon invoice issuance / pre-fulfillment',
      },
    });
  }

  const customerRecord = await prisma.customer.upsert({
    where: { customerCode: 'CUST-TEST-001' },
    update: {
      personId: customerAccount.person.id,
      organizationId: customerOrg.id,
      customerType: 'ORGANIZATION',
      creditLimit: 500000.0,
      paymentTermsId: immediatePaymentTerm.id,
      status: 'ACTIVE',
      isArchived: false,
    },
    create: {
      customerCode: 'CUST-TEST-001',
      personId: customerAccount.person.id,
      organizationId: customerOrg.id,
      customerType: 'ORGANIZATION',
      creditLimit: 500000.0,
      paymentTermsId: immediatePaymentTerm.id,
      status: 'ACTIVE',
    },
  });


  const existingAddress = await prisma.customerAddress.findFirst({
    where: { customerId: customerRecord.id },
  });

  if (existingAddress) {
    await prisma.customerAddress.update({
      where: { id: existingAddress.id },
      data: {
        address: 'Bole Sub-City, Road 4, House 120',
        city: 'Addis Ababa',
        isDefault: true,
        isActive: true,
      },
    });
  } else {
    await prisma.customerAddress.create({
      data: {
        customerId: customerRecord.id,
        label: 'Main HQ Delivery Point',
        address: 'Bole Sub-City, Road 4, House 120',
        city: 'Addis Ababa',
        isDefault: true,
        isActive: true,
      },
    });
  }
  console.log(`✓ Customer: ${customerAccount.user.username} (${customerOrg.name} / ${customerAccount.person.firstName} ${customerAccount.person.lastName})`);

  // 6. Seed Sales Representative
  const salesRepAccount = await seedUser({
    username: 'salesrep',
    email: 'salesrep@testwholesale.com',
    password: 'SalesRep@123',
    firstName: 'Abebe',
    lastName: 'Kebede',
    phone: '+251911223344',
    roleName: 'SALES_REPRESENTATIVE',
  });

  const salesRepEmployee = await prisma.employee.upsert({
    where: { employeeCode: 'EMP-SALES-001' },
    update: {
      personId: salesRepAccount.person.id,
      branchId: branch.id,
      department: 'Commercial Sales',
      status: 'ACTIVE',
      isAvailableForSales: true,
      salesTerritory: 'Central Addis Ababa',
      commissionRate: 5.0,
      isArchived: false,
    },
    create: {
      personId: salesRepAccount.person.id,
      employeeCode: 'EMP-SALES-001',
      branchId: branch.id,
      hireDate: new Date('2023-03-01'),
      department: 'Commercial Sales',
      status: 'ACTIVE',
      isAvailableForSales: true,
      salesTerritory: 'Central Addis Ababa',
      commissionRate: 5.0,
    },
  });
  console.log(`✓ Sales Representative: ${salesRepAccount.user.username} (${salesRepEmployee.employeeCode} • ${salesRepAccount.person.firstName} ${salesRepAccount.person.lastName})`);

  // 7. Seed Warehouse Manager
  const whManagerAccount = await seedUser({
    username: 'whmanager',
    email: 'whmanager@testwholesale.com',
    password: 'WhManager@123',
    firstName: 'Tadesse',
    lastName: 'Alemu',
    phone: '+251911334455',
    roleName: 'WAREHOUSE_MANAGER',
  });

  const whManagerEmployee = await prisma.employee.upsert({
    where: { employeeCode: 'EMP-WHM-001' },
    update: {
      personId: whManagerAccount.person.id,
      branchId: branch.id,
      department: 'Warehouse Management',
      status: 'ACTIVE',
      isArchived: false,
    },
    create: {
      personId: whManagerAccount.person.id,
      employeeCode: 'EMP-WHM-001',
      branchId: branch.id,
      hireDate: new Date('2022-06-15'),
      department: 'Warehouse Management',
      status: 'ACTIVE',
      isAvailableForSales: false,
    },
  });

  // Assign Warehouse Manager to Central Warehouse
  await prisma.warehouse.update({
    where: { id: warehouse.id },
    data: { managerId: whManagerEmployee.id },
  });
  console.log(`✓ Warehouse Manager: ${whManagerAccount.user.username} (${whManagerEmployee.employeeCode} • ${whManagerAccount.person.firstName} ${whManagerAccount.person.lastName})`);

  // 8. Seed Storekeeper
  const storekeeperAccount = await seedUser({
    username: 'storekeeper',
    email: 'storekeeper@testwholesale.com',
    password: 'StoreKeeper@123',
    firstName: 'Haile',
    lastName: 'Gebrselassie',
    phone: '+251911445566',
    roleName: 'STORE_KEEPER',
  });

  const storekeeperEmployee = await prisma.employee.upsert({
    where: { employeeCode: 'EMP-STORE-001' },
    update: {
      personId: storekeeperAccount.person.id,
      branchId: branch.id,
      department: 'Store & Packaging',
      status: 'ACTIVE',
      isArchived: false,
    },
    create: {
      personId: storekeeperAccount.person.id,
      employeeCode: 'EMP-STORE-001',
      branchId: branch.id,
      hireDate: new Date('2023-01-10'),
      department: 'Store & Packaging',
      status: 'ACTIVE',
      isAvailableForSales: false,
    },
  });
  console.log(`✓ Storekeeper: ${storekeeperAccount.user.username} (${storekeeperEmployee.employeeCode} • ${storekeeperAccount.person.firstName} ${storekeeperAccount.person.lastName})`);

  // 9. Seed Delivery Driver
  const driverAccount = await seedUser({
    username: 'driver',
    email: 'driver@testwholesale.com',
    password: 'Driver@123',
    firstName: 'Kenenisa',
    lastName: 'Bekele',
    phone: '+251911556677',
    roleName: 'DRIVER',
  });

  const driverEmployee = await prisma.employee.upsert({
    where: { employeeCode: 'EMP-DRV-001' },
    update: {
      personId: driverAccount.person.id,
      branchId: branch.id,
      department: 'Fleet & Logistics',
      status: 'ACTIVE',
      driverLicenseNumber: 'DL-ETH-98214',
      isArchived: false,
    },
    create: {
      personId: driverAccount.person.id,
      employeeCode: 'EMP-DRV-001',
      branchId: branch.id,
      hireDate: new Date('2023-05-20'),
      department: 'Fleet & Logistics',
      status: 'ACTIVE',
      driverLicenseNumber: 'DL-ETH-98214',
      isAvailableForSales: false,
    },
  });
  console.log(`✓ Driver: ${driverAccount.user.username} (${driverEmployee.employeeCode} • ${driverAccount.person.firstName} ${driverAccount.person.lastName})`);

  // 10. Seed Fleet Vehicles
  const vehiclesData = [
    { plateNumber: 'ET-3-A10293', vehicleType: 'VAN', capacity: 1500.0 },
    { plateNumber: 'ET-3-B48201', vehicleType: 'TRUCK', capacity: 5000.0 },
  ];

  for (const v of vehiclesData) {
    const vehicle = await prisma.vehicle.upsert({
      where: { plateNumber: v.plateNumber },
      update: { vehicleType: v.vehicleType, capacity: v.capacity, status: 'ACTIVE', isArchived: false },
      create: { plateNumber: v.plateNumber, vehicleType: v.vehicleType, capacity: v.capacity, status: 'ACTIVE' },
      select: { plateNumber: true, vehicleType: true },
    });
    console.log(`✓ Fleet Vehicle: ${vehicle.plateNumber} (${vehicle.vehicleType})`);
  }

  // 11. Seed Products and Inventory Stock
  const brand = await prisma.brand.upsert({
    where: { name: 'Premium Wholesale' },
    update: {},
    create: { name: 'Premium Wholesale', description: 'Premium staple goods brand', status: 'ACTIVE' },
  });

  const unitCache = new Map();
  for (const p of PRODUCTS) {
    if (!unitCache.has(p.unit)) {
      const existingUnit = await prisma.unit.findFirst({ where: { name: p.unit } });
      const unit = existingUnit
        ? existingUnit
        : await prisma.unit.create({ data: { name: p.unit, abbreviation: p.abbreviation } });
      unitCache.set(p.unit, unit);
    }
  }

  const categoryCache = new Map();
  for (const p of PRODUCTS) {
    if (!categoryCache.has(p.category)) {
      const existingCategory = await prisma.category.findFirst({ where: { name: p.category } });
      const category = existingCategory
        ? existingCategory
        : await prisma.category.create({ data: { name: p.category, description: `Wholesale category for ${p.category}`, status: 'ACTIVE' } });
      categoryCache.set(p.category, category);
    }
  }

  for (const p of PRODUCTS) {
    const unit = unitCache.get(p.unit);
    const category = categoryCache.get(p.category);

    const product = await prisma.product.upsert({
      where: { sku: p.sku },
      update: {
        sellingPrice: p.sellingPrice,
        wholesalePrice: p.wholesalePrice,
        purchasePrice: p.purchasePrice,
        status: 'ACTIVE',
        isArchived: false,
      },
      create: {
        sku: p.sku,
        name: p.name,
        categoryId: category.id,
        brandId: brand.id,
        unitId: unit.id,
        sellingPrice: p.sellingPrice,
        wholesalePrice: p.wholesalePrice,
        purchasePrice: p.purchasePrice,
        minimumStockLevel: 10,
        reorderLevel: 5,
        status: 'ACTIVE',
      },
    });

    await prisma.warehouseStock.upsert({
      where: { warehouseId_productId: { warehouseId: warehouse.id, productId: product.id } },
      update: { quantity: 200, reservedQuantity: 0, availableQuantity: 200, minimumStock: 10, reorderLevel: 5 },
      create: {
        warehouseId: warehouse.id,
        productId: product.id,
        quantity: 200,
        reservedQuantity: 0,
        availableQuantity: 200,
        minimumStock: 10,
        reorderLevel: 5,
      },
    });
    console.log(`✓ Product In Stock: ${product.name} (SKU: ${product.sku}) - 200 ${unit.name}s in ${warehouse.name}`);
  }

  // 7. Seed Initial Sales Workflow Notifications for Demo Users
  console.log('\nSeeding Initial Sales Workflow Notifications...');
  const initialNotifications = [
    {
      userId: adminAccount.user.id,
      title: 'New Sales Order Activity',
      message: 'Customer Dawit Mengistu (Abyssinia Trading PLC) submitted Sales Order #SO-2026-0001.',
      type: 'SALES_ORDER_SUBMITTED',
      isRead: false,
    },
    {
      userId: adminAccount.user.id,
      title: 'Commercial Invoice Issued',
      message: 'Commercial invoice #INV-2026-0001 generated for Sales Order #SO-2026-0001.',
      type: 'INVOICE_CREATED',
      isRead: false,
    },
    {
      userId: salesRepAccount.user.id,
      title: 'New Sales Order Submitted',
      message: 'Order #SO-2026-0001 placed by Abyssinia Trading PLC requires review & stock confirmation.',
      type: 'SALES_ORDER_SUBMITTED',
      isRead: false,
    },
    {
      userId: whManagerAccount.user.id,
      title: 'Order Approved - Ready for Preparation',
      message: 'Sales order #SO-2026-0001 approved by sales rep. Schedule warehouse preparation & staging.',
      type: 'SALES_ORDER_APPROVED',
      isRead: false,
    },
    {
      userId: storekeeperAccount.user.id,
      title: 'Warehouse Preparation Task Assigned',
      message: 'Picking ticket for order #SO-2026-0001 assigned to you at Central Warehouse. Ready to stage.',
      type: 'PREPARATION_TASK_ASSIGNED',
      isRead: false,
    },
    {
      userId: driverAccount.user.id,
      title: 'Delivery Run Assigned',
      message: 'Order #SO-2026-0001 assigned for route dispatch with vehicle ET-3-A10293.',
      type: 'DELIVERY_ASSIGNED',
      isRead: false,
    },
    {
      userId: customerAccount.user.id,
      title: 'Sales Order Approved & Commercial Invoice Issued',
      message: 'Your order #SO-2026-0001 has been approved. Invoice #INV-2026-0001 is ready for payment.',
      type: 'SALES_ORDER_APPROVED',
      isRead: false,
    },
  ];

  for (const notif of initialNotifications) {
    const existing = await prisma.notification.findFirst({
      where: {
        userId: notif.userId,
        title: notif.title,
        isArchived: false,
      },
    });
    if (!existing) {
      await prisma.notification.create({
        data: {
          userId: notif.userId,
          title: notif.title,
          message: notif.message,
          type: notif.type,
          isRead: notif.isRead,
          createdById: adminAccount.user.id,
        },
      });
    }
  }
  console.log('✓ Initial Sales Workflow Notifications seeded for demo users.');

  console.log('\n========================================================');
  console.log('SEED SUMMARY: Complete Roles & User Accounts Ready:');
  console.log('========================================================');
  console.log('1. CUSTOMER:');
  console.log('   Username: customer | Password: Customer@123 | Dawit Mengistu (Abyssinia Trading PLC)');
  console.log('2. SALES REPRESENTATIVE:');
  console.log('   Username: salesrep | Password: SalesRep@123 | Abebe Kebede (EMP-SALES-001)');
  console.log('3. WAREHOUSE MANAGER:');
  console.log('   Username: whmanager | Password: WhManager@123 | Tadesse Alemu (EMP-WHM-001)');
  console.log('4. STOREKEEPER:');
  console.log('   Username: storekeeper | Password: StoreKeeper@123 | Haile Gebrselassie (EMP-STORE-001)');
  console.log('5. DRIVER:');
  console.log('   Username: driver | Password: Driver@123 | Kenenisa Bekele (EMP-DRV-001)');
  console.log('6. SUPER ADMIN:');
  console.log(`   Username: ${ADMIN_USERNAME} | Password: ${ADMIN_PASSWORD} | ${ADMIN_FULL_NAME} (${ADMIN_EMAIL})`);
  console.log('========================================================\n');
}

// If run directly via node prisma/seed.sales.js
if (process.argv[1]?.endsWith('seed.sales.js')) {
  seedAllWorkflowRolesAndUsers()
    .catch((e) => {
      console.error('Seed error:', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
