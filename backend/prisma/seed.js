import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@example.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';
const ADMIN_FULL_NAME = process.env.ADMIN_FULL_NAME || 'System Administrator';

const ALL_PERMISSIONS = [
  { name: 'customers:create', module: 'customers', action: 'create', description: 'Create customers' },
  { name: 'customers:read', module: 'customers', action: 'read', description: 'Read customers' },
  { name: 'customers:update', module: 'customers', action: 'update', description: 'Update customers' },
  { name: 'customers:delete', module: 'customers', action: 'delete', description: 'Delete customers' },
  { name: 'companies:create', module: 'companies', action: 'create', description: 'Create companies' },
  { name: 'companies:read', module: 'companies', action: 'read', description: 'Read companies' },
  { name: 'companies:update', module: 'companies', action: 'update', description: 'Update companies' },
  { name: 'companies:delete', module: 'companies', action: 'delete', description: 'Delete companies' },
  { name: 'branches:create', module: 'branches', action: 'create', description: 'Create branches' },
  { name: 'branches:read', module: 'branches', action: 'read', description: 'Read branches' },
  { name: 'branches:update', module: 'branches', action: 'update', description: 'Update branches' },
  { name: 'branches:delete', module: 'branches', action: 'delete', description: 'Delete branches' },
  { name: 'warehouses:create', module: 'warehouses', action: 'create', description: 'Create warehouses' },
  { name: 'warehouses:read', module: 'warehouses', action: 'read', description: 'Read warehouses' },
  { name: 'warehouses:update', module: 'warehouses', action: 'update', description: 'Update warehouses' },
  { name: 'warehouses:delete', module: 'warehouses', action: 'delete', description: 'Delete warehouses' },
  { name: 'regions:create', module: 'regions', action: 'create', description: 'Create regions' },
  { name: 'regions:read', module: 'regions', action: 'read', description: 'Read regions' },
  { name: 'regions:update', module: 'regions', action: 'update', description: 'Update regions' },
  { name: 'regions:delete', module: 'regions', action: 'delete', description: 'Delete regions' },
  { name: 'jobSpecifications:create', module: 'jobSpecifications', action: 'create', description: 'Create job specifications' },
  { name: 'jobSpecifications:read', module: 'jobSpecifications', action: 'read', description: 'Read job specifications' },
  { name: 'jobSpecifications:update', module: 'jobSpecifications', action: 'update', description: 'Update job specifications' },
  { name: 'jobSpecifications:delete', module: 'jobSpecifications', action: 'delete', description: 'Delete job specifications' },
  { name: 'employees:create', module: 'employees', action: 'create', description: 'Create employees' },
  { name: 'employees:read', module: 'employees', action: 'read', description: 'Read employees' },
  { name: 'employees:update', module: 'employees', action: 'update', description: 'Update employees' },
  { name: 'employees:delete', module: 'employees', action: 'delete', description: 'Delete employees' },
  { name: 'users:create', module: 'users', action: 'create', description: 'Create users' },
  { name: 'users:read', module: 'users', action: 'read', description: 'Read users' },
  { name: 'users:update', module: 'users', action: 'update', description: 'Update users' },
  { name: 'users:resetPassword', module: 'users', action: 'resetPassword', description: 'Reset user passwords' },
  { name: 'inventory:stock:create', module: 'inventory', action: 'stock:create', description: 'Create warehouse stock' },
  { name: 'inventory:stock:read', module: 'inventory', action: 'stock:read', description: 'Read warehouse stock' },
  { name: 'inventory:stock:update', module: 'inventory', action: 'stock:update', description: 'Update warehouse stock' },
  { name: 'inventory:stock:delete', module: 'inventory', action: 'stock:delete', description: 'Delete warehouse stock' },
  { name: 'inventory:movements:read', module: 'inventory', action: 'movements:read', description: 'Read stock movements' },
  { name: 'inventory:movements:create', module: 'inventory', action: 'movements:create', description: 'Create stock movements' },
  { name: 'inventory:movements:delete', module: 'inventory', action: 'movements:delete', description: 'Delete stock movements' },
  { name: 'inventory:adjustments:create', module: 'inventory', action: 'adjustments:create', description: 'Create stock adjustments' },
  { name: 'inventory:adjustments:read', module: 'inventory', action: 'adjustments:read', description: 'Read stock adjustments' },
  { name: 'inventory:adjustments:update', module: 'inventory', action: 'adjustments:update', description: 'Update stock adjustments' },
  { name: 'inventory:adjustments:approve', module: 'inventory', action: 'adjustments:approve', description: 'Approve stock adjustments' },
  { name: 'inventory:adjustments:delete', module: 'inventory', action: 'adjustments:delete', description: 'Delete stock adjustments' },
  { name: 'inventory:reservations:create', module: 'inventory', action: 'reservations:create', description: 'Create stock reservations' },
  { name: 'inventory:reservations:read', module: 'inventory', action: 'reservations:read', description: 'Read stock reservations' },
  { name: 'inventory:reservations:release', module: 'inventory', action: 'reservations:release', description: 'Release stock reservations' },
  { name: 'inventory:reservations:delete', module: 'inventory', action: 'reservations:delete', description: 'Delete stock reservations' },
  { name: 'inventory:prices:create', module: 'inventory', action: 'prices:create', description: 'Create warehouse selling prices' },
  { name: 'inventory:prices:read', module: 'inventory', action: 'prices:read', description: 'Read warehouse selling prices' },
  { name: 'inventory:prices:update', module: 'inventory', action: 'prices:update', description: 'Update warehouse selling prices' },
  { name: 'inventory:prices:delete', module: 'inventory', action: 'prices:delete', description: 'Delete warehouse selling prices' },
  { name: 'inventory:fulfillment:create', module: 'inventory', action: 'fulfillment:create', description: 'Create fulfillment' },
  { name: 'inventory:fulfillment:read', module: 'inventory', action: 'fulfillment:read', description: 'Read fulfillment' },
  { name: 'inventory:transfers:create', module: 'inventory', action: 'transfers:create', description: 'Create transfers' },
  { name: 'inventory:transfers:read', module: 'inventory', action: 'transfers:read', description: 'Read transfers' },
];

