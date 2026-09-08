import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcryptjs';

const connectionString = process.env.DATABASE_URL;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });

const SM_USERNAME = process.env.SALES_MANAGER_USERNAME || 'salesmanager';
const SM_EMAIL = process.env.SALES_MANAGER_EMAIL || 'salesmanager@wholesaledistribution.com';
const SM_PASSWORD = process.env.SALES_MANAGER_PASSWORD || 'Password@123';
const SM_FULL_NAME = 'Warehouse Sales Manager';
const TARGET_WAREHOUSE_CODE = 'WH-TEST-001';

async function main() {
  console.log('--- Seeding Sales Manager Role & User for Specific Warehouse ---');

  // 1. Ensure Target Warehouse exists
  let warehouse = await prisma.warehouse.findFirst({
    where: { OR: [{ code: TARGET_WAREHOUSE_CODE }, { name: 'Central Warehouse' }], isArchived: false },
  });

  if (!warehouse) {
    // If not found, find or create default region, company, branch
    let region = await prisma.region.findFirst({ where: { code: 'AA' } });
    if (!region) {
      region = await prisma.region.create({
        data: { code: 'AA', name: 'Addis Ababa', description: 'Capital Region', isActive: true },
      });
    }

    let branch = await prisma.branch.findFirst({ where: { isArchived: false } });
    if (!branch) {
      let company = await prisma.company.findFirst({ where: { isArchived: false } });
      if (!company) {
        company = await prisma.company.create({
          data: { name: 'Main Wholesale PLC', tradeLicenseNumber: 'TL-SM-001', regionId: region.id, status: 'ACTIVE' },
        });
      }
      branch = await prisma.branch.create({
        data: { branchCode: 'BR-SM-01', name: 'Main Distribution Branch', companyId: company.id, regionId: region.id, status: 'ACTIVE' },
      });
    }

    warehouse = await prisma.warehouse.create({
      data: {
        code: TARGET_WAREHOUSE_CODE,
        name: 'Central Warehouse',
        branchId: branch.id,
        regionId: region.id,
        status: 'ACTIVE',
      },
    });
    console.log(`Created warehouse: ${warehouse.name} (${warehouse.code})`);
  } else {
    console.log(`Using existing warehouse: ${warehouse.name} (${warehouse.code})`);
  }

  // 2. Ensure Permissions exist
  const salesManagerPermNames = [
    'products:create',
    'products:read',
    'products:update',
    'warehouse-selling-prices:create',
    'warehouse-selling-prices:read',
    'warehouse-selling-prices:update',
    'warehouses:read',
    'brands:read',
    'sales_orders:create',
    'sales_orders:read',
    'sales_orders:update',
    'customers:read',
    'customers:create',
    'REPORT_VIEW_DASHBOARD',
    'REPORT_VIEW_SALES',
    'REPORT_VIEW_PRODUCTS',
    'REPORT_VIEW_WAREHOUSE',
    'inventory:transfers:read',
    'inventory:transfers:create',
    'inventory:transfers:approve',
    'inventory:adjustments:read',
    'inventory:adjustments:create',
    'inventory:adjustments:approve',
    'inventory:reservations:read',
    'inventory:reservations:create',
    'inventory:reservations:approve',
    'inventory:reservations:release',
  ];

  for (const permName of salesManagerPermNames) {
    await prisma.permission.upsert({
      where: { name: permName },
      update: {},
      create: {
        name: permName,
        module: permName.split(':')[0] || 'general',
        action: permName.split(':')[1] || 'access',
        description: `Permission ${permName}`,
      },
    });
  }

  // 3. Upsert SALES_MANAGER Role
  const salesManagerRole = await prisma.role.upsert({
    where: { name: 'SALES_MANAGER' },
    update: { description: 'Sales Manager for warehouse product catalog and pricing' },
    create: {
      name: 'SALES_MANAGER',
      description: 'Sales Manager for warehouse product catalog and pricing',
    },
  });
  console.log(`Role ready: ${salesManagerRole.name} (${salesManagerRole.id})`);

  // Explicitly remove read permissions for Unit, Category, and Company from SALES_MANAGER role
  const revokedPerms = await prisma.permission.findMany({
    where: { name: { in: ['categories:read', 'units:read', 'companies:read'] } },
  });
  if (revokedPerms.length > 0) {
    await prisma.rolePermission.deleteMany({
      where: {
        roleId: salesManagerRole.id,
        permissionId: { in: revokedPerms.map((p) => p.id) },
      },
    });
  }

  // Assign permissions to SALES_MANAGER role
  const permissionsToAssign = await prisma.permission.findMany({
    where: { name: { in: salesManagerPermNames } },
  });

  for (const perm of permissionsToAssign) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: salesManagerRole.id, permissionId: perm.id } },
      update: { isArchived: false },
      create: { roleId: salesManagerRole.id, permissionId: perm.id },
    });
  }
  console.log(`Assigned ${permissionsToAssign.length} permissions to SALES_MANAGER role.`);

  // 4. Ensure ADMIN & SUPER_ADMIN roles have ALL permissions (making it possible for admins too)
  const adminRole = await prisma.role.upsert({
    where: { name: 'ADMIN' },
    update: { description: 'System Administrator with full access' },
    create: { name: 'ADMIN', description: 'System Administrator with full access' },
  });

  const allSystemPermissions = await prisma.permission.findMany();
  for (const perm of allSystemPermissions) {
    await prisma.rolePermission.upsert({
      where: { roleId_permissionId: { roleId: adminRole.id, permissionId: perm.id } },
      update: { isArchived: false },
      create: { roleId: adminRole.id, permissionId: perm.id },
    });
  }
  console.log(`Assigned ALL ${allSystemPermissions.length} permissions to ADMIN role.`);

  // 5. Create Person & Employee for Sales Manager
  let person = await prisma.person.findFirst({
    where: { email: SM_EMAIL },
  });

  if (!person) {
    person = await prisma.person.create({
      data: {
        firstName: 'Warehouse',
        lastName: 'SalesManager',
        email: SM_EMAIL,
        phone: '+251 91 122 3344',
        status: 'ACTIVE',
      },
    });
    console.log(`Created person: ${person.firstName} ${person.lastName} (${person.id})`);
  }

  let employee = await prisma.employee.findFirst({
    where: { personId: person.id },
  });

  if (!employee) {
    employee = await prisma.employee.create({
      data: {
        personId: person.id,
        employeeCode: 'EMP-SM-001',
        hireDate: new Date(),
        department: 'Sales',
        status: 'ACTIVE',
      },
    });
    console.log(`Created employee: ${employee.employeeCode} (${employee.id})`);
  }

  // Link employee as the manager of the specific warehouse
  await prisma.warehouse.update({
    where: { id: warehouse.id },
    data: { managerId: employee.id },
  });
  console.log(`Assigned employee ${employee.employeeCode} as manager of warehouse: ${warehouse.name}`);

  // 6. Create or Update User for Sales Manager
  const passwordHash = await bcrypt.hash(SM_PASSWORD, 12);
  let user = await prisma.user.findFirst({
    where: { OR: [{ username: SM_USERNAME }, { personId: person.id }] },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        personId: person.id,
        username: SM_USERNAME,
        passwordHash,
        isActive: true,
        accountStatus: 'ACTIVE',
        invitationAcceptedAt: new Date(),
      },
    });
    console.log(`Created user: ${user.username} (${user.id})`);
  } else {
    user = await prisma.user.update({
      where: { id: user.id },
      data: {
        personId: person.id,
        passwordHash,
        isActive: true,
        accountStatus: 'ACTIVE',
      },
    });
    console.log(`Updated user: ${user.username} (${user.id})`);
  }

  // Assign SALES_MANAGER role to user
  await prisma.userRole.upsert({
    where: { userId_roleId: { userId: user.id, roleId: salesManagerRole.id } },
    update: { isArchived: false },
    create: { userId: user.id, roleId: salesManagerRole.id },
  });
  console.log(`Assigned SALES_MANAGER role to user: ${user.username}`);

  console.log('\n--- SUCCESS! Sales Manager Seeding Complete ---');
  console.log(`Username: ${SM_USERNAME}`);
  console.log(`Password: ${SM_PASSWORD}`);
  console.log(`Assigned Warehouse: ${warehouse.name} (${warehouse.code})`);
  console.log(`Role: ${salesManagerRole.name}`);
  console.log(`Permissions: can add/update products, warehouse prices, and view catalog`);
  console.log(`ADMIN role: has all ${allSystemPermissions.length} permissions including warehouse & product add.`);
}

main()
  .catch((err) => {
    console.error('Seeding error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