// Role definitions with specific permissions for testing
const ROLE_DEFINITIONS = [
  {
    name: 'INVENTORY_MANAGER',
    description: 'Full inventory management access',
    permissions: [
      'inventory:stock:create', 'inventory:stock:read', 'inventory:stock:update', 'inventory:stock:delete',
      'inventory:movements:create', 'inventory:movements:read', 'inventory:movements:delete',
      'inventory:adjustments:create', 'inventory:adjustments:read', 'inventory:adjustments:update', 'inventory:adjustments:approve', 'inventory:adjustments:delete',
      'inventory:reservations:create', 'inventory:reservations:read', 'inventory:reservations:release', 'inventory:reservations:delete',
      'inventory:prices:create', 'inventory:prices:read', 'inventory:prices:update', 'inventory:prices:delete',
      'inventory:fulfillment:create', 'inventory:fulfillment:read',
      'inventory:transfers:create', 'inventory:transfers:read',
    ],
  },
  {
    name: 'WAREHOUSE_OPERATOR',
    description: 'Can create and update stock and movements',
    permissions: [
      'inventory:stock:create', 'inventory:stock:read', 'inventory:stock:update',
      'inventory:movements:create', 'inventory:movements:read',
      'inventory:adjustments:create', 'inventory:adjustments:read', 'inventory:adjustments:update',
      'inventory:reservations:create', 'inventory:reservations:read',
      'inventory:prices:create', 'inventory:prices:read',
    ],
  },
  {
    name: 'STOCK_AUDITOR',
    description: 'Read-only access to all inventory data',
    permissions: [
      'inventory:stock:read',
      'inventory:movements:read',
      'inventory:adjustments:read',
      'inventory:reservations:read',
      'inventory:fulfillment:read',
      'inventory:transfers:read',
    ],
  },
  {
    name: 'SALES_REP',
    description: 'Can view stock and create reservations',
    permissions: [
      'inventory:stock:read',
      'inventory:movements:read',
      'inventory:reservations:create', 'inventory:reservations:read', 'inventory:reservations:release',
    ],
  },
  {
    name: 'ADJUSTMENT_APPROVER',
    description: 'Can approve or reject stock adjustments',
    permissions: [
      'inventory:stock:read',
      'inventory:adjustments:read', 'inventory:adjustments:approve',
    ],
  },
];

async function main() {
  console.log('Starting seed...');

  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [
        { username: ADMIN_USERNAME },
        { person: { email: ADMIN_EMAIL } },
      ],
    },
    include: { person: true },
  });

  if (existingUser) {
    console.log(`Admin user already exists: ${existingUser.username} (${existingUser.id})`);
    await ensureAdminPermissions(existingUser.id);
    await seedRolesAndUsers(existingUser.id);
    await seedCompanyBranchWarehouse(existingUser.id);
    await seedProductCatalog(existingUser.id);
    await seedInventoryData(existingUser.id);
    console.log('Seed completed (idempotent).');
    return;
  }

  const [adminRole] = await prisma.$transaction(async (tx) => {
    const role = await tx.role.upsert({
      where: { name: 'ADMIN' },
      update: {},
      create: {
        name: 'ADMIN',
        description: 'System Administrator',
      },
    });

    const createdPermissions = [];
    for (const perm of ALL_PERMISSIONS) {
      const p = await tx.permission.upsert({
        where: { name: perm.name },
        update: {},
        create: perm,
      });
      createdPermissions.push(p);
    }

    await tx.rolePermission.deleteMany({
      where: { roleId: role.id },
    });

    for (const perm of createdPermissions) {
      await tx.rolePermission.create({
        data: {
          roleId: role.id,
          permissionId: perm.id,
        },
      });
    }

    const customerRole = await tx.role.upsert({
      where: { name: 'CUSTOMER' },
      update: {},
      create: {
        name: 'CUSTOMER',
        description: 'Customer',
      },
    });

    await tx.rolePermission.deleteMany({
      where: { roleId: customerRole.id },
    });

    return [role, createdPermissions];
  });

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
      data: {
        personId: person.id,
        username: ADMIN_USERNAME,
        passwordHash,
        isActive: true,
      },
    });

    await tx.userRole.create({
      data: {
        userId: user.id,
        roleId: adminRole.id,
      },
    });

    return [person, user];
  });

  console.log(`Admin user created: ${user.username} (${user.id})`);
  console.log(`Admin person created: ${person.firstName} ${person.lastName} (${person.id})`);
  await seedRolesAndUsers(user.id);
  await seedCompanyBranchWarehouse(user.id);
  await seedProductCatalog(user.id);
  await seedInventoryData(user.id);
  console.log('Seed completed successfully.');
}

async function seedProductCatalog(adminId) {
  console.log('Seeding product catalog...');

  const existingProduct = await prisma.product.findFirst();
  if (existingProduct) {
    console.log('Products already exist. Skipping product catalog seed.');
    return;
  }

  // Create units
  const units = [
    { name: 'Piece', abbreviation: 'pc' },
    { name: 'Kilogram', abbreviation: 'kg' },
    { name: 'Liter', abbreviation: 'L' },
    { name: 'Box', abbreviation: 'box' },
    { name: 'Carton', abbreviation: 'ctn' },
  ];

  const createdUnits = [];
  for (const unit of units) {
    let created = await prisma.unit.findFirst({ where: { name: unit.name } });
    if (!created) {
      created = await prisma.unit.create({ data: unit });
      console.log(`  Created unit: ${created.name}`);
    }
    createdUnits.push(created);
  }

  // Create brands
  const brands = [
    { name: 'Nestle', description: 'Nestle Ethiopia' },
    { name: 'Coca-Cola', description: 'Coca-Cola Ethiopia' },
    { name: 'Unilever', description: 'Unilever East Africa' },
    { name: 'Diageo', description: 'Diageo Ethiopia' },
    { name: 'Local Brand', description: 'Local Ethiopian brand' },
  ];

  const createdBrands = [];
  for (const brand of brands) {
    let created = await prisma.brand.findFirst({ where: { name: brand.name } });
    if (!created) {
      created = await prisma.brand.create({ data: brand });
      console.log(`  Created brand: ${created.name}`);
    }
    createdBrands.push(created);
  }

  // Create categories (parent)
  const parentCategories = [
    { name: 'Beverages', description: 'Drinks and beverages' },
    { name: 'Food', description: 'Food products' },
    { name: 'Household', description: 'Household items' },
    { name: 'Personal Care', description: 'Personal care products' },
  ];

  const createdParents = [];
  for (const cat of parentCategories) {
    let created = await prisma.category.findFirst({ where: { name: cat.name, parentId: null } });
    if (!created) {
      created = await prisma.category.create({
        data: {
          name: cat.name,
          description: cat.description,
          parentId: null,
          createdById: adminId,
        },
      });
      console.log(`  Created category: ${cat.name}`);
    }
    createdParents.push(created);
  }

  // Create sub-categories
  const subCategories = [
    { name: 'Soft Drinks', description: 'Soft drinks', parentId: createdParents[0].id },
    { name: 'Water', description: 'Bottled water', parentId: createdParents[0].id },
    { name: 'Grains', description: 'Grains and cereals', parentId: createdParents[1].id },
    { name: 'Cooking Oil', description: 'Cooking oils', parentId: createdParents[1].id },
    { name: 'Cleaning', description: 'Cleaning products', parentId: createdParents[2].id },
    { name: 'Soap', description: 'Soap products', parentId: createdParents[3].id },
  ];

  const createdSubCategories = [];
  for (const cat of subCategories) {
    let created = await prisma.category.findFirst({ where: { name: cat.name, parentId: cat.parentId } });
    if (!created) {
      created = await prisma.category.create({
        data: {
          name: cat.name,
          description: cat.description,
          parentId: cat.parentId,
          createdById: adminId,
        },
      });
      console.log(`  Created sub-category: ${cat.name}`);
    }
    createdSubCategories.push(created);
  }

  // Create products
  const products = [
    { name: 'Coca-Cola 500ml', sku: 'CC-500', categoryId: createdSubCategories[0].id, brandId: createdBrands[1].id, unitId: createdUnits[0].id, sellingPrice: 25 },
    { name: 'Fanta Orange 500ml', sku: 'FN-500', categoryId: createdSubCategories[0].id, brandId: createdBrands[1].id, unitId: createdUnits[0].id, sellingPrice: 25 },
    { name: 'Dasani Water 500ml', sku: 'DAS-500', categoryId: createdSubCategories[1].id, brandId: createdBrands[1].id, unitId: createdUnits[0].id, sellingPrice: 15 },
    { name: 'Teff Flour 1kg', sku: 'TEF-1K', categoryId: createdSubCategories[2].id, brandId: createdBrands[4].id, unitId: createdUnits[1].id, sellingPrice: 80 },
    { name: 'Sunflower Oil 1L', sku: 'SUN-1L', categoryId: createdSubCategories[3].id, brandId: createdBrands[2].id, unitId: createdUnits[2].id, sellingPrice: 150 },
    { name: 'OMO Detergent 1kg', sku: 'OMO-1K', categoryId: createdSubCategories[4].id, brandId: createdBrands[2].id, unitId: createdUnits[1].id, sellingPrice: 120 },
    { name: 'Lux Soap 100g', sku: 'LUX-100', categoryId: createdSubCategories[5].id, brandId: createdBrands[2].id, unitId: createdUnits[0].id, sellingPrice: 35 },
  ];

  for (const prod of products) {
    await prisma.product.create({
      data: {
        name: prod.name,
        sku: prod.sku,
        categoryId: prod.categoryId,
        brandId: prod.brandId,
        unitId: prod.unitId,
        sellingPrice: prod.sellingPrice,
        createdById: adminId,
      },
    });
    console.log(`  Created product: ${prod.name}`);
  }

  console.log('Product catalog seeded.');
}

async function seedInventoryData(adminId) {
  console.log('Seeding inventory data...');

  const warehouses = await prisma.warehouse.findMany();
  const products = await prisma.product.findMany({ where: { isArchived: false } });

  if (warehouses.length === 0 || products.length === 0) {
    console.log('No warehouses or products found. Skipping inventory seed.');
    return;
  }

  const warehouse = warehouses[0];

  for (const product of products.slice(0, 5)) {
    const existingStock = await prisma.warehouseStock.findFirst({
      where: { warehouseId: warehouse.id, productId: product.id },
    });

    if (!existingStock) {
      const quantity = Math.floor(Math.random() * 500) + 100;
      await prisma.warehouseStock.create({
        data: {
          warehouseId: warehouse.id,
          productId: product.id,
          quantity,
          reservedQuantity: 0,
          availableQuantity: quantity,
          minimumStock: 10,
          reorderLevel: 50,
          createdById: adminId,
        },
      });
    }
  }

  const stockMovements = await prisma.stockMovement.count();
  if (stockMovements === 0) {
    const stocks = await prisma.warehouseStock.findMany({
      where: { warehouseId: warehouse.id },
      take: 3,
    });

    for (const stock of stocks) {
      await prisma.stockMovement.create({
        data: {
          warehouseId: warehouse.id,
          productId: stock.productId,
          movementType: 'PURCHASE_RECEIPT',
          quantity: stock.quantity,
          unitCost: 100,
          notes: 'Initial stock receipt',
          createdById: adminId,
        },
      });
    }
  }

  const adjustments = await prisma.stockAdjustment.count();
  if (adjustments === 0) {
    const stock = await prisma.warehouseStock.findFirst({
      where: { warehouseId: warehouse.id },
    });

    if (stock) {
      const adjustment = await prisma.stockAdjustment.create({
        data: {
          warehouseId: warehouse.id,
          reason: 'Initial inventory count',
          status: 'APPROVED',
          approvedBy: adminId,
          approvedAt: new Date(),
          createdById: adminId,
          items: {
            create: {
              productId: stock.productId,
              systemQuantity: stock.quantity,
              actualQuantity: stock.quantity,
              difference: 0,
              reason: 'Verified during initial count',
              createdById: adminId,
            },
          },
        },
      });
      console.log(`Created stock adjustment: ${adjustment.id}`);
    }
  }

  console.log('Inventory data seeded.');
}

async function seedCompanyBranchWarehouse(adminId) {
  console.log('Seeding company, branch, warehouse data...');

  const existingCompany = await prisma.company.findFirst();
  if (existingCompany) {
    console.log('Company already exists. Skipping company/branch/warehouse seed.');
    return;
  }

  // Create region first
  let region = await prisma.region.findFirst({ where: { code: 'ADD' } });
  if (!region) {
    region = await prisma.region.create({
      data: {
        name: 'Addis Ababa',
        code: 'ADD',
        description: 'Capital city of Ethiopia',
        isActive: true,
        createdById: adminId,
      },
    });
    console.log(`Created region: ${region.name} (${region.id})`);
  }

  // Create company
  const company = await prisma.company.create({
    data: {
      name: 'Ethio Wholesale Distribution',
      legalName: 'Ethiopian Wholesale Distribution PLC',
      tradeLicenseNumber: 'TL-2024-001',
      tinNumber: 'TIN-0012345678',
      vatRegistrationNumber: 'VAT-0012345678',
      isVatRegistered: true,
      phone: '+251111234567',
      alternatePhone: '+251111234568',
      email: 'info@ethiowholesale.com',
      website: 'https://ethiowholesale.com',
      regionId: region.id,
      city: 'Addis Ababa',
      subCity: 'Bole',
      woreda: '03',
      kebele: '12',
      houseNumber: '1234',
      landmark: 'Near Bole International Airport',
      status: 'ACTIVE',
      createdById: adminId,
    },
  });
  console.log(`Created company: ${company.name} (${company.id})`);

  // Create branch
  const branch = await prisma.branch.create({
    data: {
      companyId: company.id,
      branchCode: 'BR-001',
      name: 'Addis Ababa Main Branch',
      isHeadOffice: true,
      phone: '+251111234567',
      email: 'addis@ethiowholesale.com',
      regionId: region.id,
      city: 'Addis Ababa',
      subCity: 'Bole',
      woreda: '03',
      kebele: '12',
      houseNumber: '1234',
      landmark: 'Near Bole International Airport',
      status: 'ACTIVE',
      createdById: adminId,
    },
  });
  console.log(`Created branch: ${branch.name} (${branch.id})`);

  // Create warehouse
  const warehouse = await prisma.warehouse.create({
    data: {
      code: 'WH-001',
      name: 'Bole Central Warehouse',
      branchId: branch.id,
      location: 'Bole Sub City, Addis Ababa',
      regionId: region.id,
      city: 'Addis Ababa',
      subCity: 'Bole',
      woreda: '03',
      kebele: '12',
      houseNumber: '5678',
      status: 'ACTIVE',
      createdById: adminId,
    },
  });
  console.log(`Created warehouse: ${warehouse.name} (${warehouse.id})`);

  // Create a second warehouse
  const warehouse2 = await prisma.warehouse.create({
    data: {
      code: 'WH-002',
      name: 'Megenagna Warehouse',
      branchId: branch.id,
      location: 'Megenagna Area, Addis Ababa',
      regionId: region.id,
      city: 'Addis Ababa',
      subCity: 'Kirkos',
      woreda: '05',
      kebele: '08',
      houseNumber: '9101',
      status: 'ACTIVE',
      createdById: adminId,
    },
  });
  console.log(`Created warehouse: ${warehouse2.name} (${warehouse2.id})`);

  console.log('Company, branch, warehouse data seeded.');
}

async function seedRolesAndUsers(adminId) {
  console.log('Seeding roles and test users...');

  // Get all permissions
  const allPermissions = await prisma.permission.findMany();
  const permissionMap = new Map(allPermissions.map((p) => [p.name, p]));

  // Create roles with their permissions
  for (const roleDef of ROLE_DEFINITIONS) {
    const role = await prisma.role.upsert({
      where: { name: roleDef.name },
      update: { description: roleDef.description },
      create: { name: roleDef.name, description: roleDef.description },
    });

    // Get permissions for this role
    const rolePermissions = roleDef.permissions
      .map((permName) => permissionMap.get(permName))
      .filter(Boolean);

    // Clear existing role permissions and add new ones
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

    for (const perm of rolePermissions) {
      await prisma.rolePermission.create({
        data: { roleId: role.id, permissionId: perm.id },
      });
    }

    console.log(`  Role ${roleDef.name}: ${rolePermissions.length} permissions`);
  }

  // Create test users
  const testUsers = [
    { username: 'minte', password: 'Minte@123', firstName: 'Minte', lastName: 'Worku', email: 'minte@ethiowholesale.com', role: 'INVENTORY_MANAGER' },
    { username: 'operator', password: 'Operator@123', firstName: 'Abebe', lastName: 'Kebede', email: 'abebe@ethiowholesale.com', role: 'WAREHOUSE_OPERATOR' },
    { username: 'auditor', password: 'Auditor@123', firstName: 'Sara', lastName: 'Mohamed', email: 'sara@ethiowholesale.com', role: 'STOCK_AUDITOR' },
    { username: 'sales', password: 'Sales@123', firstName: 'Dawit', lastName: 'Tadesse', email: 'dawit@ethiowholesale.com', role: 'SALES_REP' },
    { username: 'approver', password: 'Approver@123', firstName: 'Helen', lastName: 'Girma', email: 'helen@ethiowholesale.com', role: 'ADJUSTMENT_APPROVER' },
  ];

  for (const testUser of testUsers) {
    const existingUser = await prisma.user.findUnique({
      where: { username: testUser.username },
    });

    if (existingUser) {
      console.log(`  User ${testUser.username} already exists`);
      continue;
    }

    const passwordHash = await bcrypt.hash(testUser.password, 12);

    const person = await prisma.person.create({
      data: {
        firstName: testUser.firstName,
        lastName: testUser.lastName,
        email: testUser.email,
        status: 'ACTIVE',
        createdById: adminId,
      },
    });

    const user = await prisma.user.create({
      data: {
        personId: person.id,
        username: testUser.username,
        passwordHash,
        isActive: true,
        createdById: adminId,
      },
    });

    const role = await prisma.role.findUnique({ where: { name: testUser.role } });
    if (role) {
      await prisma.userRole.create({
        data: { userId: user.id, roleId: role.id },
      });
    }

    console.log(`  Created user: ${testUser.username} (${testUser.role})`);
  }

  console.log('Roles and test users seeded.');
}

async function ensureAdminPermissions(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { userRoles: { include: { role: true } } },
  });

  if (!user) return;

  const adminRole = await prisma.role.findUnique({
    where: { name: 'ADMIN' },
  });

  if (!adminRole) {
    console.log('ADMIN role not found');
    return;
  }

  const hasAdminRole = user.userRoles.some((ur) => ur.role.name === 'ADMIN');
  if (!hasAdminRole) {
    await prisma.userRole.create({
      data: {
        userId: user.id,
        roleId: adminRole.id,
      },
    });
    console.log(`Assigned ADMIN role to existing user: ${user.username}`);
  }

  // Upsert all permissions from ALL_PERMISSIONS list
  const createdPermissions = [];
  for (const perm of ALL_PERMISSIONS) {
    const p = await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
    createdPermissions.push(p);
  }

  const existingRolePermissions = await prisma.rolePermission.findMany({
    where: { roleId: adminRole.id },
  });

  const existingPermissionIds = new Set(existingRolePermissions.map((rp) => rp.permissionId));
  const missingPermissions = createdPermissions.filter((p) => !existingPermissionIds.has(p.id));

  for (const perm of missingPermissions) {
    await prisma.rolePermission.create({
      data: {
        roleId: adminRole.id,
        permissionId: perm.id,
      },
    });
  }

  if (missingPermissions.length > 0) {
    console.log(`Added ${missingPermissions.length} permissions to ADMIN role`);
  }
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

